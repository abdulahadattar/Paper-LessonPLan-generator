
import React, { useRef } from 'react';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon, CloudDownloadIcon } from './icons/MiscIcons';

// FIX: Corrected React module augmentation for non-standard input attributes.
// Using `declare global` to augment the React namespace avoids potential module resolution issues.
declare global {
  namespace React {
      interface InputHTMLAttributes<T> {
        webkitdirectory?: string;
        directory?: string;
      }
  }
}

interface ContextPdfForDisplay {
    name: string;
    grade: string;
    unit: string;
}

interface InputPanelProps {
  onDirectorySelected: (files: FileList) => void;
  onLoadOnlineBooks: () => void;
  isOnlineLoading: boolean;
  directoryName: string | null;
  contextPdfs: ContextPdfForDisplay[];
}

const getGradeColorClasses = (grade: string): string => {
  const gradeNum = parseInt(grade.replace('Grade ', ''), 10);
  switch (gradeNum) {
    case 9:
      return 'text-blue-300 bg-blue-900/50';
    case 10:
      return 'text-emerald-300 bg-emerald-900/50';
    case 11:
      return 'text-amber-300 bg-amber-900/50';
    case 12:
      return 'text-rose-300 bg-rose-900/50';
    default:
      return 'text-slate-300 bg-slate-700';
  }
};

const unitColors = [
    'text-teal-300 bg-teal-900/50',
    'text-cyan-300 bg-cyan-900/50',
    'text-sky-300 bg-sky-900/50',
    'text-indigo-300 bg-indigo-900/50',
    'text-violet-300 bg-violet-900/50',
    'text-purple-300 bg-purple-900/50',
    'text-fuchsia-300 bg-fuchsia-900/50',
    'text-pink-300 bg-pink-900/50',
];

const getUnitColorClasses = (unit: string): string => {
  const unitNum = parseInt(unit, 10);
  if (isNaN(unitNum)) {
    // Fallback for non-numeric units
    const hash = unit.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return unitColors[Math.abs(hash) % unitColors.length];
  }
  return unitColors[unitNum % unitColors.length];
};


const InputPanel: React.FC<InputPanelProps> = ({ 
    onDirectorySelected,
    onLoadOnlineBooks,
    isOnlineLoading,
    directoryName,
    contextPdfs
}) => {
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const handleDirectoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          onDirectorySelected(event.target.files);
      }
  };

  const handleConnectClick = () => {
      directoryInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="p-2 -mx-2 mb-2">
        </div>
        <div className="p-3 bg-brand-bg rounded-lg">
            <p className="text-sm text-brand-text-medium mb-3">Ground generation with context from textbooks.</p>
            <input
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                ref={directoryInputRef}
                onChange={handleDirectoryChange}
                style={{ display: 'none' }}
             />
             <div className="flex items-center gap-2">
                <button
                    onClick={handleConnectClick}
                    className="w-1/2 bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                >
                  <FolderIcon />
                  Local Folder
                </button>
                <button
                    onClick={onLoadOnlineBooks}
                    disabled={isOnlineLoading}
                    className="w-1/2 bg-sky-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                  {isOnlineLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                     <CloudDownloadIcon />
                  )}
                  Online Books
                </button>
            </div>
            {directoryName && (
                <div className="mt-3">
                    <p className="text-xs text-brand-text-medium mb-2">Connected: <span className="font-mono bg-brand-bg p-1 rounded">{directoryName}</span></p>
                    <div className="mt-2 max-h-96 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                        {contextPdfs.length > 0 ? (
                            contextPdfs.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(pdf => (
                                <div key={pdf.name} className="flex items-center gap-2 p-1.5 bg-brand-panel/50 rounded">
                                    <FileIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                    <span className="text-xs text-brand-text-light truncate flex-grow" title={pdf.name}>{pdf.name}</span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${getGradeColorClasses(pdf.grade)}`}>{pdf.grade}</span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${getUnitColorClasses(pdf.unit)}`}>Unit {pdf.unit}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-center text-brand-text-medium p-4">Make sure PDF filenames contain 'Grade (number)' and 'Unit (number)' to be detected.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
