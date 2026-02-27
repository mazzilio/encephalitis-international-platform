import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const batchId = event.pathParameters?.batchId;

    if (!batchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing batchId parameter' }),
      };
    }

    // Query all items for this batch
    const result = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: `BATCH#${batchId}` },
      },
    }));

    const items = result.Items?.map(item => unmarshall(item)) || [];

    // Calculate statistics
    const stats = {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      scraping: items.filter(i => i.status === 'scraping').length,
      classifying: items.filter(i => i.status === 'classifying').length,
      completed: items.filter(i => i.status === 'completed').length,
      error: items.filter(i => i.status === 'error').length,
    };

    const progress = items.length > 0 
      ? Math.round((stats.completed / items.length) * 100) 
      : 0;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        batchId,
        stats,
        progress,
        items: items.map(item => ({
          url: item.url,
          status: item.status,
          error: item.error,
          updatedAt: item.updatedAt,
        })),
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
