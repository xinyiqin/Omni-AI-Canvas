
import { ToolDefinition, DataType } from './types';

/**
 * Check if an environment variable is set (non-empty)
 * Vite replaces process.env.XXX with JSON.stringify(value) at build time
 * - If env var is set: becomes "actual-value"
 * - If env var is not set and has || '': becomes ""
 * - If env var is not set without || '': becomes "undefined" (string)
 */
const hasEnvVar = (key: string): boolean => {
  try {
    // @ts-ignore - process.env is defined by Vite's define config
    const value = process.env[key];
    // Check if value exists, is not empty, and is not the string "undefined"
    return typeof value === 'string' && value.trim() !== '' && value !== 'undefined';
  } catch {
    return false;
  }
};

import { ModelDefinition } from './types';

/**
 * Get the filtered models based on available API keys
 */
const getFilteredModels = (models: ModelDefinition[]): ModelDefinition[] => {
  return models.filter(model => {
    // Map model IDs to their required environment variables
    const modelEnvMap: Record<string, string[]> = {
      'gemini-3-pro-preview': ['GEMINI_API_KEY', 'API_KEY'],
      'gemini-3-flash-preview': ['GEMINI_API_KEY', 'API_KEY'],
      'gemini-2.5-flash-image': ['GEMINI_API_KEY', 'API_KEY'],
      'gemini-2.5-flash-preview-tts': ['GEMINI_API_KEY', 'API_KEY'],
      'deepseek-v3-2-251201': ['DEEPSEEK_API_KEY'],
      'doubao-1-5-vision-pro-32k-250115': ['DEEPSEEK_API_KEY'],
      'ppchat-gemini-2.5-pro': ['PPCHAT_API_KEY'],
      'ppchat-gemini-3-pro-preview': ['PPCHAT_API_KEY'],
      'lightx2v': ['LIGHTX2V_TOKEN'],
    };

    const requiredEnvVars = modelEnvMap[model.id];
    if (!requiredEnvVars) {
      // If model is not in the map, show it by default (e.g., LightX2V models that don't need API keys)
      return true;
    }

    // Check if at least one of the required env vars is set
    return requiredEnvVars.some(key => hasEnvVar(key));
  });
};

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
    id: 'text-generation',
    name: 'AI Chat (LLM)',
    name_zh: '文本生成 (大模型)',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Advanced reasoning and generation with multiple text outputs',
    description_zh: '基于大语言模型的高级推理和文本生成能力',
    inputs: [
      { id: 'in-text', type: DataType.TEXT, label: 'Prompt' },
      { id: 'in-image', type: DataType.IMAGE, label: 'Image (Optional)' }
    ],
    outputs: [], // Dynamically managed via node.data.customOutputs
    icon: 'Cpu',
    defaultParams: {
      mode: 'basic',
      customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
    },
    models: getFilteredModels([
      { 
        id: 'deepseek-v3-2-251201', 
        name: 'DeepSeek V3.2',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      },
      { 
        id: 'doubao-seed-1-6-vision-250815', 
        name: 'Doubao Seed 1.6',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      },
      { 
        id: 'ppchat-gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      },
      { 
        id: 'ppchat-gemini-3-pro-preview', 
        name: 'Gemini 3 Pro',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      },
      { 
        id: 'gemini-3-pro-preview', 
        name: 'Gemini 3 Pro',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      },
      { 
        id: 'gemini-3-flash-preview', 
        name: 'Gemini 3 Flash',
        defaultParams: {
          mode: 'basic',
          customOutputs: [{ id: 'out-text', label: '执行结果', description: 'Main text response.' }]
        }
      }
    ])
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
    defaultParams: {
      aspectRatio: '1:1'
    },
    models: getFilteredModels([
      { 
        id: 'Qwen-Image-2512', 
        name: 'LightX2V (Qwen Image 2.5)',
        defaultParams: {
          aspectRatio: '1:1'
        }
      },
      { 
        id: 'gemini-2.5-flash-image', 
        name: 'Gemini (Flash Image)',
        defaultParams: {
          aspectRatio: '1:1'
        }
      }
    ])
  },
  {
    id: 'image-to-image',
    name: 'Image-to-Image',
    name_zh: '图生图',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Edit or transform images with text using Gemini or LightX2V',
    description_zh: '通过文本编辑或转换图像',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Reference Image' },
      { id: 'in-text', type: DataType.TEXT, label: 'Edit Prompt' }
    ],
    outputs: [{ id: 'out-image', type: DataType.IMAGE, label: 'Result' }],
    icon: 'Palette',
    defaultParams: {
      aspectRatio: '1:1'
    },
    models: getFilteredModels([
      { 
        id: 'Qwen-Image-Edit-2511', 
        name: 'LightX2V (Qwen Image Edit 2511)',
        defaultParams: {
          aspectRatio: '1:1'
        }
      },
      { 
        id: 'gemini-2.5-flash-image', 
        name: 'Gemini (Flash Image)',
        defaultParams: {
          aspectRatio: '1:1'
        }
      }
    ])
  },
  {
    id: 'tts',
    name: 'TTS (Speech)',
    name_zh: '语音合成 (TTS)',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Text-to-speech conversion',
    description_zh: '使用 Gemini 或 LightX2V 进行语音合成',
    inputs: [
      { id: 'in-text', type: DataType.TEXT, label: 'TTS Text' },
      { id: 'in-context-tone', type: DataType.TEXT, label: 'Context & Tone (Opt)' }
    ],
    outputs: [{ id: 'out-audio', type: DataType.AUDIO, label: 'Audio' }],
    icon: 'Volume2',
    defaultParams: {
      model: 'lightx2v'
    },
    models: getFilteredModels([
      { 
        id: 'lightx2v', 
        name: 'LightX2V TTS',
        defaultParams: {
          voiceType: 'zh_female_vv_uranus_bigtts',
          emotionScale: 3,
          speechRate: 0,
          pitch: 0,
          loudnessRate: 0,
          resourceId: ''
        }
      },
      { 
        id: 'gemini-2.5-flash-preview-tts', 
        name: 'Gemini 2.5 TTS',
        defaultParams: {
          voice: 'Kore'
        }
      }
    ])
  },
  {
    id: 'lightx2v-voice-clone',
    name: 'Voice Clone',
    name_zh: '音色克隆',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Clone voice from audio and generate TTS with cloned voice',
    description_zh: '从音频克隆音色，并使用克隆的音色生成语音',
    inputs: [
      { id: 'in-tts-text', type: DataType.TEXT, label: 'TTS Text' }
    ],
    outputs: [{ id: 'out-audio', type: DataType.AUDIO, label: 'Audio' }],
    icon: 'Mic',
    defaultParams: {
      style: '正常',
      speed: 1.0,
      volume: 0,
      pitch: 0,
      language: 'ZH_CN'
    },
    models: []
  },
  {
    id: 'video-gen-text',
    name: 'Text-to-Video',
    name_zh: '文生视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video from text',
    description_zh: '根据文本生成视频短片',
    inputs: [{ id: 'in-text', type: DataType.TEXT, label: 'Prompt' }],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'Video',
    defaultParams: {
      aspectRatio: '16:9'
    },
    models: [
      { 
        id: 'Wan2.2_T2V_A14B_distilled', 
        name: 'Wan 2.2 T2V',
        defaultParams: {
          aspectRatio: '16:9'
        }
      }
    ]
  },
  {
    id: 'video-gen-image',
    name: 'Image-to-Video',
    name_zh: '图生视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video from a starting image',
    description_zh: '以起始图像生成动感视频',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Start Frame' },
      { id: 'in-text', type: DataType.TEXT, label: 'Motion Prompt' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'Clapperboard',
    defaultParams: {
      aspectRatio: '16:9'
    },
    models: [
      { 
        id: 'Wan2.2_I2V_A14B_distilled', 
        name: 'Wan 2.2 I2V',
        defaultParams: {
          aspectRatio: '16:9'
        }
      }
    ]
  },
  {
    id: 'video-gen-dual-frame',
    name: 'Start & End Frame Video',
    name_zh: '首尾帧视频',
    category: 'AI Model',
    category_zh: 'AI 模型',
    description: 'Generate video with start and end frame constraints (Wan 2.2)',
    description_zh: '通过首尾两张图像及其描述生成过渡视频',
    inputs: [
      { id: 'in-image-start', type: DataType.IMAGE, label: 'Start Frame' },
      { id: 'in-image-end', type: DataType.IMAGE, label: 'End Frame' },
      { id: 'in-text', type: DataType.TEXT, label: 'Prompt (Optional)' }
    ],
    outputs: [{ id: 'out-video', type: DataType.VIDEO, label: 'Video' }],
    icon: 'FastForward',
    defaultParams: {
      aspectRatio: '16:9'
    },
    models: [
      { 
        id: 'Wan2.2_I2V_A14B_distilled', 
        name: 'Wan 2.2 I2V',
        defaultParams: {
          aspectRatio: '16:9'
        }
      }
    ]
  },
  {
    id: 'avatar-gen',
    name: 'Digital Avatar (Lip Sync)',
    name_zh: '数字人 (口型对齐)',
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
      { id: 'wan2.2_animate', name: 'Wan 2.2 Animate' },
      { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' }
    ]
  },
  {
    id: 'gemini-watermark-remover',
    name: 'Gemini Watermark Remover',
    name_zh: 'Gemini 图片水印去除',
    category: 'Image Processing',
    category_zh: '图像处理',
    description: 'Remove watermarks from Gemini AI generated images using Reverse Alpha Blending',
    description_zh: '使用反向 Alpha 混合算法去除 Gemini AI 生成图片的水印',
    inputs: [
      { id: 'in-image', type: DataType.IMAGE, label: 'Image with Watermark' }
    ],
    outputs: [{ id: 'out-image', type: DataType.IMAGE, label: 'Image without Watermark' }],
    icon: 'Eraser',
    models: []
  }
];
