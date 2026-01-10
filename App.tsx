
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Play, Save, Trash2, Search, Settings, 
  Layers, ChevronRight, AlertCircle, CheckCircle2,
  X, Type, Image as ImageIcon, Volume2, Video as VideoIcon, 
  Cpu, Sparkles, AlignLeft, Download, RefreshCw,
  Terminal, MousePointer2, Wand2, Globe, Palette, Clapperboard, UserCircle, UserCog,
  Maximize, ZoomIn, ZoomOut, Zap, MessageSquare, PenTool, FileText, Star, Edit3, Boxes,
  Camera, Mic, Wand, ListPlus, Hash, Info, PlayCircle, FastForward, ArrowUpRight,
  Target, Activity, History, Clock, Maximize2, DownloadCloud, BookOpen, ChevronLeft,
  Calendar, LayoutGrid, Sparkle, ToggleLeft, ToggleRight, Timer, PlayCircle as PlayIcon,
  Key, Globe2, Upload, Languages, ShieldCheck, TriangleAlert, SaveAll
} from 'lucide-react';
import { TOOLS } from './constants';
import { 
  WorkflowNode, Connection, WorkflowState, 
  NodeStatus, DataType, Port, ToolDefinition, GenerationRun
} from './types';
import { geminiText, geminiImage, geminiSpeech, geminiVideo, lightX2VTask, lightX2VTTS } from './services/geminiService';

// --- Localization ---

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    app_name: 'OmniFlow',
    app_subtitle: 'Multi-Modal Lab',
    create_workflow: 'Create Workflow',
    my_workflows: 'My Workflows',
    preset_library: 'Preset Library',
    no_workflows: 'No Workflows Saved',
    system_preset: 'System Preset',
    editing_logic: 'Editing Logic',
    save_flow: 'Save Flow',
    run_fabric: 'Run Fabric',
    executing: 'Executing...',
    snapshot_view: 'Snapshot View',
    run_time: 'Run Time',
    tool_palette: 'Tool Palette',
    settings: 'Settings',
    select_model: 'Select Model',
    structured_outputs: 'Structured Outputs',
    add_output: 'Add Output',
    execution_results: 'Execution Results',
    show_intermediate: 'Show Intermediate Nodes',
    inspect_result: 'Inspect Result',
    inspect: 'Inspect',
    download: 'Download',
    remove_audio: 'Remove Audio',
    remove_video: 'Remove Video',
    upload_audio: 'Upload Audio File',
    upload_video: 'Upload Video File',
    quick_add_source: 'Quick add source',
    run_this_only: 'Run This Only',
    run_from_here: 'Run From Here',
    global_inputs: 'Global Inputs',
    all_inputs_automated: 'All inputs are automated.',
    execution_error: 'Execution Error',
    execution_failed: 'Execution Failed',
    awaiting_execution: 'Awaiting execution',
    aspect_ratio: 'Aspect Ratio',
    voice: 'Voice',
    mode: 'Execution Mode',
    portrait_prompt: 'Portrait Prompt',
    speech_script: 'Speech Script',
    tone_instruction: 'Tone Instruction',
    untitled: 'Untitled Workflow',
    confirm_delete: 'Delete this flow?',
    lang_name: 'English',
    env_vars: 'Env Variables',
    api_endpoint: 'API Endpoint',
    access_token: 'Access Token',
    validation_failed: 'Input Validation Failed',
    missing_inputs_msg: 'The following required inputs are missing:',
    missing_env_msg: 'LightX2V Environment settings (URL/Token) are missing.',
    fix_validation: 'Please fix these issues before running.',
    edit_mode: 'Edit Mode',
    save_changes: 'Save Changes',
    manual_edit_hint: 'Directly modify the generated content below. Changes will be used by connected nodes.'
  },
  zh: {
    app_name: 'OmniFlow',
    app_subtitle: '多模态实验室',
    create_workflow: '新建工作流',
    my_workflows: '我的工作流',
    preset_library: '预设库',
    no_workflows: '暂无保存的工作流',
    system_preset: '系统预设',
    editing_logic: '逻辑编辑',
    save_flow: '保存工作流',
    run_fabric: '运行画板',
    executing: '正在运行...',
    snapshot_view: '快照预览',
    run_time: '运行时长',
    tool_palette: '工具箱',
    settings: '节点设置',
    select_model: '选择模型',
    structured_outputs: '结构化输出',
    add_output: '添加输出字段',
    execution_results: '运行结果',
    show_intermediate: '显示中间节点',
    inspect_result: '查看结果',
    inspect: '查看',
    download: '下载',
    remove_audio: '删除音频',
    remove_video: '删除视频',
    upload_audio: '上传音频文件',
    upload_video: '上传视频文件',
    quick_add_source: '快速添加输入源',
    run_this_only: '仅运行此节点',
    run_from_here: '从此开始运行',
    global_inputs: '全局输入参数',
    all_inputs_automated: '所有输入已自动关联。',
    execution_error: '执行错误',
    execution_failed: '执行失败',
    awaiting_execution: '等待运行...',
    aspect_ratio: '纵横比',
    voice: '音色',
    mode: '执行模式',
    portrait_prompt: '人像提示词',
    speech_script: '播报文案',
    tone_instruction: '语调指令',
    untitled: '未命名工作流',
    confirm_delete: '确定删除该工作流吗？',
    lang_name: '中文',
    env_vars: '环境变量',
    api_endpoint: 'API 地址',
    access_token: '访问密钥',
    validation_failed: '输入校验未通过',
    missing_inputs_msg: '以下必需的输入项缺失：',
    missing_env_msg: 'LightX2V 环境配置（地址/密钥）未填写。',
    fix_validation: '请在运行前修复这些问题。',
    edit_mode: '编辑模式',
    save_changes: '保存修改',
    manual_edit_hint: '直接修改下方生成的内容，修改后的内容将被后续节点使用。'
  }
};

