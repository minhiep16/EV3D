# -*- coding: utf-8 -*-
"""
build_v4_master_docx.py - Trình biên dịch tạo tài liệu Word Báo cáo Thực tập Tốt nghiệp EVShare 3D V4 hoàn chỉnh
Nâng cấp toàn diện theo kiểm toán chất lượng nội dung và tính nhất quán kỹ thuật:
1. Thông tin sinh viên/doanh nghiệp: Giữ chuẩn hóa các khung giữ chỗ [HỌ VÀ TÊN SINH VIÊN], [MÃ SỐ SINH VIÊN], v.v.
2. Chương 1: Đầy đủ 10 mục học thuật chi tiết.
3. Chương 2: Đầy đủ 9 mục lý thuyết với 32 trích dẫn chuẩn IEEE [1]-[32].
4. Chương 3: 
   - Danh mục 68 FRs chuẩn hóa (dạng bảng native).
   - Ma trận phân quyền Role Permission Matrix (dạng bảng native).
   - Danh mục 42 BRs chuẩn hóa (dạng bảng native).
   - Phân tích NFRs, Ràng buộc, User Journey.
   - Bảng tổng quan 88 Use Cases.
   - Mục 3.9: 14 Use Case cốt lõi (15 hàng viền chuẩn).
5. Chương 4: Cấu trúc phân cấp 4.1 đến 4.10, nhúng toàn bộ 86 sơ đồ với tiêu đề song ngữ và phân tích kỹ thuật.
6. Chương 5: Đầy đủ 25 phân hệ hiện thực hóa chi tiết (5.1 đến 5.25), 20 khung giữ chỗ UI kèm Callout Box và hướng dẫn chụp ảnh, công thức WAC, Hare-Niemeyer.
7. Chương 6: Chiến lược QA, 100 Test Cases, tuyên bố NOT EXECUTED, ma trận 14 nhóm lỗi hồi quy đối chiếu chuẩn xác TC-REG-01 đến 31.
8. Chương 7: Đánh giá khách quan, ưu điểm, hạn chế, bài học, lộ trình tương lai, kết luận.
9. Thư mục Tài liệu tham khảo 32 nguồn chuẩn IEEE.
10. Phụ lục A đến N đầy đủ trong thân tài liệu:
    - Phụ lục A: 249 REST APIs chuẩn xác, không còn lỗi mảng hay trùng lặp.
    - Phụ lục B: Từ điển dữ liệu 51 bảng CSDL snake_case, sửa hoàn toàn các lỗi FK sai (token, SOH%, actualCost).
    - Phụ lục C: Bảng tổng quan 88 UCs + 74 Bảng đặc tả Use Case chi tiết không lặp generic template.
    - Phụ lục D: 100 Bảng ca kiểm thử chi tiết (NOT EXECUTED).
    - Phụ lục E - N: Đầy đủ thuyết minh và bảng dữ liệu, trong đó Phụ lục K (RTM) khớp 100% 68 FRs không gãy tham chiếu.
"""
import os
import sys
import time

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

import v3_doc_helpers as hlp
import v4_chapters_data as ch_data
import v4_canonical_catalogs as cat_data
import v4_data_usecases as uc_data
import v4_data_database as db_data
import v4_data_apis as api_data
import v4_data_testcases as tc_data
import v4_data_rtm as rtm_data

OUTPUT_DOCX = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V4.docx")

