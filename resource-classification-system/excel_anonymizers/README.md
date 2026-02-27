# Excel Anonymizers

Tools for anonymizing personal information in Excel files before processing.

## Files

- **`anonymize_excel.py`** - Anonymizes personal information (names, emails, phone numbers) in Excel files

## Usage

### Anonymize Excel File

```python
python anonymize_excel.py
```

This will:
1. Read Excel files with personal information
2. Replace names with generic placeholders (Person 1, Person 2, etc.)
3. Replace emails with generic emails (contact1@example.com, etc.)
4. Replace phone numbers with generic numbers
5. Save anonymized version with `_pi_removed` suffix

### Example

```python
from anonymize_excel import anonymize_excel_file

# Anonymize a file
anonymize_excel_file(
    'Encephalitis orgs, centres and country contacts.xlsx',
    'Encephalitis orgs, centres and country contacts_pi_removed.xlsx'
)
```

## What Gets Anonymized

- **Names**: Person 1, Person 2, Person 3, etc.
- **Emails**: contact1@example.com, contact2@example.com, etc.
- **Phone Numbers**: Generic placeholders
- **Personal Identifiers**: Any PII detected

## What Stays

- Organization names
- Institution names
- Country information
- Website URLs
- Generic contact information
- Public information

## Privacy Compliance

This tool helps ensure:
- ✅ GDPR compliance
- ✅ Data protection
- ✅ Safe sharing of datasets
- ✅ Privacy-first approach

## Integration

Anonymized files are then processed by:
1. `excel_processor.py` - Extracts structured data
2. `process_staff_resources.py` - Refines tags with Bedrock
3. Master resource database - Final output

## Notes

- Always review anonymized output before sharing
- Keep original files secure
- Use anonymized versions for development/testing
- Document what was anonymized
