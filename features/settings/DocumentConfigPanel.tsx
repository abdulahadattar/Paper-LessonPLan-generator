import React, { useState, useEffect } from 'react';
import { LessonPlanDocumentConfig, DEFAULT_DOCUMENT_CONFIG, GRADE_CONFIG, GradeLevel } from '../../config/export';
import { CloseIcon } from '../../components/icons/MiscIcons';

interface DocumentConfigPanelProps {
    config: LessonPlanDocumentConfig;
    onUpdate: (updates: Partial<LessonPlanDocumentConfig>) => void;
    onReset: () => void;
    onClose: () => void;
}

const DocumentConfigPanel: React.FC<DocumentConfigPanelProps> = ({ config, onUpdate, onReset, onClose }) => {
    const [localConfig, setLocalConfig] = useState<LessonPlanDocumentConfig>(config);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleChange = (field: keyof LessonPlanDocumentConfig, value: string) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleGradeChange = (grade: GradeLevel) => {
        const subjects = GRADE_CONFIG[grade].subjects;
        const defaultSubject = subjects[0]?.value || '';
        setLocalConfig(prev => ({
            ...prev,
            gradeLevel: grade,
            subject: defaultSubject,
        }));
    };

    const handleSubjectChange = (subject: string) => {
        setLocalConfig(prev => ({ ...prev, subject }));
    };

    const handleThemeChange = (field: keyof LessonPlanDocumentConfig['theme'], value: string | number) => {
        setLocalConfig(prev => ({
            ...prev,
            theme: { ...prev.theme, [field]: value }
        }));
    };

    const handleSectionToggle = (section: keyof LessonPlanDocumentConfig['sectionVisibility']) => {
        setLocalConfig(prev => ({
            ...prev,
            sectionVisibility: { ...prev.sectionVisibility, [section]: !prev.sectionVisibility[section] }
        }));
    };

    const handleSave = () => {
        onUpdate(localConfig);
        onClose();
    };

    const handleReset = () => {
        onReset();
        setLocalConfig(DEFAULT_DOCUMENT_CONFIG);
        onClose();
    };

    const currentSubjects = GRADE_CONFIG[localConfig.gradeLevel]?.subjects || [];

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-brand-surface rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-text-light">Document Settings</h2>
                    <button onClick={onClose} className="p-1 text-brand-text-medium hover:text-brand-text-light rounded-lg hover:bg-brand-bg transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-brand-text-medium uppercase tracking-wider mb-3">Class & Subject</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Grade Level</label>
                                <select
                                    value={localConfig.gradeLevel}
                                    onChange={(e) => handleGradeChange(e.target.value as GradeLevel)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                >
                                    {Object.keys(GRADE_CONFIG).map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Subject</label>
                                <select
                                    value={localConfig.subject}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                >
                                    {currentSubjects.map(subject => (
                                        <option key={subject.value} value={subject.value}>{subject.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-brand-text-medium uppercase tracking-wider mb-3">Header Information</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">School Name</label>
                                <input
                                    type="text"
                                    value={localConfig.schoolName}
                                    onChange={(e) => handleChange('schoolName', e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Teacher Name</label>
                                <input
                                    type="text"
                                    value={localConfig.teacherName}
                                    onChange={(e) => handleChange('teacherName', e.target.value)}
                                    placeholder="Leave empty to hide"
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Document Title</label>
                                <input
                                    type="text"
                                    value={localConfig.documentTitle}
                                    onChange={(e) => handleChange('documentTitle', e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-brand-text-medium mb-1">Period</label>
                                    <input
                                        type="text"
                                        value={localConfig.period}
                                        onChange={(e) => handleChange('period', e.target.value)}
                                        placeholder="e.g. 1"
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-brand-text-medium mb-1">Date/Timeline</label>
                                    <input
                                        type="text"
                                        value={localConfig.dateTimeline}
                                        onChange={(e) => handleChange('dateTimeline', e.target.value)}
                                        placeholder="Leave empty to hide"
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-brand-text-medium uppercase tracking-wider mb-3">Visible Sections</h3>
                        <p className="text-xs text-brand-text-medium mb-3">Toggle sections to show or hide in generated documents</p>
                        <div className="space-y-3">
                            {Object.entries(localConfig.sectionVisibility).map(([section, enabled]) => (
                                <div key={section} className="flex items-center justify-between">
                                    <label className="text-sm text-brand-text-light capitalize">{section}</label>
                                    <button
                                        type="button"
                                        onClick={() => handleSectionToggle(section as keyof LessonPlanDocumentConfig['sectionVisibility'])}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            enabled ? 'bg-brand-primary' : 'bg-brand-border'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-brand-text-medium uppercase tracking-wider mb-3">Theme</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={localConfig.theme.primaryColor}
                                        onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={localConfig.theme.primaryColor}
                                        onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                                        className="flex-1 px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Font</label>
                                <input
                                    type="text"
                                    value={localConfig.theme.font}
                                    onChange={(e) => handleThemeChange('font', e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-brand-text-medium uppercase tracking-wider mb-3">Section Headers</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Resources Header</label>
                                <input
                                    type="text"
                                    value={localConfig.sectionHeaders.resources}
                                    onChange={(e) => {
                                        setLocalConfig(prev => ({
                                            ...prev,
                                            sectionHeaders: { ...prev.sectionHeaders, resources: e.target.value }
                                        }));
                                    }}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Procedure Header</label>
                                <input
                                    type="text"
                                    value={localConfig.sectionHeaders.procedure}
                                    onChange={(e) => {
                                        setLocalConfig(prev => ({
                                            ...prev,
                                            sectionHeaders: { ...prev.sectionHeaders, procedure: e.target.value }
                                        }));
                                    }}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-medium mb-1">Homework Header</label>
                                <input
                                    type="text"
                                    value={localConfig.sectionHeaders.homework}
                                    onChange={(e) => {
                                        setLocalConfig(prev => ({
                                            ...prev,
                                            sectionHeaders: { ...prev.sectionHeaders, homework: e.target.value }
                                        }));
                                    }}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-brand-text-light focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-brand-border">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-brand-text-medium hover:text-brand-text-light border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex-1"></div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-brand-text-medium hover:text-brand-text-light border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentConfigPanel;
