# Resource Processing Guide

This guide explains the two processing scripts and when to use each one.

> **Important**: All processing uses **resilient mode by default** with automatic progress saving, network retry logic, and resume capability. This is the standard for the project.

---

## Two Processing Options

### 1. process_all_resources.py (Cached Data) - RECOMMENDED

**Use when**: You want to reclassify existing web scraper data without re-scraping

**Advantages**:
- ✅ **Faster** - No web scraping time
- ✅ **Cheaper** - Only classification API calls
- ✅ **No rate limits** - No web scraping requests
- ✅ **Consistent** - Uses same data for comparison
- ✅ **Resilient** - Auto-saves progress, survives disconnections

**Use cases**:
- Reclassifying resources with updated taxonomy
- Testing new classification prompts
- Comparing different model outputs
- Processing when you already have scraped data

**Command (Resilient - Recommended)**:
```bash
# Test mode (5 items per source)
./run_resilient.sh process_all_resources.py --test

# Production mode (all items)
./run_resilient.sh process_all_resources.py

# Monitor progress
tail -f classification_*.log
```

**Command (Direct - Advanced Users Only)**:
```bash
# Test mode (5 items per source) - still has auto-resume
python3 process_all_resources.py --test

# Production mode (all items) - still has auto-resume
python3 process_all_resources.py
```

**Data source**: Uses cached file `../Web-Scraper/encephalitis_content_database_WIP.json`

> **Note**: Even direct Python execution includes auto-save and resume features. The resilient runner adds background execution and terminal disconnection survival.

---

### 2. process_live_resources.py (Live Scraping)

**Use when**: You want fresh, current data from the website

**Advantages**:
- ✅ **Current data** - Gets latest content from website
- ✅ **Complete** - Scrapes all pages from sitemap
- ✅ **Flexible** - Can use cached or live data
- ✅ **Up-to-date** - Reflects current website state
- ✅ **Resilient** - Auto-saves progress, survives disconnections

**Use cases**:
- Initial data collection
- Updating with new website content
- Discovering new resources
- Regular scheduled updates

**Commands (Resilient - Recommended)**:

```bash
# Test mode with live scraping (5 items per source)
./run_resilient.sh process_live_resources.py --test

# Test mode with cached data (faster)
./run_resilient.sh process_live_resources.py --test --cached

# Production mode with live scraping (all items)
./run_resilient.sh process_live_resources.py

# Production mode with cached data
./run_resilient.sh process_live_resources.py --cached

# Monitor progress
tail -f classification_*.log
```

**Commands (Direct - Advanced Users Only)**:

```bash
# Test mode with live scraping (5 items per source)
python3 process_live_resources.py --test

# Test mode with cached data (faster)
python3 process_live_resources.py --test --cached

# Production mode with live scraping (all items)
python3 process_live_resources.py

# Production mode with cached data
python3 process_live_resources.py --cached

# Use specific cached file
python3 process_live_resources.py --cached path/to/cached_data.json
```

**Data source**: 
- Live: Scrapes from https://www.encephalitis.info/sitemap.xml
- Cached: Uses specified file or default `../Web-Scraper/encephalitis_content_database_WIP.json`

---

## Comparison

| Feature | process_all_resources.py | process_live_resources.py |
|---------|-------------------------|---------------------------|
| **Web scraping** | ❌ No (uses cached) | ✅ Yes (optional) |
| **Speed** | ⚡ Fast | 🐢 Slower (if scraping) |
| **Cost** | 💰 Lower | 💰💰 Higher (if scraping) |
| **Data freshness** | 📅 Cached | 🆕 Current |
| **Rate limits** | ✅ No concern | ⚠️ Respects limits |
| **Use case** | Reclassification | Initial/updates |
| **Model** | Claude Opus 4.5 | Claude Opus 4.5 |
| **Resilience** | ✅ Auto-save/resume | ✅ Auto-save/resume |
| **Background mode** | ✅ With run_resilient.sh | ✅ With run_resilient.sh |

> **Note**: Both scripts include built-in resilience features (auto-save every 5 items, auto-resume, network retry). Using `run_resilient.sh` adds background execution and terminal disconnection survival.

---

## Processing Flow

### process_all_resources.py

