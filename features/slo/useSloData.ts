
import { useState, useEffect } from 'react';
import { SLO, UnitsByGrade } from '../../types/slo';
import { ContextPdf } from '../../types/context';
import { loadInitialSlos } from './sloService';
import { getRemotePdfs } from '../generation/remoteContextService';
import { parseGradeAndUnitFromFileName } from '../../lib/pdf';

/**
 * Hook for managing SLO data and context PDFs.
 * 
 * @param sloService - Optional custom SLO service implementation for testing
 * @param remoteContextService - Optional custom remote context service implementation for testing
 * @returns SLO data, loading state, and handlers
 */
export const useSloData = (
    sloService: typeof loadInitialSlos = loadInitialSlos,
    remoteContextService: typeof getRemotePdfs = getRemotePdfs
) => {
    const [unitsByGrade, setUnitsByGrade] = useState<UnitsByGrade>({});
    const [allSlos, setAllSlos] = useState<SLO[]>([]);
    const [isParsing, setIsParsing] = useState(true);
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [contextPdfs, setContextPdfs] = useState<ContextPdf[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsParsing(true);
            const parsedSlos = await sloService();
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
            
            const remotePdfs = remoteContextService();
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
    }, [sloService, remoteContextService]);

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
                    const parsed = parseGradeAndUnitFromFileName(file.name);
                    if (parsed) {
                        pdfs.push({ name: file.name, grade: parsed.grade, unit: parsed.unit, file });
                    }
                }
            }
            setContextPdfs(pdfs);
        }
    };

    return {
        unitsByGrade,
        allSlos,
        isParsing,
        directoryName,
        contextPdfs,
        setContextPdfs,
        handleDirectorySelected
    };
};
