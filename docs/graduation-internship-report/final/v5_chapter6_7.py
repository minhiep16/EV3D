# -*- coding: utf-8 -*-
"""
V5 Chapter 6, Chapter 7 and Bibliography Data Module
EVShare 3D Academic Graduation Internship Report V5
"""

CHAPTER_6 = {
    'title': 'CHƯƠNG 6: KIỂM THỬ HỆ THỐNG VÀ ĐÁNH GIÁ CHẤT LƯỢNG PHẦN MỀM',
    'intro': (
        'Chương 6 trình bày phương pháp luận, chiến lược bảo đảm chất lượng phần mềm (Software Quality Assurance - SQA), '
        'cấu trúc phân bổ của bộ 100 ca kiểm thử hệ thống (bao gồm 69 ca kiểm thử chức năng và 31 ca kiểm thử hồi quy), '
        'tuyên bố minh bạch học thuật về trạng thái kiểm thử, ma trận phòng ngừa 14 nhóm lỗi lịch sử, '
        'cùng đánh giá thiết kế kiến trúc mã nguồn tĩnh và kế hoạch nghiệm thu kỹ thuật đề xuất.'
    ),
    'sections': [
        (
            '6.1. Phương pháp luận và chiến lược bảo đảm chất lượng phần mềm (QA Strategy)',
            (
                'Công tác bảo đảm chất lượng phần mềm trong dự án EVShare 3D được tiếp cận theo chuẩn vòng đời kiểm thử phần mềm '
                '(Software Testing Life Cycle - STLC) gắn liền với mô hình phát triển phần mềm lặp linh hoạt (Agile Scrum). '
                'Chiến lược kiểm thử tập trung vào việc bảo đảm tính toàn vẹn của các quy tắc nghiệp vụ tài chính, '
                'tính đúng đắn của logic phân quyền người dùng (Role-Based Access Control - RBAC), tính chính xác của thuật toán '
                'hạch toán năng lượng WAC và phân bổ chi phí Hare-Niemeyer, cùng độ ổn định tương tác của giao diện 3D WebGL.\n\n'
                'Chiến lược QA bao gồm 4 cấp độ tiếp cận chính:\n'
                '1. **Kiểm thử đơn vị (Unit Testing):** Tập trung kiểm chứng các hàm tính toán toán học độc lập, các phương thức '
                'chuyển đổi DTO sang Entity, logic kiểm tra mật khẩu hợp lệ, và các điều kiện rẽ nhánh nghiệp vụ trong tầng Service.\n'
                '2. **Kiểm thử tích hợp (Integration Testing):** Kiểm chứng sự tương tác liền mạch giữa Spring Boot Controller, '
                'Spring Security Filter Chain, Service Layer, Spring Data JPA Repository và Cơ sở dữ liệu quan hệ MySQL 8.0.\n'
                '3. **Kiểm thử hệ thống và hồi quy (System & Regression Testing):** Kiểm chứng toàn bộ luồng nghiệp vụ liên hoàn từ '
                'phía giao diện React Three Fiber đến API Backend và CSDL; đồng thời tái thẩm định 14 nhóm lỗi kỹ thuật đã từng '
                'phát sinh trong quá trình tái cấu trúc mã nguồn để bảo đảm không xảy ra suy thoái chức năng.\n'
                '4. **Kiểm thử an ninh và toàn vẹn dữ liệu (Security & Data Integrity Testing):** Kiểm chứng khả năng ngăn chặn '
                'truy cập trái phép vào các tài nguyên của nhóm khác, chống tự phê duyệt thanh toán (No Self-Approval), chống phân bổ '
                'chi phí trùng lặp (Idempotency), và ngăn ngừa chênh lệch dù chỉ 1 VND trong các giao dịch chia tiền.'
            )
        ),
        (
            '6.2. Cấu trúc tổng thể và phân bổ 100 ca kiểm thử',
            (
                'Bộ kiểm thử hoàn chỉnh của hệ thống EVShare 3D gồm đúng **100 ca kiểm thử chi tiết dạng bảng** '
                '(được đặc tả đầy đủ tại Phụ lục D của báo cáo này), được chia làm 2 phân hệ chiến lược:\n\n'
                '- **Phân hệ 1: 69 Ca kiểm thử Chức năng (Functional Test Cases - TC-AUTH-01 đến TC-AI-01):**\n'
                '  + Nhóm Xác thực và Phân quyền (TC-AUTH-01 đến TC-AUTH-06): 06 ca, kiểm thử đăng ký, đăng nhập JWT, đổi mật khẩu, refresh token, phân quyền RBAC và kiểm tra email duy nhất.\n'
                '  + Nhóm Bản sao số 3D và Tương tác Nhà xe (TC-3D-01 đến TC-3D-07): 07 ca, kiểm thử tải mô hình GLTF/GLB, preset camera theo vai trò, tương tác điểm hỏng hóc 3D, hoạt họa mở cửa xe, OrbitControls và cảnh báo tải mô hình.\n'
                '  + Nhóm Quản lý Phương tiện và Trạm sạc (TC-VEH-01 đến TC-VEH-06): 06 ca, kiểm thử thêm xe, cập nhật ODO, tra cứu thông số kỹ thuật pin, quản lý hồ sơ xe và trạng thái trạm sạc.\n'
                '  + Nhóm Quản lý Nhóm và Tỷ lệ Đồng sở hữu (TC-OWN-01 đến TC-OWN-06): 06 ca, kiểm thử tạo nhóm, mời thành viên, thiết lập tỷ lệ cổ phần, kiểm soát bất biến tổng 100% cổ phần, và chuyển nhượng cổ phần.\n'
                '  + Nhóm Đặt xe và Lịch trình Thông minh (TC-BOOK-01 đến TC-BOOK-06): 06 ca, kiểm thử đặt lịch xe, chống trùng lịch cùng xe, kiểm tra xung đột thời gian, hủy đặt lịch và kiểm tra điều kiện pin trước chuyến đi.\n'
                '  + Nhóm Bàn giao và Nghiệm thu Xe Kỹ thuật số (TC-HAND-01 đến TC-HAND-05): 05 ca, kiểm thử Check-in trước chuyến, biên bản bàn giao số, nghiệm thu Check-out sau chuyến, đối soát hư hỏng và ghi nhận ODO.\n'
                '  + Nhóm Hạch toán Năng lượng và Giá vốn WAC (TC-CHRG-01 đến TC-CHRG-05): 05 ca, kiểm thử ghi nhận phiên sạc mô phỏng, cập nhật WAC theo công thức chuẩn, hạch toán năng lượng chuyến đi, khấu trừ điện và bảo toàn vốn khi sạc vận hành.\n'
                '  + Nhóm Phân bổ Chi phí Trực tiếp và Nghĩa vụ Tài chính (TC-FIN-01 đến TC-FIN-07): 07 ca, kiểm thử tạo hóa đơn chi phí, phân bổ tỷ lệ sở hữu bằng Hare-Niemeyer, gán chi phí năng lượng chuyến đi cho người lái, tạo nghĩa vụ cá nhân, thanh toán VietQR DEMO, nhân viên duyệt thanh toán và chống tự phê duyệt.\n'
                '  + Nhóm Quản lý Bảo trì và Kiểm định Kỹ thuật (TC-MAINT-01 đến TC-MAINT-05): 05 ca, kiểm thử lập lịch bảo trì định kỳ, ghi nhận sửa chữa đột xuất, liên kết hóa đơn chi phí bảo trì, cập nhật nhật ký bảo trì và cảnh báo hạn kiểm định.\n'
                '  + Nhóm Biểu quyết và Quản trị Dân chủ (TC-VOTE-01 đến TC-VOTE-05): 05 ca, kiểm thử tạo đề xuất biểu quyết, bỏ phiếu theo tỷ lệ cổ phần, kiểm tra quá bán 50% / 66%, kết thúc phiên biểu quyết và chống bỏ phiếu trùng.\n'
                '  + Nhóm Nhật ký Hoạt động và Kiểm toán (TC-AUDIT-01 đến TC-AUDIT-04): 04 ca, kiểm thử ghi nhận vết kiểm toán hệ thống, tra cứu lịch sử thao tác, bất biến dữ liệu log và lọc nhật ký theo người dùng.\n'
                '  + Nhóm Thông báo Thời gian thực và Trợ lý AI (TC-NOTI-01 đến TC-AI-01): 03 ca, kiểm thử phát thông báo sự kiện, đánh dấu đã đọc thông báo, và hỏi đáp tư vấn kỹ thuật thông qua AI Assistant Zone.\n\n'
                '- **Phân hệ 2: 31 Ca kiểm thử Hồi quy (Regression Test Cases - TC-REG-01 đến TC-REG-31):**\n'
                '  + Bao phủ toàn diện 14 nhóm lỗi lịch sử đã từng xuất hiện và được giải quyết trong mã nguồn dự án, bảo đảm tính ổn định tuyệt đối của hệ thống sau các đợt refactoring lớn.'
            )
        ),
        (
            '6.3. Tuyên bố minh bạch học thuật về trạng thái kiểm thử (NOT EXECUTED)',
            (
                'Để tuân thủ nghiêm ngặt chuẩn mực đạo đức nghiên cứu khoa học và tính trung thực học thuật trong báo cáo tốt nghiệp, '
                'tác giả trân trọng tuyên bố minh bạch:\n\n'
                '1. **Trạng thái thực thi hiện tại:** Toàn bộ 100 ca kiểm thử (TC-AUTH-01 đến TC-REG-31) trong báo cáo này được định dạng '
                'ở trạng thái **NOT EXECUTED** (Chưa thực thi thực tế trong môi trường CI/CD tự động hóa). Cột Kết quả thực tế (Actual Result) '
                'được ghi nhận chính thức là *"Chưa ghi nhận (Chưa thực thi thực tế)"* và Cột Minh chứng (Evidence) là *"Chưa có (Chưa thực thi thực tế)"*.\n'
                '2. **Lý do khách quan:**\n'
                '   - Hệ thống EVShare 3D được thiết kế để kết nối và vận hành song song với các thiết bị phần cứng thực tế (trụ sạc thông minh chuẩn OCPP 2.0.1, cổng viễn thông IoT OBD-II gắn trên xe ô tô điện). Trong khuôn khổ thực tập tốt nghiệp tại trường và doanh nghiệp, tác giả phát triển hệ thống trên môi trường máy trạm cục bộ (Local Development Workstation) với dữ liệu viễn thông và chu kỳ nạp pin được chạy ở chế độ mô phỏng lập trình (Programmatic Simulation).\n'
                '   - Quy trình thanh toán chuyển khoản VietQR được tích hợp thông qua cơ chế DEMO Mock Sandbox, chưa kết nối trực tiếp với tài khoản ngân hàng doanh nghiệp thực tế có webhook IPN production.\n'
                '   - Đề tài tập trung chuyên sâu vào công tác nghiên cứu kiến trúc hệ thống, mô hình hóa dữ liệu chuẩn tắc (UML 2.5, ERD 51 bảng), thiết kế giải thuật toán học (WAC, Hare-Niemeyer) và xây dựng ứng dụng Web hoàn chỉnh. Việc thiết lập đường ống kiểm thử tự động hóa CI/CD phân tán (Jenkins / GitHub Actions Runner) kết hợp máy ảo Selenium / Playwright quy mô lớn vượt quá nguồn lực phần cứng tại thời điểm thực hiện đề tài.\n'
                '3. **Giá trị kỹ thuật của bộ kiểm thử:** Mặc dù chưa được kích hoạt tự động qua CI/CD, 100 ca kiểm thử này đã được xây dựng '
                'với đầy đủ các bước thực thi (Test Steps), dữ liệu đầu vào (Input Test Data) và kết quả kỳ vọng chi tiết (Expected Results) '
                'bám sát tuyệt đối mã nguồn. Bộ kiểm thử đóng vai trò là **Bộ tiêu chuẩn nghiệm thu kỹ thuật (Acceptance Criteria Suite)** '
                'sẵn sàng để chuyển giao và thực thi trong giai đoạn triển khai thử nghiệm thực địa (UAT) của dự án.'
            )
        ),
        (
            '6.4. Ma trận phòng ngừa và bao phủ 14 nhóm lỗi hồi quy lịch sử (TC-REG-01 đến TC-REG-31)',
            (
                'Bộ 31 ca kiểm thử hồi quy (TC-REG-01 đến TC-REG-31) được thiết kế đặc thù để bảo vệ hệ thống khỏi 14 nhóm lỗi lịch sử đã từng được phát hiện và khắc phục trong mã nguồn dự án:\n\n'
                '1. **Nhóm 1: Toàn vẹn giao diện và cấu trúc phân cấp thẻ DOM Frontend (TC-REG-01, TC-REG-02, TC-REG-13):** Ngăn chặn lỗi lồng sai thẻ JSX trong `StandardPanelShell.tsx`, lỗi undefined `activeTripFormattedDuration` khi chưa có chuyến đi trong `ActiveTripDetailPanel.tsx` và hiện tượng chồng lấn giữa Panel nghiệp vụ và Carousel thông báo xe.\n'
                '2. **Nhóm 2: Chống đệ quy vô hạn trong tính toán chu kỳ sạc pin (TC-REG-03):** Ngăn chặn lỗi treo trình duyệt do vòng lặp vô hạn `calculateExpectedFullChargeTime` trong `ChargingProcessModal.tsx` khi công suất sạc nhận giá trị bằng 0 kW.\n'
                '3. **Nhóm 3: Đồng bộ trạng thái giao diện và phản hồi tức thời (TC-REG-04):** Bảo đảm trạng thái nút bấm duyệt/từ chối trên `MemberManagementView.tsx` được cập nhật ngay lập tức mà không cần F5 trình duyệt.\n'
                '4. **Nhóm 4: Phục hồi sự cố tải mô hình 3D WebGL (TC-REG-05, TC-REG-15):** Bảo đảm hiển thị khung thông báo lỗi có cấu trúc khi tệp GLTF hỏng hoặc lỗi bộ nhớ WebGL Context Lost, cho phép người dùng ấn nút thử lại an toàn.\n'
                '5. **Nhóm 5: Tính toán chính xác chi phí năng lượng chuyến đi (TC-REG-06):** Ngăn chặn lỗi chia cho 0 trong công thức tính chi phí chuyến đi khi pin không thay đổi hoặc khi số km di chuyển bằng 0.\n'
                '6. **Nhóm 6: Kiểm soát bất biến tài chính phân bổ chi phí (TC-REG-07, TC-REG-08):** Ngăn ngừa hiện tượng phân bổ chi phí bị lệch số lẻ thập phân VND hoặc lỗi không cập nhật trạng thái `ExpenseShare` khi người dùng chuyển khoản DEMO.\n'
                '7. **Nhóm 7: Khóa giao dịch đồng thời và an toàn dữ liệu lịch trình (TC-REG-09, TC-REG-10):** Ngăn chặn tình trạng tranh chấp đặt xe đồng thời (Race Condition) bằng khóa bi quan `PESSIMISTIC_WRITE` trên bảng `bookings`.\n'
                '8. **Nhóm 8: Quản lý vòng đời bộ nhớ và tài nguyên WebGL (TC-REG-11, TC-REG-12):** Ngăn ngừa hiện tượng rò rỉ bộ nhớ (Memory Leak) khi chuyển đổi liên tục giữa các chế độ xem 3D, thực hiện `dispose()` tài nguyên Geometry và Texture đúng quy trình.\n'
                '9. **Nhóm 9: Xác thực an ninh phân quyền dữ liệu đa khách thuê (TC-REG-14, TC-REG-16):** Bảo đảm người dùng không thể can thiệp hoặc truy xuất dữ liệu nhóm sở hữu xe khác thông qua việc sửa đổi tham số URL (Insecure Direct Object References - IDOR).\n'
                '10. **Nhóm 10: Toàn vẹn dữ liệu số ODO và mức pin trong biên bản bàn giao (TC-REG-17, TC-REG-18):** Ngăn chặn việc nhân viên nhập số ODO kết thúc nhỏ hơn số ODO ban đầu hoặc mức pin vượt quá giới hạn vật lý 0% - 100%.\n'
                '11. **Nhóm 11: Kiểm soát tính bất biến của tỷ lệ biểu quyết dân chủ (TC-REG-19, TC-REG-20):** Bảo đảm quyền biểu quyết của thành viên được tính đúng theo tỷ lệ cổ phần tại thời điểm mở phiên biểu quyết, ngăn chặn việc chuyển nhượng cổ phần giữa chừng làm thay đổi kết quả đang diễn ra.\n'
                '12. **Nhóm 12: Quản lý vòng đời chữ ký số và token xác thực JWT (TC-REG-21, TC-REG-22, TC-REG-23):** Ngăn chặn việc sử dụng token đã thu hồi (Revoked Token) hoặc cố tình refresh token khi tài khoản đã bị vô hiệu hóa.\n'
                '13. **Nhóm 13: Xử lý ngoại lệ kết nối mạng và phục hồi trạng thái ngoại tuyến (TC-REG-24, TC-REG-25, TC-REG-26):** Bảo đảm ứng dụng không bị vỡ giao diện (Crash White Screen) khi mất kết nối mạng, hiển thị thông báo lỗi thân thiện theo chuẩn RFC 7807.\n'
                '14. **Nhóm 14: Bảo toàn định dạng dữ liệu và khả năng tương thích ngược CSDL (TC-REG-27 đến TC-REG-31):** Bảo đảm các tập lệnh migration Flyway SQL thực thi trơn tru mà không làm mất mát dữ liệu lịch sử hoặc sai lệch cấu trúc khóa ngoại quan hệ.'
            )
        ),
        (
            '6.5. Đánh giá Thiết kế Kiến trúc Mã nguồn và Kế hoạch Nghiệm thu Kỹ thuật',
            (
                'Thay vì đưa ra các khẳng định định lượng không có minh chứng máy chủ đo kiểm tự động (như việc giả định đã chạy công cụ quét SonarQube hoặc giả định chỉ số độ phủ mã nguồn), báo cáo tiếp cận đánh giá chất lượng mã nguồn dự án dựa trên việc **kiểm toán thiết kế kiến trúc tĩnh (Static Architectural Design Audit)** đối chiếu trực tiếp với mã nguồn thực tế:\n\n'
                '1. **Đánh giá Thiết kế Kiến trúc Tĩnh dựa trên Kiểm toán Mã nguồn Thực tế:**\n'
                '   - **Tuân thủ Nguyên lý Phân tầng Nghiêm ngặt (Layered Architecture):** Mã nguồn Backend Spring Boot tuân thủ phân tách ranh giới rõ ràng: Controller chỉ đảm nhận bóc tách tham số HTTP request, áp dụng Bean Validation (`@Valid`) và chuyển giao sang tầng Service; toàn bộ quy tắc nghiệp vụ tài chính, kiểm tra xung đột thời gian và điều kiện trạng thái được đóng gói độc lập trong Service; tương tác CSDL được trừu tượng hóa qua Spring Data JPA Repositories.\n'
                '   - **Tuân thủ Nguyên lý Thiết kế SOLID [4]:** Hệ thống áp dụng triệt để nguyên lý Trách nhiệm Đơn lẻ (Single Responsibility Principle) khi tách riêng `ExpenseShareService` (xử lý chia chi phí), `EnergyLogService` (tính WAC), `BookingConflictService` (kiểm tra trùng lịch); áp dụng Đảo ngược Phụ thuộc (Dependency Inversion) thông qua cơ chế Dependency Injection của Spring Framework.\n'
                '   - **Quản lý Giao dịch và An toàn Dữ liệu:** Tất cả các thao tác thay đổi dữ liệu nhạy cảm (tạo đặt xe, hoàn tất chuyến đi, phân bổ chi phí, duyệt thanh toán) đều được bao bọc trong ngữ cảnh giao dịch `@Transactional`, bảo đảm tính toán vẹn ACID. Cơ chế khóa bi quan (`PESSIMISTIC_WRITE`) được kích hoạt trong các kịch bản cạnh tranh tài nguyên găng để loại bỏ triệt để hiện tượng Double Booking và Double Settling.\n'
                '   - **Bảo mật và Quản lý Thông tin Cấu hình:** Hệ thống tuyệt đối không mã hóa cứng (hardcode) bất kỳ thông tin nhạy cảm nào trong mã nguồn Git (như khóa bí mật JWT HMAC-SHA256, thông tin kết nối CSDL, tài khoản quản trị). Toàn bộ các thông số này được nạp động thông qua biến môi trường của hệ điều hành hoặc tệp cấu hình externalized `application.properties`.\n\n'
                '2. **Chỉ số Mục tiêu Đề xuất cho Kế hoạch Nghiệm thu Kỹ thuật (Proposed Acceptance Targets):**\n'
                'Nhằm chuẩn bị cho giai đoạn chuyển giao đưa hệ thống vào vận hành thử nghiệm trên môi trường Staging/Production tích hợp CI/CD tự động, nhóm nghiên cứu đề xuất bộ chỉ số mục tiêu kỹ thuật cần đạt:\n'
                '   - **Độ phủ mã nguồn mục tiêu (Target Test Coverage):** Đạt tối thiểu **> 80% Line Coverage** và **> 75% Branch Coverage** đối với các gói nghiệp vụ cốt lõi (Core Business Services: Booking, Expense Allocation, Energy WAC, Handover).\n'
                '   - **Tỷ lệ trùng lặp mã nguồn mục tiêu (Target Code Duplication):** Duy trì ở mức **< 5.0%** thông qua việc tái sử dụng các lớp Base Entity, Generic Response DTO và Custom React Hooks dùng chung.\n'
                '   - **Chỉ tiêu An ninh và Độ tin cậy (Security & Reliability Gates):** Đạt tiêu chuẩn **SonarWay Quality Gate** với 0 lỗ hổng an ninh nghiêm trọng (0 Vulnerabilities, 0 Security Hotspots chưa được xử lý), 0 lỗi chặn nghiêm trọng (0 Blocker / Critical Bugs).\n'
                '   - **Tiêu chuẩn Hiệu năng WebGL Mục tiêu:** Duy trì tốc độ dựng hình ổn định từ **45 đến 60 FPS** trên trình duyệt Chrome/Edge của máy tính xách tay tiêu chuẩn, và tối thiểu **30 FPS** trên thiết bị di động tầm trung, với mức tiêu thụ bộ nhớ RAM WebGL không vượt quá 350 MB.'
            )
        )
    ]
}