```
1. Load cached web scraper JSON
   ↓
2. Load Excel files (crib sheet, contacts)
   ↓
3. Classify all with Claude Opus 4.5
   ↓
4. Generate outputs (JSON, DynamoDB JSON, Excel)
```

**Time estimate**: 
- Test (15 items): ~4-5 minutes
- Production (1,255 items): ~7 hours

**Cost estimate**:
- Test: ~£0.24
- Production: ~£174-182

---

### process_live_resources.py (Live Mode)

```
1. Fetch sitemap from website
   ↓
2. Scrape content from URLs (with rate limiting)
   ↓
3. Load Excel files (crib sheet, contacts)
   ↓
4. Classify all with Claude Opus 4.5
   ↓
5. Generate outputs (JSON, DynamoDB JSON, Excel)
```

**Time estimate**:
- Test (15 items): ~6-8 minutes (includes scraping)
- Production (1,255 items): ~8-9 hours (includes scraping)

**Cost estimate**:
- Test: ~£0.24
- Production: ~£174-182

---

### process_live_resources.py (Cached Mode)

```
1. Load cached web scraper JSON
   ↓
2. Load Excel files (crib sheet, contacts)
   ↓
3. Classify all with Claude Opus 4.5
   ↓
4. Generate outputs (JSON, DynamoDB JSON, Excel)
```

**Same as process_all_resources.py** - identical performance

---

## When to Use Each

### Use process_all_resources.py when:

1. **Reclassifying existing data**
   - You've updated the tag taxonomy
   - You want to test new prompts
   - You're comparing model outputs

2. **You have cached data**
   - Web scraper JSON file exists
   - Data is recent enough
   - No new content on website

3. **Speed is priority**
   - Need results quickly
   - Testing classification logic
   - Iterating on prompts

4. **Cost optimization**
   - Want to minimize API calls
   - Already paid for scraping
   - Budget constraints

---

### Use process_live_resources.py when:

1. **Need fresh data**
   - Website has new content
   - Initial data collection
   - Regular scheduled updates

2. **Complete coverage**
   - Want all current pages
   - Discovering new resources
   - Comprehensive update

3. **Flexibility needed**
   - May use cached or live
   - Testing both modes
   - Comparing old vs new

4. **Production deployment**
   - Automated scheduled runs
   - CI/CD pipeline
   - Regular updates

---

## Output Files

Both scripts generate identical output files:

### 1. encephalitis_content_database.json
Complete results with original and refined data for all items. Primary file for Bedrock Knowledge Base integration.

### 2. dynamodb_resources.json
DynamoDB-ready format for web app queries.

### 3. classified_resources_for_charity.xlsx
Excel file with 5 sheets:
- All Resources
- By Persona (Patient, Caregiver, Parent, Professional, Bereaved)
- Statistics

---

## Examples

### Example 1: Initial Classification (Recommended Approach)

```bash
# First time - test with resilient mode
./run_resilient.sh process_live_resources.py --test

# Monitor progress
tail -f classification_*.log

# Review results in output/
ls -la output/

# If good, run full production with resilient mode
./run_resilient.sh process_live_resources.py

# Can disconnect - process continues in background
# Reconnect later to check progress
tail -f classification_*.log
```

---

### Example 2: Reclassification After Taxonomy Update (Recommended Approach)

```bash
# Updated tag taxonomy in prompts
# Reclassify using cached data with resilient mode (faster, cheaper)
./run_resilient.sh process_all_resources.py --test

# Monitor progress
tail -f classification_*.log

# Review results
# If improved, run full reclassification
./run_resilient.sh process_all_resources.py

# Can safely disconnect - progress is saved
```

---

### Example 3: Weekly Updates (Recommended Approach)

```bash
# Week 1: Initial scrape with resilient mode
./run_resilient.sh process_live_resources.py

# Week 2: Reclassify with cached data (no new content)
./run_resilient.sh process_all_resources.py

# Week 3: Check for new content
./run_resilient.sh process_live_resources.py --test

# If new content found, run full scrape
./run_resilient.sh process_live_resources.py
```

---

### Example 4: Testing Classification Changes

