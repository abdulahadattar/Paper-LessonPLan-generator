import { Part } from '@google/genai';

/**
 * Converts a File object to a Gemini API Part with base64 inline data.
 * @param file - The file to convert
 * @returns A promise that resolves to the Part representation
 */
export async function fileToPart(file: File): Promise<Part> {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return {
        inlineData: {
            mimeType: file.type,
            data: base64,
        },
    };
}

/**
 * Parses grade and unit information from a PDF filename.
 * Expected format: "Physics.Grade.{N}.Unit.{N}....pdf" or similar.
 * @param fileName - The filename to parse
 * @returns The parsed grade and unit, or null if not found
 */
export function parseGradeAndUnitFromFileName(fileName: string): { grade: string; unit: string } | null {
    const gradeMatch = fileName.match(/Grade\s*(\d+)/i);
    const unitMatch = fileName.match(/Unit\s*(\d+)/i);
    if (gradeMatch && unitMatch) {
        return {
            grade: `Grade ${gradeMatch[1]}`,
            unit: unitMatch[1]
        };
    }
    return null;
}
