# BỘ TÀI LIỆU BÁO CÁO THỰC TẬP TỐT NGHIỆP — EVSHARE 3D
## (MASTER GRADUATION INTERNSHIP REPORT PACKAGE)

### THÔNG TIN DỰ ÁN
* **Tên dự án:** EVShare 3D
* **Tên tiếng Việt:** Nền tảng thông minh hỗ trợ quản trị và vận hành xe điện đồng sở hữu trên không gian Web 3D tương tác
* **Tên tiếng Anh:** Intelligent Web 3D Platform for Electric Vehicle Co-Ownership Management and Operations
* **Lĩnh vực học thuật:** Công nghệ Thông tin / Kỹ thuật Phần mềm
* **Công nghệ cốt lõi:**
  * **Frontend:** React 18, TypeScript, Vite, Three.js (r173), React Three Fiber, Zustand, TanStack Query
  * **Backend:** Java 21, Spring Boot 3.3.4, Spring Security, JWT, Spring Data JPA, Hibernate ORM, Flyway
  * **Database:** MySQL 8.0+ (46 Bảng thực thể quan hệ qua 46 bản di chuyển Flyway)

---

### CẤU TRÚC THƯ MỤC TÀI LIỆU
```text
docs/graduation-internship-report/
├── BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md  # BÁO CÁO CHÍNH THỨC HOÀN CHỈNH TOÀN DIỆN
├── README.md                                  # Giới thiệu bộ tài liệu và tiến độ dự án
├── SCREENSHOT_CHECKLIST.md                    # Danh mục minh chứng ảnh chụp và hướng dẫn thu thập
├── MANUAL_TEST_CASES.md                       # Danh mục 100 ca kiểm thử hệ thống chi tiết
├── EXPORT_GUIDE.md                            # Hướng dẫn kết xuất ra Word (.docx), PDF (.pdf) & Sơ đồ
├── chapters/                                  # Các chương báo cáo phân tách để dễ bảo trì
│   ├── 00_front_matter.md                    # Trang bìa, Lời cam đoan, Lời cảm ơn, Tóm tắt, Mục lục
│   ├── 01_project_overview.md                # Chương 1: Tổng quan về đề tài và đơn vị thực tập
│   ├── 02_theoretical_background.md          # Chương 2: Cơ sở lý thuyết và công nghệ áp dụng
│   ├── 03_requirements_analysis.md           # Chương 3: Khảo sát và phân tích yêu cầu hệ thống
│   ├── 04_system_design.md                   # Chương 4: Phân tích và thiết kế hệ thống (UML/DB)
│   ├── 05_system_implementation.md           # Chương 5: Xây dựng và triển khai hệ thống (Source Code)
│   ├── 06_testing_and_evaluation.md          # Chương 6: Kiểm thử và đánh giá hệ thống (100 Test Cases)
│   ├── 07_conclusion.md                      # Chương 7: Kết luận và hướng phát triển tương lai
│   └── 08_appendices.md                      # Phần phụ lục kỹ thuật chi tiết (Phụ lục A - N)
├── diagrams/                                  # Mã nguồn sơ đồ thiết kế hệ thống (PlantUML / Mermaid)
│   ├── architecture/                         # Sơ đồ kiến trúc tổng thể, phân tầng, bảo mật, đồ họa
│   ├── use-case/                             # Sơ đồ Use Case tổng quát và phân hệ
│   ├── activity/                             # Sơ đồ hoạt động phân làn (Swimlane Activities)
│   ├── sequence/                             # Sơ đồ tuần tự các luồng nghiệp vụ cốt lõi
│   ├── class/                                # Sơ đồ lớp miền dữ liệu (Domain Class Diagrams)
│   ├── database/                             # Sơ đồ thực thể quan hệ cơ sở dữ liệu (ERD)
│   ├── state-machine/                        # Sơ đồ máy trạng thái vòng đời thực thể
│   ├── component/                            # Sơ đồ thành phần Frontend / Backend
│   └── deployment/                           # Sơ đồ triển khai phần cứng và máy chủ
├── figures/                                   # Thư mục lưu trữ ảnh chụp màn hình minh chứng
│   ├── authentication/
│   ├── admin/
│   ├── staff/
│   ├── co-owner/
│   ├── garage-3d/
│   └── testing/
└── references/                                # Tài liệu tham khảo và chứng cứ mã nguồn
    ├── bibliography.md                       # Danh mục tài liệu tham khảo chuẩn IEEE
    └── source_evidence_index.md              # Chỉ mục đối chiếu chứng cứ mã nguồn thực tế
```

---

### HƯỚNG DẪN DÀNH CHO SINH VIÊN TRƯỚC KHI NỘP BÁO CÁO
1. Mở tệp `chapters/00_front_matter.md` hoặc tệp báo cáo chính `BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md`.
2. Điền chính xác các thông tin trong ngoặc vuông `[...]`: Tên Trường, Tên Khoa, Tên Sinh viên, MSSV, Lớp, Họ tên Giảng viên hướng dẫn, Cán bộ hướng dẫn tại doanh nghiệp.
3. Chụp các ảnh giao diện thực tế theo hướng dẫn tại `SCREENSHOT_CHECKLIST.md`, lưu vào thư mục `figures/` và thay thế các mã giữ chỗ `[CHÈN HÌNH MINH CHỨNG TẠI ĐÂY]`.
4. Làm theo hướng dẫn tại `EXPORT_GUIDE.md` để chuyển đổi tệp Markdown thành bản in nộp hội đồng: **Microsoft Word (.docx)** và **Adobe PDF (.pdf)**.
