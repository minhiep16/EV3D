# DANH MỤC TOÀN DIỆN 88 CA SỬ DỤNG (USE CASE CATALOG) — EVSHARE 3D V3

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Báo cáo:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V3.0  
**Nguyên tắc tổ chức:**
- **14 Use Cases đại diện cốt lõi** được đặc tả chi tiết dưới dạng bảng tại **Mục 3.9 (Chương 3)**.
- **74 Use Cases chi tiết còn lại** được đặc tả đầy đủ dưới dạng bảng tại **Phụ lục C**.
- Toàn bộ 88 Use Cases đều được trình bày bằng **bảng Word hai cột kẻ viền native**, không có bảng nào bị thay thế bằng văn bản thô.

---


### A. Xác thực và quản lý tài khoản

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 1 | **UC-AUTH-01** | Đăng nhập hệ thống (Login) | `Người dùng` | **Mục 3.9.1** | SEQ-01, ACT-01 | `FR-AUTH-01` | `BR-AUTH-01` |
| 2 | **UC-AUTH-02** | Đăng xuất hệ thống (Logout) | `Người dùng` | **Mục 3.9.1** | SEQ-01 | `FR-AUTH-03` | `BR-AUTH-02` |
| 3 | **UC-AUTH-03** | Đăng ký tài khoản thành viên (Register) | `Khách vãng lai` | **Phụ lục C.1** | ACT-01 | `FR-AUTH-01` | `BR-AUTH-03` |
| 4 | **UC-AUTH-04** | Làm mới Token xác thực (Refresh Token) | `Hệ thống / User` | **Phụ lục C.1** | SEQ-01 | `FR-AUTH-02` | `BR-AUTH-04` |
| 5 | **UC-AUTH-05** | Xem thông tin hồ sơ cá nhân (View Profile) | `Người dùng` | **Phụ lục C.1** | UC-02 | `FR-AUTH-04` | `BR-AUTH-05` |
| 6 | **UC-AUTH-06** | Cập nhật thông tin hồ sơ cá nhân (Update Profile) | `Người dùng` | **Phụ lục C.1** | UC-02 | `FR-AUTH-04` | `BR-AUTH-05` |
| 7 | **UC-AUTH-07** | Đổi mật khẩu tài khoản (Change Password) | `Người dùng` | **Phụ lục C.1** | UC-02 | `FR-AUTH-01` | `BR-AUTH-01` |

### B. Quản trị hệ thống (ADMIN)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 8 | **UC-ADMIN-01** | Xem danh sách tài khoản người dùng | `ADMIN` | **Mục 3.9.2** | UC-03 | `FR-ADM-01` | `BR-ADM-01` |
| 9 | **UC-ADMIN-02** | Tìm kiếm và lọc tài khoản người dùng | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-01` | `BR-ADM-01` |
| 10 | **UC-ADMIN-03** | Cập nhật vai trò người dùng (Role Assignment) | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-02` | `BR-ADM-02` |
| 11 | **UC-ADMIN-04** | Khóa hoặc mở khóa tài khoản người dùng | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-03` | `BR-ADM-03` |
| 12 | **UC-ADMIN-05** | Xem danh sách đội xe (Vehicle Fleet Overview) | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-04` | `BR-ADM-04` |
| 13 | **UC-ADMIN-06** | Quản lý thông tin phương tiện (Vehicle Management) | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-04` | `BR-ADM-04` |
| 14 | **UC-ADMIN-07** | Quản lý nhóm đồng sở hữu xe | `ADMIN` | **Mục 3.9.2** | UC-03, CLASS-03 | `FR-ADM-05` | `BR-ADM-05` |
| 15 | **UC-ADMIN-08** | Xem chi tiết thành viên nhóm đồng sở hữu | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-05` | `BR-ADM-05` |
| 16 | **UC-ADMIN-09** | Xem lịch sử biến động tỷ lệ sở hữu (Ownership History) | `ADMIN` | **Phụ lục C.2** | CLASS-03 | `FR-ADM-06` | `BR-ADM-06` |
| 17 | **UC-ADMIN-10** | Xem bảng điều khiển thống kê vận hành (Operational Analytics) | `ADMIN` | **Phụ lục C.2** | UC-03 | `FR-ADM-07` | `BR-ADM-07` |
| 18 | **UC-ADMIN-11** | Tra cứu nhật ký kiểm toán hệ thống (Audit Logs) | `ADMIN` | **Phụ lục C.2** | ERD-02 | `FR-ADM-08` | `BR-ADM-08` |

