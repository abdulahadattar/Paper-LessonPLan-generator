
export interface RemotePdf {
    name: string;
    grade: string;
    unit: string;
    url: string;
}

import { REMOTE_PDF_BASE_URL, REMOTE_PDF_FILE_NAMES } from '../../config/remotePdfs';

export const getRemotePdfs = (): RemotePdf[] => {
    return REMOTE_PDF_FILE_NAMES.map((name: string) => {
        const gradeMatch = name.match(/Grade\.(\d+)/);
        const unitMatch = name.match(/Unit\.(\d+)/);
        if (gradeMatch && unitMatch) {
            const originalUrl = `${REMOTE_PDF_BASE_URL}${name}`;
            return {
                name,
                grade: `Grade ${gradeMatch[1]}`,
                unit: unitMatch[1],
                url: originalUrl
            };
        }
        return null;
    }).filter((pdf): pdf is RemotePdf => pdf !== null);
};
