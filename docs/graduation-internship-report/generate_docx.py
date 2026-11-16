# -*- coding: utf-8 -*-
"""
generate_docx.py
Chuyển đổi toàn bộ báo cáo tốt nghiệp EVShare 3D sang file Word (.docx) và PDF (.pdf) chuẩn mực.
"""

import os
import re
import sys
import docx
from docx.shared import Inches, Pt, Cm, Mm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report"
DOCX_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.docx")
PDF_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.pdf")
MD_MASTER_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md")


def create_element(name):
    return OxmlElement(name)


def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_table_borders(table, color="D0D5DD", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


def make_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def add_page_number_to_run(run):
    fldChar1 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>')
    instrText = parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> PAGE </w:instrText>')
    fldChar2 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="separate"/>')
    fldChar3 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)


def parse_inline_formatting(paragraph, text, base_font_size=13, is_italic=False, is_bold=False):
    """
    Phân tích chuỗi định dạng Markdown inline (**bold**, *italic*, `code`, math)
    và thêm các run vào paragraph của python-docx.
    """
    # Regex tìm các token: **bold**, *italic*, `code`, $$math$$, $math$
    token_pattern = re.compile(
        r'(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|\$\$[^\$]+?\$\$|\$[^\$]+?\$|<br\s*/?>)'
    )
    parts = token_pattern.split(text)

    for part in parts:
        if not part:
            continue

        run = paragraph.add_run()
        run.font.name = "Times New Roman"
        run.font.size = Pt(base_font_size)
        run.bold = is_bold
        run.italic = is_italic

        if part.startswith("**") and part.endswith("**") and len(part) >= 4:
            run.text = part[2:-2]
            run.bold = True
        elif part.startswith("*") and part.endswith("*") and len(part) >= 2:
            run.text = part[1:-1]
            run.italic = True
        elif part.startswith("`") and part.endswith("`") and len(part) >= 2:
            run.text = part[1:-1]
            run.font.name = "Consolas"
            run.font.size = Pt(base_font_size - 1.5)
            run.font.color.rgb = RGBColor(199, 37, 78)  # Subtle code red
        elif part.startswith("$$") and part.endswith("$$") and len(part) >= 4:
            run.text = part[2:-2]
            run.font.name = "Cambria Math"
            run.italic = True
        elif part.startswith("$") and part.endswith("$") and len(part) >= 2:
            run.text = part[1:-1]
            run.font.name = "Cambria Math"
            run.italic = True
        elif part.lower() in ("<br>", "<br/>", "<br />"):
            run.add_break()
        else:
            # Clean up residual HTML tags like <strong>, </strong>, <div>, </div>
            cleaned = re.sub(r'</?(?:strong|b|em|i|div|span|p)[^>]*>', '', part)
            run.text = cleaned


