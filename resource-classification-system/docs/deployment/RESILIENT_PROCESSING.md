# Resilient Processing Guide

This guide explains how to run the classification process in a way that survives network disconnections and terminal closures.

---

## Features

### ✅ Automatic Progress Saving
- Progress saved every 5 items
- Can resume from last checkpoint
- No work lost on disconnection

### ✅ Network Retry Logic
- Automatic retry on network errors
- Exponential backoff (1s, 2s, 4s)
- Up to 3 attempts per item

### ✅ Background Execution
- Runs in background with `nohup`
- Survives terminal disconnection
- Continues even if SSH session drops

### ✅ Progress Monitoring
- Real-time log file
- Checkpoint files
- PID tracking

---

## Quick Start

### Option 1: Using the Resilient Runner (Recommended)

```bash
# Test mode
./run_resilient.sh process_all_resources.py --test

# Production mode
./run_resilient.sh process_all_resources.py

# Live scraping (test)
./run_resilient.sh process_live_resources.py --test

# Live scraping (production)
./run_resilient.sh process_live_resources.py
```

### Option 2: Direct Python Execution

```bash
# Test mode with auto-resume
python3 process_all_resources.py --test

# Production mode with auto-resume
python3 process_all_resources.py

# If disconnected, just run again - it will resume!
```

---

## How It Works

### Progress Checkpoints

Both scripts automatically save progress to checkpoint files:

- **process_all_resources.py** → `progress_checkpoint_cached.json`
- **process_live_resources.py** → `progress_checkpoint.json`

**Checkpoint structure**:
```json
{
  "timestamp": "2026-01-14T21:45:00",
  "metadata": {
    "last_processed": 25,
    "total": 100,
    "type": "web_scraper"
  },
  "results": [...]
}
```

### Auto-Resume

When you restart a script:
1. Checks for checkpoint file
2. Loads previously processed items
3. Skips already completed work
4. Continues from where it left off

**Example**:
```bash
# Start processing
python3 process_all_resources.py

# Network disconnects at item 50/100
# ... connection lost ...

# Reconnect and run again
python3 process_all_resources.py

# Output:
# 📂 Resuming from checkpoint: 50 items already processed
# Processing 50 web scraper items (50 already done)...
```

### Network Retry Logic

Each classification attempt includes automatic retries:

```python
# Attempt 1: Immediate
# Attempt 2: Wait 1 second
# Attempt 3: Wait 2 seconds
# Attempt 4: Wait 4 seconds (if max_retries=4)
```

**Handles**:
- Network timeouts
- Connection errors
- Temporary AWS issues
- Rate limiting

---

## Monitoring Progress

### View Live Log

```bash
# If using resilient runner
tail -f classification_*.log

# Or check the latest log
tail -f $(ls -t classification_*.log | head -1)
```

### Check Checkpoint

```bash
# View progress
cat progress_checkpoint*.json | grep -A 3 metadata

# Or use jq for better formatting
cat progress_checkpoint_cached.json | jq '.metadata'
```

**Output**:
```json
{
  "last_processed": 75,
  "total": 100,
  "type": "web_scraper"
}
```

### Check Process Status

```bash
# If using resilient runner
cat classification.pid
ps -p $(cat classification.pid)

# Or find Python processes
ps aux | grep process_all_resources
```

---

## Handling Disconnections

### Scenario 1: Terminal Closes

**Using resilient runner**:
```bash
# Start process
./run_resilient.sh process_all_resources.py

# Terminal closes or SSH disconnects
# ... connection lost ...

# Reconnect and check status
ps aux | grep process_all_resources

# Monitor progress
tail -f classification_*.log
```

**Process continues running!** ✅

---

### Scenario 2: Network Interruption

**What happens**:
1. Classification attempt fails
2. Script waits 1 second
3. Retries classification
4. If still fails, waits 2 seconds
5. Retries again
6. If still fails, waits 4 seconds
7. Final retry
8. If all fail, saves progress and continues to next item

**You don't lose work!** ✅

---

### Scenario 3: Process Crashes

**What happens**:
1. Progress saved every 5 items
2. Last successful checkpoint preserved
3. Restart script to resume

```bash
# Check last checkpoint
cat progress_checkpoint_cached.json | jq '.metadata'

# Resume from checkpoint
python3 process_all_resources.py
```

**Maximum loss: 4 items** ✅

---

## Commands Reference

### Start Processing

```bash
# Cached data (fast, cheap)
./run_resilient.sh process_all_resources.py

# Live scraping (fresh data)
./run_resilient.sh process_live_resources.py

# Test mode (5 items per source)
./run_resilient.sh process_all_resources.py --test
```

### Monitor Progress

```bash
# View live log
tail -f classification_*.log

# View last 50 lines
tail -50 classification_*.log

# Search for errors
grep -i error classification_*.log

# Count completed items
grep "✓" classification_*.log | wc -l
```

### Check Status

```bash
# Check if running
ps aux | grep "process_all_resources\|process_live_resources"

# Check PID
cat classification.pid

# Check process details
ps -p $(cat classification.pid) -f
```