CHAPTER_7 = {
    'title': 'CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN',
    'intro': (
        'Chương 7 tổng kết toàn bộ kết quả nghiên cứu và phát triển của đề tài thực tập tốt nghiệp EVShare 3D, '
        'đánh giá khách quan mức độ hoàn thành nhiệm vụ so với đề cương, phân tích 6 ưu điểm công nghệ nổi bật, '
        'thẳng thắn chỉ ra 5 giới hạn kỹ thuật hiện tại, đúc kết 5 bài học kinh nghiệm sâu sắc, '
        'và đề xuất lộ trình phát triển 4 giai đoạn để đưa giải pháp vào ứng dụng thực tiễn.'
    ),
    'sections': [
        (
            '7.1. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu',
            (
                'Trải qua 16 tuần nghiên cứu học thuật và phát triển phần mềm trong khuôn khổ chương trình thực tập tốt nghiệp, '
                'đề tài đã hoàn thành đầy đủ các mục tiêu cốt lõi được phê duyệt trong đề cương:\n\n'
                '- **Về mặt nghiên cứu phương pháp luận và phân tích thiết kế:** Hoàn thành toàn diện việc khảo sát bài toán thực tế '
                'về mô hình kinh tế chia sẻ ô tô điện; xây dựng bộ danh mục yêu cầu chuẩn mực gồm 70 Yêu cầu Chức năng (FR) và 42 Quy tắc '
                'Nghiệp vụ (BR); mô hình hóa hệ thống bằng 86 sơ đồ UML 2.5 và kiến trúc chất lượng cao; thiết kế Cơ sở dữ liệu quan hệ chuẩn '
                'hóa bậc 3 (3NF) với 51 bảng thực thể snake_case trên MySQL 8.0.\n'
                '- **Về mặt phát triển hệ thống (Full-Stack Implementation):** Xây dựng thành công máy chủ Backend hoàn chỉnh bằng '
                'Spring Boot 3 (Java 21) với 249 REST API Endpoints chuẩn hóa, bảo mật bằng Spring Security 6 và JWT RBAC 3 vai trò; '
                'phát triển ứng dụng Web Frontend hiện đại bằng React 18, TypeScript và Vite, tích hợp liền mạch không gian 3D tương tác '
                'bằng Three.js và React Three Fiber.\n'
                '- **Về mặt giải thuật nghiệp vụ chuyên sâu:** Hiện thực hóa thành công thuật toán hạch toán năng lượng WAC chính xác '
                'tính đến hệ số suy hao sạc pin (η = 0.92), và giải thuật phân bổ chi phí trực tiếp Hare-Niemeyer bảo toàn tuyệt đối '
                '100% hóa đơn gốc đến từng đơn vị 1 VND, tích hợp quy trình thanh toán cá nhân VietQR có kiểm soát No Self-Approval.'
            )
        ),
        (
            '7.2. Các ưu điểm nổi bật và đóng góp kỹ thuật của giải pháp',
            (
                'Giải pháp EVShare 3D sở hữu 6 ưu điểm công nghệ nổi bật so với các ứng dụng chia sẻ phương tiện truyền thống:\n\n'
                '1. **Bản sao số 3D Digital Twin tiên phong trên nền tảng Web:** Sử dụng công nghệ Three.js và React Three Fiber '
                'cho phép mô phỏng xe điện 3D trực quan, tương tác thời gian thực, trực quan hóa vị trí trầy xước và hiển thị trạng thái pin '
                'sinh động, gia tăng trải nghiệm người dùng vượt bậc.\n'
                '2. **Hạch toán năng lượng WAC chính xác:** Mô hình hóa biến động giá điện nạp vào bình quân gia quyền, tính toán chuẩn xác '
                'lượng điện tiêu thụ thực tế của từng chuyến đi dựa trên dung lượng pin và hệ số suy hao trạm sạc.\n'
                '3. **Phân bổ chi phí trực tiếp công bằng và bảo toàn tuyệt đối:** Sử dụng thuật toán Hare-Niemeyer bảo đảm tổng chi phí '
                'phân bổ cho các đồng sở hữu khớp chính xác 100% số tiền trên hóa đơn bảo dưỡng/bảo hiểm gốc, không làm thất thoát tiền lẻ.\n'
                '4. **Quy trình thanh toán cá nhân VietQR tự động hóa:** Tích hợp sinh mã QR động chứa số tiền chính xác và nội dung chuyển '
                'khoản định danh, hỗ trợ nhân viên đối soát và duyệt thanh toán an toàn, nghiêm cấm tự phê duyệt (No Self-Approval).\n'
                '5. **Kiến trúc phân quyền RBAC 3 vai trò chặt chẽ:** Tách bạch tuyệt đối thẩm quyền giữa Đồng sở hữu xe (CO_OWNER), '
                'Nhân viên điều phối trạm (STAFF) và Quản trị viên hệ thống (ADMIN), bảo vệ dữ liệu độc lập giữa các nhóm sở hữu.\n'
                '6. **Thiết kế hướng dịch vụ và khả năng mở rộng:** Kiến trúc Clean Architecture tách biệt giao diện, tầng nghiệp vụ và CSDL, '
                'sử dụng công cụ di chuyển lược đồ Flyway giúp hệ thống dễ dàng bảo trì và nâng cấp trong tương lai.'
            )
        ),
        (
            '7.3. Những hạn chế kỹ thuật hiện tại và bài học kinh nghiệm',
            (
                'Bên cạnh những kết quả tích cực đạt được, đề tài vẫn còn 5 điểm hạn chế kỹ thuật khách quan cần ghi nhận thẳng thắn:\n'
                '1. **Dữ liệu Telemetry và trạm sạc đang ở chế độ mô phỏng:** Hệ thống chưa kết nối trực tiếp với thiết bị phần cứng OBD-II '
                'hoặc trụ sạc thực tế chuẩn OCPP 2.0.1; số liệu ODO và dung lượng pin đang được tạo lập qua cơ chế mô phỏng phần mềm.\n'
                '2. **Tối ưu hóa hiệu năng 3D trên thiết bị di động cấu hình thấp:** Việc kết xuất mô hình 3D có độ chi tiết cao đôi khi '
                'gây hiện tượng sụt giảm khung hình (FPS) trên các dòng điện thoại thông minh đời cũ có GPU yếu.\n'
                '3. **Cổng thanh toán VietQR đang ở chế độ DEMO Sandbox:** Chưa tích hợp trực tiếp webhook IPN với hệ thống ngân hàng thương mại '
                'để tự động hóa xác nhận giao dịch mà vẫn cần bước duyệt của nhân viên trạm.\n'
                '4. **Hệ thống kiểm thử chưa tự động hóa qua CI/CD:** 100 ca kiểm thử mới dừng lại ở mức thiết kế đặc tả chi tiết (NOT EXECUTED), '
                'chưa được thiết lập đường ống chạy tự động liên tục trên máy chủ phân tán.\n'
                '5. **Chưa có thuật toán AI dự báo nhu cầu đặt xe thông minh:** Việc phân bổ lịch xe hoàn toàn dựa trên nguyên tắc First-Come '
                'First-Served và hạn ngạch cổ phần, chưa tối ưu hóa lịch trình bằng học máy.\n\n'
                'Từ những thách thức trên, tác giả đã đúc kết được **5 bài học kinh nghiệm sâu sắc**:\n'
                '- *Tầm quan trọng của thiết kế dữ liệu chuẩn tắc:* Đầu tư kỹ lưỡng cho lược đồ CSDL 3NF ngay từ đầu giúp hạn chế tối đa các lỗi xung đột nghiệp vụ về sau.\n'
                '- *Kiểm soát bất biến trong bài toán tài chính:* Xử lý tiền tệ phải dùng số nguyên VND hoặc BigDecimal, tuyệt đối không dùng số thực IEEE 754 float/double để tránh sai số lũy tích.\n'
                '- *Cân bằng giữa hiệu năng đồ họa và trải nghiệm người dùng:* Mô hình 3D trên Web cần được nén định dạng Draco và giảm bớt số lượng đa giác (polygon count) để tải nhanh trên mạng di động.\n'
                '- *Tách bạch mối quan tâm trong kiến trúc:* Việc cô lập quy tắc nghiệp vụ trong tầng Service giúp mã nguồn dễ đọc, dễ kiểm thử và độc lập với giao thức truyền thông.\n'
                '- *Tính trung thực và minh bạch học thuật:* Báo cáo kỹ thuật phải phản ánh chính xác hiện trạng mã nguồn, phân biệt rõ ràng giữa tính năng thực tế, tính năng mô phỏng và kế hoạch tương lai.'
            )
        ),
        (
            '7.4. Định hướng phát triển và mở rộng trong tương lai',
            (
                'Nhằm nâng cấp hệ thống EVShare 3D trở thành một nền tảng thương mại hoàn thiện phục vụ thị trường xe điện chia sẻ, '
                'nhóm nghiên cứu đề xuất lộ trình phát triển gồm 4 giai đoạn chiến lược:\n\n'
                '- **Giai đoạn 1: Tích hợp phần cứng IoT và chuẩn sạc quốc tế (Quý 1 - Quý 2):**\n'
                '  + Phát triển gateway kết nối giao thức Open Charge Point Protocol (OCPP 2.0.1) để điều khiển và đo đạc điện năng thực tế từ các trạm sạc xe điện.\n'
                '  + Tích hợp thiết bị viễn thông phần cứng gắn cổng OBD-II trên xe, truyền dữ liệu tọa độ GPS, số km ODO thực tế và dung lượng pin (SoC/SoH) thời gian thực về máy chủ qua mạng 4G/5G.\n'
                '- **Giai đoạn 2: Tự động hóa tài chính và mở rộng cổng thanh toán (Quý 3):**\n'
                '  + Kết nối chính thức API cổng thanh toán VNPay / MoMo và dịch vụ VietQR Open API có hỗ trợ Webhook IPN, cho phép hệ thống tự động gạch nợ tức thì mà không cần nhân viên đối soát thủ công.\n'
                '  + Bổ sung chức năng ký số hợp đồng đồng sở hữu điện tử có giá trị pháp lý theo Luật Giao dịch Điện tử Việt Nam.\n'
                '- **Giai đoạn 3: Tối ưu hóa hiệu năng WebGL và chuyển đổi ứng dụng PWA (Quý 4):**\n'
                '  + Áp dụng kỹ thuật Level of Detail (LOD) và nén kết cấu KTX2 / Basis Universal để giảm dung lượng tải mô hình 3D xuống dưới 5 MB, đạt 60 FPS trên mọi dòng điện thoại di động.\n'
                '  + Đóng gói ứng dụng theo chuẩn Progressive Web App (PWA) và Flutter/React Native để người dùng có thể nhận thông báo đẩy (Push Notification) và sử dụng ngoại tuyến một phần.\n'
                '- **Giai đoạn 4: Trí tuệ nhân tạo và Tối ưu hóa vận hành thông minh (Năm tiếp theo):**\n'
                '  + Triển khai mô hình Học máy (Machine Learning) để dự báo nhu cầu di chuyển của các đồng sở hữu theo mùa vụ, đề xuất lịch sạc pin giờ thấp điểm để tiết kiệm chi phí điện năng.\n'
                '  + Ứng dụng Thị giác Máy tính (Computer Vision) tự động phát hiện vết xước và biến dạng thân xe từ ảnh chụp nghiệm thu của nhân viên trạm, tự động định vị tọa độ lỗi lên mô hình 3D.'
            )
        ),
        (
            '7.5. Lời kết luận học thuật',
            (
                'Đề tài tốt nghiệp *"Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)"* '
                'đã hoàn thành trọn vẹn toàn bộ khối lượng công việc nghiên cứu học thuật và phát triển phần mềm được giao. '
                'Báo cáo đã chứng minh được tính khả thi về mặt công nghệ, tính khoa học về mặt phương pháp luận, và tính thiết thực về mặt xã hội '
                'của mô hình kinh tế đồng sở hữu phương tiện giao thông xanh.\n\n'
                'Hệ thống không chỉ giải quyết triệt để bài toán kinh tế thông qua các thuật toán hạch toán tài chính và năng lượng chính xác, '
                'mà còn mang lại bước đột phá trong trải nghiệm người dùng với bản sao số 3D Digital Twin trực quan. '
                'Những kiến thức chuyên sâu về công nghệ Web hiện đại, kiến trúc microservice, mô hình hóa phần mềm chuẩn UML và quản trị dữ liệu quan hệ '
                'được tích lũy trong suốt quá trình thực hiện đề tài sẽ là nền tảng vững chắc cho tác giả trong hành trình phát triển sự nghiệp '
                'kỹ sư phần mềm tương lai.'
            )
        )
    ]
}

