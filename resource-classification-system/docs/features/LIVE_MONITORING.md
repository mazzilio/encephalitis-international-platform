# Live Monitoring and Statistics

**Real-time monitoring dashboard for resource classification processing**

---

## Overview

The live monitoring system provides a real-time web dashboard to track classification progress, view statistics, and monitor errors during processing. It's similar to the web-scraper's monitoring capabilities but designed for the batch processing pipeline.

### Features

- ✅ **Real-time progress tracking** - See processing status live
- ✅ **Live statistics** - Charts for personas, stages, topics
- ✅ **Error monitoring** - Track failures as they happen
- ✅ **Performance metrics** - Confidence scores and success rates
- ✅ **Auto-refresh** - Updates every 2 seconds
- ✅ **Recent results** - See last 10 processed items
- ✅ **Checkpoint status** - Monitor save points

---

## Quick Start

### 1. Install Dependencies

```bash
pip install flask flask-cors
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 2. Start Monitoring Server

```bash
# In terminal 1
python3 monitoring_server.py
```

**Output**:
```
================================================================================
RESOURCE CLASSIFICATION MONITORING SERVER
================================================================================

✅ Starting monitoring server...
   Dashboard: http://localhost:5000
   API: http://localhost:5000/api/status

💡 USAGE:
   1. Keep this server running
   2. In another terminal, run: ./run_resilient.sh process_live_resources.py
   3. Open http://localhost:5000 in your browser

📊 FEATURES:
   • Real-time progress tracking
   • Live statistics and charts
   • Error monitoring
   • Auto-refresh every 2 seconds

================================================================================
```

### 3. Start Processing

```bash
# In terminal 2
./run_resilient.sh process_live_resources.py
```

Or:

```bash
./run_resilient.sh process_all_resources.py
```

### 4. Open Dashboard

Open your browser to: **http://localhost:5000**

---

## Dashboard Features

### Progress Section
- **Processed**: Number of items completed
- **Total**: Total items to process
- **Progress Bar**: Visual progress indicator with percentage

### Results Section
- **Successful**: Successfully classified items
- **Errors**: Failed classifications
- **Success Rate**: Percentage of successful items

### Confidence Section
- **Average Score**: Mean confidence score across all items
- **Scored Items**: Number of items with confidence scores

### Charts
1. **Top Personas** - Bar chart of most common target personas
2. **Journey Stages** - Distribution across patient journey stages
3. **Top Topics** - Most frequently tagged topics

### Recent Results
- Last 10 processed items
- Shows title, status (success/error)
- Real-time updates as items are processed

---

## API Endpoints

The monitoring server provides REST API endpoints:

### GET /api/status

Get current processing status and statistics.

**Response**:
```json
{
  "last_update": "2026-01-14T21:45:30",
  "is_running": true,
  "stats": {
    "total": 100,
    "successful": 95,
    "errors": 5,
    "success_rate": 95.0,
    "progress": {
      "processed": 100,
      "total": 1255,
      "percentage": 8.0,
      "completed": false
    },
    "sources": {
      "web_scraper": 80,
      "crib_sheet": 15,
      "contacts": 5
    },
    "tags": {
      "personas": {
        "persona:patient": 45,
        "persona:caregiver": 30,
        "persona:professional": 20
      },
      "stages": {
        "stage:pre_diagnosis": 25,
        "stage:acute_hospital": 30,
        "stage:early_recovery": 25,
        "stage:long_term_management": 20
      },
      "topics": {
        "topic:diagnosis": 35,
        "topic:treatment": 40,
        "topic:research": 15
      }
    },
    "confidence": {
      "average": 87.5,
      "count": 95
    },
    "timestamp": "2026-01-14T21:45:00"
  }
}
```

### GET /api/checkpoint

Get full checkpoint data (all results).

**Response**: Complete checkpoint JSON

### GET /api/recent-results

Get most recent 10 processed items.

**Response**:
```json
[
  {
    "source_type": "web_scraper",
    "title": "Understanding Encephalitis Symptoms",
    "status": "success",
    "error": null,
    "confidence": 92,
    "processed_at": "2026-01-14T21:45:28"
  },
  {
    "source_type": "crib_sheet",
    "title": "Support for Caregivers",
    "status": "success",
    "error": null,
    "confidence": 88,
    "processed_at": "2026-01-14T21:45:30"
  }
]
```

---

## Use Cases

### Use Case 1: Long-Running Production Process

```bash
# Terminal 1: Start monitoring
python3 monitoring_server.py

# Terminal 2: Start processing
./run_resilient.sh process_all_resources.py

# Browser: Monitor at http://localhost:5000
# Can close browser and reopen anytime - progress persists
```

### Use Case 2: Testing and Debugging

```bash
# Terminal 1: Start monitoring
python3 monitoring_server.py

# Terminal 2: Test run
./run_resilient.sh process_all_resources.py --test

# Browser: Watch real-time progress
# See errors immediately
# Check confidence scores
```

### Use Case 3: Remote Monitoring

```bash
# On server: Start monitoring (bind to all interfaces)
python3 monitoring_server.py

# On local machine: SSH tunnel
ssh -L 5000:localhost:5000 user@server

# Browser: Access at http://localhost:5000
# Monitor remote processing from local machine
```

### Use Case 4: Multiple Processing Runs

```bash
# Keep monitoring server running
python3 monitoring_server.py

# Run multiple processes (one at a time)
./run_resilient.sh process_all_resources.py --test
# Review results in dashboard