```bash
# Test with cached data using resilient mode (fast iteration)
./run_resilient.sh process_live_resources.py --test --cached

# Or use the dedicated cached script
./run_resilient.sh process_all_resources.py --test

# Compare results
diff output/encephalitis_content_database.json output_previous/encephalitis_content_database.json
```

---

### Example 5: Recovering from Interruption

```bash
# Start processing
./processing/run_resilient.sh process_all_resources.py

# Network disconnects or terminal closes at item 600/1,255
# ... connection lost ...

# Reconnect and check progress
cat progress_checkpoint_cached.json | grep last_processed
# Output: "last_processed": 2000

# Resume - automatically continues from item 2,001
./run_resilient.sh process_all_resources.py

# Or just run the script directly (also resumes)
python3 process_all_resources.py
```

---

## Best Practices

### 1. Always Use Resilient Mode for Production

```bash
# RECOMMENDED: Use resilient runner
./run_resilient.sh process_all_resources.py --test

# Advanced users only: Direct execution (still has auto-resume)
python3 process_all_resources.py --test
```

### 2. Always Test First

```bash
# Test before production
./run_resilient.sh process_all_resources.py --test
# or
./run_resilient.sh process_live_resources.py --test
```

### 3. Monitor Progress

```bash
# Watch live progress
tail -f classification_*.log

# Check checkpoint status
cat progress_checkpoint_cached.json | grep last_processed

# Check if process is running
ps aux | grep process_all_resources
```

### 4. Use Cached Data for Iteration

When testing prompts or taxonomy changes:
```bash
# Fast iteration with cached data
./run_resilient.sh process_all_resources.py --test
```

### 5. Schedule Live Scraping with Resilient Mode

For production:
```bash
# Weekly cron job with resilient mode
0 2 * * 0 cd /path/to/project && ./run_resilient.sh process_live_resources.py
```

### 6. Monitor Costs

```bash
# Test mode first to estimate costs
./run_resilient.sh process_live_resources.py --test
# Check AWS billing before full run
```

### 7. Save Outputs

```bash
# Backup previous results
mv Output Output_$(date +%Y%m%d)
# Run new classification
./run_resilient.sh process_all_resources.py
```

### 8. Handle Long-Running Processes

```bash
# Start process in background
./run_resilient.sh process_all_resources.py

# Disconnect safely (process continues)
exit

# Reconnect later and check progress
ssh your-server
tail -f classification_*.log
```

---

## Troubleshooting

### "No cached file found"

```bash
# Check file exists
ls -la ../Web-Scraper/encephalitis_content_database_WIP.json

# Or specify custom path
python3 process_live_resources.py --cached path/to/file.json
```

### "Rate limit exceeded"

```bash
# Use cached mode instead
python3 process_live_resources.py --cached

# Or use dedicated cached script
python3 process_all_resources.py
```

### "Model not available"

Both scripts use: `global.anthropic.claude-opus-4-5-20251101-v1:0`

Check AWS Bedrock model access in your region.

---

## Summary

**Quick Decision Guide**:

- 🔄 **Reclassifying?** → `./run_resilient.sh process_all_resources.py`
- 🆕 **Need fresh data?** → `./run_resilient.sh process_live_resources.py`
- ⚡ **Want speed?** → `./run_resilient.sh process_all_resources.py`
- 💰 **Minimize cost?** → `./run_resilient.sh process_all_resources.py`
- 🎯 **Testing prompts?** → `./run_resilient.sh process_all_resources.py --test`
- 📅 **Regular updates?** → `./run_resilient.sh process_live_resources.py` (scheduled)
- 🛡️ **Long processing?** → Always use `./run_resilient.sh` (auto-save, survives disconnections)

**Resilient Mode Benefits**:
- ✅ Auto-saves progress every 5 items
- ✅ Auto-resumes from last checkpoint
- ✅ Network retry logic (3 attempts with backoff)
- ✅ Survives terminal disconnections
- ✅ Background execution with nohup
- ✅ Real-time progress monitoring

Both scripts use the same Claude Opus 4.5 model and generate identical output formats!

**See [RESILIENT_PROCESSING.md](RESILIENT_PROCESSING.md) for complete resilient processing documentation.**

---

**Last Updated**: January 14, 2026  
**Version**: 2.0 (Resilient Processing Standard)
