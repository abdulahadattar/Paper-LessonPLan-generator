
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExportOption } from './types/export';
import InputPanel from './components/InputPanel';
import { InfoIcon, CloseIcon } from './components/icons/MiscIcons';
import { WandIcon } from './components/icons/WandIcon';
import ResultsPanel from './components/ResultsPanel';
import SloPanel from './components/SloPanel';
import Header from './components/Header';
import GenerationStatusPanel from './components/GenerationStatusPanel';

import { useSloData, loadInitialSlos } from './features/slo';
import { useLessonGeneration, generateLessonPlan, getRemotePdfs } from './features/generation';
import { exportAsDocx, exportAsPdf, exportMultipleLessonsAsDocx, exportMultipleLessonsAsPdf } from './features/export';

type View = 'slo' | 'results';
type Theme = 'light' | 'dark';

// --- App Component ---
const App: React.FC = () => {
  // Custom Hooks
  const { 
    unitsByGrade, 
    allSlos, 
    isParsing, 
    directoryName, 
    contextPdfs, 
    handleDirectorySelected 
  } = useSloData(loadInitialSlos, getRemotePdfs);

  const { 
    generateAllLessonPlans, 
    stopGeneration, 
    isLoading, 
    generationProgress, 
    logMessages, 
    isComplete, 
    generatedPlans, 
    clearLogs 
  } = useLessonGeneration(allSlos, contextPdfs, generateLessonPlan, {
    exportAsDocx,
    exportAsPdf,
    exportMultipleLessonsAsDocx,
    exportMultipleLessonsAsPdf
  });

  // UI State
  const [selectedSloUniqueIds, setSelectedSloUniqueIds] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exportOption, setExportOption] = useState<ExportOption>('individual');
  const [view, setView] = useState<View>('slo');
  const [theme, setTheme] = useState<Theme>('light');

  // Theme Management
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
  
  // Memoized Calculations
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

  const displayablePdfs = useMemo(() => 
    contextPdfs.map(({ name, grade, unit }) => ({ name, grade, unit })), 
  [contextPdfs]);
  
  // Handlers
  const handleGenerateClick = () => {
    generateAllLessonPlans(selectedSloUniqueIds, exportOption);
  };

  const handleCloseGenerationPanel = () => {
    clearLogs();
  };
  
  const handleClearSelection = useCallback(() => {
    setSelectedSloUniqueIds([]);
  }, []);

  const handleViewResults = () => {
    setView('results');
    clearLogs();
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
                        onClick={handleGenerateClick}
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
                onStop={stopGeneration}
                onViewResults={handleViewResults}
              />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;