# -*- coding: utf-8 -*-
"""
build_v5_master_md.py - Trình biên dịch tạo tài liệu Markdown toàn văn Báo cáo V5 hoàn chỉnh
Đồng bộ 100% với tài liệu Word V5:
1. Thông tin sinh viên/doanh nghiệp: Giữ chuẩn hóa các khung giữ chỗ [HỌ VÀ TÊN SINH VIÊN], v.v.
2. Chương 1: Đầy đủ 10 mục học thuật chi tiết, kế hoạch 16 tuần đề xuất.
3. Chương 2: Đầy đủ 9 mục lý thuyết với 32 trích dẫn chuẩn IEEE [1]-[32], hạch toán năng lượng WAC chuẩn xác.
4. Chương 3: 
   - Danh mục 70 FRs chuẩn hóa (dạng bảng).
   - Ma trận phân quyền Role Permission Matrix (dạng bảng 11 hàng).
   - Danh mục 42 BRs chuẩn hóa (dạng bảng).
   - Phân tích NFRs đề xuất, Ràng buộc, User Journey.
   - Bảng tổng quan 88 Use Cases.
   - Mục 3.9: 14 Use Case cốt lõi (15 hàng chi tiết).
5. Chương 4: Cấu trúc phân cấp 4.1 đến 4.10, nhúng toàn bộ 86 sơ đồ với tiêu đề song ngữ và phân tích kỹ thuật.
6. Chương 5: Đầy đủ 25 phân hệ hiện thực hóa chi tiết (5.1 đến 5.25), Phân bổ chi phí trực tiếp tại 5.18, 20 khung giữ chỗ UI kèm hướng dẫn chụp ảnh, công thức WAC, Hare-Niemeyer.
7. Chương 6: Chiến lược QA, 100 Test Cases, tuyên bố NOT EXECUTED, ma trận 14 nhóm lỗi hồi quy đối chiếu chuẩn xác TC-REG-01 đến 31, đánh giá kiến trúc tĩnh và chỉ số nghiệm thu đề xuất tại 6.5.
8. Chương 7: Đánh giá khách quan, 6 ưu điểm, 5 hạn chế, 5 bài học, lộ trình 4 giai đoạn, kết luận.
9. Thư mục Tài liệu tham khảo 32 nguồn chuẩn IEEE.
10. Phụ lục A đến N đầy đủ trong thân tài liệu:
    - Phụ lục A: 249 REST APIs với metadata đầy đủ, phân loại legacy rõ ràng.
    - Phụ lục B: Từ điển dữ liệu 51 bảng CSDL snake_case, 0 mô tả generic, khóa ngoại chuẩn.
    - Phụ lục C: 74 Bảng đặc tả Use Case chi tiết không lặp generic template.
    - Phụ lục D: 100 Bảng ca kiểm thử chi tiết (NOT EXECUTED, actual: Chưa ghi nhận).
    - Phụ lục E - N: Đầy đủ thuyết minh và bảng dữ liệu, Phụ lục K (RTM) khớp 100% 70 FRs không gãy tham chiếu.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import v5_chapters_data as ch_data
import v5_canonical_catalogs as cat_data
import v5_data_usecases as uc_data
import v5_data_database as db_data
import v5_data_apis as api_data
import v5_data_testcases as tc_data
import v5_data_rtm as rtm_data

OUTPUT_MD = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.md")

def render_uc_markdown_table(u):
    lines = []
    lines.append(f"### {u.get('id', '')}: {u.get('name', '')}\n")
    lines.append("| Trường thông tin | Nội dung chi tiết |")
    lines.append("|:---|:---|")
    lines.append(f"| **Mã Use Case** | {u.get('id', '')} |")
    lines.append(f"| **Tên Use Case** | {u.get('name', '')} |")
    lines.append(f"| **Tác nhân chính** | {u.get('primary_actor', '')} |")
    lines.append(f"| **Tác nhân phụ** | {u.get('secondary_actor', 'Hệ thống CSDL')} |")
    lines.append(f"| **Mô tả nghiệp vụ** | {u.get('description', '')} |")
    lines.append(f"| **Mức độ ưu tiên** | {u.get('priority', 'Cao (High)')} |")
    lines.append(f"| **Điều kiện kích hoạt** | {u.get('trigger', '')} |")
    lines.append(f"| **Tiền điều kiện** | {u.get('preconditions', '')} |")
    lines.append(f"| **Hậu điều kiện** | {u.get('postconditions', '')} |")
    
    flow_str = str(u.get('main_flow', '')).replace('\n', '<br>')
    lines.append(f"| **Luồng sự kiện chính** | {flow_str} |")
    
    alt_str = str(u.get('alt_flow', '')).replace('\n', '<br>') if u.get('alt_flow') else "Không có"
    lines.append(f"| **Luồng rẽ nhánh / thay thế** | {alt_str} |")
    
    exc_str = str(u.get('exception_flow', '')).replace('\n', '<br>') if u.get('exception_flow') else "Không có"
    lines.append(f"| **Luồng ngoại lệ** | {exc_str} |")
    
    lines.append(f"| **Quy tắc nghiệp vụ** | {u.get('business_rules', '')} |")
    lines.append(f"| **Yêu cầu liên quan** | {u.get('related_fr', '')} |")
    lines.append(f"| **Ca kiểm thử liên quan** | {u.get('related_tc', '')} |")
    lines.append("\n")
    return "\n".join(lines)

def render_tc_markdown_table(tc):
    lines = []
    lines.append(f"### {tc.get('id', '')}: {tc.get('name', '')}\n")
    lines.append("| Trường thông tin | Nội dung chi tiết |")
    lines.append("|:---|:---|")
    lines.append(f"| **Mã ca kiểm thử** | {tc.get('id', '')} |")
    lines.append(f"| **Tên ca kiểm thử** | {tc.get('name', '')} |")
    lines.append(f"| **Yêu cầu / Phân hệ** | {tc.get('module') or tc.get('req_id') or tc.get('actor', '')} |")
    lines.append(f"| **Mức độ ưu tiên** | {tc.get('priority', 'High')} |")
    lines.append(f"| **Tiền điều kiện** | {tc.get('precondition') or tc.get('preconditions', '')} |")
    lines.append(f"| **Dữ liệu kiểm thử** | {tc.get('test_data', 'Dữ liệu mẫu chuẩn')} |")
    
    steps_str = str(tc.get('steps', '')).replace('\n', '<br>')
    lines.append(f"| **Các bước thực hiện** | {steps_str} |")
    
    exp_str = str(tc.get('expected', '')).replace('\n', '<br>')
    lines.append(f"| **Kết quả mong đợi** | {exp_str} |")
    lines.append(f"| **Kết quả thực tế** | {tc.get('actual', 'Chưa ghi nhận (Chưa thực thi thực tế)')} |")
    lines.append(f"| **Trạng thái kiểm thử** | **{tc.get('status', 'NOT EXECUTED')}** |")
    lines.append(f"| **Bằng chứng mã nguồn** | {tc.get('evidence', 'Chưa có (Chưa thực thi thực tế)')} |")
    lines.append("\n")
    return "\n".join(lines)

def build_markdown():
    print("=" * 75)
    print("BẮT ĐẦU BIÊN DỊCH BÁO CÁO THỰC TẬP TỐT NGHIỆP EVSHARE 3D V5 (MARKDOWN)")
    print("=" * 75)
    lines = []

    # 1. FRONT MATTER
    fm = ch_data.get_front_matter()
    lines.append(f"# BÁO CÁO THỰC TẬP TỐT NGHIỆP\n")
    lines.append(f"## {fm['title_vi']}\n")
    lines.append(f"*{fm['title_en']}*\n\n---\n")
    lines.append(f"- **Ngành:** CÔNG NGHỆ THÔNG TIN")
    lines.append(f"- **Chuyên ngành:** {fm['major']}")
    lines.append(f"- **Sinh viên thực hiện:** {fm['student_name']}")
    lines.append(f"- **Mã số sinh viên:** {fm['student_id']}")
    lines.append(f"- **Lớp khóa học:** {fm['class_name']}")
    lines.append(f"- **Giảng viên hướng dẫn:** {fm['academic_supervisor']}")
    lines.append(f"- **Cán bộ hướng dẫn doanh nghiệp:** {fm['enterprise_supervisor']}")
    lines.append(f"- **Đơn vị thực tập:** {fm['enterprise_name']}")
    lines.append(f"- **Địa điểm & Năm hoàn thành:** {fm['location']} – Năm {fm['year']}\n\n---\n")

    # Cam đoan & Cảm ơn
    lines.append("## LỜI CAM ĐOAN\n")
    lines.append("Tôi xin cam đoan rằng toàn bộ nội dung trong bản báo cáo thực tập tốt nghiệp này là công trình nghiên cứu và thực nghiệm thực tế do chính tôi thực hiện dưới sự hướng dẫn khoa học của Giảng viên hướng dẫn và Cán bộ hướng dẫn tại doanh nghiệp tiếp nhận thực tập.\n\n"
                 "Mọi số liệu, trích dẫn, mã nguồn và kết quả phân tích hệ thống được trình bày trong báo cáo đều được đối chiếu trung thực từ mã nguồn thực tế của dự án EVShare 3D. Toàn bộ các tài liệu tham khảo được trích dẫn theo đúng quy chuẩn học thuật IEEE.\n\n"
                 "Đặc biệt, tôi xin cam đoan tuân thủ đạo đức nghiên cứu học thuật minh bạch: toàn bộ 100 ca kiểm thử trong báo cáo đều được công bố trung thực với trạng thái **NOT EXECUTED** (Chưa thực thi thực tế trong môi trường thử nghiệm vật lý), tuyệt đối không ngụy tạo kết quả kiểm thử. Tôi xin hoàn toàn chịu trách nhiệm trước Hội đồng Khoa học và Nhà trường về tính trung thực của lời cam đoan này.\n\n---\n")

    lines.append("## LỜI CẢM ƠN\n")
    lines.append(f"Để hoàn thành báo cáo thực tập tốt nghiệp này, trước hết tôi xin bày tỏ lòng biết ơn sâu sắc tới các Thầy, Cô giáo Khoa Công nghệ Thông tin, những người đã tận tâm truyền đạt tri thức nền tảng và kỹ năng kỹ nghệ phần mềm quý báu trong suốt những năm tháng học tập tại trường.\n\n"
                 f"Tôi xin gửi lời cảm ơn chân thành và sâu sắc nhất tới **{fm['academic_supervisor']}**, người đã luôn tận tình định hướng phương pháp luận nghiên cứu, gợi mở các giải pháp kỹ thuật và đưa ra những nhận xét học thuật xác đáng giúp tôi hoàn thiện bản báo cáo một cách chuẩn mực nhất.\n\n"
                 f"Tôi cũng xin chân thành cảm ơn Ban Lãnh đạo và toàn thể các anh chị kỹ sư tại **{fm['enterprise_name']}**, đặc biệt là **{fm['enterprise_supervisor']}**, đã tạo mọi điều kiện thuận lợi về môi trường làm việc, thiết bị và hạ tầng công nghệ, trực tiếp hướng dẫn và chia sẻ những kinh nghiệm thực chiến quý báu về kiến trúc phần mềm phân tán và vận hành hệ thống xe điện thực tế.\n\n"
                 f"Cuối cùng, tôi xin gửi lời cảm ơn tới gia đình, bạn bè đã luôn động viên, khích lệ và đồng hành cùng tôi trong suốt quá trình học tập và hoàn thành đồ án tốt nghiệp này.\n\n---\n")

    # Phiếu nhận xét GV & DN
    lines.append("## NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN\n")
    lines.append("1. Thái độ và tinh thần học tập, thực hiện nội quy thực tập của sinh viên: ....................................\n")
    lines.append("2. Mức độ đáp ứng mục tiêu và khối lượng công việc nghiên cứu: .............................................\n")
    lines.append("3. Chất lượng báo cáo thực tập tốt nghiệp: ................................................................\n")
    lines.append("4. Đánh giá tính trung thực học thuật và khả năng ứng dụng: ................................................\n")
    lines.append("5. Điểm đánh giá: ......... / 10 điểm. Đồng ý cho sinh viên được bảo vệ: [ ] Có  [ ] Không\n\n---\n")

    lines.append("## NHẬN XÉT CỦA ĐƠN VỊ THỰC TẬP\n")
    lines.append("1. Tinh thần trách nhiệm, kỷ luật lao động và sự hòa nhập môi trường: ......................................\n")
    lines.append("2. Khả năng vận dụng kiến thức chuyên môn vào giải quyết bài toán: .........................................\n")
    lines.append("3. Kết quả thực hiện nhiệm vụ được giao tại doanh nghiệp: ..................................................\n")
    lines.append("4. Điểm đánh giá của Doanh nghiệp: ......... / 10 điểm.\n\n---\n")

    # Tóm tắt
    lines.append("## TÓM TẮT BÁO CÁO (VIETNAMESE ABSTRACT)\n")
    lines.append("Đề tài 'Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)' tập trung giải quyết các bất cập cốt lõi trong mô hình kinh tế chia sẻ xe điện (EV Co-ownership): xung đột lịch trình sử dụng, thiếu minh bạch trong phân bổ chi phí và khó khăn trong việc giám sát trực quan trạng thái kỹ thuật của phương tiện. Hệ thống được xây dựng trên nền tảng kiến trúc phần mềm đa tầng hiện đại: Backend Spring Boot 3.3.4 (Java 21 LTS), CSDL MySQL 8.0, Frontend React 18, TypeScript và Engine đồ họa không gian ba chiều Three.js / React Three Fiber. Báo cáo đặc tả toàn diện 70 yêu cầu chức năng (FRs), 42 quy tắc nghiệp vụ (BRs), 86 sơ đồ UML chuẩn hóa và 88 ca sử dụng chi tiết. Điểm sáng của đề tài là việc ứng dụng thành công hai mô hình toán học: Thuật toán Giá vốn bình quân gia quyền (WAC) kết hợp tổn hao nạp sạc 92% theo giá điện EVN 3.850 đ/kWh cho kho năng lượng xe, và Thuật toán Phần dư lớn nhất Hare-Niemeyer bảo đảm phân bổ chi phí chính xác 100% tới từng đồng VND. Không gian Garage 3D WebGL cho phép người dùng xoay 360 độ, bóc tách linh kiện, kích hoạt chế độ X-Ray soi pin và tương tác với các điểm nóng (Hotspots) tổn hại thân vỏ. Toàn bộ 100 ca kiểm thử được công bố minh bạch trạng thái NOT EXECUTED, bảo đảm tính liêm chính và trung thực học thuật.\n\n"
                 "*Từ khóa: Xe điện (EV), Đồng sở hữu, Bản sao số 3D, WebGL, Three.js, Spring Boot, Giá vốn bình quân gia quyền (WAC), Hare-Niemeyer, UML 2.5.*\n\n---\n")

    lines.append("## ABSTRACT (ENGLISH ABSTRACT)\n")
    lines.append("The project 'Research, Design, and Development of an Electric Vehicle Co-ownership Management System Integrated with Web-Based 3D Digital Twin (EVShare 3D)' systematically resolves the core operational bottlenecks of EV co-ownership: schedule contention, opaque cost sharing, and the lack of intuitive vehicle condition telemetry. Built upon a robust modern multi-tier architecture combining Spring Boot 3.3.4 (Java 21 LTS), MySQL 8.0, React 18, TypeScript, and Three.js / React Three Fiber, the platform rigorously formalizes 70 Functional Requirements, 42 Business Rules, 86 UML diagrams, and 88 detailed Use Cases. Key technological contributions include the mathematical formulation of a Dynamic Weighted Average Cost (WAC) algorithm with 92% charging efficiency for vehicle energy inventory accounting, and the Hare-Niemeyer Largest Remainder Method guaranteeing zero financial loss in cost distribution. The client-side WebGL 3D Garage allows seamless 360-degree orbit navigation, component inspection, battery X-Ray transparency visualization, and pinpoint damage hotspot tagging directly in the web browser. Academic integrity is rigorously preserved with all 100 test cases transparently declared as NOT EXECUTED.\n\n"
                 "*Keywords: Electric Vehicle (EV), Co-ownership, 3D Digital Twin, WebGL, Three.js, Spring Boot, Weighted Average Cost, Hare-Niemeyer, UML 2.5.*\n\n---\n")

    # Từ viết tắt
    lines.append("## DANH MỤC CÁC TỪ VIẾT TẮT\n")
    lines.append("| Từ viết tắt | Thuật ngữ tiếng Anh đầy đủ | Ý nghĩa tiếng Việt |")
    lines.append("|:---|:---|:---|")
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
    for abbr in abbrev_rows:
        lines.append(f"| **{abbr[0]}** | {abbr[1]} | {abbr[2]} |")
    lines.append("\n---\n")

    # 2. CHƯƠNG 1
    print("-> Đang tạo Chương 1...")
    c1 = ch_data.get_chapter_1()
    lines.append(f"# {c1['title']}\n")
    lines.append(f"*{c1['intro']}*\n\n")
    for st, text in c1["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n\n")
    lines.append("---\n")

    # 3. CHƯƠNG 2
    print("-> Đang tạo Chương 2...")
    c2 = ch_data.get_chapter_2()
    lines.append(f"# {c2['title']}\n")
    lines.append(f"*{c2['intro']}*\n\n")
    for st, text in c2["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n\n")
    lines.append("---\n")

    # 4. CHƯƠNG 3
    print("-> Đang tạo Chương 3...")
    c3 = ch_data.get_chapter_3_intro()
    lines.append(f"# {c3['title']}\n")
    lines.append(f"*{c3['intro']}*\n\n")

    # 3.1
    lines.append(f"## {c3['sections'][0][0]}\n")
    lines.append(c3['sections'][0][1] + "\n\n")

    # 3.2: 70 FRs
    lines.append("## 3.2. Yêu cầu Chức năng và Danh mục 70 FRs Chuẩn hóa\n")
    lines.append("| Mã FR | Tên yêu cầu chức năng | Tác nhân | Mô tả chi tiết | Độ ưu tiên | Minh chứng mã nguồn |")
    lines.append("|:---|:---|:---|:---|:---:|:---|")
    canonical_frs = cat_data.get_canonical_frs()
    for f in canonical_frs:
        lines.append(f"| **{f['id']}** | {f['name']} | {f['actor']} | {f['description']} | {f['priority']} | `{f['source_evidence']}` |")
    lines.append("\n\n")

    # 3.3: Role Permission Matrix
    lines.append("## 3.3. Ma trận Phân quyền Đa cấp Người dùng (Role Permission Matrix)\n")
    lines.append("| Phân hệ chức năng | ADMIN | STAFF | CO_OWNER | Ràng buộc bảo mật & Minh chứng |")
    lines.append("|:---|:---|:---|:---|:---|")
    matrix_data = cat_data.get_role_permission_matrix()
    for m in matrix_data:
        lines.append(f"| **{m['module']}** | {m['admin']} | {m['staff']} | {m['co_owner']} | {m['restrictions']}<br>*(Nguồn: `{m['source_evidence']}`)* |")
    lines.append("\n\n")

    # 3.4
    lines.append(f"## {c3['sections'][1][0]}\n")
    lines.append(c3['sections'][1][1] + "\n\n")

    # 3.5
    lines.append(f"## {c3['sections'][2][0]}\n")
    lines.append(c3['sections'][2][1] + "\n\n")

    # 3.6: 42 BRs
    lines.append("## 3.6. Danh mục 42 Quy tắc Nghiệp vụ Cốt lõi (Business Rules Catalog)\n")
    lines.append("| Mã BR | Tên quy tắc | Điều kiện & Ràng buộc logic | Cơ chế thực thi & Nguồn mã | Use Cases |")
    lines.append("|:---|:---|:---|:---|:---|")
    canonical_brs = cat_data.get_canonical_brs()
    for b in canonical_brs:
        lines.append(f"| **{b['id']}** | {b['name']} | {b['condition']} | {b['enforcement']}<br>*(Nguồn: `{b['source_file']}`)* | {b['related_ucs']} |")
    lines.append("\n\n")

    # 3.7
    lines.append(f"## {c3['sections'][3][0]}\n")
    lines.append(c3['sections'][3][1] + "\n\n")

    # 3.8: 88 UCs overview
    lines.append("## 3.8. Danh mục Tổng quan 88 Ca Sử dụng (Use Case Catalog)\n")
    lines.append("| Mã UC | Tên Ca sử dụng | Tác nhân chính | Độ ưu tiên | Yêu cầu FR liên kết | Vị trí đặc tả |")
    lines.append("|:---|:---|:---|:---:|:---:|:---|")
    all_ucs = uc_data.get_all_use_cases()
    for idx, u in enumerate(all_ucs, 1):
        loc = "Mục 3.9 (Chương 3)" if idx <= 14 else "Phụ lục C"
        lines.append(f"| **{u['id']}** | {u['name']} | {u['primary_actor']} | {u['priority']} | {u['related_fr']} | {loc} |")
    lines.append("\n\n")

    # 3.9: 14 Core UCs
    lines.append("## 3.9. Đặc tả Chi tiết 14 Ca Sử dụng Cốt lõi của Hệ thống\n")
    for u in all_ucs[:14]:
        lines.append(render_uc_markdown_table(u))
    lines.append("---\n")

    # 5. CHƯƠNG 4: 86 DIAGRAMS
    print("-> Đang tạo Chương 4 (86 Sơ đồ)...")
    lines.append("# CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG PHÂN RÃ HIERARCHICAL\n")
    lines.append("Chương 4 trình bày toàn bộ thiết kế kiến trúc và mô hình hóa hướng đối tượng của hệ thống EVShare 3D thông qua **86 sơ đồ thiết kế phân rã** chuẩn mực từ Cấp 0 đến Cấp 3.\n\n")

    diag_inv_path = os.path.join(BASE_DIR, "DIAGRAM_INVENTORY.md")
    with open(diag_inv_path, "r", encoding="utf-8") as f:
        inv_text = f.read()

    import re
    diag_rows = re.findall(
        r'\|\s*(\d+)\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\(\*(.*?)\*\)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*\[`.*?`\]\(diagrams/source/(.*?)\)\s*\|\s*\[`.*?`\]\(diagrams/rendered/(.*?)\)\s*\|\s*(.*?)\s*\|',
        inv_text
    )

    sec_map_h = {
        1: ("4.1. Thiết kế Kiến trúc Hệ thống (ARCH-01 đến ARCH-06)", "Kiến trúc phân tầng doanh nghiệp từ tổng thể tới chi tiết.", "4.1"),
        7: ("4.2. Mô hình hóa Use Case Phân rã (UC-01 đến UC-13)", "Phân rã các ca sử dụng theo từng phân hệ chức năng.", "4.2"),
        20: ("4.3. Sơ đồ Hoạt động Nghiệp vụ (ACT-01 đến ACT-12)", "Luồng điều khiển và quy trình xử lý dữ liệu qua các làn bơi.", "4.3"),
        32: ("4.4. Sơ đồ Tuần tự Tương tác Thông điệp (SEQ-01 đến SEQ-23)", "Tương tác tuần tự thời gian thực giữa các thành phần phần mềm.", "4.4"),
        55: ("4.5. Sơ đồ Lớp Thực thể và Mô hình Miền (CLASS-01 đến CLASS-08)", "Cấu trúc hướng đối tượng, thuộc tính, phương thức và quan hệ.", "4.5"),
        63: ("4.6. Thiết kế Cơ sở Dữ liệu Quan hệ (ERD-01 đến ERD-08)", "Lược đồ 51 bảng CSDL quan hệ MySQL 8.0 chuẩn 3NF.", "4.6"),
        71: ("4.7. Sơ đồ Máy Trạng thái Vòng đời (STATE-01 đến STATE-12)", "Vòng đời chuyển dịch trạng thái của các thực thể nghiệp vụ cốt lõi.", "4.7"),
        83: ("4.8. Sơ đồ Thành phần Phần mềm (COMP-01 đến COMP-03)", "Cấu trúc module của Frontend, Backend và 3D Garage.", "4.8"),
        86: ("4.9. Sơ đồ Triển khai Hạ tầng Vật lý và Mạng (DEPLOY-01)", "Kiến trúc triển khai vật lý và phân bố nút mạng.", "4.9")
    }

    current_sec_prefix = "4.1"
    sub_counter = 1

    for d_idx, d_info in enumerate(diag_rows, 1):
        stt, code, title_vi, title_en, domain, level, sec_loc, puml_file, png_file, desc_text = d_info
        if d_idx in sec_map_h:
            sec_title, sec_desc, current_sec_prefix = sec_map_h[d_idx]
            lines.append(f"## {sec_title}\n\n*{sec_desc}*\n\n")
            sub_counter = 1

        hierarchical_num = f"{current_sec_prefix}.{sub_counter}"
        fig_num = f"4.{d_idx}"
        lines.append(f"### {hierarchical_num}. {title_vi} ({code})\n")
        lines.append(f"![Hình {fig_num}: {title_vi} ({title_en})](diagrams/{png_file})\n")
        lines.append(f"*Hình {fig_num}: {title_vi} ({title_en})*\n\n")
        lines.append(f"{desc_text}\n\n")
        sub_counter += 1

    # Matrix 86 diagrams
    lines.append("## 4.10. Bảng Ma trận Tổng hợp Liên kết 86 Sơ đồ Thiết kế Hệ thống\n")
    lines.append("| STT | Mã Sơ đồ | Tên sơ đồ thiết kế (Việt / Anh) | Miền nghiệp vụ | Cấp độ | Tệp mã nguồn PlantUML |")
    lines.append("|:---|:---|:---|:---|:---|:---|")
    for r in diag_rows:
        lines.append(f"| {r[0]} | **{r[1]}** | {r[2]} ({r[3]}) | {r[4]} | {r[5]} | `{r[7]}` |")
    lines.append("\n---\n")

    # 6. CHƯƠNG 5
    print("-> Đang tạo Chương 5...")
    c5 = ch_data.get_chapter_5_content()
    lines.append(f"# {c5['title']}\n")
    lines.append(f"*{c5['intro']}*\n\n")
    for st, text in c5["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n\n")
    lines.append("---\n")

    # 7. CHƯƠNG 6
    print("-> Đang tạo Chương 6...")
    c6 = ch_data.get_chapter_6_content()
    lines.append(f"# {c6['title']}\n")
    lines.append(f"*{c6['intro']}*\n\n")
    for st, text in c6["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n\n")
    lines.append("---\n")

    # 8. CHƯƠNG 7
    print("-> Đang tạo Chương 7...")
    c7 = ch_data.get_chapter_7_content()
    lines.append(f"# {c7['title']}\n")
    lines.append(f"*{c7['intro']}*\n\n")
    for st, text in c7["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n\n")
    lines.append("---\n")

    # 9. TÀI LIỆU THAM KHẢO
    print("-> Đang tạo Tài liệu tham khảo...")
    lines.append("# TÀI LIỆU THAM KHẢO\n")
    lines.append("Danh mục 32 nguồn tài liệu khoa học, tiêu chuẩn quốc tế và tài liệu kỹ thuật chuẩn IEEE:\n\n")
    bib_list = ch_data.get_bibliography()
    for b_item in bib_list:
        lines.append(f"{b_item}\n\n")
    lines.append("---\n")

    # 10. PHỤ LỤC A - N
    print("-> Đang tạo Phụ lục A đến N...")
    app_narratives = ch_data.get_appendices_narratives()

    # PHỤ LỤC A
    lines.append("# PHỤ LỤC A: DANH MỤC 249 REST API ENDPOINTS CHUẨN HÓA\n")
    lines.append("| Mã API | Phương thức | Đường dẫn (URL Path) | Tên Controller | Phân quyền & Ràng buộc | Mục đích & DTOs |")
    lines.append("|:---|:---|:---|:---|:---|:---|")
    all_apis = api_data.get_all_apis()
    for a in all_apis:
        role_info = f"{a['role']} ({a.get('ownership_condition', 'N/A')})"
        purpose_info = f"{a['purpose']} (Req: {a.get('request_dto', '-')} | Res: {a.get('response_dto', '-')})"
        lines.append(f"| **{a['id']}** | `{a['method']}` | `{a['path']}` | `{a['controller']}` | {role_info} | {purpose_info} |")
    lines.append("\n---\n")

    # PHỤ LỤC B
    lines.append("# PHỤ LỤC B: TỪ ĐIỂN DỮ LIỆU 51 BẢNG CƠ SỞ DỮ LIỆU QUAN HỆ (MYSQL 8.0)\n")
    all_tables = db_data.get_all_tables()
    for t_idx, (t_name, t_info) in enumerate(sorted(all_tables.items()), 1):
        lines.append(f"## B.{t_idx}. Bảng dữ liệu: `{t_name}`\n")
        lines.append(f"*Mục đích: {t_info.get('purpose', 'Lưu trữ thông tin phân hệ ' + t_name)}*\n\n")
        lines.append("| Tên cột (Column) | Kiểu dữ liệu | PK | FK | Null | Mặc định | Mô tả nghiệp vụ |")
        lines.append("|:---|:---|:---:|:---:|:---:|:---|:---|")
        for c in t_info.get("columns", []):
            lines.append(f"| `{c['name']}` | {c['type']} | {c['pk']} | {c['fk']} | {c['nullable']} | {c['default']} | {c['desc']} |")
        lines.append("\n\n")
    lines.append("---\n")

    # PHỤ LỤC C
    lines.append("# PHỤ LỤC C: ĐẶC TẢ CHI TIẾT 74 CA SỬ DỤNG CHUYÊN SÂU\n")
    lines.append("Phụ lục C cung cấp đặc tả 74 ca sử dụng chuyên sâu (từ UC thứ 15 đến UC thứ 88) dưới định dạng bảng 15 hàng có viền, mô tả chi tiết luồng nghiệp vụ thực tế:\n\n")
    for u in all_ucs[14:]:
        lines.append(render_uc_markdown_table(u))
    lines.append("---\n")

    # PHỤ LỤC D
    lines.append("# PHỤ LỤC D: ĐẶC TẢ CHI TIẾT 100 CA KIỂM THỬ HỆ THỐNG\n")
    lines.append("Toàn bộ 100 ca kiểm thử với trạng thái minh bạch NOT EXECUTED:\n\n")
    all_tcs = tc_data.get_all_test_cases()
    for tc in all_tcs:
        lines.append(render_tc_markdown_table(tc))
    lines.append("---\n")

    # PHỤ LỤC E - J
    lines.append("# PHỤ LỤC E: CẤU TRÚC THƯ MỤC MÃ NGUỒN BACKEND VÀ FRONTEND\n\n")
    lines.append(app_narratives["app_e"] + "\n\n---\n")

    lines.append("# PHỤ LỤC F: HƯỚNG DẪN CÀI ĐẶT VÀ THIẾT LẬP MÔI TRƯỜNG PHÁT TRIỂN\n\n")
    lines.append(app_narratives["app_f"] + "\n\n---\n")

    lines.append("# PHỤ LỤC G: DANH MỤC BIẾN MÔI TRƯỜNG VÀ CẤU HÌNH HỆ THỐNG\n\n")
    lines.append(app_narratives["app_g"] + "\n\n---\n")

    lines.append("# PHỤ LỤC H: ĐẶC TẢ CHI TIẾT CÁC THÔNG ĐIỆP MÃ LỖI CHUẨN HTTP (RFC 7807)\n\n")
    lines.append(app_narratives["app_h"] + "\n\n---\n")

    lines.append("# PHỤ LỤC I: BỘ QUY CHẾ MẪU VỀ QUẢN LÝ VÀ VẬN HÀNH NHÓM ĐỒNG SỞ HỮU XE ĐIỆN\n\n")
    lines.append(app_narratives["app_i"] + "\n\n---\n")

    lines.append("# PHỤ LỤC J: DANH MỤC TỔNG HỢP 86 SƠ ĐỒ THIẾT KẾ HỆ THỐNG\n\n")
    lines.append(app_narratives["app_j"] + "\n\n---\n")

    # PHỤ LỤC K: RTM
    lines.append("# PHỤ LỤC K: MA TRẬN TRUY XUẤT YÊU CẦU PHẦN MỀM (RTM)\n")
    lines.append("| Mã FR | Tên yêu cầu chức năng | Use Case | Quy tắc BR | Sơ đồ UML | REST API | CSDL | Ca kiểm thử (TC) |\n")
    lines.append("|:---|:---|:---|:---|:---|:---|:---|:---|\n")
    rtm_table_rows = rtm_data.get_rtm_rows()
    for r in rtm_table_rows:
        lines.append(f"| **{r[0]}** | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {r[7]} |\n")
    lines.append("\n---\n")

    # PHỤ LỤC L
    lines.append("# PHỤ LỤC L: BIỂU MẪU BIÊN BẢN BÀN GIAO VÀ NGHIỆM THU XE KỸ THUẬT SỐ\n\n")
    lines.append(app_narratives["app_l"] + "\n\n---\n")

    # PHỤ LỤC M
    lines.append("# PHỤ LỤC M: ĐẶC TẢ CÔNG THỨC TOÁN HỌC WAC VÀ THUẬT TOÁN HARE-NIEMEYER\n\n")
    lines.append(app_narratives["app_m"] + "\n\n---\n")

    # PHỤ LỤC N
    lines.append("# PHỤ LỤC N: DANH MỤC 20 ẢNH CHỤP MÀN HÌNH GIAO DIỆN NGƯỜI DÙNG CẦN BỔ SUNG\n\n")
    lines.append(app_narratives["app_n"] + "\n\n")
    lines.append("| Mã UI | Tên màn hình / Chức năng | Tuyến đường dẫn (URL) | Vai trò | Vị trí Chương 5 | Hướng dẫn che mờ bảo mật (PII) |\n")
    lines.append("|:---|:---|:---|:---|:---|:---|\n")
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
    for r in ui_rows:
        lines.append(f"| **{r[0]}** | {r[1]} | `{r[2]}` | {r[3]} | {r[4]} | {r[5]} |\n")
    lines.append("\n")

    print(f"-> Đang ghi lưu Markdown ra đĩa: {OUTPUT_MD}...")
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.writelines(lines)
    
    file_size_kb = os.path.getsize(OUTPUT_MD) / 1024
    print("=" * 75)
    print(f"XUẤT BẢN THÀNH CÔNG BÁO CÁO V5 (MARKDOWN): {OUTPUT_MD}")
    print(f"Dung lượng tệp: {file_size_kb:.2f} KB ({len(lines)} dòng)")
    print("=" * 75)

if __name__ == "__main__":
    build_markdown()
