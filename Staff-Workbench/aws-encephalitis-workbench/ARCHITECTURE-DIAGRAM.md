# Architecture Diagram - AWS Encephalitis Support Workbench

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │                 │
│  │   Browser    │  │   Browser    │  │   Browser    │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                            │                                             │
│                         HTTPS                                            │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTENT DELIVERY                                 │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    AWS Amplify / CloudFront                        │ │
│  │  • Static hosting (React SPA)                                     │ │
│  │  • Global CDN (edge locations)                                    │ │
│  │  • SSL/TLS certificates                                           │ │
│  │  • Custom domain support                                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                         REST API
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                  Amazon API Gateway (REST)                         │ │
│  │                                                                    │ │
│  │  Endpoints:                                                        │ │
│  │  • POST /suggest-resources    → Lambda: suggestResources         │ │
│  │  • POST /generate-draft       → Lambda: generateDraft            │ │
│  │  • POST /upload-knowledge-base → Lambda: uploadKnowledgeBase     │ │
│  │                                                                    │ │
│  │  Features:                                                         │ │
│  │  • CORS enabled                                                   │ │
│  │  • Request validation                                             │ │
│  │  • Rate limiting                                                  │ │
│  │  • CloudWatch logging                                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────┬────────────────┬────────────────┬────────────────────────┘
                 │                │                │
                 ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPUTE LAYER (Serverless)                        │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │     Lambda       │  │     Lambda       │  │     Lambda       │     │
│  │ suggestResources │  │  generateDraft   │  │uploadKnowledgeBase│    │
│  │                  │  │                  │  │                  │     │
│  │ • Node.js 20.x   │  │ • Node.js 20.x   │  │ • Node.js 20.x   │     │
│  │ • 512 MB RAM     │  │ • 512 MB RAM     │  │ • 512 MB RAM     │     │
│  │ • 60s timeout    │  │ • 60s timeout    │  │ • 60s timeout    │     │
│  │                  │  │                  │  │                  │     │
│  │ Permissions:     │  │ Permissions:     │  │ Permissions:     │     │
│  │ • Bedrock invoke │  │ • Bedrock invoke │  │ • S3 PutObject   │     │
│  │ • S3 GetObject   │  │                  │  │                  │     │
│  │ • CloudWatch logs│  │ • CloudWatch logs│  │ • CloudWatch logs│     │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘     │
│           │                     │                     │                │
└───────────┼─────────────────────┼─────────────────────┼────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI & STORAGE LAYER                              │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      Amazon Bedrock                                │ │
│  │                                                                    │ │
│  │  Model: Claude 3.5 Sonnet                                         │ │
│  │  Model ID: anthropic.claude-3-5-sonnet-20241022-v2:0             │ │
│  │                                                                    │ │
│  │  Capabilities:                                                     │ │
│  │  • 200K token context window                                      │ │
│  │  • JSON response parsing                                          │ │
│  │  • System prompts                                                 │ │
│  │  • Temperature control                                            │ │
│  │                                                                    │ │
│  │  Use Cases:                                                        │ │
│  │  1. Resource Suggestion (12 resources per request)                │ │
│  │  2. Email Draft Generation (modular blocks)                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        Amazon S3                                   │ │
│  │                                                                    │ │
│  │  Bucket: {stack-name}-knowledge-base                              │ │
│  │                                                                    │ │
│  │  Structure:                                                        │ │
│  │  knowledge-base/                                                   │ │
│  │    └── {filename}.json                                            │ │
│  │                                                                    │ │
│  │  Features:                                                         │ │
│  │  • CORS enabled                                                   │ │
│  │  • Versioning (optional)                                          │ │
│  │  • Encryption at rest (optional)                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
