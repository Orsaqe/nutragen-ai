
import { GoogleGenAI } from "@google/genai";
import { NutraHook, VisualStyle, NutraVertical } from '../types';
import { HOOK_DETAILS } from '../constants';

const getClient = () => {
  // 1. Check LocalStorage (User provided key)
  const localKey = localStorage.getItem('GEMINI_API_KEY');
  if (localKey && localKey.trim().length > 0) {
      console.log("Using API key from localStorage, key length:", localKey.trim().length);
      const client = new GoogleGenAI({ apiKey: localKey.trim() });
      console.log("Client created, available methods:", Object.keys(client));
      return client;
  }

  // 2. Check Environment Variable (Default system key)
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      console.error("No API key found in localStorage or environment");
      throw new Error("API Key not found. Please add your key in Settings.");
  }
  console.log("Using API key from environment");
  const client = new GoogleGenAI({ apiKey });
  console.log("Client created, available methods:", Object.keys(client));
  return client;
};

// Helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Получить список доступных моделей
const getAvailableModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      console.warn("Failed to fetch models list, using defaults");
      return [];
    }
    const data = await response.json();
    const models = data.models || [];
    // Фильтруем модели, которые поддерживают generateContent
    const supportedModels = models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name?.replace('models/', '') || m.name)
      .filter(Boolean);
    console.log("Available models with generateContent:", supportedModels);
    return supportedModels;
  } catch (error) {
    console.warn("Error fetching models list:", error);
    return [];
  }
};

// Функция для генерации изображения через REST API напрямую для Imagen
// Это правильный способ для Imagen моделей (как в Google AI Studio)
const generateImageViaREST = async (
  apiKey: string,
  prompt: string,
  referenceImages: string[] = []
): Promise<string> => {
  console.log("🚀 generateImageViaREST called with API key length:", apiKey.length);
  console.log("📝 Prompt length:", prompt.length);
  
  // Актуальные Imagen модели на ноябрь 2025
  const imagenModels = [
    'imagen-4-ultra-001',           // Imagen 4 Ultra - самая мощная
    'imagen-4-001',                  // Imagen 4 - универсальная
    'imagen-4',                      // Альтернативное название
    'imagen-3.0-generate-001',       // Imagen 3
    'imagen-3.0-fast-generate-001',  // Быстрая версия Imagen 3
    'imagen-2.0-plus-001',           // Старая версия (fallback)
    'imagen-2.0-001'                 // Старая версия (fallback)
  ];
  
  const baseUrls = [
    'https://generativelanguage.googleapis.com/v1beta',
    'https://ai.googleapis.com/v1beta',
    'https://generativelanguage.googleapis.com/v1'
  ];
  
  const requestBody: any = {
    prompt: prompt,
    number_of_images: 1,
    aspect_ratio: "1:1",
    safety_filter_level: "block_some",
    person_generation: "allow_all"
  };
  
  // Добавляем референсы, если есть
  if (referenceImages.length > 0) {
    requestBody.reference_images = referenceImages.map(img => {
      const matches = img.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return {
          bytes: matches[2]
        };
      }
      return null;
    }).filter(Boolean);
  }
  
  let lastError: any = null;
  
  // Пробуем все комбинации моделей и endpoints
  console.log(`🔍 Trying ${imagenModels.length} Imagen models across ${baseUrls.length} base URLs...`);
  
  for (const model of imagenModels) {
    for (const baseUrl of baseUrls) {
      const endpoints = [
        `${baseUrl}/models/${model}:generateImages?key=${apiKey}`,
        `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
      ];
      
      for (const apiUrl of endpoints) {
        try {
          console.log(`🔄 Trying Imagen REST: ${model} at ${baseUrl.substring(0, 50)}...`);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log(`📡 Response status: ${response.status} for ${model}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
            console.log(`❌ Endpoint failed (${response.status}):`, errorMsg);
            lastError = new Error(errorMsg);
            continue; // Пробуем следующий endpoint
          }
          
          const data = await response.json();
          
          // Проверяем разные форматы ответа Imagen
          if (data.generatedImages && data.generatedImages.length > 0) {
            const imageBase64 = data.generatedImages[0].imageBytes || 
                               data.generatedImages[0].base64String ||
                               data.generatedImages[0].bytes;
            if (imageBase64) {
              console.log("REST API success with Imagen!");
              return `data:image/png;base64,${imageBase64}`;
            }
          }
          
          // Также проверяем формат через candidates (как в Gemini)
          if (data.candidates && data.candidates.length > 0) {
            for (const part of data.candidates[0].content?.parts || []) {
              if (part.inlineData) {
                console.log("REST API success with inlineData!");
                return `data:image/png;base64,${part.inlineData.data}`;
              }
            }
          }
          
          throw new Error("Изображение не было сгенерировано");
        } catch (error: any) {
          console.log(`Endpoint error:`, error.message);
          lastError = error;
          continue;
        }
      }
    }
  }
  
  throw lastError || new Error("Все REST API endpoints для Imagen не сработали");
};

