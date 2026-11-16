# -*- coding: utf-8 -*-
"""
audit_v5_docx.py - Kiểm tra toàn diện tài liệu BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx
Kiểm toán 14 tiêu chuẩn chất lượng và tính nhất quán kỹ thuật V5.
"""
import os
import sys
import docx

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
DOCX_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx")

def audit_docx():
    print("=" * 80)
    print("KIỂM TOÁN CHẤT LƯỢNG VÀ TÍNH NHẤT QUÁN KỸ THUẬT BÁO CÁO V5 (DOCX)")
    print("=" * 80)

    if not os.path.exists(DOCX_PATH):
        print(f"LỖI: Tệp {DOCX_PATH} không tồn tại!")
        return

    file_size_mb = os.path.getsize(DOCX_PATH) / (1024 * 1024)
    print(f"1. Kích thước tệp DOCX: {file_size_mb:.2f} MB (Kỳ vọng: > 3.0 MB) -> {'ĐẠT' if file_size_mb > 3.0 else 'KHÔNG ĐẠT'}")

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

    # Đếm số bảng đặc tả Use Case, Test Case, Callout Box, DB tables
    uc_tables_15_rows = 0
    tc_tables = 0
    callout_boxes = 0
    generic_found = 0
    db_tables_count = 0
    
    broken_tcs_in_ucs = []
    broken_frs_in_tcs = []
    tc_statuses = {}
    generic_db_cols = 0
    false_fks = []
    
    for t_idx, table in enumerate(doc.tables):
        rows_cnt = len(table.rows)
        cols_cnt = len(table.columns)
        
        # Callout box (1x1)
        if rows_cnt == 1 and cols_cnt == 1:
            callout_boxes += 1
            continue
            
        # Use Case table (16 rows total: 1 header row + 15 field rows, 2 cols)
        if rows_cnt == 16 and cols_cnt == 2:
            uc_tables_15_rows += 1
            table_text = " ".join([c.text for row in table.rows for c in row.cells])
            if "Mở giao diện chức năng" in table_text:
                generic_found += 1
            # Check for broken TC references
            for bad_prefix in ["TC-CHG-", "TC-EXP-", "TC-CO-", "TC-ADM-"]:
                if bad_prefix in table_text:
                    broken_tcs_in_ucs.append(bad_prefix)
            continue

        # Test Case table (11 rows total: 1 header row + 10 field rows, 2 cols)
        if rows_cnt == 11 and cols_cnt == 2:
            tc_tables += 1
            table_text = " ".join([c.text for row in table.rows for c in row.cells])
            # Check for broken FR references
            for bad_fr in ["FR-CHARGE-01", "FR-FIN-01", "FR-ENERGY-01"]:
                if bad_fr in table_text:
                    broken_frs_in_tcs.append(bad_fr)
            # Check status row (row index 7 or search for status)
            for r in table.rows:
                if "Trạng thái kiểm thử" in r.cells[0].text:
                    st = r.cells[1].text.strip()
                    tc_statuses[st] = tc_statuses.get(st, 0) + 1
            continue

        # Database dictionary tables (cols=7: Name, Type, PK, FK, Nullable, Default, Desc)
        if cols_cnt == 7 and rows_cnt > 1:
            headers = [c.text.strip() for c in table.rows[0].cells]
            if "PK" in headers and "FK" in headers and ("Tên cột (Column)" in headers or "Tên cột" in headers):
                db_tables_count += 1
                for r in table.rows[1:]:
                    col_name = r.cells[0].text.strip()
                    fk_val = r.cells[3].text.strip()
                    desc_val = r.cells[6].text.strip()
                    if "Lưu trữ thông tin phân hệ" in desc_val:
                        generic_db_cols += 1
                    if col_name in ["token", "actual_cost"] and fk_val != "NO":
                        false_fks.append((col_name, fk_val))
                    if "%" in col_name and fk_val != "NO":
                        false_fks.append((col_name, fk_val))
            continue

    print(f"5. Khung giữ chỗ Callout Boxes (20 UI Placeholders): {callout_boxes} -> {'ĐẠT' if callout_boxes == 20 else 'CHÚ Ý'}")
    print(f"6. Bảng đặc tả Use Case (15 hàng viền chuẩn): {uc_tables_15_rows} (Kỳ vọng: 88 = 14 Core + 74 Phụ lục C) -> {'ĐẠT' if uc_tables_15_rows == 88 else 'KHÔNG ĐẠT'}")
    print(f"   - Số bảng Use Case chứa văn bản generic 'Mở giao diện chức năng': {generic_found} (Kỳ vọng: 0) -> {'ĐẠT' if generic_found == 0 else 'KHÔNG ĐẠT'}")
    print(f"   - Tham chiếu mã TC sai trong bảng Use Case: {len(broken_tcs_in_ucs)} (Kỳ vọng: 0) -> {'ĐẠT' if len(broken_tcs_in_ucs) == 0 else 'KHÔNG ĐẠT'}")
    
    print(f"7. Bảng đặc tả Test Case chi tiết: {tc_tables} (Kỳ vọng: 100 = 69 chức năng + 31 hồi quy) -> {'ĐẠT' if tc_tables == 100 else 'KHÔNG ĐẠT'}")
    print(f"   - Tham chiếu mã FR không tồn tại trong Test Cases: {len(broken_frs_in_tcs)} (Kỳ vọng: 0) -> {'ĐẠT' if len(broken_frs_in_tcs) == 0 else 'KHÔNG ĐẠT'}")
    print(f"   - Phân bố trạng thái Test Case: {tc_statuses}")
    not_exec_cnt = sum(cnt for st, cnt in tc_statuses.items() if "NOT EXECUTED" in st)
    print(f"   - Số Test Case có trạng thái NOT EXECUTED: {not_exec_cnt}/100 -> {'ĐẠT (100% minh bạch)' if not_exec_cnt == 100 else 'CHÚ Ý'}")

    print(f"8. Bảng từ điển CSDL trong Phụ lục B: {db_tables_count} (Kỳ vọng: 51 bảng) -> {'ĐẠT' if db_tables_count == 51 else 'KHÔNG ĐẠT'}")
    print(f"   - Số cột CSDL còn chứa mô tả generic 'Lưu trữ thông tin phân hệ': {generic_db_cols} (Kỳ vọng: 0) -> {'ĐẠT' if generic_db_cols == 0 else 'KHÔNG ĐẠT'}")
    print(f"   - Số lỗi gán sai khóa ngoại (false FKs: token, SOH%, actual_cost): {len(false_fks)} (Kỳ vọng: 0) -> {'ĐẠT' if len(false_fks) == 0 else 'KHÔNG ĐẠT'}")

    # Kiểm tra toàn vẹn nội dung các chương
    print("\n9. Kiểm tra nội dung văn bản các phân hệ trọng điểm:")
    all_doc_text = " ".join([p.text for p in doc.paragraphs])
    
    # Kiểm tra Section 5.18 Direct Expense Allocation
    has_direct_alloc = "Phân bổ Chi phí Trực tiếp" in all_doc_text or "DIRECT EXPENSE ALLOCATION" in all_doc_text or "Hare-Niemeyer" in all_doc_text
    print(f"   - Thuyết minh Phân bổ chi phí trực tiếp (Direct Expense Allocation): {'ĐẠT' if has_direct_alloc else 'KHÔNG ĐẠT'}")
    
    # Kiểm tra công thức WAC và tổn hao 0.92
    has_wac_formula = "0.92" in all_doc_text and "3.850" in all_doc_text and "WAC" in all_doc_text
    print(f"   - Công thức năng lượng WAC chuẩn (η=0.92, 3.850 đ/kWh): {'ĐẠT' if has_wac_formula else 'KHÔNG ĐẠT'}")
    
    # Kiểm tra Section 6.5 đánh giá kiến trúc tĩnh và acceptance targets
    has_sec_6_5 = "Đánh giá Thiết kế Kiến trúc Mã nguồn" in all_doc_text or "Chỉ số Mục tiêu Đề xuất" in all_doc_text
    print(f"   - Mục 6.5 đánh giá kiến trúc tĩnh & chỉ số nghiệm thu đề xuất: {'ĐẠT' if has_sec_6_5 else 'KHÔNG ĐẠT'}")

    # Kiểm tra Chapter 7: 6 ưu điểm, 5 hạn chế, roadmap
    has_ch7 = "6 ưu điểm" in all_doc_text or "5 điểm hạn chế" in all_doc_text or "bài học kinh nghiệm" in all_doc_text
    print(f"   - Chương 7 đánh giá khách quan (ưu điểm, hạn chế, bài học, lộ trình): {'ĐẠT' if has_ch7 else 'KHÔNG ĐẠT'}")

    print("=" * 80)
    print("HOÀN TẤT KIỂM TOÁN TÀI LIỆU V5.")
    print("=" * 80)

if __name__ == "__main__":
    audit_docx()
