# -*- coding: utf-8 -*-
"""
build_final_docx.py - Biên dịch toàn bộ báo cáo tốt nghiệp sang Microsoft Word (.docx)
Đạt chuẩn quy định hình thức: A4, Times New Roman 13pt, 1.5 line spacing, lề 3.5-2.0-2.5-2.5 cm
Nhúng trực tiếp 81 sơ đồ PNG độ phân giải cao và bảng biểu kẻ viền
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
INPUT_MD = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.md")
OUTPUT_DOCX = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.docx")
RENDERED_DIR = os.path.join(BASE_DIR, "diagrams", "rendered")

def create_document():
    doc = Document()
    
    # 1. Cấu hình khổ giấy A4 và lề trang chuẩn quy định
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.left_margin = Cm(3.5)
        section.right_margin = Cm(2.0)
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        
        # Thêm số trang tự động ở chân trang
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

    # 2. Cấu hình kiểu chữ mặc định (Normal Style)
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(13)
    font_normal.color.rgb = RGBColor(30, 30, 30)
    style_normal.paragraph_format.line_spacing = 1.5
    style_normal.paragraph_format.space_after = Pt(6)
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    return doc

def add_custom_heading(doc, text, level):
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

def add_table_to_doc(doc, table_data):
    if not table_data or len(table_data) < 2:
        return
    
    num_rows = len(table_data)
    num_cols = max(len(row) for row in table_data)
    
    # Tạo bảng
    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    
    # Đặt viền bảng
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        r'<w:tblBorders %s>'
        r'  <w:top w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:left w:val="none"/>'
        r'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>'
        r'  <w:right w:val="none"/>'
        r'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>'
        r'  <w:insideV w:val="none"/>'
        r'</w:tblBorders>' % nsdecls('w')
    )
    tblPr.append(tblBorders)
    
    for r_idx, row in enumerate(table_data):
        for c_idx, cell_text in enumerate(row):
            if c_idx >= num_cols:
                continue
            cell = table.cell(r_idx, c_idx)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            
            # Làm sạch định dạng Markdown đơn giản trong ô
            clean_text = cell_text.strip()
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'\1', clean_text)
            clean_text = re.sub(r'\*(.*?)\*', r'\1', clean_text)
            clean_text = re.sub(r'`(.*?)`', r'\1', clean_text)
            clean_text = clean_text.replace('\\n', '\n')
            
            run = p.add_run(clean_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
            
            # Ô tiêu đề (Header row)
            if r_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(26, 54, 93)
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                # Đổ màu nền tiêu đề
                shd = parse_xml(r'<w:shd %s w:fill="EBF5FB"/>' % nsdecls('w'))
                cell._tc.get_or_add_tcPr().append(shd)
            else:
                if c_idx == 0 and len(clean_text) <= 5: # STT
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
    # Cách một khoảng sau bảng
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(4)
    p_after.paragraph_format.space_after = Pt(6)

def insert_image_with_caption(doc, img_path, caption_text):
    if not os.path.exists(img_path):
        print(f"Warning: Image not found {img_path}")
        return
    
    try:
        with Image.open(img_path) as im:
            orig_w, orig_h = im.size
            aspect = orig_h / orig_w if orig_w > 0 else 1.0
            
        # Vùng in của trang: 15.5 cm = 6.10 inches
        # Nếu sơ đồ quá cao (aspect > 1.3), giới hạn chiều cao tối đa 7.2 inches
        if aspect > 1.3:
            target_w = Inches(min(5.5, 7.2 / aspect))
        else:
            target_w = Inches(5.8)
            
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(10)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=target_w)
        
        # Thêm chú thích hình ảnh bên dưới
        if caption_text:
            p_cap = doc.add_paragraph()
            p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(10)
            
            clean_cap = re.sub(r'[\*\_]', '', caption_text).strip()
            run_cap = p_cap.add_run(clean_cap)
            run_cap.font.name = "Times New Roman"
            run_cap.font.size = Pt(11)
            run_cap.font.italic = True
            run_cap.font.color.rgb = RGBColor(60, 60, 60)
            
    except Exception as e:
        print(f"Error inserting image {img_path}: {e}")

def parse_and_build_docx():
    print("Reading master markdown file...")
    with open(INPUT_MD, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Parsing {len(lines)} lines of academic text...")
    doc = create_document()
    
    in_table = False
    table_lines = []
    
    idx = 0
    total_lines = len(lines)
    
    while idx < total_lines:
        line = lines[idx]
        stripped = line.strip()
        
        # Xử lý kết thúc bảng Markdown
        if in_table and (not stripped.startswith('|') or idx == total_lines - 1):
            # Parse table data
            table_data = []
            for t_line in table_lines:
                cols = [c.strip() for c in t_line.strip().strip('|').split('|')]
                # Bỏ qua dòng phân cách |:---|:---|
                if any('---' in c for c in cols):
                    continue
                if any(cols):
                    table_data.append(cols)
            if table_data:
                add_table_to_doc(doc, table_data)
            in_table = False
            table_lines = []
            
        # 1. Phát hiện ngắt trang
        if '<pagebreak/>' in stripped or '\\newpage' in stripped:
            doc.add_page_break()
            idx += 1
            continue
            
        # 2. Xử lý bảng Markdown
        if stripped.startswith('|') and stripped.endswith('|'):
            in_table = True
            table_lines.append(stripped)
            idx += 1
            continue
            
        # 3. Xử lý dòng trống
        if not stripped:
            idx += 1
            continue
            
        # 4. Xử lý đường kẻ ngang
        if stripped in ['---', '***', '___']:
            p_hr = doc.add_paragraph()
            p_hr.paragraph_format.space_before = Pt(4)
            p_hr.paragraph_format.space_after = Pt(4)
            idx += 1
            continue
            
        # 5. Xử lý hình ảnh Markdown: ![Caption](path)
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', stripped)
        if img_match:
            caption_text = img_match.group(1)
            img_rel_path = img_match.group(2)
            
            # Chuẩn hóa đường dẫn ảnh
            img_full_path = os.path.normpath(os.path.join(BASE_DIR, img_rel_path))
            
            # Kiểm tra xem dòng tiếp theo có phải chú thích in đậm/nghiêng không
            next_line_cap = ""
            if idx + 1 < total_lines:
                next_stripped = lines[idx + 1].strip()
                if next_stripped.startswith('**Hình') or next_stripped.startswith('*Hình'):
                    next_line_cap = next_stripped
                    idx += 1 # Bỏ qua dòng chú thích lặp này vì đã nhúng
                    
            final_cap = next_line_cap if next_line_cap else caption_text
            insert_image_with_caption(doc, img_full_path, final_cap)
            idx += 1
            continue
            
        # 6. Xử lý tiêu đề Markdown (#, ##, ###, ####)
        h_match = re.match(r'^(#{1,4})\s+(.*)', stripped)
        if h_match:
            h_level = len(h_match.group(1))
            h_text = h_match.group(2).strip()
            
            # Nếu là Chương mới, tự động chèn ngắt trang trước đó (trừ chương đầu)
            if h_level == 1 and ('CHƯƠNG' in h_text or 'PHẦN ĐẦU' in h_text or 'TÀI LIỆU THAM KHẢO' in h_text or 'PHỤ LỤC' in h_text):
                if len(doc.paragraphs) > 5:
                    doc.add_page_break()
                    
            add_custom_heading(doc, h_text, h_level)
            idx += 1
            continue
            
        # 7. Xử lý danh sách gạch đầu dòng (*, -, +)
        list_match = re.match(r'^[\*\-\+]\s+(.*)', stripped)
        if list_match:
            item_text = list_match.group(1).strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            # Xử lý định dạng in đậm / mã trong dòng
            parse_inline_formatting(p, item_text)
            idx += 1
            continue
            
        # 8. Xử lý danh sách có số thứ tự (1., 2.,...)
        num_list_match = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if num_list_match:
            num_val = num_list_match.group(1)
            item_text = num_list_match.group(2).strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            run_num = p.add_run(f"{num_val}. ")
            run_num.font.name = "Times New Roman"
            run_num.font.size = Pt(13)
            run_num.bold = True
            
            parse_inline_formatting(p, item_text)
            idx += 1
            continue
            
        # 9. Xử lý trích dẫn Blockquote (>)
        if stripped.startswith('>'):
            quote_text = stripped.lstrip('>').strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.right_indent = Inches(0.4)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            
            run = p.add_run(quote_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)
            run.font.italic = True
            run.font.color.rgb = RGBColor(80, 80, 80)
            idx += 1
            continue
            
        # 10. Xử lý đoạn văn thường (Normal paragraph)
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        parse_inline_formatting(p, stripped)
        idx += 1
        
    print(f"Saving DOCX document to {OUTPUT_DOCX}...")
    doc.save(OUTPUT_DOCX)
    print("DOCX generation completed successfully!")

def parse_inline_formatting(paragraph, text):
    """Phân tách văn bản có in đậm (**text**), in nghiêng (*text*), hoặc mã (`code`)"""
    # Tokenizer đơn giản
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**') and len(token) >= 4:
            run = paragraph.add_run(token[2:-2])
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.bold = True
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.italic = True
        elif token.startswith('`') and token.endswith('`') and len(token) >= 2:
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(180, 40, 40)
        else:
            run = paragraph.add_run(token)
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)

if __name__ == "__main__":
    parse_and_build_docx()
