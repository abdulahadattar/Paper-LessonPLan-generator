
export interface RemotePdf {
    name: string;
    grade: string;
    unit: string;
    url: string;
}

import { REMOTE_PDF_BASE_URL, REMOTE_PDF_FILE_NAMES } from '../../config/remotePdfs';

/**
 * Gets the list of remote PDF textbooks available for context.
 * @returns An array of remote PDF metadata
 */
export const getRemotePdfs = (): RemotePdf[] => {
    return REMOTE_PDF_FILE_NAMES.map((name: string) => {
        const [gradeFolder, fileName] = name.split('/');
        const gradeMatch = gradeFolder.match(/Grade\s+(\d+)/i);
        const unitMatch = fileName.match(/Unit\s+(\d+)/i);
        if (gradeMatch && unitMatch) {
            const encodedUrl = encodeURI(`${REMOTE_PDF_BASE_URL}${name}`);
            return {
                name: fileName,
                grade: `Grade ${gradeMatch[1]}`,
                unit: unitMatch[1],
                url: encodedUrl
            };
        }
        return null;
    }).filter((pdf): pdf is RemotePdf => pdf !== null);
};
