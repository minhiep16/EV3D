# -*- coding: utf-8 -*-
"""
audit_v4_docx.py - Kiểm tra toàn diện tài liệu BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V4.docx
"""
import os
import sys
import docx

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
DOCX_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V4.docx")

def audit_docx():
    print("=" * 75)
    print("KIỂM TOÁN CHẤT LƯỢNG VÀ TÍNH NHẤT QUÁN KỸ THUẬT BÁO CÁO V4 (DOCX)")
    print("=" * 75)

    if not os.path.exists(DOCX_PATH):
        print(f"LỖI: Tệp {DOCX_PATH} không tồn tại!")
        return

    file_size_mb = os.path.getsize(DOCX_PATH) / (1024 * 1024)
    print(f"1. Kích thước tệp: {file_size_mb:.2f} MB (Kỳ vọng: > 3.0 MB) -> {'ĐẠT' if file_size_mb > 3.0 else 'KHÔNG ĐẠT'}")

    doc = docx.Document(DOCX_PATH)
    
    total_paragraphs = len(doc.paragraphs)
    total_tables = len(doc.tables)
    print(f"2. Tổng số đoạn văn (paragraphs): {total_paragraphs}")
    print(f"3. Tổng số bảng native Word (tables): {total_tables}")

    # Kiểm tra số lượng ảnh nhúng
    images_count = 0
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            images_count += 1
    print(f"4. Tổng số ảnh nhúng trong tài liệu: {images_count} (Kỳ vọng: >= 86 sơ đồ) -> {'ĐẠT' if images_count >= 86 else 'KHÔNG ĐẠT'}")

    # Đếm số bảng đặc tả Use Case (15 hàng)
    uc_tables_15_rows = 0
    tc_tables = 0
    callout_boxes = 0
    generic_found = 0
    uc_3d_api_found = 0
    db_tables_count = 0
    
    generic_needle = "Mở giao diện chức năng"
    
    for t_idx, table in enumerate(doc.tables):
        rows_cnt = len(table.rows)
        cols_cnt = len(table.columns)
        
        # Callout box (1x1)
        if rows_cnt == 1 and cols_cnt == 1:
            callout_boxes += 1
            continue
            
        # Use Case table (16 rows total: 1 header row + 15 field rows)
        if rows_cnt == 16 and cols_cnt == 2:
            uc_tables_15_rows += 1
            # Check content for generic needle
            full_text = ""
            for r in table.rows:
                for c in r.cells:
                    full_text += c.text + " "
            if generic_needle in full_text:
                generic_found += 1
            if "UC-3D-" in full_text:
                if "REST API" in full_text and "Không gọi API" not in full_text and "Chỉ tương tác WebGL" not in full_text:
                    # check if claims to call API
                    if "Gửi HTTP" in full_text or "POST /api" in full_text or "ghi log audit" in full_text:
                        uc_3d_api_found += 1

        # Test Case table (11 rows total: 1 header row + 10 field rows)
        if rows_cnt == 11 and cols_cnt == 2:
            tc_tables += 1

        # DB Dictionary table (cols = 7)
        if cols_cnt == 7:
            # check header
            h_text = " ".join([c.text for c in table.rows[0].cells])
            if "Tên cột" in h_text or "Column" in h_text:
                db_tables_count += 1

    print(f"5. Bảng Callout Box (khung giữ chỗ UI): {callout_boxes} (Kỳ vọng: 20)")
    print(f"6. Bảng đặc tả Use Case chuẩn 15 hàng: {uc_tables_15_rows} (Kỳ vọng: 88 = 14 Ch3 + 74 App C) -> {'ĐẠT' if uc_tables_15_rows == 88 else 'KHÔNG ĐẠT'}")
    print(f"   - Số Use Case chứa văn bản sao chép generic: {generic_found} (Kỳ vọng: 0) -> {'ĐẠT' if generic_found == 0 else 'CẢNH BÁO'}")
    print(f"   - Số Use Case 3D vi phạm khai báo API/DB/Audit: {uc_3d_api_found} (Kỳ vọng: 0) -> {'ĐẠT' if uc_3d_api_found == 0 else 'CẢNH BÁO'}")
    print(f"7. Bảng đặc tả Ca kiểm thử Test Case: {tc_tables} (Kỳ vọng: 100) -> {'ĐẠT' if tc_tables == 100 else 'KHÔNG ĐẠT'}")
    print(f"8. Bảng từ điển CSDL quan hệ: {db_tables_count} (Kỳ vọng: 51) -> {'ĐẠT' if db_tables_count == 51 else 'KHÔNG ĐẠT'}")

    # Kiểm tra Ma trận Phân quyền & 68 FRs & 42 BRs & RTM
    found_frs_table = False
    found_role_matrix = False
    found_brs_table = False
    found_rtm_table = False
    found_apis_table = False

    for table in doc.tables:
        cols_cnt = len(table.columns)
        rows_cnt = len(table.rows)
        h_text = " ".join([c.text for c in table.rows[0].cells])
        
        if cols_cnt == 6 and "Mã FR" in h_text and rows_cnt == 69:
            found_frs_table = True
        if cols_cnt == 5 and "Phân hệ chức năng" in h_text and rows_cnt == 12:
            found_role_matrix = True
        if cols_cnt == 5 and "Mã BR" in h_text and rows_cnt == 43:
            found_brs_table = True
        if cols_cnt == 8 and "Mã FR" in h_text and rows_cnt == 69:
            found_rtm_table = True
        if cols_cnt == 6 and "Mã API" in h_text and rows_cnt == 250:
            found_apis_table = True

    print(f"9. Bảng 68 FRs: {'TÌM THẤY (68 hàng dữ liệu)' if found_frs_table else 'CHƯA ĐẠT'}")
    print(f"10. Bảng Ma trận phân quyền Role Permission Matrix: {'TÌM THẤY (11 phân hệ)' if found_role_matrix else 'CHƯA ĐẠT'}")
    print(f"11. Bảng 42 Quy tắc nghiệp vụ BRs: {'TÌM THẤY (42 hàng dữ liệu)' if found_brs_table else 'CHƯA ĐẠT'}")
    print(f"12. Bảng Phụ lục A (249 REST APIs): {'TÌM THẤY (249 hàng API)' if found_apis_table else 'CHƯA ĐẠT'}")
    print(f"13. Bảng Phụ lục K (Ma trận truy xuất RTM 68 FRs): {'TÌM THẤY (68 hàng RTM)' if found_rtm_table else 'CHƯA ĐẠT'}")

    print("=" * 75)
    print("HOÀN TẤT KIỂM TOÁN TÀI LIỆU V4!")
    print("=" * 75)

if __name__ == "__main__":
    audit_docx()
