// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseStream } from '@/lib/aiService';
import { File as FormidableFile, Fields, Files } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface FormidableFileAdapter {
  size: number;
  filepath: string;
  originalFilename: string | null;
  newFilename: string;
  mimetype: string | null;
  mtime: Date | null;
  toJSON: () => object;
}

async function parseFormData(req: NextRequest): Promise<{
  fields: Fields<string>;
  files: Files<string>;
}> {
  const formData = await req.formData();
  const fields: Fields<string> = {};
  const files: Files<string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${value.name}`);
      await fs.writeFile(tempFilePath, Buffer.from(await value.arrayBuffer()));

      const formidableFileAdapter: FormidableFileAdapter = {
        size: value.size,
        filepath: tempFilePath,
        originalFilename: value.name,
        newFilename: path.basename(tempFilePath),
        mimetype: value.type,
        mtime: new Date(value.lastModified),
        toJSON: function(): object {
          return {
            size: this.size,
            filepath: this.filepath,
            originalFilename: this.originalFilename,
            newFilename: this.newFilename,
            mimetype: this.mimetype,
            mtime: this.mtime,
          };
        },
      };

      const castedFile = formidableFileAdapter as unknown as FormidableFile;

      const currentFilesForKey = files[key];
      if (Array.isArray(currentFilesForKey)) {
        currentFilesForKey.push(castedFile);
      } else {
        files[key] = [castedFile];
      }
    } else {
      const currentFieldsForKey = fields[key];
      if (Array.isArray(currentFieldsForKey)) {
        currentFieldsForKey.push(value);
      } else if (currentFieldsForKey !== undefined) {
         fields[key] = [currentFieldsForKey, value];
      }
      else {
        fields[key] = [value];
      }
    }
  }
  return { fields, files };
}


export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseFormData(req);

    const userInput = fields.message?.[0] || "";
    const historyString = fields.conversationHistory?.[0] || "[]";
    const uploadedFileArray = files.file;
    
    const uploadedFile: FormidableFile | undefined = Array.isArray(uploadedFileArray) 
        ? uploadedFileArray[0] 
        : uploadedFileArray;


    if (!userInput && !uploadedFile) {
      return NextResponse.json({ error: 'Message or file is required' }, { status: 400 });
    }

    let conversationHistory: Array<{ type: "user" | "assistant"; content: string }> = [];
    try {
      conversationHistory = JSON.parse(historyString) as Array<{ type: "user" | "assistant"; content: string }>;
    } catch (e: unknown) {
      console.error("Could not parse conversation history:", e instanceof Error ? e.message : e);
    }
    
    let tempFilePathToClean: string | null = null;
    if (uploadedFile) {
        tempFilePathToClean = uploadedFile.filepath;
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendChunk = (chunk: string) => {
            controller.enqueue(new TextEncoder().encode(chunk));
          };

          await getAIResponseStream(
            userInput,
            conversationHistory,
            sendChunk,
            uploadedFile
          );
          
          controller.close();
        } catch (error: unknown) {
          let detailMessage = "Unknown error during stream generation";
          if (error instanceof Error) {
            detailMessage = error.message;
          } else if (typeof error === 'string') {
            detailMessage = error;
          }
          const errorPayload = JSON.stringify({ error: "An error occurred in the API route.", details: detailMessage });
          console.error('Error during AI stream generation in route:', error);
          controller.enqueue(new TextEncoder().encode(errorPayload));
          controller.close();
        } finally {
            if (tempFilePathToClean) {
                try {
                    await fs.unlink(tempFilePathToClean);
                } catch (cleanupError: unknown) {
                    console.error("Error cleaning up temp file:", tempFilePathToClean, cleanupError instanceof Error ? cleanupError.message : cleanupError);
                }
            }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    let errorMessage = 'Failed to process chat request';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    console.error('Error in POST /api/chat (outer):', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// This is the Next.js Edge API Route configuration
export const config = {
  api: {
    bodyParser: false, // Correct for manual FormData parsing
  }, // <--- FIXED: Ensure this curly brace closes the 'api' object
};