### C. Đặt lịch sử dụng xe (Booking)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 19 | **UC-BOOK-01** | Tra cứu khung giờ rảnh của phương tiện | `CO_OWNER` | **Mục 3.9.3** | ACT-02 | `FR-BOOK-01` | `BR-BOOK-01` |
| 20 | **UC-BOOK-02** | Tạo lịch đặt xe mới kèm xử lý khử xung đột | `CO_OWNER` | **Mục 3.9.3** | SEQ-03, ACT-02 | `FR-BOOK-02` | `BR-BOOK-02` |
| 21 | **UC-BOOK-03** | Hủy lịch đặt xe hợp lệ trước giờ khởi hành | `CO_OWNER` | **Phụ lục C.3** | SEQ-08 | `FR-BOOK-03` | `BR-BOOK-03` |
| 22 | **UC-BOOK-04** | Xem lịch sử đặt xe cá nhân | `CO_OWNER` | **Phụ lục C.3** | UC-06 | `FR-BOOK-01` | `BR-BOOK-01` |

### D. Bàn giao, chuyến đi và trả xe (Trip & Handover)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 23 | **UC-TRIP-01** | Kiểm tra kỹ thuật tiền chuyến đi (Pre-Trip Inspection) | `STAFF / CO_OWNER` | **Mục 3.9.4** | ACT-03 | `FR-HAND-01` | `BR-HAND-01` |
| 24 | **UC-TRIP-02** | Nhân viên xác minh bàn giao xe kỹ thuật | `STAFF` | **Mục 3.9.4** | SEQ-04, ACT-03 | `FR-HAND-02` | `BR-HAND-02` |
| 25 | **UC-TRIP-03** | Co-Owner xem và ký nhận bàn giao xe | `CO_OWNER` | **Phụ lục C.4** | SEQ-04 | `FR-HAND-03` | `BR-HAND-03` |
| 26 | **UC-TRIP-04** | Khởi hành bắt đầu chuyến đi (Start Trip Check-in) | `CO_OWNER` | **Mục 3.9.4** | SEQ-05, ACT-04 | `FR-TRIP-01` | `BR-TRIP-01` |
| 27 | **UC-TRIP-05** | Theo dõi hành trình chuyến đi đang hoạt động | `CO_OWNER` | **Phụ lục C.4** | STATE-03 | `FR-TRIP-02` | `BR-TRIP-02` |
| 28 | **UC-TRIP-06** | Yêu cầu gia hạn thời gian chuyến đi | `CO_OWNER` | **Phụ lục C.4** | SEQ-21 | `FR-TRIP-03` | `BR-TRIP-03` |
| 29 | **UC-TRIP-07** | Đàm phán chấp thuận hoặc từ chối gia hạn chuyến đi | `CO_OWNER kế tiếp` | **Phụ lục C.4** | SEQ-21 | `FR-TRIP-03` | `BR-TRIP-04` |
| 30 | **UC-TRIP-08** | Gửi yêu cầu trả xe kết thúc hành trình | `CO_OWNER` | **Mục 3.9.4** | SEQ-07, ACT-05 | `FR-TRIP-04` | `BR-TRIP-05` |
| 31 | **UC-TRIP-09** | Kiểm định kỹ thuật nghiệm thu trả xe | `STAFF` | **Phụ lục C.4** | SEQ-07 | `FR-TRIP-05` | `BR-TRIP-06` |
| 32 | **UC-TRIP-10** | Nhân viên xác nhận hoàn tất trả xe và chốt chi phí | `STAFF` | **Mục 3.9.4** | SEQ-07, ACT-05 | `FR-TRIP-05` | `BR-TRIP-07` |
| 33 | **UC-TRIP-11** | Xem lịch sử chuyến đi và bàn giao | `CO_OWNER / STAFF` | **Phụ lục C.4** | UC-06 | `FR-TRIP-01` | `BR-TRIP-01` |

