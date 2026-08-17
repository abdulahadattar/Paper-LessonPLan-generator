export interface DocumentTheme {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    fontSize: {
        title: number;
        heading: number;
        body: number;
        sectionHeader: number;
    };
}

export interface LessonPlanDocumentConfig {
    schoolName: string;
    teacherName: string;
    documentTitle: string;
    period: string;
    dateTimeline: string;
    theme: DocumentTheme;
    margins: {
        docx: number;
        pdf: [number, number, number, number];
    };
    sectionHeaders: {
        resources: string;
        procedure: string;
        homework: string;
    };
}

export const DEFAULT_DOCUMENT_CONFIG: LessonPlanDocumentConfig = {
    schoolName: "Peoples Higher Secondary School Jamshoro",
    teacherName: "Abdul Ahad",
    documentTitle: "DAILY LESSON PLAN",
    period: "1",
    dateTimeline: "____________________",
    theme: {
        primaryColor: "#1F4E79",
        secondaryColor: "#000000",
        font: "Roboto",
        fontSize: {
            title: 14,
            heading: 12,
            body: 10,
            sectionHeader: 12,
        },
    },
    margins: {
        docx: 567,
        pdf: [15, 5, 15, 5],
    },
    sectionHeaders: {
        resources: "RESOURCES",
        procedure: "LESSON PROCEDURE & TIMINGS",
        homework: "HOMEWORK ASSIGNMENT",
    },
};

export const DOCX_STYLES = {
    headerTableTitle: { fontSize: 14, bold: true, alignment: 'center' as const, margin: [0, 2, 0, 2] },
    headerTableSub: { fontSize: 9, alignment: 'left' as const },
    headerTableBody: { fontSize: 9, alignment: 'left' as const },
    sectionHeader: { 
        fontSize: 12, 
        bold: true, 
        color: "#1F4E79", 
        margin: [0, 15, 0, 5] as [number, number, number, number], 
        decoration: 'underline' as const, 
        decorationColor: "#1F4E79" 
    },
    body: { fontSize: 10, lineHeight: 1.2, alignment: 'justify' as const },
};

export const PDF_STYLES = {
    headerTableTitle: { fontSize: 14, bold: true, alignment: 'center' as const, margin: [0, 2, 0, 2] },
    headerTableSub: { fontSize: 9, alignment: 'left' as const },
    headerTableBody: { fontSize: 9, alignment: 'left' as const },
    sectionHeader: { 
        fontSize: 12, 
        bold: true, 
        color: "#1F4E79", 
        margin: [0, 15, 0, 5] as [number, number, number, number], 
        decoration: 'underline' as const, 
        decorationColor: "#1F4E79" 
    },
    body: { fontSize: 10, lineHeight: 1.2, alignment: 'justify' as const },
};

export const EXPORT_CONSTANTS = {
    MAX_RETRIES: 1,
    RETRY_DELAY_MS: 1000,
    DOWNLOAD_TIMEOUT_MS: 180000,
    DOWNLOAD_RETRIES: 2,
    DOWNLOAD_RETRY_DELAY_MS: 2000,
    MIN_PDF_SIZE_BYTES: 1000,
} as const;
