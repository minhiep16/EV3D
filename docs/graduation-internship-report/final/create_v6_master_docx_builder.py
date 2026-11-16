with open('D:/EV3D/docs/graduation-internship-report/final/build_v5_master_docx.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace imports and names
text = text.replace('v5_', 'v6_').replace('V5', 'V6')
text = text.replace('build_v5_document', 'build_v6_document')
text = text.replace('BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx', 'BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.docx')

# Replace microservice in abstract
old_abs = 'với kiến trúc microservice phân tán Spring Boot 3 mạnh mẽ'
new_abs = 'với kiến trúc phân tầng module hóa (Modular Monolith) trên nền tảng Spring Boot 3 và Java 21 vững chắc'
assert old_abs in text, "old_abs not found in build_v5_master_docx.py!"
text = text.replace(old_abs, new_abs)

with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_docx.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully generated build_v6_master_docx.py")
