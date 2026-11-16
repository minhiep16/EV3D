with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "5.7." in l:
        for j in range(i, min(i+15, len(lines))):
            print(f"{j+1}: {repr(lines[j])}")
        break
