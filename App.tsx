
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SLO, GroupedSlos, LessonPlan, UnitsByGrade } from './types';
import { generateLessonPlan } from './services/geminiService';
import { loadInitialSlos } from './services/sloService';
import InputPanel from './components/InputPanel';
import { InfoIcon, CloseIcon } from './components/icons/MiscIcons';
import { WandIcon } from './components/icons/WandIcon';
import { exportAsPdf, exportAsDocx, formatFileName, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf } from './services/exportService';
import { Part } from '@google/genai';
import { getRemotePdfs } from './services/remoteContextService';
import ResultsPanel from './components/ResultsPanel';
import SloPanel from './components/SloPanel';
import Header from './components/Header';
import GenerationStatusPanel from './components/GenerationStatusPanel';


interface ContextPdf {
    name: string;
    grade: string;
    unit: string;
    file?: File;
    url?: string;
}

type ExportOption = 'individual' | 'byUnit' | 'byGrade' | 'all';
type View = 'slo' | 'results';
type Theme = 'light' | 'dark';

// --- App Component ---
const App: React.FC = () => {
  const [unitsByGrade, setUnitsByGrade] = useState<UnitsByGrade>({});
  const [allSlos, setAllSlos] = useState<SLO[]>([]);
  const [selectedSloUniqueIds, setSelectedSloUniqueIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(true);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  // Initialize sidebar as closed on mobile to prevent overlap (stacked UI issue)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [exportOption, setExportOption] = useState<ExportOption>('individual');
  const isCancelledRef = useRef(false);

  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [contextPdfs, setContextPdfs] = useState<ContextPdf[]>([]);
  const [view, setView] = useState<View>('slo');
  const [generatedPlans, setGeneratedPlans] = useState<LessonPlan[]>([]);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
  }, []);

  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  // Persistent PDF cache
  const pdfCache = useMemo(() => new Map<string, string>(), []);


  useEffect(() => {
    const fetchInitialData = async () => {
        setIsParsing(true);
        
        // Load SLOs
        const parsedSlos = await loadInitialSlos();
        const slosWithUniqueIds = parsedSlos.map((slo, index) => ({
            ...slo,
            uniqueId: `${slo.SLO_ID}_${index}`
        }));
        setAllSlos(slosWithUniqueIds);

        const grouped = slosWithUniqueIds.reduce<UnitsByGrade>((acc, slo) => {
            const grade = slo.grade || 'Ungraded';
            const unit = slo.Unit_Name || 'General';
            if (!acc[grade]) acc[grade] = {};
            if (!acc[grade][unit]) acc[grade][unit] = [];
            acc[grade][unit].push(slo);
            return acc;
        }, {} as UnitsByGrade);
        setUnitsByGrade(grouped);
        
        // Load remote PDFs by default
        const remotePdfs = getRemotePdfs();
        setContextPdfs(remotePdfs.map(p => ({
            name: p.name,
            grade: p.grade,
            unit: p.unit,
            url: p.url,
        })));
        setDirectoryName("Online Textbooks");

        setIsParsing(false);
    };
    fetchInitialData();
  }, []);
  
  const missingPdfSloIds = useMemo(() => {
    const selectedSlos = allSlos.filter(slo => selectedSloUniqueIds.includes(slo.uniqueId!));
    if (selectedSlos.length === 0) return [];

    return selectedSlos
        .filter(slo => {
            const grade = slo.grade;
            const unitNumStr = slo.Unit_Number;
            const sloUnitNum = parseInt(unitNumStr, 10);
            if (isNaN(sloUnitNum)) return true; 

            return !contextPdfs.some(pdf => 
                pdf.grade === grade && parseInt(pdf.unit, 10) === sloUnitNum
            );
        })
        .map(slo => slo.uniqueId!);
  }, [selectedSloUniqueIds, allSlos, contextPdfs]);

  const fileToPart = async (file: File): Promise<Part> => {
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
  };
  
  // Robust URL Fetcher with Proxy Rotation
  const urlToPart = async (url: string): Promise<Part> => {
    if (pdfCache.has(url)) {
        return {
            inlineData: {
                mimeType: 'application/pdf',
                data: pdfCache.get(url)!,
            },
        };
    }

    // List of proxies to try in order. 
    // These services help bypass CORS by adding the correct headers.
    const proxyServices = [
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://api.allorigins.win/raw?url=' 
    ];

    let lastError: Error | null = null;

    for (const proxyBase of proxyServices) {
        try {
            const proxiedUrl = proxyBase + encodeURIComponent(url);
            // console.log(`Attempting download via: ${proxyBase}`); // Optional debugging

            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                throw new Error(`Proxy ${proxyBase} returned status ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Critical Validation: 
            // Proxies often return small JSON error objects (e.g., 9 bytes) when rate-limited or failed.
            // A valid textbook PDF will be significantly larger than 3KB.
            if (blob.size < 3000) {
                 throw new Error(`File too small (${blob.size} bytes). Likely a proxy error message.`);
            }
            
            if (blob.type && (blob.type.includes('json') || blob.type.includes('html'))) {
                 throw new Error(`Invalid content type: ${blob.type}`);
            }

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = () => {
                    const result = (reader.result as string).split(',')[1];
                    pdfCache.set(url, result); 
                    resolve(result);
                };
                reader.onerror = (error) => reject(error);
            });
            
            // If we got here, success! Return the part.
            return {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64,
                },
            };

        } catch (e) {
            // console.warn(`Failed with proxy ${proxyBase}:`, e);
            lastError = e instanceof Error ? e : new Error(String(e));
            // Loop continues to next proxy...
        }
    }

    // If all proxies fail
    throw new Error(`Failed to download PDF after trying multiple sources. Last error: ${lastError?.message}`);
  };

  const getContextPartsForSlo = async (grade: string, unitNumber: string) => {
      const contextPdfsForSlo = contextPdfs.filter(p => p.grade === grade && parseInt(p.unit, 10) === parseInt(unitNumber, 10));
      const contextFileParts: Part[] = [];
      if (contextPdfsForSlo.length > 0) {
          for (const pdf of contextPdfsForSlo) {
              try {
                  let part: Part | undefined;
                  if (pdf.file) {
                      part = await fileToPart(pdf.file);
                  } else if (pdf.url) {
                      // Notify user we are fetching
                      // setLogMessages(prev => [...prev, `Fetching ${pdf.name}...`]);
                      part = await urlToPart(pdf.url);
                  }
                  if (part) contextFileParts.push(part);
              } catch (e) {
                  console.error(`Error processing ${pdf.name}`, e);
                  // Log this error to the UI so the user knows which file failed
                  setLogMessages(prev => [...prev, `ERROR downloading ${pdf.name}: ${e instanceof Error ? e.message : 'Unknown error'}`]);
              }
          }
      }
      return contextFileParts;
  };


  const generateAllLessonPlans = async () => {
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
  };

  const handleDirectorySelected = (files: FileList) => {
    if (files.length > 0) {
      const fileArray = Array.from(files);
      const firstPath = fileArray[0].webkitRelativePath;
      if (firstPath) {
        const rootDir = firstPath.split('/')[0];
        setDirectoryName(rootDir);
      } else {
        setDirectoryName("Selected Folder");
      }

      const pdfs: ContextPdf[] = [];
      for (const file of fileArray) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const gradeMatch = file.name.match(/Grade (\d+)/i);
          const unitMatch = file.name.match(/Unit (\d+)/i);
          if (gradeMatch && unitMatch) {
            const grade = `Grade ${gradeMatch[1]}`;
            const unit = unitMatch[1];
            pdfs.push({ name: file.name, grade, unit, file });
          }
        }
      }
      setContextPdfs(pdfs);
    }
  };

  const displayablePdfs = useMemo(() => 
    contextPdfs.map(({ name, grade, unit }) => ({ name, grade, unit })), 
  [contextPdfs]);
  
  const handleCloseGenerationPanel = () => {
    setIsComplete(false);
    setIsLoading(false);
  };
  
  const handleStopGeneration = useCallback(() => {
    isCancelledRef.current = true;
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedSloUniqueIds([]);
  }, []);

  const handleViewResults = () => {
    setView('results');
    setIsComplete(false);
    setIsLoading(false);
  }

  const exportOptions: {id: ExportOption; title: string; description: string}[] = [
    { id: 'individual', title: 'Individual', description: 'PDF + DOCX for each SLO' },
    { id: 'byUnit', title: 'By Unit', description: 'One file per Unit' },
    { id: 'byGrade', title: 'By Grade', description: 'One file per Grade' },
    { id: 'all', title: 'All Combined', description: 'One file for all selected' },
  ];

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text-light font-sans selection:bg-brand-primary selection:text-white">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-[90] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:relative z-[100] top-0 left-0 h-screen md:h-full bg-white dark:bg-slate-900 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none w-[280px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} border-r border-brand-border`}>
          <div className="p-6 flex-grow flex flex-col h-full overflow-hidden">
             <div className="flex items-center justify-between mb-8 md:hidden">
                 <span className="font-bold text-lg">Menu</span>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-brand-text-medium hover:text-brand-text-light">
                    <CloseIcon className="w-6 h-6" />
                </button>
             </div>

             <h3 className="text-xs font-bold text-brand-text-medium uppercase tracking-wider mb-4 pl-1">Context & Files</h3>
             <div className="overflow-y-auto custom-scrollbar flex-grow -mr-3 pr-3">
                <InputPanel
                    onDirectorySelected={handleDirectorySelected}
                    directoryName={directoryName}
                    contextPdfs={displayablePdfs}
                />
             </div>
             
             <div className="mt-6 pt-6 border-t border-brand-border text-xs text-brand-text-medium text-center">
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mb-2 opacity-70">
                    <InfoIcon className="w-3.5 h-3.5 flex-shrink-0"/>
                    <span>v1.5 • Local Context RAG</span>
                </div>
                <p className="opacity-50">Designed by Abdul Ahad</p>
             </div>
          </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header 
            directoryName={directoryName} 
            theme={theme} 
            onToggleTheme={toggleTheme} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="flex-1 overflow-hidden relative">
            {view === 'slo' ? (
                <SloPanel 
                    unitsByGrade={unitsByGrade}
                    selectedSloUniqueIds={selectedSloUniqueIds}
                    setSelectedSloUniqueIds={setSelectedSloUniqueIds}
                    isParsing={isParsing}
                    onClearSelection={handleClearSelection}
                    missingPdfSloIds={missingPdfSloIds}
                />
            ) : (
                <ResultsPanel
                    lessonPlans={generatedPlans}
                    onBack={() => setView('slo')}
                />
            )}

            {/* Floating Action Bar */}
            {view === 'slo' && selectedSloUniqueIds.length > 0 && !isLoading && !isComplete && (
                <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 animate-slideUp">
                    <div className="bg-brand-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-brand-border shadow-xl flex items-center text-xs sm:text-sm">
                        <span className="px-3 font-semibold text-brand-text-medium hidden sm:inline">Export Mode:</span>
                        {exportOptions.map(option => (
                            <button 
                                key={option.id}
                                onClick={() => setExportOption(option.id)}
                                title={option.description}
                                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${exportOption === option.id ? 'bg-brand-primary text-white shadow-md' : 'text-brand-text-medium hover:bg-brand-bg hover:text-brand-text-light'}`}
                            >
                              {option.title}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={generateAllLessonPlans}
                        disabled={selectedSloUniqueIds.length === 0 || isLoading}
                        className="flex items-center gap-3 bg-brand-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-primary-hover transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-primary/30 text-base"
                    >
                        <WandIcon className="w-5 h-5" />
                        Generate {selectedSloUniqueIds.length} Plans
                    </button>
                </div>
            )}
            
            {(isLoading || isComplete) && (
              <GenerationStatusPanel 
                isLoading={isLoading}
                isComplete={isComplete}
                logMessages={logMessages}
                generationProgress={generationProgress}
                onClose={handleCloseGenerationPanel}
                onStop={handleStopGeneration}
                onViewResults={handleViewResults}
              />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
