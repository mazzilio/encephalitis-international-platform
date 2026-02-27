#!/usr/bin/env python3
"""
Script to anonymize personal information in Excel file
Replaces names, emails, and contact information with generic placeholders
"""

import pandas as pd
import re
from faker import Faker
import random

fake = Faker()
Faker.seed(42)
random.seed(42)

# Load the Excel file
input_file = 'Encephalitis orgs, centres and country contacts_pi_removed.xlsx'
output_file = 'Encephalitis orgs, centres and country contacts_anonymized.xlsx'

# Create a mapping to ensure consistency
name_mapping = {}
email_mapping = {}

def anonymize_name(name):
    """Replace real names with generic names"""
    if pd.isna(name) or name == '' or name == 'NaN':
        return name
    
    name_str = str(name).strip()
    
    # Skip if already generic or organizational (but NOT personal names with titles)
    skip_keywords = ['Center', 'Centre', 'Hospital', 'University', 
                     'Institute', 'Department', 'Foundation', 'Association', 'Project',
                     'Clinic', 'Medical', 'Research', 'National', 'International']
    
    # Check if it's purely organizational (no personal names)
    is_organizational = any(keyword.lower() in name_str.lower() for keyword in skip_keywords)
    has_title = any(title in name_str for title in ['Dr.', 'Dr ', 'Professor', 'Prof.'])
    
    # If it's organizational without a title, keep it
    if is_organizational and not has_title:
        return name_str
    
    # Check if it's already in our mapping
    if name_str in name_mapping:
        return name_mapping[name_str]
    
    # Generate a generic name, preserving titles
    person_num = len(name_mapping) + 1
    if 'Dr.' in name_str or 'Dr ' in name_str:
        generic_name = f"Dr. Person {person_num}"
    elif 'Professor' in name_str or 'Prof.' in name_str:
        generic_name = f"Professor Person {person_num}"
    else:
        generic_name = f"Person {person_num}"
    
    name_mapping[name_str] = generic_name
    return generic_name

def anonymize_email(email):
    """Replace real emails with generic emails"""
    if pd.isna(email) or email == '' or email == 'NaN':
        return email
    
    email_str = str(email).strip()
    
    # Check if it's already in our mapping
    if email_str in email_mapping:
        return email_mapping[email_str]
    
    # Generate a generic email
    generic_email = f"contact{len(email_mapping) + 1}@example.com"
    email_mapping[email_str] = generic_email
    return generic_email

def anonymize_text_field(text):
    """Anonymize names within text fields"""
    if pd.isna(text) or text == '':
        return text
    
    text_str = str(text)
    
    # Replace specific known patterns
    text_str = text_str.replace('Name1', 'John')
    text_str = text_str.replace('Surname1', 'Smith')
    
    return text_str

# Read all sheets
xls = pd.ExcelFile(input_file)

# Create Excel writer
with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
    
    # Process each sheet
    for sheet_name in xls.sheet_names:
        print(f"Processing sheet: {sheet_name}")
        df = pd.read_excel(xls, sheet_name)
        
        # Anonymize based on sheet type
        if sheet_name == 'Encephalitis Orgs':
            if 'Key Contact' in df.columns:
                df['Key Contact'] = df['Key Contact'].apply(anonymize_name)
            if 'Email' in df.columns:
                df['Email'] = df['Email'].apply(anonymize_email)
            if 'Generic Email' in df.columns:
                df['Generic Email'] = df['Generic Email'].apply(anonymize_email)
            # Anonymize names in URLs and text
            for col in ['Facebook', 'Twitter/X', 'Instagram', 'LinkedIn', 'website']:
                if col in df.columns:
                    df[col] = df[col].apply(anonymize_text_field)
        
        elif sheet_name == 'Country Contacts':
            if 'Name' in df.columns:
                df['Name'] = df['Name'].apply(anonymize_name)
            if 'Email' in df.columns:
                df['Email'] = df['Email'].apply(anonymize_email)
        
        elif sheet_name == 'Brain Bank':
            # Anonymize all text in this sheet
            for col in df.columns:
                df[col] = df[col].apply(lambda x: 'Generic Contact' if isinstance(x, str) and 
                                       not any(word in str(x).lower() for word in 
                                       ['bank', 'department', 'hospital', 'oxford', 'tel:', 'level', 'wing']) 
                                       else x)
        
        # Write to new file
        df.to_excel(writer, sheet_name=sheet_name, index=False)
    
print(f"\nAnonymization complete!")
print(f"Output saved to: {output_file}")
print(f"\nAnonymized {len(name_mapping)} names")
print(f"Anonymized {len(email_mapping)} email addresses")
