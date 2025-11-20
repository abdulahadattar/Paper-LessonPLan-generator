
export interface Activity {
  name: string;
  duration: number; // Duration in minutes
  description: string;
}

export interface LessonPlan {
  title: string;
  objective: string;
  gradeLevel: string;
  subject: string;
  materials: string[];
  activities: Activity[];
  homework: string;
  unitNumber?: string; // Added to track context
}

export interface SLO {
  SLO_ID: string;
  Unit_Name: string;
  SLO_Text: string;
  grade?: string;
  Section_Name: string;
  Unit_Number: string;
  Cognitive_Level_Code: string;
  uniqueId?: string;
}

export type GroupedSlos = Record<string, SLO[]>;

export interface UnitsByGrade {
  [grade: string]: GroupedSlos;
}

export interface ContextPdf {
    name: string;
    grade: string;
    unit: string;
    file?: File;
    url?: string;
}

export type ExportOption = 'individual' | 'byUnit' | 'byGrade' | 'all';