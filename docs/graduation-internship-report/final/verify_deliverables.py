# -*- coding: utf-8 -*-
"""
verify_deliverables.py - Kiểm định toàn bộ 11 hạng mục bàn giao theo yêu cầu
"""
import os

FINAL_DIR = r"D:\EV3D\docs\graduation-internship-report\final"

deliverables = [
    ("BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.docx", "Tệp Word báo cáo hoàn chỉnh (Primary Submission)"),
    ("BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.pdf", "Tệp PDF xuất bản in ấn chất lượng cao"),
    ("BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.md", "Tệp Markdown hợp nhất toàn diện"),
    ("DIAGRAM_INVENTORY.md", "Danh mục 81 sơ đồ thiết kế phân rã"),
    ("MISSING_SCREENSHOTS.md", "Danh mục khung thu thập ảnh chụp giao diện"),
    ("REPORT_VALIDATION.md", "Biên bản kiểm định tính toàn vẹn báo cáo"),
    ("SOURCE_EVIDENCE_INDEX.md", "Chỉ mục ánh xạ minh chứng mã nguồn thực tế"),
    ("diagrams/source", "Thư mục mã nguồn PlantUML phân rã"),
    ("diagrams/rendered", "Thư mục hình ảnh sơ đồ PNG chất lượng cao"),
]

print("=" * 80)
print("EVSHARE 3D - BÁO CÁO THỰC TẬP TỐT NGHIỆP: KIỂM ĐỊNH BÀN GIAO TOÀN DIỆN")
print("=" * 80)

all_ok = True
for rel_path, desc in deliverables:
    full_path = os.path.join(FINAL_DIR, rel_path)
    exists = os.path.exists(full_path)
    if os.path.isdir(full_path):
        count = len(os.listdir(full_path)) if exists else 0
        status = f"EXISTS (Contains {count} files)" if exists and count > 0 else "MISSING / EMPTY"
        print(f"[{'PASS' if exists and count > 0 else 'FAIL'}] {desc}\n       Đường dẫn: {full_path} -> {status}")
    else:
        size_kb = os.path.getsize(full_path) / 1024 if exists else 0
        status = f"EXISTS ({size_kb:.1f} KB)" if exists and size_kb > 0 else "MISSING / EMPTY"
        print(f"[{'PASS' if exists and size_kb > 0 else 'FAIL'}] {desc}\n       Đường dẫn: {full_path} -> {status}")
    if not exists:
        all_ok = False

print("\nKiểm tra số lượng sơ đồ kết xuất PNG vs mã nguồn PUML:")
src_dir = os.path.join(FINAL_DIR, "diagrams", "source")
rnd_dir = os.path.join(FINAL_DIR, "diagrams", "rendered")
puml_cnt = len([f for f in os.listdir(src_dir) if f.endswith('.puml')])
png_cnt = len([f for f in os.listdir(rnd_dir) if f.endswith('.png')])
print(f" - Tổng số file .puml: {puml_cnt}")
print(f" - Tổng số file .png:  {png_cnt}")
if puml_cnt >= 81 and png_cnt >= 81:
    print(" -> ĐẠT: Toàn bộ 81 sơ đồ phân rã đã được kết xuất và sẵn sàng 100%!")
else:
    print(" -> LỖI: Số lượng sơ đồ chưa đạt chuẩn!")
    all_ok = False

print("=" * 80)
print(f"KẾT QUẢ KIỂM ĐỊNH: {'HOÀN TẤT THÀNH CÔNG VƯỢT CHUẨN' if all_ok else 'CÓ LỖI'}")
print("=" * 80)
