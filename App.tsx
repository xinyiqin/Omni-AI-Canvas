
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Play, Pause, Save, Trash2, Search, Settings, 
  Layers, ChevronRight, AlertCircle, CheckCircle2,
  X, Type, Image as ImageIcon, Volume2, Video as VideoIcon, 
  Cpu, Sparkles, AlignLeft, Download, RefreshCw,
  Terminal, MousePointer2, Wand2, Globe, Palette, Clapperboard, UserCircle, UserCog,
  Maximize, ZoomIn, ZoomOut, Zap, MessageSquare, PenTool, FileText, Star, Edit3, Boxes,
  Camera, Mic, Wand, ListPlus, Hash, Info, PlayCircle, FastForward, ArrowUpRight,
  Target, Activity, History, Clock, Maximize2, DownloadCloud, BookOpen, ChevronLeft,
  Calendar, LayoutGrid, Sparkle, ToggleLeft, ToggleRight, Timer, PlayCircle as PlayIcon,
  Key, Globe2, Upload, Languages, ShieldCheck, TriangleAlert, SaveAll, Eraser
} from 'lucide-react';
import { TOOLS } from './constants';
import { 
  WorkflowNode, Connection, WorkflowState, 
  NodeStatus, DataType, Port, ToolDefinition, GenerationRun
} from './types';
import { geminiText, geminiImage, geminiSpeech, geminiVideo, lightX2VTask, lightX2VTTS, lightX2VVoiceClone, lightX2VVoiceCloneTTS, lightX2VGetVoiceList, lightX2VGetCloneVoiceList, deepseekText, doubaoText } from './services/geminiService';
import { removeGeminiWatermark } from './services/watermarkRemover';

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
    ai_generate_workflow: 'AI Generate Workflow',
    describe_workflow: 'Describe your workflow',
    generate_workflow: 'Generate Workflow',
    generating_workflow: 'Generating...',
    lang_name: 'English',
    env_vars: 'Env Variables',
    api_endpoint: 'API Endpoint',
    access_token: 'Access Token',
    validation_failed: 'Input Validation Failed',
    missing_inputs_msg: 'The following required inputs are missing:',
    missing_env_msg: 'LightX2V Environment settings (URL/Token) are missing. Please set LIGHTX2V_URL and LIGHTX2V_TOKEN environment variables.',
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
    ai_generate_workflow: 'AI 生成工作流',
    describe_workflow: '描述您想要的工作流',
    generate_workflow: '生成工作流',
    generating_workflow: '正在生成...',
    confirm_delete: '确定删除该工作流吗？',
    lang_name: '中文',
    env_vars: '环境变量',
    api_endpoint: 'API 地址',
    access_token: '访问密钥',
    validation_failed: '输入校验未通过',
    missing_inputs_msg: '以下必需的输入项缺失：',
    missing_env_msg: 'LightX2V 环境配置（地址/密钥）未填写。请设置 LIGHTX2V_URL 和 LIGHTX2V_TOKEN 环境变量。',
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
    name: '文字-首尾帧生视频工作流',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "",
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
          model: 'deepseek-v3-2-251201',
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
    name: '文字-数字人视频工作流',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "",
      lightx2v_token: ""
    },
    globalInputs: {},
    history: [],
    showIntermediateResults: false,
    connections: [
      { id: 'c1', sourceNodeId: 'node-prompt', sourcePortId: 'out-text', targetNodeId: 'node-chat', targetPortId: 'in-text' },
      { id: 'c2', sourceNodeId: 'node-chat', sourcePortId: 'image_prompt', targetNodeId: 'node-image', targetPortId: 'in-text' },
      { id: 'c3', sourceNodeId: 'node-chat', sourcePortId: 'speech_text', targetNodeId: 'node-tts', targetPortId: 'in-text' },
      { id: 'c4', sourceNodeId: 'node-chat', sourcePortId: 'tone', targetNodeId: 'node-tts', targetPortId: 'in-context-tone' },
      { id: 'c5', sourceNodeId: 'node-image', sourcePortId: 'out-image', targetNodeId: 'node-avatar', targetPortId: 'in-image' },
      { id: 'c6', sourceNodeId: 'node-tts', sourcePortId: 'out-audio', targetNodeId: 'node-avatar', targetPortId: 'in-audio' },
      { id: 'c7', sourceNodeId: 'node-chat', sourcePortId: 'avatar_video_prompt', targetNodeId: 'node-avatar', targetPortId: 'in-text' }
    ],
    nodes: [
      { id: 'node-prompt', toolId: 'text-prompt', x: 100, y: 200, status: NodeStatus.IDLE, data: { value: "A man teach me not to sleep late in an overbearing CEO style." } },
      { id: 'node-chat', toolId: 'gemini-text', x: 450, y: 200, status: NodeStatus.IDLE, data: { 
          model: 'deepseek-v3-2-251201',
          mode: 'custom',
          customInstruction: `You are a professional digital avatar video script writer. Your task is to create a complete script package for a digital avatar video based on the user's input description.

CRITICAL: Generate high-quality, natural, and engaging content for a digital avatar video.

For speech_text:
- Write a natural, conversational script that sounds authentic when spoken
- Keep it concise (20-40 seconds when spoken at normal pace)
- Use clear, direct language that matches the character's personality and style
- Ensure the script flows naturally and is easy to understand
- Match the tone and energy described in the user's input

For tone:
- Provide detailed voice acting instructions that capture the character's personality
- Include emotional cues, pacing, emphasis points, and vocal characteristics
- Describe how the voice should sound (e.g., warm, authoritative, friendly, serious)
- Include specific moments where tone should shift or emphasize certain words/phrases
- Make it actionable for TTS systems to produce natural-sounding speech

For image_prompt:
- Create a detailed portrait description that matches the character described
- Include facial features, age, expression, clothing, background, lighting
- Ensure the description is suitable for portrait image generation
- Match the character's personality and style from the user's input
- Include visual details that will make the avatar look professional and engaging

For avatar_video_prompt:
- Describe natural, realistic talking gestures and movements
- Include head movements (nodding, tilting, slight turns)
- Describe facial expressions that match the speech content and emotional tone
- Include body language and hand gestures if appropriate
- Specify eye contact and gaze direction
- Ensure movements are synchronized with the speech rhythm
- Make it detailed enough to guide the avatar video generation for natural, lifelike results

Output all four fields in JSON format.`,
          customOutputs: [
            { id: 'speech_text', label: 'Speech Script', description: 'The text the CEO says to the listener.' },
            { id: 'tone', label: 'Tone Instruction', description: 'Cues for speech style (e.g. commanding, deep, protective).' },
            { id: 'image_prompt', label: 'Portrait Prompt', description: 'Description of the overbearing CEO for an image generator.' },
            { id: 'avatar_video_prompt', label: 'Avatar Video Action Prompt', description: 'Description of the avatar video action and movement (e.g. natural talking gestures, head movements, facial expressions).' }
          ]
      } },
      { id: 'node-image', toolId: 'text-to-image', x: 850, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-2512', aspectRatio: "9:16" } },
      { id: 'node-tts', toolId: 'tts', x: 850, y: 350, status: NodeStatus.IDLE, data: { model: 'lightx2v', voiceType: 'zh_female_vv_uranus_bigtts', resourceId: 'seed-tts-2.0' } },
      { id: 'node-avatar', toolId: 'avatar-gen', x: 1250, y: 200, status: NodeStatus.IDLE, data: {} }
    ]
  },
  {
    id: 'preset-avatar-i2i',
    name: '人物图片+文字-数字人视频工作流',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "",
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
      { id: 'c5', sourceNodeId: 'node-logic', sourcePortId: 'voice_style', targetNodeId: 'node-voice', targetPortId: 'in-context-tone' },
      { id: 'c6', sourceNodeId: 'node-i2i-gen', sourcePortId: 'out-image', targetNodeId: 'node-final-avatar', targetPortId: 'in-image' },
      { id: 'c7', sourceNodeId: 'node-voice', sourcePortId: 'out-audio', targetNodeId: 'node-final-avatar', targetPortId: 'in-audio' }
    ],
    nodes: [
      { id: 'node-img-in', toolId: 'image-input', x: 50, y: 50, status: NodeStatus.IDLE, data: { value: [] } },
      { id: 'node-text-in', toolId: 'text-prompt', x: 50, y: 350, status: NodeStatus.IDLE, data: { value: "A cheerful young lifestyle blogger, sharing a secret tip about the best morning routine in a sun-drenched minimalist coffee shop." } },
      { id: 'node-logic', toolId: 'gemini-text', x: 400, y: 350, status: NodeStatus.IDLE, data: { 
          model: 'deepseek-v3-2-251201',
          mode: 'custom',
          customInstruction: "You are a social media creative director. Your goal is to generate perfectly synchronized components for a digital avatar video. Ensure the image description matches the energy of the script, and the voice style captures the specific mood of the location and message.",
          customOutputs: [
            { id: 'i2i_prompt', label: 'Scene Edit Prompt', description: 'Modification prompt. Describe the character from the input image sitting in the specific coffee shop mentioned. Mention facial expression and posture that matches the script content.' },
            { id: 'tts_text', label: 'Avatar Script', description: 'A 20-30 second spoken script. It should sound like a casual, intimate secret shared with a close friend.' },
            { id: 'voice_style', label: 'Tone', description: 'Specific instructions for voice acting. Should start with a soft whispery secret tone and move to warm enthusiasm.' }
          ]
      } },
      { id: 'node-i2i-gen', toolId: 'image-to-image', x: 800, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-voice', toolId: 'tts', x: 800, y: 450, status: NodeStatus.IDLE, data: { model: 'lightx2v', voiceType: 'zh_female_vv_uranus_bigtts', resourceId: 'seed-tts-2.0' } },
      { id: 'node-final-avatar', toolId: 'avatar-gen', x: 1200, y: 250, status: NodeStatus.IDLE, data: {} }
    ]
  },
  {
    id: 'preset-storyboard-9',
    name: '9分镜故事板视频工作流',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "",
      lightx2v_token: ""
    },
    globalInputs: {},
    history: [],
    showIntermediateResults: true,
    connections: [
      // Input to first image and planner
      { id: 'c1', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-1', targetPortId: 'in-image' },
      { id: 'c2', sourceNodeId: 'node-desc', sourcePortId: 'out-text', targetNodeId: 'node-planner', targetPortId: 'in-text' },
      // Planner to image edits (sequential generation based on previous image + character)
      { id: 'c3', sourceNodeId: 'node-planner', sourcePortId: 'scene1_prompt', targetNodeId: 'node-i2i-1', targetPortId: 'in-text' },
      { id: 'c4', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-2', targetPortId: 'in-image' },
      { id: 'c5', sourceNodeId: 'node-i2i-1', sourcePortId: 'out-image', targetNodeId: 'node-i2i-2', targetPortId: 'in-image' },
      { id: 'c6', sourceNodeId: 'node-planner', sourcePortId: 'scene2_prompt', targetNodeId: 'node-i2i-2', targetPortId: 'in-text' },
      { id: 'c7', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-3', targetPortId: 'in-image' },
      { id: 'c8', sourceNodeId: 'node-i2i-2', sourcePortId: 'out-image', targetNodeId: 'node-i2i-3', targetPortId: 'in-image' },
      { id: 'c9', sourceNodeId: 'node-planner', sourcePortId: 'scene3_prompt', targetNodeId: 'node-i2i-3', targetPortId: 'in-text' },
      { id: 'c10', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-4', targetPortId: 'in-image' },
      { id: 'c11', sourceNodeId: 'node-i2i-3', sourcePortId: 'out-image', targetNodeId: 'node-i2i-4', targetPortId: 'in-image' },
      { id: 'c12', sourceNodeId: 'node-planner', sourcePortId: 'scene4_prompt', targetNodeId: 'node-i2i-4', targetPortId: 'in-text' },
      { id: 'c13', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-5', targetPortId: 'in-image' },
      { id: 'c14', sourceNodeId: 'node-i2i-4', sourcePortId: 'out-image', targetNodeId: 'node-i2i-5', targetPortId: 'in-image' },
      { id: 'c15', sourceNodeId: 'node-planner', sourcePortId: 'scene5_prompt', targetNodeId: 'node-i2i-5', targetPortId: 'in-text' },
      { id: 'c16', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-6', targetPortId: 'in-image' },
      { id: 'c17', sourceNodeId: 'node-i2i-5', sourcePortId: 'out-image', targetNodeId: 'node-i2i-6', targetPortId: 'in-image' },
      { id: 'c18', sourceNodeId: 'node-planner', sourcePortId: 'scene6_prompt', targetNodeId: 'node-i2i-6', targetPortId: 'in-text' },
      { id: 'c19', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-7', targetPortId: 'in-image' },
      { id: 'c20', sourceNodeId: 'node-i2i-6', sourcePortId: 'out-image', targetNodeId: 'node-i2i-7', targetPortId: 'in-image' },
      { id: 'c21', sourceNodeId: 'node-planner', sourcePortId: 'scene7_prompt', targetNodeId: 'node-i2i-7', targetPortId: 'in-text' },
      { id: 'c22', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-8', targetPortId: 'in-image' },
      { id: 'c23', sourceNodeId: 'node-i2i-7', sourcePortId: 'out-image', targetNodeId: 'node-i2i-8', targetPortId: 'in-image' },
      { id: 'c24', sourceNodeId: 'node-planner', sourcePortId: 'scene8_prompt', targetNodeId: 'node-i2i-8', targetPortId: 'in-text' },
      { id: 'c25', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-9', targetPortId: 'in-image' },
      { id: 'c26', sourceNodeId: 'node-i2i-8', sourcePortId: 'out-image', targetNodeId: 'node-i2i-9', targetPortId: 'in-image' },
      { id: 'c27', sourceNodeId: 'node-planner', sourcePortId: 'scene9_prompt', targetNodeId: 'node-i2i-9', targetPortId: 'in-text' },
      // Image to video generation (i2v: each image generates one video)
      { id: 'c28', sourceNodeId: 'node-i2i-1', sourcePortId: 'out-image', targetNodeId: 'node-video-1', targetPortId: 'in-image' },
      { id: 'c29', sourceNodeId: 'node-planner', sourcePortId: 'scene1_video', targetNodeId: 'node-video-1', targetPortId: 'in-text' },
      { id: 'c30', sourceNodeId: 'node-i2i-2', sourcePortId: 'out-image', targetNodeId: 'node-video-2', targetPortId: 'in-image' },
      { id: 'c31', sourceNodeId: 'node-planner', sourcePortId: 'scene2_video', targetNodeId: 'node-video-2', targetPortId: 'in-text' },
      { id: 'c32', sourceNodeId: 'node-i2i-3', sourcePortId: 'out-image', targetNodeId: 'node-video-3', targetPortId: 'in-image' },
      { id: 'c33', sourceNodeId: 'node-planner', sourcePortId: 'scene3_video', targetNodeId: 'node-video-3', targetPortId: 'in-text' },
      { id: 'c34', sourceNodeId: 'node-i2i-4', sourcePortId: 'out-image', targetNodeId: 'node-video-4', targetPortId: 'in-image' },
      { id: 'c35', sourceNodeId: 'node-planner', sourcePortId: 'scene4_video', targetNodeId: 'node-video-4', targetPortId: 'in-text' },
      { id: 'c36', sourceNodeId: 'node-i2i-5', sourcePortId: 'out-image', targetNodeId: 'node-video-5', targetPortId: 'in-image' },
      { id: 'c37', sourceNodeId: 'node-planner', sourcePortId: 'scene5_video', targetNodeId: 'node-video-5', targetPortId: 'in-text' },
      { id: 'c38', sourceNodeId: 'node-i2i-6', sourcePortId: 'out-image', targetNodeId: 'node-video-6', targetPortId: 'in-image' },
      { id: 'c39', sourceNodeId: 'node-planner', sourcePortId: 'scene6_video', targetNodeId: 'node-video-6', targetPortId: 'in-text' },
      { id: 'c40', sourceNodeId: 'node-i2i-7', sourcePortId: 'out-image', targetNodeId: 'node-video-7', targetPortId: 'in-image' },
      { id: 'c41', sourceNodeId: 'node-planner', sourcePortId: 'scene7_video', targetNodeId: 'node-video-7', targetPortId: 'in-text' },
      { id: 'c42', sourceNodeId: 'node-i2i-8', sourcePortId: 'out-image', targetNodeId: 'node-video-8', targetPortId: 'in-image' },
      { id: 'c43', sourceNodeId: 'node-planner', sourcePortId: 'scene8_video', targetNodeId: 'node-video-8', targetPortId: 'in-text' },
      { id: 'c44', sourceNodeId: 'node-i2i-9', sourcePortId: 'out-image', targetNodeId: 'node-video-9', targetPortId: 'in-image' },
      { id: 'c45', sourceNodeId: 'node-planner', sourcePortId: 'scene9_video', targetNodeId: 'node-video-9', targetPortId: 'in-text' }
    ],
    nodes: [
      // Input nodes
      { id: 'node-char-img', toolId: 'image-input', x: 50, y: 500, status: NodeStatus.IDLE, data: { value: [] } },
      { id: 'node-desc', toolId: 'text-prompt', x: 50, y: 200, status: NodeStatus.IDLE, data: { value: "迪士尼风格的城堡公主早晨醒来，在温馨的房间里梳妆打扮，然后望向窗外，窗外是很漂亮的小镇风光，然后镜头转向远景能够看到公主在窗边伸了个懒腰" } },
      // Planner node
      { id: 'node-planner', toolId: 'gemini-text', x: 350, y: 350, status: NodeStatus.IDLE, data: { 
          model: 'deepseek-v3-2-251201',
          mode: 'custom',
          customInstruction: `You are a video storyboard planner. Analyze the input description and break it down into exactly 9 scenes (shots) for sequential image generation.

CRITICAL: Character and Scene Consistency is PARAMOUNT for this storyboard.

For character consistency (ABSOLUTELY CRITICAL):
- The SAME character must appear across ALL scenes that feature them
- Maintain EXACT character features: facial features (eyes, nose, mouth, face shape), body shape, age, build, distinctive characteristics
- HAIR consistency: If hair changes in any scene (e.g., from messy to styled, or changes color/style), ALL subsequent scenes MUST have the same hair style/color. Once hair changes, it MUST persist in all following scenes.
- CLOTHING consistency: If clothing changes in any scene (e.g., from pajamas to dress, or from casual to formal), ALL subsequent scenes MUST feature the same clothing. Once clothing changes, it MUST persist in all following scenes. Explicitly state in prompts for scenes after the change that the character is wearing the same outfit as in the scene where the change occurred.
- Character's appearance, age, build, and visual style MUST remain IDENTICAL across all scenes
- Describe the character in detail with consistent attributes in every scene prompt
- Track clothing and hair changes throughout the sequence and maintain consistency after any change

For scene consistency (ABSOLUTELY CRITICAL):
- If scenes take place in the SAME location (e.g., same room, same outdoor area), maintain IDENTICAL background elements, furniture, props, decorations, lighting direction, and spatial layout
- If two consecutive scenes are in the same location, describe the EXACT same background elements, furniture arrangement, and props to avoid visual inconsistencies
- Maintain the same artistic style (e.g., Disney style, realistic, etc.) across all scenes
- Keep consistent lighting direction, intensity, and color palette throughout the storyboard
- Ensure background elements and settings flow naturally between scenes
- Maintain spatial relationships and visual continuity

Image generation approach:
- Scene 1: Generate based on character image + scene1_prompt (establishing the character's appearance and first scene)
- Scene 2: Generate based on Scene 1 image + character image + scene2_prompt (maintains continuity from previous scene while preserving character identity)
- Scene 3: Generate based on Scene 2 image + character image + scene3_prompt
- And so on... Each scene uses the previous scene image + character image for continuity and character consistency

Video generation:
- Each scene will use image-to-video (i2v) generation
- sceneN_video should describe the motion/camera movement for that scene

For each scene, output:
- sceneN_prompt: Detailed image generation prompt that describes the scene, maintaining character consistency (especially clothing/hair if changed - explicitly state if wearing same outfit/hair as previous scene) and scene consistency if in same location (explicitly describe same background elements)
- sceneN_video: Video motion prompt describing camera movement and action for that scene

Output format: JSON with exactly these fields:
- scene1_prompt, scene1_video
- scene2_prompt, scene2_video  
- scene3_prompt, scene3_video
- scene4_prompt, scene4_video
- scene5_prompt, scene5_video
- scene6_prompt, scene6_video
- scene7_prompt, scene7_video
- scene8_prompt, scene8_video
- scene9_prompt, scene9_video

IMPORTANT: In each prompt, explicitly maintain consistency:
- If clothing changes in scene N, mention in scene(N+1)_prompt, scene(N+2)_prompt, etc. that "the character is wearing the same [outfit description] as in scene N"
- If hair changes in scene N, mention in subsequent prompts that "the character has the same hair style/color as in scene N"
- If scenes share the same location, explicitly describe the same background elements, furniture, props, and lighting`,
          customOutputs: [
            { id: 'scene1_prompt', label: 'Scene 1 Image Prompt', description: 'Detailed image prompt for scene 1 with character' },
            { id: 'scene1_video', label: 'Scene 1 Video Prompt', description: 'Video motion prompt for scene 1' },
            { id: 'scene2_prompt', label: 'Scene 2 Image Prompt', description: 'Detailed image prompt for scene 2 with character' },
            { id: 'scene2_video', label: 'Scene 2 Video Prompt', description: 'Video motion prompt for scene 2' },
            { id: 'scene3_prompt', label: 'Scene 3 Image Prompt', description: 'Detailed image prompt for scene 3 with character' },
            { id: 'scene3_video', label: 'Scene 3 Video Prompt', description: 'Video motion prompt for scene 3' },
            { id: 'scene4_prompt', label: 'Scene 4 Image Prompt', description: 'Detailed image prompt for scene 4 with character' },
            { id: 'scene4_video', label: 'Scene 4 Video Prompt', description: 'Video motion prompt for scene 4' },
            { id: 'scene5_prompt', label: 'Scene 5 Image Prompt', description: 'Detailed image prompt for scene 5 with character' },
            { id: 'scene5_video', label: 'Scene 5 Video Prompt', description: 'Video motion prompt for scene 5' },
            { id: 'scene6_prompt', label: 'Scene 6 Image Prompt', description: 'Detailed image prompt for scene 6 with character' },
            { id: 'scene6_video', label: 'Scene 6 Video Prompt', description: 'Video motion prompt for scene 6' },
            { id: 'scene7_prompt', label: 'Scene 7 Prompt', description: 'Image/video prompt for scene 7' },
            { id: 'scene7_video', label: 'Scene 7 Video Prompt', description: 'Video motion prompt for scene 7' },
            { id: 'scene8_prompt', label: 'Scene 8 Prompt', description: 'Image/video prompt for scene 8' },
            { id: 'scene8_video', label: 'Scene 8 Video Prompt', description: 'Video motion prompt for scene 8' },
            { id: 'scene9_prompt', label: 'Scene 9 Prompt', description: 'Image/video prompt for scene 9' },
            { id: 'scene9_video', label: 'Scene 9 Video Prompt', description: 'Video motion prompt for scene 9' }
          ]
      } },
      // Image-to-image nodes for all 9 scenes (sequential generation based on previous image + character)
      { id: 'node-i2i-1', toolId: 'image-to-image', x: 750, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-2', toolId: 'image-to-image', x: 750, y: 150, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-3', toolId: 'image-to-image', x: 750, y: 250, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-4', toolId: 'image-to-image', x: 750, y: 350, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-5', toolId: 'image-to-image', x: 750, y: 450, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-6', toolId: 'image-to-image', x: 750, y: 550, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-7', toolId: 'image-to-image', x: 750, y: 650, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-8', toolId: 'image-to-image', x: 750, y: 750, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-9', toolId: 'image-to-image', x: 750, y: 850, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      // Video generation nodes (all 9 scenes using image-to-video)
      { id: 'node-video-1', toolId: 'video-gen-image', x: 1100, y: 50, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-2', toolId: 'video-gen-image', x: 1100, y: 150, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-3', toolId: 'video-gen-image', x: 1100, y: 250, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-4', toolId: 'video-gen-image', x: 1100, y: 350, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-5', toolId: 'video-gen-image', x: 1100, y: 450, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-6', toolId: 'video-gen-image', x: 1100, y: 550, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-7', toolId: 'video-gen-image', x: 1100, y: 650, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-8', toolId: 'video-gen-image', x: 1100, y: 750, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } },
      { id: 'node-video-9', toolId: 'video-gen-image', x: 1100, y: 850, status: NodeStatus.IDLE, data: { model: 'Wan2.2_I2V_A14B_distilled', aspectRatio: '9:16' } }
    ]
  },
  {
    id: 'preset-multi-shot-singing',
    name: '多机位唱歌',
    updatedAt: Date.now(),
    isDirty: false,
    isRunning: false,
    env: {
      lightx2v_url: "",
      lightx2v_token: ""
    },
    globalInputs: {},
    history: [],
    showIntermediateResults: true,
    connections: [
      // Input to AI Chat
      { id: 'c1', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-planner', targetPortId: 'in-image' },
      { id: 'c2', sourceNodeId: 'node-text-in', sourcePortId: 'out-text', targetNodeId: 'node-planner', targetPortId: 'in-text' },
      // AI Chat to Image-to-Image (9 shots)
      { id: 'c3', sourceNodeId: 'node-planner', sourcePortId: 'shot1_image_prompt', targetNodeId: 'node-i2i-1', targetPortId: 'in-text' },
      { id: 'c4', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-1', targetPortId: 'in-image' },
      { id: 'c5', sourceNodeId: 'node-planner', sourcePortId: 'shot2_image_prompt', targetNodeId: 'node-i2i-2', targetPortId: 'in-text' },
      { id: 'c6', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-2', targetPortId: 'in-image' },
      { id: 'c7', sourceNodeId: 'node-planner', sourcePortId: 'shot3_image_prompt', targetNodeId: 'node-i2i-3', targetPortId: 'in-text' },
      { id: 'c8', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-3', targetPortId: 'in-image' },
      { id: 'c9', sourceNodeId: 'node-planner', sourcePortId: 'shot4_image_prompt', targetNodeId: 'node-i2i-4', targetPortId: 'in-text' },
      { id: 'c10', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-4', targetPortId: 'in-image' },
      { id: 'c11', sourceNodeId: 'node-planner', sourcePortId: 'shot5_image_prompt', targetNodeId: 'node-i2i-5', targetPortId: 'in-text' },
      { id: 'c12', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-5', targetPortId: 'in-image' },
      { id: 'c28', sourceNodeId: 'node-planner', sourcePortId: 'shot6_image_prompt', targetNodeId: 'node-i2i-6', targetPortId: 'in-text' },
      { id: 'c29', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-6', targetPortId: 'in-image' },
      { id: 'c30', sourceNodeId: 'node-planner', sourcePortId: 'shot7_image_prompt', targetNodeId: 'node-i2i-7', targetPortId: 'in-text' },
      { id: 'c31', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-7', targetPortId: 'in-image' },
      { id: 'c32', sourceNodeId: 'node-planner', sourcePortId: 'shot8_image_prompt', targetNodeId: 'node-i2i-8', targetPortId: 'in-text' },
      { id: 'c33', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-8', targetPortId: 'in-image' },
      { id: 'c34', sourceNodeId: 'node-planner', sourcePortId: 'shot9_image_prompt', targetNodeId: 'node-i2i-9', targetPortId: 'in-text' },
      { id: 'c35', sourceNodeId: 'node-char-img', sourcePortId: 'out-image', targetNodeId: 'node-i2i-9', targetPortId: 'in-image' },
      // Image-to-Image to Avatar Video (9 shots)
      { id: 'c13', sourceNodeId: 'node-i2i-1', sourcePortId: 'out-image', targetNodeId: 'node-avatar-1', targetPortId: 'in-image' },
      { id: 'c14', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-1', targetPortId: 'in-audio' },
      { id: 'c15', sourceNodeId: 'node-planner', sourcePortId: 'shot1_video_prompt', targetNodeId: 'node-avatar-1', targetPortId: 'in-text' },
      { id: 'c16', sourceNodeId: 'node-i2i-2', sourcePortId: 'out-image', targetNodeId: 'node-avatar-2', targetPortId: 'in-image' },
      { id: 'c17', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-2', targetPortId: 'in-audio' },
      { id: 'c18', sourceNodeId: 'node-planner', sourcePortId: 'shot2_video_prompt', targetNodeId: 'node-avatar-2', targetPortId: 'in-text' },
      { id: 'c19', sourceNodeId: 'node-i2i-3', sourcePortId: 'out-image', targetNodeId: 'node-avatar-3', targetPortId: 'in-image' },
      { id: 'c20', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-3', targetPortId: 'in-audio' },
      { id: 'c21', sourceNodeId: 'node-planner', sourcePortId: 'shot3_video_prompt', targetNodeId: 'node-avatar-3', targetPortId: 'in-text' },
      { id: 'c22', sourceNodeId: 'node-i2i-4', sourcePortId: 'out-image', targetNodeId: 'node-avatar-4', targetPortId: 'in-image' },
      { id: 'c23', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-4', targetPortId: 'in-audio' },
      { id: 'c24', sourceNodeId: 'node-planner', sourcePortId: 'shot4_video_prompt', targetNodeId: 'node-avatar-4', targetPortId: 'in-text' },
      { id: 'c25', sourceNodeId: 'node-i2i-5', sourcePortId: 'out-image', targetNodeId: 'node-avatar-5', targetPortId: 'in-image' },
      { id: 'c26', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-5', targetPortId: 'in-audio' },
      { id: 'c27', sourceNodeId: 'node-planner', sourcePortId: 'shot5_video_prompt', targetNodeId: 'node-avatar-5', targetPortId: 'in-text' },
      { id: 'c36', sourceNodeId: 'node-i2i-6', sourcePortId: 'out-image', targetNodeId: 'node-avatar-6', targetPortId: 'in-image' },
      { id: 'c37', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-6', targetPortId: 'in-audio' },
      { id: 'c38', sourceNodeId: 'node-planner', sourcePortId: 'shot6_video_prompt', targetNodeId: 'node-avatar-6', targetPortId: 'in-text' },
      { id: 'c39', sourceNodeId: 'node-i2i-7', sourcePortId: 'out-image', targetNodeId: 'node-avatar-7', targetPortId: 'in-image' },
      { id: 'c40', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-7', targetPortId: 'in-audio' },
      { id: 'c41', sourceNodeId: 'node-planner', sourcePortId: 'shot7_video_prompt', targetNodeId: 'node-avatar-7', targetPortId: 'in-text' },
      { id: 'c42', sourceNodeId: 'node-i2i-8', sourcePortId: 'out-image', targetNodeId: 'node-avatar-8', targetPortId: 'in-image' },
      { id: 'c43', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-8', targetPortId: 'in-audio' },
      { id: 'c44', sourceNodeId: 'node-planner', sourcePortId: 'shot8_video_prompt', targetNodeId: 'node-avatar-8', targetPortId: 'in-text' },
      { id: 'c45', sourceNodeId: 'node-i2i-9', sourcePortId: 'out-image', targetNodeId: 'node-avatar-9', targetPortId: 'in-image' },
      { id: 'c46', sourceNodeId: 'node-audio-in', sourcePortId: 'out-audio', targetNodeId: 'node-avatar-9', targetPortId: 'in-audio' },
      { id: 'c47', sourceNodeId: 'node-planner', sourcePortId: 'shot9_video_prompt', targetNodeId: 'node-avatar-9', targetPortId: 'in-text' }
    ],
    nodes: [
      // Input nodes
      { id: 'node-char-img', toolId: 'image-input', x: 50, y: 500, status: NodeStatus.IDLE, data: { value: [] } },
      { id: 'node-audio-in', toolId: 'audio-input', x: 50, y: 700, status: NodeStatus.IDLE, data: { value: null } },
      { id: 'node-text-in', toolId: 'text-prompt', x: 50, y: 200, status: NodeStatus.IDLE, data: { value: "A professional singer performing a pop song with dynamic movements and expressions" } },
      // AI Chat Planner (Doubao Vision)
      { id: 'node-planner', toolId: 'gemini-text', x: 350, y: 400, status: NodeStatus.IDLE, data: { 
          model: 'doubao-1-5-vision-pro-32k-250115',
          mode: 'custom',
          customInstruction: `You are a professional multi-camera music video director. Your task is to analyze the input character image and optional text description, then generate detailed descriptions for 9 different camera shots for a singing performance.

CRITICAL: Character consistency is PARAMOUNT. The same character must appear in all shots with identical facial features, body shape, clothing, and appearance.

Generate 9 distinct camera shots:
1. Shot 1 - Close-up (特写): Face-focused shot showing detailed facial expressions, emotions, and lip-sync
2. Shot 2 - Medium shot (中景): Upper body shot showing head, shoulders, and some arm movements
3. Shot 3 - Wide shot (全景): Full body shot showing the entire character with background
4. Shot 4 - Top-down shot (俯拍): Overhead or high-angle shot looking down at the character
5. Shot 5 - Side angle (侧方位): Profile or 3/4 angle shot showing the character from the side
6. Shot 6 - Low angle (仰拍): Low-angle shot looking up at the character, emphasizing power and presence
7. Shot 7 - Dutch angle (倾斜角度): Tilted camera angle creating dynamic and energetic feel
8. Shot 8 - Over-shoulder (过肩): Over-the-shoulder shot showing the character from behind, creating intimacy
9. Shot 9 - Extreme close-up (极特写): Extreme close-up focusing on eyes, mouth, or specific facial features

For each shot, generate:
- shotN_image_prompt: Detailed image generation prompt that describes the character in that specific camera angle and framing, maintaining exact character consistency (same face, clothing, appearance). Include camera angle, framing, background, lighting, and character pose/expression.
- shotN_video_prompt: Detailed video action description for the digital avatar, including singing gestures, head movements, body language, facial expressions, and movements that match the song's rhythm and energy.

Output format: JSON with exactly these fields:
- shot1_image_prompt, shot1_video_prompt
- shot2_image_prompt, shot2_video_prompt
- shot3_image_prompt, shot3_video_prompt
- shot4_image_prompt, shot4_video_prompt
- shot5_image_prompt, shot5_video_prompt
- shot6_image_prompt, shot6_video_prompt
- shot7_image_prompt, shot7_video_prompt
- shot8_image_prompt, shot8_video_prompt
- shot9_image_prompt, shot9_video_prompt

IMPORTANT: 
- Maintain EXACT character consistency across all shots (same face, clothing, appearance)
- Each shot should have a distinct camera angle and framing
- Video prompts should describe natural singing movements and expressions`,
          customOutputs: [
            { id: 'shot1_image_prompt', label: 'Shot 1 Image Prompt (Close-up)', description: 'Close-up shot image description' },
            { id: 'shot1_video_prompt', label: 'Shot 1 Video Prompt', description: 'Close-up shot video action description' },
            { id: 'shot2_image_prompt', label: 'Shot 2 Image Prompt (Medium)', description: 'Medium shot image description' },
            { id: 'shot2_video_prompt', label: 'Shot 2 Video Prompt', description: 'Medium shot video action description' },
            { id: 'shot3_image_prompt', label: 'Shot 3 Image Prompt (Wide)', description: 'Wide shot image description' },
            { id: 'shot3_video_prompt', label: 'Shot 3 Video Prompt', description: 'Wide shot video action description' },
            { id: 'shot4_image_prompt', label: 'Shot 4 Image Prompt (Top-down)', description: 'Top-down shot image description' },
            { id: 'shot4_video_prompt', label: 'Shot 4 Video Prompt', description: 'Top-down shot video action description' },
            { id: 'shot5_image_prompt', label: 'Shot 5 Image Prompt (Side)', description: 'Side angle shot image description' },
            { id: 'shot5_video_prompt', label: 'Shot 5 Video Prompt', description: 'Side angle shot video action description' },
            { id: 'shot6_image_prompt', label: 'Shot 6 Image Prompt (Low angle)', description: 'Low-angle shot image description' },
            { id: 'shot6_video_prompt', label: 'Shot 6 Video Prompt', description: 'Low-angle shot video action description' },
            { id: 'shot7_image_prompt', label: 'Shot 7 Image Prompt (Dutch angle)', description: 'Dutch angle shot image description' },
            { id: 'shot7_video_prompt', label: 'Shot 7 Video Prompt', description: 'Dutch angle shot video action description' },
            { id: 'shot8_image_prompt', label: 'Shot 8 Image Prompt (Over-shoulder)', description: 'Over-shoulder shot image description' },
            { id: 'shot8_video_prompt', label: 'Shot 8 Video Prompt', description: 'Over-shoulder shot video action description' },
            { id: 'shot9_image_prompt', label: 'Shot 9 Image Prompt (Extreme close-up)', description: 'Extreme close-up shot image description' },
            { id: 'shot9_video_prompt', label: 'Shot 9 Video Prompt', description: 'Extreme close-up shot video action description' }
          ]
      } },
      // Image-to-Image nodes (9 shots)
      { id: 'node-i2i-1', toolId: 'image-to-image', x: 800, y: 50, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-2', toolId: 'image-to-image', x: 800, y: 150, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-3', toolId: 'image-to-image', x: 800, y: 250, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-4', toolId: 'image-to-image', x: 800, y: 350, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-5', toolId: 'image-to-image', x: 800, y: 450, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-6', toolId: 'image-to-image', x: 800, y: 550, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-7', toolId: 'image-to-image', x: 800, y: 650, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-8', toolId: 'image-to-image', x: 800, y: 750, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      { id: 'node-i2i-9', toolId: 'image-to-image', x: 800, y: 850, status: NodeStatus.IDLE, data: { model: 'Qwen-Image-Edit-2511', aspectRatio: '9:16' } },
      // Avatar Video nodes (9 shots)
      { id: 'node-avatar-1', toolId: 'avatar-gen', x: 1200, y: 50, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-2', toolId: 'avatar-gen', x: 1200, y: 150, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-3', toolId: 'avatar-gen', x: 1200, y: 250, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-4', toolId: 'avatar-gen', x: 1200, y: 350, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-5', toolId: 'avatar-gen', x: 1200, y: 450, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-6', toolId: 'avatar-gen', x: 1200, y: 550, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-7', toolId: 'avatar-gen', x: 1200, y: 650, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-8', toolId: 'avatar-gen', x: 1200, y: 750, status: NodeStatus.IDLE, data: {} },
      { id: 'node-avatar-9', toolId: 'avatar-gen', x: 1200, y: 850, status: NodeStatus.IDLE, data: {} }
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
  const [lightX2VVoiceList, setLightX2VVoiceList] = useState<{ voices?: any[]; emotions?: string[]; languages?: any[] } | null>(null);
  const [loadingVoiceList, setLoadingVoiceList] = useState(false);
  const voiceListLoadedRef = useRef<string>(''); // Track which URL+token combo has been loaded
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [showVoiceFilter, setShowVoiceFilter] = useState(false);
  const [voiceFilterGender, setVoiceFilterGender] = useState<string>('all');
  const [cloneVoiceList, setCloneVoiceList] = useState<any[]>([]);
  const [loadingCloneVoiceList, setLoadingCloneVoiceList] = useState(false);
  const cloneVoiceListLoadedRef = useRef<string>('');
  const [showCloneVoiceModal, setShowCloneVoiceModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiWorkflowDescription, setAIWorkflowDescription] = useState('');
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [showReplaceMenu, setShowReplaceMenu] = useState<string | null>(null);
  const [showAudioEditor, setShowAudioEditor] = useState<string | null>(null); // nodeId of audio input being edited
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const t = useCallback((key: string) => {
    return TRANSLATIONS[lang][key] || key;
  }, [lang]);

  // Helper function to get LightX2V config from env vars only
  const getLightX2VConfig = useCallback((workflow: WorkflowState | null) => {
    return {
      url: (process.env.LIGHTX2V_URL || 'https://x2v.light-ai.top').trim(),
      token: (process.env.LIGHTX2V_TOKEN || '').trim()
    };
  }, []);

  // Generate tools list description for AI
  const generateToolsDescription = useCallback(() => {
    const toolsInfo = TOOLS.map(tool => {
      const inputs = tool.inputs.map(inp => `${inp.label} (${inp.id}: ${inp.type})`).join(', ');
      const outputs = tool.outputs.map(out => `${out.label} (${out.id}: ${out.type})`).join(', ');
      const models = tool.models?.map(m => `${m.name} (${m.id})`).join(', ') || 'N/A';
      return `- ${tool.name} (${tool.id}): ${tool.description_zh || tool.description}
  Inputs: ${inputs || 'None'}
  Outputs: ${outputs || 'None'}
  Models: ${models}
  Category: ${tool.category_zh || tool.category}`;
    }).join('\n\n');
    
    return `Available Tools:\n\n${toolsInfo}`;
  }, []);

  // Check if workflow description mentions TTS or voice clone, and fetch voice list if needed
  const getVoiceListForAI = useCallback(async (description: string): Promise<string> => {
    const descLower = description.toLowerCase();
    const needsTTS = descLower.includes('tts') || descLower.includes('语音') || descLower.includes('音色') || descLower.includes('voice');
    const needsClone = descLower.includes('clone') || descLower.includes('克隆') || descLower.includes('音色克隆');
    
    if (!needsTTS && !needsClone) return '';
    
    const config = getLightX2VConfig(workflow);
    if (!config.url || !config.token) return '';
    
    let voiceInfo = '';
    
    try {
      // Get TTS voice list
      const voiceList = await lightX2VGetVoiceList(config.url, config.token);
      if (voiceList.voices && voiceList.voices.length > 0) {
        const topVoices = voiceList.voices.slice(0, 10).map((v: any) => 
          `- ${v.name || v.voice_name || v.voice_type} (${v.voice_type}): ${v.gender || 'unknown'}, version ${v.version || 'N/A'}, resource_id: ${v.resource_id || 'N/A'}`
        ).join('\n');
        voiceInfo += `\n\nAvailable TTS Voices (first 10):\n${topVoices}`;
      }
      
      // Get clone voice list if needed
      if (needsClone) {
        const cloneList = await lightX2VGetCloneVoiceList(config.url, config.token);
        if (cloneList && cloneList.length > 0) {
          const topClone = cloneList.slice(0, 10).map((v: any) => 
            `- ${v.name || v.speaker_id} (speaker_id: ${v.speaker_id})`
          ).join('\n');
          voiceInfo += `\n\nAvailable Cloned Voices (first 10):\n${topClone}`;
        }
      }
    } catch (error: any) {
      console.warn('[AI Workflow] Failed to load voice list for AI:', error);
    }
    
    return voiceInfo;
  }, [workflow, getLightX2VConfig]);

  // AI Generate Workflow function
  const generateWorkflowWithAI = useCallback(async (description: string) => {
    setIsGeneratingWorkflow(true);
    try {
      // Get tools description
      const toolsDesc = generateToolsDescription();
      
      // Get voice list if needed
      const voiceInfo = await getVoiceListForAI(description);
      
      // Build AI prompt
      const prompt = `You are a workflow design assistant. The user wants to create a workflow based on this description:

"${description}"

${toolsDesc}${voiceInfo}

Please generate a workflow in JSON format with the following structure:
{
  "nodes": [
    {
      "id": "node-1",
      "toolId": "text-prompt",
      "x": 100,
      "y": 200,
      "data": { "value": "..." }
    },
    ...
  ],
  "connections": [
    {
      "sourceNodeId": "node-1",
      "sourcePortId": "out-text",
      "targetNodeId": "node-2",
      "targetPortId": "in-text"
    },
    ...
  ],
  "name": "Generated Workflow Name"
}

Requirements:
1. Each node must have a unique id (like "node-1", "node-2", etc.)
2. toolId must match one of the available tool IDs
3. For tools with models, set data.model to one of the available model IDs
4. For TTS nodes with LightX2V, you can use any voice_type from the available voices list
5. For voice clone nodes, you can use any speaker_id from the cloned voices list
6. Position nodes with reasonable x, y coordinates (spacing: x increments by 400, y increments by 200)
7. Connect nodes logically - source outputs must match target input types
8. Use appropriate default values in data (e.g., aspectRatio for video tools)
9. Provide a descriptive name for the workflow

Output ONLY the JSON, no additional text or markdown.`;

      // Call AI to generate workflow
      const workflowJson = await deepseekText(
        prompt,
        'basic',
        undefined,
        'deepseek-v3-2-251201',
        []
      );
      
      // Parse the JSON response
      let workflowData: any;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = workflowJson.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || workflowJson.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : workflowJson;
        workflowData = JSON.parse(jsonStr);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }
      
      // Validate and create workflow
      if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
        throw new Error('Invalid workflow: nodes array is required');
      }
      
      // Create new workflow
      const newFlow: WorkflowState = {
        id: `flow-${Date.now()}`,
        name: workflowData.name || t('untitled'),
        nodes: workflowData.nodes.map((n: any, idx: number) => {
          const tool = TOOLS.find(t => t.id === n.toolId);
          const defaultData: Record<string, any> = { ...(n.data || {}) };
          
          // Set default model if tool has models
          if (tool?.models && tool.models.length > 0 && !defaultData.model) {
            defaultData.model = tool.models[0].id;
          }
          
          // Set default aspectRatio for video tools
          if (tool?.id.includes('video-gen') && !defaultData.aspectRatio) {
            defaultData.aspectRatio = "16:9";
          }
          
          // Set default value for text-prompt
          if (tool?.id === 'text-prompt' && defaultData.value === undefined) {
            defaultData.value = "";
          }
          
          return {
            id: n.id || `node-${Date.now()}-${idx}`,
            toolId: n.toolId,
            x: n.x || (idx * 400),
            y: n.y || (idx % 3 * 200),
            status: NodeStatus.IDLE,
            data: defaultData
          };
        }),
        connections: (workflowData.connections || []).map((c: any, idx: number) => ({
          id: c.id || `conn-${Date.now()}-${idx}`,
          sourceNodeId: c.sourceNodeId,
          sourcePortId: c.sourcePortId,
          targetNodeId: c.targetNodeId,
          targetPortId: c.targetPortId
        })),
        isDirty: true,
        isRunning: false,
        globalInputs: {},
        env: {
          lightx2v_url: "",
          lightx2v_token: ""
        },
        history: [],
        updatedAt: Date.now(),
        showIntermediateResults: true
      };
      
      // Set workflow and open editor
      setWorkflow(newFlow);
      setCurrentView('EDITOR');
      setShowAIGenerateModal(false);
      setAIWorkflowDescription('');
      
      // Reset view to show all nodes
      if (newFlow.nodes.length > 0) {
        const avgX = newFlow.nodes.reduce((sum, n) => sum + n.x, 0) / newFlow.nodes.length;
        const avgY = newFlow.nodes.reduce((sum, n) => sum + n.y, 0) / newFlow.nodes.length;
        setView({ x: -avgX + 400, y: -avgY + 300, zoom: 1 });
      }
      
    } catch (error: any) {
      console.error('[AI Workflow] Generation failed:', error);
      alert(`Failed to generate workflow: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingWorkflow(false);
    }
  }, [generateToolsDescription, getVoiceListForAI, t]);

  // Helper functions for voice selection
  const isFemaleVoice = useCallback((voiceType: string) => {
    return voiceType?.toLowerCase().includes('female') || false;
  }, []);

  const getLanguageDisplayName = useCallback((langCode: string) => {
    const languageMap: Record<string, string> = {
      'chinese': '中文',
      'en_us': '美式英语',
      'en_gb': '英式英语',
      'en_au': '澳洲英语',
      'es': '西语',
      'ja': '日语'
    };
    return languageMap[langCode] || langCode;
  }, []);

  // Filter voices based on search and filters
  const filteredVoices = useMemo(() => {
    if (!lightX2VVoiceList?.voices) return [];
    
    let filtered = lightX2VVoiceList.voices;
    
    // Filter by search query
    if (voiceSearchQuery.trim()) {
      const query = voiceSearchQuery.toLowerCase();
      filtered = filtered.filter((voice: any) => 
        (voice.name || voice.voice_name || voice.voice_type || '').toLowerCase().includes(query) ||
        (voice.voice_type || '').toLowerCase().includes(query)
      );
    }
    
    // Filter by gender
    if (voiceFilterGender !== 'all') {
      filtered = filtered.filter((voice: any) => 
        voice.gender === voiceFilterGender || 
        (voiceFilterGender === 'female' && isFemaleVoice(voice.voice_type)) ||
        (voiceFilterGender === 'male' && !isFemaleVoice(voice.voice_type))
      );
    }
    
    return filtered;
  }, [lightX2VVoiceList, voiceSearchQuery, voiceFilterGender, isFemaleVoice]);

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

  // Load voice list when tts node is selected and model is lightx2v
  useEffect(() => {
    const loadVoiceList = async () => {
      if (!selectedNodeId || !workflow) return;
      const node = workflow.nodes.find(n => n.id === selectedNodeId);
      if (!node || node.toolId !== 'tts') return;
      
      // Only load voice list if model is lightx2v
      const isLightX2V = node.data.model === 'lightx2v' || node.data.model?.startsWith('lightx2v');
      if (!isLightX2V) return;
      
      // Get config from env vars only
      const config = getLightX2VConfig(workflow);
      
      // Check if we have required env vars
      if (!config.url || !config.token) {
        console.warn('[LightX2V] Missing URL or token for voice list');
        return;
      }

      // Create a key to track if we've loaded for this URL+token combination
      const loadKey = `${config.url}:${config.token}`;
      
      // Don't reload if already loaded for this combination and not currently loading
      // But allow reload if the ref was reset (e.g., when switching models)
      if (voiceListLoadedRef.current === loadKey && !loadingVoiceList && voiceListLoadedRef.current !== '') return;

      setLoadingVoiceList(true);
      try {
        const voiceData = await lightX2VGetVoiceList(
          config.url,
          config.token
        );
        setLightX2VVoiceList(voiceData);
        voiceListLoadedRef.current = loadKey;
        console.log('[LightX2V] Voice list loaded:', voiceData);
        
        // Auto-match resource_id for all tts nodes with lightx2v model that need it
        if (workflow && voiceData.voices && voiceData.voices.length > 0) {
          workflow.nodes.forEach(node => {
            const isLightX2V = node.data.model === 'lightx2v' || node.data.model?.startsWith('lightx2v');
            if (node.toolId === 'tts' && isLightX2V && node.data.voiceType) {
              const matchingVoice = voiceData.voices.find((v: any) => v.voice_type === node.data.voiceType);
              if (matchingVoice?.resource_id) {
                // Only update if resourceId is empty, wrong, or missing
                if (!node.data.resourceId || node.data.resourceId !== matchingVoice.resource_id) {
                  updateNodeData(node.id, 'resourceId', matchingVoice.resource_id);
                  console.log(`[LightX2V] Auto-matched resource_id: ${matchingVoice.resource_id} for voice: ${node.data.voiceType}`);
                }
              }
            }
          });
        }
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        console.error('[LightX2V] Failed to load voice list:', errorMessage, error);
        // Set to empty object to prevent retrying on every selection
        setLightX2VVoiceList({ voices: [], emotions: [], languages: [] });
        // Still mark as loaded to prevent retrying immediately
        voiceListLoadedRef.current = loadKey;
        // Optionally show user-friendly error (you can add a toast/notification here)
      } finally {
        setLoadingVoiceList(false);
      }
    };

      loadVoiceList();
  }, [selectedNodeId, workflow, workflow?.nodes.find(n => n.id === selectedNodeId)?.data?.model]);

  // Load clone voice list when voice clone node is selected
  useEffect(() => {
    const loadCloneVoiceList = async () => {
      if (!selectedNodeId || !workflow) return;
      const node = workflow.nodes.find(n => n.id === selectedNodeId);
      if (!node || node.toolId !== 'lightx2v-voice-clone') return;
      
      // Get config from env vars only
      const config = getLightX2VConfig(workflow);
      
      // Check if we have required env vars
      if (!config.url || !config.token) {
        console.warn('[LightX2V] Missing URL or token for clone voice list');
        return;
      }

      // Create a key to track if we've loaded for this URL+token combination
      const loadKey = `${config.url}:${config.token}`;
      
      // Don't reload if already loaded for this combination and not currently loading
      if (cloneVoiceListLoadedRef.current === loadKey && !loadingCloneVoiceList && cloneVoiceListLoadedRef.current !== '') return;

      setLoadingCloneVoiceList(true);
      try {
        const voices = await lightX2VGetCloneVoiceList(
          config.url,
          config.token
        );
        setCloneVoiceList(voices || []);
        cloneVoiceListLoadedRef.current = loadKey;
        console.log('[LightX2V] Clone voice list loaded:', voices, `Total: ${voices?.length || 0} voices`);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        console.error('[LightX2V] Failed to load clone voice list:', errorMessage, error);
        setCloneVoiceList([]);
        cloneVoiceListLoadedRef.current = loadKey;
        // Show error to user
        alert(`Failed to load clone voice list: ${errorMessage}`);
      } finally {
        setLoadingCloneVoiceList(false);
      }
    };

    loadCloneVoiceList();
  }, [selectedNodeId, workflow, getLightX2VConfig]);
  
  // Reset voice list when switching models or nodes
  useEffect(() => {
    if (!selectedNodeId || !workflow) return;
    const node = workflow.nodes.find(n => n.id === selectedNodeId);
    if (!node || node.toolId !== 'tts') {
      // Clear search/filter when not on tts node
      setVoiceSearchQuery('');
      setShowVoiceFilter(false);
      setVoiceFilterGender('all');
      return;
    }
    
    const isLightX2V = node.data.model === 'lightx2v' || node.data.model?.startsWith('lightx2v');
    
    // If switching to gemini (or away from lightx2v), clear search/filter states
    if (!isLightX2V) {
      setVoiceSearchQuery('');
      setShowVoiceFilter(false);
      setVoiceFilterGender('all');
      // Reset loaded ref so voice list will reload when switching back to lightx2v
      voiceListLoadedRef.current = '';
    }
  }, [selectedNodeId, workflow?.nodes.find(n => n.id === selectedNodeId)?.data?.model]);

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
    setLightX2VVoiceList(null); // Reset voice list when switching workflows
    voiceListLoadedRef.current = ''; // Reset loaded key
    setCloneVoiceList([]); // Reset clone voice list
    cloneVoiceListLoadedRef.current = ''; // Reset clone voice list loaded key
    setWorkflow({ ...w, isDirty: false, isRunning: false, env: w.env || { lightx2v_url: '', lightx2v_token: '' } });
    setCurrentView('EDITOR');
  };

  const createNewWorkflow = () => {
    setSelectedRunId(null);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setValidationErrors([]);
    setActiveOutputs({});
    setLightX2VVoiceList(null); // Reset voice list when creating new workflow
    voiceListLoadedRef.current = ''; // Reset loaded key
    setCloneVoiceList([]); // Reset clone voice list
    cloneVoiceListLoadedRef.current = ''; // Reset clone voice list loaded key
    
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
    if (tool.id === 'tts') {
      // Set default model if not provided
      if (!defaultData.model) {
        defaultData.model = 'lightx2v';
      }
      // Set defaults based on model
      if (defaultData.model === 'lightx2v' || defaultData.model?.startsWith('lightx2v')) {
        // LightX2V defaults
      if (!defaultData.voiceType) defaultData.voiceType = 'zh_female_vv_uranus_bigtts';
      if (!defaultData.emotionScale) defaultData.emotionScale = 3;
      if (!defaultData.speechRate) defaultData.speechRate = 0;
      if (!defaultData.pitch) defaultData.pitch = 0;
      if (!defaultData.loudnessRate) defaultData.loudnessRate = 0;
        if (!defaultData.resourceId) {
          defaultData.resourceId = ""; // Will be matched from voice list
        }
      } else {
        // Gemini defaults
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
      // Set default model if not provided
      if (!defaultData.model) {
        defaultData.model = 'deepseek-v3-2-251201';
      }
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

  // Close replace menu when clicking outside
  useEffect(() => {
    if (!showReplaceMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.replace-menu-container')) {
        setShowReplaceMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showReplaceMenu]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    if (selectedRunId) setSelectedRunId(null);
    setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.filter(n => n.id !== selectedNodeId), connections: prev.connections.filter(c => c.sourceNodeId !== selectedNodeId && c.targetNodeId !== selectedNodeId), isDirty: true }) : null);
    setSelectedNodeId(null);
  }, [selectedNodeId, selectedRunId]);

  // Get compatible tools for replacement (same output count and types)
  const getReplaceableTools = useCallback((nodeId: string): ToolDefinition[] => {
    if (!workflow) return [];
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return [];
    
    const currentNodeOutputs = getNodeOutputs(node);
    const outputTypes = currentNodeOutputs.map(o => o.type);
    const outputCount = currentNodeOutputs.length;
    
    // Find all tools with matching output count and types
    return TOOLS.filter(tool => {
      // Skip the current tool itself
      if (tool.id === node.toolId) return false;
      
      // For gemini-text with customOutputs, check if it has the same number of outputs
      if (tool.id === 'gemini-text') {
        // If current node is also gemini-text, allow replacement (customOutputs can be different)
        if (node.toolId === 'gemini-text') {
          return true;
        }
        // Otherwise, only allow if gemini-text can have the same number of outputs
        // Since gemini-text can have dynamic outputs, we allow it if output count matches
        return true; // Allow replacement, but will be validated in replaceNode
      }
      
      // For current node being gemini-text, only allow tools with matching output count
      if (node.toolId === 'gemini-text') {
        // Check if tool has the same number of outputs
        if (tool.outputs.length !== outputCount) return false;
        // Check if all output types match (gemini-text outputs are all TEXT)
        return tool.outputs.every((out, idx) => out.type === outputTypes[idx]);
      }
      
      // Check if output count matches
      if (tool.outputs.length !== outputCount) return false;
      
      // Check if all output types match
      return tool.outputs.every((out, idx) => out.type === outputTypes[idx]);
    });
  }, [workflow]);

  // Replace a node with another compatible tool
  const replaceNode = useCallback((nodeId: string, newToolId: string) => {
    if (!workflow) return;
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newTool = TOOLS.find(t => t.id === newToolId);
    if (!newTool) return;
    
    // Get current node outputs
    const currentNodeOutputs = getNodeOutputs(node);
    
    // Handle gemini-text special case (dynamic outputs)
    let newToolOutputs: Port[] = [];
    if (newToolId === 'gemini-text') {
      // If replacing with gemini-text, preserve customOutputs if they exist
      if (node.toolId === 'gemini-text' && node.data.customOutputs) {
        newToolOutputs = node.data.customOutputs.map((o: any) => ({ ...o, type: DataType.TEXT }));
      } else {
        // Otherwise, use default outputs (empty for gemini-text)
        newToolOutputs = [];
      }
    } else {
      newToolOutputs = newTool.outputs;
    }
    
    // Check if outputs are compatible
    if (currentNodeOutputs.length !== newToolOutputs.length) return;
    const isCompatible = currentNodeOutputs.every((out, idx) => {
      if (idx >= newToolOutputs.length) return false;
      return out.type === newToolOutputs[idx].type;
    });
    if (!isCompatible) return;
    
    // Create a mapping of old output port IDs to new ones
    const outputPortMap: Record<string, string> = {};
    currentNodeOutputs.forEach((oldOut, idx) => {
      if (idx < newToolOutputs.length) {
        outputPortMap[oldOut.id] = newToolOutputs[idx].id;
      }
    });
    
    // Update the node
    setWorkflow(prev => {
      if (!prev) return null;
      
      // Create new node with new tool
      const newNode: WorkflowNode = {
        ...node,
        toolId: newToolId,
        data: {
          ...node.data,
          // Reset model if the new tool doesn't have models
          model: newTool.models && newTool.models.length > 0 ? (newTool.models[0].id || node.data.model) : undefined,
          // Preserve customOutputs if replacing with gemini-text and current node has them
          customOutputs: (newToolId === 'gemini-text' && node.toolId === 'gemini-text' && node.data.customOutputs) ? node.data.customOutputs : (newToolId === 'gemini-text' ? undefined : node.data.customOutputs)
        },
        status: NodeStatus.IDLE,
        error: undefined,
        executionTime: undefined,
        startTime: undefined
      };
      
      // Update connections: map old output port IDs to new ones
      const updatedConnections = prev.connections.map(conn => {
        if (conn.sourceNodeId === nodeId) {
          const newSourcePortId = outputPortMap[conn.sourcePortId];
          if (newSourcePortId) {
            return { ...conn, sourcePortId: newSourcePortId };
          }
          // If no mapping found, remove the connection
          return null;
        }
        return conn;
      }).filter((c): c is Connection => c !== null);
      
      return {
        ...prev,
        nodes: prev.nodes.map(n => n.id === nodeId ? newNode : n),
        connections: updatedConnections,
        isDirty: true
      };
    });
    
    setShowReplaceMenu(null);
  }, [workflow]);

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
      const config = getLightX2VConfig(workflow);
      if (!config.url?.trim() || !config.token?.trim()) {
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
    
    // Reset pause state when starting a new workflow
    setIsPaused(false);
    isPausedRef.current = false;
    
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
    
    // If running from a specific node, preserve outputs from nodes that won't be re-run
    // Otherwise, clear all outputs for a fresh start
    if (startNodeId) {
      Object.entries(activeOutputs).forEach(([nodeId, val]) => {
        if (!nodesToRunIds.has(nodeId)) sessionOutputs[nodeId] = val;
      });
      setActiveOutputs(prev => {
        const next = { ...prev };
        nodesToRunIds.forEach(id => delete next[id]);
        return next;
      });
    } else {
      // Full workflow run: clear all outputs to prevent memory accumulation
      setActiveOutputs({});
    }

    // Get LightX2V config once at the start of workflow execution
    const lightX2VConfig = getLightX2VConfig(workflow);

    try {
      // Execute nodes in parallel by layer, with max 3 concurrent executions
      const MAX_CONCURRENT = 3;
      
      while (executedInSession.size < workflow.nodes.filter(n => nodesToRunIds.has(n.id)).length) {
        // Check if workflow is paused, wait until resumed
        while (isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
          // Check if workflow is still running (might have been stopped)
          const currentWorkflow = workflow;
          if (!currentWorkflow?.isRunning) {
            return;
          }
        }
        
        // Find all nodes ready to execute (all inputs are ready)
        const readyNodes: typeof workflow.nodes = [];
        for (const node of workflow.nodes) {
          if (!nodesToRunIds.has(node.id) || executedInSession.has(node.id)) continue;
          const tool = TOOLS.find(t => t.id === node.toolId)!;
          const incomingConns = workflow.connections.filter(c => c.targetNodeId === node.id);
          const inputsReady = incomingConns.every(c => !nodesToRunIds.has(c.sourceNodeId) || executedInSession.has(c.sourceNodeId));

          if (inputsReady) {
            readyNodes.push(node);
          }
        }

        // If no nodes are ready, break to avoid infinite loop
        if (readyNodes.length === 0) break;

        // Execute ready nodes in batches of MAX_CONCURRENT
        for (let i = 0; i < readyNodes.length; i += MAX_CONCURRENT) {
          // Check pause state before starting each batch
          while (isPausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const currentWorkflow = workflow;
            if (!currentWorkflow?.isRunning) {
              return;
            }
          }
          
          const batch = readyNodes.slice(i, i + MAX_CONCURRENT);
          
          // Execute batch in parallel
          const executionPromises = batch.map(async (node) => {
            const tool = TOOLS.find(t => t.id === node.toolId)!;
            const incomingConns = workflow.connections.filter(c => c.targetNodeId === node.id);
            const nodeStart = performance.now();
            
            // Update node status to RUNNING
            setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: NodeStatus.RUNNING, startTime: nodeStart } : n) }) : null);
            
            try {
              const nodeInputs: Record<string, any> = {};
              tool.inputs.forEach(port => {
                const conns = incomingConns.filter(c => c.targetPortId === port.id);
                if (conns.length > 0) {
                  const values = conns.map(c => {
                  // First check if source node has executed and has output in sessionOutputs
                  if (sessionOutputs[c.sourceNodeId] !== undefined) {
                    const sourceRes = sessionOutputs[c.sourceNodeId];
                    return (typeof sourceRes === 'object' && sourceRes !== null && c.sourcePortId in sourceRes) ? sourceRes[c.sourcePortId] : sourceRes;
                  }
                  // If not executed yet, check if it's an input node and read from node.data.value
                  // This handles the case where input nodes haven't been executed but their values are needed
                  const sourceNode = workflow.nodes.find(n => n.id === c.sourceNodeId);
                  if (sourceNode) {
                    const sourceTool = TOOLS.find(t => t.id === sourceNode.toolId);
                    if (sourceTool?.category === 'Input') {
                      // For input nodes, read directly from node.data.value
                      const inputValue = sourceNode.data.value;
                      // Check if this is a multi-output node (like gemini-text with customOutputs)
                      if (sourceNode.toolId === 'gemini-text' && sourceNode.data.customOutputs && typeof inputValue === 'object' && inputValue !== null) {
                        return c.sourcePortId in inputValue ? inputValue[c.sourcePortId] : inputValue;
                      }
                      return inputValue;
                    }
                    // For other nodes that haven't executed, try to read from previously executed outputs
                    // This handles nodes that were executed in previous runs
                    const prevOutput = activeOutputs[c.sourceNodeId];
                    if (prevOutput !== undefined) {
                      return (typeof prevOutput === 'object' && prevOutput !== null && c.sourcePortId in prevOutput) ? prevOutput[c.sourcePortId] : prevOutput;
                    }
              }
              return undefined;
            }).filter(v => v !== undefined).flat();
              nodeInputs[port.id] = values.length === 1 ? values[0] : values.length > 0 ? values : undefined;
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
                  // Use DeepSeek for deepseek models, Doubao for doubao models, otherwise use Gemini
                  if (model && model.startsWith('deepseek-')) {
                    result = await deepseekText(nodeInputs['in-text'] || "...", node.data.mode, node.data.customInstruction, model, outputFields);
                  } else if (model && model.startsWith('doubao-')) {
                    const imageInput = nodeInputs['in-image'];
                    result = await doubaoText(nodeInputs['in-text'] || "...", node.data.mode, node.data.customInstruction, model, outputFields, imageInput);
                  } else {
                  result = await geminiText(nodeInputs['in-text'] || "...", false, node.data.mode, node.data.customInstruction, model, outputFields); 
                  }
                  break;
                case 'text-to-image':
                  if (model === 'gemini-2.5-flash-image') {
                    result = await geminiImage(nodeInputs['in-text'] || "Artistic portrait", undefined, node.data.aspectRatio, model);
                  } else {
                    result = await lightX2VTask(
                      lightX2VConfig.url, 
                      lightX2VConfig.token, 
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
                    // For Gemini, if multiple images are provided, combine them intelligently
                    const geminiImgs = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'] : (nodeInputs['in-image'] ? [nodeInputs['in-image']] : []);
                    result = await geminiImage(nodeInputs['in-text'] || "Transform", geminiImgs.length > 0 ? geminiImgs : undefined, node.data.aspectRatio || "1:1", model);
                  } else {
                    // For LightX2V i2i, handle multiple images for storyboard workflow:
                    // - If multiple images provided, first is previous scene, others are character reference
                    // - Use previous scene as base image for continuity
                    // - Character consistency should be emphasized in the prompt (from AI planner)
                    const i2iImgs = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'] : (nodeInputs['in-image'] ? [nodeInputs['in-image']] : []);
                    // Use the first image (previous scene) as base for continuity, character info is in prompt
                    const baseImg = i2iImgs.length > 0 ? i2iImgs[0] : undefined;
                    result = await lightX2VTask(
                      lightX2VConfig.url, 
                      lightX2VConfig.token, 
                      'i2i', 
                      model || 'Qwen-Image-Edit-2511', 
                      nodeInputs['in-text'] || "",
                      baseImg,
                      undefined, undefined,
                      'output_image',
                      node.data.aspectRatio
                    );
                  }
                  break;
                case 'gemini-watermark-remover':
                  const watermarkImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                  if (!watermarkImg) throw new Error("Image input is required for watermark removal");
                  result = await removeGeminiWatermark(watermarkImg);
                  break;
                case 'tts': 
                  // Determine which service to use based on model
                  const isLightX2V = model === 'lightx2v' || model?.startsWith('lightx2v');
                  
                  if (isLightX2V) {
                    // Use LightX2V TTS
                    const voiceTypeToUse = node.data.voiceType || 'zh_female_vv_uranus_bigtts';
                    let resourceIdToUse = node.data.resourceId;
                    
                    // Always try to match resource_id from voice list to ensure correctness
                    if (lightX2VVoiceList?.voices && lightX2VVoiceList.voices.length > 0) {
                      const matchingVoice = lightX2VVoiceList.voices.find((v: any) => v.voice_type === voiceTypeToUse);
                      if (matchingVoice?.resource_id) {
                        resourceIdToUse = matchingVoice.resource_id;
                        // Update node data with correct resource_id for future use
                        if (!node.data.resourceId || node.data.resourceId !== resourceIdToUse) {
                          updateNodeData(node.id, 'resourceId', resourceIdToUse);
                          console.log(`[LightX2V] Matched resource_id: ${resourceIdToUse} for voice: ${voiceTypeToUse}`);
                        }
                      } else {
                        console.warn(`[LightX2V] No matching voice found for voice_type: ${voiceTypeToUse}`);
                      }
                    } else {
                      console.warn(`[LightX2V] Voice list not loaded, using stored resourceId: ${resourceIdToUse || 'none'}`);
                    }
                    
                    // Fallback to default if still not found
                    if (!resourceIdToUse) {
                      resourceIdToUse = "seed-tts-1.0";
                      console.warn(`[LightX2V] Using fallback resourceId: ${resourceIdToUse}`);
                    }
                    
                    const contextTone = nodeInputs['in-context-tone'] || "";
                  result = await lightX2VTTS(
                      lightX2VConfig.url,
                      lightX2VConfig.token,
                    nodeInputs['in-text'] || "",
                      voiceTypeToUse,
                      contextTone,
                    node.data.emotion || "",
                    node.data.emotionScale || 3,
                    node.data.speechRate || 0,
                    node.data.pitch || 0,
                    node.data.loudnessRate || 0,
                      resourceIdToUse
                    );
                  } else {
                    // Use Gemini TTS
                    const contextTone = nodeInputs['in-context-tone'] || "";
                    result = await geminiSpeech(
                      nodeInputs['in-text'] || "Script", 
                      node.data.voice || "Kore", 
                      model || 'gemini-2.5-flash-preview-tts', 
                      contextTone
                    );
                  }
                  break;
                case 'lightx2v-voice-clone':
                  // Use selected speaker_id from node data
                  const speakerId = node.data.speakerId;
                  
                  if (!speakerId) {
                    throw new Error("Please select a cloned voice. Use the node settings to choose or create a new cloned voice.");
                  }
                  
                  // Generate TTS with cloned voice
                  const ttsText = nodeInputs['in-tts-text'] || nodeInputs['in-text'] || "";
                  if (!ttsText) throw new Error("TTS text is required");
                  result = await lightX2VVoiceCloneTTS(
                    lightX2VConfig.url,
                    lightX2VConfig.token,
                    ttsText,
                    speakerId,
                    node.data.style || "正常",
                    node.data.speed || 1.0,
                    node.data.volume || 0,
                    node.data.pitch || 0,
                    node.data.language || "ZH_CN"
                  );
                  break;
                case 'video-gen-text': 
                  result = await lightX2VTask(
                    lightX2VConfig.url, 
                    lightX2VConfig.token, 
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
                    lightX2VConfig.url, 
                    lightX2VConfig.token, 
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
                        lightX2VConfig.url, 
                        lightX2VConfig.token, 
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
                  
                  // Use LightX2V animate task for wan2.2_animate model, otherwise use Gemini
                  if (model === 'wan2.2_animate') {
                    result = await lightX2VTask(
                      lightX2VConfig.url, 
                      lightX2VConfig.token, 
                      'animate', 
                      model, 
                      nodeInputs['in-text'] || "",
                      swapImg,
                      undefined, undefined,
                      'output_video',
                      node.data.aspectRatio,
                      swapVid
                    );
                  } else {
                  result = await geminiVideo(nodeInputs['in-text'] || "Swap character", swapImg, "16:9", "720p", swapVid, model);
                  }
                  break;
                case 'avatar-gen': 
                  const avatarImg = Array.isArray(nodeInputs['in-image']) ? nodeInputs['in-image'][0] : nodeInputs['in-image'];
                  const avatarAudio = Array.isArray(nodeInputs['in-audio']) ? nodeInputs['in-audio'][0] : nodeInputs['in-audio'];
                  result = await lightX2VTask(
                    lightX2VConfig.url, 
                    lightX2VConfig.token, 
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
            
            // Store result in sessionOutputs (need to handle race condition)
            // Use a function to safely update sessionOutputs
            return { nodeId: node.id, result, duration: nodeDuration };
            } catch (err: any) {
              const nodeDuration = performance.now() - nodeStart;
              if (err.message?.includes("Requested entity was not found")) {
                await (window as any).aistudio.openSelectKey();
              }
              setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === node.id ? { ...n, status: NodeStatus.ERROR, error: err.message || 'Unknown execution error', executionTime: nodeDuration } : n) }) : null);
            throw { nodeId: node.id, error: err, duration: nodeDuration };
          }
          });

          // Wait for all nodes in this batch to complete
          const results = await Promise.allSettled(executionPromises);
          
          // Process results and update state - batch updates to reduce re-renders
          const successfulResults: Array<{ nodeId: string; result: any; duration: number }> = [];
          const failedNodes: Array<{ nodeId: string; error: any; duration: number }> = [];
          
          results.forEach((settledResult, index) => {
            const node = batch[index];
            if (settledResult.status === 'fulfilled') {
              const { nodeId, result, duration } = settledResult.value;
              sessionOutputs[nodeId] = result;
              setActiveOutputs(prev => ({ ...prev, [nodeId]: result }));
              setWorkflow(prev => prev ? ({ ...prev, nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, status: NodeStatus.SUCCESS, executionTime: duration } : n) }) : null);
              executedInSession.add(nodeId);
            } else {
              const errorInfo = settledResult.reason;
              if (errorInfo && errorInfo.error) {
                // Error was already handled in the catch block, just mark as executed
                executedInSession.add(errorInfo.nodeId);
                failedNodes.push({ nodeId: errorInfo.nodeId, error: errorInfo.error, duration: errorInfo.duration || 0 });
              } else {
                // Unhandled error
                const nodeDuration = performance.now() - (node.startTime || performance.now());
                failedNodes.push({ nodeId: node.id, error: 'Unknown execution error', duration: nodeDuration });
                executedInSession.add(node.id);
              }
            }
          });
          
          // Batch update state for successful results
          if (successfulResults.length > 0) {
            setActiveOutputs(prev => {
              const next = { ...prev };
              successfulResults.forEach(({ nodeId, result }) => {
                next[nodeId] = result;
              });
              return next;
            });
            
            setWorkflow(prev => {
              if (!prev) return null;
              const updatedNodes = [...prev.nodes];
              successfulResults.forEach(({ nodeId, duration }) => {
                const index = updatedNodes.findIndex(n => n.id === nodeId);
                if (index >= 0) {
                  updatedNodes[index] = { ...updatedNodes[index], status: NodeStatus.SUCCESS, executionTime: duration };
                }
              });
              return { ...prev, nodes: updatedNodes };
            });
          }
          
          // Batch update state for failed nodes
          if (failedNodes.length > 0) {
            setWorkflow(prev => {
              if (!prev) return null;
              const updatedNodes = [...prev.nodes];
              failedNodes.forEach(({ nodeId, error, duration }) => {
                const index = updatedNodes.findIndex(n => n.id === nodeId);
                if (index >= 0) {
                  updatedNodes[index] = { ...updatedNodes[index], status: NodeStatus.ERROR, error, executionTime: duration };
                }
              });
              return { ...prev, nodes: updatedNodes };
            });
          }
        }
      }
      const runTotalTime = performance.now() - runStartTime;
      
      // Optimize history storage: only keep essential data, limit history size
      // Create a lightweight snapshot without deep copying all node data
      const lightweightNodesSnapshot = workflow.nodes.map(n => ({
        id: n.id,
        toolId: n.toolId,
        x: n.x,
        y: n.y,
        status: n.status,
        data: { ...n.data }, // Shallow copy of data
        error: n.error,
        executionTime: n.executionTime
      }));
      
      const newRun: GenerationRun = { 
        id: `run-${Date.now()}`, 
        timestamp: Date.now(), 
        outputs: { ...sessionOutputs }, 
        nodesSnapshot: lightweightNodesSnapshot,
        totalTime: runTotalTime 
      };
      
      // Limit history to 5 runs to reduce memory usage (was 10)
      setWorkflow(prev => prev ? ({ ...prev, history: [newRun, ...prev.history].slice(0, 5) }) : null);
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
              <button onClick={() => setShowAIGenerateModal(true)} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                <Sparkle size={18}/> {t('ai_generate_workflow')}
              </button>
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

        {/* AI Generate Workflow Modal */}
        {showAIGenerateModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowAIGenerateModal(false)}>
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900/95 backdrop-blur-[40px] border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkle size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200">{t('ai_generate_workflow')}</h3>
                </div>
                <button onClick={() => setShowAIGenerateModal(false)} className="w-9 h-9 flex items-center justify-center bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-full transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      {t('describe_workflow')}
                    </label>
                    <textarea
                      value={aiWorkflowDescription}
                      onChange={e => setAIWorkflowDescription(e.target.value)}
                      placeholder={lang === 'zh' ? '例如：创建一个工作流，首先用AI生成一段文字，然后转换为语音，最后生成一个数字人视频...' : 'e.g., Create a workflow that generates text with AI, converts it to speech, and then creates a digital avatar video...'}
                      className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {lang === 'zh' ? '详细描述您想要创建的工作流，包括使用的工具、步骤和连接关系。AI会根据您的描述自动生成完整的工作流。' : 'Describe your desired workflow in detail, including the tools, steps, and connections. AI will automatically generate the complete workflow based on your description.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
                <button
                  onClick={() => {
                    setShowAIGenerateModal(false);
                    setAIWorkflowDescription('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all"
                  disabled={isGeneratingWorkflow}
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateWorkflowWithAI(aiWorkflowDescription)}
                  disabled={!aiWorkflowDescription.trim() || isGeneratingWorkflow}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingWorkflow ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      {t('generating_workflow')}
                    </>
                  ) : (
                    <>
                      <Sparkle size={16} />
                      {t('generate_workflow')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
          {workflow.isRunning && (
            <button 
              onClick={() => {
                const newPausedState = !isPaused;
                setIsPaused(newPausedState);
                isPausedRef.current = newPausedState;
              }} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all ${isPaused ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'} active:scale-95`}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? (lang === 'zh' ? '继续' : 'Resume') : (lang === 'zh' ? '暂停' : 'Pause')}
            </button>
          )}
          <button onClick={() => runWorkflow()} disabled={workflow.isRunning && !isPaused} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all ${workflow.isRunning && !isPaused ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'}`}>{workflow.isRunning && !isPaused ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}{workflow.isRunning && !isPaused ? t('executing') : t('run_fabric')}</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-72 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-xl flex flex-col z-30 overflow-y-auto p-4 space-y-8">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{t('tool_palette')}</h3>
           {['Input', 'AI Model', 'Image Processing'].map(cat => (
             <div key={cat} className="space-y-2.5">
               <span className="text-[9px] text-slate-600 font-black uppercase">{lang === 'zh' ? (cat === 'Input' ? '输入' : cat === 'AI Model' ? 'AI 模型' : '图像处理') : cat}</span>
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
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 replace-menu-container">
                      <div className="relative">
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setShowReplaceMenu(showReplaceMenu === node.id ? null : node.id);
                          }}
                          className="p-2 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all active:scale-90"
                          title={lang === 'zh' ? '替换节点' : 'Replace Node'}
                        >
                          <RefreshCw size={16} />
                        </button>
                        {showReplaceMenu === node.id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-64 overflow-y-auto custom-scrollbar">
                            {getReplaceableTools(node.id).length > 0 ? (
                              getReplaceableTools(node.id).map(replaceTool => (
                                <button
                                  key={replaceTool.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    replaceNode(node.id, replaceTool.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-indigo-500/20 hover:text-white transition-colors flex items-center gap-2"
                                >
                                  <div className="p-1 rounded bg-slate-700">
                                    {React.createElement(getIcon(replaceTool.icon), { size: 12 })}
                                  </div>
                                  <span>{lang === 'zh' ? replaceTool.name_zh : replaceTool.name}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                {lang === 'zh' ? '没有可替换的工具' : 'No replaceable tools'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          deleteSelectedNode();
                          setShowReplaceMenu(null);
                        }}
                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                                        const base64s = await Promise.all(files.map((file: File) => new Promise<string>((resolve) => {
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
                                   <div className="flex items-center gap-1">
                                      {node.toolId === 'audio-input' && (
                                        <button 
                                          onClick={() => setShowAudioEditor(node.id)} 
                                          className="p-1 text-slate-600 hover:text-indigo-400 transition-colors"
                                          title={lang === 'zh' ? '编辑音频' : 'Edit Audio'}
                                        >
                                          <Edit3 size={10}/>
                                        </button>
                                      )}
                                      <button onClick={() => updateNodeData(node.id, 'value', null)} className="p-1 text-slate-600 hover:text-red-400"><X size={10}/></button>
                                   </div>
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
                              preload="none"
                              loading="lazy"
                              onMouseOver={e => {
                                const video = e.currentTarget;
                                if (video.readyState < 2) {
                                  video.load();
                                }
                                video.play().catch(() => {});
                              }} 
                              onMouseOut={e => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }}
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
                  {selectedNode.toolId === 'tts' && (() => {
                    const isLightX2V = selectedNode.data.model === 'lightx2v' || selectedNode.data.model?.startsWith('lightx2v');
                    
                    // Gemini TTS settings
                    if (!isLightX2V) {
                      return (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-black uppercase">{t('voice')}</span>
                          <select value={selectedNode.data.voice || 'Kore'} onChange={e => updateNodeData(selectedNode.id, 'voice', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700">
                        {['Kore', 'Puck', 'Fenrir', 'Charon', 'Zephyr'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                      );
                    }
                    
                    // LightX2V TTS settings
                    return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase">Voice Type</span>
                        {loadingVoiceList ? (
                          <div className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700 text-slate-400 text-center">
                            Loading voices...
                          </div>
                        ) : lightX2VVoiceList?.voices && lightX2VVoiceList.voices.length > 0 ? (
                          <div className="space-y-3">
                            {/* Search and Filter */}
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                                <input
                                  type="text"
                                  value={voiceSearchQuery}
                                  onChange={e => setVoiceSearchQuery(e.target.value)}
                                  placeholder="Search voices..."
                                  className="w-full bg-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs border border-slate-700 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <button
                                onClick={() => setShowVoiceFilter(!showVoiceFilter)}
                                className={`px-3 py-2 bg-slate-800 rounded-xl text-xs border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 ${showVoiceFilter ? 'border-indigo-500 bg-slate-700' : ''}`}
                              >
                                <ListPlus className="w-3 h-3" />
                                Filter
                              </button>
                            </div>

                            {/* Filter Panel */}
                            {showVoiceFilter && (
                              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-black uppercase">Gender</span>
                                  <select
                                    value={voiceFilterGender}
                                    onChange={e => setVoiceFilterGender(e.target.value)}
                                    className="w-full bg-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-700 text-slate-300"
                                  >
                                    <option value="all">All</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Voice Cards Grid */}
                            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 max-h-[400px] overflow-y-auto">
                              {filteredVoices.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                  No voices found matching your criteria
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {filteredVoices.map((voice: any, index: number) => {
                                    const uniqueKey = voice.voice_type 
                                      ? `${voice.voice_type}_${voice.resource_id || ''}_${index}`
                                      : `voice_${index}`;
                                    const isSelected = selectedNode.data.voiceType === voice.voice_type;
                                    
                                    return (
                                      <label
                                        key={uniqueKey}
                                        className={`relative cursor-pointer m-0 p-3 rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                                            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name="voice-selection"
                                          value={voice.voice_type}
                                          checked={isSelected}
                                          onChange={() => {
                                            updateNodeData(selectedNode.id, 'voiceType', voice.voice_type);
                                            if (voice.resource_id) {
                                              updateNodeData(selectedNode.id, 'resourceId', voice.resource_id);
                                            }
                                          }}
                                          className="sr-only"
                                        />
                                        {voice.version === '2.0' && (
                                          <div className="absolute top-1 right-1 px-1 py-0.5 bg-indigo-500/90 text-white text-[7px] font-semibold rounded z-10">
                                            v2.0
                                          </div>
                                        )}
                                        {isSelected && (
                                          <div className="absolute bottom-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center z-20">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                          </div>
                                        )}
                                        <div className="text-xs font-medium text-slate-200 text-center truncate w-full pt-1">
                                          {voice.name || voice.voice_name || voice.voice_type}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                        <input 
                          type="text" 
                          value={selectedNode.data.voiceType || 'zh_female_vv_uranus_bigtts'} 
                          onChange={e => updateNodeData(selectedNode.id, 'voiceType', e.target.value)} 
                          className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          placeholder="zh_female_vv_uranus_bigtts"
                        />
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase">Emotion</span>
                        {lightX2VVoiceList?.emotions && lightX2VVoiceList.emotions.length > 0 ? (
                          <select 
                            value={selectedNode.data.emotion || ''} 
                            onChange={e => updateNodeData(selectedNode.id, 'emotion', e.target.value)} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700"
                          >
                            <option value="">None</option>
                            {lightX2VVoiceList.emotions.map((emotion: string, index: number) => (
                              <option key={`emotion_${emotion}_${index}`} value={emotion}>{emotion}</option>
                            ))}
                          </select>
                        ) : (
                        <input 
                          type="text" 
                          value={selectedNode.data.emotion || ''} 
                          onChange={e => updateNodeData(selectedNode.id, 'emotion', e.target.value)} 
                          className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          placeholder="Optional emotion"
                        />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Emotion Scale (1-5)</span>
                          <input 
                            type="number" 
                            min="1" 
                            max="5" 
                            value={selectedNode.data.emotionScale || 3} 
                            onChange={e => updateNodeData(selectedNode.id, 'emotionScale', parseInt(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Speech Rate (-50~100)</span>
                          <input 
                            type="number" 
                            min="-50" 
                            max="100" 
                            value={selectedNode.data.speechRate || 0} 
                            onChange={e => updateNodeData(selectedNode.id, 'speechRate', parseInt(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Pitch (-12~12)</span>
                          <input 
                            type="number" 
                            min="-12" 
                            max="12" 
                            value={selectedNode.data.pitch || 0} 
                            onChange={e => updateNodeData(selectedNode.id, 'pitch', parseInt(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Loudness (-50~100)</span>
                          <input 
                            type="number" 
                            min="-50" 
                            max="100" 
                            value={selectedNode.data.loudnessRate || 0} 
                            onChange={e => updateNodeData(selectedNode.id, 'loudnessRate', parseInt(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                      </div>
                    </div>
                    );
                  })()}
                  {selectedNode.toolId === 'lightx2v-voice-clone' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Cloned Voice</span>
                          <button
                            onClick={() => setShowCloneVoiceModal(true)}
                            className="px-2 py-1 text-[9px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded border border-indigo-500/30 transition-all"
                          >
                            + New
                          </button>
                        </div>
                        {loadingCloneVoiceList ? (
                          <div className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700 text-slate-400 text-center">
                            Loading voices...
                          </div>
                        ) : cloneVoiceList.length > 0 ? (
                          <select 
                            value={selectedNode.data.speakerId || ''} 
                            onChange={e => updateNodeData(selectedNode.id, 'speakerId', e.target.value)} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700"
                          >
                            <option value="">Select a cloned voice...</option>
                            {cloneVoiceList.map((voice: any) => (
                              <option key={voice.speaker_id} value={voice.speaker_id}>
                                {voice.name || voice.speaker_id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400">
                            No cloned voices found. Click "+ New" to create one.
                          </div>
                        )}
                        {selectedNode.data.speakerId && (
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <span className="text-[9px] text-emerald-400 font-mono">ID: {selectedNode.data.speakerId}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase">Style</span>
                        <input 
                          type="text" 
                          value={selectedNode.data.style || '正常'} 
                          onChange={e => updateNodeData(selectedNode.id, 'style', e.target.value)} 
                          className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          placeholder="正常"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Speed (0.5~2.0)</span>
                          <input 
                            type="number" 
                            step="0.1"
                            min="0.5" 
                            max="2.0" 
                            value={selectedNode.data.speed || 1.0} 
                            onChange={e => updateNodeData(selectedNode.id, 'speed', parseFloat(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Volume (-12~12)</span>
                          <input 
                            type="number" 
                            min="-12" 
                            max="12" 
                            value={selectedNode.data.volume || 0} 
                            onChange={e => updateNodeData(selectedNode.id, 'volume', parseFloat(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Pitch (-24~24)</span>
                          <input 
                            type="number" 
                            min="-24" 
                            max="24" 
                            value={selectedNode.data.pitch || 0} 
                            onChange={e => updateNodeData(selectedNode.id, 'pitch', parseFloat(e.target.value))} 
                            className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700" 
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Language</span>
                          <select value={selectedNode.data.language || 'ZH_CN'} onChange={e => updateNodeData(selectedNode.id, 'language', e.target.value)} className="w-full bg-slate-800 rounded-xl p-3 text-xs border border-slate-700">
                            {['ZH_CN', 'EN_US', 'ZH_CN_SICHUAN', 'ZH_CN_HK'].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      {selectedNode.data.speakerId && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                          <span className="text-[10px] text-emerald-400 font-black uppercase">Speaker ID: </span>
                          <span className="text-[10px] text-slate-400 font-mono">{selectedNode.data.speakerId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
             </div>
           ) : (
             <div className="space-y-12">
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
                       )
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

      {/* AI Generate Workflow Modal */}
      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowAIGenerateModal(false)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900/95 backdrop-blur-[40px] border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkle size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200">{t('ai_generate_workflow')}</h3>
              </div>
              <button onClick={() => setShowAIGenerateModal(false)} className="w-9 h-9 flex items-center justify-center bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-full transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    {t('describe_workflow')}
                  </label>
                  <textarea
                    value={aiWorkflowDescription}
                    onChange={e => setAIWorkflowDescription(e.target.value)}
                    placeholder={lang === 'zh' ? '例如：创建一个工作流，首先用AI生成一段文字，然后转换为语音，最后生成一个数字人视频...' : 'e.g., Create a workflow that generates text with AI, converts it to speech, and then creates a digital avatar video...'}
                    className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    {lang === 'zh' ? '详细描述您想要创建的工作流，包括使用的工具、步骤和连接关系。AI会根据您的描述自动生成完整的工作流。' : 'Describe your desired workflow in detail, including the tools, steps, and connections. AI will automatically generate the complete workflow based on your description.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
              <button
                onClick={() => {
                  setShowAIGenerateModal(false);
                  setAIWorkflowDescription('');
                }}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all"
                disabled={isGeneratingWorkflow}
              >
                Cancel
              </button>
              <button
                onClick={() => generateWorkflowWithAI(aiWorkflowDescription)}
                disabled={!aiWorkflowDescription.trim() || isGeneratingWorkflow}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingWorkflow ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    {t('generating_workflow')}
                  </>
                ) : (
                  <>
                    <Sparkle size={16} />
                    {t('generate_workflow')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Voice Modal */}
      {showCloneVoiceModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setShowCloneVoiceModal(false)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900/95 backdrop-blur-[40px] border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <h3 className="text-xl font-semibold text-slate-200">Clone Voice</h3>
              <button onClick={() => setShowCloneVoiceModal(false)} className="w-9 h-9 flex items-center justify-center bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-full transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CloneVoiceModalContent
                onClose={(newSpeakerId?: string) => {
                  setShowCloneVoiceModal(false);
                  // Reload clone voice list after closing
                  const config = getLightX2VConfig(workflow);
                  if (config.url && config.token) {
                    lightX2VGetCloneVoiceList(config.url, config.token).then(voices => {
                      setCloneVoiceList(voices);
                      cloneVoiceListLoadedRef.current = `${config.url}:${config.token}`;
                      // Auto-select the newly created voice in the current node if applicable
                      if (newSpeakerId && selectedNodeId && workflow) {
                        const node = workflow.nodes.find(n => n.id === selectedNodeId);
                        if (node && node.toolId === 'lightx2v-voice-clone') {
                          updateNodeData(selectedNodeId, 'speakerId', newSpeakerId);
                        }
                      }
                    }).catch(err => console.error('[LightX2V] Failed to reload clone voice list:', err));
                  }
                }}
                lightX2VConfig={getLightX2VConfig(workflow)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Editor Modal */}
      {showAudioEditor && workflow && (() => {
        const node = workflow.nodes.find(n => n.id === showAudioEditor);
        if (!node || node.toolId !== 'audio-input' || !node.data.value) return null;
        return (
          <AudioEditorModal
            nodeId={showAudioEditor}
            audioData={node.data.value}
            onClose={() => setShowAudioEditor(null)}
            onSave={(trimmedAudio) => {
              updateNodeData(showAudioEditor, 'value', trimmedAudio);
              setShowAudioEditor(null);
            }}
            lang={lang}
          />
        );
      })()}
    </div>
  );
};

// Audio Editor Modal Component
const AudioEditorModal: React.FC<{
  nodeId: string;
  audioData: string;
  onClose: () => void;
  onSave: (trimmedAudio: string) => void;
  lang: 'en' | 'zh';
}> = ({ nodeId, audioData, onClose, onSave, lang }) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [draggingStart, setDraggingStart] = useState(false);
  const [draggingEnd, setDraggingEnd] = useState(false);
  const [trimmedAudioUrl, setTrimmedAudioUrl] = useState<string | null>(null);
  const [trimmedDuration, setTrimmedDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trimmedAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playbackBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load audio and create buffer
    const audio = new Audio(audioData);
    audioRef.current = audio;
    
    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      setDuration(dur);
      setEndTime(dur);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= endTime) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Load audio buffer for waveform
    fetch(audioData)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return audioContext.decodeAudioData(arrayBuffer);
      })
      .then(buffer => {
        setAudioBuffer(buffer);
        // Generate waveform data
        const samples = 200; // Number of bars in waveform
        const sampleRate = buffer.sampleRate;
        const samplesPerBar = Math.floor(buffer.length / samples);
        const waveform: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            const index = i * samplesPerBar + j;
            if (index < buffer.length) {
              const channelData = buffer.getChannelData(0);
              sum += Math.abs(channelData[index]);
            }
          }
          waveform.push(sum / samplesPerBar);
        }
        setWaveformData(waveform);
      })
      .catch(err => console.error('Failed to load audio buffer:', err));

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioData]);

  useEffect(() => {
    // Draw waveform
    if (!canvasRef.current || waveformData.length === 0 || duration === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const maxAmplitude = Math.max(...waveformData, 0.001);

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((amplitude, index) => {
      const barHeight = (amplitude / maxAmplitude) * height * 0.7;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      // Highlight selected region
      const timePerBar = duration / waveformData.length;
      const barStartTime = index * timePerBar;
      const barEndTime = (index + 1) * timePerBar;
      
      if (barStartTime >= startTime && barEndTime <= endTime) {
        ctx.fillStyle = '#3b82f6'; // Blue for selected
      } else {
        ctx.fillStyle = '#d1d5db'; // Light gray for unselected
      }
      
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw current time indicator
    if (isPlaying && duration > 0) {
      const timeRatio = trimmedAudioUrl ? (currentTime / trimmedDuration) : (currentTime / duration);
      const indicatorX = timeRatio * width;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(indicatorX, 0);
      ctx.lineTo(indicatorX, height);
      ctx.stroke();
    }

    // Draw start/end markers with draggable handles
    if (duration > 0 && !trimmedAudioUrl) {
      const startX = (startTime / duration) * width;
      const endX = (endTime / duration) * width;
      
      // Draw selected region background
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      // Draw start handle
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(startX - 2, 0, 4, height);
      // Draw handle circle
      ctx.beginPath();
      ctx.arc(startX, height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw end handle
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(endX - 2, 0, 4, height);
      // Draw handle circle
      ctx.beginPath();
      ctx.arc(endX, height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [waveformData, startTime, endTime, duration, isPlaying, currentTime, trimmedAudioUrl, trimmedDuration]);

  const handlePlay = () => {
    const audio = trimmedAudioUrl ? trimmedAudioRef.current : audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (trimmedAudioUrl) {
        audio.currentTime = 0;
      } else {
        audio.currentTime = startTime;
      }
      audio.play();
      setIsPlaying(true);
    }
  };

  // Handle playback for trimmed audio
  useEffect(() => {
    if (!trimmedAudioRef.current) return;
    const audio = trimmedAudioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [trimmedAudioUrl]);

  const handleTrim = async () => {
    if (!audioBuffer || startTime >= endTime) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = endSample - startSample;
      
      if (length <= 0) {
        alert(lang === 'zh' ? '请选择有效的剪辑范围' : 'Please select a valid trim range');
        return;
      }
      
      // Create new buffer with trimmed audio
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        length,
        sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          newData[i] = oldData[startSample + i];
        }
      }
      
      // Convert to WAV
      const wav = audioBufferToWav(newBuffer);
      const base64 = arrayBufferToBase64(wav);
      const dataUrl = `data:audio/wav;base64,${base64}`;
      
      // Set trimmed audio for preview
      setTrimmedAudioUrl(dataUrl);
      setTrimmedDuration(endTime - startTime);
      setCurrentTime(0);
      
      // Don't close, allow user to preview trimmed audio
      // onSave(dataUrl);
      // onClose();
    } catch (error: any) {
      console.error('Failed to trim audio:', error);
      alert(lang === 'zh' ? '剪辑失败: ' + error.message : 'Trim failed: ' + error.message);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const startX = (startTime / duration) * width;
    const endX = (endTime / duration) * width;
    
    // Check if clicking on start handle (within 20px)
    if (Math.abs(x - startX) < 20) {
      setDraggingStart(true);
      e.preventDefault();
      return;
    }
    
    // Check if clicking on end handle (within 20px)
    if (Math.abs(x - endX) < 20) {
      setDraggingEnd(true);
      e.preventDefault();
      return;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || duration === 0) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const time = ratio * duration;
      
      if (draggingStart) {
        setStartTime(Math.min(Math.max(0, time), endTime));
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      } else if (draggingEnd) {
        setEndTime(Math.min(Math.max(time, startTime), duration));
      }
    };

    const handleMouseUp = () => {
      setDraggingStart(false);
      setDraggingEnd(false);
    };

    if (draggingStart || draggingEnd) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingStart, draggingEnd, duration, endTime, startTime]);

  const handlePlaybackBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playbackBarRef.current) return;
    const rect = playbackBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const audio = trimmedAudioUrl ? trimmedAudioRef.current : audioRef.current;
    if (audio) {
      if (trimmedAudioUrl) {
        audio.currentTime = ratio * trimmedDuration;
      } else {
        audio.currentTime = startTime + ratio * (endTime - startTime);
      }
      setCurrentTime(audio.currentTime);
    }
  };

  const displayDuration = trimmedAudioUrl ? trimmedDuration : duration;
  const displayCurrentTime = trimmedAudioUrl ? currentTime : (currentTime - startTime);
  const displayStartTime = trimmedAudioUrl ? 0 : startTime;
  const displayEndTime = trimmedAudioUrl ? trimmedDuration : endTime;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">{lang === 'zh' ? '音频剪辑' : 'Audio Editor'}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="px-8 py-6 space-y-8">
          {/* Waveform Track */}
          <div className="space-y-3">
            <div ref={containerRef} className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={120}
                onMouseDown={handleMouseDown}
                className="w-full h-24 bg-gray-50 rounded-2xl border border-gray-200"
                style={{ cursor: draggingStart || draggingEnd ? 'grabbing' : 'grab' }}
              />
            </div>
            
            {!trimmedAudioUrl && (
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>{formatTime(startTime)}</span>
                <span className="text-gray-400">{formatTime(endTime - startTime)}</span>
                <span>{formatTime(endTime)}</span>
              </div>
            )}
          </div>

          {/* Playback Bar */}
          <div className="space-y-2">
            <div 
              ref={playbackBarRef}
              onClick={handlePlaybackBarClick}
              className="relative h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
            >
              <div 
                className="absolute h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatTime(displayCurrentTime)}</span>
              <span>{formatTime(displayDuration)}</span>
            </div>
          </div>

          {/* Hidden audio elements */}
          {!trimmedAudioUrl && (
            <audio ref={audioRef} src={audioData} />
          )}
          {trimmedAudioUrl && (
            <audio ref={trimmedAudioRef} src={trimmedAudioUrl} />
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            
            {trimmedAudioUrl ? (
              <>
                <button
                  onClick={() => {
                    setTrimmedAudioUrl(null);
                    setTrimmedDuration(0);
                    setCurrentTime(0);
                    setIsPlaying(false);
                  }}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  {lang === 'zh' ? '重新剪辑' : 'Re-edit'}
                </button>
                <button
                  onClick={() => {
                    if (trimmedAudioUrl) {
                      onSave(trimmedAudioUrl);
                      onClose();
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  {lang === 'zh' ? '保存' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={handleTrim}
                disabled={startTime >= endTime || Math.abs(endTime - startTime) < 0.1}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                {lang === 'zh' ? '应用剪辑' : 'Apply Trim'}
              </button>
            )}
            
            <button
              onClick={handlePlay}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? (lang === 'zh' ? '暂停' : 'Pause') : (lang === 'zh' ? '播放' : 'Play')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for audio processing
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Clone Voice Modal Content Component
const CloneVoiceModalContent: React.FC<{
  onClose: (newSpeakerId?: string) => void;
  lightX2VConfig: { url: string; token: string };
}> = ({ onClose, lightX2VConfig }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioText, setAudioText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleClone = async () => {
    if (!audioFile) {
      alert('Please select an audio file first');
      return;
    }
    if (!lightX2VConfig.url || !lightX2VConfig.token) {
      alert('LightX2V configuration is missing');
      return;
    }

    setIsProcessing(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      // Clone voice
      const cloneResult = await lightX2VVoiceClone(
        lightX2VConfig.url,
        lightX2VConfig.token,
        base64,
        audioText || undefined
      );
      const cloneData = JSON.parse(cloneResult);

      // Save voice with name
      if (voiceName.trim()) {
        const response = await fetch(`${lightX2VConfig.url.replace(/\/$/, '')}/api/v1/voice/clone/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lightX2VConfig.token}`
          },
          body: JSON.stringify({
            speaker_id: cloneData.speaker_id,
            name: voiceName.trim()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save voice name');
        }
      }

      const newSpeakerId = cloneData.speaker_id;
      alert('Voice cloned successfully!');
      onClose(newSpeakerId);
    } catch (error: any) {
      console.error('Clone error:', error);
      alert(`Clone failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Audio File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 transition-all text-slate-400 hover:text-slate-200"
          >
            {audioFile ? audioFile.name : 'Click to select audio or video file'}
          </button>
          {audioUrl && (
            <audio src={audioUrl} controls className="w-full mt-2 rounded-lg" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Audio Text (Optional)
          </label>
          <textarea
            value={audioText}
            onChange={e => setAudioText(e.target.value)}
            placeholder="Enter the text content of the audio for better accuracy..."
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Voice Name (Optional)
          </label>
          <input
            type="text"
            value={voiceName}
            onChange={e => setVoiceName(e.target.value)}
            placeholder="Give this voice a name..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleClone}
          disabled={!audioFile || isProcessing}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Clone Voice'}
        </button>
      </div>
    </div>
  );
};

export default App;
