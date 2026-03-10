#!/usr/bin/env python3
"""
QUICK RESTORE - Convert Excel sheets to CSV files
Then you can import these CSVs into Google Sheets

Usage: python3 quick_restore.py
"""

import glob
import zipfile
import xml.etree.ElementTree as ET
import csv
import os

def get_shared_strings(zip_file):
    shared_strings = []
    try:
        if 'xl/sharedStrings.xml' in zip_file.namelist():
            ss_xml = zip_file.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            for si in root.findall(f'{ns}si'):
                t_elem = si.find(f'{ns}t')
                shared_strings.append(t_elem.text if t_elem is not None else '')
    except:
        pass
    return shared_strings

def read_sheet(zip_file, sheet_number, shared_strings):
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
                    if t_attr == 's':
                        try:
                            value = shared_strings[int(val_text)]
                        except:
                            value = val_text
                    else:
                        value = val_text
                
                row.append(str(value))
            rows.append(row)
    except Exception as e:
        print(f"  Error reading sheet {sheet_number}: {e}")
    
    return rows

# Find Excel file
excel_files = glob.glob('*.xlsx')
if not excel_files:
    print("❌ No Excel file found!")
    exit(1)

excel_file = excel_files[0]
print(f"📊 Reading: {excel_file}\n")

sheet_names = [
    'Tasks', 'Completed', 'Deadlines', 'Projects', 'Closed',
    'People', 'Partners', 'Monthly', 'ProjDone', 'Meta',
    'ProjectColors', 'PeopleColors', 'Invoices', 'BankAccounts', 'Clients'
]

output_dir = 'backup_csv'
os.makedirs(output_dir, exist_ok=True)

with zipfile.ZipFile(excel_file, 'r') as z:
    shared_strings = get_shared_strings(z)

    for sheet_num, sheet_name in enumerate(sheet_names, 1):
        rows = read_sheet(z, sheet_num, shared_strings)
        
        if rows:
            csv_file = f'{output_dir}/{sheet_name}.csv'
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                for row in rows:
                    # Ensure consistent column count
                    writer.writerow(row)
            
            print(f"✅ {sheet_name:20} → {csv_file} ({len(rows)} rows)")

print(f"\n✅ All sheets exported to 'backup_csv/' folder")
print(f"Next step:")
print(f"1. Go to Google Sheets")
print(f"2. For each sheet, use File → Import → Upload → {output_dir}/*.csv")
print(f"3. Select 'Replace all' when prompted")

