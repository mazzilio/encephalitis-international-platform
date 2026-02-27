import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.BEDROCK_REGION });

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { fileName, fileContent } = body;

    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'fileName and fileContent are required' })
      };
    }

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `knowledge-base/${fileName}`,
      Body: fileContent,
      ContentType: 'application/json'
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Knowledge base uploaded successfully',
        fileName,
        s3Key: `knowledge-base/${fileName}`
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to upload knowledge base',
        details: error.message 
      })
    };
  }
};
