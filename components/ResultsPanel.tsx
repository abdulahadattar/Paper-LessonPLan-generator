import React, { useState } from 'react';
import { LessonPlan } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ArrowLeftIcon, BookOpenIcon, ClipboardListIcon, ClockIcon, PuzzleIcon, TargetIcon } from './icons/MiscIcons';

interface ResultsPanelProps {
  lessonPlans: LessonPlan[];
  onBack: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ lessonPlans, onBack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (lessonPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold text-brand-text-light mb-4">No Lesson Plans Generated</h2>
        <p className="text-brand-text-medium mb-6">It looks like the generation process didn't produce any plans. Try selecting some SLOs and generating again.</p>
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to SLO Selection
        </button>
      </div>
    );
  }

  const selectedPlan = lessonPlans[selectedIndex];

  const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <section className="mb-6">
      <div className="flex items-center gap-3 mb-3 border-b border-brand-border pb-2">
        {icon}
        <h2 className="text-xl font-bold text-brand-text-light">{title}</h2>
      </div>
      <div className="pl-2">{children}</div>
    </section>
  );

  return (
    <div className="flex h-full bg-brand-surface text-brand-text-light">
      <aside className="w-full md:w-1/3 xl:w-1/4 bg-brand-bg/50 p-4 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-shrink-0">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-3 py-1.5 mb-4 bg-brand-panel text-brand-text-light font-semibold rounded-lg hover:bg-brand-panel/80 transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to SLOs
          </button>
          <h2 className="text-xl font-bold text-brand-text-light px-2">Generated Plans ({lessonPlans.length})</h2>
        </div>

        <ul className="mt-4 space-y-1 flex-grow">
          {lessonPlans.map((plan, index) => (
            <li key={index}>
              <button 
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left p-3 rounded-md transition-colors text-sm ${selectedIndex === index ? 'bg-brand-primary text-white font-semibold shadow-md' : 'hover:bg-brand-panel text-brand-text-medium font-medium'}`}
              >
                <span className="font-bold">{plan.gradeLevel}:</span> {plan.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="w-full md:w-2/3 xl:w-3/4 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        {selectedPlan && (
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <p className="text-brand-primary font-semibold">{selectedPlan.gradeLevel} - {selectedPlan.subject}</p>
              <h1 className="text-4xl font-extrabold text-brand-text-light mt-1">{selectedPlan.title}</h1>
            </header>
            
            <Section title="Learning Objective" icon={<TargetIcon className="w-6 h-6 text-brand-primary" />}>
              <MarkdownRenderer text={selectedPlan.objective} className="text-brand-text-medium leading-relaxed" />
            </Section>

            <Section title="Materials & Resources" icon={<ClipboardListIcon className="w-6 h-6 text-brand-primary" />}>
                {selectedPlan.materials.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-brand-text-medium">
                        {selectedPlan.materials.map((item, i) => <li key={i}><MarkdownRenderer text={item} /></li>)}
                    </ul>
                ) : (
                    <p className="text-brand-text-dark">No special materials required.</p>
                )}
            </Section>

            <Section title="Lesson Activities" icon={<PuzzleIcon className="w-6 h-6 text-brand-primary" />}>
              <div className="space-y-6">
                {selectedPlan.activities.map((activity, i) => (
                  <div key={i} className="p-4 bg-brand-bg rounded-lg border border-brand-border">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg text-brand-primary">{activity.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-brand-text-medium font-medium">
                        <ClockIcon className="w-4 h-4"/>
                        <span>{activity.duration} minutes</span>
                      </div>
                    </div>
                    <MarkdownRenderer text={activity.description} className="text-brand-text-medium leading-relaxed" />
                  </div>
                ))}
              </div>
            </Section>
            
            <Section title="Homework Assignment" icon={<BookOpenIcon className="w-6 h-6 text-brand-primary" />}>
              <MarkdownRenderer text={selectedPlan.homework} className="text-brand-text-medium leading-relaxed" />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultsPanel;
