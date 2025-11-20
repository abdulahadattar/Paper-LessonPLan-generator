
import { useState, useEffect } from 'react';
import { SLO, UnitsByGrade, ContextPdf } from '../types';
import { loadInitialSlos } from '../services/sloService';
import { getRemotePdfs } from '../services/remoteContextService';

export const useSloData = () => {
    const [unitsByGrade, setUnitsByGrade] = useState<UnitsByGrade>({});
    const [allSlos, setAllSlos] = useState<SLO[]>([]);
    const [isParsing, setIsParsing] = useState(true);
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [contextPdfs, setContextPdfs] = useState<ContextPdf[]>([]);

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