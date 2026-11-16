# HƯỚNG DẪN XUẤT TÀI LIỆU VÀ KẾT XUẤT SƠ ĐỒ HỌC THUẬT
## (MANUAL EXPORT GUIDE FOR WORD, PDF AND DIAGRAM RENDERING)
### DỰ ÁN EVSHARE 3D

Tài liệu này cung cấp quy trình từng bước giúp sinh viên thực hiện chuyển đổi Báo cáo thực tập tốt nghiệp từ định dạng Markdown nguồn sang định dạng chuẩn nộp hội đồng phản biện: **Microsoft Word (.docx)** và **Adobe PDF (.pdf)**, kèm hướng dẫn kết xuất sơ đồ UML từ PlantUML/Mermaid sang ảnh vector SVG và PNG độ nét cao.

---

### PHẦN 1: KẾT XUẤT SƠ ĐỒ UML (PLANTUML & MERMAID)

Các sơ đồ thiết kế trong thư mục `docs/graduation-internship-report/diagrams/` được định dạng bằng mã nguồn PlantUML (`.puml`) và Mermaid (`.mmd`).

#### Cách 1: Sử dụng Công cụ Trực tuyến (Nhanh nhất, Không cần cài đặt)
1. **PlantUML Online Server**:
   * Truy cập: [https://www.plantuml.com/plantuml/uml/](https://www.plantuml.com/plantuml/uml/)
   * Mở tệp `.puml` tương ứng bằng trình soạn thảo (Notepad / VS Code), sao chép toàn bộ nội dung.
   * Dán vào ô soạn thảo trên website và bấm **Submit**.
   * Tải về dưới định dạng **PNG** (độ phân giải cao) hoặc **SVG** (ảnh vector phóng to không vỡ nét).
2. **Mermaid Live Editor**:
   * Truy cập: [https://mermaid.live/](https://mermaid.live/)
   * Sao chép nội dung mã nguồn Mermaid và dán vào cửa sổ bên trái.
   * Chọn **Download SVG** hoặc **Download PNG** (chọn tỷ lệ phóng 2x hoặc 3x).

#### Cách 2: Sử dụng Tiện ích mở rộng Visual Studio Code (VS Code Extension)
1. Cài đặt tiện ích **PlantUML** (của tác giả *jebbs*) trong VS Code Marketplace.
2. Cài đặt tiện ích **Mermaid Preview** hoặc **Markdown Preview Mermaid Support**.
3. Mở tệp sơ đồ bất kỳ, nhấn tổ hợp phím `Alt + D` để xem trước trực tiếp.
4. Nhấp chuột phải vào sơ đồ và chọn **Export Current Diagram**, chọn định dạng xuất là `.png` hoặc `.svg`.

---

### PHẦN 2: CHUYỂN ĐỔI BÁO CÁO SANG MICROSOFT WORD (.DOCX)

#### Phương Pháp 1: Sử Dụng Pandoc (Khuyến nghị chuẩn học thuật cao nhất)
Pandoc là công cụ chuyển đổi tài liệu học thuật mạnh mẽ nhất, giữ nguyên cấu trúc tiêu đề, bảng biểu, công thức toán KaTeX và danh mục trích dẫn.

**Bước 1: Cài đặt Pandoc**
* Tải bản cài đặt Pandoc tại: [https://pandoc.org/installing.html](https://pandoc.org/installing.html) (hoặc qua Chocolatey: `choco install pandoc`).

**Bước 2: Chuẩn bị tệp định dạng chuẩn (Reference Template - Tùy chọn)**
* Sinh viên có thể tạo một tệp Word mẫu `custom-reference.docx` đã định dạng sẵn font chữ Times New Roman 13pt, lề trái 3.5cm, lề phải 2.0cm, dãn dòng 1.5 lines.

**Bước 3: Thực hiện lệnh chuyển đổi**
Mở Command Prompt hoặc PowerShell tại thư mục báo cáo và chạy lệnh:
```bash
cd D:\EV3D\docs\graduation-internship-report

pandoc BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md -o BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.docx --toc --toc-depth=3
```
*Nếu có sử dụng tệp mẫu reference docx:*
```bash
pandoc BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md -o BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.docx --reference-doc=custom-reference.docx --toc --toc-depth=3
```

---

### PHẦN 3: XUẤT BÁO CÁO SANG ĐỊNH DẠNG PDF (.PDF)

#### Phương Pháp 1: Xuất Trực Tiếp Từ Microsoft Word
Sau khi chuyển đổi tệp Markdown sang `.docx` bằng Pandoc:
1. Mở tệp `.docx` trong Microsoft Word.
2. Kiểm tra lại bố cục trang, mục lục tự động (nhấp chuột phải vào Mục lục chọn *Update Field*).
3. Thay thế các placeholder `[CHÈN HÌNH MINH CHỨNG TẠI ĐÂY]` bằng ảnh chụp thực tế đã lưu trong thư mục `figures/`.
4. Vào menu **File** -> **Export** -> **Create PDF/XPS Document**.
5. Chọn chuẩn chất lượng cao nhất (Standard / High Quality Print) và lưu tệp `BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.pdf`.

#### Phương Pháp 2: Sử Dụng Tiện Ích Markdown PDF Trong VS Code
1. Cài đặt tiện ích mở rộng **Markdown PDF** (tác giả *yzane*) trong VS Code.
2. Mở tệp `BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md`.
3. Nhấp chuột phải vào nội dung văn bản và chọn **Markdown PDF: Export (pdf)**.
4. Tệp PDF hoàn chỉnh sẽ được tự động tạo trong cùng thư mục với đầy đủ liên kết và định dạng bảng.

---

### PHẦN 4: DANH MỤC KIỂM TRA TRƯỚC KHI NỘP BÁO CÁO (PRE-SUBMISSION CHECKLIST)

Trước khi in ấn hoặc nộp tệp lên hệ thống khảo thí của Nhà trường, sinh viên phải tự rà soát các mục sau:
- [ ] **Trang bìa & Trang phụ bìa**: Điền đầy đủ Tên Trường, Tên Khoa, Tên Sinh viên, MSSV, Lớp, Giảng viên hướng dẫn, Cán bộ hướng dẫn tại doanh nghiệp.
- [ ] **Lời cam đoan & Lời cảm ơn**: Đọc kỹ và xác nhận tính trung thực cá nhân trước khi ký tên.
- [ ] **Phiếu đánh giá**: Đính kèm phiếu đánh giá kết quả thực tập theo mẫu quy chuẩn của trường (để cán bộ doanh nghiệp và giảng viên chấm điểm).
- [ ] **Hình ảnh minh chứng**: Đảm bảo đã thay thế toàn bộ các placeholder bằng ảnh chụp giao diện hệ thống thực tế thu thập từ môi trường chạy thử.
- [ ] **Căn lề chuẩn A4**: Trái 3.5 cm; Phải 2.0 cm; Trên 2.5 cm; Dưới 2.5 cm; Font chữ Times New Roman kích thước 13 pt; Dãn dòng 1.5 line.
- [ ] **Cập nhật số trang**: Số trang La Mã (i, ii, iii...) cho phần đầu và số trang Ả Rập (1, 2, 3...) bắt đầu từ Chương 1 đến hết Phụ lục.
