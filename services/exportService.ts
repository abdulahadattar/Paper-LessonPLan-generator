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
  PageBreak,
  ISectionOptions,
} from 'docx';
import saveAs from 'file-saver';
import { LessonPlan } from '../types';

// --- UTILITY FUNCTIONS ---

export const formatFileName = (title: string, sloId?: string): string => {
  const baseName = sloId ? `${sloId}_${title}` : title;
  return baseName.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 100);
};

// --- DOCX PARSING AND HELPERS ---

const parseTextForDocx = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\s](?:[^\$]*[^\s])?\$|\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index), font: "Calibri", size: 22 }));
    }
    const matchedText = match[0];
    if (matchedText.startsWith('$$') && matchedText.endsWith('$$')) {
      runs.push(new TextRun({ text: matchedText.slice(2, -2).trim(), bold: true, font: "Cambria Math", size: 24 }));
    } else if (matchedText.startsWith('$') && matchedText.endsWith('$')) {
      runs.push(new TextRun({ text: matchedText.slice(1, -1), bold: true, font: "Cambria Math", size: 22 }));
    } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      runs.push(new TextRun({ text: matchedText.slice(2, -2), bold: true, font: "Calibri", size: 22 }));
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      runs.push(new TextRun({ text: matchedText.slice(1, -1), italics: true, font: "Calibri", size: 22 }));
    }
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex), font: "Calibri", size: 22 }));
  }
  return runs;
};

const createRichParagraph = (text: string): Paragraph => new Paragraph({
  children: parseTextForDocx(text),
  spacing: { after: 100 },
  alignment: AlignmentType.JUSTIFIED,
});

const createBulletList = (items: string[]): Paragraph[] => items.map(item => new Paragraph({
  children: parseTextForDocx(item),
  bullet: { level: 0 },
  spacing: { after: 50 },
}));

const createSectionHeading = (title: string): Paragraph => new Paragraph({
  children: [new TextRun({ text: title, bold: true, size: 28, color: "1F4E79" })],
  spacing: { before: 300, after: 100 },
  alignment: AlignmentType.LEFT,
  border: { bottom: { color: "1F4E79", space: 4, style: "single", size: 6 } }
});

const createHeaderRun = (text: string, bold: boolean = false, size: number = 20): TextRun => new TextRun({
  text,
  bold,
  size,
  font: "Calibri",
});

const createDocxContentForPlan = (lessonPlan: LessonPlan): (Paragraph | Table)[] => {
  const teacherName = "Abdul Ahad"; 
  const schoolPlaceholder = "Peoples Higher Secondary School Jamshoro"; 
  const dateTimeline = '____________________'; 
  const period = '1';
  const gradeShort = lessonPlan.gradeLevel.replace('Grade ', '').split(' ')[0];
  
  const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
          new TableRow({
              children: [
                  new TableCell({
                      children: [
                          new Paragraph({ children: [createHeaderRun(schoolPlaceholder, true, 24)], alignment: AlignmentType.CENTER }),
                          new Paragraph({ children: [createHeaderRun('DAILY LESSON PLAN', true, 36)], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
                      ],
                      columnSpan: 4,
                      borders: { top: { style: 'single', size: 12 }, bottom: { style: 'single', size: 12 }, left: { style: 'none'}, right: { style: 'none'} }
                  }),
              ],
          }),
          new TableRow({
              children: [
                  new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`GRADE: ${gradeShort}`, true, 24)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                  new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`SUBJECT: ${lessonPlan.subject}`, true, 24)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                  new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`PERIODS: ${period}`, true, 24)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
                  new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`DATE/TIMELINE: ${dateTimeline}`, true, 24)] })], verticalAlign: VerticalAlign.CENTER, borders: {top: {style: 'none'}, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'}} }),
              ],
          }),
          new TableRow({
              children: [ new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`LESSON TOPIC: ${lessonPlan.title}`, false, 24)] })], columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 6 }, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'} } })],
          }),
          new TableRow({
              children: [ new TableCell({ children: [new Paragraph({ children: [createHeaderRun(`LEARNING OBJECTIVE: ${lessonPlan.objective}`, false, 24)] })], columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 2 }, bottom: {style: 'none'}, left: {style: 'none'}, right: {style: 'none'} } })],
          }),
          new TableRow({
              children: [
                  new TableCell({
                      children: [ new Paragraph({ children: [createHeaderRun(`TEACHER: `, false, 24), createHeaderRun(teacherName, true, 24)] })],
                      columnSpan: 4, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: 'single', size: 2 }, bottom: { style: 'single', size: 12 }, left: {style: 'none'}, right: {style: 'none'} }
                  }),
              ],
          }),
      ],
  });

  const children: (Paragraph | Table)[] = [headerTable];
  children.push(createSectionHeading('RESOURCES'));
  children.push(...(lessonPlan.materials.length > 0 ? createBulletList(lessonPlan.materials) : [createRichParagraph('No materials required.')]));
  children.push(createSectionHeading('LESSON PROCEDURE & TIMINGS'));
  lessonPlan.activities.forEach(activity => {
      children.push(new Paragraph({ 
          children: [ new TextRun({ text: `${activity.name.toUpperCase()} (${activity.duration} mins)`, bold: true, size: 24 })],
          spacing: { before: 200, after: 100 }
      }));
      children.push(createRichParagraph(activity.description));
  });
  children.push(createSectionHeading('HOMEWORK ASSIGNMENT'));
  children.push(createRichParagraph(lessonPlan.homework));
  return children;
};

// --- SINGLE EXPORT FUNCTIONS ---

export const exportAsDocx = async (lessonPlan: LessonPlan, sloId?: string): Promise<void> => {
  const fileName = `${formatFileName(lessonPlan.title, sloId)}.docx`;
  const narrowMargin = 567;
  const children = createDocxContentForPlan(lessonPlan);
  const doc = new Document({
      sections: [{
          properties: { page: { margin: { top: narrowMargin, right: narrowMargin, bottom: narrowMargin, left: narrowMargin }}},
          children: children,
      }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
};

export const exportAsPdf = async (lessonPlan: LessonPlan, sloId?: string): Promise<void> => {
  const fileName = `${formatFileName(lessonPlan.title, sloId)}.pdf`;
  try {
    const response = await fetch('http://localhost:5001/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonPlan),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please ensure the backend server is running.');
  }
};

// --- MULTIPLE EXPORT FUNCTIONS ---

export const exportMultipleLessonsAsDocx = async (lessonPlans: LessonPlan[], fileName: string): Promise<void> => {
    const narrowMargin = 567;
    const sections: ISectionOptions[] = lessonPlans.map((plan, index) => ({
        properties: { 
            page: { margin: { top: narrowMargin, right: narrowMargin, bottom: narrowMargin, left: narrowMargin } },
            pageBreakBefore: index > 0,
        },
        children: createDocxContentForPlan(plan),
    }));

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};

export const exportMultipleLessonsAsPdf = async (lessonPlans: LessonPlan[], fileName: string): Promise<void> => {
    // This function is not yet implemented for the backend service.
    // For now, we will generate a PDF for the first lesson plan only.
    if (lessonPlans.length > 0) {
        await exportAsPdf(lessonPlans[0], fileName);
    }
};