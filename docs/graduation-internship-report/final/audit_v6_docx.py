# -*- coding: utf-8 -*-
"""
audit_v6_docx.py - Kiểm toán toàn diện tài liệu BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.docx
Kiểm toán đầy đủ tất cả tiêu chuẩn chất lượng và tính nhất quán kỹ thuật V6.
"""
import os
import sys
import docx

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
DOCX_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V6.docx")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import v6_canonical_catalogs as cat
import v6_data_testcases as tc
import v6_data_usecases as uc

def audit_docx():
    print("=" * 80)
    print("KIỂM TOÁN CHẤT LƯỢNG VÀ TÍNH NHẤT QUÁN KỸ THUẬT BÁO CÁO V6 (DOCX)")
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
    uc_tables_cnt = 0
    tc_tables_cnt = 0
    callout_boxes = 0
    db_tables_count = 0
    
    broken_tcs_in_ucs = []
    broken_frs_in_tcs = []
    tc_statuses = {}
    
    valid_fr_ids = set(f['id'] for f in cat.CANONICAL_FRS)
    valid_br_ids = set(b['id'] for b in cat.CANONICAL_BRS)
    valid_tc_ids = set(t['id'] for t in tc.ALL_TEST_CASES)
    valid_uc_ids = set(u['id'] for u in uc.ALL_USE_CASES)

    for t_idx, table in enumerate(doc.tables):
        rows_cnt = len(table.rows)
        cols_cnt = len(table.columns)
        
        # Callout box (1x1)
        if rows_cnt == 1 and cols_cnt == 1:
            callout_boxes += 1
            continue
            
        # UC Table (16 rows: 1 header + 15 fields, 2 cols)
        if rows_cnt == 16 and cols_cnt == 2:
            uc_tables_cnt += 1
            # Row 15: Ca kiểm thử liên quan (related_tc)
            cell_tc = table.cell(15, 1).text.strip()
            for t_id in [x.strip() for x in cell_tc.split(',') if x.strip()]:
                if t_id not in valid_tc_ids:
                    broken_tcs_in_ucs.append((t_idx, t_id))
            continue
            
        # Test Case Table (11 rows: 1 header + 10 fields, 2 cols)
        if rows_cnt == 11 and cols_cnt == 2:
            tc_tables_cnt += 1
            # Row 3: Yêu cầu / Phân hệ (req_id)
            cell_fr = table.cell(3, 1).text.strip()
            for f_id in [x.strip() for x in cell_fr.split(',') if x.strip()]:
                if f_id not in valid_fr_ids:
                    broken_frs_in_tcs.append((t_idx, f_id))
            # Row 9: Trạng thái kiểm thử (Status)
            cell_st = table.cell(9, 1).text.strip()
            tc_statuses[cell_st] = tc_statuses.get(cell_st, 0) + 1
            continue
            
        # DB Table check (7 cols: Tên cột, Kiểu dữ liệu, PK, FK, Null, Mặc định, Mô tả nghiệp vụ)
        if cols_cnt == 7 and rows_cnt > 1:
            header_text = [cell.text.strip().lower() for cell in table.rows[0].cells]
            if "tên cột" in header_text[0] or "kiểu dữ liệu" in header_text[1]:
                db_tables_count += 1
                continue

    print(f"5. Bảng đặc tả Use Case chi tiết (16 hàng chuẩn): {uc_tables_cnt} (Kỳ vọng: 88 UCs) -> {'ĐẠT' if uc_tables_cnt == 88 else 'KHÔNG ĐẠT'}")
    print(f"6. Bảng ca kiểm thử Test Case chi tiết (11 hàng): {tc_tables_cnt} (Kỳ vọng: 100 TCs) -> {'ĐẠT' if tc_tables_cnt == 100 else 'KHÔNG ĐẠT'}")
    print(f"7. Bảng từ điển dữ liệu CSDL (Database Dictionaries): {db_tables_count} (Kỳ vọng: 51 bảng) -> {'ĐẠT' if db_tables_count == 51 else 'KHÔNG ĐẠT'}")
    print(f"8. Khung ghi chú Callout Box (1x1): {callout_boxes} (Kỳ vọng: >= 20) -> {'ĐẠT' if callout_boxes >= 20 else 'KHÔNG ĐẠT'}")
    
    print("\n--- KIỂM TRA TRUY VẾT & TÍNH NHẤT QUÁN ---")
    print(f"9. Ca kiểm thử bị gãy tham chiếu trong Use Cases: {len(broken_tcs_in_ucs)} -> {'ĐẠT (0 LỖI)' if len(broken_tcs_in_ucs) == 0 else f'LỖI: {broken_tcs_in_ucs}'}")
    print(f"10. Yêu cầu FR bị gãy tham chiếu trong Test Cases: {len(broken_frs_in_tcs)} -> {'ĐẠT (0 LỖI)' if len(broken_frs_in_tcs) == 0 else f'LỖI: {broken_frs_in_tcs}'}")
    all_not_executed = all('NOT EXECUTED' in k for k in tc_statuses.keys())
    print(f"11. Phân bổ trạng thái Test Cases: {len(tc_statuses)} loại trạng thái ({sum(tc_statuses.values())} TCs) -> {'ĐẠT (100% NOT EXECUTED)' if all_not_executed else 'CẦN KIỂM TRA'}")

    full_text = []
    for p in doc.paragraphs:
        full_text.append(p.text)
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                full_text.append(cell.text)
    joined_text = "\n".join(full_text)

    import re
    ui_placeholders = len(re.findall(r'KHUNG GIỮ CHỖ GIAO DIỆN UI-\d+:', joined_text))
    print(f"12. Số lượng khung giữ chỗ ảnh giao diện UI (UI-01 đến UI-20): {ui_placeholders} (Kỳ vọng: 20 UI) -> {'ĐẠT' if ui_placeholders == 20 else 'KHÔNG ĐẠT'}")

    # Microservices check: only Newman book title [10] and academic contrast in 2.6
    ms_in_conclusion = "kiến trúc microservice" in joined_text.lower()
    print(f"13. Kiểm tra loại bỏ thuật ngữ 'kiến trúc microservice': -> {'ĐẠT (Đã thay bằng Modular Monolith)' if not ms_in_conclusion else 'CẢNH BÁO: Còn tồn tại trong văn bản'}")

    all_br_refs = re.findall(r'(BR-[A-Z0-9]+-\d+)', joined_text)
    invalid_br_refs = [b for b in set(all_br_refs) if b not in valid_br_ids]
    print(f"14. Mã quy tắc nghiệp vụ BR không hợp lệ trong văn bản: {len(invalid_br_refs)} -> {'ĐẠT (0 LỖI)' if len(invalid_br_refs) == 0 else f'LỖI: {invalid_br_refs}'}")

    print("=" * 80)
    print("KẾT THÚC KIỂM TOÁN BÁO CÁO V6")
    print("=" * 80)

if __name__ == "__main__":
    audit_docx()
