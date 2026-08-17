import { LessonPlan } from '../../types/lesson';
import { LessonPlanDocumentConfig } from '../../config/export';
import { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf } from './exportService';

export interface ILessonPlanExporter {
    exportAsDocx(lessonPlan: LessonPlan, sloId?: string, config?: Partial<LessonPlanDocumentConfig>): Promise<void>;
    exportAsPdf(lessonPlan: LessonPlan, sloId?: string, config?: Partial<LessonPlanDocumentConfig>): Promise<void>;
    exportMultipleLessonsAsDocx(lessonPlans: LessonPlan[], fileName: string, config?: Partial<LessonPlanDocumentConfig>): Promise<void>;
    exportMultipleLessonsAsPdf(lessonPlans: LessonPlan[], fileName: string, config?: Partial<LessonPlanDocumentConfig>): Promise<void>;
}

export const lessonPlanExporter: ILessonPlanExporter = {
    exportAsDocx: async (lessonPlan, sloId, config) => { await exportAsDocx(lessonPlan, sloId, config); },
    exportAsPdf: async (lessonPlan, sloId, config) => { await exportAsPdf(lessonPlan, sloId, config); },
    exportMultipleLessonsAsDocx: async (lessonPlans, fileName, config) => { await exportMultipleLessonsAsDocx(lessonPlans, fileName, config); },
    exportMultipleLessonsAsPdf: async (lessonPlans, fileName, config) => { await exportMultipleLessonsAsPdf(lessonPlans, fileName, config); },
};

export { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf };
