# Cached Web Scraper Data

This directory contains cached web scraper data for use with the batch processing pipeline.

---

## Files

### web_scraper_content.json

**Description**: Cached web content from Encephalitis International website

**Source**: Web scraper output from sitemap processing

**Size**: ~116KB

**Items**: ~4,000+ web pages

**Last Updated**: January 14, 2026

**Use**: 
- Used by `process_all_resources.py` for batch classification
- Used by `process_live_resources.py` with `--cached` flag

---

## Purpose

Cached data allows for:
- ✅ **Faster processing** - No web scraping time required
- ✅ **Cheaper processing** - Only classification API calls
- ✅ **No rate limits** - No web scraping requests
- ✅ **Consistent testing** - Same data for comparison
- ✅ **Offline processing** - Works without internet

---

## Usage

### With process_all_resources.py

```bash
# Automatically uses cached data
./run_resilient.sh process_all_resources.py --test
```

The script automatically looks for: `data/cached/web_scraper_content.json`

### With process_live_resources.py

```bash
# Use cached data instead of live scraping
./run_resilient.sh process_live_resources.py --test --cached
```

Or specify a custom cached file:

```bash
./run_resilient.sh process_live_resources.py --cached data/cached/web_scraper_content.json
```

---

## Updating Cached Data

To update the cached data with fresh content from the website:

```bash
# 1. Run live scraping (without --cached flag)
./run_resilient.sh process_live_resources.py

# 2. The new data will be processed and saved to output/

# 3. If you want to cache the scraped data for future use:
# (This would require modifying the script to save scraped data)
```

---

## File Format

The cached file is a JSON array of web page objects:

```json
[
  {
    "url": "https://www.encephalitis.info/...",
    "title": "Page Title",
    "summary": "Page summary or excerpt",
    "full_content": "Complete page content",
    "scraped_at": "2026-01-14T19:49:00",
    "tags": {
      "initial_tags": []
    }
  },
  ...
]
```

---

## Benefits of Cached Data

### For Development
- Fast iteration on classification prompts
- Test changes without re-scraping
- Consistent baseline for comparisons

### For Testing
- Quick test runs (5 items in ~5 minutes)
- No external dependencies
- Reproducible results

### For Production
- Reclassify with updated taxonomy
- Compare different model outputs
- Cost-effective reprocessing

---

## Storage

**Location**: `data/cached/` (within repository)

**Version Control**: 
- ⚠️ Large files (>100KB) should be in `.gitignore`
- Consider using Git LFS for large cached files
- Or store in external location and document path

**Backup**: 
- Keep backups of cached data
- Document data source and date
- Version cached files if needed

---

## Related Files

- `data/Live chat crib sheet.xlsx` - Crib sheet data
- `data/Encephalitis orgs, centres and country contacts_pi_removed.xlsx` - Contacts data
- `output/` - Processed classification results

---

## Notes

- Cached data is a snapshot from a specific point in time
- For most current data, use live scraping mode
- Cached data is useful for testing and reclassification
- Update cached data periodically to stay current

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
