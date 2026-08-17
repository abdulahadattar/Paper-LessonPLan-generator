
import { GoogleGenAI, Part, Type } from "@google/genai";
import { LessonPlan } from '../../types/lesson';
import { SLO } from '../../types/slo';
import { parseLessonPlanJson } from '../../lib/json';

/**
 * Generates a lesson plan for a given SLO using the Gemini AI model.
 * 
 * @param slo - The SLO to generate a lesson plan for
 * @param unitSlos - Other SLOs from the same unit for context
 * @param contextFileParts - Optional PDF context files as base64 parts
 * @returns A promise that resolves to the generated lesson plan
 * @throws Error if the API key is not set or generation fails
 */
export async function generateLessonPlan(
    slo: SLO, 
    unitSlos: SLO[],
    contextFileParts?: Part[]
): Promise<LessonPlan> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  let gradeLevelContext: string;
  const gradeNum = parseInt(slo.grade?.replace('Grade ', '') || '9', 10);

  if (gradeNum <= 10) {
    gradeLevelContext = `${slo.grade} (Foundational)`;
  } else {
    gradeLevelContext = `${slo.grade} (Advanced)`;
  }
  
  const systemInstruction = `You are a Physics Teacher creating a lesson plan for your own use and for school records. Your task is to generate a concise, 40-minute lesson plan as a JSON object. The tone should be professional and direct, as if you are outlining the steps for yourself to follow in the classroom.

**Critical Instructions:**
1.  **Grounded Content:** The entire lesson plan must be based *only* on the content within the attached PDF document(s).
2.  **DO NOT Mention the Source:** In the generated lesson plan, **never** mention "the PDF," "the textbook," "the handout," or any other source document. The content should be presented directly as part of the lesson activities.
3.  **Direct, Teacher-Centric Tone:** Write activity descriptions in a direct, instructional style appropriate for a personal plan. Avoid narrative or conversational language. Do not use phrases like "The teacher will..." or "Students will...". Instead, use active verbs and concise descriptions of the tasks (e.g., "Initiate a brief class discussion...", "Define Physics as the study of matter...").
4.  **Focused Sub-Topic:** Analyze the requested SLO to identify a focused sub-topic suitable for a single 40-minute lesson. The plan must be granular and specific.
5.  **Mandatory 4As Structure:** The lesson must follow the 4As activity-based learning model. The 'activities' array must contain exactly four objects with these specific names:
    - **'Activating Prior Knowledge'**: Engage students and connect to past learning.
    - **'Acquiring New Knowledge'**: Introduce new concepts.
    - **'Applying Knowledge'**: A practical, hands-on activity.
    - **'Assessing Knowledge'**: A brief assessment to check for understanding of the SLO.
6.  **Timings:** The total duration of all activities must sum to exactly 40 minutes.
7.  **Homework:** Provide a meaningful homework assignment that reinforces the lesson's objective.
8.  **MANDATORY JSON OUTPUT:** The output must ONLY be a valid JSON object matching the provided schema. Do not add any extra text, headers, or conversational markdown.
9.  **Grade Appropriateness:** All content must be appropriate for ${gradeLevelContext}.
`;

  const lessonPlanSchema = {
    type: Type.OBJECT,
    properties: {
        title: { 
            type: Type.STRING,
            description: "A concise, specific topic for a 40-minute lesson derived from the main SLO.",
        },
        objective: {
            type: Type.STRING,
            description: "A clear restatement of the user's provided SLO, framed as a student learning objective.",
        },
        materials: {
            type: Type.ARRAY,
            description: "A list of necessary resources, including textbook pages if possible.",
            items: { type: Type.STRING },
        },
        activities: {
            type: Type.ARRAY,
            description: "An array of four activities that structure the lesson according to the 4As framework (Activating, Acquiring, Applying, Assessing).",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the activity (e.g., 'Activating Prior Knowledge')." },
                    duration: { type: Type.INTEGER, description: "Duration of the activity in minutes." },
                    description: { type: Type.STRING, description: "A detailed, PDF-grounded description of the activity." },
                },
                required: ['name', 'duration', 'description'],
            },
        },
        homework: {
            type: Type.STRING,
            description: "A brief but meaningful homework assignment that reinforces the lesson's objective."
        }
    },
    required: ['title', 'objective', 'materials', 'activities', 'homework'],
  };

  const contextText = unitSlos
    .filter(s => s.uniqueId !== slo.uniqueId)
    .map(s => `- ${s.SLO_ID}: ${s.SLO_Text}`)
    .join('\n');

  const userPrompt = `Generate a lesson plan for the following SLO:
**${slo.SLO_ID}: ${slo.SLO_Text}**

For context, here are other SLOs from the same unit:
${contextText || 'None'}

Use the attached PDF(s) as the primary reference for content, examples, and activities.
`;

  try {
    const parts: Part[] = [{ text: userPrompt }];
    if (contextFileParts && contextFileParts.length > 0) {
        parts.unshift(...contextFileParts);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
      },
    });

    const lessonPlan = parseLessonPlanJson(response.text, gradeLevelContext, 'Physics');
    
    return lessonPlan;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    if (error instanceof Error) {
       throw error;
    }
    throw new Error("Unknown error during generation.");
  }
}
