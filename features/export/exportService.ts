
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  ISectionOptions,
} from 'docx';
import saveAs from 'file-saver';
import { LessonPlan } from '../../types/lesson';
import { formatFileName } from '../../lib/export';
import { parseTextForDocx, parseTextForPdf } from '../../lib/text';
import { DEFAULT_DOCUMENT_CONFIG, PDF_STYLES } from '../../config/export';

// Declaration for pdfmake, which is loaded via a script tag in index.html
declare const pdfMake: any;

if (typeof pdfMake !== 'undefined' && pdfMake.tableLayouts) {
  pdfMake.tableLayouts.lessonPlanHeader = {
    hLineWidth: function (i: number, node: any) {
      if (i === 0 || i === node.table.body.length) return 1.5;
      if (i === 1) return 1.5;
      return 1;
    },
    vLineWidth: function (i: number, node: any) {
      if (i === 0 || i === node.table.widths.length) return 1.5;
      return 1;
    },
    hLineColor: function () { return '#000000'; },
    vLineColor: function () { return '#000000'; },
    paddingLeft: function() { return 5; },
    paddingRight: function() { return 5; },
    paddingTop: function() { return 4; },
    paddingBottom: function() { return 4; }
  };
}

type DocumentConfig = typeof DEFAULT_DOCUMENT_CONFIG;

function getConfig(config?: Partial<DocumentConfig>): DocumentConfig {
    return { ...DEFAULT_DOCUMENT_CONFIG, ...config };
}

function createHeaderRun(text: string, bold: boolean = false, size: number = 20, config: DocumentConfig = DEFAULT_DOCUMENT_CONFIG): TextRun {
    return new TextRun({
        text,
        bold,
        size,
        font: config.theme.font,
    });
}

function createRichParagraph(text: string): Paragraph {
    return new Paragraph({
        children: parseTextForDocx(text),
        spacing: { after: 100 },
        alignment: AlignmentType.JUSTIFIED,
    });
}

function createBulletList(items: string[]): Paragraph[] {
    return items.map(item => new Paragraph({
        children: parseTextForDocx(item),
        bullet: { level: 0 },
        spacing: { after: 50 },
    }));
}

function createSectionHeading(title: string, config: DocumentConfig = DEFAULT_DOCUMENT_CONFIG): Paragraph {
    return new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 28, color: config.theme.primaryColor })],
        spacing: { before: 300, after: 100 },
        alignment: AlignmentType.LEFT,
        border: { bottom: { color: config.theme.primaryColor, space: 4, style: "single", size: 6 } }
    });
}

function createDocxContentForPlan(lessonPlan: LessonPlan, config: DocumentConfig = DEFAULT_DOCUMENT_CONFIG): (Paragraph | Table)[] {
    const gradeShort = lessonPlan.gradeLevel.replace('Grade ', '').split(' ')[0];
    const margin = config.margins.docx;
    
    const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [createHeaderRun(config.schoolName, true, 24, config)], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [createHeaderRun(config.documentTitle, true, 36, config)], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
                        ],
                        columnSpan: 4,
                        borders: { top: { style: 'single', size: 12 }, bottom: { style: 'single', size: 12 }, left: { style: 'none'}, right: { style: 'none'} }
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`GRADE: ${gradeShort}`, true, 24, config)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                    new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`SUBJECT: ${lessonPlan.subject}`, true, 24, config)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                    new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`PERIODS: ${config.period}`, true, 24, config)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                    new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`DATE/TIMELINE: ${config.dateTimeline}`, true, 24, config)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                ],
            }),
            new TableRow({
                children: [ new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`LESSON TOPIC: ${lessonPlan.title}`, false, 24, config)] })], columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 6 }, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'} } })],
            }),
            new TableRow({
                children: [ new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`LEARNING OBJECTIVE: ${lessonPlan.objective}`, false, 24, config)] })], columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 2 }, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'} } })],
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [ new Paragraph({ children: [createHeaderRun(`TEACHER: `, false, 24, config), createHeaderRun(config.teacherName, true, 24, config)] })],
                        columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 2 }, bottom: { style: 'single', size: 12 }, left: {style: 'none'}, right: {style: 'none'} }
                    }),
                ],
            }),
        ],
    });

    const children: (Paragraph | Table)[] = [headerTable];
    children.push(createSectionHeading(config.sectionHeaders.resources, config));
    children.push(...(lessonPlan.materials.length > 0 ? createBulletList(lessonPlan.materials) : [createRichParagraph('No materials required.')]));
    children.push(createSectionHeading(config.sectionHeaders.procedure, config));
    lessonPlan.activities.forEach(activity => {
        children.push(new Paragraph({ 
            children: [ new TextRun({ text: `${activity.name.toUpperCase()} (${activity.duration} mins)`, bold: true, size: 24, font: config.theme.font })],
            spacing: { before: 200, after: 100 }
        }));
        children.push(createRichParagraph(activity.description));
    });
    children.push(createSectionHeading(config.sectionHeaders.homework, config));
    children.push(createRichParagraph(lessonPlan.homework));

    return children;
}

function createPdfRichText(text: string) {
    return { text: parseTextForPdf(text), style: 'body' };
}

