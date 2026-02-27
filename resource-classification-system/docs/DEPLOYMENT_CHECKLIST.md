# Deployment Checklist

Complete checklist for deploying the Resource Classification System.

## Pre-Deployment

### 1. Environment Setup
- [ ] Python 3.9+ installed
- [ ] Node.js 20+ installed (for web scraper)
- [ ] AWS CLI configured
- [ ] Git repository cloned

### 2. AWS Credentials
- [ ] AWS_ACCESS_KEY_ID set
- [ ] AWS_SECRET_ACCESS_KEY set
- [ ] AWS_SESSION_TOKEN set (if using temporary credentials)
- [ ] AWS_DEFAULT_REGION set (us-west-2 recommended)

### 3. Dependencies
- [ ] Python dependencies installed: `pip install -r requirements.txt`
- [ ] Web scraper dependencies installed: `cd web-scraper/infrastructure && npm install`

## Batch Processing Deployment

### 4. Test Run
- [ ] Run test mode: `./processing/run_resilient.sh process_all_resources.py --test`
- [ ] Verify 15 resources processed (5 per source)
- [ ] Check logs: `tail -f logs/classification_*.log`
- [ ] Verify output files created in `output/`

### 5. Production Run
- [ ] Run production mode: `./processing/run_resilient.sh process_all_resources.py`
- [ ] Monitor progress: `tail -f logs/classification_*.log`
- [ ] Verify checkpoint saves: `cat temp/progress_checkpoint.json`
- [ ] Wait for completion (~20-25 hours)

### 6. Upload to DynamoDB
- [ ] Verify results: `ls -lh output/dynamodb_resources.json`
- [ ] Upload to DynamoDB: `python scripts/upload_to_dynamodb.py`
- [ ] Verify table created in AWS Console

## Web Scraper Deployment

### 7. Infrastructure Setup
- [ ] Navigate to infrastructure: `cd web-scraper/infrastructure`
- [ ] Bootstrap CDK (first time only): `cdk bootstrap`
- [ ] Review stack: `cdk synth`
- [ ] Deploy stack: `cdk deploy`
- [ ] Note API Gateway URL from output

### 8. Frontend Setup
- [ ] Navigate to frontend: `cd web-scraper/frontend`
- [ ] Copy environment file: `cp .env.example .env`
- [ ] Update API URL in `.env`
- [ ] Install dependencies: `npm install`
- [ ] Start development server: `npm run dev`
- [ ] Access at http://localhost:3001

## Post-Deployment Verification

### 9. Batch Processing Verification
- [ ] Check encephalitis_content_database.json exists
- [ ] Check dynamodb_resources.json exists
- [ ] Check classified_resources_for_charity.xlsx exists
- [ ] Verify resource count (should be 1,255)
- [ ] Spot check classifications for accuracy

### 10. Web Scraper Verification
- [ ] Test sitemap parsing
- [ ] Test URL scraping
- [ ] Test classification
- [ ] Verify results in S3
- [ ] Verify results in DynamoDB

### 11. Monitoring Setup (Optional)
- [ ] Start monitoring server: `python3 monitoring/monitoring_server_enhanced.py`
- [ ] Access dashboard: http://localhost:5000
- [ ] Verify real-time updates
- [ ] Check statistics and charts

## Documentation Review

### 12. Documentation
- [ ] Review README.md
- [ ] Review HACKATHON.md
- [ ] Review docs/DEPLOYMENT.md
- [ ] Review docs/USER_GUIDE.md
- [ ] Review docs/charity/STAFF_GUIDE.md
- [ ] Verify all links work

### 13. Charity Staff Training
- [ ] Share docs/charity/STAFF_GUIDE.md
- [ ] Demonstrate tag system
- [ ] Show common scenarios
- [ ] Provide test data access

## Cleanup

### 14. Remove Temporary Files
- [ ] Review logs: `ls -lh logs/`
- [ ] Review temp files: `ls -lh temp/`
- [ ] Archive old logs if needed
- [ ] Clean up test outputs

### 15. Security Review
- [ ] Verify no credentials in code
- [ ] Verify .gitignore covers sensitive files
- [ ] Review IAM permissions
- [ ] Enable CloudWatch alarms

## Production Readiness

### 16. Performance
- [ ] Verify average processing time (~20 seconds per resource)
- [ ] Check confidence score distribution (85%+ average)
- [ ] Monitor API latency (<500ms)
- [ ] Review cost estimates

### 17. Reliability
- [ ] Test auto-resume functionality
- [ ] Test network disconnection handling
- [ ] Verify checkpoint saves
- [ ] Test error handling

### 18. Scalability
- [ ] Review Lambda concurrency limits
- [ ] Check DynamoDB capacity
- [ ] Monitor S3 storage
- [ ] Plan for growth

## Final Steps

### 19. Handover
- [ ] Provide access credentials to charity staff
- [ ] Schedule training session
- [ ] Share documentation links
- [ ] Set up support channel

### 20. Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Configure log retention
- [ ] Enable cost alerts
- [ ] Schedule regular reviews

---

## Quick Reference

### Essential Commands

```bash
# Test run
./processing/run_resilient.sh process_all_resources.py --test

# Production run
./processing/run_resilient.sh process_all_resources.py

# Monitor progress
tail -f logs/classification_*.log

# Check status
ps aux | grep process_all_resources

# Stop processing
kill $(cat temp/classification.pid)

# Upload to DynamoDB
python scripts/upload_to_dynamodb.py

# Deploy web scraper
cd web-scraper/infrastructure && cdk deploy

# Start monitoring
python3 monitoring/monitoring_server_enhanced.py
```

### Important Paths

- **Logs**: `logs/`
- **Checkpoints**: `temp/`
- **Output**: `output/`
- **Documentation**: `docs/`
- **Processing scripts**: `processing/`
- **Monitoring tools**: `monitoring/`

---

**Last Updated**: January 14, 2026
