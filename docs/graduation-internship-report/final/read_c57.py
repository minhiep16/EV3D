with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find("5.7.")
print(text[pos:pos+1000])
