# -*- coding: utf-8 -*-
"""
convert_v5_docx_to_pdf.py - Chuyển đổi DOCX V5 sang PDF bằng Word COM Automation
Lấy số trang chính xác và lưu tệp BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.pdf
"""
import os
import sys
import time
import win32com.client

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
DOCX_PATH = os.path.normpath(os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.docx"))
PDF_PATH = os.path.normpath(os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V5.pdf"))

def convert_v5():
    print(f"Opening Word application...")
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = False
    
    try:
        print(f"Loading document: {DOCX_PATH}")
        doc = word.Documents.Open(DOCX_PATH, ReadOnly=True)
        
        print("Updating fields and pagination...")
        try:
            doc.Fields.Update()
        except Exception as e:
            print(f"Note on field update: {e}")
            
        # wdStatisticPages = 2
        pages = doc.ComputeStatistics(2)
        print(f"Exact Rendered Page Count: {pages} pages")
        
        print(f"Exporting to PDF: {PDF_PATH}")
        # 17 = wdFormatPDF
        doc.SaveAs(PDF_PATH, FileFormat=17)
        doc.Close(SaveChanges=False)
        print("PDF export successful!")
        
        file_size_mb = os.path.getsize(PDF_PATH) / (1024 * 1024)
        print(f"PDF File Size: {file_size_mb:.2f} MB")
        return pages, file_size_mb
    except Exception as e:
        print(f"Error during conversion: {e}")
        raise e
    finally:
        word.Quit()
        print("Word application closed.")

if __name__ == "__main__":
    convert_v5()
