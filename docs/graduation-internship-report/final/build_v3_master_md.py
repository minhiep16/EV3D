# -*- coding: utf-8 -*-
"""
build_v3_master_md.py - Biên dịch tài liệu Markdown toàn văn Báo cáo V3
Bao gồm toàn bộ 7 chương, 86 sơ đồ thiết kế, 88 Use Cases, 100 Test Cases, 246 APIs, 51 bảng CSDL và 14 Phụ lục
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

import v3_chapters_data as ch_data
import v3_data_usecases as uc_data
import v3_data_database as db_data
import v3_data_apis as api_data
import v3_data_testcases as tc_data

OUTPUT_MD = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V3.md")

def build_markdown():
    lines = []
    
    # 1. FRONT MATTER
    fm = ch_data.get_front_matter()
    lines.append("# BÁO CÁO THỰC TẬP TỐT NGHIỆP")
    lines.append(f"## {fm['title_vi']}")
    lines.append(f"*{fm['title_en']}*\n")
    lines.append("**Sinh viên thực hiện:** Nguyễn Minh Hiệp | **MSSV:** 2020600001 | **Lớp:** KTPM K15")
    lines.append("**Giảng viên hướng dẫn:** TS. Nguyễn Văn A | **Đơn vị thực tập:** Công ty Cổ phần Công nghệ và Dịch vụ Xanh EVShare\n")
    lines.append("<pagebreak/>\n")
    
    # Cam đoan & Cảm ơn
    lines.append("## LỜI CAM ĐOAN\n")
    lines.append(fm["declaration"] + "\n")
    lines.append("<pagebreak/>\n")
    
    lines.append("## LỜI CẢM ƠN\n")
    lines.append(fm["acknowledgements"] + "\n")
    lines.append("<pagebreak/>\n")
    
    # Tóm tắt
    lines.append("## TÓM TẮT BÁO CÁO (VIETNAMESE ABSTRACT)\n")
    lines.append(fm["abstract_vi"] + "\n")
    lines.append("## ABSTRACT (ENGLISH)\n")
    lines.append(fm["abstract_en"] + "\n")
    lines.append("<pagebreak/>\n")
    
    # Từ viết tắt
    lines.append("## DANH MỤC TỪ VIẾT TẮT\n")
    lines.append("| Từ viết tắt | Thuật ngữ tiếng Anh | Ý nghĩa tiếng Việt |")
    lines.append("|:---|:---|:---|")
    for abbr in fm["abbreviations"]:
        lines.append(f"| **{abbr[0]}** | {abbr[1]} | {abbr[2]} |")
    lines.append("\n<pagebreak/>\n")
    
    # 2. CHƯƠNG 1
    c1 = ch_data.get_chapter_1()
    lines.append(f"# {c1['title']}\n")
    lines.append(f"*{c1['intro']}*\n")
    for st, text in c1["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
    lines.append("<pagebreak/>\n")
    
    # 3. CHƯƠNG 2
    c2 = ch_data.get_chapter_2()
    lines.append(f"# {c2['title']}\n")
    lines.append(f"*{c2['intro']}*\n")
    for st, text in c2["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
    lines.append("<pagebreak/>\n")
    
    # 4. CHƯƠNG 3
    c3 = ch_data.get_chapter_3_intro()
    lines.append(f"# {c3['title']}\n")
    lines.append(f"*{c3['intro']}*\n")
    for st, text in c3["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
        
    lines.append("## 3.9. ĐẶC TẢ CHI TIẾT CÁC USE CASE CỐT LÕI (14 CA SỬ DỤNG ĐẠI DIỆN)\n")
    major_ucs = uc_data.get_major_use_cases()
    for idx, uc in enumerate(major_ucs, 1):
        lines.append(f"### 3.9.{idx}. Đặc tả Use Case {uc['id']}: {uc['name']}\n")
        lines.append("| Thuộc tính | Chi tiết đặc tả |")
        lines.append("|:---|:---|")
        lines.append(f"| **Mã Use Case** | `{uc['id']}` |")
        lines.append(f"| **Tên Use Case** | **{uc['name']}** |")
        lines.append(f"| **Tác nhân chính** | `{uc['primary_actor']}` |")
        lines.append(f"| **Tác nhân phụ** | `{uc['secondary_actor']}` |")
        lines.append(f"| **Mô tả nghiệp vụ** | {uc['description']} |")
        lines.append(f"| **Mức độ ưu tiên** | {uc['priority']} |")
        lines.append(f"| **Tiền điều kiện** | {uc['preconditions'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Hậu điều kiện** | {uc['postconditions'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng chính** | {uc['main_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng rẽ nhánh** | {uc['alt_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng ngoại lệ** | {uc['exception_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Quy tắc nghiệp vụ** | `{uc['business_rules']}` |")
        lines.append(f"| **Yêu cầu liên quan** | `{uc['related_fr']}` |")
        lines.append(f"| **Ca kiểm thử liên quan**| `{uc['related_tc']}` |\n")
    lines.append("<pagebreak/>\n")
    
    # 5. CHƯƠNG 4 (86 SƠ ĐỒ)
    lines.append("# CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG PHÂN RÃ HIERARCHICAL\n")
    diag_inv_path = os.path.join(BASE_DIR, "DIAGRAM_INVENTORY.md")
    with open(diag_inv_path, "r", encoding="utf-8") as f:
        inv_text = f.read()
    import re
    diag_rows = re.findall(
        r'\|\s*(\d+)\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\(\*(.*?)\*\)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*\[`.*?`\]\(diagrams/source/(.*?)\)\s*\|\s*\[`.*?`\]\(diagrams/rendered/(.*?)\)\s*\|\s*(.*?)\s*\|',
        inv_text
    )
    for d_idx, d_info in enumerate(diag_rows, 1):
        stt, code, title_vi, title_en, domain, level, sec_loc, puml_file, png_file, desc_text = d_info
        lines.append(f"### 4.{d_idx}. {title_vi} ({code})\n")
        lines.append(f"![Hình 4.{d_idx}: {title_vi}](diagrams/rendered/{png_file})\n")
        lines.append(f"**Hình 4.{d_idx}: {title_vi} (*{title_en}*)**\n")
        lines.append(f"{desc_text}\n")
        lines.append(f"- **Tệp nguồn:** `diagrams/source/{puml_file}` | **Tệp kết xuất:** `diagrams/rendered/{png_file}`\n")
    lines.append("<pagebreak/>\n")
    
    # 6. CHƯƠNG 5
    c5 = ch_data.get_chapter_5_content()
    lines.append(f"# {c5['title']}\n")
    lines.append(f"*{c5['intro']}*\n")
    for st, text in c5["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
        
    lines.append("## 5.4. ĐẶC TẢ CHI TIẾT 20 KHUNG MINH CHỨNG GIAO DIỆN NGƯỜI DÙNG (UI-01 ĐẾN UI-20)\n")
    ui_list_path = os.path.join(BASE_DIR, "MISSING_SCREENSHOTS.md")
    with open(ui_list_path, "r", encoding="utf-8") as f:
        ui_text = f.read()
    lines_ui = [l.strip() for l in ui_text.split('\n') if l.strip().startswith('|') and not '---' in l and not 'STT' in l]
    for l in lines_ui:
        cols = [c.strip() for c in l.split('|')[1:-1]]
        if len(cols) >= 8:
            stt, ui_code_raw, ui_name, ui_role, ui_url_raw, ui_state, ui_loc, ui_pii = cols[:8]
            lines.append(f"### Khung giữ chỗ {ui_code_raw}: {ui_name}\n")
            lines.append(f"> **Mã khung:** `{ui_code_raw}` | **Vai trò:** `{ui_role}` | **URL:** `{ui_url_raw}`  ")
            lines.append(f"> **Trạng thái yêu cầu:** {ui_state}  ")
            lines.append(f"> **Hướng dẫn bảo mật:** {ui_pii}  ")
            lines.append(f"> *Ghi chú:* Sẵn sàng chèn ảnh chụp thực tế kích thước 1920x1080 khi nghiệm thu.\n")
    lines.append("<pagebreak/>\n")
    
    # 7. CHƯƠNG 6
    c6 = ch_data.get_chapter_6_content()
    lines.append(f"# {c6['title']}\n")
    lines.append(f"*{c6['intro']}*\n")
    for st, text in c6["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
    lines.append("<pagebreak/>\n")
    
    # 8. CHƯƠNG 7
    c7 = ch_data.get_chapter_7_content()
    lines.append(f"# {c7['title']}\n")
    lines.append(f"*{c7['intro']}*\n")
    for st, text in c7["sections"]:
        lines.append(f"## {st}\n")
        lines.append(text + "\n")
    lines.append("<pagebreak/>\n")
    
    # 9. TÀI LIỆU THAM KHẢO
    lines.append("# TÀI LIỆU THAM KHẢO (BIBLIOGRAPHY)\n")
    bib_list = ch_data.get_bibliography()
    for b in bib_list:
        lines.append(b + "\n")
    lines.append("<pagebreak/>\n")
    
    # 10. CÁC PHỤ LỤC
    lines.append("# PHỤ LỤC A: DANH MỤC 246 REST API ENDPOINTS\n")
    lines.append("| STT | Method | Endpoint Path | Mô tả nghiệp vụ | Vai trò (RBAC) | Controller |")
    lines.append("|:---:|:---:|:---|:---|:---:|:---|")
    all_apis = api_data.get_all_apis()
    for idx, a in enumerate(all_apis, 1):
        lines.append(f"| {idx} | `{a.get('method', 'GET')}` | `{a.get('path', '')}` | {a.get('purpose', '')} | `{a.get('role', 'ALL')}` | `{a.get('controller', '')}` |")
    lines.append("\n<pagebreak/>\n")
    
    lines.append("# PHỤ LỤC B: TỪ ĐIỂN DỮ LIỆU TOÀN DIỆN 51 BẢNG CƠ SỞ DỮ LIỆU\n")
    all_tables = db_data.get_all_tables()
    for t_idx, (t_name, tbl_info) in enumerate(all_tables.items(), 1):
        t_entity = tbl_info.get("class", "")
        t_desc = tbl_info.get("purpose", "")
        cols = tbl_info.get("columns", [])
        lines.append(f"## B.{t_idx}. Bảng `{t_name}` (Thực thể `{t_entity}`)\n")
        lines.append(f"**Mô tả:** {t_desc}\n")
        lines.append("| Tên cột (Column) | Kiểu dữ liệu | Nullable | Khóa | Mô tả nghiệp vụ |")
        lines.append("|:---|:---|:---:|:---:|:---|")
        for c in cols:
            key_label = "PK" if c.get("pk") == "YES" else ("FK" if c.get("fk") == "YES" else "")
            lines.append(f"| `{c.get('name', '')}` | `{c.get('type', '')}` | {c.get('nullable', 'YES')} | {key_label} | {c.get('desc', '')} |")
        lines.append("\n")
    lines.append("<pagebreak/>\n")
    
    lines.append("# PHỤ LỤC C: DANH MỤC 88 USE CASES VÀ ĐẶC TẢ CHI TIẾT 74 USE CASES\n")
    rem_ucs = uc_data.get_remaining_use_cases()
    for idx, uc in enumerate(rem_ucs, 1):
        lines.append(f"### C.2.{idx}. Đặc tả Use Case {uc['id']}: {uc['name']}\n")
        lines.append("| Thuộc tính | Chi tiết đặc tả |")
        lines.append("|:---|:---|")
        lines.append(f"| **Mã Use Case** | `{uc['id']}` |")
        lines.append(f"| **Tên Use Case** | **{uc['name']}** |")
        lines.append(f"| **Tác nhân chính** | `{uc['primary_actor']}` |")
        lines.append(f"| **Tác nhân phụ** | `{uc['secondary_actor']}` |")
        lines.append(f"| **Mô tả nghiệp vụ** | {uc['description']} |")
        lines.append(f"| **Mức độ ưu tiên** | {uc['priority']} |")
        lines.append(f"| **Tiền điều kiện** | {uc['preconditions'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Hậu điều kiện** | {uc['postconditions'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng chính** | {uc['main_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng rẽ nhánh** | {uc['alt_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Luồng ngoại lệ** | {uc['exception_flow'].replace(chr(10), '<br>')} |")
        lines.append(f"| **Quy tắc nghiệp vụ** | `{uc['business_rules']}` |")
        lines.append(f"| **Yêu cầu liên quan** | `{uc['related_fr']}` |")
        lines.append(f"| **Ca kiểm thử liên quan**| `{uc['related_tc']}` |\n")
    lines.append("<pagebreak/>\n")
    
    lines.append("# PHỤ LỤC D: DANH MỤC 100 CA KIỂM THỬ HỆ THỐNG (TRẠNG THÁI NOT EXECUTED)\n")
    all_tcs = tc_data.load_test_cases()
    for idx, tc in enumerate(all_tcs, 1):
        lines.append(f"### D.{idx}. Ca kiểm thử `{tc['id']}`: {tc['name']}\n")
        lines.append("| Thuộc tính | Chi tiết ca kiểm thử |")
        lines.append("|:---|:---|")
        lines.append(f"| **Mã ca kiểm thử** | `{tc['id']}` |")
        lines.append(f"| **Tên ca kiểm thử** | **{tc['name']}** |")
        lines.append(f"| **Yêu cầu / Phân hệ** | `{tc.get('module') or tc.get('req_id') or tc.get('actor', '')}` |")
        lines.append(f"| **Tiền điều kiện** | {tc.get('precondition') or tc.get('preconditions', '')} |")
        lines.append(f"| **Dữ liệu kiểm thử** | `{tc.get('test_data', 'Chuẩn')}` |")
        lines.append(f"| **Các bước thực hiện** | {tc.get('steps', '').replace(chr(10), '<br>')} |")
        lines.append(f"| **Kết quả mong đợi** | {tc.get('expected', '')} |")
        lines.append(f"| **Trạng thái kiểm thử** | **NOT EXECUTED** *(Chưa kiểm thử thực tế)* |")
        lines.append(f"| **Bằng chứng mã nguồn** | `{tc.get('evidence', '')}` |\n")
    lines.append("<pagebreak/>\n")
    
    app_narratives = ch_data.get_appendices_narratives()
    # Phụ lục E -> N
    for a_code in ["app_e", "app_f", "app_g", "app_h", "app_i", "app_l", "app_m", "app_n"]:
        a_item = app_narratives[a_code]
        lines.append(f"# {a_item['title']}\n")
        lines.append(f"{a_item['desc']}\n")
        if "snippets" in a_item:
            for s_t, s_c in a_item["snippets"]:
                lines.append(f"### {s_t}\n```java\n{s_c}\n```\n")
        elif "steps" in a_item:
            for s_t, s_d in a_item["steps"]:
                lines.append(f"### {s_t}\n{s_d}\n")
        elif "guidance" in a_item:
            for g_t, g_d in a_item["guidance"]:
                lines.append(f"### {g_t}\n{g_d}\n")
        elif "weeks" in a_item:
            lines.append("| Tuần | Nội dung công việc và kết quả đạt được |")
            lines.append("|:---:|:---|")
            for w, d in a_item["weeks"]:
                lines.append(f"| **{w}** | {d} |")
        elif "items" in a_item:
            lines.append("| Hạn chế kỹ thuật nhận diện | Phân tích nguyên nhân | Biện pháp giảm thiểu |")
            lines.append("|:---|:---|:---|")
            for h, r, g in a_item["items"]:
                lines.append(f"| **{h}** | {r} | {g} |")
        elif "deliverables" in a_item:
            lines.append("| Hạng mục bàn giao | Vị trí lưu trữ | Mô tả chi tiết |")
            lines.append("|:---|:---|:---|")
            for h, l, d in a_item["deliverables"]:
                lines.append(f"| **{h}** | `{l}` | {d} |")
        lines.append("\n<pagebreak/>\n")
        
    full_md = "\n".join(lines)
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write(full_md)
    print(f"Generated {OUTPUT_MD} successfully. Total size: {len(full_md)} characters.")

if __name__ == "__main__":
    build_markdown()
