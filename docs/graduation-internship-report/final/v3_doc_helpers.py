# -*- coding: utf-8 -*-
"""
v3_doc_helpers.py - Bộ công cụ định dạng và tạo phần tử cho tài liệu Word V3
Đạt chuẩn quy chuẩn Bộ GD&ĐT: A4, Times New Roman 13pt, 1.5 line spacing, lề 3.5-2.0-2.5-2.5 cm.
Hỗ trợ: Tiêu đề phân cấp, bảng có viền chuẩn, khung thông tin Callout Box, bảng đặc tả Use Case,
bảng đặc tả Test Case, chèn hình ảnh kèm chú thích song ngữ.
"""
import os
import re
from PIL import Image
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
RENDERED_DIR = os.path.join(BASE_DIR, "diagrams", "rendered")

def create_document():
    doc = Document()
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.left_margin = Cm(3.5)
        section.right_margin = Cm(2.0)
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        
        # Số trang ở chân trang
        footer = section.footer
        p_foot = footer.paragraphs[0]
        p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_foot = p_foot.add_run()
        run_foot.font.name = "Times New Roman"
        run_foot.font.size = Pt(10)
        run_foot.font.color.rgb = RGBColor(120, 120, 120)
        
        fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        run_foot._r.append(fld1)
        run_foot._r.append(instr)
        run_foot._r.append(fld2)
        run_foot._r.append(fld3)

    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(13)
    font_normal.color.rgb = RGBColor(30, 30, 30)
    style_normal.paragraph_format.line_spacing = 1.5
    style_normal.paragraph_format.space_after = Pt(6)
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    return doc

def add_heading(doc, text, level):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.bold = True
    
    if level == 1:
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(26, 54, 93) # Navy blue
    elif level == 2:
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(44, 62, 80) # Slate
    elif level == 3:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(44, 62, 80)
    else:
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        run.font.size = Pt(13)
        run.italic = True
        run.font.color.rgb = RGBColor(50, 50, 50)
    return p

def add_p(doc, text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, space_before=0, line_spacing=1.5):
    p = doc.add_paragraph()
    p.paragraph_format.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**') and len(token) >= 4:
            run = p.add_run(token[2:-2])
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.bold = True
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            run = p.add_run(token[1:-1])
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.italic = True
        elif token.startswith('`') and token.endswith('`') and len(token) >= 2:
            run = p.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(180, 40, 40)
        else:
            run = p.add_run(token)
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            if bold: run.bold = True
            if italic: run.italic = True
    return p

def add_callout_box(doc, title, lines):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Cm(15.5)
    
    shd = parse_xml(r'<w:shd %s w:fill="F8F9FA"/>' % nsdecls('w'))
    cell._tc.get_or_add_tcPr().append(shd)
    
    tcBorders = parse_xml(
        r'<w:tcBorders %s>'
        r'  <w:left w:val="single" w:sz="24" w:space="0" w:color="2980B9"/>'
        r'  <w:top w:val="none"/>'
        r'  <w:right w:val="none"/>'
        r'  <w:bottom w:val="none"/>'
        r'</w:tcBorders>' % nsdecls('w')
    )
    cell._tc.get_or_add_tcPr().append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.2
    run_t = p.add_run(title)
    run_t.font.name = "Times New Roman"
    run_t.font.size = Pt(12)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(41, 128, 185)
    
    for l in lines:
        p_l = cell.add_paragraph()
        p_l.paragraph_format.space_before = Pt(1)
        p_l.paragraph_format.space_after = Pt(1)
        p_l.paragraph_format.line_spacing = 1.15
        run_l = p_l.add_run(l)
        run_l.font.name = "Times New Roman"
        run_l.font.size = Pt(11)
        
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(4)

