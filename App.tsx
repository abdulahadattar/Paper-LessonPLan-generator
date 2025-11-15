
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SLO, GroupedSlos, LessonPlan } from './types';
import { generateLessonPlan } from './services/geminiService';
import { loadInitialSlos } from './services/sloService';
import InputPanel from './components/InputPanel';
import { InfoIcon, BrandIcon, MenuIcon, CloseIcon, CheckCircleIcon, StopIcon, WarningIcon } from './components/icons/MiscIcons';
import { FileIcon } from './components/icons/FileIcon';
import { WandIcon } from './components/icons/WandIcon';
import { exportAsPdf, exportAsDocx, formatFileName, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf } from './services/exportService';
import { Part } from '@google/genai';
import { getRemotePdfs } from './services/remoteContextService';


interface UnitsByGrade {
  [grade: string]: GroupedSlos;
}

interface ContextPdf {
    name: string;
    grade: string;
    unit: string;
    file?: File;
    url?: string;
}

type ExportOption = 'individual' | 'byUnit' | 'byGrade' | 'all';

// --- SloPanel Component ---
interface SloPanelProps {
  unitsByGrade: UnitsByGrade;
  selectedSloUniqueIds: string[];
  setSelectedSloUniqueIds: React.Dispatch<React.SetStateAction<string[]>>;
  isParsing: boolean;
  onClearSelection: () => void;
  missingPdfSloIds: string[];
}

const getGradeSloColorClasses = (grade?: string): string => {
  if (!grade) return 'bg-slate-700 text-slate-200';
  const gradeNum = parseInt(grade.replace('Grade ', ''), 10);
  switch (gradeNum) {
    case 9:
      return 'bg-sky-800 text-sky-200';
    case 10:
      return 'bg-emerald-800 text-emerald-200';
    case 11:
      return 'bg-amber-800 text-amber-200';
    case 12:
      return 'bg-rose-800 text-rose-200';
    default:
      return 'bg-slate-700 text-slate-200';
  }
};

const unitAccentColors = [
    '#38bdf8', // sky-400
    '#4ade80', // green-400
    '#a78bfa', // violet-400
    '#facc15', // yellow-400
    '#f472b6', // pink-400
    '#22d3ee', // cyan-400
];

const getUnitAccentColor = (unitName: string): string => {
    const unitNumMatch = unitName.match(/\d+/);
    if (!unitNumMatch) {
        const hash = unitName.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        return unitAccentColors[Math.abs(hash) % unitAccentColors.length];
    }
    const unitNum = parseInt(unitNumMatch[0], 10);
    return unitAccentColors[unitNum % unitAccentColors.length];
};