function createPdfContentForPlan(lessonPlan: LessonPlan, config: DocumentConfig = DEFAULT_DOCUMENT_CONFIG): any[] {
    const gradeShort = lessonPlan.gradeLevel.replace('Grade ', '').split(' ')[0];
    const margins = config.margins.pdf;

    const headerTable = {
        layout: 'lessonPlanHeader',
        table: {
            widths: ['auto', '*', 'auto', '*'],
            body: [
                [{ colSpan: 4, text: `${config.schoolName}\n${config.documentTitle}`, style: 'headerTableTitle' }, {}, {}, {}],
                [
                    { text: [{ text: 'GRADE: ', bold: true }, gradeShort], style: 'headerTableSub' }, 
                    { text: [{ text: 'SUBJECT: ', bold: true }, { text: lessonPlan.subject, bold: true }], style: 'headerTableSub' }, 
                    { text: [{ text: 'PERIODS: ', bold: true }, { text: config.period, bold: true }], style: 'headerTableSub' }, 
                    { text: [{ text: 'DATE/TIMELINE: ', bold: true }, config.dateTimeline], style: 'headerTableSub' }
                ],
                [{ colSpan: 4, text: [{ text: 'LESSON TOPIC: ', bold: true }, lessonPlan.title], style: 'headerTableBody' }, {}, {}, {}],
                [{ colSpan: 4, text: [{ text: 'LEARNING OBJECTIVE: ', bold: true }, lessonPlan.objective], style: 'headerTableBody' }, {}, {}, {}],
                [{ colSpan: 4, text: [{ text: 'TEACHER: ', bold: true }, { text: config.teacherName, bold: true }], style: 'headerTableBody' }, {}, {}, {}],
            ]
        },
        margin: [0, 0, 0, 10] 
    };
    
    const resourcesSection = [
        { text: config.sectionHeaders.resources, style: 'sectionHeader' },
        { ul: lessonPlan.materials.length > 0 ? lessonPlan.materials.map(m => createPdfRichText(m)) : [{ text: 'No materials required.', style: 'body' }] },
    ];

    const procedureSection = [
        { text: config.sectionHeaders.procedure, style: 'sectionHeader' },
        ...lessonPlan.activities.flatMap(activity => ([
            { text: `${activity.name.toUpperCase()} (${activity.duration} mins)`, bold: true, margin: [0, 8, 0, 4] },
            createPdfRichText(activity.description)
        ])),
    ];

    const homeworkSection = [
        { text: config.sectionHeaders.homework, style: 'sectionHeader' },
        createPdfRichText(lessonPlan.homework),
    ];

    return [headerTable, ...resourcesSection, ...procedureSection, ...homeworkSection];
}

/**
 * Exports a single lesson plan as a DOCX file.
 * @param lessonPlan - The lesson plan to export
 * @param sloId - Optional SLO ID to prefix the filename
 * @param config - Optional document configuration override
 */
export const exportAsDocx = async (lessonPlan: LessonPlan, sloId?: string, config?: Partial<DocumentConfig>): Promise<void> => {
  const fileName = `${formatFileName(lessonPlan.title, sloId)}.docx`;
  const docConfig = getConfig(config);
  const children = createDocxContentForPlan(lessonPlan, docConfig);
  const doc = new Document({
      sections: [{
          properties: { page: { margin: { top: docConfig.margins.docx, right: docConfig.margins.docx, bottom: docConfig.margins.docx, left: docConfig.margins.docx }}},
          children: children,
      }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};

/**
 * Exports a single lesson plan as a PDF file.
 * @param lessonPlan - The lesson plan to export
 * @param sloId - Optional SLO ID to prefix the filename
 * @param config - Optional document configuration override
 */
export const exportAsPdf = async (lessonPlan: LessonPlan, sloId?: string, config?: Partial<DocumentConfig>): Promise<void> => {
    const fileName = `${formatFileName(lessonPlan.title, sloId)}.pdf`;
    const docConfig = getConfig(config);
    const content = createPdfContentForPlan(lessonPlan, docConfig);
    const docDefinition: any = {
        pageMargins: docConfig.margins.pdf,
        content: content,
        styles: PDF_STYLES,
        defaultStyle: { font: docConfig.theme.font }
    };
    pdfMake.createPdf(docDefinition).download(fileName);
};

/**
 * Exports multiple lesson plans as a single DOCX file with page breaks.
 * @param lessonPlans - Array of lesson plans to export
 * @param fileName - Base filename without extension
 * @param config - Optional document configuration override
 */
export const exportMultipleLessonsAsDocx = async (lessonPlans: LessonPlan[], fileName: string, config?: Partial<DocumentConfig>): Promise<void> => {
    const docConfig = getConfig(config);
    const sections: ISectionOptions[] = lessonPlans.map((plan, index) => ({
        properties: { 
            page: { margin: { top: docConfig.margins.docx, right: docConfig.margins.docx, bottom: docConfig.margins.docx, left: docConfig.margins.docx } },
            pageBreakBefore: index > 0,
        },
        children: createDocxContentForPlan(plan, docConfig),
    }));

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};

/**
 * Exports multiple lesson plans as a single PDF file with page breaks.
 * @param lessonPlans - Array of lesson plans to export
 * @param fileName - Base filename without extension
 * @param config - Optional document configuration override
 */
export const exportMultipleLessonsAsPdf = async (lessonPlans: LessonPlan[], fileName: string, config?: Partial<DocumentConfig>): Promise<void> => {
    const docConfig = getConfig(config);
    const allContent = lessonPlans.flatMap((plan, index) => {
        const content = createPdfContentForPlan(plan, docConfig);
        if (index > 0) {
            return [{ text: '', pageBreak: 'before' as const }, ...content];
        }
        return content;
    });

    const docDefinition: any = {
        pageMargins: docConfig.margins.pdf,
        content: allContent,
        styles: PDF_STYLES,
        defaultStyle: { font: docConfig.theme.font }
    };

    pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
};