def insert_image_with_caption(doc, img_name, fig_num, title_vi, title_en, desc_text):
    img_path = os.path.join(RENDERED_DIR, img_name)
    if not os.path.exists(img_path):
        return
        
    try:
        with Image.open(img_path) as im:
            orig_w, orig_h = im.size
            aspect = orig_h / orig_w if orig_w > 0 else 1.0
            
        if aspect > 1.3:
            target_w = Inches(min(5.5, 7.2 / aspect))
        elif aspect < 0.4:
            target_w = Inches(6.0)
        else:
            target_w = Inches(5.8)
            
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(10)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=target_w)
        
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(6)
        p_cap.paragraph_format.keep_with_next = True
        
        run_cap = p_cap.add_run(f"Hình {fig_num}: {title_vi} ({title_en})")
        run_cap.font.name = "Times New Roman"
        run_cap.font.size = Pt(11)
        run_cap.font.italic = True
        run_cap.font.color.rgb = RGBColor(60, 60, 60)
        
        if desc_text:
            p_desc = doc.add_paragraph()
            p_desc.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p_desc.paragraph_format.space_before = Pt(2)
            p_desc.paragraph_format.space_after = Pt(8)
            p_desc.paragraph_format.line_spacing = 1.3
            run_d = p_desc.add_run(desc_text)
            run_d.font.name = "Times New Roman"
            run_d.font.size = Pt(12)
            run_d.font.color.rgb = RGBColor(50, 50, 50)
            
    except Exception as e:
        print(f"Error inserting image {img_name}: {e}")

def add_bordered_table(doc, headers, rows_data, col_widths=None):
    num_rows = len(rows_data) + 1
    num_cols = len(headers)
    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        r'<w:tblBorders %s>'
        r'  <w:top w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:left w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:right w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>'
        r'  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>'
        r'</w:tblBorders>' % nsdecls('w')
    )
    tblPr.append(tblBorders)
    
    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        shd = parse_xml(r'<w:shd %s w:fill="EBF5FB"/>' % nsdecls('w'))
        cell._tc.get_or_add_tcPr().append(shd)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(h_text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10.5)
        run.bold = True
        run.font.color.rgb = RGBColor(26, 54, 93)
        if col_widths and c_idx < len(col_widths):
            cell.width = col_widths[c_idx]
            
    for r_idx, r_vals in enumerate(rows_data):
        for c_idx, val in enumerate(r_vals):
            if c_idx >= num_cols: continue
            cell = table.cell(r_idx + 1, c_idx)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if c_idx == 0 and len(str(val)) <= 6:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(str(val))
            run.font.name = "Times New Roman"
            run.font.size = Pt(10)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
                
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(6)

