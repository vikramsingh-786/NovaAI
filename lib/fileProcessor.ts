import fs from 'fs/promises';
import path from 'path';
import { File as FormidableFile } from 'formidable';
import mammoth from 'mammoth';

export async function extractTextFromFile(file: FormidableFile): Promise<string> {
  const filePath = file.filepath;
  const mimeType = file.mimetype || '';
  const originalName = file.originalFilename || '';

  console.log(`FILE_PROCESSOR: Extracting text from file: ${originalName}, type: ${mimeType}`);

  try {
    if (mimeType === 'text/plain' || path.extname(originalName).toLowerCase() === '.txt') {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    }
    else if (mimeType === 'application/pdf') {
      console.warn(`FILE_PROCESSOR_WARN: PDF parsing not fully enabled for ${originalName}. Placeholder returned.`);
      return `[PDF file uploaded: ${originalName}. To enable PDF parsing, install and uncomment 'pdf-parse' related code.]`;
    }
    else if (mimeType.includes('application/msword') ||
             mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      try {
        const dataBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        console.log(`FILE_PROCESSOR: Word text extracted for ${originalName}`);
        return result.value;
      } catch (docError: any) {
        console.error(`FILE_PROCESSOR_ERROR: Error parsing Word document ${originalName}:`, docError);
        return `[Error parsing Word document: ${originalName}]`;
      }
    }
    else if (mimeType.startsWith('image/')) {
      const imageData = await fs.readFile(filePath);
      console.log(`FILE_PROCESSOR: Image data prepared for ${originalName}`);
      return JSON.stringify({
        type: 'image',
        data: imageData.toString('base64'),
        mimeType: mimeType,
        filename: originalName
      });
    }
    else {
      console.warn(`FILE_PROCESSOR_WARN: Unsupported file type: ${originalName} (${mimeType})`);
      return `[Unsupported file type: ${originalName} (${mimeType}). Supported types: TXT, PDF, DOC/DOCX, Images (PNG, JPG, GIF, WEBP)]`;
    }
  } catch (error: any) {
    console.error(`FILE_PROCESSOR_ERROR: Error processing file ${originalName}:`, error.message);
    return `[Error reading file: ${originalName}. Error: ${error.message}]`;
  }
}