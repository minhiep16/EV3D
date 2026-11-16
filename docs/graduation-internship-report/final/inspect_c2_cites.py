with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter2.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(\n.*\[\d+\].*)', text)
for m in matches:
    print(m.strip())