def add_use_case_table(doc, uc):
    fields = [
        ("Mã Use Case", uc.get("id", "")),
        ("Tên Use Case", uc.get("name", "")),
        ("Tác nhân chính", uc.get("primary_actor", "")),
        ("Tác nhân phụ", uc.get("secondary_actor", "Hệ thống CSDL")),
        ("Mô tả nghiệp vụ", uc.get("description", "")),
        ("Mức độ ưu tiên", uc.get("priority", "Cao (High)")),
        ("Điều kiện kích hoạt", uc.get("trigger", "")),
        ("Tiền điều kiện", uc.get("preconditions", "")),
        ("Hậu điều kiện", uc.get("postconditions", "")),
        ("Luồng sự kiện chính", uc.get("main_flow", "")),
        ("Luồng rẽ nhánh / thay thế", uc.get("alt_flow", "")),
        ("Luồng ngoại lệ", uc.get("exception_flow", "")),
        ("Quy tắc nghiệp vụ", uc.get("business_rules", "")),
        ("Yêu cầu liên quan", uc.get("related_fr", "")),
        ("Ca kiểm thử liên quan", uc.get("related_tc", ""))
    ]
    
    table = doc.add_table(rows=len(fields) + 1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    w_col1 = Cm(4.5)
    w_col2 = Cm(11.0)
    
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        r'<w:tblBorders %s>'
        r'  <w:top w:val="single" w:sz="8" w:space="0" w:color="2C3E50"/>'
        r'  <w:left w:val="single" w:sz="8" w:space="0" w:color="2C3E50"/>'
        r'  <w:bottom w:val="single" w:sz="8" w:space="0" w:color="2C3E50"/>'
        r'  <w:right w:val="single" w:sz="8" w:space="0" w:color="2C3E50"/>'
        r'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="BDC3C7"/>'
        r'  <w:insideV w:val="single" w:sz="6" w:space="0" w:color="2C3E50"/>'
        r'</w:tblBorders>' % nsdecls('w')
    )
    tblPr.append(tblBorders)
    
    cell_title = table.cell(0, 0)
    cell_title.merge(table.cell(0, 1))
    cell_title.width = Cm(15.5)
    shd_t = parse_xml(r'<w:shd %s w:fill="1A5276"/>' % nsdecls('w'))
    cell_title._tc.get_or_add_tcPr().append(shd_t)
    p_t = cell_title.paragraphs[0]
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(4)
    p_t.paragraph_format.space_after = Pt(4)
    run_t = p_t.add_run(f"ĐẶC TẢ USE CASE – {uc.get('name', '').upper()} ({uc.get('id', '')})")
    run_t.font.name = "Times New Roman"
    run_t.font.size = Pt(11.5)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(255, 255, 255)
    
    for r_idx, (f_name, f_val) in enumerate(fields, 1):
        cell_lbl = table.cell(r_idx, 0)
        cell_val = table.cell(r_idx, 1)
        cell_lbl.width = w_col1
        cell_val.width = w_col2
        
        shd_lbl = parse_xml(r'<w:shd %s w:fill="F2F4F4"/>' % nsdecls('w'))
        cell_lbl._tc.get_or_add_tcPr().append(shd_lbl)
        p_lbl = cell_lbl.paragraphs[0]
        p_lbl.paragraph_format.space_before = Pt(2)
        p_lbl.paragraph_format.space_after = Pt(2)
        p_lbl.paragraph_format.line_spacing = 1.15
        run_lbl = p_lbl.add_run(f_name)
        run_lbl.font.name = "Times New Roman"
        run_lbl.font.size = Pt(10.5)
        run_lbl.bold = True
        run_lbl.font.color.rgb = RGBColor(44, 62, 80)
        
        p_val = cell_val.paragraphs[0]
        p_val.paragraph_format.space_before = Pt(2)
        p_val.paragraph_format.space_after = Pt(2)
        p_val.paragraph_format.line_spacing = 1.15
        p_val.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        clean_val = str(f_val).strip()
        lines_val = clean_val.split("\n")
        for l_idx, line_item in enumerate(lines_val):
            if l_idx > 0:
                p_val = cell_val.add_paragraph()
                p_val.paragraph_format.space_before = Pt(1)
                p_val.paragraph_format.space_after = Pt(1)
                p_val.paragraph_format.line_spacing = 1.15
                p_val.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            run_v = p_val.add_run(line_item)
            run_v.font.name = "Times New Roman"
            run_v.font.size = Pt(10)
            
    p_post = doc.add_paragraph()
    p_post.paragraph_format.space_before = Pt(2)
    p_post.paragraph_format.space_after = Pt(6)

