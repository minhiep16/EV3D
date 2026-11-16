import sys, re
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_chapter2 as c2
import v5_chapter6_7 as c67

# Find all [X] citations in chapter 2
text2 = ""
for attr in dir(c2):
    if not attr.startswith('_'):
        val = getattr(c2, attr)
        if isinstance(val, str):
            text2 += val + "\n"
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, str):
                    text2 += item + "\n"
                elif isinstance(item, tuple) and len(item) > 1:
                    text2 += str(item[1]) + "\n"

cites_in_c2 = re.findall(r'\[(\d+)\]', text2)
cites_in_c2_unique = sorted(list(set([int(x) for x in cites_in_c2])))
print("Citations in Chapter 2 (unique):", cites_in_c2_unique)

# Check bib in c67
bib = getattr(c67, 'BIBLIOGRAPHY', [])
print(f"Total bibliography entries in c67: {len(bib)}")
for b in bib[:5]:
    print(b)