export const generateNutraImage = async (
  userPrompt: string,
  hook: NutraHook,
  style: VisualStyle,
  vertical: NutraVertical,
  targetLanguage: string,
  optionalTextPrompt: string,
  referenceImages: string[] = [],
  reserveSpaceForText: boolean = false
): Promise<string> => {
  try {
    // Проверка наличия API ключа
    const localKey = localStorage.getItem('GEMINI_API_KEY');
    if (!localKey || localKey.trim().length === 0) {
      throw new Error("API ключ не найден. Добавьте ключ в настройках.");
    }
    
    console.log("Starting image generation with prompt:", userPrompt.substring(0, 50) + "...");
    
    const hookInfo = HOOK_DETAILS.find(h => h.id === hook);
    const hookModifier = hookInfo ? hookInfo.promptModifier : "";
    
    // Construct a highly specific system-like prompt for the image model
    const textPrompt = `
      Create a high-quality advertising image for a Nutra (Health Supplement) campaign.
      
      Vertical (Niche): ${vertical}
      Marketing Angle: ${hook} (${hookModifier})
      Visual Style: ${style}
      Target Audience Language Context: ${targetLanguage}
      
      User Idea: "${userPrompt}"
      ${optionalTextPrompt ? `Text Requirement: The user explicitly wants text on the image like: "${optionalTextPrompt}". Integrate it naturally if possible, or leave clear space for it.` : "Text: Do NOT include text on the image unless it's a generic label or strictly necessary."}
      
      ${reserveSpaceForText ? "IMPORTANT COMPOSITION RULE: Leave the bottom 30% of the image relatively empty (negative space) or solid color so I can overlay text later. Do not put crucial details at the very bottom." : ""}

      Instructions:
      1. Analyze the User Idea. If it is in Russian, translate it to English internally to understand the context.
      2. Generate an image based on the Vertical, Marketing Angle, and Style.
      3. CRITICAL REQUIREMENT: Do NOT render generic 3D bottles, jars, pills, or packaging unless the User Idea explicitly asks for them (e.g., "show a bottle"). The user will add their own product layer later. The image should focus on the *problem* (pain, fat, skin issue) or the *result* (happiness, health), or the *ingredients* (herbs, science).
      4. Requirements:
         - High resolution, professional composition.
         - If Medical style: ensure anatomical correctness (artistic).
         - If Natural style: make it look organic and fresh.
         - If Pain based: visualize the area of discomfort clearly (e.g., glowing red knee, heatmap on back).
         - If Pixel Art style: make sure it looks like 8-bit or 16-bit retro game graphics.
         - If Comic style: use bold lines and pop-art colors.
         - Context: Ensure the image makes sense for the '${vertical}' niche.
      ${referenceImages.length > 0 ? "- Reference images have been provided. Use them as strong inspiration for the composition, color palette, or subject matter, but adapt them to the specified Nutra Marketing Angle." : ""}
    `;
    
    // ВАЖНО: В Google AI Studio используется Imagen API для генерации изображений!
    // Сначала пробуем REST API для Imagen (правильный способ)
    console.log("═══════════════════════════════════════════════════════════");
    console.log("=== STEP 1: Trying Imagen REST API first (as in Google AI Studio) ===");
    console.log("═══════════════════════════════════════════════════════════");
    
    try {
      console.log("📞 Calling generateImageViaREST...");
      const imagenResult = await generateImageViaREST(localKey.trim(), textPrompt, referenceImages);
      console.log("✅✅✅ Imagen REST API SUCCESS! ✅✅✅");
      return imagenResult;
    } catch (restError: any) {
      console.error("❌❌❌ Imagen REST API failed:", restError.message);
      console.error("❌ Full error:", restError);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("=== STEP 2: Falling back to library approach ===");
      console.log("═══════════════════════════════════════════════════════════");
      // Если REST не сработал, пробуем через библиотеку (может не работать для изображений)
    }
    
    // Пробуем через библиотеку с моделями, которые могут работать
    const ai = getClient();

    // Construct parts: Text prompt + any reference images
    const parts: any[] = [{ text: textPrompt }];

    referenceImages.forEach(img => {
        // img is expected to be a base64 data URL (e.g. "data:image/png;base64,.....")
        const matches = img.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const data = matches[2];
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: data
                }
            });
        }
    });

    // Список актуальных моделей на ноябрь 2025 (в порядке приоритета - НОВЫЕ ПЕРВЫМИ!)
    // ВАЖНО: Порядок имеет значение - сначала новые модели!
    const defaultModels = [
      // Gemini 2.5 модели (НОЯБРЬ 2025 - САМЫЕ НОВЫЕ!)
      'gemini-2.5-pro',                // Gemini 2.5 Pro - высокопроизводительная
      'gemini-2.5-flash',              // Gemini 2.5 Flash - оптимизированная
      'gemini-2.5-flash-lite',         // Gemini 2.5 Flash-Lite - бюджетная
      
      // Gemini 2.0 модели (февраль 2025)
      'gemini-2.0-pro-exp',            // Gemini 2.0 Pro Experimental
      'gemini-2.0-flash-thinking-exp', // Gemini 2.0 Flash Thinking
      'gemini-2.0-flash-exp',          // Gemini 2.0 Flash Experimental
      'gemini-2.0-flash-lite',         // Gemini 2.0 Flash-Lite
      'gemini-2.0-flash',               // Gemini 2.0 Flash
      
      // Gemini 1.5 модели (старые - в конце!)
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      
      // Старые модели (fallback - в самом конце)
      'gemini-pro',
      'gemini-pro-vision'
    ];
    
    // Получаем список доступных моделей
    console.log("Fetching available models from API...");
    const availableModels = await getAvailableModels(localKey.trim());
    console.log("Available models from API:", availableModels);
    
    // ПРИОРИТЕТ: Сначала новые модели из defaultModels (в порядке приоритета!)
    // ВАЖНО: Пробуем ВСЕ модели из defaultModels в указанном порядке, даже если их нет в availableModels!
    // Потому что availableModels может не включать все доступные модели
    const modelsToTry = [
      ...defaultModels  // Пробуем ВСЕ модели из defaultModels в порядке приоритета (новые первыми!)
    ];
    
    // Добавляем модели из availableModels, которых нет в defaultModels (в конце)
    const additionalModels = availableModels.filter(m => !defaultModels.includes(m));
    if (additionalModels.length > 0) {
      modelsToTry.push(...additionalModels);
      console.log("➕ Additional models from API:", additionalModels);
    }
    
    console.log("📋 Models to try (NEW FIRST! Total:", modelsToTry.length, "):", modelsToTry);
    
    if (modelsToTry.length === 0) {
      throw new Error("Не найдено доступных моделей. Проверьте API ключ.");
    }
    
    console.log("Models to try:", modelsToTry);
    
    let lastError: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        console.log("Parts count:", parts.length);
        
        // Проверяем доступные методы API
        console.log("AI client methods:", Object.keys(ai));
        console.log("AI models:", ai.models ? Object.keys(ai.models) : "no models");
        
        // Попробуем правильный формат для @google/genai
        // Возможно нужно использовать getGenerativeModel или другой метод
        let response;
        
        // ВАЖНО: Gemini API не поддерживает генерацию изображений!
        // Модели Gemini работают только с текстом и могут анализировать изображения, но не генерировать их
        // Попробуем использовать правильный формат вызова
        
        let response;
        
        // Формат 1: через models.generateContent (текущий)
        try {
          // Убираем imageConfig, так как Gemini не генерирует изображения
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                  role: 'user',
                  parts: parts
              }
            ]
          });
        } catch (error1: any) {
          console.log("Format 1 failed:", error1.message);
          
          // Формат 2: через getGenerativeModel (если доступен)
          if (typeof (ai as any).getGenerativeModel === 'function') {
            try {
              const model = (ai as any).getGenerativeModel({ model: modelName });
              response = await model.generateContent({
                contents: [
                  {
                      role: 'user',
                      parts: parts
                  }
                ]
              });
            } catch (error2: any) {
              console.log("Format 2 failed:", error2.message);
              throw error2;
            }
          } else {
            throw error1;
          }
        }
        
        console.log(`Success with model: ${modelName}`);
        console.log("Response received:", {
          hasCandidates: !!response.candidates,
          candidatesCount: response.candidates?.length || 0,
          fullResponse: response
        });

        // Проверяем разные форматы ответа
        // Для Imagen моделей ответ может быть в другом формате
        if (modelName.includes('imagen')) {
          // Imagen модели могут возвращать изображения в другом формате
          if (response.generatedImages && response.generatedImages.length > 0) {
            const imageBase64 = response.generatedImages[0].imageBytes || response.generatedImages[0].base64String;
            if (imageBase64) {
              console.log("Image generated successfully from Imagen model");
              return `data:image/png;base64,${imageBase64}`;
            }
          }
        }

        // Extract image из стандартного формата Gemini
        if (!response.candidates || response.candidates.length === 0) {
          console.error("No candidates in response:", response);
          throw new Error("API не вернул результат. Проверьте API ключ и попробуйте снова.");
        }

        const candidate = response.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.error("Finish reason:", candidate.finishReason);
          throw new Error(`Генерация остановлена: ${candidate.finishReason}. Возможно, контент был заблокирован или превышен лимит.`);
        }

        // Ищем изображение в parts
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData) {
            console.log("Image generated successfully from Gemini model");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
          // Также проверяем другие возможные форматы
          if (part.imageBytes) {
            console.log("Image found in imageBytes");
            return `data:image/png;base64,${part.imageBytes}`;
          }
        }
        
        // Если это не Imagen модель и нет изображения, значит Gemini вернул текст
        if (!modelName.includes('imagen')) {
          const textResponse = candidate.content?.parts?.find(p => p.text)?.text || '';
          console.warn("Gemini model returned text instead of image:", textResponse.substring(0, 100));
          throw new Error("Gemini API вернул текст, а не изображение. Для генерации изображений нужна модель Imagen.");
        }
        
        console.error("No image data in response:", response);
        throw new Error("Изображение не было сгенерировано. Проверьте API ключ и попробуйте другую идею.");
      } catch (error: any) {
        console.error(`Model ${modelName} failed:`, error);
        lastError = error;
        
        // Если это ошибка лимита или квоты, не пробуем другие модели
        const errorStr = JSON.stringify(error);
        if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED') || 
            errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
          throw error; // Пробрасываем сразу
        }
        
        // Если это ошибка "модель не найдена", пробуем следующую
        if (errorStr.includes('404') || errorStr.includes('NOT_FOUND') || errorStr.includes('model')) {
          continue; // Пробуем следующую модель
        }
        
        // Для других ошибок тоже пробуем следующую модель
        continue;
      }
    }
    
    // Если все модели не сработали, пробрасываем понятную ошибку
    if (lastError) {
      const errorStr = JSON.stringify(lastError);
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Превышен лимит запросов для бесплатного тарифа. Gemini API не поддерживает генерацию изображений на бесплатном тарифе. Для генерации изображений нужен Imagen API или платный тариф.");
      }
      throw lastError;
    }
    throw new Error("Не удалось использовать ни одну из доступных моделей. Gemini API не поддерживает генерацию изображений напрямую. Для генерации изображений нужен Imagen API.");
  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    
    // Улучшенная обработка ошибок
    if (error.message) {
      // Если уже есть понятное сообщение, используем его
      if (error.message.includes("API Key") || error.message.includes("401") || error.message.includes("403")) {
        throw new Error("Неверный API ключ. Проверьте ключ в настройках.");
      }
      if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("Превышен лимит запросов. Подождите немного и попробуйте снова.");
      }
      if (error.message.includes("SAFETY") || error.message.includes("BLOCKED")) {
        throw new Error("Контент был заблокирован системой безопасности. Попробуйте другую идею.");
      }
      throw error;
    }
    
    // Общая ошибка
    const errorStr = JSON.stringify(error);
    if (errorStr.includes("401") || errorStr.includes("403")) {
      throw new Error("Неверный API ключ. Проверьте ключ в настройках.");
    }
    if (errorStr.includes("429") || errorStr.includes("quota")) {
      throw new Error("Превышен лимит запросов. Подождите немного и попробуйте снова.");
    }
    
    throw new Error(error.message || `Ошибка генерации: ${errorStr.substring(0, 100)}`);
  }
};

