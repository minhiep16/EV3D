# -*- coding: utf-8 -*-
"""
build_v5_chapter3.py - Sinh dữ liệu Chương 3 cho Báo cáo V5:
- Phân tích Stakeholder, Yêu cầu phi chức năng (dưới dạng mục tiêu nghiệm thu đề xuất),
  Ràng buộc thiết kế và Luồng nghiệp vụ cốt lõi (User Journey).
- Cập nhật số lượng chuẩn hóa: 70 FRs, 42 BRs (với BR-EXP-05 chống trùng lặp), 88 UCs.
- Điều chỉnh các phát biểu đo lường thành mục tiêu nghiệm thu kỹ thuật đề xuất (Proposed Acceptance Targets).
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"

def build_chapter3():
    path = os.path.join(BASE_DIR, "v5_chapter3.py")
    with open(path, "w", encoding="utf-8") as f:
        f.write('''# -*- coding: utf-8 -*-
"""
v5_chapter3.py - Dữ liệu Chương 3: Phân tích Yêu cầu và Đặc tả Nghiệp vụ Hệ thống (V5)
"""

CHAPTER_3_INTRO = {
    "title": "CHƯƠNG 3: PHÂN TÍCH YÊU CẦU VÀ ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG",
    "intro": (
        "Chương 3 trình bày toàn bộ kết quả phân tích yêu cầu kỹ nghệ phần mềm của hệ thống EVShare 3D theo chuẩn quốc tế. "
        "Nội dung bao gồm phân tích các bên liên quan (Stakeholders), danh mục chuẩn hóa 70 Yêu cầu chức năng (FRs), "
        "Ma trận phân quyền đa cấp (Role Permission Matrix), các tiêu chí chất lượng phi chức năng đề xuất (NFRs), "
        "danh mục chuẩn hóa 42 Quy tắc nghiệp vụ (BRs), luồng trải nghiệm người dùng cốt lõi (User Journey), "
        "và bảng đặc tả chi tiết của 14 Ca sử dụng (Use Cases) trọng tâm nhất của hệ thống."
    ),
    "sections": [
        (
            "3.1. Phân tích bối cảnh nghiệp vụ và các bên liên quan (Stakeholder Analysis)",
            "Hệ thống EVShare 3D được thiết kế phục vụ một hệ sinh thái người dùng đa dạng với các mục tiêu và quyền lợi đan xen:\\n\\n"
            "1. **Đồng sở hữu (Co-Owners):** Là các cá nhân cùng góp vốn mua và sở hữu phương tiện xe điện. Nhu cầu cốt lõi của họ là có một công cụ đặt xe công bằng, không bị chồng chéo lịch trình, theo dõi minh bạch chi phí tiền điện, tiền bảo dưỡng, tự do chuyển nhượng cổ phần và có tiếng nói bình đẳng trong các quyết định chung thông qua biểu quyết.\\n"
            "2. **Nhân viên vận hành tại trạm (Station Staff):** Là lực lượng kỹ thuật trực tiếp tại các trạm xe và trụ sạc. Trách nhiệm của họ là thực hiện kiểm tra an toàn, lập biên bản bàn giao xe kỹ thuật số trước và sau chuyến đi, chụp ảnh ghi nhận vết trầy xước, thực hiện các phiên sạc bảo dưỡng không gán nợ và đóng vai trò hòa giải viên trung gian độc lập khi xảy ra tranh chấp.\\n"
            "3. **Quản trị viên hệ thống (System Administrator):** Chịu trách nhiệm bảo đảm tính toàn vẹn của nền tảng, quản lý danh mục đội xe, giám sát bất biến vốn 100% của các nhóm, phân quyền tài khoản và tra cứu nhật ký kiểm toán (Audit Logs) để ngăn chặn gian lận.\\n"
            "4. **Xưởng dịch vụ và Đơn vị cung cấp năng lượng (Third-Party Partners):** Các gara sửa chữa ủy quyền của nhà sản xuất (như VinFast Service Center) và đơn vị điện lực EVN cung cấp hạ tầng nguồn điện phục vụ tính toán giá vốn WAC."
        ),
        (
            "3.4. Phân tích yêu cầu phi chức năng (Non-Functional Requirements - NFRs)",
            "Bên cạnh các yêu cầu chức năng, hệ thống EVShare 3D xác lập các tiêu chí chất lượng kỹ thuật đề xuất theo chuẩn ISO/IEC 25010:\\n\\n"
            "- **Mục tiêu hiệu năng hệ thống (Performance Targets - NFR-PERF):**\\n"
            "  + Thời gian phản hồi mục tiêu của các REST API truy vấn dữ liệu thông thường đạt dưới 300–500 ms trong điều kiện mạng tiêu chuẩn.\\n"
            "  + Khung nhìn đồ họa 3D WebGL hướng tới duy trì tốc độ hiển thị mượt mà (mục tiêu nghiệm thu 30–60 FPS tùy thuộc vào năng lực xử lý đồ họa phần cứng của thiết bị người dùng).\\n"
            "  + Thời gian nạp tệp mô hình 3D nén GLB mục tiêu dưới 2.5–3.5 giây trên đường truyền băng thông rộng tiêu chuẩn.\\n\\n"
            "- **Thiết kế an toàn và bảo mật dữ liệu (Security Design - NFR-SEC):**\\n"
            "  + Mật khẩu người dùng bắt buộc mã hóa một chiều bằng thuật toán BCrypt với Salt ngẫu nhiên, không thể giải mã ngược.\\n"
            "  + Mọi phiên giao tiếp mạng giữa Client và Server được thiết kế mã hóa qua giao thức HTTPS / TLS 1.3.\\n"
            "  + Áp dụng các nguyên tắc phòng vệ OWASP Top 10 tại mức thiết kế mã nguồn: JPA Prepared Statements ngăn ngừa SQL Injection, React JSX Escaping phòng chống XSS, kiến trúc Stateless JWT phòng chống CSRF và kiểm soát phân quyền tài nguyên sở hữu tại tầng Service.\\n\\n"
            "- **Độ tin cậy và toàn vẹn giao dịch (Reliability & Integrity - NFR-REL):**\\n"
            "  + Hướng tới độ sẵn sàng dịch vụ (Uptime Target) đạt tối thiểu 99.5% trong môi trường vận hành.\\n"
            "  + Toàn bộ các thao tác tài chính (chuyển nhượng cổ phần, phân bổ chi phí, thanh toán nợ) bắt buộc thực thi trong giao dịch ACID với mức cô lập nghiêm ngặt, bảo đảm tính toàn vẹn dữ liệu.\\n\\n"
            "- **Khả năng mở rộng kiến trúc (Scalability - NFR-SCA):**\\n"
            "  + Kiến trúc Backend phi trạng thái (Stateless) cho phép mở rộng quy mô theo chiều ngang thông qua việc bổ sung các nút máy chủ phía sau bộ cân bằng tải.\\n"
            "  + Lược đồ CSDL được tối ưu hóa chỉ mục (Indexes) trên các khóa ngoại và trường thời gian thường xuyên truy vấn.\\n\\n"
            "- **Tính khả dụng và trải nghiệm người dùng (Usability - NFR-USA):**\\n"
            "  + Giao diện đáp ứng (Responsive Design) tương thích tốt trên máy tính để bàn, máy tính bảng và màn hình di động.\\n"
            "  + Không gian 3D trực quan với hệ thống camera thông minh, tự động điều chỉnh góc nhìn thuận tiện cho việc tương tác và bóc tách linh kiện."
        ),
        (
            "3.5. Ràng buộc thiết kế và kiến trúc công nghệ (Design Constraints)",
            "Quá trình phân tích và thiết kế hệ thống EVShare 3D chịu sự chi phối của các ràng buộc kỹ thuật và pháp lý chặt chẽ:\\n\\n"
            "1. **Ràng buộc công nghệ Web tiêu chuẩn:** Ứng dụng phải vận hành hoàn toàn trên trình duyệt Web tiêu chuẩn hiện đại (Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari) mà không đòi hỏi người dùng cài đặt thêm plugin bên ngoài.\\n"
            "2. **Ràng buộc tuân thủ pháp lý và quy chuẩn bảo vệ dữ liệu:** Tuân thủ quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP), bảo đảm ẩn danh và che mờ các trường thông tin nhạy cảm (PII: số CCCD, số tài khoản ngân hàng, biển số xe riêng tư).\\n"
            "3. **Ràng buộc tính bất biến tài chính:** Tổng tỷ lệ phần trăm sở hữu xe của một nhóm luôn phải bằng đúng 100.0000% trong mọi thời điểm; tổng số tiền phân bổ nghĩa vụ chi phí cá nhân phải khớp chính xác 100% với số tiền hóa đơn phát sinh.\\n"
            "4. **Ràng buộc tương thích phần cứng 3D:** Thiết kế mô hình 3D phải được tối ưu hóa số lượng đa giác (Polygon Count < 150.000 Tris) và kích thước tệp texture (Texture Atlas < 2048x2048) để bảo đảm khả năng tương thích với các thiết bị di động có cấu hình hạn chế."
        ),
        (
            "3.7. Luồng trải nghiệm người dùng cốt lõi (Core User Journey)",
            "Vòng đời trải nghiệm điển hình của một thành viên đồng sở hữu trong hệ thống EVShare 3D diễn ra qua 6 bước liên kết chặt chẽ:\\n\\n"
            "1. **Gia nhập nhóm và Ký kết hợp đồng (Onboarding & Contract Signing):** Người dùng nhận mã mời tham gia nhóm, truy cập cổng số hóa xem trước dự thảo hợp đồng, cơ cấu cổ phần và tiến hành ký kết điện tử xác thực tư cách đồng sở hữu.\\n"
            "2. **Khám phá và Đặt lịch sử dụng xe (3D Exploration & Booking):** Thành viên đăng nhập, tương tác với xe trên không gian Garage 3D, kiểm tra lịch biểu khả dụng và đặt khung giờ sử dụng. Thuật toán Boundary Overlap Guard tự động kiểm tra và khóa lịch an toàn.\\n"
            "3. **Nhận xe và Kiểm định bàn giao (Handover & Inspection):** Tại trạm xe, thành viên cùng nhân viên kỹ thuật đối soát hiện trạng xe, kiểm tra ODO, mức pin, chụp ảnh 4 góc xe và xác nhận biên bản bàn giao kỹ thuật số hai bên.\\n"
            "4. **Vận hành chuyến đi (Trip Execution):** Thành viên khởi hành chuyến đi với điều kiện pin tối thiểu 20%. Hệ thống theo dõi thời gian thực hành trình, cho phép gửi yêu cầu gia hạn nếu có nhu cầu phát sinh.\\n"
            "5. **Trả xe và Nghiệm thu hoàn trả (Return & Inspection):** Thành viên đưa xe trở về trạm, nhân viên kỹ thuật kiểm định lại xe, ghi nhận vết tổn hại mới (nếu có) gắn tọa độ 3D và chốt kết thúc chuyến đi.\\n"
            "6. **Hạch toán chi phí trực tiếp và Tất toán công nợ (Direct Expense Allocation & Settlement):** Hệ thống tự động tính tiền điện theo WAC gán trực tiếp cho người lái, phân bổ chi phí chung theo % vốn bằng thuật toán Hare-Niemeyer. Thành viên chuyển khoản thanh toán qua mã VietQR và nhân viên đối soát gạch nợ thành công."
        )
    ]
}

def get_chapter_3_intro():
    return CHAPTER_3_INTRO
''')
    print("Generated v5_chapter3.py successfully.")

if __name__ == "__main__":
    build_chapter3()
