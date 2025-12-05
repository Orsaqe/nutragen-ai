import { ImageGenProvider, ImageGenModel, NutraHook, VisualStyle, NutraVertical } from '../types';
import { generateNutraImage } from './geminiService';

// Available models for each provider
export const AVAILABLE_MODELS: ImageGenModel[] = [
  // Gemini/Imagen models
  { id: 'imagen-4.8-ultra-generate-001', name: 'Imagen 4.8 Ultra', provider: ImageGenProvider.GEMINI, requiresBilling: true },
  { id: 'imagen-4.8-generate-001', name: 'Imagen 4.8', provider: ImageGenProvider.GEMINI, requiresBilling: true },
  { id: 'imagen-4.8-fast-generate-001', name: 'Imagen 4.8 Fast', provider: ImageGenProvider.GEMINI, requiresBilling: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (текст)', provider: ImageGenProvider.GEMINI, description: 'Возвращает текст, не изображения' },
  
  // Stable Diffusion models
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: ImageGenProvider.STABLE_DIFFUSION },
  { id: 'stable-diffusion-1.5', name: 'Stable Diffusion 1.5', provider: ImageGenProvider.STABLE_DIFFUSION },
  { id: 'flux-1.1', name: 'Flux 1.1', provider: ImageGenProvider.STABLE_DIFFUSION },
  { id: 'flux-1.1-dev', name: 'Flux 1.1 Dev', provider: ImageGenProvider.STABLE_DIFFUSION },
  
  // DALL-E models
  { id: 'dall-e-3', name: 'DALL-E 3', provider: ImageGenProvider.DALL_E },
  { id: 'dall-e-2', name: 'DALL-E 2', provider: ImageGenProvider.DALL_E },
];

// Get API key from localStorage
const getApiKey = (provider: ImageGenProvider): string | null => {
  const key = localStorage.getItem(`${provider.toUpperCase()}_API_KEY`);
  return key && key.trim().length > 0 ? key.trim() : null;
};

// Stable Diffusion API service
const generateStableDiffusionImage = async (
  prompt: string,
  modelId: string,
  apiKey: string,
  width: number = 1024,
  height: number = 1024
): Promise<string> => {
  // Поддержка разных Stable Diffusion API провайдеров
  // 1. Stability AI API
  // 2. Replicate API
  // 3. Hugging Face Inference API
  
  // Попробуем Stability AI API (stability.ai)
  try {
    const response = await fetch(`https://api.stability.ai/v1/generation/${modelId}/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height,
        width,
        steps: 30,
        samples: 1
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(error.message || `Stable Diffusion API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.artifacts && data.artifacts.length > 0) {
      return `data:image/png;base64,${data.artifacts[0].base64}`;
    }
    throw new Error('No image generated');
  } catch (error: any) {
    // Если Stability AI не сработал, пробуем Replicate
    if (error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Неверный API ключ для Stable Diffusion. Проверьте ключ в настройках.');
    }
    
    // Пробуем Replicate API
    try {
      const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${apiKey}`,
        },
        body: JSON.stringify({
          version: getReplicateModelVersion(modelId),
          input: {
            prompt,
            width,
            height,
            num_outputs: 1
          }
        })
      });
      
      if (!replicateResponse.ok) {
        const error = await replicateResponse.json().catch(() => ({}));
        throw new Error(error.detail || `Replicate API error: ${replicateResponse.status}`);
      }
      
      const prediction = await replicateResponse.json();
      
      // Poll for result
      let result = prediction;
      while (result.status === 'starting' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Token ${apiKey}` }
        });
        result = await statusResponse.json();
      }
      
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        // Fetch image and convert to base64
        const imageResponse = await fetch(result.output[0]);
        const blob = await imageResponse.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      throw new Error(result.error || 'Generation failed');
    } catch (replicateError: any) {
      throw new Error(`Stable Diffusion API error: ${replicateError.message}`);
    }
  }
};

// Get Replicate model version ID
const getReplicateModelVersion = (modelId: string): string => {
  const versions: Record<string, string> = {
    'stable-diffusion-xl': '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    'stable-diffusion-1.5': 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
    'flux-1.1': 'e6e8e3fc6730acb4e83e4db92b95cb2e611ad4fd6b22c336b61eb3c22d178a33',
    'flux-1.1-dev': 'b76242e4-91ed-49f0-84a8-8530e7d5b3c8'
  };
  return versions[modelId] || versions['stable-diffusion-xl'];
};