const SloPanel: React.FC<SloPanelProps> = ({ unitsByGrade, selectedSloUniqueIds, setSelectedSloUniqueIds, isParsing, onClearSelection, missingPdfSloIds }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUnitsByGrade = useMemo(() => {
    if (!searchQuery.trim()) {
      return unitsByGrade;
    }
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    const filterSlos = (slos: SLO[]) => slos.filter(slo =>
      slo.SLO_ID.toLowerCase().includes(lowerCaseQuery) ||
      slo.SLO_Text.toLowerCase().includes(lowerCaseQuery)
    );

    const filterGrade = (gradeUnits: GroupedSlos): GroupedSlos => {
      return Object.entries(gradeUnits)
        .map(([unitName, slos]) => ({ unitName, slos: filterSlos(slos) }))
        .filter(({ slos }) => slos.length > 0)
        // FIX: Added a generic type argument to `reduce` to correctly type the accumulator. This resolves an error where the accumulator was inferred as `{}`, which lacks an index signature for property assignment.
        .reduce<GroupedSlos>((acc, { unitName, slos }) => {
          acc[unitName] = slos;
          return acc;
        }, {});
    };

    return Object.entries(unitsByGrade)
      .map(([grade, units]) => ({ grade, units: filterGrade(units) }))
      .filter(({ units }) => Object.keys(units).length > 0)
      .reduce<UnitsByGrade>((acc, { grade, units }) => {
        acc[grade] = units;
        return acc;
      }, {} as UnitsByGrade);
  }, [unitsByGrade, searchQuery]);


  const handleSelectionToggle = (slosToToggle: SLO[], currentlySelectedIds: string[]) => {
    const idsToToggle = slosToToggle.map(slo => slo.uniqueId!);
    const allCurrentlySelected = idsToToggle.every(id => currentlySelectedIds.includes(id));
    
    if (allCurrentlySelected) {
      return currentlySelectedIds.filter(id => !idsToToggle.includes(id));
    } else {
      return [...new Set([...currentlySelectedIds, ...idsToToggle])];
    }
  };

  const handleSloSelection = (uniqueId: string) => {
    setSelectedSloUniqueIds(prev =>
      prev.includes(uniqueId)
        ? prev.filter(id => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };
  
  const handleUnitSelection = (slosInUnit: SLO[]) => {
    setSelectedSloUniqueIds(prev => handleSelectionToggle(slosInUnit, prev));
  };

  const handleGradeSelection = (slosInGrade: SLO[]) => {
      setSelectedSloUniqueIds(prev => handleSelectionToggle(slosInGrade, prev));
  };

  const ParentCheckbox: React.FC<{ slos: SLO[]; onToggle: (slos: SLO[]) => void }> = ({ slos, onToggle }) => {
    const selectedCount = slos.filter(slo => selectedSloUniqueIds.includes(slo.uniqueId!)).length;
    const isAllSelected = selectedCount === slos.length && slos.length > 0;
    const isIndeterminate = selectedCount > 0 && selectedCount < slos.length;
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    return (
      <input 
        type="checkbox"
        ref={checkboxRef}
        checked={isAllSelected}
        onChange={() => onToggle(slos)}
        className="form-checkbox h-4 w-4 text-brand-primary bg-brand-bg border-brand-border rounded focus:ring-brand-primary/50"
        aria-label={`Select all SLOs`}
      />
    );
  };
  
  if (isParsing) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-brand-text-medium">Loading curriculum data...</p>
        </div>
      </div>
    );
  }

  const hasSlos = Object.keys(unitsByGrade).length > 0;
  
  return (
    <div className="h-full flex flex-col custom-scrollbar">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-brand-text-light">Student Learning Outcomes (SLOs)</h2>
          {selectedSloUniqueIds.length > 0 && (
            <button
              onClick={onClearSelection}
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>
        <p className="text-sm text-brand-text-medium">Select SLOs to generate lesson plans.</p>
        {hasSlos && (
             <input
                type="text"
                placeholder="Search by SLO ID or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-3 p-2 h-10 bg-brand-bg border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-sm"
             />
        )}
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 pb-32">
        {hasSlos ? (
          <div className="mt-4 space-y-6">
            {Object.entries(filteredUnitsByGrade).sort(([gradeA], [gradeB]) => parseInt(gradeA.replace('Grade ', '')) - parseInt(gradeB.replace('Grade ', ''))).map(([grade, units]) => {
              const allSlosInGrade = Object.values(units).flat();
              return (
                <details key={grade} open>
                  {/* Grade Header */}
                  <summary className="flex items-center gap-4 px-1 py-2 cursor-pointer">
                      <ParentCheckbox slos={allSlosInGrade} onToggle={handleGradeSelection} />
                      <h3 className="font-bold text-xl text-brand-text-light tracking-wide flex-1">{grade}</h3>
                  </summary>
                  
                  {/* Units Container */}
                  <div className="space-y-2 mt-2 pl-4 border-l-2 border-brand-panel">
                      {Object.entries(units).sort(([unitNameA], [unitNameB]) => {
                          const numA = parseInt(unitNameA.match(/\d+/)?.[0] || '0');
                          const numB = parseInt(unitNameB.match(/\d+/)?.[0] || '0');
                          return numA - numB;
                      }).map(([unitName, slos]) => (
                          <details key={unitName} open className="bg-brand-surface rounded-r-lg shadow-sm overflow-hidden group">
                              <summary 
                                  className="cursor-pointer font-semibold p-3 flex items-center gap-4 text-brand-text-light/95 hover:bg-slate-700/50 transition-colors"
                                  style={{ borderLeft: `4px solid ${getUnitAccentColor(unitName)}` }}
                              >
                                  <ParentCheckbox slos={slos} onToggle={handleUnitSelection} />
                                  <span className="flex-grow">{unitName}</span>
                              </summary>
                              
                              <div className="pl-14 pr-4 pb-1 bg-brand-bg/30">
                                  {slos.map(slo => (
                                      <div key={slo.uniqueId} className="flex items-start gap-3 py-4 border-t border-brand-border/80">
                                          <input
                                              type="checkbox"
                                              checked={selectedSloUniqueIds.includes(slo.uniqueId!)}
                                              onChange={() => handleSloSelection(slo.uniqueId!)}
                                              className="form-checkbox h-4 w-4 text-brand-primary bg-brand-surface border-brand-border rounded focus:ring-brand-primary/50 mt-1 flex-shrink-0"
                                              aria-labelledby={`slo-text-${slo.uniqueId}`}
                                          />
                                          <div className="flex-1 flex justify-between items-start gap-2">
                                              <div>
                                                  <span className={`font-mono text-xs px-2 py-1 rounded-md ${getGradeSloColorClasses(slo.grade)}`}>{slo.SLO_ID}</span>
                                                  <p id={`slo-text-${slo.uniqueId}`} title={slo.SLO_Text} className="text-sm text-brand-text-medium mt-2 leading-relaxed">{slo.SLO_Text}</p>
                                              </div>
                                              {missingPdfSloIds.includes(slo.uniqueId!) && (
                                                  <div title="Context PDF file is missing for this SLO's unit." className="pt-0.5">
                                                      <WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </details>
                      ))}
                  </div>
              </details>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <FileIcon className="w-12 h-12 text-brand-panel mx-auto mb-3" />
            <h3 className="font-semibold text-brand-text-light">No SLOs Loaded</h3>
            <p className="text-sm text-brand-text-medium">Could not load curriculum files. Please check console for errors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- GenerationStatusPanel Component (Bottom Sheet) ---
interface GenerationStatusPanelProps {
  isLoading: boolean;
  isComplete: boolean;
  logMessages: string[];
  generationProgress: { current: number; total: number } | null;
  onClose: () => void;
  onStop: () => void;
}

const GenerationStatusPanel: React.FC<GenerationStatusPanelProps> = ({ isLoading, isComplete, logMessages, generationProgress, onClose, onStop }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logMessages]);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] transition-transform duration-300 transform translate-y-0 z-20 flex flex-col rounded-t-2xl" style={{ height: '320px' }}>
      <div className="flex justify-between items-center p-4 border-b border-brand-border flex-shrink-0">
        <h2 className="text-lg font-bold text-brand-text-light">
          {isComplete ? 'Generation Complete' : 'Generation in Progress'}
        </h2>
        <div className="flex items-center gap-2">
          {isLoading && (
            <button 
              onClick={onStop} 
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition-colors"
              aria-label="Stop generation"
            >
              <StopIcon className="w-4 h-4" />
              Stop
            </button>
          )}
          <button onClick={onClose} className="p-1 text-brand-text-medium hover:text-brand-text-light rounded-full hover:bg-brand-panel">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col p-4 gap-4 min-h-0">
        {isLoading && generationProgress && (
          <div className="w-full text-center flex-shrink-0">
            <p className="text-sm text-brand-primary mb-2">Processing... ({generationProgress.current}/{generationProgress.total})</p>
            <div className="w-full bg-brand-bg rounded-full h-2.5">
              <div
                className="bg-brand-primary h-2.5 rounded-full"
                style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%`, transition: 'width 0.3s ease-in-out' }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto custom-scrollbar bg-brand-bg p-3 rounded-md min-h-0 text-xs">
          {logMessages.map((msg, index) => (
            <div key={index} className="flex items-start font-mono">
              <span className="text-brand-text-dark mr-2">{`[${new Date().toLocaleTimeString()}]`}</span>
              <p
                className={`flex-1 ${
                  msg.startsWith('ERROR') ? 'text-red-400' : msg.startsWith('Successfully') ? 'text-green-400' : 'text-brand-text-medium'
                } whitespace-pre-wrap break-words`}
              >
                {msg}
              </p>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {isComplete && (
          <div className="mt-auto text-center p-3 bg-green-900/50 rounded-md border border-green-500/50 flex-shrink-0">
            <div className="flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-300" />
              <p className="font-semibold text-green-300">Success!</p>
            </div>
            <p className="text-sm text-brand-text-medium mt-1">All generated files have been downloaded.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Header: React.FC<{ directoryName: string | null; }> = ({ directoryName }) => {
    return (
      <header className="flex-shrink-0 bg-brand-bg/50 backdrop-blur-sm border-b border-brand-border h-14 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2">
              <BrandIcon className="w-7 h-7 text-brand-primary" />
              <h1 className="text-lg font-bold text-brand-text-light hidden sm:block">Lesson Plan Generator</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: directoryName ? '#22c55e' : '#f59e0b'}}></div>
          <span className="text-brand-text-medium hidden sm:block">{directoryName ? `Connected: ${directoryName}` : 'No Folder Connected'}</span>
        </div>
      </header>
    );
};


// --- App Component ---
const App: React.FC = () => {
  const [unitsByGrade, setUnitsByGrade] = useState<UnitsByGrade>({});
  const [allSlos, setAllSlos] = useState<SLO[]>([]);
  const [selectedSloUniqueIds, setSelectedSloUniqueIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(true);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [exportOption, setExportOption] = useState<ExportOption>('individual');
  const isCancelledRef = useRef(false);
  const partCache = useRef(new Map<string, Promise<Part>>());

  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [contextPdfs, setContextPdfs] = useState<ContextPdf[]>([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);


  useEffect(() => {
    const fetchInitialSlos = async () => {
        setIsParsing(true);
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
        }, {});
        setUnitsByGrade(grouped);
        setIsParsing(false);
    };
    fetchInitialSlos();
  }, []);
  
  const missingPdfSloIds = useMemo(() => {
    const selectedSlos = allSlos.filter(slo => selectedSloUniqueIds.includes(slo.uniqueId!));
    if (selectedSlos.length === 0) return [];

    return selectedSlos
        .filter(slo => {
            const grade = slo.grade;
            const unitNumStr = slo.Unit_Number;
            const sloUnitNum = parseInt(unitNumStr, 10);
            if (isNaN(sloUnitNum)) return true; // Assume missing if SLO unit is not a number

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

  const generateAllLessonPlans = async () => {
    partCache.current.clear();
    isCancelledRef.current = false;
    setIsLoading(true);
    setIsComplete(false);
    setLogMessages(['Starting lesson plan generation...']);
    const selectedSlos = allSlos.filter(slo => selectedSloUniqueIds.includes(slo.uniqueId!));
    let wasCancelled = false;
    
    const urlToPart = async (url: string, name: string): Promise<Part> => {
        if (partCache.current.has(url)) {
            return partCache.current.get(url)!;
        }
        const promise = (async () => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const file = new File([blob], name, { type: 'application/pdf' });
            return fileToPart(file);
        })();
        partCache.current.set(url, promise);
        return promise;
    };


    const processSlo = async (slo: SLO): Promise<LessonPlan | null> => {
        const MAX_RETRIES = 1; // 1 initial try + 1 retry = 2 total attempts
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (isCancelledRef.current) return null; // Check for cancellation before API call
                if (attempt > 0) {
                    setLogMessages(prev => [...prev, `Retrying generation for ${slo.SLO_ID}...`]);
                }
                const unitContextSlos = selectedSlos.filter(s => s.grade === slo.grade && s.Unit_Name === slo.Unit_Name);
                const contextPdfsForSlo = contextPdfs.filter(p => p.grade === slo.grade && parseInt(p.unit, 10) === parseInt(slo.Unit_Number, 10));
                
                const contextFileParts: Part[] = [];
                if (contextPdfsForSlo.length > 0) {
                    if (attempt === 0) setLogMessages(prev => [...prev, `Found context file(s): ${contextPdfsForSlo.map(p => p.name).join(', ')}`]);
                    
                    for (const pdf of contextPdfsForSlo) {
                        try {
                            let part: Part | undefined;
                            if (pdf.file) {
                                part = await fileToPart(pdf.file);
                            } else if (pdf.url) {
                                part = await urlToPart(pdf.url, pdf.name);
                            }
                            if (part) contextFileParts.push(part);
                        } catch (e) {
                            const errorMsg = `Failed to load context PDF ${pdf.name}. Generation may be less accurate.`;
                            console.error(errorMsg, e);
                            setLogMessages(prev => [...prev, `WARN: ${errorMsg}`]);
                        }
                    }
                } else {
                    if (attempt === 0) {
                        const warningMsg = `No context PDF found for SLO ${slo.SLO_ID}. Generation may be less accurate.`;
                        console.warn(warningMsg);
                        setLogMessages(prev => [...prev, `WARN: ${warningMsg}`]);
                    }
                }
                
                if (attempt === 0) setLogMessages(prev => [...prev, `Generating lesson plan content...`]);
                const plan = await generateLessonPlan(slo, unitContextSlos, contextFileParts);
                setLogMessages(prev => [...prev, `Content received for "${plan.title}"`]);
                return plan;
            } catch (error) {
                const errorMsg = `Failed for ${slo.SLO_ID} (Attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${error instanceof Error ? error.message : String(error)}`;
                console.error(errorMsg);
                setLogMessages(prev => [...prev, `ERROR: ${errorMsg}`]);
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
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

  const handleLoadOnlineBooks = useCallback(async () => {
    setIsOnlineLoading(true);
    const remotePdfs = getRemotePdfs();
    setContextPdfs(remotePdfs.map(p => ({
        name: p.name,
        grade: p.grade,
        unit: p.unit,
        url: p.url,
    })));
    setDirectoryName("Online Textbooks");
    setIsOnlineLoading(false);
  }, []);

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

  const exportOptions: {id: ExportOption; title: string; description: string}[] = [
    { id: 'individual', title: 'Individual Files', description: 'PDF + DOCX for each SLO' },
    { id: 'byUnit', title: 'Combine by Unit', description: 'One file per Unit' },
    { id: 'byGrade', title: 'Combine by Grade', description: 'One file per Grade' },
    { id: 'all', title: 'Combine All', description: 'One file for all selected' },
  ];

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text-light font-sans">
      <aside className={`bg-brand-surface flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-[260px]' : 'w-0'} overflow-hidden`}>
          <div className="p-4 flex-grow flex flex-col min-w-[260px]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <BrandIcon className="w-8 h-8 text-brand-primary" />
                    <h1 className="text-xl font-bold text-brand-text-light">Lesson Plan Generator</h1>
                </div>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-brand-text-medium hover:text-brand-text-light">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow -mr-2 pr-2">
                <InputPanel
                    onDirectorySelected={handleDirectorySelected}
                    onLoadOnlineBooks={handleLoadOnlineBooks}
                    isOnlineLoading={isOnlineLoading}
                    directoryName={directoryName}
                    contextPdfs={displayablePdfs}
                />
            </div>
          </div>
          <div className="p-4 border-t border-brand-border text-xs text-brand-text-medium text-center flex-shrink-0">
             <div className="flex items-center justify-center gap-2 mb-2">
                <InfoIcon className="w-4 h-4"/>
                <p>Grounds lesson plans using local PDF curriculum files.</p>
             </div>
             <span>Created by Abdul Ahad | v1.2</span>
          </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header directoryName={directoryName} />
        {!isSidebarOpen && (
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-30 p-2 bg-brand-surface rounded-full text-brand-text-medium hover:text-brand-text-light shadow-lg"
                aria-label="Open sidebar"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
        )}
        <div className="flex-1 relative bg-brand-surface rounded-tl-2xl shadow-inner-lg overflow-hidden">
            <SloPanel 
              unitsByGrade={unitsByGrade}
              selectedSloUniqueIds={selectedSloUniqueIds}
              setSelectedSloUniqueIds={setSelectedSloUniqueIds}
              isParsing={isParsing}
              onClearSelection={handleClearSelection}
              missingPdfSloIds={missingPdfSloIds}
            />

            {selectedSloUniqueIds.length > 0 && !isLoading && !isComplete && (
                <div className="absolute bottom-0 right-0 p-4 md:p-6 flex flex-col items-end gap-3 z-10 w-full md:w-auto">
                    <div className="bg-brand-bg/80 backdrop-blur-sm p-1 rounded-lg border border-brand-border flex items-center text-sm shadow-lg">
                        <span className="px-3 text-brand-text-medium hidden sm:inline">Export:</span>
                        {exportOptions.map(option => (
                            <button 
                                key={option.id} 
                                onClick={() => setExportOption(option.id as ExportOption)} 
                                className={`px-3 py-1.5 rounded-md transition-colors text-xs sm:text-sm whitespace-nowrap ${exportOption === option.id ? 'bg-brand-primary text-white font-semibold' : 'hover:bg-brand-panel text-brand-text-light'}`}
                                title={option.description}
                            >
                                {option.title.replace(' Files', '').replace('Combine by ', '').replace('Combine ','')}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={generateAllLessonPlans}
                        className="bg-brand-primary text-white font-bold py-3 px-5 rounded-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-brand-primary/20"
                    >
                      <WandIcon className="w-5 h-5" />
                      Generate ({selectedSloUniqueIds.length})
                    </button>
                    {missingPdfSloIds.length > 0 && (
                        <p className="text-xs text-amber-400 bg-brand-bg/80 backdrop-blur-sm px-2 py-1 rounded text-center">
                            Missing context for {missingPdfSloIds.length} SLO{missingPdfSloIds.length > 1 ? 's' : ''}.<br/>Generation quality may be affected.
                        </p>
                    )}
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
                />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
