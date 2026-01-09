
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
  inputImage?: string,
  inputAudio?: string,
  lastFrame?: string,
  outputName = "output_video",
  aspectRatio?: string
): Promise<string> => {
  if (!baseUrl || !baseUrl.trim()) throw new Error("Base URL is required for LightX2V");
  if (!token || !token.trim()) throw new Error("Access Token is required for LightX2V");

  const formatMediaPayload = (val: string | undefined, isAudio = false) => {
    if (!val) return undefined;
    
    // Determine type (url or base64)
    const isUrl = val.startsWith('http');
    const type = isUrl ? "url" : "base64";
    
    // Process the data content
    let dataContent = val;
    if (!isUrl) {
      dataContent = val.includes(',') ? val.split(',')[1] : val;
      // Special handling for raw PCM audio from Gemini
      if (isAudio && !val.startsWith('data:')) {
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
    const errText = await submitRes.text();
    throw new Error(`LightX2V Submit Failed (${submitRes.status}): ${errText}`);
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
    
    if (!queryRes.ok) throw new Error(`Polling status failed (${queryRes.status})`);
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
    throw new Error(`Failed to fetch result URL (${resultRes.status})`);
  }

  const resultData = await resultRes.json();
  if (!resultData.url) {
    throw new Error(`LightX2V response missing ${outputName} result URL.`);
  }

  return resultData.url;
};
