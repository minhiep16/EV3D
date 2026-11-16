with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter6_7.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
cites_in_c67 = re.findall(r'\[(\d+)\]', text)
print("All [X] citations in c67:", sorted(list(set([int(x) for x in cites_in_c67]))))

for match in re.finditer(r'\[(\d+)\]', text):
    start = max(0, match.start() - 60)
    end = min(len(text), match.end() + 60)
    # only show if not inside the BIBLIOGRAPHY definition itself
    if "BIBLIOGRAPHY =" not in text[max(0, match.start()-500):match.start()]:
        print(f"Cite [{match.group(1)}]: ...{text[start:end].replace(chr(10), ' ')}...")
