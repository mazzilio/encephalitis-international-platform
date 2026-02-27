# Visual Architecture Diagrams

## 1. System Architecture (Mermaid)

```mermaid
graph TB
    subgraph Users["👥 User Layer"]
        Desktop["🖥️ Desktop Browser"]
        Tablet["📱 Tablet Browser"]
        Mobile["📱 Mobile Browser"]
    end

    subgraph CDN["🌐 Content Delivery Network"]
        Amplify["AWS Amplify<br/>Static Hosting + CI/CD"]
        CloudFront["Amazon CloudFront<br/>Global CDN<br/>SSL/TLS"]
    end

    subgraph API["🔌 API Layer"]
        APIGateway["Amazon API Gateway<br/>REST API<br/><br/>Endpoints:<br/>• POST /suggest-resources<br/>• POST /generate-draft<br/>• POST /upload-knowledge-base"]
    end

    subgraph Compute["⚡ Serverless Compute"]
        Lambda1["AWS Lambda<br/>suggestResources<br/><br/>Node.js 20.x<br/>512 MB RAM<br/>60s timeout"]
        Lambda2["AWS Lambda<br/>generateDraft<br/><br/>Node.js 20.x<br/>512 MB RAM<br/>60s timeout"]
        Lambda3["AWS Lambda<br/>uploadKnowledgeBase<br/><br/>Node.js 20.x<br/>512 MB RAM<br/>60s timeout"]
    end

    subgraph AI["🤖 AI Services"]
        Bedrock["Amazon Bedrock<br/>Claude 3.5 Sonnet<br/><br/>Model ID:<br/>anthropic.claude-3-5-sonnet-20241022-v2:0<br/><br/>• 200K context window<br/>• JSON responses<br/>• System prompts"]
    end

    subgraph Storage["💾 Storage"]
        S3["Amazon S3<br/>Knowledge Base Bucket<br/><br/>Structure:<br/>knowledge-base/<br/>  └── *.json"]
    end

    subgraph Monitoring["📊 Monitoring & Logging"]
        CloudWatch["Amazon CloudWatch<br/><br/>• Lambda metrics<br/>• API Gateway logs<br/>• Custom dashboards<br/>• Alarms"]
    end

    Desktop --> Amplify
    Tablet --> Amplify
    Mobile --> Amplify
    
    Amplify --> CloudFront
    CloudFront --> APIGateway
    
    APIGateway --> Lambda1
    APIGateway --> Lambda2
    APIGateway --> Lambda3
    
    Lambda1 --> Bedrock
    Lambda2 --> Bedrock
    Lambda1 --> S3
    Lambda3 --> S3
    
    Lambda1 -.-> CloudWatch
    Lambda2 -.-> CloudWatch
    Lambda3 -.-> CloudWatch
    APIGateway -.-> CloudWatch
```


## 2. Data Flow Diagram (Mermaid)

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant CF as CloudFront/Amplify
    participant API as API Gateway
    participant L1 as Lambda: suggestResources
    participant L2 as Lambda: generateDraft
    participant Bedrock as Amazon Bedrock
    participant S3 as Amazon S3
    
    Note over User,S3: Resource Suggestion Flow
    
    User->>CF: 1. Load React App
    CF-->>User: Static Assets (HTML/JS/CSS)
    
    User->>API: 2. POST /suggest-resources<br/>{userProfile, databaseContent}
    API->>L1: Invoke Lambda
    
    alt Knowledge Base Exists
        L1->>S3: Get knowledge base file
        S3-->>L1: JSON content
    end
    
    L1->>Bedrock: InvokeModel<br/>Claude 3.5 Sonnet<br/>System: Resource suggestion prompt<br/>User: Profile data
    Bedrock-->>L1: JSON array of 12 resources
    L1->>L1: Parse & validate JSON
    L1-->>API: Return resources
    API-->>User: 200 OK + resources[]
    
    Note over User,S3: Draft Generation Flow
    
    User->>API: 3. POST /generate-draft<br/>{userProfile, selectedResources}
    API->>L2: Invoke Lambda
    L2->>Bedrock: InvokeModel<br/>Claude 3.5 Sonnet<br/>System: Email draft prompt<br/>User: Profile + resources
    Bedrock-->>L2: JSON draft object
    L2->>L2: Parse & validate JSON
    L2-->>API: Return draft
    API-->>User: 200 OK + draft{}
    
    User->>User: Edit & copy draft
