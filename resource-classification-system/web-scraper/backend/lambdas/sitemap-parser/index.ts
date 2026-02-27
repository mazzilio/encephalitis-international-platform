import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

const QUEUE_URL = process.env.QUEUE_URL!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { sitemapXml } = JSON.parse(event.body || '{}');
    
    if (!sitemapXml) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing sitemapXml in request body' }),
      };
    }

    // Parse sitemap XML
    const urls = parseSitemap(sitemapXml);
    
    if (urls.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid URLs found in sitemap' }),
      };
    }

    const batchId = uuidv4();
    const timestamp = new Date().toISOString();

    // Store initial status in DynamoDB
    const dynamoPromises = urls.map(url => 
      dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: { S: `BATCH#${batchId}` },
          SK: { S: `URL#${url}` },
          url: { S: url },
          status: { S: 'pending' },
          createdAt: { S: timestamp },
          updatedAt: { S: timestamp },
        },
      }))
    );

    // Send URLs to SQS queue in batches of 10
    const sqsPromises = [];
    for (let i = 0; i < urls.length; i += 10) {
      const batch = urls.slice(i, i + 10);
      const entries = batch.map((url, index) => ({
        Id: `${i + index}`,
        MessageBody: JSON.stringify({
          url,
          jobId: uuidv4(),
          batchId,
        }),
      }));

      sqsPromises.push(
        sqsClient.send(new SendMessageBatchCommand({
          QueueUrl: QUEUE_URL,
          Entries: entries,
        }))
      );
    }

    await Promise.all([...dynamoPromises, ...sqsPromises]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        batchId,
        urlCount: urls.length,
        message: 'Processing started',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function parseSitemap(xml: string): string[] {
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const urls: string[] = [];
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}