### E. Kiểm tra kỹ thuật và bảo dưỡng (Damage & Maintenance)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 34 | **UC-MAINT-01** | Ghi nhận vết hư hại thân vỏ gắn tọa độ 3D Hotspot | `STAFF` | **Mục 3.9.5** | SEQ-06, SEQ-20 | `FR-DAMG-01` | `BR-DAMG-01` |
| 35 | **UC-MAINT-02** | Xem danh sách hư hại chưa khắc phục | `CO_OWNER / STAFF` | **Phụ lục C.5** | UC-07 | `FR-DAMG-02` | `BR-DAMG-02` |
| 36 | **UC-MAINT-03** | So sánh đối chiếu biên bản kiểm định trước và sau | `STAFF` | **Phụ lục C.5** | CLASS-05 | `FR-INS-01` | `BR-INS-01` |
| 37 | **UC-MAINT-04** | Tạo đề xuất bảo dưỡng kỹ thuật định kỳ | `CO_OWNER / STAFF` | **Phụ lục C.5** | SEQ-18 | `FR-MAINT-01` | `BR-MAINT-01` |
| 38 | **UC-MAINT-05** | Lập lịch và phê duyệt lệnh bảo dưỡng xe | `STAFF / ADMIN` | **Phụ lục C.5** | SEQ-18 | `FR-MAINT-02` | `BR-MAINT-02` |
| 39 | **UC-MAINT-06** | Cập nhật tiến độ bảo dưỡng xe tại xưởng | `STAFF` | **Phụ lục C.5** | STATE-10 | `FR-MAINT-03` | `BR-MAINT-03` |
| 40 | **UC-MAINT-07** | Nghiệm thu hoàn tất bảo dưỡng và đưa xe về AVAILABLE | `STAFF` | **Phụ lục C.5** | STATE-01 | `FR-MAINT-04` | `BR-MAINT-04` |

### F. Pin, sạc điện và tồn kho năng lượng (Charging & Energy)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 41 | **UC-CHRG-01** | Bắt đầu phiên sạc điện tại trụ thông minh | `CO_OWNER / STAFF` | **Mục 3.9.6** | SEQ-09, ACT-06 | `FR-CHARGE-01` | `BR-CHRG-01` |
| 42 | **UC-CHRG-02** | Theo dõi tiến trình sạc thời gian thực | `CO_OWNER / STAFF` | **Phụ lục C.6** | STATE-05 | `FR-CHARGE-02` | `BR-CHRG-02` |
| 43 | **UC-CHRG-03** | Dừng và hoàn tất phiên sạc điện | `CO_OWNER / STAFF` | **Mục 3.9.6** | SEQ-10, ACT-06 | `FR-CHARGE-03` | `BR-CHRG-03` |
| 44 | **UC-CHRG-04** | Tra cứu trạng thái sức khỏe cụm pin (Battery SOH/SOC) | `CO_OWNER` | **Phụ lục C.6** | UC-08 | `FR-ENERGY-01` | `BR-ENER-01` |
| 45 | **UC-CHRG-05** | Xem báo cáo kho năng lượng xe (Energy Inventory) | `CO_OWNER / ADMIN` | **Phụ lục C.6** | SEQ-10, ARCH-06 | `FR-ENERGY-02` | `BR-ENER-02` |
| 46 | **UC-CHRG-06** | Tra cứu lịch sử giao dịch xuất/nhập kho năng lượng | `ADMIN / STAFF` | **Phụ lục C.6** | ERD-06 | `FR-ENERGY-03` | `BR-ENER-03` |

### G. Tài chính và thanh toán (Finance & Payments)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 47 | **UC-FIN-01** | Tạo và phê duyệt khoản chi phí phương tiện | `STAFF / ADMIN` | **Mục 3.9.7** | SEQ-11, ACT-07 | `FR-FIN-01` | `BR-FIN-01` |
| 48 | **UC-FIN-02** | Xem tổng hợp nghĩa vụ tài chính cá nhân | `CO_OWNER` | **Mục 3.9.7** | UC-09 | `FR-FIN-02` | `BR-FIN-02` |
| 49 | **UC-FIN-03** | Xem chi tiết phân bổ chi phí theo tỷ lệ sở hữu | `CO_OWNER` | **Phụ lục C.7** | SEQ-11 | `FR-FIN-03` | `BR-FIN-03` |
| 50 | **UC-FIN-04** | Nộp chứng từ thanh toán DEMO | `CO_OWNER` | **Mục 3.9.7** | SEQ-13, ACT-07 | `FR-FIN-04` | `BR-FIN-04` |
| 51 | **UC-FIN-05** | Nhân viên xác minh phê duyệt thanh toán | `STAFF` | **Mục 3.9.7** | SEQ-13 | `FR-FIN-05` | `BR-FIN-05` |
| 52 | **UC-FIN-06** | Từ chối chứng từ thanh toán không hợp lệ | `STAFF` | **Phụ lục C.7** | SEQ-23 | `FR-FIN-06` | `BR-FIN-06` |
| 53 | **UC-FIN-07** | Xem lịch sử thanh toán cá nhân | `CO_OWNER` | **Phụ lục C.7** | UC-09 | `FR-FIN-07` | `BR-FIN-07` |

