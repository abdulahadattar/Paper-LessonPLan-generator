
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import { LessonPlan, SLO, ContextPdf, ExportOption } from '../types';
import { generateLessonPlan } from '../services/geminiService';
import { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf, formatFileName } from '../services/exportService';
import { get, set } from 'idb-keyval';

export const useLessonGeneration = (allSlos: SLO[], contextPdfs: ContextPdf[]) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
    const [logMessages, setLogMessages] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [generatedPlans, setGeneratedPlans] = useState<LessonPlan[]>([]);
    
    const isCancelledRef = useRef(false);
    const fetchPromisesRef = useRef(new Map<string, Promise<string>>());

    const fileToPart = useCallback(async (file: File): Promise<Part> => {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
        return {
            inlineData: {
                mimeType: file.type,
                data: base64,
            },
        };
    }, []);

    const urlToPart = useCallback(async (url: string): Promise<Part> => {
        // 1. Check IndexedDB for cached file URI
        try {
            const cachedUri = await get<string>(url);
            if (cachedUri) {
                // console.log(`[Cache Hit] Using cached URI for: ${url}`);
                return { fileData: { mimeType: 'application/pdf', fileUri: cachedUri } };
            }
        } catch (e) {
            console.warn('Failed to read from cache', e);
        }

        // 2. Deduplication for in-flight requests
        if (fetchPromisesRef.current.has(url)) {
            const uri = await fetchPromisesRef.current.get(url)!;
             return { fileData: { mimeType: 'application/pdf', fileUri: uri } };
        }

        const downloadAndUpload = async (): Promise<string> => {
            let blob: Blob | null = null;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            try {
                // Attempt direct fetch (Raw GitHub or enabled CORS source)
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) {
                     throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
                }
                blob = await response.blob();
            } catch (error: any) {
                if (error.name === 'AbortError') throw new Error("Download timed out after 30s");
                throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                clearTimeout(timeoutId);
            }

            if (!blob || blob.size < 1000) {
                throw new Error(`Downloaded file is too small (${blob?.size} bytes), likely invalid.`);
            }

            // Upload to Gemini
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const filename = url.split('/').pop()?.split('?')[0] || 'textbook.pdf';
            const file = new File([blob], filename, { type: 'application/pdf' });

            const uploadResponse = await ai.files.upload({
                file: file,
                config: { displayName: filename, mimeType: 'application/pdf' }
            });
            
            // Robustly get the URI
            const uri = (uploadResponse as any).file?.uri || uploadResponse.uri;
            
            if (!uri) {
                console.error("Upload response:", uploadResponse);
                throw new Error("Upload successful but no URI returned from Gemini API.");
            }

            // Cache result in IndexedDB
            await set(url, uri); 
            return uri;
        };

        const promise = downloadAndUpload();
        fetchPromisesRef.current.set(url, promise);

        try {
            const uri = await promise;
            return { fileData: { mimeType: 'application/pdf', fileUri: uri } };
        } catch (error) {
             throw new Error(`Failed to process PDF ${url.split('/').pop()}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
             fetchPromisesRef.current.delete(url);
        }
    }, []);

    const getContextPartsForSlo = useCallback(async (grade: string, unitNumber: string) => {
        const contextPdfsForSlo = contextPdfs.filter(p => p.grade === grade && parseInt(p.unit, 10) === parseInt(unitNumber, 10));
        const contextFileParts: Part[] = [];
        if (contextPdfsForSlo.length > 0) {
            for (const pdf of contextPdfsForSlo) {
                try {
                    let part: Part | undefined;
                    if (pdf.file) {
                        part = await fileToPart(pdf.file);
                    } else if (pdf.url) {
                        part = await urlToPart(pdf.url);
                    }
                    if (part) contextFileParts.push(part);
                } catch (e) {
                    console.error(`Error processing ${pdf.name}`, e);
                    setLogMessages(prev => [...prev, `ERROR processing ${pdf.name}: ${e instanceof Error ? e.message : 'Unknown error'}`]);
                }
            }
        }
        return contextFileParts;
    }, [contextPdfs, fileToPart, urlToPart]);

    const generateAllLessonPlans = useCallback(async (selectedSloUniqueIds: string[], exportOption: ExportOption) => {
        isCancelledRef.current = false;
        setIsLoading(true);
        setIsComplete(false);
        setGeneratedPlans([]);
        setLogMessages(['Starting lesson plan generation...']);
        const selectedSlos = allSlos.filter(slo => selectedSloUniqueIds.includes(slo.uniqueId!));
        let wasCancelled = false;
        const allGeneratedPlans: LessonPlan[] = [];
        
        const processSlo = async (slo: SLO): Promise<LessonPlan | null> => {
            const MAX_RETRIES = 1; 
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (isCancelledRef.current) return null; 
                    if (attempt > 0) {
                        setLogMessages(prev => [...prev, `Retrying generation for ${slo.SLO_ID}...`]);
                    }
                    const unitContextSlos = selectedSlos.filter(s => s.grade === slo.grade && s.Unit_Name === slo.Unit_Name);
                    
                    if (attempt === 0) setLogMessages(prev => [...prev, `Preparing context for ${slo.SLO_ID}...`]);
                    const contextFileParts = await getContextPartsForSlo(slo.grade!, slo.Unit_Number);
    
                    if (contextFileParts.length === 0 && attempt === 0) {
                         setLogMessages(prev => [...prev, `WARN: No valid context PDF found for SLO ${slo.SLO_ID}. Generation will rely on internal knowledge.`]);
                    }
                    
                    if (attempt === 0) setLogMessages(prev => [...prev, `Generating lesson plan content...`]);
                    const plan = await generateLessonPlan(slo, unitContextSlos, contextFileParts);
                    
                    plan.unitNumber = slo.Unit_Number;
                    
                    setLogMessages(prev => [...prev, `Content received for "${plan.title}"`]);
                    return plan;
                } catch (error) {
                    const errorMsg = `Failed for ${slo.SLO_ID} (Attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error instanceof Error ? error.message : String(error)}`;
                    console.error(errorMsg);
                    setLogMessages(prev => [...prev, `ERROR: ${errorMsg}`]);
                    if (attempt < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            setLogMessages(prev => [...prev, `ERROR: Skipped ${slo.SLO_ID} after all attempts failed.`]);
            return null;
        };
    
        if (exportOption === 'individual') {
            setGenerationProgress({ current: 0, total: selectedSlos.length });
            for (let i = 0; i < selectedSlos.length; i++) {
                if (isCancelledRef.current) { wasCancelled = true; break; }
                const slo = selectedSlos[i];
                setGenerationProgress({ current: i + 1, total: selectedSlos.length });
                setLogMessages(prev => [...prev, `\nProcessing SLO: ${slo.SLO_ID}`]);
                
                const plan = await processSlo(slo);
                if (plan) {
                    allGeneratedPlans.push(plan);
                    setLogMessages(prev => [...prev, `Exporting individual files...`]);
                    await exportAsDocx(plan, slo.SLO_ID);
                    await new Promise(resolve => setTimeout(resolve, 250));
                    await exportAsPdf(plan, slo.SLO_ID);
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            }
        } else {
            let groups: Map<string, SLO[]>;
            switch (exportOption) {
                case 'byUnit':
                    groups = selectedSlos.reduce((acc, current) => {
                        const key = `${current.grade}_${current.Unit_Name}`;
                        if (!acc.has(key)) acc.set(key, []);
                        acc.get(key)!.push(current);
                        return acc;
                    }, new Map());
                    break;
                case 'byGrade':
                    groups = selectedSlos.reduce((acc, current) => {
                        const key = current.grade!;
                        if (!acc.has(key)) acc.set(key, []);
                        acc.get(key)!.push(current);
                        return acc;
                    }, new Map());
                    break;
                case 'all':
                default:
                    groups = new Map([['all_selected_plans', selectedSlos]]);
                    break;
            }
    
            setGenerationProgress({ current: 0, total: selectedSlos.length });
            let processedCount = 0;
    
            for (const [key, slosInGroup] of groups.entries()) {
                if (wasCancelled) break;
                if (slosInGroup.length === 0) continue;
                
                const groupName = key.replace(/_/g, ' ');
                setLogMessages(prev => [...prev, `\n--- Starting group: ${groupName} ---`]);
    
                const generatedPlansForGroup: LessonPlan[] = [];
                for (const slo of slosInGroup) {
                    if (isCancelledRef.current) { wasCancelled = true; break; }
                    processedCount++;
                    setGenerationProgress({ current: processedCount, total: selectedSlos.length });
                    setLogMessages(prev => [...prev, `Processing SLO: ${slo.SLO_ID}`]);
                    const plan = await processSlo(slo);
                    if (plan) {
                        generatedPlansForGroup.push(plan);
                    }
                }
                allGeneratedPlans.push(...generatedPlansForGroup);
                
                if (generatedPlansForGroup.length > 0 && !wasCancelled) {
                    const fileName = formatFileName(groupName);
                    setLogMessages(prev => [...prev, `Combining and exporting ${fileName}.pdf...`]);
                    await exportMultipleLessonsAsPdf(generatedPlansForGroup, fileName);
                    await new Promise(resolve => setTimeout(resolve, 250));
                    
                    setLogMessages(prev => [...prev, `Combining and exporting ${fileName}.docx...`]);
                    await exportMultipleLessonsAsDocx(generatedPlansForGroup, fileName);
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            }
        }
        
        setGeneratedPlans(allGeneratedPlans);
    
        if (wasCancelled) {
            setLogMessages(prev => [...prev, `\nGeneration cancelled by user.`]);
        } else {
            setLogMessages(prev => [...prev, `\nGeneration finished.`]);
            setIsComplete(true);
        }
    
        setIsLoading(false);
        setGenerationProgress(null);
    }, [allSlos, getContextPartsForSlo]);

    const stopGeneration = useCallback(() => {
        isCancelledRef.current = true;
    }, []);

    const clearLogs = useCallback(() => {
        setLogMessages([]);
        setIsComplete(false);
        setGeneratedPlans([]);
    }, []);

    return {
        generateAllLessonPlans,
        stopGeneration,
        isLoading,
        generationProgress,
        logMessages,
        isComplete,
        generatedPlans,
        clearLogs
    };
};