./run_resilient.sh process_live_resources.py --test
# Dashboard automatically updates with new data
```

---

## Configuration

### Change Refresh Interval

Edit `monitoring_server.py`:

```python
REFRESH_INTERVAL = 2  # seconds (default: 2)
```

### Change Port

```python
app.run(host='0.0.0.0', port=5000)  # Change 5000 to desired port
```

### Change Checkpoint Files

```python
CHECKPOINT_FILE = 'progress_checkpoint.json'
CHECKPOINT_FILE_CACHED = 'progress_checkpoint_cached.json'
```

---

## Comparison with Web-Scraper Monitoring

| Feature | Web-Scraper | Batch Processing Monitor |
|---------|-------------|-------------------------|
| **Architecture** | AWS Lambda + API Gateway | Local Flask server |
| **Deployment** | Cloud (AWS CDK) | Local (Python) |
| **Real-time** | ✅ Yes | ✅ Yes |
| **Charts** | ✅ Yes (Recharts) | ✅ Yes (Chart.js) |
| **Progress tracking** | ✅ Yes | ✅ Yes |
| **Error monitoring** | ✅ Yes | ✅ Yes |
| **Cost** | AWS charges | Free (local) |
| **Setup** | Complex (CDK deploy) | Simple (pip install) |
| **Use case** | Production web scraping | Batch processing |

---

## Troubleshooting

### "Address already in use"

Port 5000 is already taken:

```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change port in monitoring_server.py
```

### "No module named 'flask'"

Install dependencies:

```bash
pip install flask flask-cors
```

### "Dashboard shows no data"

1. Check checkpoint file exists:
   ```bash
   ls -la progress_checkpoint*.json
   ```

2. Check processing is running:
   ```bash
   ps aux | grep process_all_resources
   ```

3. Check monitoring server logs for errors

### "Charts not displaying"

1. Check browser console for JavaScript errors
2. Ensure Chart.js CDN is accessible
3. Try refreshing the page

### "Dashboard not updating"

1. Check monitoring server is running
2. Check browser console for fetch errors
3. Verify checkpoint file is being updated:
   ```bash
   watch -n 2 'ls -lh progress_checkpoint*.json'
   ```

---

## Advanced Usage

### Custom Dashboard

The dashboard HTML is embedded in `monitoring_server.py`. You can customize it by editing the `DASHBOARD_HTML` variable.

### API Integration

Use the API endpoints to integrate with other tools:

```python
import requests

# Get status
response = requests.get('http://localhost:5000/api/status')
status = response.json()

print(f"Progress: {status['stats']['progress']['percentage']}%")
print(f"Success rate: {status['stats']['success_rate']}%")
```

### Slack Notifications

Add webhook notifications:

```python
import requests

def send_slack_notification(message):
    webhook_url = "YOUR_SLACK_WEBHOOK_URL"
    requests.post(webhook_url, json={"text": message})

# In monitor_checkpoint():
if stats['progress']['percentage'] == 100:
    send_slack_notification("✅ Processing complete!")
```

### Email Alerts

Add email alerts for errors:

```python
import smtplib

def send_email_alert(subject, body):
    # Configure SMTP settings
    # Send email
    pass

# In monitor_checkpoint():
if stats['errors'] > 10:
    send_email_alert("High error rate", f"Errors: {stats['errors']}")
```

---

## Production Deployment

### Option 1: Local Server

Keep monitoring server running on the same machine as processing:

```bash
# Use screen or tmux
screen -S monitoring
python3 monitoring_server.py
# Ctrl+A, D to detach

screen -S processing
./run_resilient.sh process_all_resources.py
# Ctrl+A, D to detach
```

### Option 2: Systemd Service

Create `/etc/systemd/system/classification-monitor.service`:

```ini
[Unit]
Description=Resource Classification Monitor
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/python3 monitoring_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable classification-monitor
sudo systemctl start classification-monitor
```

### Option 3: Docker

Create `Dockerfile.monitor`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install flask flask-cors

COPY monitoring_server.py .

EXPOSE 5000

CMD ["python3", "monitoring_server.py"]
```

Build and run:

```bash
docker build -f Dockerfile.monitor -t classification-monitor .
docker run -p 5000:5000 -v $(pwd):/app classification-monitor
```

---

## Best Practices

### 1. Keep Monitoring Server Running

Start monitoring before processing:

```bash
# Good
python3 monitoring_server.py &
./run_resilient.sh process_all_resources.py

# Not ideal
./run_resilient.sh process_all_resources.py
python3 monitoring_server.py  # Started after processing
```

### 2. Monitor Long-Running Processes

For 20-25 hour runs, keep dashboard open or check periodically:

```bash
# Check progress via API
curl http://localhost:5000/api/status | jq '.stats.progress'
```

### 3. Save Dashboard Screenshots

For documentation or reporting:
- Take screenshots at key milestones
- Export data via API endpoints
- Save checkpoint files for later analysis

### 4. Use with Resilient Runner

Always use resilient runner for production:

```bash
./run_resilient.sh process_all_resources.py
```

Not:

```bash
python3 process_all_resources.py  # Less resilient
```

---

## Summary

**Live monitoring provides:**
- ✅ Real-time visibility into processing
- ✅ Immediate error detection
- ✅ Performance insights
- ✅ Progress tracking
- ✅ Statistical analysis

**Perfect for:**
- Long-running production processes
- Testing and debugging
- Remote monitoring
- Performance optimization
- Stakeholder demonstrations

**Simple to use:**
1. `python3 monitoring_server.py`
2. `./run_resilient.sh process_all_resources.py`
3. Open http://localhost:5000

---

**Last Updated**: January 14, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
