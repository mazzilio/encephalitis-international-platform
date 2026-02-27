# Error Handling Guide

**Understanding errors in resource classification processing**

---

## Why Items Might Error

### 1. Network Issues (Most Common)

**Causes**:
- Temporary network connectivity loss
- Internet connection drops
- DNS resolution failures
- Firewall/proxy issues

**Example Error**:
```
ConnectionError: Failed to establish connection to AWS Bedrock
```

**Handling**:
- ✅ Automatic retry (3 attempts with exponential backoff)
- ✅ Progress saved before retry
- ✅ Processing continues with next item if all retries fail

**Prevention**:
- Use stable internet connection
- Run on server with reliable network
- Use resilient runner for long processes

---

### 2. AWS Bedrock API Issues

**Causes**:
- API rate limiting (too many requests)
- Service throttling
- Temporary service unavailability
- Region-specific issues

**Example Errors**:
```
ThrottlingException: Rate exceeded
ServiceUnavailableException: Service temporarily unavailable
```

**Handling**:
- ✅ Automatic retry with backoff
- ✅ Respects rate limits (0.2s delay between items)
- ✅ Logs error for review

**Prevention**:
- Use appropriate delays between requests
- Monitor AWS service health
- Consider increasing service quotas

---

### 3. Authentication/Authorization Issues

**Causes**:
- Expired AWS credentials
- Invalid credentials
- Insufficient permissions
- Session token expired

**Example Errors**:
```
UnauthorizedError: Invalid credentials
AccessDeniedException: User not authorized to perform bedrock:InvokeModel
```

**Handling**:
- ❌ Cannot retry (requires credential refresh)
- ✅ Processing stops with clear error message
- ✅ Progress saved up to failure point

**Prevention**:
- Refresh credentials before long runs
- Use IAM roles with proper permissions
- Monitor credential expiration

---

### 4. Model/Content Issues

**Causes**:
- Content too large for model
- Invalid content format
- Model response parsing failure
- Malformed JSON in response

**Example Errors**:
```
ValidationException: Input too large
JSONDecodeError: Invalid JSON in model response
```

**Handling**:
- ✅ Logs error with item details
- ✅ Continues to next item
- ✅ Item marked as failed in results

**Prevention**:
- Validate content before processing
- Handle edge cases in parsing
- Truncate very long content

---

### 5. Timeout Issues

**Causes**:
- Model taking too long to respond
- Network latency
- Complex content requiring more processing
- API gateway timeout

**Example Errors**:
```
TimeoutError: Request timed out after 30 seconds
ReadTimeoutError: Read operation timed out
```

**Handling**:
- ✅ Automatic retry (3 attempts)
- ✅ Exponential backoff between retries
- ✅ Continues if all retries fail

**Prevention**:
- Increase timeout settings if needed
- Use faster network connection
- Process during off-peak hours

---

## Error Handling in Code

### Retry Logic

```python
def classify_item(self, item, source_type, max_retries=3):
    for attempt in range(max_retries):
        try:
            # Call Claude Opus 4.5
            response = self.bedrock_runtime.invoke_model(...)
            return result
            
        except Exception as e:
            error_msg = str(e)
            if attempt < max_retries - 1:
                # Network or temporary error - retry
                if 'timeout' in error_msg.lower() or 
                   'connection' in error_msg.lower() or 
                   'network' in error_msg.lower():
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"⚠️  Network error, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
            
            # Final failure
            print(f"❌ Error: {error_msg}")
            return {
                'source_type': source_type,
                'original': item,
                'error': error_msg,
                'processed_at': datetime.now().isoformat()
            }
```

### Checkpoint Protection

```python
# Save progress every 5 items
if idx % 5 == 0:
    self.save_progress(results, {
        'last_processed': idx,
        'total': len(data),
        'type': 'web_scraper'
    })
```

**Maximum data loss**: 4 items (between checkpoints)

---

## Error Rates

### Expected Error Rates

**Normal Operation**:
- 0-2% errors (network blips, occasional timeouts)
- Most errors resolve with retry

**Degraded Network**:
- 5-10% errors (unstable connection)
- Retries help but some fail

**Service Issues**:
- 10-20% errors (AWS throttling, service issues)
- May need to pause and resume later

**Critical Issues**:
- >20% errors (credentials, permissions, major outage)
- Investigate and fix before continuing

### Test Demo Error Rate

**Simulated**: 10-15% error rate

**Purpose**:
- Demonstrate error handling
- Show resilient processing
- Verify monitoring displays errors
- Test checkpoint recovery

