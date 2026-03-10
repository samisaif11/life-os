#!/usr/bin/env python3
"""
RESTORE DATA from Excel backup to Google Sheets

Usage:
    python3 restore_backup.py <spreadsheet_id>

Example:
    python3 restore_backup.py 1a2b3c4d5e6f7g8h9i0j

This script:
1. Reads the PIĀNKY - Life OS Excel backup
2. Extracts all 15 sheets
3. Calls Apps Script to restore all data to Google Sheets
"""

import sys
import zipfile
import xml.etree.ElementTree as ET
import json
import glob
from google.colab import auth
from googleapiclient.discovery import build

def get_shared_strings(zip_file):
    """Extract shared strings from Excel"""
    shared_strings = []
    try:
        if 'xl/sharedStrings.xml' in zip_file.namelist():
            ss_xml = zip_file.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            for si in root.findall(f'{ns}si'):
                t_elem = si.find(f'{ns}t')
                if t_elem is not None:
                    shared_strings.append(t_elem.text or '')
                else:
                    shared_strings.append('')
    except:
        pass
    return shared_strings

def read_sheet(zip_file, sheet_number, shared_strings):
    """Read a single sheet from Excel"""
    ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    rows = []

    try:
        sheet_xml = zip_file.read(f'xl/worksheets/sheet{sheet_number}.xml')
        root = ET.fromstring(sheet_xml)

        for row_elem in root.findall(f'{ns}sheetData/{ns}row'):
            row = []
            for cell in row_elem.findall(f'{ns}c'):
                val_elem = cell.find(f'{ns}v')
                t_attr = cell.get('t', 'n')

                value = ''
                if val_elem is not None:
                    val_text = val_elem.text or ''
                    if t_attr == 's':  # String reference
                        try:
                            value = shared_strings[int(val_text)]
                        except:
                            value = val_text
                    elif t_attr == 'b':  # Boolean
                        value = val_text == '1'
                    else:
                        value = val_text

                row.append(value)
            if any(cell for cell in row):
                rows.append(row)
    except:
        pass

    return rows

def excel_to_json():
    """Convert Excel backup to JSON format"""
    # Find Excel file
    excel_files = glob.glob('*.xlsx')
    if not excel_files:
        print("❌ No Excel file found!")
        return None

    excel_file = excel_files[0]
    print(f"📊 Reading Excel: {excel_file}")

    sheet_names = [
        'Tasks', 'Completed', 'Deadlines', 'Projects', 'Closed',
        'People', 'Partners', 'Monthly', 'ProjDone', 'Meta',
        'ProjectColors', 'PeopleColors', 'Invoices', 'BankAccounts', 'Clients'
    ]

    data = {}

    with zipfile.ZipFile(excel_file, 'r') as z:
        shared_strings = get_shared_strings(z)

        for sheet_num, sheet_name in enumerate(sheet_names, 1):
            rows = read_sheet(z, sheet_num, shared_strings)
            if rows:
                # Skip header, convert rest to sheet data
                key = sheet_name.lower().replace(' ', '')
                if sheet_name == 'ProjectColors':
                    key = 'projcolors'
                elif sheet_name == 'PeopleColors':
                    key = 'pplcolors'
                elif sheet_name == 'BankAccounts':
                    key = 'bankaccts'

                # Keep as 2D array for writeSheet compatibility
                data[key] = rows[1:] if len(rows) > 1 else rows
                print(f"  ✓ {sheet_name}: {len(data[key])} rows")

    return data

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 restore_backup.py <spreadsheet_id>")
        print("Example: python3 restore_backup.py 1a2b3c4d5e6f7g8h9i0j")
        print("\nTo get your spreadsheet ID:")
        print("1. Open your Google Sheet")
        print("2. URL looks like: docs.google.com/spreadsheets/d/SPREADSHEET_ID/")
        print("3. Copy the SPREADSHEET_ID part")
        return

    spreadsheet_id = sys.argv[1]
    print(f"\n🔄 Restoring data to spreadsheet: {spreadsheet_id}\n")

    # Convert Excel to JSON
    sheet_data = excel_to_json()
    if not sheet_data:
        print("❌ Failed to read Excel file")
        return

    print(f"\n📝 Read {len(sheet_data)} sheets from Excel")

    # Try to use Apps Script API
    try:
        auth.authenticate_user()
        script = build('script', 'v1')

        # Call the restoreFromBackup function
        request = script.projects().run(body={
            'scriptId': spreadsheet_id,  # This should be the Apps Script project ID
            'function': 'restoreFromBackup',
            'parameters': [sheet_data]
        })

        response = request.execute()
        print(f"✅ Response: {response}")

    except Exception as e:
        print(f"⚠️  Apps Script API not available")
        print(f"Alternative: Use Google Sheets UI to import the data manually")
        print(f"Or paste this JSON into Apps Script console:")
        print(json.dumps(sheet_data, indent=2)[:500] + "...")

if __name__ == '__main__':
    main()
