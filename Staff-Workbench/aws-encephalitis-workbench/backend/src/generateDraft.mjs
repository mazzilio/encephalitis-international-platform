import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { userProfile, selectedResources } = body;

    if (!userProfile || !selectedResources) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userProfile and selectedResources are required' })
      };
    }

    const resourceList = selectedResources.map(r => 
      `- ${r.title}: ${r.excerpt}`
    ).join("\n");

    const systemPrompt = `You are a compassionate support specialist at Encephalitis International.
Your goal is to generate MODULAR BLOCKS of content for an email draft.

Critical Constraints:
1. EXTREMELY CONCISE: The draft must be 50% SHORTER than a standard email. Cut all fluff.
2. Modular: Return a JSON object with distinct parts so the user can mix and match.
3. Tone: Warm, reassuring, but direct and professional.

Output Schema (JSON):
{
   "subject": "A concise, supportive subject line",
   "opening": "2 short sentences acknowledging their specific situation/diagnosis warmly.",
   "resourceIntro": "1 very short sentence introducing the resources below.",
   "closing": "1 short sentence offering further help.",
   "signOff": "Warmly, [Your Name]"
}`;

    const prompt = `User Profile: ${userProfile}

The user has selected these specific resources to send:
${resourceList}

Generate the email blocks in JSON format. Keep it brief. Return only the JSON object, no other text.`;

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        temperature: 0.5,
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
    
    let draftText = responseBody.content[0].text;
    
    // Clean up markdown code blocks if present
    const markdownMatch = draftText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      draftText = markdownMatch[1];
    }

    const draft = JSON.parse(draftText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ draft })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate draft',
        details: error.message 
      })
    };
  }
};