def build_docx_from_markdown(md_file_path, docx_output_path):
    print(f"Reading markdown from: {md_file_path}")
    with open(md_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = docx.Document()

    # Thiết lập kích thước trang A4 và lề chuẩn học thuật
    for section in doc.sections:
        section.page_width = Mm(210)
        section.page_height = Mm(297)
        section.left_margin = Cm(3.5)
        section.right_margin = Cm(2.0)
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)

        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Báo cáo Thực tập Tốt nghiệp — Hệ thống Quản lý Đồng sở hữu Xe điện EVShare 3D")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.italic = True
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run()
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(10)
        add_page_number_to_run(frun)

    lines = content.splitlines()
    i = 0
    n = len(lines)

    in_code_block = False
    code_block_lines = []
    code_block_lang = ""

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # 1. Xử lý khối mã lệnh (Code Blocks)
        if stripped.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_block_lang = stripped[3:].strip()
                code_block_lines = []
                i += 1
                continue
            else:
                in_code_block = False
                # Thêm code block vào document
                code_text = "\n".join(code_block_lines)
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = table.cell(0, 0)
                set_cell_background(cell, "F8F9FA")
                set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
                
                # Viền xám nhạt xung quanh
                set_table_borders(table, color="D0D5DD", sz="4", val="single")

                cp = cell.paragraphs[0]
                cp.paragraph_format.line_spacing = 1.15
                cp.paragraph_format.space_after = Pt(0)
                cp.paragraph_format.space_before = Pt(0)
                crun = cp.add_run(code_text)
                crun.font.name = "Consolas"
                crun.font.size = Pt(9.5)
                crun.font.color.rgb = RGBColor(33, 37, 41)

                # Khoảng đệm sau bảng code
                sp = doc.add_paragraph()
                sp.paragraph_format.space_before = Pt(0)
                sp.paragraph_format.space_after = Pt(4)

                i += 1
                continue

        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        # 2. Xử lý ngắt trang <pagebreak/>
        if "<pagebreak" in stripped.lower():
            doc.add_page_break()
            i += 1
            continue

        # 3. Bỏ qua đường kẻ ngang Markdown
        if stripped == "---":
            i += 1
            continue

        # 4. Bỏ qua dòng trống
        if not stripped:
            i += 1
            continue

        # 5. Xử lý Tiêu đề (Headings)
        if stripped.startswith("# "):
            heading_text = stripped[2:].strip()
            # Bỏ qua tag HTML trong tiêu đề
            heading_text = re.sub(r'<[^>]+>', '', heading_text)
            
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(12)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.keep_with_next = True

            # Tiêu đề chương căn giữa nếu là tên chương hoặc phần đầu
            if heading_text.startswith("CHƯƠNG") or "BÁO CÁO" in heading_text or "PHỤ LỤC" in heading_text:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT

            run = p.add_run(heading_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(16, 24, 40)
            i += 1
            continue

        if stripped.startswith("## "):
            heading_text = stripped[3:].strip()
            heading_text = re.sub(r'<[^>]+>', '', heading_text)

            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.keep_with_next = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT

            run = p.add_run(heading_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(29, 41, 57)
            i += 1
            continue

        if stripped.startswith("### "):
            heading_text = stripped[4:].strip()
            heading_text = re.sub(r'<[^>]+>', '', heading_text)

            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.keep_with_next = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT

            run = p.add_run(heading_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(52, 64, 84)
            i += 1
            continue

        if stripped.startswith("#### "):
            heading_text = stripped[5:].strip()
            heading_text = re.sub(r'<[^>]+>', '', heading_text)

            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.keep_with_next = True
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT

            run = p.add_run(heading_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.italic = True
            run.font.color.rgb = RGBColor(71, 84, 103)
            i += 1
            continue

        # 6. Xử lý Chèn Hình ảnh Markdown ![Caption](path)
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', stripped)
        if img_match:
            caption = img_match.group(1).strip()
            img_rel_path = img_match.group(2).strip()

            # Chuẩn hóa đường dẫn ảnh
            img_full_path = os.path.normpath(os.path.join(BASE_DIR, img_rel_path))
            if not os.path.exists(img_full_path):
                # Thử tìm trực tiếp theo tên file trong thư mục diagrams
                img_name = os.path.basename(img_rel_path)
                for root, _, files in os.walk(DIAGRAMS_DIR):
                    if img_name in files:
                        img_full_path = os.path.join(root, img_name)
                        break

            if os.path.exists(img_full_path):
                # Chèn ảnh vào tài liệu
                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_before = Pt(12)
                p_img.paragraph_format.space_after = Pt(4)
                run_img = p_img.add_run()
                try:
                    # Giới hạn chiều rộng ảnh tối đa 5.8 inches (vừa khít khổ A4 có lề)
                    run_img.add_picture(img_full_path, width=Inches(5.8))
                except Exception as e:
                    print(f"Error adding picture {img_full_path}: {e}")

                # Chèn chú thích hình ảnh phía dưới
                if caption:
                    p_cap = doc.add_paragraph()
                    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_cap.paragraph_format.space_before = Pt(2)
                    p_cap.paragraph_format.space_after = Pt(10)
                    p_cap.paragraph_format.keep_with_next = False
                    c_run = p_cap.add_run(caption)
                    c_run.font.name = "Times New Roman"
                    c_run.font.size = Pt(11)
                    c_run.font.italic = True
                    c_run.font.color.rgb = RGBColor(71, 84, 103)
            else:
                print(f"Image not found: {img_full_path}")
            i += 1
            continue

        # 7. Xử lý Bảng biểu Markdown (| Col 1 | Col 2 | ...)
        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines = []
            while i < n and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                table_lines.append(lines[i].strip())
                i += 1

            if len(table_lines) >= 2:
                # Phân tích các hàng
                parsed_rows = []
                for tline in table_lines:
                    # Tách các cột
                    cells = [c.strip() for c in tline.split("|")[1:-1]]
                    # Bỏ qua dòng phân cách |:---|:---:|
                    if all(re.match(r'^:?-+:?$', c) for c in cells if c):
                        continue
                    parsed_rows.append(cells)

                if parsed_rows:
                    num_cols = max(len(r) for r in parsed_rows)
                    doc_table = doc.add_table(rows=len(parsed_rows), cols=num_cols)
                    doc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
                    set_table_borders(doc_table, color="D0D5DD", sz="4", val="single")

                    for r_idx, row_data in enumerate(parsed_rows):
                        row = doc_table.rows[r_idx]
                        is_header = (r_idx == 0)

                        if is_header:
                            make_row_header(row)

                        for c_idx in range(num_cols):
                            cell = row.cells[c_idx]
                            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

                            if is_header:
                                set_cell_background(cell, "F2F4F7")

                            text_val = row_data[c_idx] if c_idx < len(row_data) else ""
                            cell_p = cell.paragraphs[0]
                            cell_p.paragraph_format.line_spacing = 1.15
                            cell_p.paragraph_format.space_before = Pt(2)
                            cell_p.paragraph_format.space_after = Pt(2)

                            if is_header:
                                cell_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                                parse_inline_formatting(cell_p, text_val, base_font_size=10.5, is_bold=True)
                            else:
                                cell_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                                parse_inline_formatting(cell_p, text_val, base_font_size=10.5)

                    # Thêm khoảng đệm sau bảng
                    after_p = doc.add_paragraph()
                    after_p.paragraph_format.space_before = Pt(0)
                    after_p.paragraph_format.space_after = Pt(4)
            continue

        # 8. Xử lý Danh sách gạch đầu dòng (* item, - item)
        bullet_match = re.match(r'^(\s*)([\*\-]\s+)(.*)$', line)
        if bullet_match:
            indent_level = len(bullet_match.group(1)) // 2
            item_text = bullet_match.group(3).strip()

            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25 * (indent_level + 1))
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.3
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            bullet_run = p.add_run("•  ")
            bullet_run.font.name = "Times New Roman"
            bullet_run.font.size = Pt(13)
            bullet_run.bold = True

            parse_inline_formatting(p, item_text, base_font_size=13)
            i += 1
            continue

        # 9. Xử lý Danh sách đánh số (1. item, 2. item)
        num_match = re.match(r'^(\s*)(\d+\.\s+)(.*)$', line)
        if num_match:
            num_prefix = num_match.group(2)
            item_text = num_match.group(3).strip()

            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.3
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            num_run = p.add_run(num_prefix)
            num_run.font.name = "Times New Roman"
            num_run.font.size = Pt(13)
            num_run.bold = True

            parse_inline_formatting(p, item_text, base_font_size=13)
            i += 1
            continue

        # 10. Xử lý Trích dẫn (> quote)
        if stripped.startswith(">"):
            quote_text = stripped[1:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.right_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            parse_inline_formatting(p, quote_text, base_font_size=12, is_italic=True)
            i += 1
            continue

        # 11. Xử lý Chú thích bảng hoặc hình ảnh in nghiêng (*Hình X.Y...* hoặc *Bảng X.Y...*)
        if stripped.startswith("*") and (stripped.startswith("*Hình ") or stripped.startswith("*Bảng ")) and stripped.endswith("*"):
            cap_text = stripped[1:-1].strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(cap_text)
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
            run.font.italic = True
            run.font.color.rgb = RGBColor(71, 84, 103)
            i += 1
            continue

        # 12. Đoạn văn chuẩn (Body Paragraph)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.5
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        parse_inline_formatting(p, stripped, base_font_size=13)
        i += 1

    print(f"Saving Word document to: {docx_output_path}")
    doc.save(docx_output_path)
    print("Word document saved successfully.")


def convert_docx_to_pdf(docx_path, pdf_path):
    print(f"Converting DOCX to PDF using Microsoft Word COM...")
    import win32com.client

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False

    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)

    try:
        doc = word.Documents.Open(abs_docx)
        # 17 = wdFormatPDF
        doc.SaveAs(abs_pdf, FileFormat=17)
        doc.Close()
        print(f"PDF converted successfully: {pdf_path}")
    except Exception as e:
        print(f"Error during Word COM conversion: {e}")
    finally:
        word.Quit()


if __name__ == "__main__":
    build_docx_from_markdown(MD_MASTER_PATH, DOCX_PATH)
    convert_docx_to_pdf(DOCX_PATH, PDF_PATH)
