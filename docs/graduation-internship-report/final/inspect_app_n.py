with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(650, min(690, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