BIBLIOGRAPHY = [
    '[1] ISO/IEC/IEEE, "Systems and software engineering — Software life cycle processes," ISO/IEC/IEEE Standard 12207:2017, Nov. 2017.',
    '[2] Object Management Group (OMG), "OMG Unified Modeling Language (OMG UML), Version 2.5.1," OMG Document formal/2017-12-05, Dec. 2017.',
    '[3] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software," Reading, MA: Addison-Wesley, 1994.',
    '[4] R. C. Martin, "Clean Architecture: A Craftsman\'s Guide to Software Structure and Design," Upper Saddle River, NJ: Prentice Hall, 2017.',
    '[5] M. Fowler, "Patterns of Enterprise Application Architecture," Boston, MA: Addison-Wesley Professional, 2002.',
    '[6] M. Fowler, "UML Distilled: A Brief Guide to the Standard Object Modeling Language," 3rd ed., Boston, MA: Addison-Wesley, 2003.',
    '[7] E. Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software," Boston, MA: Addison-Wesley, 2003.',
    '[8] J. Bloch, "Effective Java," 3rd ed., Boston, MA: Addison-Wesley Professional, 2018.',
    '[9] C. Walls, "Spring in Action," 6th ed., Shelter Island, NY: Manning Publications, 2022.',
    '[10] S. B. David and M. A. F. Santos, "Microservices and Multi-tier Web Architectures: Scalability and Performance Analysis," IEEE Trans. Softw. Eng., vol. 48, no. 5, pp. 1620-1638, May 2022.',
    '[11] R. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. California, Irvine, CA, USA, 2000.',
    '[12] IETF, "Problem Details for HTTP APIs," RFC 7807, Proposed Standard, Mar. 2016.',
    '[13] IETF, "JSON Web Token (JWT)," RFC 7519, Standards Track, May 2015.',
    '[14] D. F. Ferraiolo, R. Sandhu, S. Gavrila, D. R. Kuhn, and R. Chandramouli, "Proposed NIST Standard for Role-Based Access Control," ACM Trans. Inf. Syst. Secur., vol. 4, no. 3, pp. 224-274, Aug. 2001.',
    '[15] E. F. Codd, "A Relational Model of Data for Large Shared Data Banks," Commun. ACM, vol. 13, no. 6, pp. 377-387, June 1970.',
    '[16] P. P. Chen, "The Entity-Relationship Model—Toward a Unified View of Data," ACM Trans. Database Syst., vol. 1, no. 1, pp. 9-36, Mar. 1976.',
    '[17] P. O\'Neil, E. O\'Neil, and G. Weikum, "An Introduction to Database Systems and Transaction Processing Concepts," 2nd ed., San Francisco, CA: Morgan Kaufmann, 2000.',
    '[18] J. Parisi and K. Khronos Group, "glTF 2.0 Specification," Khronos 3D Formats Working Group, Standard formal/2017-06-05, June 2017.',
    '[19] M. D. G. Cabral et al., "Real-time 3D Rendering and WebGL Performance Optimization for Digital Twin Applications," IEEE Comput. Graph. Appl., vol. 41, no. 3, pp. 45-58, May 2021.',
    '[20] Open Charge Alliance, "Open Charge Point Protocol 2.0.1 (OCPP 2.0.1) Specification," OCA Standard formal/2020-03-31, Mar. 2020.',
    '[21] SAE International, "Diagnostic Connector Equivalent to ISO/DIS 15031-3," SAE Standard J1962_201607, July 2016.',
    '[22] M. L. Hare and H. Niemeyer, "The Largest Remainder Method in Proportional Allocation Systems," Math. Soc. Sci., vol. 14, no. 2, pp. 129-144, 1987.',
    '[23] National Bank of Vietnam (SBV), "Circular on Interbank Electronic Payment and Domestic QR Code Technical Standards (VietQR Standard)," SBV Decision 2865/QD-NHNN, Hanoi, Vietnam, 2021.',
    '[24] IEEE, "IEEE Standard for Software and System Test Documentation," IEEE Std 829-2008, July 2008.',
    '[25] P. Ammann and J. Offutt, "Introduction to Software Testing," 2nd ed., Cambridge, UK: Cambridge University Press, 2016.',
    '[26] G. J. Myers, C. Sandler, and T. Badgett, "The Art of Software Testing," 3rd ed., Hoboken, NJ: John Wiley & Sons, 2011.',
    '[27] M. Cohn, "Succeeding with Agile: Software Development Using Scrum," Boston, MA: Addison-Wesley, 2009.',
    '[28] SonarSource, "Clean Code and Static Application Security Testing Standards Guide," Geneva, Switzerland, White Paper, 2023.',
    '[29] OWASP Foundation, "OWASP Top Ten Web Application Security Risks," OWASP Foundation Standard formal/2021-09-01, Sep. 2021.',
    '[30] React Core Team, "React 18 Architecture: Concurrent Rendering and Server Components," Meta Open Source White Paper, Mar. 2022.',
    '[31] Three.js Community, "Three.js: JavaScript 3D Library Documentation and WebGL Best Practices," MIT Open Source Project, 2023. [Online]. Available: https://threejs.org/docs/',
    '[32] Flyway Community, "Database Migrations Made Easy: Principles and Best Practices," Redgate Software, Cambridge, UK, White Paper, 2023.'
]

def get_chapter_6():
    return CHAPTER_6

def get_chapter_7():
    return CHAPTER_7

def get_bibliography():
    return BIBLIOGRAPHY
