import { createWorker } from 'tesseract.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  webp: 'image/webp',
};
const SUPPORTED_IMAGE_EXTENSIONS = new Set(Object.keys(IMAGE_MIME_BY_EXTENSION));
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  ...Object.values(IMAGE_MIME_BY_EXTENSION),
]);

export function isSupportedMedicalDocument(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return (
    file.type === 'application/pdf' ||
    extension === 'pdf' ||
    SUPPORTED_IMAGE_EXTENSIONS.has(extension) ||
    SUPPORTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())
  );
}

export function getMedicalDocumentMimeType(file: File): string {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'application/pdf';
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return IMAGE_MIME_BY_EXTENSION[extension] || file.type;
}

/**
 * Extracts text from an image using Tesseract.js OCR.
 * Returns the raw text content found in the image.
 */
export async function extractTextFromImage(
  imageFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    worker = await createWorker('eng', 1, {
      workerPath,
      workerBlobURL: false,
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    });
    const { data } = await worker.recognize(imageFile);
    return data.text || '';
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OCR failed: ${detail}. Check that the browser can load the OCR language data and try again.`);
  } finally {
    if (worker) await worker.terminate();
  }
}

/**
 * Extracts text from a PDF by rendering each page to a canvas and running OCR.
 * Uses pdfjs-dist to parse the PDF, then Tesseract.js for OCR on each page image.
 */
export async function extractTextFromPDF(
  pdfFile: File,
  onProgress?: (progress: number, page: number, totalPages: number) => void
): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Set the worker path for pdfjs
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not create canvas context for PDF rendering');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas } as never).promise;

    // Convert canvas to blob and run OCR
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    const pageText = await extractTextFromImage(blob, (p) => {
      if (onProgress) {
        const overallProgress = ((pageNum - 1) + p) / totalPages;
        onProgress(overallProgress, pageNum, totalPages);
      }
    });

    fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;

    if (onProgress) {
      onProgress(pageNum / totalPages, pageNum, totalPages);
    }
  }

  return fullText.trim();
}

/**
 * Main OCR function — detects file type and routes to the appropriate extractor.
 */
export async function extractText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isPDF = file.type === 'application/pdf' || extension === 'pdf';
  const isImage =
    SUPPORTED_IMAGE_EXTENSIONS.has(extension) ||
    SUPPORTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase());

  if (!isPDF && !isImage) {
    throw new Error(
      'Unsupported file type. Please upload a PDF or image file (PNG, JPG, JPEG, BMP, TIFF, WebP).'
    );
  }

  if (isPDF) {
    return extractTextFromPDF(file, (progress) => {
      if (onProgress) onProgress(progress);
    });
  }

  return extractTextFromImage(file, (progress) => {
    if (onProgress) onProgress(progress);
  });
}
