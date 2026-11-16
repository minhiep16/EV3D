with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter6_7.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pos = text.find("6.5.")
print(text[pos:pos+1500])
