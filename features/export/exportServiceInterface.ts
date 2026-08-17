import { LessonPlan } from '../../types/lesson';
import { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf } from './exportService';

export interface ILessonPlanExporter {
    exportAsDocx(lessonPlan: LessonPlan, sloId?: string): Promise<void>;
    exportAsPdf(lessonPlan: LessonPlan, sloId?: string): Promise<void>;
    exportMultipleLessonsAsDocx(lessonPlans: LessonPlan[], fileName: string): Promise<void>;
    exportMultipleLessonsAsPdf(lessonPlans: LessonPlan[], fileName: string): Promise<void>;
}

export const lessonPlanExporter: ILessonPlanExporter = {
    exportAsDocx: async (lessonPlan, sloId) => { await exportAsDocx(lessonPlan, sloId); },
    exportAsPdf: async (lessonPlan, sloId) => { await exportAsPdf(lessonPlan, sloId); },
    exportMultipleLessonsAsDocx: async (lessonPlans, fileName) => { await exportMultipleLessonsAsDocx(lessonPlans, fileName); },
    exportMultipleLessonsAsPdf: async (lessonPlans, fileName) => { await exportMultipleLessonsAsPdf(lessonPlans, fileName); },
};

export { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf };
