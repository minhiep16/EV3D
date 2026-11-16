# -*- coding: utf-8 -*-
"""
v4_appendices_narratives.py - Thuyết minh chi tiết các Phụ lục E, F, G, H, I, J, K, L, M, N
cho Báo cáo Thực tập Tốt nghiệp V4.
"""

APPENDICES_NARRATIVES = {
    "app_e": (
        "Phụ lục E trình bày chi tiết cây cấu trúc phân mục toàn bộ mã nguồn của dự án EVShare 3D, "
        "thể hiện sự phân tầng trách nhiệm rõ ràng giữa Frontend React TypeScript (gồm các thư mục components/3d, panels, store, services) "
        "và Backend Spring Boot Java 21 (gồm 14 module chức năng, config, security, entity, dto, repository, service, controller), "
        "cùng hệ thống 46 tệp migration Flyway SQL bảo đảm tính nhất quán của lược đồ CSDL."
    ),
    "app_f": (
        "Phụ lục F cung cấp tài liệu hướng dẫn kỹ thuật từng bước (Step-by-step Technical Manual) "
        "để thiết lập môi trường phát triển cục bộ (Local Development Environment):\n"
        "1. Cài đặt OpenJDK 21 LTS (Oracle / Eclipse Temurin) và cấu hình biến môi trường JAVA_HOME.\n"
        "2. Cài đặt hệ quản trị CSDL MySQL 8.0, cấu hình bộ ký tự UTF-8 (utf8mb4_unicode_ci), cổng mặc định 3306.\n"
        "3. Cài đặt môi trường Node.js (v20.x LTS) và trình quản lý gói npm / pnpm.\n"
        "4. Biên dịch và khởi chạy máy chủ Backend Spring Boot qua lệnh `mvn spring-boot:run` (cổng 8080).\n"
        "5. Cài đặt thư viện phụ thuộc và khởi động máy chủ phát triển Frontend qua lệnh `npm run dev` (Vite, cổng 3000 / 5173)."
    ),
    "app_g": (
        "Phụ lục G đặc tả danh mục toàn bộ các biến môi trường và tham số cấu hình hệ thống (Environment Variables):\n"
        "- `SPRING_DATASOURCE_URL`: Chuỗi kết nối JDBC tới máy chủ MySQL (`jdbc:mysql://localhost:3306/evshare3d?useSSL=false&serverTimezone=UTC`).\n"
        "- `SPRING_DATASOURCE_USERNAME` / `PASSWORD`: Thông tin định danh truy cập CSDL an toàn.\n"
        "- `JWT_SECRET`: Chuỗi khóa bí mật HMAC-SHA256 có độ dài tối thiểu 512-bit dùng để ký số các token xác thực.\n"
        "- `JWT_ACCESS_EXPIRATION`: Thời hạn sống của Access Token (900.000 ms = 15 phút).\n"
        "- `JWT_REFRESH_EXPIRATION`: Thời hạn sống của Refresh Token (604.800.000 ms = 7 ngày).\n"
        "- `ENERGY_TARIFF_PER_KWH`: Đơn giá điện năng cơ sở áp dụng cho trạm sạc EVN (3.850 đ/kWh).\n"
        "- `ENERGY_CHARGING_EFFICIENCY`: Hệ số tổn hao hiệu suất nạp pin xe điện (0.92 = 92%)."
    ),
    "app_h": (
        "Phụ lục H đặc tả từ điển cấu trúc phản hồi mã lỗi chuẩn mực của hệ thống EVShare 3D theo chuẩn RFC 7807 (Problem Details for HTTP APIs):\n"
        "- `400 BAD REQUEST`: Dữ liệu đầu vào vi phạm Bean Validation (mật khẩu yếu, số km âm, mức pin < 20% khi khởi hành).\n"
        "- `401 UNAUTHORIZED`: Thiếu Bearer Token, token hết hạn hoặc chữ ký JWT không hợp lệ.\n"
        "- `403 FORBIDDEN`: Không có quyền truy cập vai trò (RBAC) hoặc vi phạm quy tắc No Self-Approval trong duyệt thanh toán.\n"
        "- `404 NOT FOUND`: Không tìm thấy bản ghi tài nguyên mục tiêu trong CSDL (sai userId, vehicleId, bookingId).\n"
        "- `409 CONFLICT`: Xung đột dữ liệu (trùng email/số điện thoại, xung đột lịch đặt xe, vi phạm bất biến vốn 100%).\n"
        "- `500 INTERNAL SERVER ERROR`: Lỗi ngoại lệ máy chủ chưa được kiểm soát; hệ thống tự động ghi log ẩn chi tiết stack trace để bảo mật."
    ),
    "app_i": (
        "Phụ lục I cung cấp nguyên văn bộ Quy chế mẫu về Quản lý và Vận hành Nhóm Đồng sở hữu Xe điện (Co-Ownership Bylaws):\n"
        "- **Chương I - Quy định chung:** Định nghĩa tư cách thành viên, tỷ lệ vốn góp và bất biến tổng cổ phần 100.0000%.\n"
        "- **Chương II - Quy chế sử dụng xe:** Hạn ngạch giờ đặt xe hàng tháng tỷ lệ thuận theo % cổ phần; nguyên tắc đặt xe trước tối thiểu 30 phút; quy định về hủy lịch sát giờ và phạt điểm tín nhiệm.\n"
        "- **Chương III - Hạch toán tài chính:** Cách tính tiền điện theo giá vốn bình quân gia quyền WAC; phân bổ chi phí sửa chữa theo thuật toán Hare-Niemeyer; thời hạn đóng tiền định kỳ 7 ngày sau sao kê.\n"
        "- **Chương IV - Biểu quyết dân chủ:** Ngưỡng quá bán 50% cho quyết định thường và 66% cho sửa chữa lớn > 5.000.000 đ.\n"
        "- **Chương V - Chuyển nhượng và Rút lui:** Nghĩa vụ tất toán nợ trước khi chuyển nhượng; quyền ưu tiên mua nội bộ của các cổ đông hiện hữu; tự động ban hành phụ lục hợp đồng mới."
    ),
    "app_j": (
        "Phụ lục J cung cấp bảng tổng kiểm kê toàn bộ **86 sơ đồ thiết kế hệ thống** được mô hình hóa bằng PlantUML và kết xuất đồ họa chất lượng cao trong báo cáo, "
        "liệt kê chi tiết mã sơ đồ (ARCH-01..06, UC-01..13, ACT-01..12, SEQ-01..23, CLASS-01..08, ERD-01..08, STATE-01..12, COMP-01..03, DEPLOY-01), "
        "tên tiếng Việt, tên tiếng Anh, phân loại cấp độ mô hình và đường dẫn tệp nguồn mã hóa."
    ),
    "app_l": (
        "Phụ lục L cung cấp biểu mẫu chuẩn của **Biên bản Bàn giao và Nghiệm thu Xe Kỹ thuật số (Digital Vehicle Handover Form)** "
        "được tạo tự động trên ứng dụng di động giữa Nhân viên trực trạm và Đồng sở hữu nhận xe, bao gồm các mục kiểm tra an toàn 12 điểm, "
        "số km công tơ mét, mức pin ban đầu và kết thúc, ảnh chụp hiện trạng 4 góc và mã băm chữ ký điện tử hai phía."
    ),
    "app_m": (
        "Phụ lục M đặc tả công thức toán học chuyên sâu và mã giả thuật toán (Pseudocode) của hai thuật toán cốt lõi:\n"
        "1. **Thuật toán Giá vốn Bình quân Gia quyền (Weighted Average Cost - WAC):** Mô hình hóa dòng năng lượng nạp/xả và cập nhật giá vốn tức thời.\n"
        "2. **Thuật toán Phần dư lớn nhất Hare-Niemeyer (Largest Remainder Method):** Các bước toán học chia phần nguyên, tính phần dư phân số và bù trừ tiền lẻ VND bảo đảm tổng số tiền khớp chính xác 100% hóa đơn gốc."
    ),
    "app_n": (
        "Phụ lục N cung cấp danh mục chi tiết **20 ảnh chụp màn hình giao diện người dùng thực tế (UI-01 đến UI-20)** cần bổ sung minh chứng, "
        "kèm theo đường dẫn URL kiểm thử cục bộ, vai trò tài khoản thực thi, tiền điều kiện cần thiết và các thành phần trực quan then chốt cần ghi lại bằng hình ảnh."
    )
}

def get_appendices_narratives():
    return APPENDICES_NARRATIVES