def add_test_case_table(doc, tc):
    fields = [
        ("Mã ca kiểm thử", tc.get("id", "")),
        ("Tên ca kiểm thử", tc.get("name", "")),
        ("Yêu cầu / Phân hệ", tc.get("module") or tc.get("req_id") or tc.get("actor", "")),
        ("Mức độ ưu tiên", tc.get("priority", "High")),
        ("Tiền điều kiện", tc.get("precondition") or tc.get("preconditions", "")),
        ("Dữ liệu kiểm thử", tc.get("test_data", "Dữ liệu mẫu chuẩn")),
        ("Các bước thực hiện", tc.get("steps", "")),
        ("Kết quả mong đợi", tc.get("expected", "")),
        ("Trạng thái kiểm thử", tc.get("status", "NOT EXECUTED")),
        ("Bằng chứng mã nguồn", tc.get("evidence", "Được đối chiếu từ mã nguồn dự án"))
    ]
    
    table = doc.add_table(rows=len(fields) + 1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    w_col1 = Cm(4.5)
    w_col2 = Cm(11.0)
    
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        r'<w:tblBorders %s>'
        r'  <w:top w:val="single" w:sz="6" w:space="0" w:color="34495E"/>'
        r'  <w:left w:val="single" w:sz="6" w:space="0" w:color="34495E"/>'
        r'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="34495E"/>'
        r'  <w:right w:val="single" w:sz="6" w:space="0" w:color="34495E"/>'
        r'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="BDC3C7"/>'
        r'  <w:insideV w:val="single" w:sz="6" w:space="0" w:color="34495E"/>'
        r'</w:tblBorders>' % nsdecls('w')
    )
    tblPr.append(tblBorders)
    
    cell_title = table.cell(0, 0)
    cell_title.merge(table.cell(0, 1))
    cell_title.width = Cm(15.5)
    shd_t = parse_xml(r'<w:shd %s w:fill="2E4053"/>' % nsdecls('w'))
    cell_title._tc.get_or_add_tcPr().append(shd_t)
    p_t = cell_title.paragraphs[0]
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(3)
    p_t.paragraph_format.space_after = Pt(3)
    run_t = p_t.add_run(f"CA KIỂM THỬ: {tc.get('id', '')} – {tc.get('name', '')}")
    run_t.font.name = "Times New Roman"
    run_t.font.size = Pt(11)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(255, 255, 255)
    
    for r_idx, (f_name, f_val) in enumerate(fields, 1):
        cell_lbl = table.cell(r_idx, 0)
        cell_val = table.cell(r_idx, 1)
        cell_lbl.width = w_col1
        cell_val.width = w_col2
        
        shd_lbl = parse_xml(r'<w:shd %s w:fill="F8F9F9"/>' % nsdecls('w'))
        cell_lbl._tc.get_or_add_tcPr().append(shd_lbl)
        p_lbl = cell_lbl.paragraphs[0]
        p_lbl.paragraph_format.space_before = Pt(2)
        p_lbl.paragraph_format.space_after = Pt(2)
        run_lbl = p_lbl.add_run(f_name)
        run_lbl.font.name = "Times New Roman"
        run_lbl.font.size = Pt(10)
        run_lbl.bold = True
        run_lbl.font.color.rgb = RGBColor(44, 62, 80)
        
        p_val = cell_val.paragraphs[0]
        p_val.paragraph_format.space_before = Pt(2)
        p_val.paragraph_format.space_after = Pt(2)
        p_val.paragraph_format.line_spacing = 1.15
        p_val.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        # Xử lý màu sắc riêng cho trạng thái
        if f_name == "Trạng thái kiểm thử":
            run_v = p_val.add_run("NOT EXECUTED (Chưa kiểm thử thực tế - Sẵn sàng thực thi)")
            run_v.font.name = "Times New Roman"
            run_v.font.size = Pt(10)
            run_v.bold = True
            run_v.font.color.rgb = RGBColor(192, 57, 43) # Đỏ cảnh báo học thuật
        else:
            clean_val = str(f_val).strip()
            lines_val = clean_val.split("\n")
            for l_idx, line_item in enumerate(lines_val):
                if l_idx > 0:
                    p_val = cell_val.add_paragraph()
                    p_val.paragraph_format.space_before = Pt(1)
                    p_val.paragraph_format.space_after = Pt(1)
                    p_val.paragraph_format.line_spacing = 1.15
                    p_val.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                run_v = p_val.add_run(line_item)
                run_v.font.name = "Times New Roman"
                run_v.font.size = Pt(10)
                
    p_post = doc.add_paragraph()
    p_post.paragraph_format.space_before = Pt(1)
    p_post.paragraph_format.space_after = Pt(4)
