# -*- coding: utf-8 -*-
"""
Script consolidate_report.py
Tự động hợp nhất và chuyển đổi toàn bộ Báo cáo Thực tập Tốt nghiệp EVShare 3D
từ Markdown sang Microsoft Word (.docx) và PDF (.pdf) chuẩn học thuật.
"""

import os
import re
import sys
import docx
from docx.shared import Inches, Pt, Cm, Mm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report"
CHAPTERS_DIR = os.path.join(BASE_DIR, "chapters")
DIAGRAMS_DIR = os.path.join(BASE_DIR, "diagrams")
REFERENCES_DIR = os.path.join(BASE_DIR, "references")

MD_OUTPUT = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md")
DOCX_OUTPUT = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.docx")
PDF_OUTPUT = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.pdf")


def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_table_borders(table, color="B0BEC5", sz="4", val="single"):
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


print("Consolidation script initialized.")
