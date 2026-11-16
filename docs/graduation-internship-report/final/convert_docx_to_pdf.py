# -*- coding: utf-8 -*-
"""
convert_docx_to_pdf.py - Chuyển đổi DOCX sang PDF bằng Microsoft Word COM Automation
Bảo đảm tính toàn vẹn 100% định dạng, phông chữ, ngắt trang và hình ảnh sắc nét
"""
import os
import sys
import time
import win32com.client

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
DOCX_PATH = os.path.normpath(os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.docx"))
PDF_PATH = os.path.normpath(os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.pdf"))

def convert():
    print(f"Opening Word application...")
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = False
    
    try:
        print(f"Loading document: {DOCX_PATH}")
        doc = word.Documents.Open(DOCX_PATH, ReadOnly=True)
        
        # Cập nhật các trường tự động (TOC, LOF, LOT, Page numbers)
        print("Updating fields and pagination...")
        try:
            doc.Fields.Update()
        except Exception as e:
            print(f"Note on field update: {e}")
            
        print(f"Exporting to PDF: {PDF_PATH}")
        # 17 = wdFormatPDF
        doc.SaveAs(PDF_PATH, FileFormat=17)
        doc.Close(SaveChanges=False)
        print("PDF export successful!")
    except Exception as e:
        print(f"Error during conversion: {e}")
        raise e
    finally:
        word.Quit()
        print("Word application closed.")

if __name__ == "__main__":
    convert()
