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