def build_v4_document():
    start_time = time.time()
    print("=" * 75)
    print("BẮT ĐẦU BIÊN DỊCH BÁO CÁO THỰC TẬP TỐT NGHIỆP EVSHARE 3D V4 (FINAL CONTENT AUDIT)")
    print("=" * 75)

    doc = hlp.create_document()
    print("-> Đã khởi tạo cấu hình Word (A4, TNR 13pt, 1.5 line spacing, lề chuẩn 3.5-2.0-2.5-2.5 cm).")

    # =========================================================================
    # PHẦN ĐẦU TÀI LIỆU (FRONT MATTER)
    # =========================================================================
    print("-> Đang tạo Phần đầu tài liệu (Front Matter)...")
    fm = ch_data.get_front_matter()

    # 1. Trang bìa chính
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst1 = p_inst.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG ĐẠI HỌC CÔNG NGHỆ\n")
    r_inst1.bold = True
    r_inst1.font.size = Pt(13)
    r_inst2 = p_inst.add_run(f"{fm['faculty']}\n-------------------***-------------------\n\n\n\n")
    r_inst2.bold = True
    r_inst2.font.size = Pt(12)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_rep = p_title.add_run("BÁO CÁO THỰC TẬP TỐT NGHIỆP\n\n")
    r_rep.bold = True
    r_rep.font.size = Pt(18)
    r_rep.font.color.rgb = RGBColor(26, 54, 93)

    r_t = p_title.add_run(f"ĐỀ TÀI:\n{fm['title_vi']}\n\n\n\n")
    r_t.bold = True
    r_t.font.size = Pt(15)
    r_t.font.color.rgb = RGBColor(44, 62, 80)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.line_spacing = 1.3
    p_meta.paragraph_format.space_before = Pt(20)
    p_meta.add_run("Ngành: ").bold = True
    p_meta.add_run("CÔNG NGHỆ THÔNG TIN\n")
    p_meta.add_run("Chuyên ngành: ").bold = True
    p_meta.add_run(f"{fm['major']}\n\n")
    p_meta.add_run("Sinh viên thực hiện: ").bold = True
    p_meta.add_run(f"{fm['student_name']}\n")
    p_meta.add_run("Mã số sinh viên: ").bold = True
    p_meta.add_run(f"{fm['student_id']}\n")
    p_meta.add_run("Lớp khóa học: ").bold = True
    p_meta.add_run(f"{fm['class_name']}\n")
    p_meta.add_run("Giảng viên hướng dẫn: ").bold = True
    p_meta.add_run(f"{fm['academic_supervisor']}\n")
    p_meta.add_run("Cán bộ hướng dẫn doanh nghiệp: ").bold = True
    p_meta.add_run(f"{fm['enterprise_supervisor']}\n")
    p_meta.add_run("Đơn vị thực tập: ").bold = True
    p_meta.add_run(f"{fm['enterprise_name']}")

    p_year = doc.add_paragraph()
    p_year.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_year.paragraph_format.space_before = Pt(40)
    r_yr = p_year.add_run(f"\n{fm['location'].upper()} – NĂM {fm['year']}")
    r_yr.bold = True
    r_yr.font.size = Pt(12)

    doc.add_page_break()

    # 2. Trang bìa phụ
    p_inst_sub = doc.add_paragraph()
    p_inst_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_inst_sub.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG ĐẠI HỌC CÔNG NGHỆ\n")
    r_s1.bold = True
    r_s1.font.size = Pt(13)
    r_s2 = p_inst_sub.add_run(f"{fm['faculty']}\n\n\n\n")
    r_s2.bold = True

    p_title_sub = doc.add_paragraph()
    p_title_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ts1 = p_title_sub.add_run("BÁO CÁO THỰC TẬP TỐT NGHIỆP\n\n")
    r_ts1.bold = True
    r_ts1.font.size = Pt(16)
    r_ts2 = p_title_sub.add_run(f"{fm['title_vi']}\n\n")
    r_ts2.bold = True
    r_ts2.font.size = Pt(14)
    r_ts3 = p_title_sub.add_run(f"({fm['title_en']})\n\n\n\n")
    r_ts3.italic = True
    r_ts3.font.size = Pt(12)

    p_meta_sub = doc.add_paragraph()
    p_meta_sub.paragraph_format.line_spacing = 1.3
    p_meta_sub.add_run(f"Sinh viên thực hiện: {fm['student_name']} – MSSV: {fm['student_id']}\n")
    p_meta_sub.add_run(f"Ngành đào tạo: {fm['major']}\n")
    p_meta_sub.add_run(f"Giảng viên hướng dẫn: {fm['academic_supervisor']}\n")
    p_meta_sub.add_run(f"Cán bộ hướng dẫn doanh nghiệp: {fm['enterprise_supervisor']}\n")
    p_meta_sub.add_run(f"Cơ quan thực tập: {fm['enterprise_name']}\n")

    p_yr_sub = doc.add_paragraph()
    p_yr_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_yr_sub.paragraph_format.space_before = Pt(60)
    p_yr_sub.add_run(f"{fm['location'].upper()} – NĂM {fm['year']}").bold = True

    doc.add_page_break()

    # 3. Lời cam đoan
    hlp.add_heading(doc, "LỜI CAM ĐOAN", level=1)
    hlp.add_p(doc, "Tôi xin cam đoan rằng toàn bộ nội dung trong bản báo cáo thực tập tốt nghiệp này là công trình nghiên cứu và thực nghiệm thực tế do chính tôi thực hiện dưới sự hướng dẫn khoa học của Giảng viên hướng dẫn và Cán bộ hướng dẫn tại doanh nghiệp tiếp nhận thực tập.")
    hlp.add_p(doc, "Mọi số liệu, trích dẫn, mã nguồn và kết quả phân tích hệ thống được trình bày trong báo cáo đều được đối chiếu trung thực từ mã nguồn thực tế của dự án EVShare 3D. Toàn bộ các tài liệu tham khảo được trích dẫn theo đúng quy chuẩn học thuật IEEE.")
    hlp.add_p(doc, "Đặc biệt, tôi xin cam đoan tuân thủ đạo đức nghiên cứu học thuật minh bạch: toàn bộ 100 ca kiểm thử trong báo cáo đều được công bố trung thực với trạng thái **NOT EXECUTED** (Chưa thực thi thực tế trong môi trường thử nghiệm vật lý), tuyệt đối không ngụy tạo kết quả kiểm thử. Tôi xin hoàn toàn chịu trách nhiệm trước Hội đồng Khoa học và Nhà trường về tính trung thực của lời cam đoan này.")
    
    p_sign = doc.add_paragraph()
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign.paragraph_format.space_before = Pt(30)
    p_sign.add_run(f"{fm['location']}, ngày ... tháng ... năm {fm['year']}\n").italic = True
    p_sign.add_run("Sinh viên thực hiện\n\n\n\n").bold = True
    p_sign.add_run(f"{fm['student_name']}\n(Ký và ghi rõ họ tên)")

    doc.add_page_break()

    # 4. Lời cảm ơn
    hlp.add_heading(doc, "LỜI CẢM ƠN", level=1)
    hlp.add_p(doc, "Để hoàn thành báo cáo thực tập tốt nghiệp này, trước hết tôi xin bày tỏ lòng biết ơn sâu sắc tới các Thầy, Cô giáo Khoa Công nghệ Thông tin, những người đã tận tâm truyền đạt tri thức nền tảng và kỹ năng kỹ nghệ phần mềm quý báu trong suốt những năm tháng học tập tại trường.")
    hlp.add_p(doc, f"Tôi xin gửi lời cảm ơn chân thành và sâu sắc nhất tới **{fm['academic_supervisor']}**, người đã luôn tận tình định hướng phương pháp luận nghiên cứu, gợi mở các giải pháp kỹ thuật và đưa ra những nhận xét học thuật xác đáng giúp tôi hoàn thiện bản báo cáo một cách chuẩn mực nhất.")
    hlp.add_p(doc, f"Tôi cũng xin chân thành cảm ơn Ban Lãnh đạo và toàn thể các anh chị kỹ sư tại **{fm['enterprise_name']}**, đặc biệt là **{fm['enterprise_supervisor']}**, đã tạo mọi điều kiện thuận lợi về môi trường làm việc, thiết bị và hạ tầng công nghệ, trực tiếp hướng dẫn và chia sẻ những kinh nghiệm thực chiến quý báu về kiến trúc phần mềm phân tán và vận hành hệ thống xe điện thực tế.")
    hlp.add_p(doc, "Cuối cùng, tôi xin gửi lời cảm ơn tới gia đình, bạn bè đã luôn động viên, khích lệ và đồng hành cùng tôi trong suốt quá trình học tập và hoàn thành đồ án tốt nghiệp này.")
    
    p_sign2 = doc.add_paragraph()
    p_sign2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign2.paragraph_format.space_before = Pt(30)
    p_sign2.add_run(f"{fm['location']}, năm {fm['year']}\n").italic = True
    p_sign2.add_run("Sinh viên thực hiện\n\n\n\n").bold = True
    p_sign2.add_run(f"{fm['student_name']}")

    doc.add_page_break()

    # 5. Phiếu nhận xét của Giảng viên hướng dẫn & Doanh nghiệp
    hlp.add_heading(doc, "NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN", level=1)
    hlp.add_p(doc, "1. Thái độ và tinh thần học tập, thực hiện nội quy thực tập của sinh viên:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "2. Mức độ đáp ứng mục tiêu và khối lượng công việc nghiên cứu được giao:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "3. Chất lượng báo cáo thực tập tốt nghiệp (cấu trúc, nội dung, tính khoa học, chuẩn trích dẫn):")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "4. Đánh giá về tính trung thực học thuật và khả năng ứng dụng thực tế:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "5. Kết luận và điểm đánh giá của Giảng viên hướng dẫn: ......... / 10 điểm.")
    hlp.add_p(doc, "Đồng ý cho sinh viên được bảo vệ trước Hội đồng:  [  ] Có      [  ] Không")

    p_gv = doc.add_paragraph()
    p_gv.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_gv.paragraph_format.space_before = Pt(20)
    p_gv.add_run(f"{fm['location']}, ngày ... tháng ... năm {fm['year']}\n").italic = True
    p_gv.add_run("Giảng viên hướng dẫn\n\n\n\n").bold = True
    p_gv.add_run(f"{fm['academic_supervisor']}\n(Ký và ghi rõ họ tên)")

    doc.add_page_break()

    hlp.add_heading(doc, "NHẬN XÉT CỦA ĐƠN VỊ THỰC TẬP TIẾP NHẬN", level=1)
    hlp.add_p(doc, f"Đơn vị tiếp nhận thực tập: **{fm['enterprise_name']}**")
    hlp.add_p(doc, f"Cán bộ hướng dẫn thực tập tại doanh nghiệp: **{fm['enterprise_supervisor']}**")
    hlp.add_p(doc, f"Sinh viên thực tập: **{fm['student_name']}** – MSSV: **{fm['student_id']}**")
    hlp.add_p(doc, "Thời gian thực tập: Từ ngày .../.../2026 đến ngày .../.../2026.")
    hlp.add_p(doc, "1. Ý thức chấp hành kỷ luật, văn hóa doanh nghiệp và bảo mật thông tin:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "2. Năng lực chuyên môn, khả năng tiếp cận công nghệ mới và giải quyết vấn đề kỹ thuật:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "3. Đóng góp cụ thể của sinh viên vào dự án EVShare 3D của đơn vị:")
    hlp.add_p(doc, "....................................................................................................................................................")
    hlp.add_p(doc, "4. Đánh giá chung và xếp loại thực tập: [  ] Xuất sắc   [  ] Giỏi   [  ] Khá   [  ] Trung bình")

    p_dn = doc.add_paragraph()
    p_dn.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_dn.paragraph_format.space_before = Pt(20)
    p_dn.add_run(f"{fm['location']}, ngày ... tháng ... năm {fm['year']}\n").italic = True
    p_dn.add_run("Đại diện đơn vị thực tập\n(Ký tên, đóng dấu)\n\n\n\n").bold = True
    p_dn.add_run(f"{fm['enterprise_supervisor']}")

    doc.add_page_break()

    # 6. Tóm tắt báo cáo (Tiếng Việt & Tiếng Anh)
    hlp.add_heading(doc, "TÓM TẮT BÁO CÁO (ABSTRACT)", level=1)
    hlp.add_p(doc, "TÓM TẮT TIẾNG VIỆT", bold=True)
    hlp.add_p(doc, "Đề tài 'Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)' tập trung giải quyết các bất cập cốt lõi trong mô hình kinh tế chia sẻ xe điện (EV Co-ownership): xung đột lịch trình sử dụng, thiếu minh bạch trong phân bổ chi phí và khó khăn trong việc giám sát trực quan trạng thái kỹ thuật của phương tiện. Hệ thống được xây dựng trên nền tảng kiến trúc phần mềm đa tầng hiện đại: Backend Spring Boot 3.3.4 (Java 21 LTS), CSDL MySQL 8.0, Frontend React 18, TypeScript và Engine đồ họa không gian ba chiều Three.js / React Three Fiber. Báo cáo đặc tả toàn diện 68 yêu cầu chức năng (FRs), 42 quy tắc nghiệp vụ (BRs), 86 sơ đồ UML chuẩn hóa và 88 ca sử dụng chi tiết. Điểm sáng của đề tài là việc ứng dụng thành công hai mô hình toán học: Thuật toán Giá vốn bình quân gia quyền (WAC) kết hợp tổn hao nạp sạc 92% theo giá điện EVN 3.850 đ/kWh cho kho năng lượng xe, và Thuật toán Phần dư lớn nhất Hare-Niemeyer bảo đảm phân bổ chi phí chính xác 100% tới từng đồng VND. Không gian Garage 3D WebGL cho phép người dùng xoay 360 độ, bóc tách linh kiện, kích hoạt chế độ X-Ray soi pin và tương tác với các điểm nóng (Hotspots) tổn hại thân vỏ. Toàn bộ 100 ca kiểm thử được công bố minh bạch trạng thái NOT EXECUTED, bảo đảm tính liêm chính học thuật cao nhất.")
    hlp.add_p(doc, "Từ khóa: Xe điện (EV), Đồng sở hữu (Co-ownership), Bản sao kỹ thuật số 3D (Digital Twin), WebGL, Three.js, Spring Boot, Thuật toán WAC, Hare-Niemeyer, UML 2.5.", italic=True)

    hlp.add_p(doc, "\nENGLISH ABSTRACT", bold=True)
    hlp.add_p(doc, "The capstone internship project entitled 'Research, Design, and Development of an Electric Vehicle Co-Ownership Management Platform Integrated with 3D Web Digital Twin (EVShare 3D)' tackles core challenges in electric vehicle shared mobility: scheduling conflicts, financial opacity in expense reconciliation, and lack of intuitive remote technical inspection. Built upon an enterprise multi-tier architecture leveraging Spring Boot 3.3.4 (Java 21 LTS), MySQL 8.0, React 18, TypeScript, and Three.js / React Three Fiber, the platform rigorously formalizes 68 Functional Requirements, 42 Business Rules, 86 UML diagrams, and 88 detailed Use Cases. Key technological contributions include the mathematical formulation of a Dynamic Weighted Average Cost (WAC) algorithm with 92% charging efficiency for vehicle energy inventory accounting, and the Hare-Niemeyer Largest Remainder Method guaranteeing zero financial loss in cost distribution. The client-side WebGL 3D Garage allows seamless 360-degree orbit navigation, component inspection, battery X-Ray transparency visualization, and pinpoint damage hotspot tagging directly in the web browser. Academic integrity is rigorously preserved with all 100 test cases transparently declared as NOT EXECUTED.")
    hlp.add_p(doc, "Keywords: Electric Vehicle (EV), Co-ownership, 3D Digital Twin, WebGL, Three.js, Spring Boot, Weighted Average Cost, Hare-Niemeyer, UML 2.5.", italic=True)

    doc.add_page_break()

    # 7. Danh mục chữ viết tắt
    hlp.add_heading(doc, "DANH MỤC CÁC TỪ VIẾT TẮT", level=1)
    abbrev_headers = ["Từ viết tắt", "Thuật ngữ tiếng Anh đầy đủ", "Ý nghĩa tiếng Việt"]
    abbrev_rows = [
        ["ACID", "Atomicity, Consistency, Isolation, Durability", "Bốn tính chất giao dịch CSDL (Nguyên tố, Nhất quán, Cô lập, Bền vững)"],
        ["API", "Application Programming Interface", "Giao diện lập trình ứng dụng"],
        ["BMS", "Battery Management System", "Hệ thống quản lý cụm pin xe điện"],
        ["BR", "Business Rule", "Quy tắc nghiệp vụ hệ thống"],
        ["CSS", "Cascading Style Sheets", "Ngôn ngữ định dạng bảng kiểu cho trang web"],
        ["DTO", "Data Transfer Object", "Đối tượng truyền nhận dữ liệu giữa các tầng"],
        ["ERD", "Entity-Relationship Diagram", "Sơ đồ thực thể liên kết cơ sở dữ liệu"],
        ["EV", "Electric Vehicle", "Phương tiện giao thông xe điện"],
        ["EVN", "Vietnam Electricity", "Tập đoàn Điện lực Việt Nam"],
        ["FPS", "Frames Per Second", "Số khung hình hiển thị trên giây (tốc độ đồ họa)"],
        ["FR", "Functional Requirement", "Yêu cầu chức năng phần mềm"],
        ["GLTF / GLB", "GL Transmission Format", "Chuẩn định dạng tệp mô hình 3D tối ưu cho Web"],
        ["GPU", "Graphics Processing Unit", "Bộ xử lý đồ họa phần cứng"],
        ["HTTP", "Hypertext Transfer Protocol", "Giao thức truyền tải siêu văn bản"],
        ["IEEE", "Institute of Electrical and Electronics Engineers", "Viện Kỹ sư Điện và Điện tử Quốc tế"],
        ["JPA", "Java Persistence API", "Giao diện lập trình lưu trữ dữ liệu bền vững của Java"],
        ["JWT", "JSON Web Token", "Chuẩn mã token xác thực an toàn định dạng JSON"],
        ["NFR", "Non-Functional Requirement", "Yêu cầu phi chức năng phần mềm"],
        ["OOAD", "Object-Oriented Analysis and Design", "Phương pháp phân tích và thiết kế hướng đối tượng"],
        ["PBR", "Physically Based Rendering", "Mô hình kết xuất vật liệu đồ họa dựa trên vật lý"],
        ["R3F", "React Three Fiber", "Bộ kết xuất Three.js khai báo cho hệ sinh thái React"],
        ["RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập dựa trên vai trò"],
        ["REST", "Representational State Transfer", "Kiểu kiến trúc dịch vụ mạng định hướng tài nguyên"],
        ["RTM", "Requirements Traceability Matrix", "Ma trận truy xuất nguồn gốc yêu cầu phần mềm"],
        ["SOC", "State of Charge", "Mức dung lượng pin khả dụng hiện tại (%)"],
        ["SOH", "State of Health", "Tỷ lệ sức khỏe suy thoái của pin so với thiết kế ban đầu (%)"],
        ["SPA", "Single Page Application", "Ứng dụng web đơn trang"],
        ["TC", "Test Case", "Ca kiểm thử phần mềm"],
        ["UC", "Use Case", "Ca sử dụng hệ thống"],
        ["UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất"],
        ["WAC", "Weighted Average Cost", "Phương pháp giá vốn bình quân gia quyền"],
        ["WebGL", "Web Graphics Library", "Thư viện đồ họa không gian 3D trên trình duyệt"]
    ]
    hlp.add_bordered_table(doc, abbrev_headers, abbrev_rows, [Cm(2.5), Cm(6.5), Cm(7.5)])

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (10 MỤC HỌC THUẬT)
    # =========================================================================
    print("-> Đang tạo Chương 1 (10 mục học thuật chi tiết)...")
    c1 = ch_data.get_chapter_1()
    hlp.add_heading(doc, c1["title"], level=1)
    hlp.add_p(doc, c1["intro"], italic=True)
    for s_title, s_content in c1["sections"]:
        hlp.add_heading(doc, s_title, level=2)
        hlp.add_p(doc, s_content)

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ (32 TRÍCH DẪN IEEE)
    # =========================================================================
    print("-> Đang tạo Chương 2 (9 mục lý thuyết với trích dẫn IEEE)...")
    c2 = ch_data.get_chapter_2()
    hlp.add_heading(doc, c2["title"], level=1)
    hlp.add_p(doc, c2["intro"], italic=True)
    for s_title, s_content in c2["sections"]:
        hlp.add_heading(doc, s_title, level=2)
        hlp.add_p(doc, s_content)

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 3: PHÂN TÍCH YÊU CẦU VÀ ĐẶC TẢ NGHIỆP VỤ (68 FRS, 42 BRS, 14 UCS)
    # =========================================================================
    print("-> Đang tạo Chương 3 (68 FRs, 42 BRs, Role Matrix, 14 UCs cốt lõi)...")
    c3 = ch_data.get_chapter_3_intro()
    hlp.add_heading(doc, c3["title"], level=1)
    hlp.add_p(doc, c3["intro"], italic=True)

    # 3.1. Bối cảnh & Stakeholders
    hlp.add_heading(doc, c3["sections"][0][0], level=2)
    hlp.add_p(doc, c3["sections"][0][1])

    # 3.2. Yêu cầu chức năng (Bảng 68 FRs chuẩn hóa)
    hlp.add_heading(doc, "3.2. Yêu cầu chức năng và Danh mục 68 FRs chuẩn hóa", level=2)
    hlp.add_p(doc, "Toàn bộ 68 yêu cầu chức năng (FRs) của hệ thống EVShare 3D được phân loại chặt chẽ theo 11 phân hệ nghiệp vụ, có đầy đủ tác nhân, tiền điều kiện, kết quả mong đợi và mã nguồn minh chứng đối chiếu:")
    
    fr_headers = ["Mã FR", "Tên yêu cầu chức năng", "Tác nhân", "Mô tả chi tiết", "Độ ưu tiên", "Minh chứng mã nguồn"]
    canonical_frs = cat_data.get_canonical_frs()
    fr_rows = []
    for f in canonical_frs:
        fr_rows.append([f["id"], f["name"], f["actor"], f["description"], f["priority"], f["source_evidence"]])
    hlp.add_bordered_table(doc, fr_headers, fr_rows, [Cm(2.0), Cm(3.2), Cm(2.2), Cm(4.6), Cm(1.8), Cm(2.7)])

    # 3.3. Ma trận phân quyền đa cấp (Role Permission Matrix)
    hlp.add_heading(doc, "3.3. Ma trận phân quyền đa cấp người dùng (Role Permission Matrix)", level=2)
    hlp.add_p(doc, "Hệ thống áp dụng mô hình kiểm soát truy cập dựa trên vai trò (RBAC) nghiêm ngặt giữa 3 vai trò: Quản trị viên (ADMIN), Nhân viên trạm (STAFF) và Đồng sở hữu (CO_OWNER):")
    
    matrix_headers = ["Phân hệ chức năng", "ADMIN", "STAFF", "CO_OWNER", "Ràng buộc bảo mật & Minh chứng"]
    matrix_data = cat_data.get_role_permission_matrix()
    matrix_rows = []
    for m in matrix_data:
        matrix_rows.append([m["module"], m["admin"], m["staff"], m["co_owner"], f"{m['restrictions']}\nNguồn: {m['source_evidence']}"])
    hlp.add_bordered_table(doc, matrix_headers, matrix_rows, [Cm(3.0), Cm(3.2), Cm(3.2), Cm(3.2), Cm(3.9)])

    # 3.4. Yêu cầu phi chức năng (NFRs)
    hlp.add_heading(doc, c3["sections"][1][0], level=2)
    hlp.add_p(doc, c3["sections"][1][1])

    # 3.5. Ràng buộc thiết kế
    hlp.add_heading(doc, c3["sections"][2][0], level=2)
    hlp.add_p(doc, c3["sections"][2][1])

    # 3.6. Danh mục 42 Quy tắc nghiệp vụ (BRs)
    hlp.add_heading(doc, "3.6. Danh mục 42 Quy tắc nghiệp vụ cốt lõi (Business Rules Catalog)", level=2)
    hlp.add_p(doc, "Toàn bộ 42 quy tắc nghiệp vụ (BRs) ràng buộc tính logic và pháp lý của hệ thống EVShare 3D được chuẩn hóa và thực thi bằng mã nguồn:")
    
    br_headers = ["Mã BR", "Tên quy tắc", "Điều kiện & Ràng buộc logic", "Cơ chế thực thi & Nguồn mã", "Use Cases"]
    canonical_brs = cat_data.get_canonical_brs()
    br_rows = []
    for b in canonical_brs:
        br_rows.append([b["id"], b["name"], b["condition"], f"{b['enforcement']}\nNguồn: {b['source_file']}", b["related_ucs"]])
    hlp.add_bordered_table(doc, br_headers, br_rows, [Cm(2.0), Cm(3.2), Cm(5.0), Cm(4.3), Cm(2.0)])

    # 3.7. Luồng nghiệp vụ cốt lõi (User Journey)
    hlp.add_heading(doc, c3["sections"][3][0], level=2)
    hlp.add_p(doc, c3["sections"][3][1])

    # 3.8. Danh mục tổng quan 88 Use Cases
    hlp.add_heading(doc, "3.8. Danh mục tổng quan 88 Ca sử dụng (Use Case Catalog)", level=2)
    hlp.add_p(doc, "Hệ thống xác lập 88 Ca sử dụng (Use Cases) bao phủ toàn diện 12 phân hệ chức năng. Bảng dưới đây tóm tắt danh mục tổng thể:")
    
    all_ucs = uc_data.get_all_use_cases()
    uc_cat_headers = ["Mã UC", "Tên Ca sử dụng", "Tác nhân chính", "Độ ưu tiên", "Yêu cầu FR liên kết", "Vị trí đặc tả"]
    uc_cat_rows = []
    for idx, u in enumerate(all_ucs, 1):
        loc = "Mục 3.9 (Chương 3)" if idx <= 14 else "Phụ lục C"
        uc_cat_rows.append([u["id"], u["name"], u["primary_actor"], u["priority"], u["related_fr"], loc])
    hlp.add_bordered_table(doc, uc_cat_headers, uc_cat_rows, [Cm(2.2), Cm(5.0), Cm(3.0), Cm(1.8), Cm(2.2), Cm(2.3)])

    # 3.9. Đặc tả 14 Use Case cốt lõi (Bảng 15 hàng có viền)
    hlp.add_heading(doc, "3.9. Đặc tả chi tiết 14 Ca sử dụng cốt lõi của hệ thống", level=2)
    hlp.add_p(doc, "Dưới đây là 14 bảng đặc tả ca sử dụng (Use Case Specifications) tiêu biểu nhất của hệ thống được lập bảng 15 hàng viền chuẩn mực. Toàn bộ 74 ca sử dụng chuyên sâu còn lại được trình bày chi tiết tại Phụ lục C:")
    
    for u in all_ucs[:14]:
        hlp.add_use_case_table(doc, u)

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ PHÂN RÃ HIERARCHICAL (86 SƠ ĐỒ)
    # =========================================================================
    print("-> Đang tạo Chương 4 (Phân cấp 4.1 đến 4.10, nhúng 86 sơ đồ)...")
    hlp.add_heading(doc, "CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG PHÂN RÃ HIERARCHICAL", level=1)
    hlp.add_p(doc, "Chương 4 trình bày toàn bộ thiết kế kiến trúc và mô hình hóa hướng đối tượng của hệ thống EVShare 3D thông qua **86 sơ đồ thiết kế phân rã** chuẩn mực từ Cấp 0 (Tổng thể) đến Cấp 3 (Thực thi chi tiết). Tất cả các sơ đồ đều được mô hình hóa trực tiếp từ mã nguồn thực tế của dự án, bảo đảm tính chân thực, nhất quán kỹ thuật và đã được loại bỏ hoàn toàn các cảnh báo PlantUML.")

    # Đọc thông tin 86 sơ đồ từ DIAGRAM_INVENTORY.md
    diag_inv_path = os.path.join(BASE_DIR, "DIAGRAM_INVENTORY.md")
    with open(diag_inv_path, "r", encoding="utf-8") as f:
        inv_text = f.read()

    import re
    diag_rows = re.findall(
        r'\|\s*(\d+)\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\(\*(.*?)\*\)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*\[`.*?`\]\(diagrams/source/(.*?)\)\s*\|\s*\[`.*?`\]\(diagrams/rendered/(.*?)\)\s*\|\s*(.*?)\s*\|',
        inv_text
    )
    print(f"   + Tìm thấy {len(diag_rows)} sơ đồ trong bảng kiểm kê.")

    # Hierarchical Sections Mapping
    # Groups:
    # 4.1: ARCH (1-6) -> 4.1.1 to 4.1.6
    # 4.2: UC (7-19) -> 4.2.1 to 4.2.13
    # 4.3: ACT (20-31) -> 4.3.1 to 4.3.12
    # 4.4: SEQ (32-54) -> 4.4.1 to 4.4.23
    # 4.5: CLASS (55-62) -> 4.5.1 to 4.5.8
    # 4.6: ERD (63-70) -> 4.6.1 to 4.6.8
    # 4.7: STATE (71-82) -> 4.7.1 to 4.7.12
    # 4.8: COMP (83-85) -> 4.8.1 to 4.8.3
    # 4.9: DEPLOY (86) -> 4.9.1
    # 4.10: Ma trận liên kết 86 sơ đồ

    sec_map_h = {
        1: ("4.1. THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE DIAGRAMS - ARCH-01 ĐẾN ARCH-06)",
            "Mô tả kiến trúc phân tầng doanh nghiệp từ tổng thể tới các tầng Client SPA, Spring Boot Backend, Quản lý trạng thái Zustand, Bảo mật JWT và Kho năng lượng WAC.", "4.1"),
        7: ("4.2. MÔ HÌNH HÓA USE CASE PHÂN RÃ (USE CASE DIAGRAMS - UC-01 ĐẾN UC-13)",
            "Mô tả phân rã các ca sử dụng theo từng nhóm tác nhân và phân hệ chức năng từ mức tổng quan tới các ca sử dụng chuyên sâu.", "4.2"),
        20: ("4.3. SƠ ĐỒ HOẠT ĐỘNG NGHIỆP VỤ (ACTIVITY DIAGRAMS - ACT-01 ĐẾN ACT-12)",
             "Mô tả luồng điều khiển và quy trình xử lý dữ liệu qua các làn bơi (swimlanes) giữa Client, Server và CSDL.", "4.3"),
        32: ("4.4. SƠ ĐỒ TUẦN TỰ TƯƠNG TÁC THÔNG ĐIỆP (SEQUENCE DIAGRAMS - SEQ-01 ĐẾN SEQ-23)",
             "Mô tả tương tác thông điệp tuần tự thời gian thực giữa các đối tượng thực thi, bảo đảm 100% sơ đồ có thông điệp phản hồi return arrow (-->).", "4.4"),
        55: ("4.5. SƠ ĐỒ LỚP THỰC THỂ VÀ MÔ HÌNH MIỀN (CLASS DIAGRAMS - CLASS-01 ĐẾN CLASS-08)",
             "Mô tả cấu trúc lớp hướng đối tượng, thuộc tính, phương thức và các mối quan hệ kết tập, kế thừa, phụ thuộc.", "4.5"),
        63: ("4.6. THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (DATABASE ERD - ERD-01 ĐẾN ERD-08)",
             "Mô tả lược đồ thực thể liên kết 51 bảng CSDL quan hệ MySQL 8.0, định nghĩa khóa chính, khóa ngoại và ràng buộc toàn vẹn.", "4.6"),
        71: ("4.7. SƠ ĐỒ MÁY TRẠNG THÁI VÒNG ĐỜI (STATE MACHINE DIAGRAMS - STATE-01 ĐẾN STATE-12)",
             "Mô tả vòng đời chuyển dịch trạng thái của các thực thể cốt lõi: Xe, Lịch đặt, Chuyến đi, Phiên sạc, Hợp đồng, Biểu quyết và Tranh chấp.", "4.7"),
        83: ("4.8. SƠ ĐỒ THÀNH PHẦN PHẦN MỀM (COMPONENT DIAGRAMS - COMP-01 ĐẾN COMP-03)",
             "Mô tả cấu trúc các khối thành phần phân cấp của Frontend React, Backend Spring Boot và không gian 3D Garage.", "4.8"),
        86: ("4.9. SƠ ĐỒ TRIỂN KHAI HẠ TẦNG VẬT LÝ VÀ MẠNG (DEPLOYMENT DIAGRAM - DEPLOY-01)",
             "Mô tả kiến trúc triển khai vật lý và phân bố nút mạng của hệ thống EVShare 3D.", "4.9")
    }

    current_sec_prefix = "4.1"
    sub_counter = 1

    for d_idx, d_info in enumerate(diag_rows, 1):
        stt, code, title_vi, title_en, domain, level, sec_loc, puml_file, png_file, desc_text = d_info
        
        # Check if new major section
        if d_idx in sec_map_h:
            sec_title, sec_desc, current_sec_prefix = sec_map_h[d_idx]
            hlp.add_heading(doc, f"\n## {sec_title}\n", level=2)
            hlp.add_p(doc, sec_desc, italic=True)
            sub_counter = 1

        hierarchical_num = f"{current_sec_prefix}.{sub_counter}"
        fig_num = f"4.{d_idx}"
        
        hlp.add_heading(doc, f"{hierarchical_num}. {title_vi} ({code})", level=3)
        hlp.insert_image_with_caption(doc, png_file, fig_num, title_vi, title_en, desc_text)
        sub_counter += 1

    # 4.10. Ma trận liên kết 86 sơ đồ
    hlp.add_heading(doc, "4.10. Bảng ma trận tổng hợp liên kết 86 sơ đồ thiết kế hệ thống", level=2)
    hlp.add_p(doc, "Bảng dưới đây tổng hợp liên kết toàn bộ 86 sơ đồ phân rã của hệ thống EVShare 3D, phân loại theo miền kiến trúc và cấp độ trừu tượng:")
    
    matrix_headers_diag = ["STT", "Mã Sơ đồ", "Tên sơ đồ thiết kế (Việt / Anh)", "Miền nghiệp vụ", "Cấp độ", "Tệp mã nguồn PlantUML"]
    matrix_rows_diag = []
    for r in diag_rows:
        matrix_rows_diag.append([r[0], r[1], f"{r[2]} ({r[3]})", r[4], r[5], r[7]])
    hlp.add_bordered_table(doc, matrix_headers_diag, matrix_rows_diag, [Cm(1.2), Cm(2.2), Cm(5.5), Cm(2.5), Cm(1.6), Cm(3.5)])

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 5: HIỆN THỰC HÓA HỆ THỐNG (25 MỤC, 20 UI PLACEHOLDERS)
    # =========================================================================
    print("-> Đang tạo Chương 5 (25 phân hệ chi tiết, 20 UI placeholders)...")
    c5 = ch_data.get_chapter_5_content()
    hlp.add_heading(doc, c5["title"], level=1)
    hlp.add_p(doc, c5["intro"], italic=True)
    
    for s_title, s_content in c5["sections"]:
        hlp.add_heading(doc, s_title, level=2)
        
        # Check if content has UI placeholder
        if "[KHUNG GIỮ CHỖ GIAO DIỆN" in s_content:
            parts = s_content.split("[KHUNG GIỮ CHỖ GIAO DIỆN")
            hlp.add_p(doc, parts[0].strip())
            
            for p_chunk in parts[1:]:
                ui_box_text = "[KHUNG GIỮ CHỖ GIAO DIỆN" + p_chunk
                # Extract box title and guide
                lines = ui_box_text.split("\n")
                box_title = lines[0].strip("[] \n")
                box_body = "\n".join(lines[1:]).strip()
                
                hlp.add_callout_box(doc, box_title, box_body, box_type="warning")
        else:
            hlp.add_p(doc, s_content)

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 6: ĐÁNH GIÁ CHẤT LƯỢNG (100 TCS, 14 NHÓM HỒI QUY THỰC TẾ)
    # =========================================================================
    print("-> Đang tạo Chương 6 (100 TCs, công bố NOT EXECUTED, 14 nhóm hồi quy thực tế)...")
    c6 = ch_data.get_chapter_6_content()
    hlp.add_heading(doc, c6["title"], level=1)
    hlp.add_p(doc, c6["intro"], italic=True)
    
    for s_title, s_content in c6["sections"]:
        hlp.add_heading(doc, s_title, level=2)
        hlp.add_p(doc, s_content)

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 7: ĐÁNH GIÁ KHÁCH QUAN, KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
    # =========================================================================
    print("-> Đang tạo Chương 7 (Đánh giá khách quan, hạn chế, roadmap)...")
    c7 = ch_data.get_chapter_7_content()
    hlp.add_heading(doc, c7["title"], level=1)
    hlp.add_p(doc, c7["intro"], italic=True)
    
    for s_title, s_content in c7["sections"]:
        hlp.add_heading(doc, s_title, level=2)
        hlp.add_p(doc, s_content)

    doc.add_page_break()

    # =========================================================================
    # THƯ MỤC TÀI LIỆU THAM KHẢO (32 NGUỒN CHUẨN IEEE)
    # =========================================================================
    print("-> Đang tạo Thư mục Tài liệu tham khảo chuẩn IEEE (32 nguồn)...")
    hlp.add_heading(doc, "TÀI LIỆU THAM KHẢO", level=1)
    hlp.add_p(doc, "Danh mục toàn bộ các tài liệu khoa học, tiêu chuẩn quốc tế và tài liệu kỹ thuật tham khảo được trích dẫn trong báo cáo theo chuẩn IEEE:")
    
    bib_list = ch_data.get_bibliography()
    for b_item in bib_list:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.line_spacing = 1.3
        p_b.paragraph_format.space_before = Pt(2)
        p_b.paragraph_format.space_after = Pt(4)
        r_b = p_b.add_run(b_item)
        r_b.font.name = "Times New Roman"
        r_b.font.size = Pt(11)

    doc.add_page_break()

    # =========================================================================
    # PHẦN PHỤ LỤC (APPENDICES A ĐẾN N)
    # =========================================================================
    print("-> Đang tạo Toàn bộ 14 Phụ lục kỹ thuật (A đến N)...")
    app_narratives = ch_data.get_appendices_narratives()

    # PHỤ LỤC A: 249 REST APIs
    print("   + Đang tạo Phụ lục A (249 REST APIs)...")
    hlp.add_heading(doc, "PHỤ LỤC A: DANH MỤC 249 REST API ENDPOINTS CHUẨN HÓA", level=1)
    hlp.add_p(doc, "Phụ lục A đặc tả danh mục toàn bộ 249 REST API Endpoints được hiện thực hóa trong tầng Backend Spring Boot của dự án EVShare 3D, phân loại theo Controller, vai trò bảo mật và đối tượng DTO truyền nhận:")
    
    all_apis = api_data.get_all_apis()
    api_headers = ["Mã API", "Phương thức", "Đường dẫn (URL Path)", "Tên Controller", "Phân quyền", "Mục đích nghiệp vụ"]
    api_rows = []
    for a in all_apis:
        api_rows.append([a["id"], a["method"], a["path"], a["controller"], a["role"], a["purpose"]])
    hlp.add_bordered_table(doc, api_headers, api_rows, [Cm(1.8), Cm(1.8), Cm(5.2), Cm(3.0), Cm(2.2), Cm(4.0)])

    doc.add_page_break()

    # PHỤ LỤC B: 51 BẢNG CSDL QUAN HỆ CHUẨN HÓA
    print("   + Đang tạo Phụ lục B (51 bảng CSDL quan hệ snake_case)...")
    hlp.add_heading(doc, "PHỤ LỤC B: TỪ ĐIỂN DỮ LIỆU 51 BẢNG CƠ SỞ DỮ LIỆU QUAN HỆ (MYSQL 8.0)", level=1)
    hlp.add_p(doc, "Phụ lục B cung cấp cấu trúc chi tiết của toàn bộ 51 bảng CSDL quan hệ MySQL 8.0 được chuẩn hóa tên cột theo định dạng snake_case, định nghĩa chính xác khóa chính (PK), khóa ngoại liên kết (FK) và mô tả nghiệp vụ học thuật chi tiết:")
    
    all_tables = db_data.get_all_tables()
    for t_idx, (t_name, t_info) in enumerate(sorted(all_tables.items()), 1):
        hlp.add_heading(doc, f"B.{t_idx}. Bảng dữ liệu: {t_name}", level=2)
        hlp.add_p(doc, f"Mục đích: {t_info.get('purpose', 'Lưu trữ thông tin phân hệ ' + t_name)}", italic=True)
        
        col_headers = ["Tên cột (Column)", "Kiểu dữ liệu", "PK", "FK", "Null", "Mặc định", "Mô tả nghiệp vụ"]
        col_rows = []
        for c in t_info.get("columns", []):
            col_rows.append([
                c["name"], c["type"], c["pk"], c["fk"], c["nullable"], c["default"], c["desc"]
            ])
        hlp.add_bordered_table(doc, col_headers, col_rows, [Cm(3.2), Cm(2.2), Cm(1.0), Cm(2.8), Cm(1.0), Cm(1.2), Cm(5.0)])

    doc.add_page_break()

    # PHỤ LỤC C: 74 BẢNG ĐẶC TẢ USE CASE CHI TIẾT
    print("   + Đang tạo Phụ lục C (74 Use Cases chi tiết không lặp)...")
    hlp.add_heading(doc, "PHỤ LỤC C: ĐẶC TẢ CHI TIẾT 74 CA SỬ DỤNG CHUYÊN SÂU", level=1)
    hlp.add_p(doc, "Phụ lục C cung cấp bảng đặc tả chi tiết của 74 ca sử dụng (Use Cases) chuyên sâu của hệ thống EVShare 3D (từ UC thứ 15 đến UC thứ 88). Mỗi ca sử dụng được mô hình hóa thành bảng 15 hàng có viền, mô tả chi tiết luồng sự kiện thực tế, tham số, luồng rẽ nhánh và luồng ngoại lệ cụ thể:")
    
    for u in all_ucs[14:]:
        hlp.add_use_case_table(doc, u)

    doc.add_page_break()

    # PHỤ LỤC D: 100 CA KIỂM THỬ CHI TIẾT DẠNG BẢNG (NOT EXECUTED)
    print("   + Đang tạo Phụ lục D (100 Test Cases chi tiết)...")
    hlp.add_heading(doc, "PHỤ LỤC D: ĐẶC TẢ CHI TIẾT 100 CA KIỂM THỬ HỆ THỐNG", level=1)
    hlp.add_p(doc, "Phụ lục D trình bày chi tiết toàn bộ 100 ca kiểm thử (69 ca chức năng + 31 ca hồi quy lịch sử). Toàn bộ các ca kiểm thử được ghi nhận trạng thái minh bạch NOT EXECUTED (Chưa thực thi thực tế) và kết quả thực tế 'Chưa ghi nhận', đối chiếu chuẩn xác với mã nguồn dự án:")
    
    all_tcs = tc_data.get_all_test_cases()
    for tc in all_tcs:
        hlp.add_test_case_table(doc, tc)

    doc.add_page_break()

    # PHỤ LỤC E - J: THUYẾT MINH VÀ BẢNG DỮ LIỆU
    print("   + Đang tạo Phụ lục E, F, G, H, I, J...")
    
    # E
    hlp.add_heading(doc, "PHỤ LỤC E: CẤU TRÚC THƯ MỤC MÃ NGUỒN BACKEND VÀ FRONTEND", level=1)
    hlp.add_p(doc, app_narratives["app_e"])
    
    # F
    hlp.add_heading(doc, "PHỤ LỤC F: HƯỚNG DẪN CÀI ĐẶT VÀ THIẾT LẬP MÔI TRƯỜNG PHÁT TRIỂN", level=1)
    hlp.add_p(doc, app_narratives["app_f"])

    # G
    hlp.add_heading(doc, "PHỤ LỤC G: DANH MỤC BIẾN MÔI TRƯỜNG VÀ CẤU HÌNH HỆ THỐNG", level=1)
    hlp.add_p(doc, app_narratives["app_g"])

    # H
    hlp.add_heading(doc, "PHỤ LỤC H: ĐẶC TẢ CHI TIẾT CÁC THÔNG ĐIỆP MÃ LỖI CHUẨN HTTP (RFC 7807)", level=1)
    hlp.add_p(doc, app_narratives["app_h"])

    # I
    hlp.add_heading(doc, "PHỤ LỤC I: BỘ QUY CHẾ MẪU VỀ QUẢN LÝ VÀ VẬN HÀNH NHÓM ĐỒNG SỞ HỮU XE ĐIỆN", level=1)
    hlp.add_p(doc, app_narratives["app_i"])

    # J
    hlp.add_heading(doc, "PHỤ LỤC J: DANH MỤC TỔNG HỢP 86 SƠ ĐỒ THIẾT KẾ HỆ THỐNG", level=1)
    hlp.add_p(doc, app_narratives["app_j"])

    doc.add_page_break()

    # PHỤ LỤC K: REQUIREMENTS TRACEABILITY MATRIX (RTM)
    print("   + Đang tạo Phụ lục K (Ma trận RTM sạch 100%)...")
    hlp.add_heading(doc, "PHỤ LỤC K: MA TRẬN TRUY XUẤT YÊU CẦU PHẦN MỀM (RTM)", level=1)
    hlp.add_p(doc, "Phụ lục K cung cấp Ma trận truy xuất yêu cầu (Requirements Traceability Matrix - RTM) bao phủ toàn bộ 68 yêu cầu chức năng (FRs), chứng minh liên kết 100% không đứt đoạn giữa Yêu cầu -> Ca sử dụng (UC) -> Quy tắc nghiệp vụ (BR) -> Sơ đồ UML -> REST API -> Bảng CSDL -> Ca kiểm thử (TC):")
    
    rtm_table_rows = rtm_data.get_rtm_rows()
    rtm_headers = ["Mã FR", "Tên yêu cầu chức năng", "Use Case", "Quy tắc BR", "Sơ đồ UML", "REST API", "CSDL", "Ca kiểm thử (TC)"]
    hlp.add_bordered_table(doc, rtm_headers, rtm_table_rows, [Cm(1.8), Cm(3.2), Cm(2.0), Cm(2.2), Cm(2.2), Cm(3.5), Cm(2.5), Cm(2.2)])

    doc.add_page_break()

    # PHỤ LỤC L: MẪU BIÊN BẢN BÀN GIAO KỸ THUẬT SỐ
    print("   + Đang tạo Phụ lục L...")
    hlp.add_heading(doc, "PHỤ LỤC L: BIỂU MẪU BIÊN BẢN BÀN GIAO VÀ NGHIỆM THU XE KỸ THUẬT SỐ", level=1)
    hlp.add_p(doc, app_narratives["app_l"])

    # PHỤ LỤC M: ĐẶC TẢ CÔNG THỨC TOÁN HỌC WAC VÀ HARE-NIEMEYER
    print("   + Đang tạo Phụ lục M...")
    hlp.add_heading(doc, "PHỤ LỤC M: ĐẶC TẢ CÔNG THỨC TOÁN HỌC WAC VÀ THUẬT TOÁN HARE-NIEMEYER", level=1)
    hlp.add_p(doc, app_narratives["app_m"])

    # PHỤ LỤC N: DANH MỤC 20 ẢNH CHỤP GIAO DIỆN CẦN BỔ SUNG
    print("   + Đang tạo Phụ lục N (20 ảnh chụp màn hình UI)...")
    hlp.add_heading(doc, "PHỤ LỤC N: DANH MỤC 20 ẢNH CHỤP MÀN HÌNH GIAO DIỆN NGƯỜI DÙNG CẦN BỔ SUNG", level=1)
    hlp.add_p(doc, app_narratives["app_n"])
    
    ui_headers = ["Mã UI", "Tên màn hình / Chức năng", "Tuyến đường dẫn (URL)", "Vai trò", "Vị trí Chương 5", "Hướng dẫn che mờ bảo mật (PII)"]
    ui_rows = [
        ["UI-01", "Màn hình Đăng Nhập Hệ thống", "/login", "Khách / All", "Mục 5.2", "Che mờ mật khẩu gõ thực"],
        ["UI-02", "Màn hình Đăng Ký Thành Viên Mới", "/register", "Khách", "Mục 5.2", "Che mờ số điện thoại cá nhân"],
        ["UI-03", "Toàn cảnh Không gian Garage 3D", "/garage", "CO_OWNER", "Mục 5.3", "Giữ nguyên thanh HUD điều khiển"],
        ["UI-04", "Khám phá Bóc tách Linh kiện Xe điện 3D", "/garage (Inspect)", "CO_OWNER", "Mục 5.4", "Chụp cánh cửa mở kèm nhãn nổi"],
        ["UI-05", "Chế độ X-Ray Soi xuyên thấu Khối Pin", "/garage (X-Ray)", "CO_OWNER", "Mục 5.5", "Chụp vỏ xe mờ và khối pin phát sáng cam"],
        ["UI-06", "Bản đồ Điểm nóng Tổn hại Thân vỏ 3D", "/vehicles/{id}/damages", "CO_OWNER / STAFF", "Mục 5.6", "Chụp các điểm Hotspot nhấp nháy trên xe"],
        ["UI-07", "Thanh trượt Carousel Chọn xe và Dock tác vụ", "/garage", "CO_OWNER", "Mục 5.7", "Chụp khu vực đáy màn hình Garage"],
        ["UI-08", "Quản lý Nhóm và Biểu đồ Cơ cấu Cổ phần", "/co-ownership/groups/{id}", "CO_OWNER", "Mục 5.8", "Giữ nguyên tỷ lệ % biểu đồ Donut"],
        ["UI-09", "Hộp thoại Khởi tạo Chuyển nhượng Cổ phần", "Modal Chuyển nhượng", "CO_OWNER", "Mục 5.9", "Che mờ số tiền nếu nhạy cảm"],
        ["UI-10", "Cổng Ký kết Hợp đồng Điện tử Onboarding", "/join?code=...", "Người được mời", "Mục 5.10", "Giữ nguyên khung vẽ chữ ký cảm ứng"],
        ["UI-11", "Lịch biểu Đặt xe Tương tác và Khử Xung đột", "/bookings", "CO_OWNER", "Mục 5.11", "Chụp các khối sự kiện màu xanh và xám"],
        ["UI-12", "Biên bản Bàn giao Xe Kỹ thuật số Hai bên", "/staff/handover/{id}", "STAFF & CO_OWNER", "Mục 5.12", "Chụp form kiểm định và 4 ô ảnh góc xe"],
        ["UI-13", "Bảng điều khiển Giám sát Sạc pin Thời gian thực", "/charging/active", "CO_OWNER / STAFF", "Mục 5.13", "Chụp biểu đồ công suất kW và % pin"],
        ["UI-14", "Báo cáo Kho Năng lượng Xe và Đơn giá WAC", "/vehicles/{id}/energy-inventory", "CO_OWNER / ADMIN", "Mục 5.14", "Chụp số dư kho kWh và giá WAC đ/kWh"],
        ["UI-15", "Bảng điều khiển Hành trình Chuyến đi Đang chạy", "ActiveTrip Panel", "CO_OWNER", "Mục 5.15", "Chụp đồng hồ thời gian và nút Trả xe"],
        ["UI-16", "Màn hình Nghiệm thu Trả xe và Hạch toán Tiền điện", "ReturnInspection Modal", "STAFF", "Mục 5.16", "Chụp mức pin tiêu thụ và tiền điện WAC"],
        ["UI-17", "Bảng Phân bổ Chi phí theo Thuật toán Hare-Niemeyer", "ExpenseBreakdown Modal", "CO_OWNER / ADMIN", "Mục 5.17", "Chụp cột làm tròn tiền lẻ VND khớp tổng 100%"],
        ["UI-18", "Màn hình Thanh toán Nợ Cá nhân và Mã VietQR", "Payment Modal", "CO_OWNER", "Mục 5.19", "Che mã số tài khoản ngân hàng thực tế"],
        ["UI-19", "Giao diện Bỏ phiếu Biểu quyết theo Trọng số Cổ phần", "/voting/proposals/{id}", "CO_OWNER", "Mục 5.21", "Chụp trọng số voteWeight của cá nhân"],
        ["UI-20", "Phòng Hòa giải Tranh chấp và Đối chiếu Bằng chứng", "/disputes/{id}", "STAFF & CÁC BÊN", "Mục 5.22", "Chụp khung chat hòa giải và danh sách chứng cứ"]
    ]
    hlp.add_bordered_table(doc, ui_headers, ui_rows, [Cm(1.8), Cm(4.5), Cm(3.2), Cm(2.2), Cm(2.0), Cm(3.3)])

    # =========================================================================
    # LƯU FILE TÀI LIỆU WORD
    # =========================================================================
    print("-> Đang ghi lưu tài liệu Word ra đĩa...")
    doc.save(OUTPUT_DOCX)
    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(OUTPUT_DOCX) / (1024 * 1024)
    print("=" * 75)
    print(f"XUẤT BẢN THÀNH CÔNG BÁO CÁO V4: {OUTPUT_DOCX}")
    print(f"Dung lượng tệp: {file_size_mb:.2f} MB")
    print(f"Thời gian biên dịch: {elapsed:.2f} giây")
    print("=" * 75)

if __name__ == "__main__":
    build_v4_document()

