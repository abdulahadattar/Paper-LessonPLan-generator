
import React from 'react';
import { BrandIcon, MenuIcon, MoonIcon, SunIcon } from './icons/MiscIcons';

type Theme = 'light' | 'dark';

interface HeaderProps {
    directoryName: string | null;
    theme: Theme;
    onToggleTheme: () => void;
    onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ directoryName, theme, onToggleTheme, onOpenSidebar }) => {
    return (
      <header className="h-16 px-4 md:px-6 bg-brand-surface border-b border-brand-border flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <button 
                onClick={onOpenSidebar}
                className="md:hidden p-2 text-brand-text-medium hover:text-brand-text-light hover:bg-brand-bg rounded-lg transition-colors"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                    <BrandIcon className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-brand-text-light hidden sm:block tracking-tight">Lesson Plan AI</h1>
            </div>
        </div>

        <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center px-3 py-1.5 bg-brand-bg rounded-full border border-brand-border gap-2">
                <div className={`w-2 h-2 rounded-full ${directoryName ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500'}`}></div>
                <span className="text-xs font-medium text-brand-text-medium">
                    {directoryName ? directoryName : 'No Context'}
                </span>
             </div>
             
             <div className="h-6 w-px bg-brand-border mx-1"></div>

             <button 
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-brand-text-medium hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
             >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
             </button>
             
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 cursor-pointer hover:scale-105 transition-transform shadow-md">
                 <div className="w-full h-full bg-brand-surface rounded-full flex items-center justify-center">
                     <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">AA</span>
                 </div>
             </div>
        </div>
      </header>
    );
};

export default Header;
