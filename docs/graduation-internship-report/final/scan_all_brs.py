import re
import v6_canonical_catalogs as cat
valid_br_ids = set(b['id'] for b in cat.CANONICAL_BRS)

for f in ['v5_chapter1.py', 'v5_chapter3.py', 'v5_appendices_narratives.py']:
    with open('D:/EV3D/docs/graduation-internship-report/final/' + f, 'r', encoding='utf-8') as fp:
        text = fp.read()
    br_refs = re.findall(r'(BR-[A-Z0-9]+-\d+)', text)
    bad_brs = [b for b in set(br_refs) if b not in valid_br_ids]
    print(f"{f}: found {len(set(br_refs))} BRs, invalid: {bad_brs}")
