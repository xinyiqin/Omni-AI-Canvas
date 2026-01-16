
import { GoogleGenAI, Modality, Type } from "@google/genai";

export interface OutputField {
  id: string;
  description: string;
}

/**
 * Helper to wrap raw 16-bit mono PCM data in a WAV (RIFF) header.
 * Necessary because external APIs like LightX2V often expect a valid audio container.
 */
const wrapPcmInWav = (base64Pcm: string, sampleRate = 24000): string => {
  const pcmData = atob(base64Pcm);
  const len = pcmData.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + len, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, len, true);

  /* Write actual PCM data */
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, pcmData.charCodeAt(i));
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const geminiText = async (
  prompt: string, 
  useSearch = false, 
  mode = 'basic', 
  customInstruction?: string, 
  model = 'gemini-3-pro-preview',
  outputFields?: OutputField[]
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstructions: Record<string, string> = {
    basic: "You are a helpful and versatile AI assistant. Provide clear, accurate, and direct answers.",
    enhance: "You are a Prompt Engineering Expert. Enhance the user's input into a detailed prompt. Output ONLY the enhanced prompt.",
    enhance_image: "Expand the user's input into a highly detailed image generation prompt. Output ONLY the prompt.",
    enhance_video: "Expand the user's input into a cinematic video prompt. Describe camera and lighting. Output ONLY the prompt.",
    enhance_tts: "Transform the input into a natural narration script. Output ONLY the text.",
    summarize: "Extract core info into a concise summary.",
    polish: "Refine text for clarity and tone.",
  };

  const baseInstruction = mode === 'custom' && customInstruction 
    ? customInstruction 
    : (systemInstructions[mode] || systemInstructions.basic);

  const hasMultipleOutputs = outputFields && outputFields.length > 0;
  const outputKeys = outputFields?.map(f => f.id) || [];
  
  const finalInstruction = hasMultipleOutputs 
    ? `${baseInstruction}\n\nIMPORTANT: You MUST generate content for each field: ${outputKeys.join(', ')}.`
    : baseInstruction;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: finalInstruction,
      tools: useSearch ? [{ googleSearch: {} }] : undefined,
      responseMimeType: hasMultipleOutputs ? "application/json" : "text/plain",
      responseSchema: hasMultipleOutputs ? {
        type: Type.OBJECT,
        properties: (outputFields || []).reduce((acc, field) => ({
          ...acc,
          [field.id]: { type: Type.STRING, description: field.description || field.id }
        }), {}),
        required: outputKeys
      } : undefined
    }
  });

  const text = response.text || "";
  if (hasMultipleOutputs) {
    try {
      const parsed = JSON.parse(text);
      outputKeys.forEach(key => { if (!(key in parsed)) parsed[key] = "..."; });
      return parsed;
    } catch (e) {
      const fallback: Record<string, string> = {};
      outputKeys.forEach((key, i) => fallback[key] = i === 0 ? text : "...");
      return fallback;
    }
  }
  return text;
};

