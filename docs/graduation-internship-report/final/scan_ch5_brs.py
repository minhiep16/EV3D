import re
import v6_canonical_catalogs as cat
valid_br_ids = set(b['id'] for b in cat.CANONICAL_BRS)

with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py', 'r', encoding='utf-8') as f:
    text = f.read()

br_refs = re.findall(r'(BR-[A-Z0-9]+-\d+)', text)
print("BR refs in Ch5:", set(br_refs))
bad_brs = [b for b in set(br_refs) if b not in valid_br_ids]
print("Invalid BR refs in Ch5:", bad_brs)
