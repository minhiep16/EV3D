with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter5.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(\[KHUNG GIỮ CHỖ.*?\])', text)
print(f"Found {len(matches)} UI placeholders:")
for m in matches[:5]:
    print(" ", m)
