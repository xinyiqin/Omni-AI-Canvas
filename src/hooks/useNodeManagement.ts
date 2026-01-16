import { useCallback, useRef } from 'react';
import { WorkflowState, WorkflowNode, ToolDefinition, DataType, Port, NodeStatus } from '../../types';
import { TOOLS } from '../../constants';
import { useTranslation, Language } from '../i18n/useTranslation';

interface UseNodeManagementProps {
  workflow: WorkflowState | null;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowState | null>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedRunId: string | null;
  setValidationErrors: (errors: { message: string; type: 'ENV' | 'INPUT' }[]) => void;
  setActiveOutputs: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  canvasRef: React.RefObject<HTMLDivElement>;
  screenToWorldCoords: (x: number, y: number) => { x: number; y: number };
  view: { x: number; y: number; zoom: number };
  getNodeOutputs: (node: WorkflowNode) => Port[];
  lang: Language;
}

export const useNodeManagement = ({
  workflow,
  setWorkflow,
  selectedNodeId,
  setSelectedNodeId,
  selectedRunId,
  setValidationErrors,
  setActiveOutputs,
  canvasRef,
  screenToWorldCoords,
  view,
  getNodeOutputs,
  lang
}: UseNodeManagementProps) => {
  const { t } = useTranslation(lang);

  const addNode = useCallback((tool: ToolDefinition, x?: number, y?: number, dataOverride?: Record<string, any>) => {
    if (selectedRunId) return null;
    const defaultData: Record<string, any> = { ...dataOverride };
    if (tool.models && tool.models.length > 0 && !defaultData.model) defaultData.model = tool.models[0].id;
    if ((tool.id === 'text-to-image' || tool.id === 'image-to-image') && !defaultData.aspectRatio) defaultData.aspectRatio = "1:1";
    if (tool.id.includes('video-gen') && !defaultData.aspectRatio) defaultData.aspectRatio = "16:9";
    if (tool.id === 'tts') {
      if (!defaultData.model) {
        defaultData.model = 'lightx2v';
      }
      if (defaultData.model === 'lightx2v' || defaultData.model?.startsWith('lightx2v')) {
        if (!defaultData.voiceType) defaultData.voiceType = 'zh_female_vv_uranus_bigtts';
        if (!defaultData.emotionScale) defaultData.emotionScale = 3;
        if (!defaultData.speechRate) defaultData.speechRate = 0;
        if (!defaultData.pitch) defaultData.pitch = 0;
        if (!defaultData.loudnessRate) defaultData.loudnessRate = 0;
        if (!defaultData.resourceId) {
          defaultData.resourceId = "";
        }
      } else {
        if (!defaultData.voice) defaultData.voice = "Kore";
      }
    }
    if (tool.id === 'lightx2v-voice-clone') {
      if (!defaultData.style) defaultData.style = "正常";
      if (!defaultData.speed) defaultData.speed = 1.0;
      if (!defaultData.volume) defaultData.volume = 0;
      if (!defaultData.pitch) defaultData.pitch = 0;
      if (!defaultData.language) defaultData.language = "ZH_CN";
    }
    if (tool.id === 'gemini-text') {
      if (!defaultData.model) {
        defaultData.model = 'deepseek-v3-2-251201';
      }
      if (!defaultData.mode) defaultData.mode = 'basic';
      if (!defaultData.customOutputs) defaultData.customOutputs = [{ id: 'out-text', label: t('execution_results'), description: 'Main text response.' }];
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    const worldPos = x !== undefined && y !== undefined ? { x, y } : screenToWorldCoords((rect?.width || 800) / 2, (rect?.height || 600) / 2);
    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNode: WorkflowNode = { id: newNodeId, toolId: tool.id, x: worldPos.x, y: worldPos.y, status: NodeStatus.IDLE, data: defaultData };
    setWorkflow(prev => prev ? ({ ...prev, nodes: [...prev.nodes, newNode], isDirty: true }) : null);
    setSelectedNodeId(newNodeId);
    return newNode;
  }, [screenToWorldCoords, selectedRunId, t, canvasRef, setWorkflow, setSelectedNodeId]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!nodeId) return;
    if (selectedRunId) return;
    setWorkflow(prev => prev ? ({ 
      ...prev, 
      nodes: prev.nodes.filter(n => n.id !== nodeId), 
      connections: prev.connections.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId), 
      isDirty: true 
    }) : null);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, selectedRunId, setWorkflow, setSelectedNodeId]);

  const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
    if (selectedRunId) return;
    setValidationErrors([]);
    
    setWorkflow(prev => {
      if (!prev) return null;
      const targetNode = prev.nodes.find(n => n.id === nodeId);
      const tool = targetNode ? TOOLS.find(t => t.id === targetNode.toolId) : null;
      
      if (tool?.category === 'Input' && key === 'value') {
        setActiveOutputs(ao => {
          const next = { ...ao };
          delete next[nodeId];
          return next;
        });
      }

      return { 
        ...prev, 
        nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status: NodeStatus.IDLE, data: { ...n.data, [key]: value } } : n), 
        isDirty: true 
      };
    });
  }, [selectedRunId, setValidationErrors, setWorkflow, setActiveOutputs]);

  const getReplaceableTools = useCallback((nodeId: string): ToolDefinition[] => {
    if (!workflow) return [];
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    const currentNodeOutputs = getNodeOutputs(node);
    const outputTypes = currentNodeOutputs.map(o => o.type);
    const outputCount = currentNodeOutputs.length;
    
    return TOOLS.filter(tool => {
      if (tool.id === node.toolId) return false;
      
      if (tool.id === 'gemini-text') {
        if (node.toolId === 'gemini-text') {
          return true;
        }
        return true;
      }
      
      if (node.toolId === 'gemini-text') {
        if (tool.outputs.length !== outputCount) return false;
        return tool.outputs.every((out, idx) => out.type === outputTypes[idx]);
      }
      
      if (tool.outputs.length !== outputCount) return false;
      return tool.outputs.every((out, idx) => out.type === outputTypes[idx]);
    });
  }, [workflow, getNodeOutputs]);

  const replaceNode = useCallback((nodeId: string, newToolId: string) => {
    if (!workflow) return;
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newTool = TOOLS.find(t => t.id === newToolId);
    if (!newTool) return;
    
    const currentNodeOutputs = getNodeOutputs(node);
    const newToolOutputs = newTool.outputs;
    
    // Validate compatibility
    if (node.toolId !== 'gemini-text' && newTool.id !== 'gemini-text') {
      if (currentNodeOutputs.length !== newToolOutputs.length) {
        console.warn('Output count mismatch');
        return;
      }
      const compatible = currentNodeOutputs.every((out, idx) => out.type === newToolOutputs[idx].type);
      if (!compatible) {
        console.warn('Output types mismatch');
        return;
      }
    }
    
    // Preserve node position and data where applicable
    const preservedData: Record<string, any> = {};
    if (newTool.models && newTool.models.length > 0) {
      preservedData.model = node.data.model || newTool.models[0].id;
    }
    
    // Preserve customOutputs for gemini-text
    if (newTool.id === 'gemini-text' && node.toolId === 'gemini-text') {
      preservedData.customOutputs = node.data.customOutputs;
      preservedData.mode = node.data.mode || 'basic';
    }
    
    // Preserve aspectRatio for image/video tools
    if ((newTool.id === 'text-to-image' || newTool.id === 'image-to-image' || newTool.id.includes('video-gen')) && 
        (node.toolId === 'text-to-image' || node.toolId === 'image-to-image' || node.toolId.includes('video-gen'))) {
      preservedData.aspectRatio = node.data.aspectRatio;
    }
    
    setWorkflow(prev => prev ? ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, toolId: newToolId, data: { ...n.data, ...preservedData } } : n),
      isDirty: true
    }) : null);
  }, [workflow, getNodeOutputs, setWorkflow]);

  const quickAddInput = useCallback((node: WorkflowNode, port: Port) => {
    if (selectedRunId) return;
    const toolIdMap: Record<DataType, string> = { 
      [DataType.TEXT]: 'text-prompt', 
      [DataType.IMAGE]: 'image-input', 
      [DataType.AUDIO]: 'audio-input', 
      [DataType.VIDEO]: 'video-input' 
    };
    const tool = TOOLS.find(t => t.id === toolIdMap[port.type]);
    if (!tool) return;
    
    const worldPos = { x: node.x - 300, y: node.y };
    const newNodeId = `node-source-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    const defaultData: Record<string, any> = {};
    if (tool.models && tool.models.length > 0) defaultData.model = tool.models[0].id;
    if (tool.id === 'text-prompt') defaultData.value = "";
    
    const newNode: WorkflowNode = { 
      id: newNodeId, 
      toolId: tool.id, 
      x: worldPos.x, 
      y: worldPos.y, 
      status: NodeStatus.IDLE, 
      data: defaultData 
    };

    const newConn = { 
      id: `conn-${Date.now()}`, 
      sourceNodeId: newNodeId, 
      sourcePortId: tool.outputs[0].id, 
      targetNodeId: node.id, 
      targetPortId: port.id 
    };

    setWorkflow(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        nodes: [...prev.nodes, newNode],
        connections: [...prev.connections, newConn], 
        isDirty: true 
      };
    });
    setSelectedNodeId(newNodeId);
  }, [selectedRunId, setWorkflow, setSelectedNodeId]);

  const quickAddOutput = useCallback((node: WorkflowNode, port: Port, toolId: string) => {
    if (selectedRunId) return;
    const targetTool = TOOLS.find(t => t.id === toolId);
    if (!targetTool) return;
    
    const matchingInput = targetTool.inputs.find(input => input.type === port.type);
    if (!matchingInput) return;
    
    const worldPos = { x: node.x + 300, y: node.y };
    const newNodeId = `node-target-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    const defaultData: Record<string, any> = {};
    if (targetTool.models && targetTool.models.length > 0) defaultData.model = targetTool.models[0].id;
    if (targetTool.id === 'gemini-text') {
      defaultData.customOutputs = [{ id: 'out-text', label: t('execution_results'), description: 'Main text response.' }];
      defaultData.mode = 'basic';
    }
    
    const newNode: WorkflowNode = { 
      id: newNodeId, 
      toolId: targetTool.id, 
      x: worldPos.x, 
      y: worldPos.y, 
      status: NodeStatus.IDLE, 
      data: defaultData 
    };

    const newConn = { 
      id: `conn-${Date.now()}`, 
      sourceNodeId: node.id, 
      sourcePortId: port.id, 
      targetNodeId: newNodeId, 
      targetPortId: matchingInput.id 
    };

    setWorkflow(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        nodes: [...prev.nodes, newNode],
        connections: [...prev.connections, newConn], 
        isDirty: true 
      };
    });
    setSelectedNodeId(newNodeId);
  }, [selectedRunId, t, setWorkflow, setSelectedNodeId]);

  const pinOutputToCanvas = useCallback((value: any, type: DataType) => {
    const toolIdMap: Record<DataType, string> = { 
      [DataType.TEXT]: 'text-prompt', 
      [DataType.IMAGE]: 'image-input', 
      [DataType.AUDIO]: 'audio-input', 
      [DataType.VIDEO]: 'video-input' 
    };
    const tool = TOOLS.find(t => t.id === toolIdMap[type]);
    if (tool) addNode(tool, 100, 100, { value });
  }, [addNode]);

  return {
    addNode,
    deleteNode,
    updateNodeData,
    getReplaceableTools,
    replaceNode,
    quickAddInput,
    quickAddOutput,
    pinOutputToCanvas
  };
};