### H. Quản lý đồng sở hữu (Co-Ownership)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 54 | **UC-OWN-01** | Xem thông tin nhóm đồng sở hữu xe | `CO_OWNER` | **Mục 3.9.8** | UC-05, CLASS-03 | `FR-OWN-01` | `BR-OWN-01` |
| 55 | **UC-OWN-02** | Xem cơ cấu tỷ lệ phần trăm sở hữu vốn | `CO_OWNER` | **Phụ lục C.8** | SEQ-12 | `FR-OWN-02` | `BR-OWN-02` |
| 56 | **UC-OWN-03** | Khởi tạo đề xuất chuyển nhượng cổ phần | `CO_OWNER` | **Mục 3.9.8** | SEQ-14, ACT-08 | `FR-OWN-03` | `BR-OWN-03` |
| 57 | **UC-OWN-04** | Bên nhận chấp thuận hoặc từ chối chuyển nhượng | `CO_OWNER (Bên nhận)` | **Phụ lục C.8** | SEQ-14 | `FR-OWN-04` | `BR-OWN-04` |
| 58 | **UC-OWN-05** | Trưởng nhóm phê duyệt chuyển nhượng cổ phần | `CO_OWNER (Leader)` | **Phụ lục C.8** | SEQ-14 | `FR-OWN-05` | `BR-OWN-05` |
| 59 | **UC-OWN-06** | Tất toán chuyển nhượng và bảo toàn bất biến vốn 100% | `Hệ thống` | **Phụ lục C.8** | SEQ-14, STATE-10 | `FR-OWN-06` | `BR-OWN-06` |
| 60 | **UC-OWN-07** | Xem lịch sử chuyển nhượng cổ phần | `CO_OWNER` | **Phụ lục C.8** | UC-10 | `FR-OWN-07` | `BR-OWN-07` |
| 61 | **UC-OWN-08** | Gửi thư mời thành viên mới gia nhập nhóm | `CO_OWNER (Leader)` | **Mục 3.9.8** | ACT-09, STATE-11 | `FR-INV-01` | `BR-INV-01` |
| 62 | **UC-OWN-09** | Người được mời xem xét thư mời gia nhập | `User được mời` | **Phụ lục C.8** | ACT-09 | `FR-INV-02` | `BR-INV-02` |
| 63 | **UC-OWN-10** | Cổ đông hiện hữu đồng thuận trích phần vốn góp | `CO_OWNER hiện hữu` | **Phụ lục C.8** | STATE-11 | `FR-INV-03` | `BR-INV-03` |
| 64 | **UC-OWN-11** | Kích hoạt tư cách thành viên mới sau khi đủ điều kiện | `Hệ thống / Leader` | **Phụ lục C.8** | STATE-11 | `FR-INV-04` | `BR-INV-04` |

### I. Hợp đồng pháp lý (Contracts)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 65 | **UC-CON-01** | Xem hợp đồng đồng sở hữu hiện hành | `CO_OWNER` | **Mục 3.9.9** | UC-11 | `FR-CON-01` | `BR-CON-01` |
| 66 | **UC-CON-02** | Xem dự thảo phiên bản hợp đồng mới | `CO_OWNER` | **Phụ lục C.9** | STATE-07 | `FR-CON-02` | `BR-CON-02` |
| 67 | **UC-CON-03** | Ký kết hợp đồng điện tử mô phỏng (DEMO Signature) | `CO_OWNER` | **Mục 3.9.9** | SEQ-15, ACT-09 | `FR-CON-03` | `BR-CON-03` |
| 68 | **UC-CON-04** | Theo dõi tiến độ chữ ký các bên trong hợp đồng | `CO_OWNER / ADMIN` | **Phụ lục C.9** | STATE-07 | `FR-CON-04` | `BR-CON-04` |
| 69 | **UC-CON-05** | Tra cứu lịch sử các phiên bản hợp đồng | `CO_OWNER / ADMIN` | **Phụ lục C.9** | ERD-08 | `FR-CON-05` | `BR-CON-05` |

