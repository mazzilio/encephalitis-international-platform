# Quick Start Guide - Resilient Processing

**Get started with resilient processing in 5 minutes**

---

## Prerequisites

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set AWS credentials
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_SESSION_TOKEN="your_token"
export AWS_DEFAULT_REGION="us-west-2"
```

---

## Test Run (5 minutes)

```bash
# Run test with 5 items per source (15 total)
./run_resilient.sh process_all_resources.py --test

# Monitor progress (optional)
tail -f classification_*.log
```

**Expected**: 15 items processed, 3 output files created, ~5 minutes

---

## Production Run (~7 hours)

```bash
# Process all 1,255 resources (live scraping from sitemap)
./processing/run_resilient.sh process_live_resources.py

# Monitor progress (optional - can disconnect)
tail -f logs/classification_*.log

# Disconnect safely - process continues in background
exit
```

**Expected**: 1,255 items processed, ~7 hours, ~£174-182

**Alternative (cached data - 1,003 items)**:
```bash
./processing/run_resilient.sh process_all_resources.py
```

---

## Key Commands

### Start Processing
```bash
# Test mode
./run_resilient.sh process_all_resources.py --test

# Production mode
./run_resilient.sh process_all_resources.py
```

### Monitor Progress
```bash
# View live log
tail -f classification_*.log

# Check progress
cat progress_checkpoint_cached.json | grep last_processed

# Check if running
ps aux | grep process_all_resources
```

### Resume After Interruption
```bash
# Just run the same command again - it will resume automatically
./run_resilient.sh process_all_resources.py
```

### Stop Processing
```bash
# Graceful stop
kill $(cat classification.pid)

# Force stop
kill -9 $(cat classification.pid)
```

---

## What You Get

### Resilient Features (Built-in)
- ✅ Auto-saves progress every 5 items
- ✅ Auto-resumes from last checkpoint
- ✅ Network retry logic (3 attempts)
- ✅ Survives terminal disconnections
- ✅ Background execution
- ✅ Real-time progress monitoring

### Output Files
1. **encephalitis_content_database.json** - Complete results for Bedrock Knowledge Base
2. **dynamodb_resources.json** - DynamoDB format
3. **classified_resources_for_charity.xlsx** - Excel with 5 sheets

---

## Common Scenarios

### Scenario 1: Network Disconnects
**What happens**: Progress saved, automatic retry, continues processing  
**What to do**: Nothing - it handles it automatically

### Scenario 2: Terminal Closes
**What happens**: Process continues in background  
**What to do**: Reconnect and check progress with `tail -f classification_*.log`

### Scenario 3: Process Crashes
**What happens**: Progress saved up to last checkpoint (max 4 items lost)  
**What to do**: Run the same command again - it will resume

### Scenario 4: Want to Stop
**What happens**: Graceful shutdown, progress saved  
**What to do**: `kill $(cat classification.pid)`

---

## Troubleshooting

### "AWS credentials not found"
```bash
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_SESSION_TOKEN="your_token"
```

### "Process already running"
```bash
# Check status
ps -p $(cat classification.pid)

# Stop it
kill $(cat classification.pid)

# Or force stop
kill -9 $(cat classification.pid)
```

### "Want to start fresh"
```bash
# Remove checkpoint
rm progress_checkpoint_cached.json

# Run again
./run_resilient.sh process_all_resources.py
```

---

## Next Steps

1. ✅ Run test mode successfully
2. ✅ Review output files
3. ✅ Run production mode
4. ✅ Upload to DynamoDB: `python scripts/upload_to_dynamodb.py`
5. ✅ Deploy web scraper (see web-scraper/docs/DEPLOYMENT.md)

---

## Optional: Live Monitoring Dashboard

Want to see real-time progress with charts and statistics?

```bash
# Terminal 1: Start monitoring server
python3 monitoring_server.py

# Terminal 2: Run processing
./run_resilient.sh process_all_resources.py

# Browser: Open http://localhost:5000
```

**Features:**
- Real-time progress tracking
- Live statistics and charts
- Error monitoring
- Auto-refresh every 2 seconds

See [LIVE_MONITORING.md](LIVE_MONITORING.md) for complete documentation.

---

## Full Documentation

- **[PROCESSING_GUIDE.md](PROCESSING_GUIDE.md)** - Complete processing guide
- **[RESILIENT_PROCESSING.md](RESILIENT_PROCESSING.md)** - Detailed resilient mode docs
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Full deployment guide

---

**That's it!** You're now running resilient processing. The system will handle interruptions, save progress, and retry on errors automatically.

**Last Updated**: January 14, 2026
