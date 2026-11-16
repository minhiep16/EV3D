with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(175, min(220, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
