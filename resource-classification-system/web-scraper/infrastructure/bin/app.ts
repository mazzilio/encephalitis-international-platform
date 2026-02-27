#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WebScraperStack } from '../cdk-stack';

const app = new cdk.App();

new WebScraperStack(app, 'WebScraperStack', {
  env: {
    region: 'us-west-2', // Oregon region
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description: 'AWS Web Scraper for Resource Classification',
});

app.synth();
