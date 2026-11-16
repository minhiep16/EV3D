with open('D:/EV3D/docs/graduation-internship-report/final/v3_doc_helpers.py', 'r', encoding='utf-8') as f:
    text = f.read()

pos_uc = text.find("def add_use_case_table")
print("=== add_use_case_table ===")
print(text[pos_uc:pos_uc+1000])

pos_tc = text.find("def add_test_case_table")
print("\n=== add_test_case_table ===")
print(text[pos_tc:pos_tc+1000])
