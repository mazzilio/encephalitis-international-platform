import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const batchId = event.pathParameters?.batchId;

    if (!batchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing batchId parameter' }),
      };
    }

    // List all result files for this batch
    const listResult = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `results/${batchId}/`,
    }));

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No results found for this batch' }),
      };
    }

    // Fetch all result files
    const results = await Promise.all(
      listResult.Contents.map(async (obj) => {
        const getResult = await s3Client.send(new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: obj.Key,
        }));

        const body = await streamToString(getResult.Body as Readable);
        return JSON.parse(body);
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `attachment; filename="results-${batchId}.json"`,
      },
      body: JSON.stringify(results, null, 2),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}
