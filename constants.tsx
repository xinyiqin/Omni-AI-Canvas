
import { ToolDefinition, DataType } from './types';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'text-prompt',
    name: 'Text Input',
    name_zh: '文本输入',
    category: 'Input',
    category_zh: '输入',
    description: 'Provide starting text for the workflow',
    description_zh: '为工作流提供初始文本',
    inputs: [],
    outputs: [{ id: 'out-text', type: DataType.TEXT, label: 'Text' }],
    icon: 'Type'
  },
  {
    id: 'image-input',
    name: 'Image Input',
    name_zh: '图像输入',
    category: 'Input',
    category_zh: '输入',
    description: 'Upload one or more images as workflow input',
    description_zh: '上传一张或多张图片作为输入',
    inputs: [],
    outputs: [{ id: 'out-image', type: DataType.IMAGE, label: 'Image(s)' }],
    icon: 'Image'
  },
  {
    id: 'audio-input',
    name: 'Audio Input',
    name_zh: '音频输入',
    category: 'Input',
    category_zh: '输入',
    description: 'Upload an audio file as workflow input',
    description_zh: '上传音频文件作为输入',
    inputs: [],
    outputs: [{ id: 'out-audio', type: DataType.AUDIO, label: 'Audio' }],
    icon: 'Volume2'
  },
  {
    id: 'video-input',
    name: 'Video Input',
    name_zh: '视频输入',
    category: 'Input',
    category_zh: '输入',
    description: 'Upload a video file as workflow input',
    description_zh: '上传视频文件作为输入',
    inputs: [],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'Video'
  },
  {
    id: 'gemini-text',
    name: 'AI Chat (LLM)',
    name_zh: 'AI 对话 (大模型)',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Advanced reasoning and generation with multiple text outputs',
    description_zh: '具备高级推理能力的大语言模型',
    inputs: [{ id: 'in-text', type: DataType.TEXT, label: 'Prompt' }],
    outputs: [], // Dynamically managed via node.data.customOutputs
    icon: 'Cpu',
    models: [
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' }
    ]
  },
  {
    id: 'web-search',
    name: 'Web Search',
    name_zh: '联网搜索',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Search the web for real-time information grounding',
    description_zh: '在互联网上搜索实时信息进行校对',
    inputs: [{ id: 'in-text', type: DataType.TEXT, label: 'Search Query' }],
    outputs: [{ id: 'out-text', type: DataType.TEXT, label: 'Search Results' }],
    icon: 'Globe',
    models: [
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' }
    ]
  },
  {
    id: 'text-to-image',
    name: 'Text-to-Image',
    name_zh: '文生图',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate images from text descriptions using Gemini or LightX2V',
    description_zh: '根据文本描述生成图像 (可选 Gemini 或 LightX2V)',
    inputs: [{ id: 'in-text', type: DataType.TEXT, label: 'Prompt' }],
    outputs: [{ id: 'out-image', type: DataType.IMAGE, label: 'Image' }],
    icon: 'Sparkles',
    models: [
      { id: 'Qwen-Image-2512', name: 'LightX2V (Qwen Image 2.5)' },
      { id: 'gemini-2.5-flash-image', name: 'Gemini (Flash Image)' }
    ]
  },
  {
    id: 'image-to-image',
    name: 'Image-to-Image',
    name_zh: '图生图',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Edit or transform images with text using Gemini or LightX2V',
    description_zh: '通过文本编辑或转换图像 (可选 Gemini 或 LightX2V)',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Reference Image' },
      { id: 'in-text', type: DataType.TEXT, label: 'Edit Prompt' }
    ],
    outputs: [{ id: 'out-image', type: DataType.IMAGE, label: 'Result' }],
    icon: 'Palette',
    models: [
      { id: 'Qwen-Image-Edit-2511', name: 'LightX2V (Qwen Image Edit)' },
      { id: 'gemini-2.5-flash-image', name: 'Gemini (Flash Image)' }
    ]
  },
  {
    id: 'gemini-tts',
    name: 'TTS (Speech)',
    name_zh: '语音合成 (TTS)',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Natural text-to-speech conversion using Gemini or LightX2V',
    description_zh: '将文本转换为自然的人声语音 (可选 Gemini 或 LightX2V)',
    inputs: [
      { id: 'in-text', type: DataType.TEXT, label: 'TTS Text' },
      { id: 'in-tone', type: DataType.TEXT, label: 'Tone Instruction (Opt)' }
    ],
    outputs: [{ id: 'out-audio', type: DataType.AUDIO, label: 'Audio' }],
    icon: 'Volume2',
    models: [
      { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 TTS' },
      { id: 'lightx2v-seed-tts', name: 'LightX2V (Seed-TTS)' }
    ]
  },
  {
    id: 'video-gen-text',
    name: 'Text-to-Video',
    name_zh: '文生视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video from text (Wan 2.2)',
    description_zh: '根据文本生成视频短片 (Wan 2.2)',
    inputs: [{ id: 'in-text', type: DataType.TEXT, label: 'Prompt' }],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'Video',
    models: [
      { id: 'Wan2.2_T2V_A14B_distilled', name: 'Wan 2.2 T2V' }
    ]
  },
  {
    id: 'video-gen-image',
    name: 'Image-to-Video',
    name_zh: '图生视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video from a starting image (Wan 2.2)',
    description_zh: '以起始图像生成动感视频 (Wan 2.2)',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Start Frame' },
      { id: 'in-text', type: DataType.TEXT, label: 'Motion Prompt' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'Clapperboard',
    models: [
      { id: 'Wan2.2_I2V_A14B_distilled', name: 'Wan 2.2 I2V' }
    ]
  },
  {
    id: 'video-gen-dual-frame',
    name: 'Start & End Frame Video',
    name_zh: '首尾帧视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video with start and end frame constraints (Wan 2.2)',
    description_zh: '通过首尾两张图像及其描述生成过渡视频 (Wan 2.2)',
    inputs: [
      { id: 'in-image-start', type: DataType.IMAGE, label: 'Start Frame' },
      { id: 'in-image-end', type: DataType.IMAGE, label: 'End Frame' },
      { id: 'in-text', type: DataType.TEXT, label: 'Prompt (Optional)' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'FastForward',
    models: [
      { id: 'Wan2.2_I2V_A14B_distilled', name: 'Wan 2.2 I2V' }
    ]
  },
  {
    id: 'avatar-gen',
    name: 'Digital Avatar (S2V)',
    name_zh: '数字人 (音频驱动)',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Speech-to-Video talking avatar powered by LightX2V SekoTalk',
    description_zh: '基于音频驱动的数字人播报视频',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Portrait Image' },
      { id: 'in-audio', type: DataType.AUDIO, label: 'Voice Audio' },
      { id: 'in-text', type: DataType.TEXT, label: 'Optional Prompt' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Avatar Video' }],
    icon: 'UserCircle',
    models: [
      { id: 'SekoTalk', name: 'SekoTalk' }
    ]
  },
  {
    id: 'character-swap',
    name: 'Character Swap',
    name_zh: '角色替换',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Replace characters in a video with a reference image',
    description_zh: '将视频中的角色替换为参考图中的形象',
    inputs: [
      { id: 'in-video', type: DataType.VIDEO, label: 'Original Video' },
      { id: 'in-image', type: DataType.IMAGE, label: 'Character Image' },
      { id: 'in-text', type: DataType.TEXT, label: 'Description' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Swapped Video' }],
    icon: 'UserCog',
    models: [
      { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' }
    ]
  }
];
