# Data Directory

This directory contains input data files for the resource classification pipeline.

---

## Directory Structure

```
data/
├── README.md                                          # This file
├── cached/                                            # Cached web scraper data
│   ├── README.md                                      # Cached data documentation
│   └── web_scraper_content.json                       # Cached web content (~116KB)
├── Live chat crib sheet.xlsx                          # Staff guidance data
└── Encephalitis orgs, centres and country contacts_pi_removed.xlsx  # Contacts data
```

---

## Files

### 1. Live chat crib sheet.xlsx
- **Description**: Staff guidance for live chat support
- **Sheets**: 17 topic sheets
- **Items**: ~697 items
- **Use**: Processed by both `process_all_resources.py` and `process_live_resources.py`

### 2. Encephalitis orgs, centres and country contacts_pi_removed.xlsx
- **Description**: Professional contacts and organizations
- **Content**: Treatment centres worldwide
- **Items**: ~133 items
- **Use**: Processed by both `process_all_resources.py` and `process_live_resources.py`

### 3. cached/ directory
- **Description**: Cached web scraper data for faster processing
- **Main File**: `web_scraper_content.json` (~173 items from initial scrape)
- **Note**: For live scraping, use sitemap which has ~425 URLs
- **Use**: Used by `process_all_resources.py` and `process_live_resources.py --cached`
- **See**: [cached/README.md](cached/README.md) for details

---

## Usage

### With Cached Data (Recommended for Testing)

```bash
# Uses cached web data + Excel files
./run_resilient.sh process_all_resources.py --test
```

### With Live Scraping

```bash
# Scrapes fresh web data + uses Excel files
./run_resilient.sh process_live_resources.py --test
```

### With Cached Web Data (Explicit)

```bash
# Uses cached web data + Excel files
./run_resilient.sh process_live_resources.py --test --cached
```

---

## Data Sources

### Web Content
- **Source**: https://www.encephalitis.info
- **Method**: Sitemap parsing and content scraping
- **Cached**: `cached/web_scraper_content.json`
- **Live**: Scraped on-demand by `process_live_resources.py`

### Excel Files
- **Source**: Encephalitis International staff resources
- **Format**: Microsoft Excel (.xlsx)
- **Location**: This directory (`data/`)

---

## Notes

### Version Control
- Excel files are not committed to GitHub (size and sensitivity)
- Cached web data may be in `.gitignore` (large file)
- Place your files here before running the pipeline

### Data Privacy
- Personal information has been removed from contacts file
- File suffix `_pi_removed` indicates PI (Personal Information) removal
- Review data before sharing or committing

### Updates
- Excel files: Update manually as needed
- Cached web data: Update by running live scraping
- Frequency: As needed based on content changes

---

## Related Documentation

- [PROCESSING_GUIDE.md](../PROCESSING_GUIDE.md) - Processing options
- [cached/README.md](cached/README.md) - Cached data details
- [QUICK_START.md](../QUICK_START.md) - Quick start guide

---

**Last Updated**: January 14, 2026  
**Version**: 2.0 (Added cached directory)
