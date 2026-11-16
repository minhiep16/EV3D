with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if 'tc_data' in line or 'uc_data' in line or 'add_usecase_table' in line:
        print(f"Line {idx}: {line.strip()}")
