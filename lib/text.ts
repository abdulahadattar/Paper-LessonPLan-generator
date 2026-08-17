import { TextRun } from 'docx';

/**
 * Parses text with markdown-style formatting into DOCX TextRun objects.
 * Supports: $$...$$ (display math), $...$ (inline math), **...** (bold), *...* (italic)
 * @param text - The text to parse
 * @returns Array of TextRun objects with formatting applied
 */
export function parseTextForDocx(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\s](?:[^\$]*[^\s])?\$|\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index), font: "Calibri", size: 22 }));
    }
    const matchedText = match[0];
    if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
      runs.push(new TextRun({ text: matchedText.slice(2, -2).trim(), bold: true, font: "Cambria Math", size: 24 }));
    } else if (matchedText.startsWith('$') && matchedText.endsWith('$')) {
      runs.push(new TextRun({ text: matchedText.slice(1, -1), bold: true, font: "Cambria Math", size: 22 }));
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      runs.push(new TextRun({ text: matchedText.slice(2, -2), bold: true, font: "Calibri", size: 22 }));
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      runs.push(new TextRun({ text: matchedText.slice(1, -1), italics: true, font: "Calibri", size: 22 }));
    }
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex), font: "Calibri", size: 22 }));
  }
  return runs;
}

/**
 * Parses text with markdown-style formatting into pdfmake-compatible objects.
 * Supports: $$...$$ (display math), $...$ (inline math), **...** (bold), *...* (italic)
 * @param text - The text to parse
 * @returns Array of pdfmake text objects with formatting applied
 */
export function parseTextForPdf(text: string): any[] {
    const parts: any[] = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\s](?:[^\$]*[^\s])?\$|\*\*.*?\*\*|\*.*?\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index) });
        }
        const matchedText = match[0];
        if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
            parts.push({ text: matchedText.slice(2, -2).trim(), bold: true, italics: true, fontSize: 12 });
        } else if (matchedText.startsWith('$') && matchedText.endsWith('$')) {
            parts.push({ text: matchedText.slice(1, -1), bold: true, italics: true });
        } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
            parts.push({ text: matchedText.slice(2, -2), bold: true });
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
            parts.push({ text: matchedText.slice(1, -1), italics: true });
        }
        lastIndex = match.index + matchedText.length;
    }
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex) });
    }
    return parts;
}