export const generateNutraImagesBatch = async (
    count: number,
    userPrompt: string,
    hook: NutraHook,
    style: VisualStyle,
    vertical: NutraVertical,
    targetLanguage: string,
    optionalTextPrompt: string,
    referenceImages: string[] = [],
    autoGenerateText: boolean = false,
    onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
    // Generate 'count' images SEQUENTIALLY to avoid Rate Limits (429)
    const results: string[] = [];
    
    // If using custom key, we can go faster. If using system key, go slow.
    const isCustomKey = !!localStorage.getItem('GEMINI_API_KEY');
    const delayTime = isCustomKey ? 1000 : 5000; // 5s for free tier, 1s for paid

    for (let i = 0; i < count; i++) {
        // Report progress
        if (onProgress) onProgress(i + 1, count);
        
        if (i > 0) {
            await delay(delayTime); 
        }

        try {
            const image = await generateNutraImage(
                userPrompt, 
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
            
            // Retry Logic for 429
            const errStr = JSON.stringify(error);
            if (errStr.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('quota')) {
                console.warn("Quota exceeded. Waiting 10s and retrying once...");
                await delay(10000);
                try {
                     const imageRetry = await generateNutraImage(
                        userPrompt, hook, style, vertical, targetLanguage, optionalTextPrompt, referenceImages, autoGenerateText
                    );
                    results.push(imageRetry);
                    continue; // Success on retry
                } catch (retryErr: any) {
                    console.error("Retry failed:", retryErr);
                    // Пробрасываем ошибку дальше, чтобы пользователь увидел сообщение
                    throw retryErr;
                }
            } else {
                // Пробрасываем другие ошибки
                throw error;
            }
        }
    }
    
    return results;
};

export const generateMarketingText = async (
  promptOrTopic: string,
  languageCode: string = 'ru',
  type: 'headline' | 'body' | 'button' = 'headline'
): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = `
      You are a world-class copywriter for Nutra/CPA marketing.
      
      Task: Write a short, punchy ${type === 'headline' ? 'text overlay/headline' : type} for an ad creative.
      Input Context: "${promptOrTopic}"
      Target Language: ${languageCode}
      
      Constraints:
      - Language: MUST be in the target language (${languageCode}).
      - Length: Maximum 5-6 words. Short and impactful.
      - Style: Clickbait, Urgent, or Trustworthy (depending on context).
      - Return ONLY the text, no quotes, no explanations.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return response.text?.trim() || "Ошибка";
  } catch (error) {
    console.error("Gemini Text Gen Error:", error);
    return "Error";
  }
};

export const analyzeProductImage = async (base64Image: string): Promise<string> => {
    return "Product analyzed";
};
