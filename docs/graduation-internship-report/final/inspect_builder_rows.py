with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pos_tc = text.find("tc['id']")
print("TC table generation snippet:\n", text[pos_tc-200:pos_tc+600])

pos_uc = text.find("uc['id']")
print("\nUC table generation snippet:\n", text[pos_uc-200:pos_uc+600])
