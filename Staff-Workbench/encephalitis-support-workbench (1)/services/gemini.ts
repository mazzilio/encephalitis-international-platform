import { GoogleGenAI } from "@google/genai";
import { Resource, DraftResponse } from "../types";

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const DB_CONTEXT = (dbContent: string | null) => 
    dbContent 
    ? `Here is the content_database (JSON):\n\`\`\`json\n${dbContent}\n\`\`\`\n`
    : `WARNING: No content database file was uploaded. You must simulate the retrieval of high-quality resources from 'encephalitis.info'.`;

export const suggestResources = async (
    userProfile: string,
    databaseContent: string | null
): Promise<Resource[]> => {
    const ai = getClient();

    const systemInstruction = `
        You are the **Encephalitis Support Workbench Intelligence**.
        Your goal is to retrieve 10-15 highly relevant resources for a charity staff member to review.
        
        **Context**
        User Profile: "${userProfile}"
        
        **Instructions**
        1. Analyze the profile (Persona, Diagnosis, Stage, Concerns).
        2. Retrieve or Generate 12 unique resources that would help this person.
        3. Prioritize "Compassionate Clinical" tone.
        4. Return ONLY valid JSON.
        
        **Schema**
        Array of Objects:
        - id: string (unique)
        - title: string (clear, empathetic title)
        - excerpt: string (1 sentence summary)
        - type: 'PDF' | 'Article' | 'Video' | 'Webpage' | 'Book'
        - timeToRead: string (e.g. "5 min", "10 min", "20 page PDF")
        - matchReason: string (Why does this match the profile? e.g. "Specific for Anti-NMDAR")
        - url: string (realistic URL structure like https://encephalitis.info/...)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate the resource list now based on the profile provided.`,
            config: {
                systemInstruction: systemInstruction + "\n" + DB_CONTEXT(databaseContent),
                responseMimeType: "application/json",
                temperature: 0.3,
            }
        });

        let jsonText = response.text || "[]";
        
        // Robust cleanup: remove markdown code blocks if present (e.g. ```json ... ```)
        const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            jsonText = markdownMatch[1];
        }

        return JSON.parse(jsonText) as Resource[];
    } catch (error: any) {
        console.error("Gemini Suggestion Error:", error);
        throw new Error("Failed to retrieve resources. Please try again.");
    }
};

export const generateDraft = async (
    userProfile: string,
    selectedResources: Resource[]
): Promise<DraftResponse> => {
    const ai = getClient();

    const resourceList = selectedResources.map(r => 
        `- ${r.title}: ${r.excerpt}`
    ).join("\n");

    const systemInstruction = `
        You are a compassionate support specialist at Encephalitis International.
        Your goal is to generate MODULAR BLOCKS of content for an email draft.
        
        **Critical Constraints**
        1. **EXTREMELY CONCISE**: The draft must be 50% SHORTER than a standard email. Cut all fluff.
        2. **Modular**: Return a JSON object with distinct parts so the user can mix and match.
        3. **Tone**: Warm, reassuring, but direct and professional.
        
        **Output Schema (JSON)**
        {
           "subject": "A concise, supportive subject line",
           "opening": "2 short sentences acknowledging their specific situation/diagnosis warmly.",
           "resourceIntro": "1 very short sentence introducing the resources below.",
           "closing": "1 short sentence offering further help.",
           "signOff": "Warmly, [Your Name]"
        }
    `;

    const prompt = `
        User Profile: ${userProfile}
        
        The user has selected these specific resources to send:
        ${resourceList}
        
        Generate the email blocks in JSON format. Keep it brief.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.5,
            }
        });

        let jsonText = response.text || "{}";
        const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            jsonText = markdownMatch[1];
        }
        
        return JSON.parse(jsonText) as DraftResponse;
    } catch (error: any) {
        console.error("Gemini Draft Error:", error);
        throw new Error("Failed to generate email draft.");
    }
};