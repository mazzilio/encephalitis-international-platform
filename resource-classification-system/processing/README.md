# Processing Scripts

This directory contains the main processing scripts for the resource classification system.

---

## Quick Decision Guide

**Which script should I use?**

- ✅ **Want to classify all 1,255 resources?** → Use `process_live_resources.py`
- ✅ **Testing or reclassifying with cached data?** → Use `process_all_resources.py`
- ✅ **First time running?** → Start with test mode: `./run_resilient.sh process_live_resources.py --test`

---

## Scripts

### process_live_resources.py ⭐ RECOMMENDED
**Main script for full resource classification** (1,255 items).

Scrapes live content from sitemap (425 URLs) and processes Excel files (830 items).

**Usage**:
```bash
# Test mode (5 items per source) - ALWAYS START HERE
./run_resilient.sh process_live_resources.py --test

# Production mode (all 1,255 resources with live scraping)
./run_resilient.sh process_live_resources.py

# Use cached data instead of live scraping (faster, for testing)
./run_resilient.sh process_live_resources.py --cached
```

**When to use:**
- Initial classification of complete dataset
- Getting fresh, current data from website
- Production deployment

**Time**: ~7 hours | **Cost**: ~£174-182 | **Value**: £2,950+ saved vs manual

---

### process_all_resources.py
Alternative script using cached web data (1,003 items - faster but not complete dataset).

Uses pre-scraped cached data instead of live sitemap scraping.

**Usage**:
```bash
# Test mode (5 items per source)
./run_resilient.sh process_all_resources.py --test

# Production mode (cached data only - 1,003 items)
./run_resilient.sh process_all_resources.py
```

**When to use:**
- Reclassifying with updated taxonomy
- Testing classification prompts
- Faster iteration during development

**Time**: ~5.5 hours | **Cost**: ~£139-146

---

### run_resilient.sh
Resilient wrapper script that provides:
- ✅ Auto-save progress every 5 items
- ✅ Auto-resume from last checkpoint
- ✅ Survives network disconnections
- ✅ Background processing with nohup
- ✅ Network retry logic (3 attempts)

**Always use this wrapper for production runs!**

---

## Output Locations

- **Logs**: `logs/classification_*.log`
- **Checkpoints**: `temp/progress_checkpoint.json`
- **PID files**: `temp/classification.pid`
- **Results**: `output/`

---

## Documentation

- **[Quick Start Guide](../docs/deployment/QUICK_START.md)** - Get started in 5 minutes
- **[Processing Guide](../docs/deployment/PROCESSING_GUIDE.md)** - Detailed comparison of scripts
- **[Deployment Guide](../docs/DEPLOYMENT.md)** - Complete deployment instructions

---

## Common Commands

```bash
# Start processing (recommended)
./run_resilient.sh process_live_resources.py

# Monitor progress
tail -f logs/classification_*.log

# Check if running
ps aux | grep process_live_resources

# Resume after interruption (just run again)
./run_resilient.sh process_live_resources.py
```