// --- Helper Utilities ---

const pcmToWavUrl = (base64Pcm: string, sampleRate = 24000) => {
  try {
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 32 + len, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, len, true);
    const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    return "";
  }
};

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = { 
    Type, ImageIcon, Volume2, Video: VideoIcon, Cpu, Sparkles, 
    AlignLeft, Globe, Palette, Clapperboard, UserCircle, UserCog, FastForward 
  };
  return icons[iconName] || Cpu;
};

const formatTime = (ms?: number) => {
  if (ms === undefined) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const downloadFile = (content: string, fileName: string, type: DataType) => {
  const link = document.createElement('a');
  if (type === DataType.TEXT) {
    const contentString = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
    const blob = new Blob([contentString], { type: 'text/plain' });
    link.href = URL.createObjectURL(blob);
  } else {
    link.href = content;
  }
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Presets Data ---

const PRESET_WORKFLOWS: WorkflowState[] = [
  {
    id: 'preset-morph',
    name: 'Cinematic Morphing Video',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "https://x2v.light-ai.top",
      lightx2v_token: ""
    },
    globalInputs: {},
    history: [],
    showIntermediateResults: true,
    connections: [
      { id: 'c1', sourceNodeId: 'node-input', sourcePortId: 'out-text', targetNodeId: 'node-planner', targetPortId: 'in-text' },
      { id: 'c2', sourceNodeId: 'node-planner', sourcePortId: 'start_img_prompt', targetNodeId: 'node-start-frame', targetPortId: 'in-text' },
      { id: 'c3', sourceNodeId: 'node-start-frame', sourcePortId: 'out-image', targetNodeId: 'node-end-frame', targetPortId: 'in-image' },
      { id: 'c4', sourceNodeId: 'node-planner', sourcePortId: 'end_img_prompt', targetNodeId: 'node-end-frame', targetPortId: 'in-text' },
      { id: 'c5', sourceNodeId: 'node-start-frame', sourcePortId: 'out-image', targetNodeId: 'node-video', targetPortId: 'in-image-start' },
      { id: 'c6', sourceNodeId: 'node-end-frame', sourcePortId: 'out-image', targetNodeId: 'node-video', targetPortId: 'in-image-end' },
      { id: 'c7', sourceNodeId: 'node-planner', sourcePortId: 'video_motion_prompt', targetNodeId: 'node-video', targetPortId: 'in-text' }
    ],
    nodes: [
      { id: 'node-input', toolId: 'text-prompt', x: 50, y: 300, status: NodeStatus.IDLE, data: { value: "A futuristic cyberpunk city transitioning from day to rainy night." } },
      { id: 'node-planner', toolId: 'gemini-text', x: 350, y: 300, status: NodeStatus.IDLE, data: { 
          model: 'gemini-3-pro-preview',
          mode: 'basic',
          customOutputs: [
            { id: 'start_img_prompt', label: 'Start Frame Prompt', description: 'Detailed prompt for the initial image.' },
            { id: 'end_img_prompt', label: 'End Frame Prompt', description: 'Detailed prompt for the target image, based on the start.' },
            { id: 'video_motion_prompt', label: 'Motion Prompt', description: 'Prompt describing the transition and camera motion.' }
          ]
      } },
      { id: 'node-start-frame', toolId: 'text-to-image', x: 700, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-2512', aspectRatio: "16:9" } },
      { id: 'node-end-frame', toolId: 'image-to-image', x: 700, y: 550, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511' } },
      { id: 'node-video', toolId: 'video-gen-dual-frame', x: 1050, y: 300, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: "16:9" } }
    ]
  },
  {
    id: 'preset-ceo',
    name: 'CEO Teaching Narrative',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "https://x2v.light-ai.top",
      lightx2v_token: ""
    },
    globalInputs: {
      'node-avatar-in-text': "根据音频生成对应视频"
    },
    history: [],
    showIntermediateResults: false,
    connections: [
      { id: 'c1', sourceNodeId: 'node-prompt', sourcePortId: 'out-text', targetNodeId: 'node-chat', targetPortId: 'in-text' },
      { id: 'c2', sourceNodeId: 'node-chat', sourcePortId: 'image_prompt', targetNodeId: 'node-image', targetPortId: 'in-text' },
      { id: 'c3', sourceNodeId: 'node-chat', sourcePortId: 'speech_text', targetNodeId: 'node-tts', targetPortId: 'in-text' },
      { id: 'c4', sourceNodeId: 'node-chat', sourcePortId: 'tone', targetNodeId: 'node-tts', targetPortId: 'in-tone' },
      { id: 'c5', sourceNodeId: 'node-image', sourcePortId: 'out-image', targetNodeId: 'node-avatar', targetPortId: 'in-image' },
      { id: 'c6', sourceNodeId: 'node-tts', sourcePortId: 'out-audio', targetNodeId: 'node-avatar', targetPortId: 'in-audio' }
    ],
    nodes: [
      { id: 'node-prompt', toolId: 'text-prompt', x: 100, y: 200, status: NodeStatus.IDLE, data: { value: "A man teach me not to sleep late in an overbearing CEO style." } },
      { id: 'node-chat', toolId: 'gemini-text', x: 450, y: 200, status: NodeStatus.IDLE, data: { 
          model: 'gemini-3-pro-preview',
          mode: 'basic',
          customOutputs: [
            { id: 'speech_text', label: 'Speech Script', description: 'The text the CEO says to the listener.' },
            { id: 'tone', label: 'Tone Instruction', description: 'Cues for speech style (e.g. commanding, deep, protective).' },
            { id: 'image_prompt', label: 'Portrait Prompt', description: 'Description of the overbearing CEO for an image generator.' }
          ]
      } },
      { id: 'node-image', toolId: 'text-to-image', x: 850, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-2512', aspectRatio: "9:16" } },
      { id: 'node-tts', toolId: 'gemini-tts', x: 850, y: 350, status: NodeStatus.IDLE, data: { model: 'gemini-2.5-flash-preview-tts', voice: "Fenrir" } },
      { id: 'node-avatar', toolId: 'avatar-gen', x: 1250, y: 200, status: NodeStatus.IDLE, data: {} }
    ]
  },
  {
    id: 'preset-avatar-i2i',
    name: 'Coffee Shop Lifestyle Avatar',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "https://x2v.light-ai.top",
      lightx2v_token: ""
    },
    globalInputs: {},
    history: [],
    showIntermediateResults: true,
    connections: [
      { id: 'c1', sourceNodeId: 'node-img-in', sourcePortId: 'out-image', targetNodeId: 'node-i2i-gen', targetPortId: 'in-image' },
      { id: 'c2', sourceNodeId: 'node-text-in', sourcePortId: 'out-text', targetNodeId: 'node-logic', targetPortId: 'in-text' },
      { id: 'c3', sourceNodeId: 'node-logic', sourcePortId: 'i2i_prompt', targetNodeId: 'node-i2i-gen', targetPortId: 'in-text' },
      { id: 'c4', sourceNodeId: 'node-logic', sourcePortId: 'tts_text', targetNodeId: 'node-voice', targetPortId: 'in-text' },
      { id: 'c5', sourceNodeId: 'node-logic', sourcePortId: 'voice_style', targetNodeId: 'node-voice', targetPortId: 'in-tone' },
      { id: 'c6', sourceNodeId: 'node-i2i-gen', sourcePortId: 'out-image', targetNodeId: 'node-final-avatar', targetPortId: 'in-image' },
      { id: 'c7', sourceNodeId: 'node-voice', sourcePortId: 'out-audio', targetNodeId: 'node-final-avatar', targetPortId: 'in-audio' }
    ],
    nodes: [
      { id: 'node-img-in', toolId: 'image-input', x: 50, y: 50, status: NodeStatus.IDLE, data: { value: [] } },
      { id: 'node-text-in', toolId: 'text-prompt', x: 50, y: 350, status: NodeStatus.IDLE, data: { value: "A cheerful young lifestyle blogger, sharing a secret tip about the best morning routine in a sun-drenched minimalist coffee shop." } },
      { id: 'node-logic', toolId: 'gemini-text', x: 400, y: 350, status: NodeStatus.IDLE, data: { 
          model: 'gemini-3-pro-preview',
          mode: 'custom',
          customInstruction: "You are a social media creative director. Your goal is to generate perfectly synchronized components for a digital avatar video. Ensure the image description matches the energy of the script, and the voice style captures the specific mood of the location and message.",
          customOutputs: [
            { id: 'i2i_prompt', label: 'Scene Edit Prompt', description: 'Modification prompt. Describe the character from the input image sitting in the specific coffee shop mentioned. Mention facial expression and posture that matches the script content.' },
            { id: 'tts_text', label: 'Avatar Script', description: 'A 20-30 second spoken script. It should sound like a casual, intimate secret shared with a close friend.' },
            { id: 'voice_style', label: 'Tone', description: 'Specific instructions for voice acting. Should start with a soft whispery secret tone and move to warm enthusiasm.' }
          ]
      } },
      { id: 'node-i2i-gen', toolId: 'image-to-image', x: 800, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-voice', toolId: 'gemini-tts', x: 800, y: 450, status: NodeStatus.IDLE, data: { model: 'gemini-2.5-flash-preview-tts', voice: "Zephyr" } },
      { id: 'node-final-avatar', toolId: 'avatar-gen', x: 1200, y: 250, status: NodeStatus.IDLE, data: {} }
    ]
  }
];

// --- Main App ---

const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'zh'>(() => {
    const saved = localStorage.getItem('omniflow_lang');
    return (saved as any) || 'en';
  });
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'EDITOR'>('DASHBOARD');
  const [myWorkflows, setMyWorkflows] = useState<WorkflowState[]>([]);
  const [activeTab, setActiveTab] = useState<'MY' | 'PRESET'>('MY');
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedOutput, setExpandedOutput] = useState<{ nodeId: string; fieldId?: string } | null>(null);
  const [activeOutputs, setActiveOutputs] = useState<Record<string, any>>({});
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; portId: string; type: DataType; direction: 'in' | 'out'; startX: number; startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ticker, setTicker] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{ message: string; type: 'ENV' | 'INPUT' }[]>([]);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [tempEditValue, setTempEditValue] = useState("");
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const t = useCallback((key: string) => {
    return TRANSLATIONS[lang][key] || key;
  }, [lang]);

  const toggleLang = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    setLang(next);
    localStorage.setItem('omniflow_lang', next);
  };

  useEffect(() => {
    const saved = localStorage.getItem('omniflow_user_data');
    if (saved) try { setMyWorkflows(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    let interval: any;
    if (workflow?.isRunning) {
      interval = setInterval(() => setTicker(t => t + 1), 100);
    }
    return () => clearInterval(interval);
  }, [workflow?.isRunning]);

  const saveWorkflowToLocal = useCallback((current: WorkflowState) => {
    const updated = { ...current, updatedAt: Date.now(), isDirty: false };
    setMyWorkflows(prev => {
      const next = prev.find(w => w.id === updated.id) ? prev.map(w => w.id === updated.id ? updated : w) : [updated, ...prev];
      localStorage.setItem('omniflow_user_data', JSON.stringify(next));
      return next;
    });
    setWorkflow(updated);
  }, []);

  const deleteWorkflow = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('confirm_delete'))) return;
    setMyWorkflows(prev => {
      const next = prev.filter(w => w.id !== id);
      localStorage.setItem('omniflow_user_data', JSON.stringify(next));
      return next;
    });
  }, [t]);

  const openWorkflow = (w: WorkflowState) => {
    setSelectedRunId(null);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setValidationErrors([]);
    setActiveOutputs({});
    setWorkflow({ ...w, isDirty: false, isRunning: false, env: w.env || { lightx2v_url: 'https://x2v.light-ai.top', lightx2v_token: '' } });
    setCurrentView('EDITOR');
  };

  const createNewWorkflow = () => {
    setSelectedRunId(null);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setValidationErrors([]);
    setActiveOutputs({});
    
    const newFlow: WorkflowState = {
      id: `flow-${Date.now()}`,
      name: t('untitled'),
      nodes: [],
      connections: [],
      isDirty: true,
      isRunning: false,
      globalInputs: {},
      env: {
        lightx2v_url: "https://x2v.light-ai.top",
        lightx2v_token: ""
      },
      history: [],
      updatedAt: Date.now(),
      showIntermediateResults: true
    };
    setWorkflow(newFlow);
    setCurrentView('EDITOR');
  };

  const selectedNode = useMemo(() => workflow?.nodes.find(n => n.id === selectedNodeId), [workflow, selectedNodeId]);

  const expandedResultData = useMemo(() => {
    if (!expandedOutput || !workflow) return null;
    const run = selectedRunId ? workflow.history.find(r => r.id === selectedRunId) : null;
    const outputs = run ? run.outputs : activeOutputs;
    const nodes = run ? run.nodesSnapshot : workflow.nodes;
    const node = nodes.find(n => n.id === expandedOutput.nodeId);
    if (!node) return null;
    const tool = TOOLS.find(t => t.id === node.toolId);
    let content = outputs[node.id];
    
    if (!content && tool?.category === 'Input') {
      content = node.data.value;
    }

    let label = (lang === 'zh' ? tool?.name_zh : tool?.name) || "Output";
    let type = tool?.outputs[0]?.type || DataType.TEXT;
    if (expandedOutput.fieldId && content && typeof content === 'object') {
      content = content[expandedOutput.fieldId];
      label = expandedOutput.fieldId;
    }
    return { content, label, type, nodeId: node.id, originalOutput: outputs[node.id] };
  }, [expandedOutput, selectedRunId, workflow, activeOutputs, lang]);

  const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
    if (selectedRunId) setSelectedRunId(null);
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
  }, [selectedRunId]);

  const handleManualResultEdit = () => {
    if (!expandedResultData || !expandedOutput) return;
    
    let finalValue: any = tempEditValue;
    
    // Try to parse JSON if editing the entire object and it looks like JSON
    if (!expandedOutput.fieldId && (tempEditValue.trim().startsWith('{') || tempEditValue.trim().startsWith('['))) {
        try {
            finalValue = JSON.parse(tempEditValue);
        } catch (e) {}
    }

    setActiveOutputs(prev => {
        const nodeId = expandedOutput.nodeId;
        const fieldId = expandedOutput.fieldId;
        const existingNodeOutput = prev[nodeId];

        let newNodeOutput;
        if (fieldId && typeof existingNodeOutput === 'object' && existingNodeOutput !== null) {
            // Merge edited field into the existing structured object
            newNodeOutput = { ...existingNodeOutput, [fieldId]: finalValue };
        } else {
            // Overwrite entire node output
            newNodeOutput = finalValue;
        }

        return {
            ...prev,
            [nodeId]: newNodeOutput
        };
    });
    
    setWorkflow(prev => prev ? ({
        ...prev,
        isDirty: true,
        nodes: prev.nodes.map(n => n.id === expandedOutput.nodeId ? { ...n, status: NodeStatus.SUCCESS } : n)
    }) : null);

    setIsEditingResult(false);
  };

  const updateEnv = useCallback((key: keyof WorkflowState['env'], value: string) => {
    if (selectedRunId) setSelectedRunId(null);
    setValidationErrors([]);
    setWorkflow(prev => prev ? ({ ...prev, env: { ...prev.env, [key]: value }, isDirty: true }) : null);
  }, [selectedRunId]);

  const handleGlobalInputChange = useCallback((nodeId: string, portId: string, value: any) => {
    if (selectedRunId) setSelectedRunId(null);
    setValidationErrors([]);
    setWorkflow(prev => prev ? ({ ...prev, globalInputs: { ...prev.globalInputs, [`${nodeId}-${portId}`]: value }, isDirty: true }) : null);
  }, [selectedRunId]);

  const screenToWorld = useCallback((x: number, y: number) => ({ x: (x - view.x) / view.zoom, y: (y - view.y) / view.zoom }), [view]);

  const addNode = useCallback((tool: ToolDefinition, x?: number, y?: number, dataOverride?: Record<string, any>) => {
    if (selectedRunId) setSelectedRunId(null);
    const defaultData: Record<string, any> = { ...dataOverride };
    if (tool.models && tool.models.length > 0 && !defaultData.model) defaultData.model = tool.models[0].id;
    if ((tool.id === 'text-to-image' || tool.id === 'image-to-image') && !defaultData.aspectRatio) defaultData.aspectRatio = "1:1";
    if (tool.id.includes('video-gen') && !defaultData.aspectRatio) defaultData.aspectRatio = "16:9";
    if (tool.id === 'gemini-tts' && !defaultData.voice) defaultData.voice = "Kore";
    if (tool.id === 'gemini-text') {
      if (!defaultData.mode) defaultData.mode = 'basic';
      if (!defaultData.customOutputs) defaultData.customOutputs = [{ id: 'out-text', label: t('execution_results'), description: 'Main text response.' }];
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    const worldPos = x !== undefined && y !== undefined ? { x, y } : screenToWorld((rect?.width || 800) / 2, (rect?.height || 600) / 2);
    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNode: WorkflowNode = { id: newNodeId, toolId: tool.id, x: worldPos.x, y: worldPos.y, status: NodeStatus.IDLE, data: defaultData };
    setWorkflow(prev => prev ? ({ ...prev, nodes: [...prev.nodes, newNode], isDirty: true }) : null);
    setSelectedNodeId(newNodeId);
    return newNode;
  }, [view, screenToWorld, selectedRunId, t]);

  const pinOutputToCanvas = useCallback((value: any, type: DataType) => {
    const toolIdMap: Record<DataType, string> = { [DataType.TEXT]: 'text-prompt', [DataType.IMAGE]: 'image-input', [DataType.AUDIO]: 'audio-input', [DataType.VIDEO]: 'video-input' };
    const tool = TOOLS.find(t => t.id === toolIdMap[type]);
    if (tool) addNode(tool, 100, 100, { value });
  }, [addNode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        if (selectedNodeId) deleteSelectedNode();
        if (selectedConnectionId) deleteSelectedConnection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    if (selectedRunId) setSelectedRunId(null);
    setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.filter(n => n.id !== selectedNodeId), connections: prev.connections.filter(c => c.sourceNodeId !== selectedNodeId && c.targetNodeId !== selectedNodeId), isDirty: true }) : null);
    setSelectedNodeId(null);
  }, [selectedNodeId, selectedRunId]);

  const deleteSelectedConnection = useCallback(() => {
    if (!selectedConnectionId) return;
    if (selectedRunId) setSelectedRunId(null);
    setWorkflow(prev => prev ? ({ ...prev, connections: prev.connections.filter(c => c.id !== selectedConnectionId), isDirty: true }) : null);
    setSelectedConnectionId(null);
  }, [selectedConnectionId, selectedRunId]);

  const quickAddInput = (node: WorkflowNode, port: Port) => {
    if (selectedRunId) setSelectedRunId(null);
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

    const newConn: Connection = { 
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
  };

  const getNodeOutputs = (node: WorkflowNode): Port[] => {
    const tool = TOOLS.find(t => t.id === node.toolId);
    if (node.toolId === 'gemini-text' && node.data.customOutputs) return node.data.customOutputs.map((o: any) => ({ ...o, type: DataType.TEXT }));
    return tool?.outputs || [];
  };

  const disconnectedInputs = useMemo(() => {
    if (!workflow) return [];
    const list: { nodeId: string; port: Port; toolName: string; isSourceNode?: boolean; dataType: DataType }[] = [];
    
    workflow.nodes.forEach(node => {
      const tool = TOOLS.find(t => t.id === node.toolId);
      if (!tool || tool.category === 'Input') return;
      tool.inputs.forEach(port => { 
        const isConnected = workflow.connections.some(c => c.targetNodeId === node.id && c.targetPortId === port.id);
        if (!isConnected) {
           list.push({ nodeId: node.id, port, toolName: (lang === 'zh' ? tool.name_zh : tool.name), dataType: port.type }); 
        }
      });
    });

    workflow.nodes.forEach(node => {
      const tool = TOOLS.find(t => t.id === node.toolId);
      if (!tool || tool.category !== 'Input') return;
      
      const val = node.data.value;
      const isEmpty = (Array.isArray(val) && val.length === 0) || !val;
      if (isEmpty) {
        list.push({ 
          nodeId: node.id, 
          port: tool.outputs[0], 
          toolName: (lang === 'zh' ? tool.name_zh : tool.name), 
          isSourceNode: true,
          dataType: tool.outputs[0].type
        });
      }
    });

    return list;
  }, [workflow?.nodes, workflow?.connections, lang]);

  const validateWorkflow = (nodesToRunIds: Set<string>): { message: string; type: 'ENV' | 'INPUT' }[] => {
    if (!workflow) return [];
    const errors: { message: string; type: 'ENV' | 'INPUT' }[] = [];

    const usesLightX2V = Array.from(nodesToRunIds).some(id => {
      const node = workflow.nodes.find(n => n.id === id);
      return node && (node.toolId.includes('lightx2v')