// DALL-E API service
const generateDALLEImage = async (
  prompt: string,
  modelId: string,
  apiKey: string,
  size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
): Promise<string> => {
  const model = modelId === 'dall-e-3' ? 'dall-e-3' : 'dall-e-2';
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: model === 'dall-e-3' ? '1024x1024' : size,
      quality: model === 'dall-e-3' ? 'standard' : undefined,
      response_format: 'b64_json'
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    if (error.error?.code === 'invalid_api_key') {
      throw new Error('Неверный API ключ для DALL-E. Проверьте ключ в настройках.');
    }
    throw new Error(error.error?.message || error.message || `DALL-E API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.data && data.data.length > 0 && data.data[0].b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }
  throw new Error('No image generated');
};

// Main image generation function
export const generateImage = async (
  prompt: string,
  modelId: string,
  hook: NutraHook,
  style: VisualStyle,
  vertical: NutraVertical,
  targetLanguage: string,
  optionalTextPrompt: string,
  referenceImages: string[] = [],
  reserveSpaceForText: boolean = false
): Promise<string> => {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Модель ${modelId} не найдена`);
  }
  
  // Build enhanced prompt based on hook, style, vertical
  const enhancedPrompt = buildEnhancedPrompt(prompt, hook, style, vertical, optionalTextPrompt);
  
  switch (model.provider) {
    case ImageGenProvider.GEMINI:
      const geminiKey = getApiKey(ImageGenProvider.GEMINI);
      if (!geminiKey) {
        throw new Error('API ключ Gemini не найден. Добавьте ключ в настройках.');
      }
      return generateNutraImage(enhancedPrompt, hook, style, vertical, targetLanguage, optionalTextPrompt, referenceImages, reserveSpaceForText);
    
    case ImageGenProvider.STABLE_DIFFUSION:
      const sdKey = getApiKey(ImageGenProvider.STABLE_DIFFUSION);
      if (!sdKey) {
        throw new Error('API ключ Stable Diffusion не найден. Добавьте ключ в настройках.');
      }
      return generateStableDiffusionImage(enhancedPrompt, modelId, sdKey);
    
    case ImageGenProvider.DALL_E:
      const dalleKey = getApiKey(ImageGenProvider.DALL_E);
      if (!dalleKey) {
        throw new Error('API ключ DALL-E не найден. Добавьте ключ в настройках.');
      }
      return generateDALLEImage(enhancedPrompt, modelId, dalleKey);
    
    default:
      throw new Error(`Неподдерживаемый провайдер: ${model.provider}`);
  }
};

// Build enhanced prompt
const buildEnhancedPrompt = (
  userPrompt: string,
  hook: NutraHook,
  style: VisualStyle,
  vertical: NutraVertical,
  optionalTextPrompt: string
): string => {
  const styleMap: Record<VisualStyle, string> = {
    [VisualStyle.REALISM]: 'photorealistic, high quality',
    [VisualStyle.APPLE_MINIMAL]: 'minimalist, clean, Apple-style design',
    [VisualStyle.MEDICAL_CGI]: 'medical CGI, 3D rendered, scientific',
    [VisualStyle.ILLUSTRATION]: 'illustration, artistic',
    [VisualStyle.SKETCH]: 'hand-drawn sketch',
    [VisualStyle.MACRO]: 'macro photography, close-up',
    [VisualStyle.PIXEL_ART]: 'pixel art, 8-bit style',
    [VisualStyle.COMIC]: 'comic book style, pop art',
    [VisualStyle.ISOMETRIC_3D]: 'isometric 3D, clay style',
    [VisualStyle.UGC_NATIVE]: 'amateur phone camera style, TikTok',
    [VisualStyle.HEATMAP_XRAY]: 'thermal imaging, heatmap, X-ray',
    [VisualStyle.COLLAGE_MIX]: 'scrapbook, collage style',
    [VisualStyle.BLUEPRINT_TECH]: 'technical blueprint, schematic',
    [VisualStyle.NEWS_TV]: 'breaking news, TV interface',
    [VisualStyle.RETRO_WAVE]: 'retro wave, synthwave',
    [VisualStyle.GOTHIC_DARK]: 'gothic, dark mood',
    [VisualStyle.MINIMAL_LINE]: 'minimal line art',
    [VisualStyle.CLAYMORPHISM]: 'soft claymorphism'
  };
  
  const verticalMap: Record<NutraVertical, string> = {
    [NutraVertical.JOINTS]: 'joints, pain relief, arthritis',
    [NutraVertical.CARDIO]: 'heart, cardiovascular, circulation',
    [NutraVertical.WEIGHT_LOSS]: 'weight loss, diet, fitness',
    [NutraVertical.DIABETES]: 'diabetes, blood sugar, glucose',
    [NutraVertical.POTENCY]: 'men health, potency, vitality',
    [NutraVertical.VISION]: 'vision, eyes, eyesight',
    [NutraVertical.SKIN]: 'skin, rejuvenation, beauty',
    [NutraVertical.PARASITES]: 'parasites, detox, cleansing'
  };
  
  return `${userPrompt}, ${styleMap[style]}, ${verticalMap[vertical]}, advertising image, professional composition${optionalTextPrompt ? `, text: "${optionalTextPrompt}"` : ''}`;
};

// Batch generation
export const generateImagesBatch = async (
  count: number,
  prompt: string,
  modelId: string,
  hook: NutraHook,
  style: VisualStyle,
  vertical: NutraVertical,
  targetLanguage: string,
  optionalTextPrompt: string,
  referenceImages: string[] = [],
  autoGenerateText: boolean = false,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const results: string[] = [];
  
  for (let i = 0; i < count; i++) {
    if (onProgress) onProgress(i + 1, count);
    
    if (i > 0) {
      // Delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
      const image = await generateImage(
        prompt,
        modelId,
        hook,
        style,
        vertical,
        targetLanguage,
        optionalTextPrompt,
        referenceImages,
        autoGenerateText
      );
      results.push(image);
    } catch (error: any) {
      console.error(`Batch gen failed at index ${i}:`, error);
      throw error;
    }
  }
  
  return results;
};

