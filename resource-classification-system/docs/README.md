# Documentation Index

Complete documentation for the Encephalitis International Resource Classification System.

---

## Quick Links

### Getting Started
- **[Main README](../README.md)** - Project overview and quick start
- **[Quick Start Guide](deployment/QUICK_START.md)** - Get started in 5 minutes
- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[User Guide](USER_GUIDE.md)** - Detailed guide for charity staff and volunteers

### For Charity Staff
- **[Staff Guide](charity/STAFF_GUIDE.md)** - Simple, non-technical guide for charity staff

### Technical Documentation
- **[Technical Guide](TECHNICAL.md)** - Architecture, API reference, and implementation details
- **[AWS Architecture](technical/AWS_ARCHITECTURE.md)** - Complete AWS architecture documentation
- **[Error Handling Guide](technical/ERROR_HANDLING_GUIDE.md)** - Error handling patterns
- **[Knowledge Base Integration](technical/KNOWLEDGE_BASE_INTEGRATION.md)** - Vector search setup

### Deployment & Processing
- **[Quick Start Guide](deployment/QUICK_START.md)** - Get started in 5 minutes
- **[Processing Guide](deployment/PROCESSING_GUIDE.md)** - Processing scripts and options
- **[Resilient Processing](deployment/RESILIENT_PROCESSING.md)** - Auto-save, resume, and retry features

### Features
- **[Live Monitoring](features/LIVE_MONITORING.md)** - Real-time dashboard for progress tracking
- **[Knowledge Base Quickstart](features/KNOWLEDGE_BASE_QUICKSTART.md)** - Semantic search guide
- **[LLM Classification](features/LLM_CLASSIFICATION_SUMMARY.md)** - Classification system details

### Changelog & History
- **[Changelog](changelog/CHANGELOG.md)** - Development history and milestones

### Hackathon
- **[Hackathon Submission](../HACKATHON.md)** - Breaking Barriers criteria alignment

### Web Scraper
- **[Web Scraper README](../web-scraper/README.md)** - Real-time component overview
- **[Web Scraper Deployment](../web-scraper/docs/DEPLOYMENT.md)** - Deploy the web scraper
- **[Adaptive Classification](../web-scraper/ADAPTIVE_CLASSIFICATION.md)** - How the system learns
- **[Tag Discovery](../web-scraper/TAG_DISCOVERY.md)** - Gap analysis and taxonomy evolution

---

## Documentation Structure

```
docs/
├── README.md                          # This file
├── DEPLOYMENT.md                      # Complete deployment guide
├── USER_GUIDE.md                      # Guide for charity staff
├── TECHNICAL.md                       # Technical reference
│
├── charity/                           # For charity staff
│   └── STAFF_GUIDE.md                 # Simple, non-technical guide
│
├── deployment/                        # Deployment guides
│   ├── QUICK_START.md                 # 5-minute quick start
│   ├── PROCESSING_GUIDE.md            # Processing scripts
│   └── RESILIENT_PROCESSING.md        # Auto-save and resume
│
├── technical/                         # Technical documentation
│   ├── AWS_ARCHITECTURE.md            # AWS architecture
│   ├── ERROR_HANDLING_GUIDE.md        # Error handling
│   └── KNOWLEDGE_BASE_INTEGRATION.md  # Vector search
│
├── features/                          # Feature documentation
│   ├── LIVE_MONITORING.md             # Monitoring dashboard
│   ├── KNOWLEDGE_BASE_QUICKSTART.md   # Semantic search
│   └── LLM_CLASSIFICATION_SUMMARY.md  # Classification details
│
└── changelog/                         # Development history
    └── CHANGELOG.md                   # Project changelog
```

---

## For Different Audiences

### For Charity Staff (Non-Technical)
1. Start with [Staff Guide](charity/STAFF_GUIDE.md) - Simple, practical guide
2. Understand the tag system
3. Learn common scenarios
4. Practice with test data

### For Developers
1. Start with [Main README](../README.md)
2. Review [AWS Architecture](technical/AWS_ARCHITECTURE.md)
3. Review [Technical Guide](TECHNICAL.md)
4. Follow [Deployment Guide](DEPLOYMENT.md)
5. Check [Web Scraper Docs](../web-scraper/docs/)

### For Hackathon Judges
1. Review [Hackathon Submission](../HACKATHON.md)
2. Check [Main README](../README.md) for overview
3. See [AWS Architecture](technical/AWS_ARCHITECTURE.md) for AWS services and best practices
4. See [Technical Guide](TECHNICAL.md) for implementation
5. Review [Adaptive Classification](../web-scraper/ADAPTIVE_CLASSIFICATION.md) for innovation

---

## Key Concepts

### Classification System
- 100+ tag categories for precise classification
- Confidence scoring for transparency
- Staff guidance for practical use
- Adaptive learning for continuous improvement

### Components
- **Batch Processing**: Process existing resources (1,255 items)
- **Real-Time Web Scraper**: Continuously discover and classify new content
- **Adaptive Learning**: Identify gaps and suggest new tags
- **Multiple Outputs**: DynamoDB, JSON, Excel

### Technology Stack
- AWS Bedrock (Claude Opus 4.5)
- AWS Lambda (serverless compute)
- Amazon DynamoDB (database)
- Amazon S3 (storage)
- AWS CDK (infrastructure as code)

---

## Support

For questions or issues:
- Check relevant documentation
- Review CloudWatch logs
- See troubleshooting sections
- Contact project maintainers

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
