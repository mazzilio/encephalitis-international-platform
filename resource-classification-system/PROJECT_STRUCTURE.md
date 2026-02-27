# Project Structure

Clean, organized structure ready for deployment.

## Root Directory

```
resource-classification-system/
├── README.md                          # Main project overview
├── HACKATHON.md                       # Hackathon submission
├── PROJECT_STRUCTURE.md               # This file
├── requirements.txt                   # Python dependencies
├── package-lock.json                  # Node.js dependencies
├── .gitignore                         # Git ignore rules
```

**Purpose**: Essential project files only. Clean and professional.

## Processing Scripts

```
processing/
├── README.md                          # Processing documentation
├── process_all_resources.py           # Main batch pipeline (1,255 resources)
├── process_live_resources.py          # Live processing
└── run_resilient.sh                   # Resilient wrapper script
```

**Purpose**: All processing scripts in one place. Easy to find and run.

**Usage**:
```bash
./processing/run_resilient.sh process_all_resources.py --test
```

## Monitoring Tools

```
monitoring/
├── README.md                          # Monitoring documentation
├── monitoring_server_enhanced.py      # Real-time dashboard
└── test_monitoring_demo.py            # Demo script
```

**Purpose**: Real-time monitoring and progress tracking.

**Usage**:
```bash
python3 monitoring/monitoring_server_enhanced.py
# Open http://localhost:5000
```

## Core Scripts

```
scripts/
├── __init__.py
├── bedrock_tag_refinement_prompt.py   # AI classification logic
├── excel_processor.py                 # Excel file handling
├── upload_to_dynamodb.py              # DynamoDB upload
├── create_knowledge_base.py           # Knowledge base setup
└── query_knowledge_base.py            # Semantic search
```

**Purpose**: Reusable modules used by processing scripts.

## Documentation

```
docs/
├── README.md                          # Documentation index
├── DEPLOYMENT.md                      # Deployment guide
├── DEPLOYMENT_CHECKLIST.md            # Deployment checklist
├── USER_GUIDE.md                      # User guide
├── TECHNICAL.md                       # Technical reference
│
├── charity/                           # For charity staff
│   └── STAFF_GUIDE.md                 # Simple, non-technical guide
│
├── deployment/                        # Deployment guides
│   ├── QUICK_START.md                 # 5-minute quick start
│   ├── PROCESSING_GUIDE.md            # Processing details
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
    └── CHANGELOG.md                   # Project changelog and milestones
```

**Purpose**: Comprehensive documentation organized by audience and purpose.

**Key Documents**:
- **Charity Staff**: `docs/charity/STAFF_GUIDE.md`
- **Quick Start**: `docs/deployment/QUICK_START.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Technical**: `docs/TECHNICAL.md`

## Data

```
data/
├── README.md                          # Data documentation
├── Live chat crib sheet.xlsx          # Staff crib sheet (697 items)
├── Encephalitis orgs, centres and country contacts.xlsx  # Contacts (133 items)
└── cached/                            # Cached web scraper data (425 items from sitemap)
```

**Purpose**: Input data for classification. Excel files with sensitive data are gitignored.

## Output

```
output/
├── .gitkeep                           # Keep directory in git
├── encephalitis_content_database.json # Complete results for Bedrock KB
├── dynamodb_resources.json            # DynamoDB format
└── classified_resources_for_charity.xlsx   # Excel for staff (6 sheets)
```

**Purpose**: Processing outputs. Large files are gitignored.

## Logs

```
logs/
├── .gitkeep                           # Keep directory in git
├── classification_*.log               # Processing logs
└── nohup.out                          # Background process output
```

**Purpose**: All log files in one place. Gitignored but directory tracked.

## Temporary Files

```
temp/
├── .gitkeep                           # Keep directory in git
├── classification.pid                 # Process ID file
└── progress_checkpoint.json           # Auto-save checkpoint
```

**Purpose**: Temporary files for processing. Gitignored but directory tracked.

## Web Scraper

```
web-scraper/
├── README.md                          # Web scraper overview
├── ADAPTIVE_CLASSIFICATION.md         # Adaptive learning
├── TAG_DISCOVERY.md                   # Gap analysis
│
├── frontend/                          # React UI
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/                           # Lambda functions
│   ├── scraper/
│   ├── classifier/
│   └── aggregator/
│
├── infrastructure/                    # AWS CDK
│   ├── lib/
│   ├── bin/
│   └── cdk.json
│
├── shared/                            # Shared utilities
│   └── types/
│
└── docs/                              # Web scraper docs
    ├── DEPLOYMENT.md
    ├── API.md
    └── ARCHITECTURE.md
```

**Purpose**: Real-time web scraping and classification component.

## Utilities

```
excel_anonymizers/
├── README.md                          # Anonymizer documentation
└── anonymize_excel.py                 # Excel anonymization script
```

**Purpose**: Utility scripts for data anonymization.

---

## Benefits of New Structure

### 1. Clean Root Directory
- Only 3 markdown files (README, HACKATHON, PROJECT_STRUCTURE)
- Essential config files only
- Professional appearance

### 2. Clear Organization
- Processing scripts in `processing/`
- Monitoring tools in `monitoring/`
- Documentation in `docs/` with subdirectories
- Logs in `logs/`
- Temporary files in `temp/`

### 3. Separation of Concerns
- **Charity staff**: `docs/charity/`
- **Developers**: `docs/technical/`
- **Deployment**: `docs/deployment/`
- **Features**: `docs/features/`
- **History**: `docs/changelog/`

### 4. Easy Navigation
- README files in each directory
- Clear naming conventions
- Logical grouping

### 5. Git-Friendly
- Proper .gitignore for temp files
- .gitkeep for empty directories
- No sensitive data tracked

### 6. Deployment Ready
- Clear structure for production
- Easy to understand for new developers
- Professional for hackathon judges

---

## Quick Navigation

### For Charity Staff
Start here: `docs/charity/STAFF_GUIDE.md`

### For Developers
1. `README.md` - Overview
2. `docs/deployment/QUICK_START.md` - Get started
3. `docs/DEPLOYMENT.md` - Full deployment
4. `docs/TECHNICAL.md` - Technical details

### For Hackathon Judges
1. `HACKATHON.md` - Submission
2. `README.md` - Overview
3. `docs/technical/AWS_ARCHITECTURE.md` - AWS architecture
4. `PROJECT_STRUCTURE.md` - This file

### For Running Processing
```bash
# Test run
./processing/run_resilient.sh process_all_resources.py --test

# Production run
./processing/run_resilient.sh process_all_resources.py

# Monitor
tail -f logs/classification_*.log
```

---

**Last Updated**: January 14, 2026  
**Status**: ✅ Clean and deployment-ready
