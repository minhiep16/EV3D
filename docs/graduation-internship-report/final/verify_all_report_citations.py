import re
import v6_chapter2 as c2
import v6_chapter6_7 as c67

text_c2 = ""
for sec in c2.CHAPTER_2_SECTIONS:
    text_c2 += sec[1] + "\n"

text_c67 = ""
for sec in c67.CHAPTER_6['sections'] + c67.CHAPTER_7['sections']:
    text_c67 += sec[1] + "\n"

all_text = text_c2 + "\n" + text_c67
cites = sorted(list(set([int(x) for x in re.findall(r'\[(\d+)\]', all_text)])))

print("Total unique citations found across Ch2 and Ch6/7:", len(cites))
print("Citations list:", cites)

missing = [i for i in range(1, 33) if i not in cites]
if missing:
    print("MISSING citations from 1..32:", missing)
else:
    print("PERFECT! Exactly all 32 IEEE references [1] through [32] are cited!")

# Verify bibliography count
print("Bibliography count in c67:", len(c67.BIBLIOGRAPHY))
