# -*- coding: utf-8 -*-
"""
v4_chapters_data.py - Module tập hợp toàn bộ dữ liệu nội dung học thuật cho Báo cáo V4
Bao gồm:
- Bìa & Khung giữ chỗ thông tin (Front Matter)
- Chương 1 (10 mục học thuật chi tiết)
- Chương 2 (9 mục lý thuyết với 32 trích dẫn chuẩn IEEE [1]-[32])
- Chương 3 (Phân tích yêu cầu, 68 FRs, 42 BRs, Role Matrix, 14 UCs cốt lõi)
- Chương 5 (25 phân hệ hiện thực hóa chi tiết, 20 UI placeholders, code trích dẫn, công thức WAC & Hare-Niemeyer)
- Chương 6 (Chiến lược QA, 100 TCs, công bố NOT EXECUTED, ma trận 14 nhóm lỗi hồi quy lịch sử)
- Chương 7 (Đánh giá khách quan, ưu điểm, hạn chế, bài học, lộ trình tương lai)
- Thư mục Tài liệu tham khảo 32 nguồn chuẩn IEEE
- Thuyết minh Phụ lục E đến N
"""

import v4_chapter1
import v4_chapter2
import v4_chapter3
import v4_chapter5
import v4_chapter6_7
import v4_appendices_narratives

def get_front_matter():
    return v4_chapter1.get_front_matter()

def get_chapter_1():
    return v4_chapter1.get_chapter_1()

def get_chapter_2():
    return v4_chapter2.get_chapter_2()

def get_chapter_3_intro():
    return v4_chapter3.get_chapter_3_intro()

def get_chapter_5_content():
    return v4_chapter5.get_chapter_5()

def get_chapter_6_content():
    return v4_chapter6_7.get_chapter_6()

def get_chapter_7_content():
    return v4_chapter6_7.get_chapter_7()

def get_bibliography():
    return v4_chapter6_7.get_bibliography()

def get_appendices_narratives():
    return v4_appendices_narratives.get_appendices_narratives()
