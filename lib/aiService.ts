// lib/aiService.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { File as FormidableFile } from 'formidable';
import { extractTextFromFile } from './fileProcessor'; 
import type { Message } from "@/types"; 

let genAI: GoogleGenerativeAI | null = null;

try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.error("AI_SERVICE_ERROR: GEMINI_API_KEY is not set.");
  }
} catch (error) {
  console.error("AI_SERVICE_ERROR: Failed to initialize Google Generative AI:", error);
}

export async function getAIResponseStream(
  userInput: string,
  conversationHistory: Message[] = [],
  sendChunk: (chunk: string) => void,
  uploadedFile?: FormidableFile
): Promise<void> {
  if (!genAI) {
    const errorMsg = "AI Service not initialized. Check API key.";
    console.error(`AI_SERVICE_STREAM_ERROR: ${errorMsg}`);
    sendChunk(JSON.stringify({ error: errorMsg, type: 'initialization_error' }));
    return;
  }

  try {
    let fileContentForPrompt = '';
    let isImageFile = false;
    let imageDataForApi: { inlineData: { data: string; mimeType: string; } } | null = null;

    if (uploadedFile) {
      const extractedContent = await extractTextFromFile(uploadedFile);
      if (uploadedFile.mimetype?.startsWith('image/')) {
        try {
          const parsedImageInfo = JSON.parse(extractedContent);
          if (parsedImageInfo.type === 'image') {
            isImageFile = true;
            imageDataForApi = {
              inlineData: {
                data: parsedImageInfo.data,
                mimeType: parsedImageInfo.mimeType
              }
            };
            fileContentForPrompt = `[Image: ${parsedImageInfo.filename}]`;
          } else {
            fileContentForPrompt = extractedContent; 
          }
        } catch {
          fileContentForPrompt = extractedContent; 
        }
      } else {
        fileContentForPrompt = extractedContent;
      }
    }

    // ✅ Hardcoded model
    const modelName = "gemini-2.5-pro";

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
      },
      safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]
    });

    const historyForPrompt = conversationHistory
      .slice(-10)
      .filter(msg => !(msg.type === "assistant" && msg.content.startsWith("🤖")) && !(msg.type === "assistant" && msg.content.startsWith("🛡️")))
      .map(msg => ({
        role: msg.type === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    const chatSession = model.startChat({
      history: historyForPrompt,
    });

    let fullPrompt = userInput;
    if (uploadedFile && !isImageFile) {
      fullPrompt = `The user has uploaded a file named "${uploadedFile.originalFilename}".\nFile Content:\n${fileContentForPrompt}\n\nUser's message related to this file: ${userInput}`;
    } else if (uploadedFile && isImageFile) {
      fullPrompt = `The user has uploaded an image named "${uploadedFile.originalFilename}". User's message related to this image: ${userInput}`;
    }

    const streamRequest = isImageFile && imageDataForApi
      ? [fullPrompt, imageDataForApi]
      : [fullPrompt];

    const result = await chatSession.sendMessageStream(streamRequest);

    for await (const chunk of result.stream) {
      if (chunk.candidates && chunk.candidates.length > 0) {
        const candidate = chunk.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part.text) {
            sendChunk(part.text);
          }
        }
      }
    }

  } catch (error: unknown) {
    console.error("AI_SERVICE_STREAM_ERROR Details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    let errorMessage = "🤖 I'm having trouble processing your request right now. Please try again.";
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("api key") || errorMsg.includes("authentication")) {
        errorMessage = "🔑 Authentication error with AI provider.";
      } else if (errorMsg.includes("quota") || errorMsg.includes("limit")) {
        errorMessage = "📊 AI provider API quota exceeded. Please try again later.";
      } else if (errorMsg.includes("blocked") || errorMsg.includes("safety")) {
        errorMessage = "🛡️ Your request was blocked due to safety settings by the AI provider.";
      } else if (errorMsg.includes("model") && (errorMsg.includes("not found") || errorMsg.includes("does not exist"))) {
        errorMessage = "🤷 AI Model not found or not accessible.";
      } else if ('code' in error && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
        errorMessage = "🌐 Network error connecting to AI provider. Please check your connection and try again.";
      }
    }
    sendChunk(JSON.stringify({ error: errorMessage, type: 'runtime_error' }));
  }
}
