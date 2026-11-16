# -*- coding: utf-8 -*-
"""
v5_chapters_data.py - Module tập hợp toàn bộ dữ liệu nội dung học thuật cho Báo cáo V5
Bao gồm:
- Bìa & Khung giữ chỗ thông tin (Front Matter)
- Chương 1 (10 mục học thuật chi tiết, kế hoạch 16 tuần đề xuất)
- Chương 2 (9 mục lý thuyết với 32 trích dẫn chuẩn IEEE [1]-[32], công thức năng lượng và WAC chính xác)
- Chương 3 (Phân tích yêu cầu, 70 Canonical FRs, 42 Canonical BRs, Role Matrix, chỉ tiêu NFRs đề xuất)
- Chương 5 (25 phân hệ hiện thực hóa chi tiết, Phân bổ chi phí trực tiếp, 20 UI placeholders, công thức WAC & Hare-Niemeyer)
- Chương 6 (Chiến lược QA, 100 TCs, công bố NOT EXECUTED, ma trận 14 nhóm lỗi hồi quy, đánh giá kiến trúc tĩnh và chỉ số nghiệm thu đề xuất)
- Chương 7 (Đánh giá khách quan, 6 ưu điểm, 5 hạn chế, 5 bài học, lộ trình 4 giai đoạn, kết luận)
- Thư mục Tài liệu tham khảo 32 nguồn chuẩn IEEE
- Thuyết minh Phụ lục E đến N (bao gồm công thức chi tiết WAC và Hare-Niemeyer tại Phụ lục M)
"""

import sys
import os

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import v5_chapter1
import v5_chapter2
import v5_chapter3
import v5_chapter5
import v5_chapter6_7
import v5_appendices_narratives

def get_front_matter():
    return v5_chapter1.get_front_matter()

def get_chapter_1():
    return v5_chapter1.get_chapter_1()

def get_chapter_2():
    return v5_chapter2.get_chapter_2()

def get_chapter_3_intro():
    return v5_chapter3.get_chapter_3_intro()

def get_chapter_5_content():
    return v5_chapter5.get_chapter_5()

def get_chapter_6_content():
    return v5_chapter6_7.get_chapter_6()

def get_chapter_7_content():
    return v5_chapter6_7.get_chapter_7()

def get_bibliography():
    return v5_chapter6_7.get_bibliography()

def get_appendices_narratives():
    return v5_appendices_narratives.get_appendices_narratives()
