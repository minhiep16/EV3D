# -*- coding: utf-8 -*-
"""
build_v4_data_usecases.py - Bộ sinh dữ liệu 88 Đặc tả Use Case chuẩn hóa hoàn toàn cho V4.
Loại bỏ 100% mẫu lặp generic.
Hiện thực đúng bản chất kỹ thuật:
- Nhóm 3D (UC-3D-01 đến 07): Frontend WebGL, Three.js, R3F, OrbitControls, Zustand store, không gọi API, không mutate MySQL.
- Các nhóm nghiệp vụ: Mô tả đúng UI component, payload DTO, ràng buộc nghiệp vụ (WAC, Hare-Niemeyer, Boundary Overlap, 100% equity),
  luồng rẽ nhánh tham chiếu bước, luồng ngoại lệ cụ thể, truy xuất chuẩn xác tới Canonical FRs, Canonical BRs, Canonical TCs.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"

# We will define dictionaries for all 88 Use Cases
# Let's create the generator script that writes v4_data_usecases.py
