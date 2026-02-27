import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class WebScraperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for tracking status
    const table = new dynamodb.Table(this, 'WebScraperTable', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for results
    const bucket = new s3.Bucket(this, 'ResultsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // SQS Queues
    const scraperDLQ = new sqs.Queue(this, 'ScraperDLQ', {
      retentionPeriod: cdk.Duration.days(14),
    });

    const scraperQueue = new sqs.Queue(this, 'ScraperQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: scraperDLQ,
        maxReceiveCount: 3,
      },
    });

    const classifierDLQ = new sqs.Queue(this, 'ClassifierDLQ', {
      retentionPeriod: cdk.Duration.days(14),
    });

    const classifierQueue = new sqs.Queue(this, 'ClassifierQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: classifierDLQ,
        maxReceiveCount: 3,
      },
    });

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('backend/layers/shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared dependencies for web scraper',
    });

    // Sitemap Parser Lambda
    const sitemapParser = new lambda.Function(this, 'SitemapParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/sitemap-parser'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
        QUEUE_URL: scraperQueue.queueUrl,
      },
      layers: [sharedLayer],
    });

    table.grantWriteData(sitemapParser);
    scraperQueue.grantSendMessages(sitemapParser);

    // Content Scraper Lambda
    const contentScraper = new lambda.Function(this, 'ContentScraper', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/content-scraper'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        TABLE_NAME: table.tableName,
        CLASSIFIER_QUEUE_URL: classifierQueue.queueUrl,
      },
      layers: [sharedLayer],
    });

    contentScraper.addEventSource(new SqsEventSource(scraperQueue, {
      batchSize: 10,
    }));

    table.grantReadWriteData(contentScraper);
    classifierQueue.grantSendMessages(contentScraper);

    // Content Classifier Lambda (Enhanced with Resource Classification System)
    const contentClassifier = new lambda.Function(this, 'ContentClassifier', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/content-classifier-enhanced'),
      timeout: cdk.Duration.seconds(180),
      memorySize: 2048,
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
        MODEL_ID: 'global.anthropic.claude-opus-4-5-20251101-v1:0',
      },
      layers: [sharedLayer],
    });

    contentClassifier.addEventSource(new SqsEventSource(classifierQueue, {
      batchSize: 5,
    }));

    table.grantReadWriteData(contentClassifier);
    bucket.grantWrite(contentClassifier);

    // Grant Bedrock access for Claude Opus 4.5
    contentClassifier.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/global.anthropic.claude-opus-4-5-20251101-v1:0'
      ],
    }));

    // Status Checker Lambda
    const statusChecker = new lambda.Function(this, 'StatusChecker', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/status-checker'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
      },
      layers: [sharedLayer],
    });

    table.grantReadData(statusChecker);

    // Results Exporter Lambda
    const resultsExporter = new lambda.Function(this, 'ResultsExporter', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/results-exporter'),
      timeout: cdk.Duration.seconds(60),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      layers: [sharedLayer],
    });

    bucket.grantRead(resultsExporter);

    // Tag Analyzer Lambda (for discovering classification gaps)
    const tagAnalyzer = new lambda.Function(this, 'TagAnalyzer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend/lambdas/tag-analyzer'),
      timeout: cdk.Duration.seconds(60),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      layers: [sharedLayer],
    });

    bucket.grantRead(tagAnalyzer);

    // API Gateway
    const api = new apigateway.RestApi(this, 'WebScraperApi', {
      restApiName: 'Web Scraper API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Routes
    const process = api.root.addResource('process');
    process.addMethod('POST', new apigateway.LambdaIntegration(sitemapParser));

    const status = api.root.addResource('status');
    const statusBatch = status.addResource('{batchId}');
    statusBatch.addMethod('GET', new apigateway.LambdaIntegration(statusChecker));

    const results = api.root.addResource('results');
    const resultsBatch = results.addResource('{batchId}');
    resultsBatch.addMethod('GET', new apigateway.LambdaIntegration(resultsExporter));

    const analysis = api.root.addResource('analysis');
    const analysisBatch = analysis.addResource('{batchId}');
    analysisBatch.addMethod('GET', new apigateway.LambdaIntegration(tagAnalyzer));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
