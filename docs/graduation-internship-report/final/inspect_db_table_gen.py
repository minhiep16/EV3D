with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'r', encoding='utf-8') as f:
    text = f.read()

pos_db = text.find("PHỤ LỤC B:")
print(text[pos_db:pos_db+1200])