```


## 3. Component Architecture (Mermaid)

```mermaid
graph LR
    subgraph Frontend["Frontend (React + Vite)"]
        App[App.tsx<br/>Main Application]
        FileUploader[FileUploader.tsx<br/>Knowledge Base Upload]
        OutputSection[OutputSection.tsx<br/>Draft Display]
        AWSService[aws-bedrock.ts<br/>API Client]
        MockAPI[mock-api.ts<br/>Local Development]
        Types[types.ts<br/>TypeScript Definitions]
        MockData[mockProfiles.ts<br/>Sample Data]
    end
    
    subgraph Backend["Backend (AWS Lambda)"]
        SR[suggestResources.mjs<br/>Resource AI Logic]
        GD[generateDraft.mjs<br/>Draft AI Logic]
        UK[uploadKnowledgeBase.mjs<br/>S3 Upload Logic]
    end
    
    subgraph Infrastructure["Infrastructure (SAM)"]
        Template[template.yaml<br/>CloudFormation]
    end
    
    App --> FileUploader
    App --> OutputSection
    App --> AWSService
    App --> Types
    App --> MockData
    AWSService --> MockAPI
    
    AWSService -.HTTP.-> SR
    AWSService -.HTTP.-> GD
    AWSService -.HTTP.-> UK
    
    Template -.Deploys.-> SR
    Template -.Deploys.-> GD
    Template -.Deploys.-> UK
```


## 4. Deployment Architecture (Mermaid)

```mermaid
graph TB
    subgraph Dev["Developer Workstation"]
        Code[Source Code<br/>Git Repository]
        SAM[AWS SAM CLI]
        NPM[npm/Node.js]
    end
    
    subgraph CI["CI/CD Pipeline"]
        GitHub[GitHub Repository]
        AmplifyCI[AWS Amplify CI/CD]
    end
    
    subgraph AWS["AWS Cloud"]
        subgraph Frontend["Frontend Stack"]
            AmpHost[Amplify Hosting]
            CFDist[CloudFront Distribution]
        end
        
        subgraph Backend["Backend Stack"]
            CFStack[CloudFormation Stack]
            APIGw[API Gateway]
            L1[Lambda Functions]
            IAMRole[IAM Roles]
        end
        
        subgraph Services["AWS Services"]
            BR[Bedrock]
            S3B[S3 Bucket]
            CW[CloudWatch]
        end
    end
    
    Code -->|git push| GitHub
    Code -->|sam deploy| SAM
    
    SAM -->|Create/Update| CFStack
    CFStack --> APIGw
    CFStack --> L1
    CFStack --> IAMRole
    CFStack --> S3B
    
    GitHub -->|Auto Deploy| AmplifyCI
    AmplifyCI -->|Build & Deploy| AmpHost
    AmpHost --> CFDist
    
    L1 --> BR
    L1 --> S3B
    L1 --> CW
    APIGw --> CW
```


## 5. Security Architecture (Mermaid)

```mermaid
graph TB
    subgraph Internet["Public Internet"]
        User[User Browser]
    end
    
    subgraph AWS["AWS Cloud"]
        subgraph Edge["Edge Layer"]
            CF[CloudFront<br/>SSL/TLS Termination<br/>DDoS Protection]
        end
        
        subgraph API["API Layer"]
            APIGW[API Gateway<br/>CORS<br/>Rate Limiting<br/>Request Validation]
        end
        
        subgraph Compute["Compute Layer"]
            Lambda[Lambda Functions<br/>Isolated Execution<br/>No Inbound Access]
        end
        
        subgraph IAM["Identity & Access"]
            Role1[Lambda Execution Role<br/>bedrock:InvokeModel<br/>s3:GetObject/PutObject<br/>logs:CreateLogGroup]
        end
        
        subgraph Services["Service Layer"]
            Bedrock[Amazon Bedrock<br/>IAM-based Access]
            S3[S3 Bucket<br/>Private<br/>IAM-based Access]
        end
        
        subgraph Monitoring["Audit & Monitoring"]
            CW[CloudWatch Logs<br/>Encrypted at Rest]
            CT[CloudTrail<br/>API Audit Logs]
        end
    end
    
    User -->|HTTPS Only| CF
    CF --> APIGW
    APIGW -->|Invoke| Lambda
    Lambda -.Assumes.-> Role1
    Role1 -.Grants Access.-> Bedrock
    Role1 -.Grants Access.-> S3
    
    Lambda -.Logs.-> CW
    APIGW -.Logs.-> CW
    APIGW -.Audit.-> CT
    Lambda -.Audit.-> CT
    
    style Role1 fill:#ff9999
    style CF fill:#99ff99
    style CW fill:#9999ff
    style CT fill:#9999ff
```


## 6. Cost Breakdown (Mermaid)

```mermaid
pie title Monthly Cost Breakdown (1000 users, 10 requests each)
    "Amazon Bedrock (Claude)" : 60
    "AWS Amplify Hosting" : 15
    "Lambda Compute" : 0.10
    "API Gateway" : 0.04
    "S3 Storage" : 0.05
    "CloudWatch" : 0.50
```

## 7. User Workflow (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Search: User Opens App
    
    Search --> Intake: Select/Create Profile
    
    Intake --> Resources: Click "Retrieve Resources"
    
    state Resources {
        [*] --> Loading: API Call to Bedrock
        Loading --> Display: 12 Resources Returned
        Display --> Selection: User Selects Resources
    }
    
    Resources --> Draft: Click "Generate Response Kit"
    
    state Draft {
        [*] --> Generating: API Call to Bedrock
        Generating --> Editing: Draft Returned
        Editing --> Copying: User Edits Blocks
        Copying --> [*]: Copy to Clipboard
    }
    
    Draft --> Search: Start New Case
    Draft --> [*]: Complete
```


