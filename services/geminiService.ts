
import { GoogleGenAI } from "@google/genai";
import { NutraHook, VisualStyle, NutraVertical } from '../types';
import { HOOK_DETAILS } from '../constants';

const getClient = () => {
  // 1. Check LocalStorage (User provided key)
  const localKey = localStorage.getItem('GEMINI_API_KEY');
  if (localKey && localKey.trim().length > 0) {
      return new GoogleGenAI({ apiKey: localKey });
  }

  // 2. Check Environment Variable (Default system key)
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please add your key in Settings.");
  return new GoogleGenAI({ apiKey });
};

// Helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const ai = getClient();
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
            role: 'user',
            parts: parts
        }
      ],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
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
                } catch (retryErr) {
                    console.error("Retry failed, stopping batch.");
                    break;
                }
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