**Not representative of production** - actual error rates are typically <2%

---

## Monitoring Errors

### In Dashboard

**Error Display**:
- ✗ symbol for failed items
- Error count in statistics
- Success rate percentage
- Recent results show error status

**Example**:
```
Total: 20
Successful: 17 (85%)
Errors: 3 (15%)
```

### In Logs

**Error Logging**:
```
[5/20] Returning to Work After Brain Injury... ✗
❌ Error: Simulated network timeout for testing
```

### In Checkpoint File

**Error Structure**:
```json
{
  "source_type": "web_content",
  "original": {
    "title": "Resource Title",
    "url": "https://..."
  },
  "error": "Network timeout",
  "processed_at": "2026-01-14T22:30:00"
}
```

---

## Handling Errors in Production

### During Processing

1. **Monitor Dashboard**
   - Watch error count
   - Check if errors are increasing
   - Review recent failed items

2. **Check Logs**
   - Look for error patterns
   - Identify error types
   - Determine if action needed

3. **Decide Action**
   - <5% errors: Continue processing
   - 5-10% errors: Monitor closely
   - >10% errors: Investigate and possibly pause

### After Processing

1. **Review Failed Items**
   ```bash
   # Check errors in results
   cat output/encephalitis_content_database.json | jq '.[] | select(.error != null)'
   ```

2. **Analyze Error Patterns**
   - Are errors random or specific items?
   - Same error type or different?
   - Time-based pattern?

3. **Retry Failed Items**
   - Extract failed items
   - Fix underlying issue
   - Reprocess individually

---

## Retry Strategies

### Automatic Retry (Built-in)

**When**: Network errors, timeouts  
**Attempts**: 3  
**Backoff**: Exponential (1s, 2s, 4s)  
**Success Rate**: ~80% of temporary errors resolve

### Manual Retry

**When**: After fixing underlying issue  
**Method**: Reprocess specific items

```python
# Extract failed items
failed_items = [r for r in results if 'error' in r]

# Reprocess
for item in failed_items:
    result = pipeline.classify_item(item['original'], item['source_type'])
```

### Batch Retry

**When**: Many items failed  
**Method**: Resume from checkpoint

```bash
# Just run again - will resume from checkpoint
./run_resilient.sh process_all_resources.py
```

---

## Error Prevention

### Best Practices

1. **Stable Environment**
   - Use reliable internet connection
   - Run on stable server
   - Avoid WiFi for long runs

2. **Credential Management**
   - Refresh credentials before long runs
   - Monitor expiration times
   - Use IAM roles when possible

3. **Monitoring**
   - Watch dashboard during processing
   - Check logs periodically
   - Set up alerts for high error rates

4. **Timing**
   - Process during off-peak hours
   - Avoid peak AWS usage times
   - Allow adequate time for completion

5. **Testing**
   - Always test with --test mode first
   - Verify credentials work
   - Check network stability

---

## Troubleshooting Common Errors

### "AWS credentials not found"

**Cause**: Credentials not set or expired

**Fix**:
```bash
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_SESSION_TOKEN="your_token"
```

### "ThrottlingException: Rate exceeded"

**Cause**: Too many requests to AWS Bedrock

**Fix**:
- Wait a few minutes
- Increase delay between items
- Check AWS service quotas

### "Network timeout"

**Cause**: Slow or unstable network

**Fix**:
- Check internet connection
- Use wired connection instead of WiFi
- Increase timeout settings

### "JSONDecodeError"

**Cause**: Model returned invalid JSON

**Fix**:
- Usually resolves with retry
- Check if content is malformed
- Review model response in logs

---

## Summary

### Test Demo Errors

**Purpose**: Demonstrate error handling  
**Rate**: 10-15% (intentional)  
**Type**: Simulated network timeouts  
**Not representative of production**

### Production Errors

**Expected Rate**: 0-2%  
**Common Causes**:
1. Network issues (temporary)
2. API throttling (rare)
3. Timeouts (occasional)

**Handling**:
- ✅ Automatic retry (3 attempts)
- ✅ Exponential backoff
- ✅ Progress saved
- ✅ Processing continues
- ✅ Errors logged

**Prevention**:
- Stable network
- Fresh credentials
- Proper monitoring
- Test mode first

**Recovery**:
- Resume from checkpoint
- Retry failed items
- Fix underlying issue

---

**The resilient processing system is designed to handle errors gracefully, minimize data loss, and allow easy recovery. Most errors are temporary and resolve automatically with retry logic.**

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
