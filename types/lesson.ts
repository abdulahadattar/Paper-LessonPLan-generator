export interface Activity {
  name: string;
  duration: number;
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
  unitNumber?: string;
}
