import sys, re
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_chapter2 as c2
import v5_chapter6_7 as c67

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

# find context for [1]..[32]
for i in range(1, 33):
    matches = re.findall(rf'([^\.\n]*\[{i}\][^\.\n]*)', text2)
    bib_entry = c67.BIBLIOGRAPHY[i-1] if i-1 < len(c67.BIBLIOGRAPHY) else "N/A"
    print(f"=== Citation [{i}] ===")
    if matches:
        print("  Context in Ch2:", matches[0].strip())
    else:
        print("  Context in Ch2: NOT FOUND")
    print("  Bib entry in C67:", bib_entry)
