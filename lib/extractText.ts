// pdf-parse's main entry runs a self-test on import; use the internal path to skip it.
const pdfParse: typeof import('pdf-parse') = require('pdf-parse/lib/pdf-parse.js');

export async function extractTextFromUpload(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // pdf-parse v1's bundled PDF.js uses the deprecated `new Buffer()` internally.
  // Suppress the DeprecationWarning since we have no control over that code.
  const originalEmit = process.emit.bind(process);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).emit = function (event: string, warning: any) {
    if (event === 'warning' && warning?.name === 'DeprecationWarning') return false;
    return originalEmit(event as Parameters<typeof originalEmit>[0], warning);
  };
  try {
    const data = await pdfParse(Buffer.from(arrayBuffer));
    return data.text;
  } finally {
    (process as any).emit = originalEmit;
  }
}