export const geminiImage = async (prompt: string, imageInput?: string | string[] | any[], aspectRatio = "1:1", model = 'gemini-2.5-flash-image'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: prompt }];
  
  if (imageInput) {
    const inputs = Array.isArray(imageInput) ? imageInput : [imageInput];
    const flatInputs = inputs.flat().filter(img => img && typeof img === 'string');
    flatInputs.forEach(img => {
      const data = img.includes(',') ? img.split(',')[1] : img;
      parts.push({ inlineData: { data: data, mimeType: 'image/png' } });
    });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: { imageConfig: { aspectRatio: aspectRatio as any } }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const geminiSpeech = async (text: string, voice = 'Kore', model = "gemini-2.5-flash-preview-tts", tone?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalPrompt = tone ? `Style: ${tone}\nText: ${text}` : text;
  const response = await ai.models.generateContent({
    model: model,
    contents: [{ parts: [{ text: finalPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};

export const geminiVideo = async (prompt: string, imageBase64?: string, aspectRatio = "16:9", resolution = "720p", refVideo?: any, model = 'veo-3.1-fast-generate-preview'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanedImage = imageBase64?.split(',')[1] || imageBase64;
  let operation = await ai.models.generateVideos({
    model: model,
    prompt: prompt,
    image: cleanedImage ? { imageBytes: cleanedImage, mimeType: 'image/png' } : undefined,
    video: refVideo,
    config: { numberOfVideos: 1, resolution: resolution as any, aspectRatio: aspectRatio as any }
  });
  while (!operation.done) {
    await new Promise(res => setTimeout(res, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  const link = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!link) throw new Error("Video failed");
  return `${link}&key=${process.env.API_KEY}`;
};

/**
 * LightX2V Video/Image Service Integration
 * Generalized to handle T2V, I2V, S2V, T2I, and I2I
 */
export const lightX2VTask = async (
  baseUrl: string,
  token: string,
  task: string,
  modelCls: string,
  prompt: string,
  inputImage?: string | string[],
  inputAudio?: string,
  lastFrame?: string,
  outputName = "output_video",
  aspectRatio?: string,
  inputVideo?: string,
  onTaskId?: (taskId: string) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V");

  const formatMediaPayload = (val: string | string[] | undefined, isAudio = false) => {
    if (!val) return undefined;
    
    // Handle multiple images (array) - for i2i tasks with multiple input images
    // According to lightx2v server (utils.py:177-185), server expects:
    // - For base64: list of base64 strings (may include data:image prefix)
    // - Server will decode each and save as input_image_1, input_image_2, etc.
    if (Array.isArray(val) && val.length > 0) {
      // Process each image: extract base64 from data URLs, keep URLs as-is
      const processedImages = val.map(img => {
        if (typeof img !== 'string') return img;
        if (img.startsWith('http')) {
          // URL - server will fetch it via fetch_resource
          return img;
        } else {
          // Base64 - extract base64 part if it's a data URL (data:image/...;base64,...)
          // Server code checks for "data:image" prefix and splits on ","
          if (img.startsWith('data:image')) {
            return img.split(',')[1];
          } else if (img.includes(',')) {
            // Handle other data URL formats
            return img.split(',')[1];
          } else {
            // Already pure base64
            return img;
          }
        }
      });
      
      // Server expects: { type: "base64", data: ["base64string1", "base64string2", ...] }
      // OR { type: "url", data: ["url1", "url2", ...] }
      // Note: Server's preload_data handles list by checking if first item starts with "data:image"
      // For consistency, if any item is a URL, we should use type "url" for all
      // But server code suggests it expects base64 list, so we'll use base64 for mixed arrays
      // and let server handle URL fetching if needed
      const hasUrl = processedImages.some(img => typeof img === 'string' && img.startsWith('http'));
      const type = hasUrl ? "url" : "base64";
      
      return { type: type, data: processedImages };
    }
    
    // Single value handling (original logic)
    const singleVal = val as string;
    const isUrl = singleVal.startsWith('http');
    const type = isUrl ? "url" : "base64";
    
    // Process the data content
    let dataContent = singleVal;
    if (!isUrl) {
      dataContent = singleVal.includes(',') ? singleVal.split(',')[1] : singleVal;
      // Special handling for raw PCM audio from Gemini
      if (isAudio && !singleVal.startsWith('data:')) {
        dataContent = wrapPcmInWav(dataContent, 24000);
      }
    }
    
    // Use 'data' as the field name for both types as the server error 'data'! suggests
    return { type: type, data: dataContent };
  };

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // 1. Submit Task (POST /api/v1/task/submit)
  const submitUrl = `${normalizedBaseUrl}/api/v1/task/submit`;
  const payload: any = {
    task: task,
    model_cls: modelCls,
    stage: "single_stage",
    prompt: prompt || ""
  };

  if (aspectRatio) payload.aspect_ratio = aspectRatio;
  if (inputImage) payload.input_image = formatMediaPayload(inputImage);
  if (inputAudio) payload.input_audio = formatMediaPayload(inputAudio, true);
  // Replaced 'last_frame' with 'input_last_frame' as required by the flf2v task
  if (lastFrame) payload.input_last_frame = formatMediaPayload(lastFrame);
  // Support for input video (used in character swap/animate task)
  if (inputVideo) payload.input_video = formatMediaPayload(inputVideo);

  const submitRes = await fetch(submitUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!submitRes.ok) {
    let errorMessage = `LightX2V Submit Failed (${submitRes.status})`;
    try {
    const errText = await submitRes.text();
      if (errText.trim().startsWith('{') || errText.trim().startsWith('[')) {
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.detail) errorMessage += `: ${errorData.detail}`;
        } catch {
          errorMessage = errText.trim() || errorMessage;
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
    }
    console.error(`[LightX2V] Submit error: ${errorMessage}`, { task, modelCls, prompt: prompt?.substring(0, 50) });
    throw new Error(errorMessage);
  }

  const submitData = await submitRes.json();
  const taskId = submitData.task_id;
  if (!taskId) throw new Error("No task_id returned from LightX2V submission");

  // 2. Poll Task Status
  const queryUrl = `${normalizedBaseUrl}/api/v1/task/query?task_id=${taskId}`;
  let status = "PENDING";
  let maxAttempts = 120; // 10 minutes total
  
  while (status !== "SUCCEED" && status !== "FAILED" && status !== "CANCELLED" && maxAttempts > 0) {
    await new Promise(res => setTimeout(res, 5000));
    const queryRes = await fetch(queryUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!queryRes.ok) {
      let errorMessage = `Polling status failed (${queryRes.status})`;
      try {
        const errText = await queryRes.text();
        if (errText.trim().startsWith('{')) {
          try {
            const errorData = JSON.parse(errText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            if (errorData.detail) errorMessage += `: ${errorData.detail}`;
          } catch {
            errorMessage = errText.trim() || errorMessage;
          }
        } else {
          errorMessage = errText.trim() || errorMessage;
        }
      } catch (e: any) {
        errorMessage = e.message || errorMessage;
      }
      console.error(`[LightX2V] Polling error: ${errorMessage}`, { taskId });
      throw new Error(errorMessage);
    }
    const taskInfo = await queryRes.json();
    status = taskInfo.status;
    
    if (status === "FAILED") {
      throw new Error(`LightX2V Task Failed: ${taskInfo.error || 'Server processing error'}`);
    }
    maxAttempts--;
  }

  if (status !== "SUCCEED") {
    throw new Error(`LightX2V Task timed out or ended with status: ${status}`);
  }

  // 3. Get Result URL
  const resultUrlEndpoint = `${normalizedBaseUrl}/api/v1/task/result_url?task_id=${taskId}&name=${outputName}`;
  const resultRes = await fetch(resultUrlEndpoint, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!resultRes.ok) {
    let errorMessage = `Failed to fetch result URL (${resultRes.status})`;
    try {
      const errText = await resultRes.text();
      if (errText.trim().startsWith('{')) {
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.detail) errorMessage += `: ${errorData.detail}`;
        } catch {
          errorMessage = errText.trim() || errorMessage;
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
    }
    console.error(`[LightX2V] Result URL error: ${errorMessage}`, { taskId, outputName });
    throw new Error(errorMessage);
  }

  const resultData = await resultRes.json();
  if (!resultData.url) {
    throw new Error(`LightX2V response missing ${outputName} result URL.`);
  }

  return resultData.url;
};

/**
 * LightX2V TTS Voice List Service
 * Get available voice list from LightX2V TTS API
 */
export const lightX2VGetVoiceList = async (
  baseUrl: string,
  token: string,
  version: string = "all"
): Promise<{ voices?: any[]; emotions?: string[]; languages?: any[] }> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V Voice List");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V Voice List");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1/voices/list${version !== "all" ? `?version=${version}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    let errorMessage = `LightX2V Voice List Failed (${response.status})`;
    try {
      const errText = await response.text();
      if (errText.trim().startsWith('{') || errText.trim().startsWith('[')) {
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.detail) errorMessage += `: ${errorData.detail}`;
        } catch {
          errorMessage = errText.trim() || errorMessage;
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
    }
    console.error(`[LightX2V] Voice List error: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  let result: any;
  try {
    result = await response.json();
  } catch (jsonError: any) {
    const errorText = await response.text().catch(() => 'Unable to read response');
    console.error(`[LightX2V] Failed to parse JSON response:`, jsonError, errorText);
    throw new Error(`Failed to parse voice list response: ${jsonError.message || 'Invalid JSON'}`);
  }

  // Validate and normalize the response structure
  try {
    // Ensure voices is an array
    let voices: any[] = [];
    if (Array.isArray(result.voices)) {
      voices = result.voices;
    } else if (result.voices && typeof result.voices === 'object') {
      // If voices is an object, try to extract array from it
      console.warn('[LightX2V] Voices is not an array, attempting to normalize');
      voices = [];
    }

    // Ensure emotions is an array of strings
    let emotions: string[] = [];
    if (Array.isArray(result.emotions)) {
      // Check if emotions are objects with 'name' field or strings
      emotions = result.emotions.map((e: any) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object' && e.name) return e.name;
        return String(e);
      }).filter((e: any) => e);
    }

    // Ensure languages is an array
    let languages: any[] = [];
    if (Array.isArray(result.languages)) {
      languages = result.languages;
    }

    return {
      voices,
      emotions,
      languages
    };
  } catch (typeError: any) {
    console.error(`[LightX2V] Type error processing voice list:`, typeError, result);
    throw new Error(`Type error processing voice list: ${typeError.message || 'Invalid data structure'}`);
  }
};

/**
 * LightX2V TTS Service
 * Generate text-to-speech audio using LightX2V TTS API
 */
export const lightX2VTTS = async (
  baseUrl: string,
  token: string,
  text: string,
  voiceType: string,
  contextTexts: string = "",
  emotion: string = "",
  emotionScale: number = 3,
  speechRate: number = 0,
  pitch: number = 0,
  loudnessRate: number = 0,
  resourceId: string = "seed-tts-2.0"
): Promise<string> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V TTS");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V TTS");
  const textStr = typeof text === 'string' ? text : String(text || '');
  if (!textStr || !textStr.trim()) throw new Error("Text is required for TTS");
  const voiceTypeStr = typeof voiceType === 'string' ? voiceType : String(voiceType || '');
  if (!voiceTypeStr || !voiceTypeStr.trim()) throw new Error("Voice type is required for TTS");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1/tts/generate`;

  const payload = {
    text: textStr,
    voice_type: voiceTypeStr,
    context_texts: contextTexts,
    emotion: emotion,
    emotion_scale: emotionScale,
    speech_rate: speechRate,
    pitch: pitch,
    loudness_rate: loudnessRate,
    resource_id: resourceId
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json, audio/*'
    },
    body: JSON.stringify(payload)
  });

  // Check response status
  const contentType = response.headers.get("Content-Type") || "";

  if (!response.ok) {
    // Try to parse error response - read response body only once
    let errorMessage = `LightX2V TTS Failed (${response.status})`;
    let errorDetails: any = null;
    try {
      // Read response body as text first (works for both JSON and plain text)
      const errorText = await response.text();
      
      // Try to parse as JSON
      if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
        try {
          errorDetails = JSON.parse(errorText);
          errorMessage = errorDetails.error || errorDetails.message || errorMessage;
          
          // Include additional error details if available
          if (errorDetails.detail) {
            errorMessage += `: ${errorDetails.detail}`;
          } else if (errorDetails.errors) {
            // Handle validation errors array
            const errorDetailsList = Array.isArray(errorDetails.errors) 
              ? errorDetails.errors.map((e: any) => e.msg || e.message || e).join(', ')
              : errorDetails.errors;
            errorMessage += `: ${errorDetailsList}`;
          } else if (errorDetails.traceback || errorDetails.stack) {
            // Include traceback/stack if available (truncated)
            const traceback = errorDetails.traceback || errorDetails.stack;
            const shortTraceback = typeof traceback === 'string' 
              ? traceback.split('\n').slice(0, 3).join(' | ')
              : String(traceback).substring(0, 200);
            errorMessage += ` (${shortTraceback})`;
          }
        } catch (parseError) {
          // Not valid JSON, use text as-is
          errorMessage = errorText.trim() || errorMessage;
          errorDetails = { raw: errorText };
        }
      } else {
        // Plain text error
        errorMessage = errorText.trim() || errorMessage;
        errorDetails = { raw: errorText };
      }
    } catch (error: any) {
      // If reading response fails, use error message or default
      errorMessage = error.message || errorMessage;
      errorDetails = { readError: error.message };
    }
    
    // Log detailed error information for debugging
    console.error(`[LightX2V] TTS error: ${errorMessage}`, { 
      voiceType, 
      text: text?.substring(0, 50), 
      status: response.status,
      url: url,
      errorDetails: errorDetails,
      payload: {
        voice_type: voiceType,
        resource_id: resourceId,
        emotion: emotion || '(none)',
        emotion_scale: emotionScale,
        speech_rate: speechRate,
        pitch: pitch,
        loudness_rate: loudnessRate
      }
    });
    
    // Enhance error message with context if it's still generic
    if (errorMessage === 'TTS generation failed' || errorMessage.includes('TTS generation failed')) {
      errorMessage = `TTS generation failed (HTTP ${response.status}). Voice: ${voiceType}, Resource: ${resourceId}. ${errorDetails?.detail || errorDetails?.message || 'Please check server logs for details.'}`;
    }
    
    throw new Error(errorMessage);
  }

  // Check if response is audio or JSON error
  if (contentType.includes("audio") || contentType.includes("application/octet-stream")) {
    // Audio response - convert to base64 data URL
    const audioBlob = await response.blob();
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    return audioBase64;
  } else {
    // Unexpected content type - try to read as text first, then parse if JSON
    try {
      const responseText = await response.text();
      // Try to parse as JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || errorData.message || "TTS generation failed");
        } catch {
          // Not valid JSON, use text as error message
          throw new Error(responseText.trim() || "TTS generation failed");
        }
      } else {
        throw new Error(responseText.trim() || "TTS generation failed");
      }
    } catch (error: any) {
      // If already an Error with message, re-throw it
      if (error instanceof Error && error.message) {
        throw error;
      }
      // Otherwise create new error
      throw new Error("TTS generation failed: Unexpected response format");
    }
  }
};

/**
 * LightX2V Voice Clone Service
 * Clone voice from audio
 */
export const lightX2VVoiceClone = async (
  baseUrl: string,
  token: string,
  audioBase64: string,
  text?: string
): Promise<string> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V Voice Clone");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V Voice Clone");
  if (!audioBase64) throw new Error("Audio file is required for voice cloning");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1/voice/clone`;
  
  // Convert base64 to blob
  const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  if (text) {
    formData.append('text', text);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `LightX2V Voice Clone Failed (${response.status})`;
    try {
    const errText = await response.text();
      if (errText.trim().startsWith('{') || errText.trim().startsWith('[')) {
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.detail) errorMessage += `: ${errorData.detail}`;
        } catch {
          errorMessage = errText.trim() || errorMessage;
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
    }
    console.error(`[LightX2V] Voice Clone error: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const result = await response.json();
  if (!result.speaker_id) {
    throw new Error(result.error || "Voice clone failed");
  }

  // Return speaker_id as JSON string (stored in node.data.speaker_id)
  return JSON.stringify({
    speaker_id: result.speaker_id,
    text: result.text || text || "",
    message: result.message || "Voice clone successful"
  });
};

/**
 * LightX2V Voice Clone TTS Service
 * Generate TTS with cloned voice
 */
export const lightX2VVoiceCloneTTS = async (
  baseUrl: string,
  token: string,
  text: string,
  speakerId: string,
  style: string = "正常",
  speed: number = 1.0,
  volume: number = 0,
  pitch: number = 0,
  language: string = "ZH_CN"
): Promise<string> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V Voice Clone TTS");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V Voice Clone TTS");
  const speakerIdStr = typeof speakerId === 'string' ? speakerId : String(speakerId || '');
  if (!speakerIdStr || !speakerIdStr.trim()) throw new Error("Speaker ID is required for TTS with cloned voice");
  const textStr = typeof text === 'string' ? text : String(text || '');
  if (!textStr || !textStr.trim()) throw new Error("Text is required for TTS");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1/voice/clone/tts`;
  const payload = {
    text: textStr,
    speaker_id: speakerIdStr,
    style: style,
    speed: speed,
    volume: volume,
    pitch: pitch,
    language: language
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json, audio/*'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMessage = `LightX2V Voice Clone TTS Failed (${response.status})`;
    try {
    const errText = await response.text();
      if (errText.trim().startsWith('{') || errText.trim().startsWith('[')) {
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.detail) errorMessage += `: ${errorData.detail}`;
        } catch {
          errorMessage = errText.trim() || errorMessage;
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
    }
    console.error(`[LightX2V] Voice Clone TTS error: ${errorMessage}`, { speakerId, text: text?.substring(0, 50) });
    throw new Error(errorMessage);
  }

  // Check if response is audio or JSON error
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("audio") || contentType.includes("application/octet-stream")) {
    // Audio response - convert to base64 data URL
    const audioBlob = await response.blob();
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    return audioBase64;
  } else {
    // JSON error response
    const errorData = await response.json();
    throw new Error(errorData.error || "TTS generation failed");
  }
};

/**
 * LightX2V Get Clone Voice List
 * Get list of cloned voices for the user
 */
export const lightX2VGetCloneVoiceList = async (
  baseUrl: string,
  token: string
): Promise<any[]> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V Clone Voice List");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V Clone Voice List");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1/voice/clone/list`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    let errorMessage = `LightX2V Clone Voice List Failed (${response.status})`;
    let errorDetails: any = null;
    try {
      const errText = await response.text();
      if (errText.trim().startsWith('{') || errText.trim().startsWith('[')) {
        try {
          errorDetails = JSON.parse(errText);
          errorMessage = errorDetails.error || errorDetails.message || errorMessage;
          if (errorDetails.detail) errorMessage += `: ${errorDetails.detail}`;
        } catch (parseError) {
          errorMessage = errText.trim() || errorMessage;
          errorDetails = { raw: errText };
        }
      } else {
        errorMessage = errText.trim() || errorMessage;
        errorDetails = { raw: errText };
      }
    } catch (e: any) {
      errorMessage = e.message || errorMessage;
      errorDetails = { readError: e.message };
    }
    console.error(`[LightX2V] Clone Voice List error: ${errorMessage}`, { status: response.status, url, errorDetails });
    throw new Error(errorMessage);
  }

  const result = await response.json();
  try {
    let voices: any[] = [];
    
    // Check different possible response structures
    if (Array.isArray(result)) {
      // Direct array response
      voices = result;
    } else if (result.voice_clones && Array.isArray(result.voice_clones)) {
      // Response with voice_clones field
      voices = result.voice_clones;
    } else if (result.voices && Array.isArray(result.voices)) {
      // Response with voices field (fallback)
      voices = result.voices;
    } else if (result.data && Array.isArray(result.data)) {
      // Response with data field (fallback)
      voices = result.data;
    }
    
    console.log(`[LightX2V] Clone voice list parsed:`, { 
      resultType: Array.isArray(result) ? 'array' : typeof result, 
      hasVoiceClones: !!result.voice_clones,
      hasVoices: !!result.voices,
      voicesCount: voices.length,
      voices 
    });
    
    return voices;
  } catch (typeError: any) {
    console.error(`[LightX2V] Type error processing clone voice list:`, typeError, result);
    throw new Error(`Type error processing clone voice list: ${typeError.message || 'Invalid data structure'}`);
  }
};

/**
 * DeepSeek Chat API Integration
 * Uses the DeepSeek API endpoint for responses (new API format)
 */
export const deepseekText = async (
  prompt: string,
  mode = 'basic',
  customInstruction?: string,
  model = 'deepseek-v3-2-251201',
  outputFields?: OutputField[],
  useSearch = false
): Promise<any> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key is required. Please set DEEPSEEK_API_KEY environment variable.");
  }

  // Ensure prompt is a string
  const promptStr = typeof prompt === 'string' ? prompt : String(prompt || '');

  const systemInstructions: Record<string, string> = {
    basic: "You are a helpful and versatile AI assistant. Provide clear, accurate, and direct answers.",
    enhance: "You are a Prompt Engineering Expert. Enhance the user's input into a detailed prompt. Output ONLY the enhanced prompt.",
    enhance_image: "Expand the user's input into a highly detailed image generation prompt. Output ONLY the prompt.",
    enhance_video: "Expand the user's input into a cinematic video prompt. Describe camera and lighting. Output ONLY the prompt.",
    enhance_tts: "Transform the input into a natural narration script. Output ONLY the text.",
    summarize: "Extract core info into a concise summary.",
    polish: "Refine text for clarity and tone.",
  };

  const baseInstruction = mode === 'custom' && customInstruction 
    ? customInstruction 
    : (systemInstructions[mode] || systemInstructions.basic);

  const hasMultipleOutputs = outputFields && outputFields.length > 0;
  const outputKeys = outputFields?.map(f => f.id) || [];

  // Build input array with user content
  const inputContent: any[] = [];
  
  // Add text content
  const textContent = hasMultipleOutputs
    ? `${promptStr}\n\nIMPORTANT: You MUST generate content for each field as JSON: ${outputKeys.join(', ')}.`
    : promptStr;
  
  inputContent.push({
    type: 'input_text',
    text: textContent
  });

  // Build request body for new responses API
  const requestBody: any = {
    model: model,
    stream: false,
    input: [
      {
        role: 'user',
        content: inputContent
      }
    ]
  };

  // Add system instruction if needed
  if (baseInstruction && mode !== 'basic') {
    requestBody.input.unshift({
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: baseInstruction
        }
      ]
    });
  }

  // Add web search tool if useSearch is enabled
  if (useSearch) {
    requestBody.tools = [
      { type: "web_search" }
    ];
  }

  // Add JSON mode for structured output if multiple outputs are required
  // if (hasMultipleOutputs) {
  //   requestBody.response_format = { type: 'json_object' };
  // }

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `DeepSeek API failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  // Debug: log the full response structure for troubleshooting
  if (useSearch) {
    console.log('[DeepSeek] Full API response:', JSON.stringify(data, null, 2));
  }
  
  // New API format: response.output is an array, find the message type item
  // The message item has content array with type: "output_text"
  let text = "";
  if (data.output && Array.isArray(data.output)) {
    // Find all message type outputs (usually the last one contains the final answer)
    const messageOutputs = data.output.filter((item: any) => item.type === "message");
    // Use the last message output (final answer)
    const messageOutput = messageOutputs.length > 0 ? messageOutputs[messageOutputs.length - 1] : null;
    
    if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
      // Find all output_text items and concatenate them
      const textContents = messageOutput.content.filter((item: any) => item.type === "output_text");
      if (textContents.length > 0) {
        // Concatenate all text contents
        text = textContents.map((item: any) => item.text || "").join("");
        if (useSearch) {
          console.log('[DeepSeek] Extracted text length:', text.length, 'characters');
        }
      }
    }
    
    // Debug log if text is empty
    if (!text) {
      console.warn('[DeepSeek] Failed to extract text from response:', JSON.stringify(data, null, 2));
    }
  }
  // Fallback to old format for backward compatibility
  if (!text) {
    text = data.output?.[0]?.content?.[0]?.text || data.choices?.[0]?.message?.content || "";
  }

  // Post-process: extract JSON from code blocks if present
  // The response API may return JSON wrapped in ```json ... ``` code blocks
  if (text.includes('```json')) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const extractedJson = JSON.parse(jsonMatch[1].trim());
        // If hasMultipleOutputs is true, return the JSON object (already in correct format)
        if (hasMultipleOutputs) {
          outputKeys.forEach(key => { if (!(key in extractedJson)) extractedJson[key] = "..."; });
          return extractedJson;
        }
        // If hasMultipleOutputs is false but JSON contains output fields, extract the first value
        // This handles cases where API returns { "out-text": "..." } but we want just the text
        const jsonKeys = Object.keys(extractedJson);
        if (jsonKeys.length === 1 && jsonKeys[0].startsWith('out-')) {
          return extractedJson[jsonKeys[0]];
        }
        // If it matches expected output keys, extract the value
        if (outputKeys.length === 1 && outputKeys[0] in extractedJson) {
          return extractedJson[outputKeys[0]];
        }
        // Otherwise return the parsed JSON
        return extractedJson;
      } catch (e) {
        console.warn('[DeepSeek] Failed to parse JSON from code block:', e);
        // Fall through to normal processing
      }
    }
  }

  if (hasMultipleOutputs) {
    try {
      const parsed = JSON.parse(text);
      outputKeys.forEach(key => { if (!(key in parsed)) parsed[key] = "..."; });
      return parsed;
    } catch (e) {
      const fallback: Record<string, string> = {};
      outputKeys.forEach((key, i) => fallback[key] = i === 0 ? text : "...");
      return fallback;
    }
  }

  return text;
};

/**
 * Doubao Vision Chat API Integration
 * Uses the Doubao API endpoint for responses (new API format) with vision support
 */
export const doubaoText = async (
  prompt: string,
  mode = 'basic',
  customInstruction?: string,
  model = 'doubao-seed-1-6-vision-250815',
  outputFields?: OutputField[],
  imageInput?: string | string[] | any[],
  useSearch = false
): Promise<any> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("API key is required. Please set DEEPSEEK_API_KEY environment variable.");
  }

  // Ensure prompt is a string
  const promptStr = typeof prompt === 'string' ? prompt : String(prompt || '');

  const systemInstructions: Record<string, string> = {
    basic: "You are a helpful and versatile AI assistant. Provide clear, accurate, and direct answers.",
    enhance: "You are a Prompt Engineering Expert. Enhance the user's input into a detailed prompt. Output ONLY the enhanced prompt.",
    enhance_image: "Expand the user's input into a highly detailed image generation prompt. Output ONLY the prompt.",
    enhance_video: "Expand the user's input into a cinematic video prompt. Describe camera and lighting. Output ONLY the prompt.",
    enhance_tts: "Transform the input into a natural narration script. Output ONLY the text.",
    summarize: "Extract core info into a concise summary.",
    polish: "Refine text for clarity and tone.",
  };

  const baseInstruction = mode === 'custom' && customInstruction 
    ? customInstruction 
    : (systemInstructions[mode] || systemInstructions.basic);

  const hasMultipleOutputs = outputFields && outputFields.length > 0;
  const outputKeys = outputFields?.map(f => f.id) || [];

  // Build input content array - support both text and images
  const inputContent: any[] = [];
  
  // Add images if provided
  if (imageInput) {
    const images = Array.isArray(imageInput) ? imageInput : [imageInput];
    const flatImages = images.flat().filter(img => img && typeof img === 'string');
    for (const img of flatImages) {
      // Doubao API format: { "type": "input_image", "image_url": "https://..." or "data:image/..." }
      // For HTTP URLs, use directly; for base64/data URLs, use data URL format
      let imageUrl: string;
      
      if (img.startsWith('http://') || img.startsWith('https://')) {
        // HTTP/HTTPS URLs: use directly
        imageUrl = img;
      } else if (img.startsWith('data:')) {
        // Data URL: use directly (already in correct format)
        imageUrl = img;
      } else {
        // Base64 string without data URL prefix: convert to data URL
        // Try to detect mime type from common patterns
        let mimeType = 'image/jpeg';
        if (img.startsWith('/9j/') || img.startsWith('iVBORw0KGgo')) {
          mimeType = img.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
        }
        imageUrl = `data:${mimeType};base64,${img}`;
      }

      inputContent.push({
        type: 'input_image',
        image_url: imageUrl
      });
    }
  }
  
  // Add text content
  const textContent = hasMultipleOutputs
    ? `${promptStr}\n\nIMPORTANT: You MUST generate content for each field as JSON: ${outputKeys.join(', ')}.`
    : promptStr;
  
  inputContent.push({
    type: 'input_text',
    text: textContent
  });
  
  // Build request body for new responses API
  const requestBody: any = {
    model: model,
    stream: false,
    input: [
      {
        role: 'user',
        content: inputContent
      }
    ]
  };

  // Add system instruction if needed
  if (baseInstruction && mode !== 'basic') {
    requestBody.input.unshift({
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: baseInstruction
        }
      ]
    });
  }

  // Add web search tool if useSearch is enabled
  if (useSearch) {
    requestBody.tools = [
      { type: "web_search" }
    ];
  }

  // // Add JSON mode for structured output if multiple outputs are required
  // if (hasMultipleOutputs) {
  //   requestBody.response_format = { type: 'json_object' };
  // }

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `Doubao API failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  // Debug: log the full response structure for troubleshooting
  if (useSearch) {
    console.log('[Doubao] Full API response:', JSON.stringify(data, null, 2));
  }
  
  // New API format: response.output is an array, find the message type item
  // The message item has content array with type: "output_text"
  let text = "";
  if (data.output && Array.isArray(data.output)) {
    // Find all message type outputs (usually the last one contains the final answer)
    const messageOutputs = data.output.filter((item: any) => item.type === "message");
    // Use the last message output (final answer)
    const messageOutput = messageOutputs.length > 0 ? messageOutputs[messageOutputs.length - 1] : null;
    
    if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
      // Find all output_text items and concatenate them
      const textContents = messageOutput.content.filter((item: any) => item.type === "output_text");
      if (textContents.length > 0) {
        // Concatenate all text contents
        text = textContents.map((item: any) => item.text || "").join("");
        if (useSearch) {
          console.log('[Doubao] Extracted text length:', text.length, 'characters');
        }
      }
    }
    
    // Debug log if text is empty
    if (!text) {
      console.warn('[Doubao] Failed to extract text from response:', JSON.stringify(data, null, 2));
    }
  }
  // Fallback to old format for backward compatibility
  if (!text) {
    text = data.output?.[0]?.content?.[0]?.text || data.choices?.[0]?.message?.content || "";
  }

  // Post-process: extract JSON from code blocks if present
  // The response API may return JSON wrapped in ```json ... ``` code blocks
  if (text.includes('```json')) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const extractedJson = JSON.parse(jsonMatch[1].trim());
        // If hasMultipleOutputs is true, return the JSON object (already in correct format)
        if (hasMultipleOutputs) {
          outputKeys.forEach(key => { if (!(key in extractedJson)) extractedJson[key] = "..."; });
          return extractedJson;
        }
        // If hasMultipleOutputs is false but JSON contains output fields, extract the first value
        // This handles cases where API returns { "out-text": "..." } but we want just the text
        const jsonKeys = Object.keys(extractedJson);
        if (jsonKeys.length === 1 && jsonKeys[0].startsWith('out-')) {
          return extractedJson[jsonKeys[0]];
        }
        // If it matches expected output keys, extract the value
        if (outputKeys.length === 1 && outputKeys[0] in extractedJson) {
          return extractedJson[outputKeys[0]];
        }
        // Otherwise return the parsed JSON
        return extractedJson;
      } catch (e) {
        console.warn('[Doubao] Failed to parse JSON from code block:', e);
        // Fall through to normal processing
      }
    }
  }

  if (hasMultipleOutputs) {
    try {
      const parsed = JSON.parse(text);
      outputKeys.forEach(key => { if (!(key in parsed)) parsed[key] = "..."; });
      return parsed;
    } catch (e) {
      const fallback: Record<string, string> = {};
      outputKeys.forEach((key, i) => fallback[key] = i === 0 ? text : "...");
      return fallback;
    }
  }

  return text;
};