## 8. Network Diagram (Mermaid)

```mermaid
graph TB
    subgraph Public["Public Internet"]
        Users[Users Worldwide]
    end
    
    subgraph AWS["AWS Cloud - Region: us-east-1"]
        subgraph AZ1["Availability Zone 1"]
            CF1[CloudFront Edge<br/>Location 1]
            Lambda1[Lambda Instance 1]
        end
        
        subgraph AZ2["Availability Zone 2"]
            CF2[CloudFront Edge<br/>Location 2]
            Lambda2[Lambda Instance 2]
        end
        
        subgraph Regional["Regional Services"]
            APIGW[API Gateway<br/>Regional Endpoint]
            S3Bucket[S3 Bucket<br/>Multi-AZ Replication]
            Bedrock[Bedrock<br/>Regional Service]
        end
        
        subgraph Global["Global Services"]
            CFDist[CloudFront<br/>Distribution]
            IAM[IAM<br/>Global]
            Route53[Route 53<br/>DNS]
        end
    end
    
    Users -->|DNS Query| Route53
    Route53 -->|Resolve| CFDist
    Users -->|HTTPS| CF1
    Users -->|HTTPS| CF2
    
    CF1 --> APIGW
    CF2 --> APIGW
    
    APIGW --> Lambda1
    APIGW --> Lambda2
    
    Lambda1 --> Bedrock
    Lambda2 --> Bedrock
    Lambda1 --> S3Bucket
    Lambda2 --> S3Bucket
    
    Lambda1 -.Auth.-> IAM
    Lambda2 -.Auth.-> IAM
```


## How to View These Diagrams

### GitHub
These Mermaid diagrams render automatically on GitHub. Just view this file in your repository.

### VS Code
Install the "Markdown Preview Mermaid Support" extension:
```bash
code --install-extension bierner.markdown-mermaid
```

### Online Viewers
- **Mermaid Live Editor**: https://mermaid.live/
- **GitHub Gist**: Create a gist with this file
- **GitLab**: Supports Mermaid natively

### Export as Images
Use the Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i architecture-diagram.mmd -o architecture-diagram.png
```

### Documentation Sites
These diagrams work in:
- **Docusaurus**
- **MkDocs** (with plugin)
- **GitBook**
- **Notion** (paste Mermaid code)
- **Confluence** (with Mermaid plugin)

## Diagram Files

- `VISUAL-ARCHITECTURE.md` - This file (all diagrams)
- `architecture-diagram.mmd` - Standalone Mermaid file
- `ARCHITECTURE-DIAGRAM.md` - ASCII art version

## Legend

| Symbol | Meaning |
|--------|---------|
| Solid Arrow (→) | Direct connection/data flow |
| Dotted Arrow (-.→) | Monitoring/logging/auth |
| Subgraph | Logical grouping of components |
| 🖥️ 📱 | User devices |
| 🌐 | CDN/Global services |
| 🔌 | API endpoints |
| ⚡ | Compute services |
| 🤖 | AI services |
| 💾 | Storage services |
| 📊 | Monitoring services |
| 🔒 | Security services |

## How to View These Diagrams

### GitHub
All Mermaid diagrams render automatically when viewing this file on GitHub.

### VS Code
Install the "Markdown Preview Mermaid Support" extension to view diagrams in preview mode.

### Other Tools
- **Mermaid Live Editor**: https://mermaid.live/
- **Draw.io**: Import the .mmd file
- **Notion**: Supports Mermaid diagrams
- **Confluence**: Use Mermaid macro

## Diagram Files

- `VISUAL-ARCHITECTURE.md` - This file (Mermaid diagrams)
- `architecture-diagram.mmd` - Standalone Mermaid file
- `ARCHITECTURE-DIAGRAM.md` - ASCII art diagrams
- `ARCHITECTURE.md` - Detailed text documentation

## Legend

| Symbol | Meaning |
|--------|---------|
| → | Direct connection/flow |
| -.-> | Indirect/monitoring connection |
| Solid box | AWS Service |
| Dashed box | Logical grouping |
| 🖥️ | User interface |
| ⚡ | Compute service |
| 🤖 | AI service |
| 💾 | Storage service |
| 🔒 | Security component |
| 📊 | Monitoring component |

## Architecture Principles

1. **Serverless First**: No servers to manage, auto-scaling
2. **Security by Design**: IAM roles, no exposed credentials
3. **Cost Optimized**: Pay-per-use, no idle resources
4. **Highly Available**: Multi-AZ deployment, managed services
5. **Observable**: CloudWatch logging and monitoring throughout
6. **Scalable**: Handles 1 to 10,000+ concurrent users

## Key Metrics

| Metric | Value |
|--------|-------|
| **Latency** | 2-5 seconds (AI processing) |
| **Availability** | 99.95% (AWS SLA) |
| **Scalability** | Unlimited concurrent users |
| **Cost** | $75/month for 10K requests |
| **Regions** | Single region (expandable) |
| **Cold Start** | 1-2 seconds (Lambda) |

## Related Documentation

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
