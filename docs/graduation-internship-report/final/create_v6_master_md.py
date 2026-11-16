with open('D:/EV3D/docs/graduation-internship-report/final/build_v5_master_md.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('v5_', 'v6_').replace('V5', 'V6')
text = text.replace('BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.md', 'BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.md')

# Replace microservice in abstract
old_abs = 'với kiến trúc microservice phân tán Spring Boot 3 mạnh mẽ'
new_abs = 'với kiến trúc phân tầng module hóa (Modular Monolith) trên nền tảng Spring Boot 3 và Java 21 vững chắc'
if old_abs in text:
    text = text.replace(old_abs, new_abs)

with open('D:/EV3D/docs/graduation-internship-report/final/build_v6_master_md.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully written build_v6_master_md.py")
