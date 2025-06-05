// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAIResponseStream } from '@/lib/aiService';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function parseFormData(req: NextRequest): Promise<{
  fields: formidable.Fields<string>;
  files: formidable.Files<string>;
}> {
  const formData = await req.formData();
  const fields: formidable.Fields<string> = {};
  const files: formidable.Files<string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${value.name}`);
      await fs.writeFile(tempFilePath, Buffer.from(await value.arrayBuffer()));

      const formidableFileAdapter = {
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

      const castedFile = formidableFileAdapter as FormidableFile;

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
      } else if (currentFieldsForKey) {
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
    const uploadedFile: FormidableFile | undefined = Array.isArray(uploadedFileArray) ? uploadedFileArray[0] : undefined;


    if (!userInput && !uploadedFile) {
      return NextResponse.json({ error: 'Message or file is required' }, { status: 400 });
    }

    let conversationHistory: Array<{ type: "user" | "assistant"; content: string }> = [];
    try {
      conversationHistory = JSON.parse(historyString) as Array<{ type: "user" | "assistant"; content: string }>;
    } catch (e) {
      console.error("Could not parse conversation history:", e);
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
        } catch (error: any) {
          const errorPayload = JSON.stringify({ error: "An error occurred in the API route.", details: error.message });
          controller.enqueue(new TextEncoder().encode(errorPayload));
          controller.close();
        } finally {
            if (tempFilePathToClean) {
                try {
                    await fs.unlink(tempFilePathToClean);
                } catch (cleanupError) {
                    console.error("Error cleaning up temp file:", tempFilePathToClean, cleanupError);
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

  } catch (error) {
    let errorMessage = 'Failed to process chat request';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};