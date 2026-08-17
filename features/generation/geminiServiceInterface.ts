import { LessonPlan } from '../../types/lesson';
import { SLO } from '../../types/slo';
import { Part } from '@google/genai';
import { generateLessonPlan } from './geminiService';

export interface IGeminiService {
    generateLessonPlan(slo: SLO, unitSlos: SLO[], contextFileParts?: Part[]): Promise<LessonPlan>;
}

export const geminiService: IGeminiService = {
    generateLessonPlan: async (slo, unitSlos, contextFileParts) => { 
        return generateLessonPlan(slo, unitSlos, contextFileParts); 
    },
};

export { generateLessonPlan };