### Stop Processing

```bash
# Graceful stop (saves progress)
kill $(cat classification.pid)

# Force stop (if needed)
kill -9 $(cat classification.pid)

# Clean up PID file
rm classification.pid
```

### Resume Processing

```bash
# Just run the script again
python3 process_all_resources.py

# Or use resilient runner
./run_resilient.sh process_all_resources.py
```

### Clear Progress (Start Fresh)

```bash
# Remove checkpoint files
rm progress_checkpoint*.json

# Run script
python3 process_all_resources.py
```

---

## Best Practices

### 1. Always Use Test Mode First

```bash
# Test before production
./run_resilient.sh process_all_resources.py --test

# Review results
ls -la output/

# If good, run production
./run_resilient.sh process_all_resources.py
```

### 2. Monitor Initial Progress

```bash
# Start process
./run_resilient.sh process_all_resources.py

# Watch for first few items
tail -f classification_*.log

# Once stable, can disconnect
# Press Ctrl+C to stop watching (process continues)
```

### 3. Check Progress Periodically

```bash
# SSH back in
ssh your-server

# Check progress
cat progress_checkpoint_cached.json | jq '.metadata'

# View recent log
tail -20 classification_*.log
```

### 4. Save Logs

```bash
# After completion, save logs
mkdir -p logs/$(date +%Y%m%d)
mv classification_*.log logs/$(date +%Y%m%d)/
mv progress_checkpoint*.json logs/$(date +%Y%m%d)/
```

### 5. Backup Outputs

```bash
# Before rerunning
mv Output Output_backup_$(date +%Y%m%d_%H%M%S)

# Run new classification
./run_resilient.sh process_all_resources.py
```

---

## Troubleshooting

### "Process not resuming from checkpoint"

```bash
# Check if checkpoint file exists
ls -la progress_checkpoint*.json

# View checkpoint content
cat progress_checkpoint_cached.json | jq '.'

# If corrupted, remove and start fresh
rm progress_checkpoint*.json
```

### "Too many retries, items failing"

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check network
ping aws.amazon.com

# Check Bedrock access
aws bedrock list-foundation-models --region us-west-2
```

### "Process seems stuck"

```bash
# Check if actually running
ps -p $(cat classification.pid)

# Check recent log activity
tail -20 classification_*.log

# Check system resources
top -p $(cat classification.pid)
```

### "Want to change from test to production"

```bash
# Stop current process
kill $(cat classification.pid)

# Clear checkpoint (test data)
rm progress_checkpoint*.json

# Start production
./run_resilient.sh process_all_resources.py
```

---

## Advanced Usage

### Run on Remote Server

```bash
# SSH to server
ssh your-server

# Set AWS credentials
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Start process
./run_resilient.sh process_all_resources.py

# Disconnect (process continues)
exit

# Later, check progress
ssh your-server
tail -f classification_*.log
```

### Schedule Regular Updates

```bash
# Add to crontab
crontab -e

# Run every Sunday at 2 AM
0 2 * * 0 cd /path/to/project && ./run_resilient.sh process_live_resources.py

# Or use systemd timer for better control
```

### Process Multiple Sources Separately

```bash
# Process web scraper only
python3 -c "
from process_all_resources import ResourceClassificationPipeline
pipeline = ResourceClassificationPipeline()
results = pipeline.process_web_scraper_data('../Web-Scraper/encephalitis_content_database_WIP.json')
"

# Process Excel only
python3 -c "
from process_all_resources import ResourceClassificationPipeline
pipeline = ResourceClassificationPipeline()
results = pipeline.process_crib_sheet('data/Live chat crib sheet.xlsx')
"
```

---

## Performance Tips

### 1. Use Cached Data When Possible

```bash
# Faster and cheaper
./run_resilient.sh process_all_resources.py
```

### 2. Adjust Retry Settings

Edit script to change `max_retries`:
```python
result = self.classify_item(item, 'web_scraper', max_retries=5)
```

### 3. Adjust Save Frequency

Edit script to save more/less often:
```python
# Save every 10 items instead of 5
if idx % 10 == 0:
    self.save_progress(results, {...})
```

### 4. Run During Off-Peak Hours

```bash
# Schedule for night time
echo "./run_resilient.sh process_all_resources.py" | at 2am
```

---

## Summary

### Key Features

✅ **Auto-save every 5 items** - Minimal work lost  
✅ **Auto-resume on restart** - Just run again  
✅ **Network retry logic** - Handles temporary issues  
✅ **Background execution** - Survives disconnections  
✅ **Progress monitoring** - Track in real-time  

### Quick Commands

```bash
# Start (test)
./run_resilient.sh process_all_resources.py --test

# Monitor
tail -f classification_*.log

# Check progress
cat progress_checkpoint_cached.json | jq '.metadata'

# Resume (if stopped)
./run_resilient.sh process_all_resources.py
```

### Recovery

**If anything goes wrong, just run the script again!**

The system will:
1. Load the last checkpoint
2. Skip completed items
3. Continue from where it left off

**No manual intervention needed!** ✅

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
