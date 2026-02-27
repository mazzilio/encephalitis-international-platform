"""
Excel File Processor for Charity Staff Resources
Processes Live Chat Crib Sheet and Contacts spreadsheets for tag refinement
"""

import pandas as pd
import json
from typing import Dict, List, Any, Optional
from pathlib import Path


class LiveChatCribSheetProcessor:
    """
    Processes the Live Chat Crib Sheet Excel file
    Extracts content from multiple sheets for tag refinement
    """
    
    def __init__(self, excel_file: str):
        """
        Initialize processor with Excel file path
        
        Args:
            excel_file: Path to Live chat crib sheet.xlsx
        """
        self.excel_file = excel_file
        self.sheets = pd.read_excel(excel_file, sheet_name=None)
        
    def extract_sheet_content(self, sheet_name: str) -> List[Dict[str, Any]]:
        """
        Extract structured content from a specific sheet
        
        Args:
            sheet_name: Name of the sheet to process
            
        Returns:
            List of content items with metadata
        """
        if sheet_name not in self.sheets:
            return []
        
        df = self.sheets[sheet_name]
        content_items = []
        
        # Process each row, extracting text and URLs
        for idx, row in df.iterrows():
            # Combine all non-null values in the row
            row_text = []
            urls = []
            
            for col in df.columns:
                value = row[col]
                if pd.notna(value):
                    value_str = str(value).strip()
                    if value_str:
                        # Check if it's a URL
                        if value_str.startswith('http'):
                            urls.append(value_str)
                        else:
                            row_text.append(value_str)
            
            if row_text:  # Only add if there's actual content
                content_items.append({
                    'sheet': sheet_name,
                    'row_index': idx,
                    'content': ' '.join(row_text),
                    'urls': urls,
                    'source': 'live_chat_crib_sheet'
                })
        
        return content_items
    
    def process_all_sheets(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Process all sheets in the workbook
        
        Returns:
            Dict mapping sheet names to content items
        """
        all_content = {}
        
        for sheet_name in self.sheets.keys():
            content = self.extract_sheet_content(sheet_name)
            if content:
                all_content[sheet_name] = content
        
        return all_content
    
    def create_tagging_dataset(self) -> List[Dict[str, Any]]:
        """
        Create a dataset ready for tag refinement
        
        Returns:
            List of items formatted for Bedrock tag refinement
        """
        all_content = self.process_all_sheets()
        dataset = []
        
        # Map sheet names to categories and personas
        sheet_metadata = {
            'Overview': {
                'category': 'educational',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:parent'],
                'topics': ['topic:basics'],
                'resource_type': 'resource:factsheet'
            },
            'Services': {
                'category': 'support_service',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:support_services'],
                'resource_type': 'resource:support_service'
            },
            'Diagnosis': {
                'category': 'clinical',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                'topics': ['topic:diagnosis'],
                'stages': ['stage:pre_diagnosis', 'stage:acute_hospital'],
                'resource_type': 'resource:factsheet'
            },
            'Treatments': {
                'category': 'clinical',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                'topics': ['topic:treatment'],
                'stages': ['stage:acute_hospital'],
                'resource_type': 'resource:factsheet'
            },
            'After effects': {
                'category': 'recovery',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:after_effects', 'topic:symptoms'],
                'stages': ['stage:early_recovery', 'stage:long_term_management'],
                'resource_type': 'resource:factsheet'
            },
            'Recovery': {
                'category': 'recovery',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:recovery', 'topic:rehabilitation'],
                'stages': ['stage:early_recovery', 'stage:long_term_management'],
                'resource_type': 'resource:factsheet'
            },
            'Rehabilitation': {
                'category': 'recovery',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                'topics': ['topic:rehabilitation'],
                'stages': ['stage:early_recovery', 'stage:long_term_management'],
                'resource_type': 'resource:factsheet'
            },
            'ABI notes': {
                'category': 'clinical',
                'primary_personas': ['persona:professional', 'persona:caregiver'],
                'topics': ['topic:brain_injury', 'topic:symptoms'],
                'resource_type': 'resource:factsheet'
            },
            'Children and YP': {
                'category': 'educational',
                'primary_personas': ['persona:parent', 'persona:caregiver'],
                'topics': ['topic:children', 'topic:school'],
                'resource_type': 'resource:factsheet'
            },
            'Menopause': {
                'category': 'specific_population',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:menopause', 'topic:women_health'],
                'resource_type': 'resource:factsheet'
            },
            'Over 65': {
                'category': 'specific_population',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:older_adults', 'topic:dementia'],
                'resource_type': 'resource:factsheet'
            },
            'Benefits': {
                'category': 'practical',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:legal', 'topic:benefits'],
                'locations': ['location:uk'],
                'resource_type': 'resource:factsheet'
            },
            'International': {
                'category': 'support_service',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'locations': ['location:worldwide'],
                'resource_type': 'resource:support_service'
            },
            'Fundraising': {
                'category': 'fundraising',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:bereaved'],
                'topics': ['topic:fundraising'],
                'resource_type': 'resource:fundraising'
            },
            'Admin Qs': {
                'category': 'administrative',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'topics': ['topic:admin'],
                'resource_type': 'resource:support_service'
            },
            'Helpful phrases': {
                'category': 'staff_guidance',
                'primary_personas': ['persona:professional'],
                'topics': ['topic:communication'],
                'resource_type': 'resource:staff_guidance'
            },
            'Glossary': {
                'category': 'educational',
                'primary_personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                'topics': ['topic:terminology', 'topic:education'],
                'resource_type': 'resource:factsheet'
            }
        }
        
        for sheet_name, items in all_content.items():
            metadata = sheet_metadata.get(sheet_name, {
                'category': 'general',
                'primary_personas': ['persona:patient', 'persona:caregiver'],
                'resource_type': 'resource:factsheet'
            })
            
            for item in items:
                # Group related rows into logical chunks
                if len(item['content']) > 50:  # Only include substantial content
                    dataset.append({
                        'title': f"{sheet_name} - Row {item['row_index']}",
                        'description': item['content'][:200] + ('...' if len(item['content']) > 200 else ''),
                        'full_content': item['content'],
                        'category': metadata.get('category', 'general'),
                        'audience': ', '.join(metadata.get('primary_personas', [])),
                        'urls': item['urls'],
                        'notes': f"Live chat crib sheet content from {sheet_name} section. Used by staff for chat support.",
                        'source_sheet': sheet_name,
                        'source_file': 'live_chat_crib_sheet',
                        'communication_channel': 'chat',
                        'suggested_tags': {
                            'personas': metadata.get('primary_personas', []),
                            'topics': metadata.get('topics', []),
                            'stages': metadata.get('stages', []),
                            'locations': metadata.get('locations', []),
                            'resource_type': [metadata.get('resource_type', 'resource:factsheet')]
                        }
                    })
        
        return dataset


class ContactsProcessor:
    """
    Processes the Encephalitis Orgs, Centres and Country Contacts Excel file
    """
    
    def __init__(self, excel_file: str):
        """
        Initialize processor with Excel file path
        
        Args:
            excel_file: Path to contacts Excel file
        """
        self.excel_file = excel_file
        self.sheets = pd.read_excel(excel_file, sheet_name=None)
    
    def process_encephalitis_orgs(self) -> List[Dict[str, Any]]:
        """Process Encephalitis Orgs sheet"""
        if 'Encephalitis Orgs' not in self.sheets:
            return []
        
        df = self.sheets['Encephalitis Orgs']
        orgs = []
        
        for idx, row in df.iterrows():
            if pd.notna(row.get('Name')):
                org = {
                    'name': str(row.get('Name', '')),
                    'country': str(row.get('Areas of operation', '')),
                    'type': str(row.get('Type of organisation', '')),
                    'services': str(row.get('What is offered', '')),
                    'website': str(row.get('website', '')) if pd.notna(row.get('website')) else '',
                    'email': str(row.get('Generic Email', '')) if pd.notna(row.get('Generic Email')) else '',
                    'social_media': {
                        'facebook': str(row.get('Facebook', '')) if pd.notna(row.get('Facebook')) else '',
                        'twitter': str(row.get('Twitter/X', '')) if pd.notna(row.get('Twitter/X')) else '',
                        'instagram': str(row.get('Instagram', '')) if pd.notna(row.get('Instagram')) else ''
                    },
                    'source': 'encephalitis_orgs'
                }
                orgs.append(org)
        
        return orgs
    
    def process_country_contacts(self) -> List[Dict[str, Any]]:
        """Process Country Contacts sheet"""
        if 'Country Contacts' not in self.sheets:
            return []
        
        df = self.sheets['Country Contacts']
        contacts = []
        
        for idx, row in df.iterrows():
            if pd.notna(row.get('Name')):
                contact = {
                    'name': str(row.get('Name', '')),
                    'country': str(row.get('Country', '')),
                    'position': str(row.get('Position', '')) if pd.notna(row.get('Position')) else '',
                    'specialty': str(row.get('Adult or paediatric', '')) if pd.notna(row.get('Adult or paediatric')) else '',
                    'institution': str(row.get('Institution', '')) if pd.notna(row.get('Institution')) else '',
                    'email': str(row.get('Email', '')) if pd.notna(row.get('Email')) else '',
                    'notes': str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else '',
                    'source': 'country_contacts'
                }
                contacts.append(contact)
        
        return contacts
    
    def process_encephalitis_centres(self) -> List[Dict[str, Any]]:
        """Process Encephalitis Centres sheet"""
        if 'Encephalitis Centres' not in self.sheets:
            return []
        
        df = self.sheets['Encephalitis Centres']
        centres = []
        
        for idx, row in df.iterrows():
            if pd.notna(row.get('Name')):
                centre = {
                    'name': str(row.get('Name', '')),
                    'country': str(row.get('Country', '')) if pd.notna(row.get('Country')) else '',
                    'website': str(row.get('Link', '')) if pd.notna(row.get('Link')) else '',
                    'notes': str(row.get('Notes', '')) if pd.notna(row.get('Notes')) else '',
                    'source': 'encephalitis_centres'
                }
                centres.append(centre)
        
        return centres
    
    def create_tagging_dataset(self) -> List[Dict[str, Any]]:
        """
        Create a dataset ready for tag refinement
        
        Returns:
            List of items formatted for Bedrock tag refinement
        """
        dataset = []
        
        # Process organizations
        orgs = self.process_encephalitis_orgs()
        for org in orgs:
            dataset.append({
                'title': f"{org['name']} - {org['country']}",
                'description': f"{org['type']} organization offering {org['services']}",
                'full_content': f"Organization: {org['name']}\nCountry: {org['country']}\nType: {org['type']}\nServices: {org['services']}\nWebsite: {org['website']}",
                'category': 'professional_contact',
                'audience': 'persona:patient, persona:caregiver, persona:professional',
                'urls': [org['website']] if org['website'] else [],
                'notes': f"International organization contact for {org['country']}. Type: {org['type']}",
                'source_file': 'contacts',
                'source_type': 'organization',
                'country': org['country'],
                'suggested_tags': {
                    'personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                    'resource_type': ['resource:professional_contact'],
                    'locations': [f"location:{org['country'].lower().replace(' ', '_')}"] if org['country'] else ['location:worldwide'],
                    'topics': ['topic:support_services', 'topic:international']
                }
            })
        
        # Process centres
        centres = self.process_encephalitis_centres()
        for centre in centres:
            dataset.append({
                'title': f"{centre['name']} - {centre['country']}",
                'description': f"Encephalitis treatment centre in {centre['country']}",
                'full_content': f"Centre: {centre['name']}\nCountry: {centre['country']}\nWebsite: {centre['website']}\nNotes: {centre['notes']}",
                'category': 'professional_contact',
                'audience': 'persona:patient, persona:caregiver, persona:professional',
                'urls': [centre['website']] if centre['website'] else [],
                'notes': f"Specialist encephalitis centre in {centre['country']}",
                'source_file': 'contacts',
                'source_type': 'centre',
                'country': centre['country'],
                'suggested_tags': {
                    'personas': ['persona:patient', 'persona:caregiver', 'persona:professional'],
                    'resource_type': ['resource:professional_contact'],
                    'locations': [f"location:{centre['country'].lower().replace(' ', '_')}"] if centre['country'] else ['location:worldwide'],
                    'topics': ['topic:treatment', 'topic:diagnosis'],
                    'stages': ['stage:acute_hospital', 'stage:early_recovery']
                }
            })
        
        # Process country contacts
        contacts = self.process_country_contacts()
        for contact in contacts:
            dataset.append({
                'title': f"{contact['position']} - {contact['institution']} ({contact['country']})",
                'description': f"{contact['position']} at {contact['institution']} specializing in {contact['specialty']}",
                'full_content': f"Contact: {contact['name']}\nPosition: {contact['position']}\nInstitution: {contact['institution']}\nCountry: {contact['country']}\nSpecialty: {contact['specialty']}\nNotes: {contact['notes']}",
                'category': 'professional_contact',
                'audience': 'persona:professional',
                'urls': [],
                'notes': f"Professional contact in {contact['country']}. Specialty: {contact['specialty']}",
                'source_file': 'contacts',
                'source_type': 'professional_contact',
                'country': contact['country'],
                'suggested_tags': {
                    'personas': ['persona:professional'],
                    'resource_type': ['resource:professional_contact'],
                    'locations': [f"location:{contact['country'].lower().replace(' ', '_')}"],
                    'topics': ['topic:professional_network', 'topic:clinical']
                }
            })
        
        return dataset


def process_all_excel_files(
    crib_sheet_file: str,
    contacts_file: str,
    output_file: str
):
    """
    Process both Excel files and create combined dataset
    
    Args:
        crib_sheet_file: Path to Live chat crib sheet.xlsx
        contacts_file: Path to contacts Excel file
        output_file: Path to save combined JSON output
    """
    print("Processing Excel files...")
    
    # Process crib sheet
    print("\n1. Processing Live Chat Crib Sheet...")
    crib_processor = LiveChatCribSheetProcessor(crib_sheet_file)
    crib_dataset = crib_processor.create_tagging_dataset()
    print(f"   ✓ Extracted {len(crib_dataset)} items from crib sheet")
    
    # Process contacts
    print("\n2. Processing Contacts file...")
    contacts_processor = ContactsProcessor(contacts_file)
    contacts_dataset = contacts_processor.create_tagging_dataset()
    print(f"   ✓ Extracted {len(contacts_dataset)} items from contacts")
    
    # Combine datasets
    combined_dataset = {
        'crib_sheet_items': crib_dataset,
        'contact_items': contacts_dataset,
        'total_items': len(crib_dataset) + len(contacts_dataset),
        'metadata': {
            'source_files': [crib_sheet_file, contacts_file],
            'crib_sheet_count': len(crib_dataset),
            'contacts_count': len(contacts_dataset)
        }
    }
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_dataset, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Combined dataset saved to: {output_file}")
    print(f"  Total items: {combined_dataset['total_items']}")
    
    return combined_dataset


if __name__ == "__main__":
    # Process both files
    combined_data = process_all_excel_files(
        crib_sheet_file='Live chat crib sheet.xlsx',
        contacts_file='Encephalitis orgs, centres and country contacts_pi_removed.xlsx',
        output_file='staff_resources_dataset.json'
    )
    
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"\nDataset ready for tag refinement:")
    print(f"  - Crib sheet items: {combined_data['metadata']['crib_sheet_count']}")
    print(f"  - Contact items: {combined_data['metadata']['contacts_count']}")
    print(f"  - Total: {combined_data['total_items']}")
    print(f"\nNext step: Use bedrock_integration_example.py to refine tags")
