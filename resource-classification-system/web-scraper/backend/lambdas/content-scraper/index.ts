import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import axios from 'axios';
import * as cheerio from 'cheerio';

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const CLASSIFIER_QUEUE_URL = process.env.CLASSIFIER_QUEUE_URL!;

export const handler = async (event: SQSEvent): Promise<void> => {
  const promises = event.Records.map(record => processRecord(record));
  await Promise.allSettled(promises);
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const { url, jobId, batchId } = JSON.parse(record.body);

    // Update status to scraping
    await updateStatus(batchId, url, 'scraping');

    // Scrape content
    const content = await scrapeContent(url);

    // Send to classifier queue
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: CLASSIFIER_QUEUE_URL,
      MessageBody: JSON.stringify({
        url,
        content,
        jobId,
        batchId,
      }),
    }));

    console.log(`Successfully scraped: ${url}`);
  } catch (error) {
    console.error('Error processing record:', error);
    const { url, batchId } = JSON.parse(record.body);
    await updateStatus(batchId, url, 'error', String(error));
  }
}

async function scrapeContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AWSWebScraper/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Extract main content
    const mainContent = $('main, article, .content, #content').text() || $('body').text();

    // Clean and normalize text
    const cleanText = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    return cleanText.substring(0, 50000); // Limit to 50k chars
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error}`);
  }
}

async function updateStatus(
  batchId: string,
  url: string,
  status: string,
  error?: string
): Promise<void> {
  const updateExpression = error
    ? 'SET #status = :status, #error = :error, updatedAt = :timestamp'
    : 'SET #status = :status, updatedAt = :timestamp';

  const expressionAttributeValues: any = {
    ':status': { S: status },
    ':timestamp': { S: new Date().toISOString() },
  };

  if (error) {
    expressionAttributeValues[':error'] = { S: error };
  }

  await dynamoClient.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: { S: `BATCH#${batchId}` },
      SK: { S: `URL#${url}` },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      '#status': 'status',
      ...(error && { '#error': 'error' }),
    },
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}
