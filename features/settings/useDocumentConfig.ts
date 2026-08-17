import { useState, useEffect, useCallback } from 'react';
import { LessonPlanDocumentConfig, DEFAULT_DOCUMENT_CONFIG } from '../../config/export';

const STORAGE_KEY = 'documentConfig';

type PartialDocumentConfig = Partial<LessonPlanDocumentConfig>;

function loadConfig(): LessonPlanDocumentConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as PartialDocumentConfig;
            return { ...DEFAULT_DOCUMENT_CONFIG, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load document config from localStorage', e);
    }
    return DEFAULT_DOCUMENT_CONFIG;
}

function saveConfig(config: LessonPlanDocumentConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save document config to localStorage', e);
    }
}

export const useDocumentConfig = () => {
    const [config, setConfig] = useState<LessonPlanDocumentConfig>(loadConfig);

    useEffect(() => {
        saveConfig(config);
    }, [config]);

    const updateConfig = useCallback((updates: PartialDocumentConfig) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const resetConfig = useCallback(() => {
        setConfig(DEFAULT_DOCUMENT_CONFIG);
    }, []);

    return {
        config,
        updateConfig,
        resetConfig,
    };
};
