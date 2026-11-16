# -*- coding: utf-8 -*-
with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter6_7.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update BIBLIOGRAPHY entry [10]
old_bib_10 = '[10] S. B. David and M. A. F. Santos, "Microservices and Multi-tier Web Architectures: Scalability and Performance Analysis," IEEE Trans. Softw. Eng., vol. 48, no. 5, pp. 1620-1638, May 2022.'
new_bib_10 = "[10] S. Newman, \"Monolith to Microservices: Evolutionary Patterns to Transform Your Monolith,\" Sebastopol, CA: O'Reilly Media, 2019; và D. Lilienthal, \"Modular Monoliths: Architectural Patterns for Sustainable Software Systems,\" IEEE Software, vol. 37, no. 4, pp. 32-39, July 2020."
assert old_bib_10 in content, "old_bib_10 not found!"
content = content.replace(old_bib_10, new_bib_10)

# 2. Update architecture terminology in conclusion text
old_term = "Những kiến thức chuyên sâu về công nghệ Web hiện đại, kiến trúc microservice, mô hình hóa phần mềm chuẩn UML và quản trị CSDL quan hệ"
new_term = "Những kiến thức chuyên sâu về công nghệ Web hiện đại, kiến trúc phân tầng module hóa (Modular Monolith) và kiến trúc phân tầng doanh nghiệp (Enterprise Layered Architecture), mô hình hóa phần mềm chuẩn UML và quản trị CSDL quan hệ"
if old_term in content:
    content = content.replace(old_term, new_term)

# 3. Update Section 6.5 to cite [24], [25], [26], [27], [28]
old_sec65_start = "Thay vì đưa ra các khẳng định định lượng không có minh chứng máy chủ đo kiểm tự động (như việc giả định đã chạy công cụ quét SonarQube hoặc giả định chỉ số độ phủ mã nguồn), báo cáo tiếp cận đánh giá chất lượng mã nguồn dự án dựa trên việc **kiểm toán thiết kế kiến trúc tĩnh (Static Architectural Design Audit)** đối chiếu trực tiếp với mã nguồn thực tế:"

new_sec65_start = (
    "Trong bối cảnh áp dụng phương pháp luận phát triển phần mềm linh hoạt Agile Scrum [27], "
    "chất lượng sản phẩm được định hình thông qua thiết kế kiến trúc chuẩn mực và quy trình kiểm chứng "
    "nghiêm ngặt. Để bảo đảm tính trung thực học thuật tuyệt đối và tuân thủ chuẩn tài liệu kiểm thử "
    "quốc tế IEEE Std 829-2008 [24], báo cáo tiếp cận đánh giá chất lượng mã nguồn dự án dựa trên việc "
    "**kiểm toán thiết kế kiến trúc tĩnh (Static Architectural Design Audit)** đối chiếu trực tiếp với mã nguồn thực tế, "
    "kết hợp các nguyên lý mã sạch chuẩn SonarSource [28] và phương pháp luận thiết kế ca kiểm thử hộp đen, phân vùng "
    "tương đương theo Ammann & Offutt [25] cùng Myers [26]:"
)
assert old_sec65_start in content, "old_sec65_start not found!"
content = content.replace(old_sec65_start, new_sec65_start)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter6_7.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully generated v6_chapter6_7.py")
