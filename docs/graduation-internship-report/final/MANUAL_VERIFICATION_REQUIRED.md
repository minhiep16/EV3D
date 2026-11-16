# DANH MỤC CÁC HẠNG MỤC CẦN SINH VIÊN XÁC NHẬN THỦ CÔNG (MANUAL VERIFICATION REQUIRED)

**Dự án:** EVShare 3D — Báo Cáo Thực Tập Tốt Nghiệp V3  
**Mục đích:** Liệt kê các thông tin mang tính hành chính, hồ sơ doanh nghiệp hoặc bằng chứng vận hành trực tiếp cần sinh viên điền thông tin chính xác trước khi nộp bản in chính thức lên Hội đồng chấm thi.

---

## 1. Thông Tin Hành Chính & Hồ Sơ Đồ Án

| STT | Mục Cần Xác Nhận | Giá Trị Giữ Chỗ Hiện Tại Trong Báo Cáo | Hướng Dẫn Sinh Viên Cập Nhật |
|:---:|:---|:---|:---|
| 1 | **Tên Cơ Quan Chủ Quản / Trường** | `[TÊN TRƯỜNG ĐẠI HỌC / HỌC VIỆN]` | Điền tên trường đại học đào tạo (ví dụ: Trường Đại học Bách Khoa, Đại học FPT,...) |
| 2 | **Khoa / Bộ Môn** | `[TÊN KHOA CÔNG NGHỆ THÔNG TIN]` | Điền tên Khoa / Viện quản lý ngành học |
| 3 | **Họ và Tên Sinh Viên** | `[TÊN SINH VIÊN]` | Điền đầy đủ họ và tên theo khai sinh |
| 4 | **Mã Số Sinh Viên (MSSV)** | `[MÃ SỐ SINH VIÊN]` | Điền mã số sinh viên chính thức |
| 5 | **Lớp Niên Chế / Khóa Học** | `[LỚP]` | Điền tên lớp sinh hoạt chuyên môn |
| 6 | **Giảng Viên Hướng Dẫn (GVHD)** | `[HỌ VÀ TÊN GIẢNG VIÊN HƯỚNG DẪN]` | Điền học hàm, học vị và họ tên GVHD chính |
| 7 | **Tên Doanh Nghiệp Thực Tập** | `[TÊN DOANH NGHIỆP / CÔNG TY CỔ PHẦN]` | Điền tên pháp nhân đầy đủ của công ty tiếp nhận thực tập |
| 8 | **Địa Chỉ Doanh Nghiệp & MST** | `[ĐỊA CHỈ TRỤ SỞ DOANH NGHIỆP]` | Điền địa chỉ trụ sở chính và mã số thuế doanh nghiệp |
| 9 | **Cán Bộ Hướng Dẫn Doanh Nghiệp**| `[HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN]` | Điền chức danh (Tech Lead, Senior Engineer) và họ tên người hướng dẫn |
| 10 | **Thời Gian Thực Tập** | `Tháng 12/2025 – Tháng 04/2026` | Cập nhật chính xác khoảng thời gian thực tập theo quyết định |
| 11 | **Địa Điểm & Năm Báo Cáo** | `[ĐỊA ĐIỂM] – NĂM [2026]` | Điền thành phố và năm bảo vệ (ví dụ: HÀ NỘI – NĂM 2026) |

---

## 2. Minh Chứng Thực Nghiệm Cần Thu Thập Trực Tiếp (Trước Khi Bảo Vệ)

1. **Phiếu Nhận Xét Của Doanh Nghiệp Thực Tập (Trang Đánh Giá):**
   - Cần in trang phiếu nhận xét, xin chữ ký tươi của Cán bộ hướng dẫn doanh nghiệp và đóng dấu tròn pháp nhân công ty tiếp nhận.
2. **Phiếu Nhận Xét Của Giảng Viên Hướng Dẫn:**
   - Xin chữ ký và điểm đánh giá quá trình từ Giảng viên hướng dẫn học thuật.
3. **Ảnh Chụp Giao Diện Thực Tế (Screenshots):**
   - Toàn bộ 20 khung giữ chỗ `UI-01` đến `UI-20` trong Chương 5 đã có sẵn mô tả chi tiết các bước chụp. Sinh viên khởi động ứng dụng cục bộ (`npm run dev` cổng 5173 và backend Spring Boot cổng 8080), chụp màn hình Full HD, che mờ thông tin cá nhân và thay thế vào các vị trí tương ứng.
4. **Xác Minh Thực Thi Kiểm Thử (Test Execution Evidence):**
   - Theo nguyên tắc học thuật của đồ án, toàn bộ 100 test case được ghi nhận trung thực ở trạng thái `NOT EXECUTED`. Trước buổi bảo vệ đồ án, sinh viên có thể chạy lệnh `mvn test` trên máy tính cá nhân để chụp ảnh màn hình kết quả xanh (Build Success / Tests Passed) đưa vào phần trình chiếu thuyết minh (Slide Defense).
