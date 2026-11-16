# BÁO CÁO KIỂM TOÁN VÀ ĐỐI SOÁT CHẤT LƯỢNG NỘI DUNG KỸ THUẬT V5
## BÁO CÁO THỰC TẬP TỐT NGHIỆP HỆ THỐNG EVSHARE 3D

**Thời điểm lập báo cáo:** Tháng 11 Năm 2026  
**Dự án:** EVShare 3D — Hệ thống Quản lý Đồng sở hữu Xe điện Tích hợp Bản sao số 3D Digital Twin  
**Phiên bản tài liệu kiểm toán:** V5.0 (Final Targeted Content Correction)  
**Tệp tài liệu nghiệm thu:**
- Microsoft Word DOCX: [`BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx`](file:///D:/EV3D/docs/graduation-internship-report/final/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx)
- Định dạng PDF: [`BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.pdf`](file:///D:/EV3D/docs/graduation-internship-report/final/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.pdf)
- Toàn văn Markdown: [`BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.md`](file:///D:/EV3D/docs/graduation-internship-report/final/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.md)

---

## 1. TỔNG QUAN KIỂM TOÁN VÀ BẢNG KIỂM KÊ TÀI NGUYÊN (INVENTORY OF ARTIFACTS)

Đợt kiểm toán V5 được tiến hành với nguyên tắc **Chỉ hoàn thiện tài liệu (Documentation Only)**, tuyệt đối không can thiệp mã nguồn ứng dụng (`backend/`, `frontend/`), không sửa đổi CSDL MySQL, không chạy lại migration Flyway và không kích hoạt các bộ kiểm thử ứng dụng tự động.

Toàn bộ các khuyết tật về tính chính xác kỹ thuật, tính nhất quán tham chiếu và sự đối lập giữa luồng nghiệp vụ thực tế với mô hình cũ đã được khắc phục triệt để.

### Bảng Kiểm kê Hiện vật Toàn diện của Báo cáo V5

| STT | Hạng mục kiểm kê | Số lượng V4 | Số lượng V5 | Trạng thái kỹ thuật V5 |
|:---:|:---|:---:|:---:|:---|
| 1 | Số trang in kết xuất (Rendered Pages) | 408 trang | 386 trang | Chuẩn A4, TNR 13pt, ngắt trang chuẩn học thuật (Đo bằng Word COM Statistics) |
| 2 | Sơ đồ thiết kế hệ thống (Diagrams) | 86 sơ đồ | 86 sơ đồ | 100% đồ họa phân giải cao, tiêu đề song ngữ, sạch cảnh báo PlantUML |
| 3 | Bảng biểu native Word (Tables) | 268 bảng | 268 bảng | Viền chuẩn, canh lề nhất quán, dữ liệu định dạng chuẩn |
| 4 | Yêu cầu chức năng chuẩn hóa (Canonical FRs) | 68 FRs | 70 FRs | Bổ sung FR-NOTI-01 và FR-AI-01; sửa hoàn toàn FR-EXP-03/04 |
| 5 | Quy tắc nghiệp vụ cốt lõi (Canonical BRs) | 42 BRs | 42 BRs | Sửa BR-EXP-05 hạch toán trực tiếp, loại bỏ quỹ chung |
| 6 | Ma trận phân quyền đa cấp (Role Matrix) | 11 hàng | 11 hàng | Tách bạch ADMIN, STAFF, CO_OWNER |
| 7 | Bảng đặc tả Use Case chi tiết (15 hàng viền) | 88 UCs | 88 UCs | 14 Core (Chương 3) + 74 Chuyên sâu (Phụ lục C); 0 gãy mã TC |
| 8 | Bảng ca kiểm thử chi tiết (Test Cases) | 100 TCs | 100 TCs | 69 chức năng + 31 hồi quy; 0 gãy mã FR; 100% NOT EXECUTED |
| 9 | Từ điển dữ liệu CSDL quan hệ (Phụ lục B) | 51 bảng | 51 bảng | Chuẩn 3NF snake_case; 0 mô tả generic; 0 lỗi gán FK sai |
| 10 | Danh mục REST API Endpoints (Phụ lục A) | 249 APIs | 249 APIs | Đầy đủ vai trò RBAC, ràng buộc sở hữu nhóm, DTOs, đánh dấu legacy |
| 11 | Ma trận truy xuất yêu cầu RTM (Phụ lục K) | 68 hàng | 70 hàng | Bao phủ 100% 88 UCs; 0 gãy TC; ghi chú thuần WebGL Client |
| 12 | Khung giữ chỗ ảnh chụp giao diện (UI Placeholders) | 20 hộp | 20 hộp | Callout Boxes có hướng dẫn chụp và che mờ thông tin cá nhân PII |
| 13 | Tài liệu tham khảo chuẩn IEEE | 32 nguồn | 32 nguồn | Trích dẫn IEEE [1]-[32] chuẩn xác, khớp toàn văn các chương |

---

## 2. KẾT QUẢ ĐỐI SOÁT CHI TIẾT THEO 14 TIÊU CHUẨN KỸ THUẬT

### Tiêu chuẩn 1: Hiệu chỉnh Kiến trúc Tài chính — Phân bổ Chi phí Trực tiếp (Direct Expense Allocation)
- **Vấn đề tồn tại ở phiên bản trước:** Báo cáo cũ mô tả "Quỹ chung bảo dưỡng" (Shared Maintenance Fund) như một quy trình vận hành đang hoạt động, mâu thuẫn với mã nguồn thực tế của hệ thống.
- **Minh chứng mã nguồn thực tế:**
  + Tệp thực thể: `backend/src/main/java/com/evshare/expense/entity/ExpenseShare.java`, `ExpenseShareStatus.java` (`PENDING`, `SETTLED`, `OVERDUE`).
  + Tầng dịch vụ: `ExpenseShareService.java`, `HareNiemeyerService.java`.
  + Giao tiếp thanh toán: `VietQRController.java`, `PaymentService.java` (chế độ DEMO Mock Sandbox).
- **Kết quả hiệu chỉnh V5:**
  + **Mục 5.18:** Viết lại toàn diện thành *"Hiện thực Phân hệ Phân bổ Chi phí Trực tiếp và Quản lý Nghĩa vụ Tài chính Cá nhân (Direct Expense Allocation & Personal Payment)"*.
  + **FR-EXP-03:** Viết lại thành *"Phân bổ chi phí năng lượng sạc theo người lái và chống trùng lặp (Driver Energy Allocation & Idempotency)"*.
  + **FR-EXP-04:** Viết lại thành *"Quản lý nghĩa vụ tài chính cá nhân và tra cứu hồ sơ lịch sử (Personal Obligations & History)"*.
  + **BR-EXP-05:** Viết lại thành *"Quy tắc phòng chống trùng lặp và tính bất biến phân bổ chi phí (Duplicate Expense Prevention & Allocation Idempotency)"*, loại bỏ quy tắc số dư quỹ không âm.
  + **Đánh dấu Legacy:** Toàn bộ các API và bảng CSDL liên quan đến `SharedFund`, `FundContribution`, `FundTransaction` được phân loại rõ ràng là `[LEGACY / HỒ SƠ LỊCH SỬ]` - đóng vai trò lưu trữ dự phòng lịch sử thiết kế ban đầu, không phải là quy trình tác nghiệp thường nhật.
  + **Quy tắc No Self-Approval (BR-EXP-02):** Nhân viên kiểm duyệt biên lai chuyển khoản `PersonalPayment` tuyệt đối không thể tự duyệt khoản nợ của chính mình.

### Tiêu chuẩn 2: Chuẩn hóa Danh mục Yêu cầu và Ma trận RTM (Requirements Traceability Matrix)
- **Vấn đề tồn tại:** Danh mục cũ có 68 FRs nhưng thiếu mã cho Thông báo và AI, dẫn đến các Use Case `UC-NOTI-01..03` bị trỏ nhầm sang `FR-3D-01`; đồng thời có 14 Use Case bị bỏ sót khỏi ma trận RTM.
- **Kết quả hiệu chỉnh V5:**
  + Bổ sung 02 Canonical FRs chính thức:
    * `FR-NOTI-01`: Phát thông báo sự kiện thời gian thực (Real-Time Notification Dispatch).
    * `FR-AI-01`: Vùng tư vấn và hỏi đáp trợ lý ảo thông minh (AI Assistant Zone).
  + Nâng tổng số Yêu cầu Chức năng lên chuẩn **70 Canonical FRs**.
  + Tái lập **Phụ lục K (RTM)** gồm đúng 70 hàng, liên kết chặt chẽ: `Mã FR -> Use Case -> Quy tắc BR -> Sơ đồ UML -> REST API -> CSDL -> Ca kiểm thử (TC)`.
  + **Bao phủ 100% 88 Use Cases** (0 Use Case bị bỏ sót khỏi RTM).
  + Đối với các tính năng 3D thuần Client (OrbitControls, PBR Material, X-Ray), các cột API, Service và DB được ghi rõ: *"Không áp dụng (Thuần Client WebGL)"*.

### Tiêu chuẩn 3: Công thức Hạch toán Năng lượng WAC Chuẩn xác
- **Vấn đề tồn tại:** Các phiên bản trước diễn giải mơ hồ về giá điện và lượng điện nạp, thiếu phân định giữa điện lưới cấp và điện nạp thực vào pin.
- **Kết quả hiệu chỉnh V5:**
  + Định nghĩa toán học phân biệt rõ:
    * $E_{\text{grid}}$: Tổng điện năng cấp từ trạm sạc/lưới điện (kWh).
    * $\eta = 0.92$ (92%): Hệ số hiệu suất chuyển đổi nạp pin danh định (giá trị mô phỏng mặc định).
    * $E_{\text{stored}} = E_{\text{grid}} \times \eta$: Điện năng thực tế tích lũy vào bộ pin xe.
    * $\text{Tariff} = 3.850$ VND/kWh: Biểu giá điện mô phỏng trạm sạc.
    * $C_{\text{charge}} = E_{\text{grid}} \times \text{Tariff}$: Chi phí tài chính phiên sạc.
  + Công thức tính giá vốn bình quân gia quyền cập nhật tức thời:
    $$\text{New WAC} = \frac{(E_{\text{old}} \times WAC_{\text{old}}) + C_{\text{charge}}}{E_{\text{old}} + E_{\text{stored}}}$$
  + **Xử lý sạc vận hành của nhân viên trạm (Staff Operational Charging):** $C_{\text{charge}} = 0$ (không tạo nợ cá nhân), nhưng giá trị kho điện vẫn được vốn hóa theo đơn giá trạm để tránh làm loãng đơn giá vốn kho về 0.

### Tiêu chuẩn 4: Đặc tả Toán học Thuật toán Hare-Niemeyer (Largest Remainder Method)
- **Vấn đề tồn tại:** Mô tả thuật toán bằng lời văn sơ lược, thiếu chứng minh tính bảo toàn tiền lẻ.
- **Kết quả hiệu chỉnh V5 (Phụ lục M & Mục 5.17):**
  + Đặc tả 3 bước toán học chặt chẽ:
    1. Bước 1: Tính phần nguyên phân bổ $\text{Base}_i = \lfloor C \times r_i \rfloor$, tổng $S_{\text{base}} = \sum \text{Base}_i$.
    2. Bước 2: Tính phần dư $R_i = (C \times r_i) - \text{Base}_i$, xác định số tiền lẻ thiếu $\Delta = C - S_{\text{base}}$.
    3. Bước 3: Sắp xếp theo $R_i$ giảm dần (nếu bằng nhau, sắp theo `user_id` tăng dần bảo đảm tính tất định - Determinism), cộng thêm đúng +1 VND cho $\Delta$ thành viên đầu tiên.
  + **Chứng minh toán học:** $\sum_{i=1}^N \text{FinalShare}_i \equiv C$ bảo toàn chính xác 100% hóa đơn gốc đến từng đơn vị 1 VND.
  + **Kiểm soát chống phân bổ trùng (Idempotency):** Kiểm tra khóa logic `(expense_id, user_id)` trước khi persist vào CSDL, chặn trùng lặp bằng mã lỗi `409 CONFLICT` theo `BR-EXP-05`.

### Tiêu chuẩn 5: Loại bỏ 100% Văn bản Giữ chỗ Generic trong Từ điển CSDL
- **Vấn đề tồn tại:** Phiên bản cũ có tới 393/626 cột CSDL mang mô tả chung chung *"Lưu trữ thông tin phân hệ..."*; một số cột bị gán nhầm khóa ngoại (FK) như `token`, `SOH%`, `actual_cost`.
- **Kết quả hiệu chỉnh V5:**
  + Toàn bộ 51 bảng CSDL và 626 cột được rà soát đối chiếu với thực thể JPA.
  + **Số lượng cột còn chứa mô tả generic:** **0 cột** (100% mô tả nghiệp vụ cụ thể theo ngữ cảnh miền xe điện).
  + **Sửa lỗi khóa ngoại sai:** Cột `token` (`password_reset_tokens`), `SOH%` (`vehicle_batteries`), `actual_cost` (`maintenances`) được xác nhận chính xác `fk='NO'`.

### Tiêu chuẩn 6: Khắc phục Gãy Tham chiếu Mã Kiểm thử và Minh bạch Học thuật
- **Vấn đề tồn tại:** Báo cáo cũ có 37 Use Case tham chiếu mã TC không tồn tại (`TC-CHG-`, `TC-EXP-`, `TC-CO-`, `TC-ADM-`); 35 Test Case trỏ sang mã FR không tồn tại (`FR-CHARGE-01`, `FR-FIN-01`); và gán bừa bãi `uc='UC-AUTH-01'` cho 31 test cases.
- **Kết quả hiệu chỉnh V5:**
  + Rà soát và chuẩn hóa bộ 100 Test Cases:
    * Nhóm chức năng: `TC-AUTH-01..06`, `TC-3D-01..07`, `TC-VEH-01..06`, `TC-OWN-01..06`, `TC-BOOK-01..06`, `TC-HAND-01..05`, `TC-CHRG-01..05`, `TC-FIN-01..07`, `TC-MAINT-01..05`, `TC-VOTE-01..05`, `TC-AUDIT-01..04`, `TC-NOTI-01..02`, `TC-AI-01`.
    * Nhóm hồi quy: `TC-REG-01..31` bao phủ 14 nhóm lỗi lịch sử.
  + **Tham chiếu FR không tồn tại trong Test Cases:** **0 lỗi**.
  + **Tham chiếu TC sai trong Use Cases:** **0 lỗi**.
  + **Phân bổ Use Case thực tế:** Mỗi ca kiểm thử được gắn đúng Use Case mục tiêu (chỉ 6 ca đăng nhập/đăng ký gắn `UC-AUTH-01..06`).
  + **Minh bạch học thuật tuyệt đối:**
    * Trạng thái kiểm thử (Status): `NOT EXECUTED (Chưa kiểm thử thực tế - Sẵn sàng thực thi)`.
    * Kết quả thực tế (Actual Result): `Chưa ghi nhận (Chưa thực thi thực tế)`.
    * Bằng chứng (Evidence): `Chưa có (Chưa thực thi thực tế)`.
    * Mục 6.3 trình bày tường minh lý do khách quan (môi trường máy trạm cục bộ, dữ liệu viễn thông sạc pin mô phỏng, VietQR sandbox, chưa có trạm sạc OCPP và cổng OBD-II vật lý).

### Tiêu chuẩn 7: Đặc tả Góc nhìn Camera 3D theo Vai trò và Giới hạn WebGL
- **Vấn đề tồn tại:** `UC-3D-07` mô tả sơ sài thao tác camera, thiếu các tham số kỹ thuật thực tế trong component React Three Fiber.
- **Kết quả hiệu chỉnh V5:**
  + Quy định rõ Preset Camera theo vai trò người dùng trong `UC-3D-07` và Mục 5.4 / 5.7:
    * `CO_OWNER`: Góc nhìn người lái và khoang cabin nội thất, thanh HUD điều khiển trạng thái pin.
    * `STAFF`: Góc nhìn kiểm định ngoại quan 4 góc xe (Trước-Trái, Trước-Phải, Sau-Trái, Sau-Phải) phục vụ biên bản bàn giao.
    * `ADMIN`: Góc nhìn bao cảnh trên cao toàn garage (Overview Isometric).
  + Ràng buộc góc ngẩng/chúi trong `OrbitControls`:
    $$\text{minPolarAngle} = 35^\circ \quad (0.61 \text{ rad}), \quad \text{maxPolarAngle} = 82^\circ \quad (1.43 \text{ rad})$$
    Ngăn chặn tuyệt đối hiện tượng camera chìm xuống sàn garage hoặc lật ngược không gian.

### Tiêu chuẩn 8: Khung Giữ chỗ Giao diện (20 UI Placeholders) và Bảo vệ Dữ liệu Cá nhân (PII)
- **Kết quả hiệu chỉnh V5:**
  + Tạo lập đầy đủ 20 khung giữ chỗ `Callout Boxes` định dạng viền xanh tiêu chuẩn (`UI-01` đến `UI-20`) tại các mục tương ứng trong Chương 5.
  + Đính kèm hướng dẫn che mờ thông tin cá nhân (PII Redaction Guidelines) tại Phụ lục N: che mờ biển số xe thực tế, số điện thoại, email cá nhân và số tài khoản ngân hàng nhằm tuân thủ Luật An toàn thông tin mạng.

### Tiêu chuẩn 9: Phân biệt Chỉ số Mục tiêu Đề xuất và Đo đạc Thực tế (Mục 6.5)
- **Vấn đề tồn tại:** Báo cáo cũ đưa ra các tuyên bố đo kiểm SonarQube (độ trùng lặp < 3.2%, 0 lỗ hổng) mà không có hệ thống đo tự động thực tế.
- **Kết quả hiệu chỉnh V5:**
  + Viết lại tiêu đề Mục 6.5 thành: *"6.5. Đánh giá Thiết kế Kiến trúc Mã nguồn và Kế hoạch Nghiệm thu Kỹ thuật (Architectural Code Assessment & Acceptance Plan)"*.
  + Phân tích thiết kế kiến trúc tĩnh dựa trên mã nguồn thực tế: tuân thủ phân tầng (Controller -> Service -> Repository), áp dụng nguyên lý SOLID [4], kiểm soát giao dịch `@Transactional`, không hardcode khóa bảo mật.
  + Đề xuất các chỉ số mục tiêu kỹ thuật (Acceptance Criteria Targets) cho giai đoạn triển khai CI/CD staging tương lai: Line Coverage > 80%, Code Duplication < 5.0%, SonarWay Quality Gate.

### Tiêu chuẩn 10: Giọng văn Học thuật Khách quan và Khung Giữ chỗ Sinh viên
- **Kết quả hiệu chỉnh V5:**
  + Bảo toàn 100% các khung giữ chỗ thông tin cá nhân và doanh nghiệp theo chuẩn hội đồng: `[HỌ VÀ TÊN SINH VIÊN]`, `[MÃ SỐ SINH VIÊN]`, `[LỚP KHÓA HỌC]`, `[GIẢNG VIÊN HƯỚNG DẪN]`, `[NGƯỜI HƯỚNG DẪN TẠI DOANH NGHIỆP]`, `[CƠ QUAN / DOANH NGHIỆP THỰC TẬP]`.
  + Trình bày kế hoạch thực tập 16 tuần dưới dạng khung đề xuất phân bổ công việc.
  + Loại bỏ các từ ngữ tự khen ngợi quá mức (thay *"hoàn thành xuất sắc"* bằng *"hoàn thành đầy đủ các mục tiêu cốt lõi"*).
  + Làm rõ tính chất mô phỏng của dữ liệu viễn thông pin và sạc điện.

### Tiêu chuẩn 11: Đánh giá Đóng góp, Giới hạn và Lộ trình Phát triển (Chương 7)
- **Kết quả hiệu chỉnh V5:**
  + **6 Ưu điểm công nghệ nổi bật:** 3D Digital Twin WebGL; Hạch toán năng lượng WAC; Phân bổ chi phí Hare-Niemeyer bảo toàn 100% đến 1 VND; Thanh toán VietQR tự động có kiểm soát No Self-Approval; Phân quyền RBAC 3 vai trò; Kiến trúc Clean Architecture.
  + **5 Điểm hạn chế kỹ thuật:** Dữ liệu Telemetry mô phỏng chưa kết nối OBD-II/OCPP thực tế; Hiệu năng 3D trên di động yếu; Cổng VietQR ở chế độ sandbox; Kiểm thử chưa tích hợp CI/CD tự động; Chưa có AI tối ưu lịch xe thời gian thực.
  + **5 Bài học kinh nghiệm sâu sắc:** Thiết kế dữ liệu chuẩn 3NF; Kiểm soát bất biến tiền tệ VND; Cân bằng hiệu năng đồ họa; Tách biệt mối quan tâm; Minh bạch học thuật.
  + **Lộ trình phát triển 4 giai đoạn:**
    * Giai đoạn 1: Tích hợp phần cứng IoT và chuẩn OCPP 2.0.1.
    * Giai đoạn 2: Cổng thanh toán chính thức và Hợp đồng điện tử.
    * Giai đoạn 3: Tối ưu hóa WebGL LOD và chuyển đổi ứng dụng PWA.
    * Giai đoạn 4: Trí tuệ nhân tạo dự báo bảo trì và tối ưu lịch xe.

### Tiêu chuẩn 12: Tính Toàn vẹn của Thư mục Tài liệu Tham khảo Chuẩn IEEE
- **Kết quả hiệu chỉnh V5:**
  + Duy trì đầy đủ 32 nguồn tài liệu tham khảo chuẩn IEEE [1]-[32], bao gồm các chuẩn ISO 12207, OMG UML 2.5.1, RFC 7807, RFC 7519, glTF 2.0, OCPP 2.0.1, Hare-Niemeyer (1987), và các công trình nền tảng của Codd, Chen, Martin, Fowler.

### Tiêu chuẩn 13 & 14: Cam kết Tuyệt đối Không Sửa đổi Mã nguồn Ứng dụng và CSDL
- **Phạm vi tuân thủ:**
  + 0 tệp tin nào trong thư mục `backend/` hoặc `frontend/` bị thay đổi.
  + Không có lệnh SQL nào được thực thi can thiệp vào máy chủ MySQL.
  + Không chạy lại tập lệnh Maven build hoặc npm test.
  + Toàn bộ công việc được thực hiện nghiêm ngặt trong thư mục `docs/graduation-internship-report/final/`.

---

## 3. KẾT LUẬN NGHIỆM THU

Báo cáo Thực tập Tốt nghiệp **EVShare 3D Phiên bản V5** đã hoàn thành toàn diện 14 mục tiêu kiểm toán chất lượng nội dung và tính nhất quán kỹ thuật. Tài liệu phản ánh chân thực, chính xác và chuyên nghiệp toàn bộ kết quả nghiên cứu và hiện thực hóa của dự án, đáp ứng trọn vẹn các yêu cầu khắt khe của một bản báo cáo tốt nghiệp kỹ sư CNTT / Kỹ thuật Phần mềm.