### J. Biểu quyết và tranh chấp (Voting & Disputes)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 70 | **UC-VOTE-01** | Tạo đề xuất biểu quyết tập thể nhóm | `CO_OWNER` | **Mục 3.9.10** | SEQ-17, ACT-10 | `FR-VOTE-01` | `BR-VOTE-01` |
| 71 | **UC-VOTE-02** | Xem danh sách các đề xuất biểu quyết | `CO_OWNER` | **Phụ lục C.10** | UC-12 | `FR-VOTE-02` | `BR-VOTE-02` |
| 72 | **UC-VOTE-03** | Bỏ phiếu biểu quyết theo trọng số vốn | `CO_OWNER` | **Mục 3.9.10** | SEQ-17, ACT-10 | `FR-VOTE-03` | `BR-VOTE-03` |
| 73 | **UC-VOTE-04** | Xem kết quả kiểm phiếu và quyết định thông qua | `CO_OWNER` | **Phụ lục C.10** | STATE-08 | `FR-VOTE-04` | `BR-VOTE-04` |
| 74 | **UC-VOTE-05** | Khởi tạo khiếu nại tranh chấp sau sự cố | `CO_OWNER` | **Mục 3.9.10** | SEQ-22, ACT-11 | `FR-DISP-01` | `BR-DISP-01` |
| 75 | **UC-VOTE-06** | Nộp bổ sung bằng chứng và tin nhắn hòa giải | `CO_OWNER` | **Phụ lục C.10** | SEQ-22 | `FR-DISP-02` | `BR-DISP-02` |
| 76 | **UC-VOTE-07** | Nhân viên tiếp nhận điều tra khiếu nại | `STAFF` | **Phụ lục C.10** | SEQ-22 | `FR-DISP-03` | `BR-DISP-03` |
| 77 | **UC-VOTE-08** | Thực thi giải pháp bồi thường hòa giải | `STAFF / ADMIN` | **Phụ lục C.10** | SEQ-22, STATE-12 | `FR-DISP-04` | `BR-DISP-04` |
| 78 | **UC-VOTE-09** | Xem lịch sử giải quyết tranh chấp | `CO_OWNER / STAFF` | **Phụ lục C.10** | UC-12 | `FR-DISP-05` | `BR-DISP-05` |

### K. Tương tác không gian 3D Garage (Garage 3D)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 79 | **UC-3D-01** | Chọn và chuyển đổi xe hiển thị trên bục xoay 3D | `Người dùng` | **Mục 3.9.11** | UC-13, ARCH-05 | `FR-3D-01` | `BR-3D-01` |
| 80 | **UC-3D-02** | Xem thông số kỹ thuật xe qua thẻ Hologram 3D | `Người dùng` | **Phụ lục C.11** | UC-13 | `FR-3D-02` | `BR-3D-02` |
| 81 | **UC-3D-03** | Khám phá bóc tách các cụm chi tiết xe 3D | `CO_OWNER` | **Phụ lục C.11** | COMP-03 | `FR-3D-03` | `BR-3D-03` |
| 82 | **UC-3D-04** | Kích hoạt chế độ X-Ray kiểm tra khối pin | `CO_OWNER` | **Mục 3.9.11** | UC-13, COMP-03 | `FR-3D-04` | `BR-3D-04` |
| 83 | **UC-3D-05** | Tương tác nhấp chọn điểm nóng tổn hại 3D | `CO_OWNER / STAFF` | **Mục 3.9.11** | SEQ-20, COMP-03 | `FR-3D-05` | `BR-3D-05` |
| 84 | **UC-3D-06** | Tương tác với khu vực trụ sạc thông minh 3D | `CO_OWNER / STAFF` | **Phụ lục C.11** | UC-13 | `FR-3D-06` | `BR-3D-06` |
| 85 | **UC-3D-07** | Đặt lại góc nhìn camera về vị trí tổng quan chuẩn | `Người dùng` | **Phụ lục C.11** | COMP-03 | `FR-3D-07` | `BR-3D-07` |

### L. Thông báo và hỗ trợ (Notifications & Support)

| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |
|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|
| 86 | **UC-NOTI-01** | Xem danh sách thông báo thời gian thực | `Người dùng` | **Mục 3.9.12** | UC-02 | `FR-NOTI-01` | `BR-NOTI-01` |
| 87 | **UC-NOTI-02** | Đánh dấu thông báo đã đọc | `Người dùng` | **Phụ lục C.12** | UC-02 | `FR-NOTI-02` | `BR-NOTI-02` |
| 88 | **UC-NOTI-03** | Tra cứu quy chế và đối thoại với Trợ lý ảo AI | `CO_OWNER` | **Mục 3.9.12** | COMP-03 | `FR-NOTI-03` | `BR-NOTI-03` |


---
**Tổng cộng:** **88 Use Cases** được phân loại khoa học và lập tài liệu đặc tả 100%.
