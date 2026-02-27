import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });
const s3Client = new S3Client({ region: process.env.BEDROCK_REGION });

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { userProfile, databaseContent } = body;

    if (!userProfile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userProfile is required' })
      };
    }

    // Build context
    const dbContext = databaseContent 
      ? `Here is the content database (JSON):\n\`\`\`json\n${databaseContent}\n\`\`\`\n`
      : `WARNING: No content database file was uploaded. You must simulate the retrieval of high-quality resources from 'encephalitis.info'.`;

    const systemPrompt = `You are the Encephalitis Support Workbench Intelligence.
Your goal is to retrieve 10-15 highly relevant resources for a charity staff member to review.

Context:
User Profile: "${userProfile}"

Instructions:
1. Analyze the profile (Persona, Diagnosis, Stage, Concerns).
2. Retrieve or Generate 12 unique resources that would help this person.
3. Prioritize "Compassionate Clinical" tone.
4. Return ONLY valid JSON array.

Schema - Array of Objects:
- id: string (unique)
- title: string (clear, empathetic title)
- excerpt: string (1 sentence summary)
- type: 'PDF' | 'Article' | 'Video' | 'Webpage' | 'Book'
- timeToRead: string (e.g. "5 min", "10 min", "20 page PDF")
- matchReason: string (Why does this match the profile? e.g. "Specific for Anti-NMDAR")
- url: string (realistic URL structure like https://encephalitis.info/...)

${dbContext}`;

    const prompt = `Generate the resource list now based on the profile provided. Return only the JSON array, no other text.`;

    // Invoke Bedrock
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract text from Claude response
    let resourceText = responseBody.content[0].text;
    
    // Clean up markdown code blocks if present
    const markdownMatch = resourceText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      resourceText = markdownMatch[1];
    }

    const resources = JSON.parse(resourceText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ resources })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to retrieve resources',
        details: error.message 
      })
    };
  }
};
