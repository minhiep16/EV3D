with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter6_7.py', 'r', encoding='utf-8') as f:
    text = f.read()

old_s = "Những kiến thức chuyên sâu về công nghệ Web hiện đại, kiến trúc microservice, mô hình hóa phần mềm chuẩn UML và quản trị dữ liệu quan hệ"
new_s = "Những kiến thức chuyên sâu về công nghệ Web hiện đại, kiến trúc phân tầng module hóa (Modular Monolith) và kiến trúc phân tầng doanh nghiệp (Enterprise Layered Architecture), mô hình hóa phần mềm chuẩn UML và quản trị dữ liệu quan hệ"

assert old_s in text, "old_s not found in v6_chapter6_7.py!"
text = text.replace(old_s, new_s)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter6_7.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated conclusion in v6_chapter6_7.py")
