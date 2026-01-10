
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
import { geminiText, geminiImage, geminiSpeech, geminiVideo, lightX2VTask } from './services/geminiService';

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
      return node && (node.toolId.includes('lightx2v') || node.toolId.includes('video') || node.toolId === 'avatar-gen' || ((node.toolId === 'text-to-image' || node.toolId === 'image-to-image') && node.data.model?.startsWith('Qwen')));
    });

    if (usesLightX2V) {
      if (!workflow.env.lightx2v_url?.trim() || !workflow.env.lightx2v_token?.trim()) {
        errors.push({ message: t('missing_env_msg'), type: 'ENV' });
      }
    }

    workflow.nodes.forEach(node => {
      if (!nodesToRunIds.has(node.id)) return;
      const tool = TOOLS.find(t => t.id === node.toolId);
      if (!tool) return;

      if (tool.category === 'Input') {
        const val = node.data.value;
        const isEmpty = (Array.isArray(val) && val.length === 0) || !val;
        if (isEmpty) {
          errors.push({ 
            message: `${lang === 'zh' ? tool.name_zh : tool.name} (${t('executing')})`,
            type: 'INPUT' 
          });
        }
        return;
      }

      tool.inputs.forEach(port => {
        const isOptional = port.label.toLowerCase().includes('optional') || port.label.toLowerCase().includes('(opt)');
        if (isOptional) return;

        const isConnected = workflow.connections.some(c => c.targetNodeId === node.id && c.targetPortId === port.id);
        const hasGlobalVal = !!workflow.globalInputs[`${node.id}-${port.id}`]?.toString().trim();
        
        if (!isConnected && !hasGlobalVal) {
          errors.push({ 
            message: `${lang === 'zh' ? tool.name_zh : tool.name} -> ${port.label}`,
            type: 'INPUT' 
          });
        }
      });
    });

    return errors;
  };

  const runWorkflow = async (startNodeId?: string, onlyOne?: boolean) => {
    if (!workflow || workflow.isRunning) return;
    
    setSelectedRunId(null);
    const runStartTime = performance.now();
    let nodesToRunIds: Set<string>;
    if (startNodeId) {
      if (onlyOne) nodesToRunIds = new Set([startNodeId]);
      else { 
        nodesToRunIds = getDescendants(startNodeId, workflow.connections); 
        nodesToRunIds.add(startNodeId); 
      }
    } else {
      nodesToRunIds = new Set(workflow.nodes.map(n => n.id));
    }

    const errors = validateWorkflow(nodesToRunIds);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const requiresUserApiKey = workflow.nodes
      .filter(n => nodesToRunIds.has(n.id))
      .some(n => 
        n.toolId.includes('video') || 
        n.toolId === 'avatar-gen' || 
        n.data.model === 'gemini-3-pro-image-preview' ||
        n.data.model === 'gemini-2.5-flash-image'
      );
    
    if (requiresUserApiKey) {
      try {
        if (!(await (window as any).aistudio.hasSelectedApiKey())) {
          await (window as any).aistudio.openSelectKey();
        }
      } catch (err) {}
    }

    setWorkflow(prev => prev ? ({ 
      ...prev, 
      isRunning: true, 
      nodes: prev.nodes.map(n => nodesToRunIds.has(n.id) ? { ...n, status: NodeStatus.IDLE, error: undefined, executionTime: undefined, startTime: undefined } : n) 
    }) : null);

    const executedInSession = new Set<string>();
    const sessionOutputs: Record<string, any> = {};
    
    if (startNodeId) {
      Object.entries(activeOutputs).forEach(([nodeId, val]) => {
        if (!nodesToRunIds.has(nodeId)) sessionOutputs[nodeId] = val;
      });
    }
    
    setActiveOutputs(prev => {
      const next = { ...prev };
      nodesToRunIds.forEach(id => delete next[id]);
      return next;
    });

    try {
      let progress = true;
      while (progress && executedInSession.size < workflow.nodes.filter(n => nodesToRunIds.has(n.id)).length) {
        progress = false;
        for (const node of workflow.nodes) {
          if (!nodesToRunIds.has(node.id) || executedInSession.has(node.id)) continue;
          const tool = TOOLS.find(t => t.id === node.toolId)!;
          const incomingConns = workflow.connections.filter(c => c.targetNodeId === node.id);
          const inputsReady = incomingConns.every(c => !nodesToRunIds.has(c.sourceNodeId) || executedInSession.has(c.sourceNodeId));

          if (inputsReady) {
            progress = true;
            const nodeStart = performance.now();
            setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: NodeStatus.RUNNING, startTime: nodeStart } : n) }) : null);
            
            try {
              const nodeInputs: Record<string, any> = {};
              tool.inputs.forEach(port => {
                const conns = incomingConns.filter(c => c.targetPortId === port.id);
                if (conns.length > 0) {
                  const values = conns.map(c => {
                    const sourceRes = sessionOutputs[c.sourceNodeId];
                    return (typeof sourceRes === 'object' && sourceRes !== null && c.sourcePortId in sourceRes) ? sourceRes[c.sourcePortId] : sourceRes;
                  }).flat();
                  nodeInputs[port.id] = values.length === 1 ? values[0] : values;
                } else nodeInputs[port.id] = workflow.globalInputs[`${node.id}-${port.id}`];
              });

              let result: any;
              const model = node.data.model;
              switch (node.toolId) {
                case 'text-prompt': result = node.data.value || ""; break;
                case 'image-input': result = node.data.value || []; break;
                case 'audio-input': result = node.data.value; break;
                case 'video-input': result = node.data.value; break;
                case 'web-search': result = await geminiText(nodeInputs['in-text'] || "Search query", true, 'basic', undefined, model); break;
                case 'gemini-text': 
                  const outputFields = (node.data.customOutputs || []).map((o: any) => ({ id: o.id, description: o.description || o.label }));
                  result = await geminiText(nodeInputs['in-text'] || "...", false, node.data.mode, node.data.customInstruction, model, outputFields); 
                  break;
                case 'text-to-image':
                  if (model === 'gemini-2.5-flash-image') {
                    result = await geminiImage(nodeInputs['in-text'] || "Artistic portrait", undefined, node.data.aspectRatio, model);
                  } else {
                    result = await lightX2VTask(
                      workflow.env.lightx2v_url, 
                      workflow.env.lightx2v_token, 
                      't2i', 
                      model || 'Qwen-Image-2512', 
                      nodeInputs['in-text'] || "",
                      undefined, undefined, undefined,
                      'output_image',
                      node.data.aspectRatio
                    );
                  }
                  break;
                case 'image-to-image':
                  if (model === 'gemini-2.5-flash-image') {
                    result = await geminiImage(nodeInputs['in-text'] || "Transform", nodeInputs['in-image'], "1:1", model);
                  } else {
                    const i2iRefImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                    result = await lightX2VTask(
                      workflow.env.lightx2v_url, 
                      workflow.env.lightx2v_token, 
                      'i2i', 
                      model || 'Qwen-Image-Edit-2511', 
                      nodeInputs['in-text'] || "",
                      i2iRefImg,
                      undefined, undefined,
                      'output_image',
                      node.data.aspectRatio
                    );
                  }
                  break;
                case 'gemini-tts': result = await geminiSpeech(nodeInputs['in-text'] || "Script", node.data.voice, model, nodeInputs['in-tone']); break;
                case 'video-gen-text': 
                  result = await lightX2VTask(
                    workflow.env.lightx2v_url, 
                    workflow.env.lightx2v_token, 
                    't2v', 
                    model || 'Wan2.2_T2V_A14B_distilled', 
                    nodeInputs['in-text'] || "",
                    undefined, undefined, undefined,
                    'output_video',
                    node.data.aspectRatio
                  );
                  break;
                case 'video-gen-image':
                  const startImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                  result = await lightX2VTask(
                    workflow.env.lightx2v_url, 
                    workflow.env.lightx2v_token, 
                    'i2v', 
                    model || 'Wan2.2_I2V_A14B_distilled', 
                    nodeInputs['in-text'] || "",
                    startImg,
                    undefined, undefined,
                    'output_video',
                    node.data.aspectRatio
                  );
                  break;
                case 'video-gen-dual-frame':
                    const dualStart = Array.isArray(nodeInputs['in-image-start']) ? nodeInputs['in-image-start'][0] : nodeInputs['in-image-start'];
                    const dualEnd = Array.isArray(nodeInputs['in-image-end']) ? nodeInputs['in-image-end'][0] : nodeInputs['in-image-end'];
                    result = await lightX2VTask(
                        workflow.env.lightx2v_url, 
                        workflow.env.lightx2v_token, 
                        'flf2v', 
                        model || 'Wan2.2_I2V_A14B_distilled', 
                        nodeInputs['in-text'] || "",
                        dualStart,
                        undefined,
                        dualEnd,
                        'output_video',
                        node.data.aspectRatio
                    );
                    break;
                case 'character-swap':
                  const swapImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                  const swapVid = Array.isArray(nodeInputs['in-video']) ? nodeInputs['in-video'][0] : nodeInputs['in-video'];
                  result = await geminiVideo(nodeInputs['in-text'] || "Swap character", swapImg, "16:9", "720p", swapVid, model);
                  break;
                case 'avatar-gen': 
                  const avatarImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                  const avatarAudio = Array.isArray(nodeInputs['in-audio']) ? nodeInputs['in-audio'][0] : nodeInputs['in-audio'];
                  result = await lightX2VTask(
                    workflow.env.lightx2v_url, 
                    workflow.env.lightx2v_token, 
                    's2v', 
                    model || "SekoTalk",
                    nodeInputs['in-text'] || "A person talking naturally.", 
                    avatarImg || "", 
                    avatarAudio || ""
                  );
                  break;
                default: result = "Processed";
              }
              const nodeDuration = performance.now() - nodeStart;
              sessionOutputs[node.id] = result;
              setActiveOutputs(prev => ({ ...prev, [node.id]: result }));
              setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: NodeStatus.SUCCESS, executionTime: nodeDuration } : n) }) : null);
              executedInSession.add(node.id);
            } catch (err: any) {
              const nodeDuration = performance.now() - nodeStart;
              if (err.message?.includes("Requested entity was not found")) {
                await (window as any).aistudio.openSelectKey();
              }
              setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: NodeStatus.ERROR, error: err.message || 'Unknown execution error', executionTime: nodeDuration } : n) }) : null);
              throw err;
            }
          }
        }
      }
      const runTotalTime = performance.now() - runStartTime;
      const newRun: GenerationRun = { 
        id: `run-${Date.now()}`, 
        timestamp: Date.now(), 
        outputs: { ...sessionOutputs }, 
        nodesSnapshot: [...workflow.nodes.map(n => ({ ...n }))],
        totalTime: runTotalTime 
      };
      setWorkflow(prev => prev ? ({ ...prev, history: [newRun, ...prev.history].slice(0, 10) }) : null);
      setSelectedRunId(newRun.id);
    } catch (e) { 
      console.error(e); 
      setSelectedRunId(null);
    } finally { 
      setWorkflow(prev => prev ? ({ ...prev, isRunning: false }) : null); 
    }
  };

  const getDescendants = (nodeId: string, connections: Connection[]): Set<string> => {
    const descendants = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      connections.filter(c => c.sourceNodeId === current).forEach(c => { if (!descendants.has(c.targetNodeId)) { descendants.add(c.targetNodeId); stack.push(c.targetNodeId); } });
    }
    return descendants;
  };

  const activeResultsList = useMemo(() => {
    if (!workflow) return [];
    const sourceRun = selectedRunId ? workflow.history.find(r => r.id === selectedRunId) : null;
    const data = sourceRun ? sourceRun.outputs : activeOutputs;
    const nodes = sourceRun ? sourceRun.nodesSnapshot : workflow.nodes;
    
    return nodes.filter(n => {
      if (n.status === NodeStatus.ERROR) return true;
      if (!data[n.id]) {
        const tool = TOOLS.find(t => t.id === n.toolId);
        return tool?.category === 'Input' && n.data.value;
      }
      if (!workflow.showIntermediateResults) {
        const isTerminal = !workflow.connections.some(c => c.sourceNodeId === n.id);
        return isTerminal;
      }
      return true;
    }).sort((a, b) => {
      const aIsTerminal = !workflow.connections.some(c => c.sourceNodeId === a.id);
      const bIsTerminal = !workflow.connections.some(c => c.sourceNodeId === b.id);
      return aIsTerminal === bIsTerminal ? 0 : aIsTerminal ? -1 : 1;
    });
  }, [selectedRunId, workflow, activeOutputs]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setMousePos({ x, y });
    if (isPanning) { setView(prev => ({ ...prev, x: prev.x + (e.clientX - panStart.x), y: prev.y + (e.clientY - panStart.y) })); setPanStart({ x: e.clientX, y: e.clientY }); }
    else if (draggingNode) { 
        if (selectedRunId) setSelectedRunId(null);
        const world = screenToWorld(x, y); 
        setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === draggingNode.id ? { ...n, x: world.x - draggingNode.offsetX, y: world.y - draggingNode.offsetY } : n), isDirty: true }) : null); 
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!(e.target as HTMLElement).closest('.node-element') && !(e.target as HTMLElement).closest('.port') && !(e.target as HTMLElement).closest('.connection-path')) { 
      setIsPanning(true); 
      setPanStart({ x: e.clientX, y: e.clientY }); 
      setSelectedNodeId(null); 
      setSelectedConnectionId(null); 
    }
  };

  if (currentView === 'DASHBOARD') {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-hidden">
        <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-10 bg-slate-900/40 backdrop-blur-3xl z-40">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20"><Wand2 className="text-white" size={24} /></div>
              <div className="flex flex-col"><h1 className="text-xl font-black uppercase tracking-widest text-white">{t('app_name')}</h1><span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('app_subtitle')}</span></div>
           </div>
           <div className="flex items-center gap-6">
              <button onClick={toggleLang} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-800"><Languages size={14}/> {t('lang_name')}</button>
              <button onClick={createNewWorkflow} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95"><Plus size={18}/> {t('create_workflow')}</button>
           </div>
        </header>
        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
           <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex items-center gap-8 border-b border-slate-800/60 pb-1">
                 <button onClick={() => setActiveTab('MY')} className={`pb-4 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'MY' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>{t('my_workflows')}{activeTab === 'MY' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-400 rounded-full animate-in fade-in duration-300"></div>}</button>
                 <button onClick={() => setActiveTab('PRESET')} className={`pb-4 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'PRESET' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>{t('preset_library')}{activeTab === 'PRESET' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-400 rounded-full animate-in fade-in duration-300"></div>}</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {activeTab === 'MY' && (myWorkflows.length === 0 ? <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20"><LayoutGrid size={64} className="mb-4"/><p className="text-sm font-black uppercase tracking-[0.3em]">{t('no_workflows')}</p></div> : myWorkflows.map(w => (
                      <div key={w.id} onClick={() => openWorkflow(w)} className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-[32px] p-6 flex flex-col justify-between h-56 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer relative overflow-hidden active:scale-95">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex justify-between items-start relative z-10"><div className="p-3 bg-slate-800 group-hover:bg-indigo-600 rounded-2xl text-slate-500 group-hover:text-white transition-all shadow-inner"><Layers size={20}/></div><button onClick={(e) => deleteWorkflow(w.id, e)} className="p-2 text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={16}/></button></div>
                         <div className="space-y-2 relative z-10"><h3 className="text-lg font-black text-slate-200 group-hover:text-white transition-colors truncate">{w.name}</h3><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Calendar size={10}/> {new Date(w.updatedAt).toLocaleDateString()}</div></div>
                      </div>
                    )))}
                 {activeTab === 'PRESET' && (PRESET_WORKFLOWS.map(w => (
                      <div key={w.id} onClick={() => openWorkflow(w)} className="group bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 rounded-[32px] p-6 flex flex-col justify-between h-56 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer relative overflow-hidden active:scale-95">
                         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex justify-between items-start relative z-10"><div className="p-3 bg-slate-800 group-hover:bg-emerald-600 rounded-2xl text-slate-500 group-hover:text-white transition-all shadow-inner"><Sparkle size={20}/></div><span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">{t('system_preset')}</span></div>
                         <div className="space-y-2 relative z-10"><h3 className="text-lg font-black text-slate-200 group-hover:text-white transition-colors truncate">{w.name}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-1">{lang === 'zh' ? '多模态自动化创作流水线' : 'Automated multi-modal pipeline'}</p></div>
                      </div>
                    )))}
              </div>
           </div>
        </main>
      </div>
    );
  }

  if (!workflow) return null;

  const sourceNodes = selectedRunId 
    ? (workflow.history.find(r => r.id === selectedRunId)?.nodesSnapshot || []) 
    : workflow.nodes;
    
  const sourceOutputs = selectedRunId 
    ? (workflow.history.find(r => r.id === selectedRunId)?.outputs || {}) 
    : activeOutputs;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-hidden">
      {expandedOutput && expandedResultData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl w-full max-w-5xl h-full flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-widest">{expandedResultData.label}</h2>
                    {expandedResultData.type === DataType.TEXT && (
                        <button 
                            onClick={() => {
                                if (!isEditingResult) {
                                    setTempEditValue(typeof expandedResultData.content === 'object' ? JSON.stringify(expandedResultData.content, null, 2) : expandedResultData.content);
                                }
                                setIsEditingResult(!isEditingResult);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isEditingResult ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            {isEditingResult ? t('save_changes') : t('edit_mode')}
                        </button>
                    )}
                </div>
                {isEditingResult && <p className="text-[10px] text-indigo-400 font-bold uppercase animate-pulse">{t('manual_edit_hint')}</p>}
              </div>
              <div className="flex items-center gap-3">
                {isEditingResult ? (
                    <button onClick={handleManualResultEdit} className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all active:scale-90 shadow-lg shadow-emerald-500/20 flex items-center gap-2 px-6">
                        <SaveAll size={20}/>
                        <span className="text-sm font-black uppercase">{t('save_changes')}</span>
                    </button>
                ) : (
                    <button onClick={() => downloadFile(expandedResultData.content, expandedResultData.label, expandedResultData.type)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all active:scale-90"><Download size={20}/></button>
                )}
                <button onClick={() => { setExpandedOutput(null); setIsEditingResult(false); }} className="p-3 text-slate-400 hover:text-white transition-all"><X size={24}/></button>
              </div>
            </div>
            <div className="flex-1 p-12 overflow-y-auto flex items-center justify-center custom-scrollbar">
               {expandedResultData.type === DataType.TEXT ? (
                 isEditingResult ? (
                    <textarea 
                        value={tempEditValue}
                        onChange={e => setTempEditValue(e.target.value)}
                        className="w-full h-full bg-slate-950 border-2 border-indigo-500/50 rounded-3xl p-8 text-base text-indigo-100 resize-none focus:ring-0 focus:border-indigo-400 font-mono transition-all custom-scrollbar selection:bg-indigo-500/30"
                        placeholder="Manually edit the AI output..."
                        autoFocus
                    />
                 ) : (
                    typeof expandedResultData.content === 'object' ? (
                        <pre className="text-xs bg-slate-950/50 p-8 rounded-3xl border border-slate-800/50 text-indigo-300 max-w-3xl w-full overflow-auto selection:bg-indigo-500/20">
                          {JSON.stringify(expandedResultData.content, null, 2)}
                        </pre>
                     ) : (
                        <p className="text-lg leading-relaxed max-w-3xl whitespace-pre-wrap selection:bg-indigo-500/20">{expandedResultData.content}</p>
                     )
                 )
               ) : expandedResultData.type === DataType.IMAGE ? (
                  <img src={expandedResultData.content} className="max-h-full rounded-2xl shadow-2xl border border-slate-800" />
               ) : expandedResultData.type === DataType.AUDIO ? (
                  <audio controls autoPlay src={expandedResultData.content.startsWith('data') ? expandedResultData.content : pcmToWavUrl(expandedResultData.content)} />
               ) : (
                  <video controls autoPlay src={expandedResultData.content} className="max-h-full rounded-2xl shadow-2xl" />
               )}
            </div>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-500/30 rounded-[32px] shadow-2xl shadow-red-500/10 max-w-md w-full overflow-hidden flex flex-col">
              <div className="p-6 bg-red-500/10 border-b border-red-500/20 flex items-center gap-4">
                 <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg"><TriangleAlert size={20} /></div>
                 <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">{t('validation_failed')}</h2>
                    <p className="text-[10px] text-red-400/80 font-bold uppercase">{t('fix_validation')}</p>
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto max-h-[400px] custom-scrollbar space-y-4">
                 {validationErrors.some(e => e.type === 'ENV') && (
                    <div className="space-y-2">
                       <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('env_vars')}</span>
                       <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400 leading-relaxed font-medium">
                          {validationErrors.find(e => e.type === 'ENV')?.message}
                       </div>
                    </div>
                 )}
                 {validationErrors.filter(e => e.type === 'INPUT').length > 0 && (
                    <div className="space-y-2">
                       <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('missing_inputs_msg')}</span>
                       <div className="space-y-1.5">
                          {validationErrors.filter(e => e.type === 'INPUT').map((err, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                {err.message}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
              <div className="p-4 bg-slate-800/20 border-t border-slate-800 flex justify-end">
                 <button onClick={() => setValidationErrors([])} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Close</button>
              </div>
           </div>
        </div>
      )}

      <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-2xl z-40">
        <div className="flex items-center gap-5">
          <button onClick={() => setCurrentView('DASHBOARD')} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={20}/></button>
          <div className="flex flex-col"><input value={workflow.name} onChange={e => { if (selectedRunId) setSelectedRunId(null); setWorkflow(p => p ? ({ ...p, name: e.target.value, isDirty: true }) : null); }} className="bg-transparent border-none text-base font-bold focus:ring-0 p-0 hover:bg-slate-800/20 rounded px-1 transition-colors w-64" /><span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('editing_logic')}</span></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold transition-all border border-slate-800"><Languages size={12}/> {t('lang_name')}</button>
          {selectedRunId && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 animate-pulse">
               <BookOpen size={14} className="text-indigo-400" />
               <span className="text-[10px] font-black uppercase text-indigo-400">{t('snapshot_view')}</span>
               <button onClick={() => setSelectedRunId(null)} className="ml-2 hover:text-white"><X size={12}/></button>
            </div>
          )}
          {selectedRunId && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
               <Timer size={14} className="text-indigo-400" />
               <span className="text-[10px] font-black uppercase text-slate-300">{t('run_time')}: {formatTime(workflow.history.find(r => r.id === selectedRunId)?.totalTime)}</span>
            </div>
          )}
          <button onClick={() => saveWorkflowToLocal(workflow)} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold border transition-all ${workflow.isDirty ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 hover:bg-indigo-600/20' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><Save size={16}/> {t('save_flow')}</button>
          <div className="w-px h-6 bg-slate-800"></div>
          <button onClick={() => runWorkflow()} disabled={workflow.isRunning} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all ${workflow.isRunning ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'}`}>{workflow.isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}{workflow.isRunning ? t('executing') : t('run_fabric')}</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-72 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-xl flex flex-col z-30 overflow-y-auto p-4 space-y-8">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{t('tool_palette')}</h3>
           {['Input', 'AI Model'].map(cat => (
             <div key={cat} className="space-y-2.5">
               <span className="text-[9px] text-slate-600 font-black uppercase">{lang === 'zh' ? (cat === 'Input' ? '输入' : 'AI 模型') : cat}</span>
               {TOOLS.filter(t => t.category === cat).map(tool => (
                 <div key={tool.id} onClick={() => addNode(tool)} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/20 border border-slate-800/60 hover:border-indigo-500/40 hover:bg-slate-800/40 cursor-pointer transition-all active:scale-95 group"><div className="p-2.5 rounded-xl bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{React.createElement(getIcon(tool.icon), { size: 16 })}</div><div className="flex flex-col"><span className="text-xs font-bold text-slate-300">{lang === 'zh' ? tool.name_zh : tool.name}</span><span className="text-[9px] text-slate-500 line-clamp-1">{lang === 'zh' ? tool.description_zh : tool.description}</span></div></div>
               ))}
             </div>
           ))}
        </aside>

        <main ref={canvasRef} className="flex-1 relative overflow-hidden canvas-grid bg-[#0a0f1e]" onMouseMove={handleMouseMove} onMouseUp={() => { setDraggingNode(null); setConnecting(null); setIsPanning(false); }} onMouseDown={handleMouseDown} onWheel={e => { if (e.ctrlKey) { e.preventDefault(); setView(v => ({ ...v, zoom: Math.min(Math.max(v.zoom - e.deltaY * 0.001, 0.2), 2) })); } else setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); }}>
          <div style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
              {workflow.connections.map(c => {
                const sNode = sourceNodes.find(n => n.id === c.sourceNodeId);
                const tNode = sourceNodes.find(n => n.id === c.targetNodeId);
                if (!sNode || !tNode) return null;
                const sOutputs = getNodeOutputs(sNode), tInputs = (TOOLS.find(t => t.id === tNode.toolId))?.inputs || [];
                const x1 = sNode.x + 224, y1 = sNode.y + 64 + (sOutputs.findIndex(p => p.id === c.sourcePortId) * 32);
                const x2 = tNode.x, y2 = tNode.y + 64 + (tInputs.findIndex(p => p.id === c.targetPortId) * 32);
                const path = `M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`;
                const isSelected = selectedConnectionId === c.id;
                const isTargetRunning = tNode.status === NodeStatus.RUNNING;
                return (
                  <g key={c.id}>
                    <path d={path} stroke="transparent" strokeWidth="15" fill="none" className="pointer-events-auto cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedConnectionId(c.id); setSelectedNodeId(null); }} />
                    <path d={path} stroke={isSelected ? '#818cf8' : '#312e81'} strokeWidth={isSelected ? 4 : 3} fill="none" className="connection-path transition-all" />
                    {isTargetRunning && (
                      <circle r="4" fill="#818cf8" className="shadow-lg shadow-indigo-500/50">
                         <animateMotion path={path} dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {isSelected && (
                      <foreignObject x={(x1 + x2) / 2 - 15} y={(y1 + y2) / 2 - 30} width="30" height="30" className="overflow-visible">
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); deleteSelectedConnection(); }}
                          className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-90 pointer-events-auto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
              {connecting && (
                <path 
                  d={`M ${connecting.startX} ${connecting.startY} C ${connecting.startX + 100 / view.zoom} ${connecting.startY}, ${((mousePos.x - view.x) / view.zoom) - 100 / view.zoom} ${(mousePos.y - view.y) / view.zoom}, ${(mousePos.x - view.x) / view.zoom} ${(mousePos.y - view.y) / view.zoom}`} 
                  stroke="#4f46e5" 
                  strokeWidth={3 / view.zoom} 
                  strokeDasharray={`${6 / view.zoom},${6 / view.zoom}`} 
                  fill="none" 
                  className="animate-marching-ants" 
                />
              )}
            </svg>
            {sourceNodes.map(node => {
              const tool = TOOLS.find(t => t.id === node.toolId);
              if (!tool) return null;
              const isSelected = selectedNodeId === node.id;
              const outputs = getNodeOutputs(node);
              
              const nodeResult = sourceOutputs[node.id] || (tool.category === 'Input' ? node.data.value : null);
              const firstOutputType = outputs[0]?.type || DataType.TEXT;
              
              const durationText = node.status === NodeStatus.RUNNING 
                ? ((performance.now() - (node.startTime || performance.now())) / 1000).toFixed(1) + 's'
                : formatTime(node.executionTime);

              const isInputNode = tool.category === 'Input';
              const hasData = (isInputNode && node.data.value && (Array.isArray(node.data.value) ? node.data.value.length > 0 : true)) || (!isInputNode && sourceOutputs[node.id]);

              return (
                <div key={node.id} className={`node-element absolute w-56 bg-slate-900 border rounded-3xl shadow-2xl transition-all z-10 group ${isSelected ? 'border-indigo-500 ring-8 ring-indigo-500/10' : 'border-slate-800'}`} style={{ left: node.x, top: node.y }} onClick={e => { 
                  e.stopPropagation(); 
                  if (selectedRunId) setSelectedRunId(null);
                  setSelectedNodeId(node.id); 
                  setSelectedConnectionId(null); 
                }} onMouseDown={e => { 
                  if ((e.target as HTMLElement).closest('input, textarea, button, label')) return;
                  const world = screenToWorld(e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0), e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0)); 
                  setDraggingNode({ id: node.id, offsetX: world.x - node.x, offsetY: world.y - node.y }); 
                }}>
                  
                  {isSelected && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); deleteSelectedNode(); }}
                      className="absolute -top-14 left-1/2 -translate-x-1/2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-20 active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className={`px-4 py-3 border-b flex items-center justify-between bg-slate-800/40 rounded-t-3xl ${node.status === NodeStatus.RUNNING ? 'animate-pulse bg-indigo-500/10 border-indigo-500/20' : ''}`}>
                    <div className="flex items-center gap-2 truncate">
                      <div className={`p-1.5 rounded-lg ${node.status === NodeStatus.RUNNING ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {React.createElement(getIcon(tool.icon), { size: 10 })}
                      </div>
                      <span className="text-[10px] font-black uppercase truncate tracking-widest">{lang === 'zh' ? tool.name_zh : tool.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       {(node.status === NodeStatus.RUNNING || node.executionTime !== undefined) && (
                         <span className={`text-[8px] font-bold ${node.status === NodeStatus.RUNNING ? 'text-indigo-400' : 'text-slate-500'}`}>
                           {durationText}
                         </span>
                       )}
                       
                       {!isInputNode && (
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              title={t('run_this_only')}
                              onClick={(e) => { e.stopPropagation(); runWorkflow(node.id, true); }} 
                              className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                              <PlayIcon size={12} />
                           </button>
                           <button 
                              title={t('run_from_here')}
                              onClick={(e) => { e.stopPropagation(); runWorkflow(node.id, false); }} 
                              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              <FastForward size={12} />
                           </button>
                         </div>
                       )}

                       {node.status === NodeStatus.SUCCESS && <CheckCircle2 size={12} className="text-emerald-500" />}
                       {node.status === NodeStatus.ERROR && <AlertCircle size={12} className="text-red-500" />}
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {isInputNode && (
                      <div onMouseDown={e => e.stopPropagation()} className="space-y-3">
                         {node.toolId === 'text-prompt' && (
                           <textarea 
                             value={node.data.value || ''} 
                             onChange={e => updateNodeData(node.id, 'value', e.target.value)} 
                             className="w-full h-24 bg-slate-950/50 border border-slate-800 rounded-xl p-2 text-[10px] resize-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300 custom-scrollbar"
                             placeholder="Type here..."
                           />
                         )}
                         {node.toolId === 'image-input' && (
                            <div className="space-y-2">
                               <div className="flex flex-wrap gap-1.5">
                                  {(node.data.value || []).map((img: string, i: number) => (
                                    <div key={i} className="relative w-8 h-8 group/img">
                                       <img src={img} className="w-full h-full object-cover rounded border border-slate-700" />
                                       <button onClick={() => {
                                          const next = node.data.value.filter((_: any, idx: number) => idx !== i);
                                          updateNodeData(node.id, 'value', next);
                                       }} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={6}/></button>
                                    </div>
                                  ))}
                                  <label className="w-8 h-8 flex items-center justify-center border border-dashed border-slate-700 rounded cursor-pointer hover:border-indigo-500 transition-colors">
                                     <Plus size={10} className="text-slate-500" />
                                     <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        const base64s = await Promise.all(files.map(file => new Promise<string>((resolve) => {
                                          const reader = new FileReader();
                                          reader.onloadend = () => resolve(reader.result as string);
                                          reader.readAsDataURL(file);
                                        })));
                                        updateNodeData(node.id, 'value', [...(node.data.value || []), ...base64s]);
                                     }} />
                                  </label>
                               </div>
                            </div>
                         )}
                         {(node.toolId === 'audio-input' || node.toolId === 'video-input') && (
                           <div className="space-y-2">
                              {node.data.value ? (
                                <div className="flex items-center justify-between p-2 bg-slate-950/50 rounded-xl border border-slate-800">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                      {node.toolId === 'audio-input' ? <Volume2 size={12} className="text-indigo-400 shrink-0"/> : <VideoIcon size={12} className="text-indigo-400 shrink-0"/>}
                                      <span className="text-[8px] text-slate-400 truncate">Media File</span>
                                   </div>
                                   <button onClick={() => updateNodeData(node.id, 'value', null)} className="p-1 text-slate-600 hover:text-red-400"><X size={10}/></button>
                                </div>
                              ) : (
                                <label className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                                   <Upload size={12} className="text-slate-500" />
                                   <span className="text-[9px] font-black text-slate-500 uppercase">{lang === 'zh' ? '上传' : 'Upload'}</span>
                                   <input type="file" accept={node.toolId === 'audio-input' ? "audio/*" : "video/*"} className="hidden" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                         const base64 = await new Promise<string>((resolve) => {
                                            const reader = new FileReader();
                                            reader.onloadend = () => resolve(reader.result as string);
                                            reader.readAsDataURL(file);
                                         });
                                         updateNodeData(node.id, 'value', base64);
                                      }
                                   }} />
                                </label>
                              )}
                           </div>
                         )}
                      </div>
                    )}

                    {node.status === NodeStatus.ERROR && (
                      <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-[8px] text-red-400 leading-tight">
                         <span className="font-bold uppercase mb-1 block">{t('execution_error')}</span>
                         {node.error}
                      </div>
                    )}
                    {tool.inputs.map(p => {
                      const isConnected = workflow.connections.some(c => c.targetNodeId === node.id && c.targetPortId === p.id);
                      return (
                        <div key={p.id} className="flex items-center gap-2 text-[9px] font-bold text-slate-500 relative group/port">
                          {!isConnected && (
                            <button 
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); quickAddInput(node, p); }} 
                              className="opacity-0 group-hover/port:opacity-100 transition-opacity p-1 bg-indigo-600 text-white rounded-lg absolute -left-12 z-20 shadow-xl hover:bg-indigo-500 active:scale-90 flex items-center justify-center"
                              title={t('quick_add_source')}
                            >
                              <Plus size={14}/>
                            </button>
                          )}
                          <div className="port w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-950 absolute -left-[24px] cursor-crosshair hover:bg-indigo-500 transition-colors" onMouseDown={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(), cr = canvasRef.current!.getBoundingClientRect(); const viewX = rect.left + rect.width / 2 - cr.left, viewY = rect.top + rect.height / 2 - cr.top; const world = screenToWorld(viewX, viewY); setConnecting({ nodeId: node.id, portId: p.id, type: p.type, direction: 'in', startX: world.x, startY: world.y }); }} onMouseUp={() => { if (connecting && connecting.direction === 'out' && connecting.type === p.type) { if (selectedRunId) setSelectedRunId(null); setWorkflow(p_prev => p_prev ? ({ ...p_prev, connections: [...p_prev.connections, { id: `conn-${Date.now()}`, sourceNodeId: connecting.nodeId, sourcePortId: connecting.portId, targetNodeId: node.id, targetPortId: p.id }], isDirty: true }) : null); } }} /><span className="truncate">{p.label}</span></div>
                      );
                    })}
                    {outputs.map(p => (
                      <div key={p.id} className="flex items-center justify-end gap-2 text-[9px] font-bold text-slate-500 relative"><span className="truncate">{p.label}</span><div className="port w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-950 absolute -right-[24px] cursor-crosshair hover:bg-indigo-500 transition-colors" onMouseDown={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(), cr = canvasRef.current!.getBoundingClientRect(); const viewX = rect.left + rect.width / 2 - cr.left, viewY = rect.top + rect.height / 2 - cr.top; const world = screenToWorld(viewX, viewY); setConnecting({ nodeId: node.id, portId: p.id, type: p.type, direction: 'out', startX: world.x, startY: world.y }); }} onMouseUp={() => { if (connecting && connecting.direction === 'in' && connecting.type === p.type) { if (selectedRunId) setSelectedRunId(null); setWorkflow(p_prev => p_prev ? ({ ...p_prev, connections: [...p_prev.connections, { id: `conn-${Date.now()}`, sourceNodeId: node.id, sourcePortId: p.id, targetNodeId: connecting.nodeId, targetPortId: connecting.portId }], isDirty: true }) : null); } }} /></div>
                    ))}
                  </div>

                  {hasData && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setExpandedOutput({ nodeId: node.id }); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -bottom-28 -right-4 w-32 h-24 bg-slate-800/95 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden cursor-pointer hover:scale-110 hover:border-indigo-500 transition-all z-30 group/thumb"
                    >
                      {firstOutputType === DataType.IMAGE ? (
                         <img src={Array.isArray(nodeResult) ? nodeResult[0] : nodeResult} className="w-full h-full object-cover" alt="Preview" />
                      ) : firstOutputType === DataType.TEXT ? (
                         <div className="p-3 text-[8px] text-slate-300 overflow-hidden leading-snug font-medium selection:bg-transparent">
                            {typeof nodeResult === 'object' ? JSON.stringify(nodeResult).slice(0, 100) : nodeResult.toString().slice(0, 100)}...
                         </div>
                      ) : firstOutputType === DataType.AUDIO ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400 bg-indigo-500/5">
                            <Volume2 size={32} className="mb-1" />
                            <div className="w-20 h-1.5 bg-indigo-500/20 rounded-full overflow-hidden">
                               <div className="w-1/2 h-full bg-indigo-500 animate-pulse"></div>
                            </div>
                         </div>
                      ) : (
                         <div className="w-full h-full relative bg-black group/video">
                            <video 
                              src={Array.isArray(nodeResult) ? nodeResult[0] : nodeResult} 
                              className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 transition-opacity" 
                              muted 
                              onMouseOver={e => e.currentTarget.play()} 
                              onMouseOut={e => e.currentTarget.pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none group-hover/thumb:scale-125 transition-transform">
                               <Play size={24} className="drop-shadow-lg" fill="currentColor" />
                            </div>
                         </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-950/90 to-transparent flex items-center px-2.5">
                         <span className="text-[7px] font-black uppercase text-white/80 tracking-widest flex items-center gap-1">
                            <Maximize2 size={10} /> {t('inspect_result')}
                         </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <aside className="w-80 border-l border-slate-800/60 bg-slate-900/40 backdrop-blur-xl flex flex-col z-30 p-6 overflow-y-auto">
           {selectedNodeId && selectedNode ? (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Settings size={14}/> {t('settings')}</h2><button onClick={deleteSelectedNode} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button></div>
                <div className="space-y-6">
                  {TOOLS.find(t => t.id === selectedNode.toolId)?.models && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2"><Boxes size={12}/> {t('select_model')}</span>
                      <select value={selectedNode.data.model} onChange={e => updateNodeData(selectedNode.id, 'model', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700 focus:border-indigo-500 transition-all">
                        {TOOLS.find(t => t.id === selectedNode.toolId)?.models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}

                  {selectedNode.toolId === 'gemini-text' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase">{t('mode')}</span>
                        <select value={selectedNode.data.mode} onChange={e => updateNodeData(selectedNode.id, 'mode', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700">
                          {['basic', 'enhance', 'summarize', 'polish', 'custom'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                      </div>
                      
                      {selectedNode.data.mode === 'custom' && (
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">System Instruction</span>
                          <textarea 
                            value={selectedNode.data.customInstruction || ''} 
                            onChange={e => updateNodeData(selectedNode.id, 'customInstruction', e.target.value)} 
                            className="w-full h-32 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-xs resize-none focus:border-indigo-500 transition-all" 
                            placeholder="Set global AI behavior..."
                          />
                        </div>
                      )}

                      <div className="space-y-4">
                        <span className="text-[10px] text-slate-500 font-black uppercase">{t('structured_outputs')}</span>
                        {selectedNode.data.customOutputs.map((o:any, i:number) => (
                          <div key={i} className="p-4 bg-slate-950/40 border border-slate-800 rounded-[24px] space-y-3">
                            <div className="flex items-center gap-2">
                              <input 
                                value={o.id} 
                                placeholder="Field ID (e.g. prompt)"
                                onChange={e => { const n = [...selectedNode.data.customOutputs]; n[i].id = e.target.value; updateNodeData(selectedNode.id, 'customOutputs', n); }} 
                                className="bg-transparent border-none text-[10px] font-black text-indigo-400 flex-1 p-0 focus:ring-0"
                              />
                              <button onClick={() => { const n = selectedNode.data.customOutputs.filter((_:any,idx:number)=>idx!==i); updateNodeData(selectedNode.id, 'customOutputs', n); }} className="text-slate-600 hover:text-red-400 transition-colors"><X size={14}/></button>
                            </div>
                            <textarea 
                                value={o.description || ''} 
                                placeholder="Instructions for AI (intent, constraints)..."
                                onChange={e => { const n = [...selectedNode.data.customOutputs]; n[i].description = e.target.value; updateNodeData(selectedNode.id, 'customOutputs', n); }} 
                                className="w-full h-16 bg-slate-900/50 border border-slate-800 rounded-xl p-2 text-[10px] text-slate-400 resize-none focus:border-indigo-500 focus:ring-0 transition-all"
                            />
                          </div>
                        ))}
                        <button onClick={() => { const n = [...selectedNode.data.customOutputs, { id: `out_${Date.now().toString().slice(-4)}`, label: 'Output', description: '' }]; updateNodeData(selectedNode.id, 'customOutputs', n); }} className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-[10px] text-slate-500 uppercase hover:text-indigo-400 transition-all">+ {t('add_output')}</button>
                      </div>
                    </div>
                  )}
                  {(selectedNode.toolId === 'text-to-image' || selectedNode.toolId === 'image-to-image' || selectedNode.toolId.includes('video-gen')) && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase">{t('aspect_ratio')}</span>
                      <select value={selectedNode.data.aspectRatio} onChange={e => updateNodeData(selectedNode.id, 'aspectRatio', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700">
                        {selectedNode.toolId.includes('video-gen') 
                          ? ['16:9', '9:16'].map(r => <option key={r} value={r}>{r}</option>)
                          : ['1:1', '4:3', '3:4', '16:9', '9:16'].map(r => <option key={r} value={r}>{r}</option>)
                        }
                      </select>
                    </div>
                  )}
                  {selectedNode.toolId === 'gemini-tts' && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase">{t('voice')}</span>
                      <select value={selectedNode.data.voice} onChange={e => updateNodeData(selectedNode.id, 'voice', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700">
                        {['Kore', 'Puck', 'Fenrir', 'Charon', 'Zephyr'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  )}
                </div>
             </div>
           ) : (
             <div className="space-y-12">
                <div className="space-y-6">
                   <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-400"/> {t('env_vars')}</h2>
                   <div className="space-y-4 p-5 bg-slate-800/30 border border-slate-800/60 rounded-[32px] shadow-inner">
                      <div className="space-y-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Globe2 size={12}/> {t('api_endpoint')}</span>
                         <input 
                            type="text" 
                            value={workflow.env.lightx2v_url} 
                            onChange={e => updateEnv('lightx2v_url', e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] focus:border-indigo-500 transition-all font-mono" 
                            placeholder="https://..."
                         />
                      </div>
                      <div className="space-y-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Key size={12}/> {t('access_token')}</span>
                         <input 
                            type="password" 
                            value={workflow.env.lightx2v_token} 
                            onChange={e => updateEnv('lightx2v_token', e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] focus:border-indigo-500 transition-all font-mono" 
                            placeholder="sk-..."
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Target size={14}/> {t('global_inputs')}</h2>
                   {disconnectedInputs.length === 0 ? <p className="text-[10px] text-slate-600 italic px-2">{t('all_inputs_automated')}</p> : (
                     <div className="space-y-4">
                        {disconnectedInputs.map(item => (
                           <div key={`${item.nodeId}-${item.port.id}`} className="space-y-2 p-5 bg-slate-800/20 border border-slate-800 rounded-[32px]">
                              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{item.port.label} ({lang === 'zh' ? '针对' : 'for'} {item.toolName})</span>
                              {item.dataType === DataType.TEXT ? (
                                <textarea 
                                  value={item.isSourceNode ? (workflow.nodes.find(n => n.id === item.nodeId)?.data.value || '') : (workflow.globalInputs[`${item.nodeId}-${item.port.id}`] || '')} 
                                  onChange={e => item.isSourceNode ? updateNodeData(item.nodeId, 'value', e.target.value) : handleGlobalInputChange(item.nodeId, item.port.id, e.target.value)} 
                                  className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs resize-none focus:border-indigo-500 transition-all custom-scrollbar" 
                                />
                              ) : (
                                <div className="space-y-3">
                                   <label className="flex items-center justify-center w-full h-12 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all gap-2">
                                      <Upload size={14} className="text-slate-500" />
                                      <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'zh' ? '上传文件' : 'Upload File'}</span>
                                      <input 
                                        type="file" 
                                        accept={item.dataType === DataType.IMAGE ? "image/*" : item.dataType === DataType.AUDIO ? "audio/*" : "video/*"} 
                                        className="hidden" 
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const base64 = await new Promise<string>((resolve) => {
                                              const reader = new FileReader();
                                              reader.onloadend = () => resolve(reader.result as string);
                                              reader.readAsDataURL(file);
                                            });
                                            if (item.isSourceNode) {
                                              updateNodeData(item.nodeId, 'value', item.dataType === DataType.IMAGE ? [base64] : base64);
                                            } else {
                                              handleGlobalInputChange(item.nodeId, item.port.id, base64);
                                            }
                                          }
                                        }}
                                      />
                                   </label>
                                   {(item.isSourceNode ? (workflow.nodes.find(n => n.id === item.nodeId)?.data.value) : workflow.globalInputs[`${item.nodeId}-${item.port.id}`]) && (
                                     <div className="flex items-center justify-between px-2">
                                        <span className="text-[8px] text-emerald-500 font-black uppercase flex items-center gap-1"><CheckCircle2 size={10}/> {lang === 'zh' ? '已就绪' : 'Ready'}</span>
                                        <button 
                                          onClick={() => item.isSourceNode ? updateNodeData(item.nodeId, 'value', item.dataType === DataType.IMAGE ? [] : null) : handleGlobalInputChange(item.nodeId, item.port.id, null)}
                                          className="text-[8px] text-slate-500 hover:text-red-400 font-black uppercase"
                                        >
                                          {lang === 'zh' ? '移除' : 'Remove'}
                                        </button>
                                     </div>
                                   )}
                                </div>
                              )}
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
           )}
        </aside>
      </div>

      <footer className="h-80 border-t border-slate-800/60 bg-slate-900/60 backdrop-blur-3xl z-40 flex flex-col overflow-hidden">
        <div className="px-8 py-4 border-b border-slate-800/60 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-indigo-400"><History size={16}/> {t('execution_results')}</h2>
              <div className="h-4 w-px bg-slate-800"></div>
              <button 
                onClick={() => setWorkflow(p => p ? ({ ...p, showIntermediateResults: !p.showIntermediateResults }) : null)}
                className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-300 transition-all"
              >
                {workflow.showIntermediateResults ? <ToggleRight size={16} className="text-indigo-500" /> : <ToggleLeft size={16} />}
                {t('show_intermediate')}
              </button>
           </div>
           <div className="flex gap-4">
             {workflow.history.map(r => (
               <button key={r.id} onClick={() => setSelectedRunId(r.id)} className={`group relative px-4 py-1.5 rounded-full text-[9px] font-bold border transition-all ${selectedRunId === r.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                 {new Date(r.timestamp).toLocaleTimeString()}
                 {r.totalTime !== undefined && (
                   <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                      {t('run_time')}: {formatTime(r.totalTime)}
                   </span>
                 )}
               </button>
             ))}
             {selectedRunId && <button onClick={() => setSelectedRunId(null)} className="p-1.5 text-slate-500 hover:text-white transition-all active:scale-90"><RefreshCw size={14}/></button>}
           </div>
        </div>
        <div className="flex-1 overflow-x-auto p-8 flex gap-8 items-start custom-scrollbar">
           {activeResultsList.length === 0 && !workflow.isRunning ? (
             <div className="flex-1 flex flex-col items-center justify-center opacity-10 animate-pulse"><RefreshCw size={48} className="mb-4 animate-spin-slow"/><span className="text-[10px] font-black uppercase tracking-widest">{t('awaiting_execution')}</span></div>
           ) : activeResultsList.map(node => {
             const tool = TOOLS.find(t => t.id === node.toolId);
             if (!tool) return null;
             const res = sourceOutputs[node.id] || (tool.category === 'Input' ? node.data.value : null);
             const type = tool?.outputs[0]?.type || DataType.TEXT;
             const isTerminal = !workflow.connections.some(c => c.sourceNodeId === node.id);
             
             const elapsed = node.status === NodeStatus.RUNNING
                ? ((performance.now() - (node.startTime || performance.now())) / 1000).toFixed(1) + 's'
                : formatTime(node.executionTime);

             return (
               <div key={node.id} className={`min-w-[320px] max-w-[420px] bg-slate-900/50 rounded-[32px] border p-6 flex flex-col shadow-2xl relative overflow-hidden group transition-all h-[190px] ${node.status === NodeStatus.ERROR ? 'border-red-500/30 bg-red-500/5' : isTerminal ? 'border-emerald-500/30' : 'border-slate-800/60'}`}>
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2">{React.createElement(getIcon(tool.icon), { size: 12 })} {lang === 'zh' ? tool.name_zh : tool.name}</span>
                        {(node.status === NodeStatus.RUNNING || node.executionTime !== undefined) && (
                          <span className={`text-[8px] font-bold ${node.status === NodeStatus.RUNNING ? 'text-indigo-400' : 'text-slate-600'}`}>
                            {t('run_time')}: {elapsed}
                          </span>
                        )}
                     </div>
                     <div className="flex gap-2">
                       {node.status !== NodeStatus.ERROR && (
                         <>
                           <button onClick={() => setExpandedOutput({ nodeId: node.id })} className="p-1.5 text-slate-500 hover:text-white transition-all"><Maximize2 size={14}/></button>
                           <button onClick={() => pinOutputToCanvas(res, type)} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-all"><ArrowUpRight size={14}/></button>
                         </>
                       )}
                     </div>
                  </div>
                  <div className={`flex-1 overflow-y-auto rounded-xl p-3 custom-scrollbar ${node.status === NodeStatus.ERROR ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-950/40'}`}>
                     {node.status === NodeStatus.ERROR ? (
                       <div className="h-full flex flex-col items-center justify-center text-center p-2">
                          <AlertCircle size={24} className="text-red-500 mb-2" />
                          <p className="text-[10px] text-red-400 font-bold uppercase mb-1">{t('execution_failed')}</p>
                          <p className="text-[9px] text-slate-400 line-clamp-3 leading-relaxed">{node.error}</p>
                       </div>
                     ) : (
                       type === DataType.TEXT ? (
                        typeof res === 'object' ? (
                            <div className="space-y-2">
                                {Object.entries(res || {}).map(([k, v]) => (
                                    <div 
                                        key={k} 
                                        onClick={() => setExpandedOutput({ nodeId: node.id, fieldId: k })}
                                        className="group/field p-2 bg-slate-900/60 rounded-lg border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">{k}</span>
                                            <Maximize2 size={8} className="text-slate-600 group-hover/field:text-indigo-400" />
                                        </div>
                                        <p className="text-[9px] text-slate-400 line-clamp-1">{v as string}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 line-clamp-4 leading-relaxed">{res}</p>
                        )
                     ) : type === DataType.IMAGE ? (
                        <div className="flex gap-2 overflow-x-auto h-full pb-1 custom-scrollbar">
                            {(Array.isArray(res) ? res : [res]).map((img, i) => (
                                <img key={i} src={img} className="h-full w-auto object-cover rounded-lg border border-slate-800" />
                            ))}
                        </div>
                     ) : (
                       <div className="flex items-center justify-center h-full text-indigo-400">
                          {type === DataType.AUDIO ? <Volume2 size={24}/> : <VideoIcon size={24} />}
                       </div>
                     )}
                  </div>
               </div>
             );
           })}
        </div>
      </footer>
      <style>{`
        @keyframes marching-ants { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        .animate-marching-ants { animation: marching-ants 1.5s linear infinite; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .canvas-grid { background-image: radial-gradient(rgba(51, 65, 85, 0.4) 1px, transparent 1px); }
        .connection-path:hover { stroke-opacity: 0.8; stroke-width: 5px; }
      `}</style>
    </div>
  );
};

export default App;