/**
 * PP Chat Gemini API Integration
 * Uses the PP Chat API endpoint for chat completions (custom Gemini endpoint)
 * Supports both text and image inputs
 */
export const ppchatGeminiText = async (
  prompt: string,
  mode = 'basic',
  customInstruction?: string,
  model = 'gemini-3-pro-preview',
  outputFields?: OutputField[],
  imageInput?: string | string[] | any[]
): Promise<any> => {
  const apiKey = process.env.PPCHAT_API_KEY;
  if (!apiKey) {
    throw new Error("PP Chat API key is required. Please set PPCHAT_API_KEY environment variable.");
  }

  // Ensure prompt is a string
  const promptStr = typeof prompt === 'string' ? prompt : String(prompt || '');

  const systemInstructions: Record<string, string> = {
    basic: "You are a helpful and versatile AI assistant. Provide clear, accurate, and direct answers.",
    enhance: "You are a Prompt Engineering Expert. Enhance the user's input into a detailed prompt. Output ONLY the enhanced prompt.",
    enhance_image: "Expand the user's input into a highly detailed image generation prompt. Output ONLY the prompt.",
    enhance_video: "Expand the user's input into a cinematic video prompt. Describe camera and lighting. Output ONLY the prompt.",
    enhance_tts: "Transform the input into a natural narration script. Output ONLY the text.",
    summarize: "Extract core info into a concise summary.",
    polish: "Refine text for clarity and tone.",
  };

  const baseInstruction = mode === 'custom' && customInstruction 
    ? customInstruction 
    : (systemInstructions[mode] || systemInstructions.basic);

  const hasMultipleOutputs = outputFields && outputFields.length > 0;
  const outputKeys = outputFields?.map(f => f.id) || [];

  // Build parts array - support both text and images
  const parts: any[] = [];

  // Add images if provided
  if (imageInput) {
    const images = Array.isArray(imageInput) ? imageInput : [imageInput];
    const flatImages = images.flat().filter(img => img && typeof img === 'string');
    flatImages.forEach(img => {
      // Extract base64 data and mime type from data URL or base64 string
      let base64Data: string;
      let mimeType: string = 'image/jpeg';

      if (img.startsWith('data:')) {
        // Data URL format: data:image/jpeg;base64,/9j/4AAQ...
        const matches = img.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1] || 'image/jpeg';
          base64Data = matches[2];
        } else {
          // Fallback: try to extract base64 from data URL without explicit mime type
          const base64Match = img.match(/base64,(.+)$/);
          base64Data = base64Match ? base64Match[1] : img;
        }
      } else if (img.startsWith('http')) {
        // If it's a URL, we need to fetch it first (for now, skip URLs)
        // In a production environment, you might want to fetch and convert
        return;
      } else {
        // Assume it's already base64
        base64Data = img;
      }

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    });
  }

  // Add text content
  const textContent = hasMultipleOutputs
    ? `${promptStr}\n\nIMPORTANT: You MUST generate content for each field as JSON: ${outputKeys.join(', ')}.`
    : promptStr;

  if (textContent) {
    parts.push({ text: textContent });
  }

  // Build request body
  const requestBody: any = {
    contents: [{
      parts: parts
    }]
  };

  // Add system instruction if needed
  if (baseInstruction && mode !== 'basic') {
    requestBody.systemInstruction = {
      parts: [{ text: baseInstruction }]
    };
  }

  // Add instruction for multiple outputs if needed
  if (hasMultipleOutputs) {
    requestBody.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: (outputFields || []).reduce((acc, field) => ({
          ...acc,
          [field.id]: { type: "string", description: field.description || field.id }
        }), {}),
        required: outputKeys
      }
    };
  }

  const response = await fetch(`https://api.ppchat.vip/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `PP Chat API failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (hasMultipleOutputs) {
    try {
      const parsed = JSON.parse(text);
      outputKeys.forEach(key => { if (!(key in parsed)) parsed[key] = "..."; });
      return parsed;
    } catch (e) {
      const fallback: Record<string, string> = {};
      outputKeys.forEach((key, i) => fallback[key] = i === 0 ? text : "...");
      return fallback;
    }
  }

  return text;
};

/**
 * DeepSeek Chat Completions API for structured JSON output
 * Uses the /api/v3/chat/completions endpoint with JSON mode
 */
export const deepseekChat = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model = 'deepseek-v3-2-251201',
  responseFormat: 'json_object' | 'text' = 'json_object'
): Promise<string> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key is required. Please set DEEPSEEK_API_KEY environment variable.");
  }

  const requestBody: any = {
    model: model,
    messages: messages
  };

  // Add response format for JSON mode
  if (responseFormat === 'json_object') {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `DeepSeek Chat API failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Extract content from response
  const content = data.choices?.[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('Empty response from DeepSeek Chat API');
  }

  return content;
};
