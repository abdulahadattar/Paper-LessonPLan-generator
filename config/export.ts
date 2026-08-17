export type GradeLevel = 'ECCE' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12';

export interface SubjectOption {
    value: string;
    label: string;
}

export interface GradeConfig {
    subjects: SubjectOption[];
}

export interface SectionVisibility {
    objective: boolean;
    resources: boolean;
    procedure: boolean;
    homework: boolean;
}

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
    gradeLevel: GradeLevel;
    subject: string;
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
    sectionVisibility: SectionVisibility;
}

export const GRADE_CONFIG: Record<GradeLevel, { subjects: SubjectOption[] }> = {
    'ECCE': {
        subjects: []
    },
    'Grade 1': {
        subjects: [
            { value: 'english', label: 'English' },
            { value: 'math', label: 'Mathematics' },
            { value: 'general_knowledge', label: 'General Knowledge' },
        ]
    },
    'Grade 2': {
        subjects: [
            { value: 'general_knowledge', label: 'General Knowledge' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
        ]
    },
    'Grade 3': {
        subjects: [
            { value: 'general_knowledge', label: 'General Knowledge' },
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
        ]
    },
    'Grade 4': {
        subjects: [
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'science', label: 'Science' },
            { value: 'social_studies', label: 'Social Studies' },
        ]
    },
    'Grade 5': {
        subjects: [
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'science', label: 'Science' },
            { value: 'social_studies', label: 'Social Studies' },
        ]
    },
    'Grade 6': {
        subjects: [
            { value: 'arabic', label: 'Arabic' },
            { value: 'computer_education', label: 'Computer Education' },
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'social_studies', label: 'Social Studies' },
        ]
    },
    'Grade 7': {
        subjects: [
            { value: 'arabic', label: 'Arabic' },
            { value: 'computer_education', label: 'Computer Education' },
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'science', label: 'Science' },
            { value: 'social_studies', label: 'Social Studies' },
        ]
    },
    'Grade 8': {
        subjects: [
            { value: 'computer_education', label: 'Computer Education' },
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'science', label: 'Science' },
            { value: 'social_studies', label: 'Social Studies' },
        ]
    },
    'Grade 9': {
        subjects: [
            { value: 'biology', label: 'Biology' },
            { value: 'chemistry', label: 'Chemistry' },
            { value: 'computer_science', label: 'Computer Science' },
            { value: 'islamiyat', label: 'Islamiyat' },
            { value: 'math', label: 'Mathematics' },
            { value: 'my_english', label: 'My English' },
            { value: 'physics', label: 'Physics' },
            { value: 'religious_studies', label: 'Religious Studies' },
        ]
    },
    'Grade 10': {
        subjects: [
            { value: 'biology', label: 'Biology' },
            { value: 'chemistry', label: 'Chemistry' },
            { value: 'computer_science', label: 'Computer Science' },
            { value: 'math', label: 'Mathematics' },
            { value: 'pak_studies', label: 'Pak Studies' },
            { value: 'physics', label: 'Physics' },
            { value: 'secondary_stage_english', label: 'Secondary Stage English' },
        ]
    },
    'Grade 11': {
        subjects: [
            { value: 'biology', label: 'Biology' },
            { value: 'chemistry', label: 'Chemistry' },
            { value: 'english', label: 'English' },
            { value: 'math', label: 'Mathematics' },
            { value: 'physics', label: 'Physics' },
        ]
    },
    'Grade 12': {
        subjects: [
            { value: 'biology', label: 'Biology' },
            { value: 'chemistry', label: 'Chemistry' },
            { value: 'math', label: 'Mathematics' },
            { value: 'physics', label: 'Physics' },
        ]
    },
};

export const DEFAULT_DOCUMENT_CONFIG: LessonPlanDocumentConfig = {
    schoolName: "Peoples Higher Secondary School Jamshoro",
    teacherName: "",
    documentTitle: "LESSON PLAN",
    gradeLevel: 'Grade 1',
    subject: 'english',
    period: "",
    dateTimeline: "",
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
    sectionVisibility: {
        objective: true,
        resources: true,
        procedure: true,
        homework: true,
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
