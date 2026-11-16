import re

with open('D:/EV3D/docs/graduation-internship-report/final/v5_canonical_catalogs.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update FR-3D-07
old_fr_3d_07 = "Đưa góc nhìn camera và tâm xoay OrbitControls về vị trí chuẩn ban đầu (4.5, 2.2, 4.5) và target (0, 0.75, 0)."
new_fr_3d_07 = "Khôi phục góc nhìn camera và tâm xoay OrbitControls về vị trí chuẩn ban đầu (Focus preset: [-0.25, 2.05, 8.8], LookAt target: [0.0, 0.85, 1.8], giới hạn góc cực polar từ 0.40 rad đến 1.43 rad), đồng thời hỗ trợ chuyển đổi mượt mà giữa các preset Panel Safe và Overview."
assert old_fr_3d_07 in content, "old_fr_3d_07 not found!"
content = content.replace(old_fr_3d_07, new_fr_3d_07)

# 2. Update BR-3D-03
old_br_3d_03 = "'Hành động reset camera phải đưa vị trí camera về chính xác tọa độ (4.5, 2.2, 4.5) và tâm ngắm LookAt về (0.0, 0.75, 0.0).'"
new_br_3d_03 = "'Hành động reset camera phải đưa vị trí camera về chính xác tọa độ Focus [-0.25, 2.05, 8.8] và tâm ngắm LookAt về [0.0, 0.85, 1.8], đồng thời giới hạn góc quay cực (polar angle) từ 0.40 rad (~23°) đến 1.43 rad (~82°).'"
assert old_br_3d_03 in content, "old_br_3d_03 not found!"
content = content.replace(old_br_3d_03, new_br_3d_03)

# Update source file for BR-3D-03
old_source_3d_03 = "'source_file': 'worldStore.ts:triggerCameraReset(), GarageScene.tsx'"
new_source_3d_03 = "'source_file': 'garageCameraConfig.ts, vehicleCameraPresets.ts, CameraRig.tsx, worldStore.ts'"
content = content.replace(old_source_3d_03, new_source_3d_03)

# 3. Update FR-CHG-05
old_fr_chg_05 = "Nhân viên chủ động sạc pin xe khi pin yếu tại bãi xe, chi phí nạp được tính vào quỹ chung hoặc tạm ứng vận hành."
new_fr_chg_05 = "Nhân viên chủ động sạc pin bổ sung năng lượng khi SOC dưới ngưỡng an toàn tại bãi xe; chi phí điện nạp được vốn hóa trực tiếp vào chi phí vận hành chung của nhóm và phân bổ minh bạch theo tỷ lệ sở hữu qua ExpenseShare mà không qua quỹ tiền mặt tập trung."
assert old_fr_chg_05 in content, "old_fr_chg_05 not found!"
content = content.replace(old_fr_chg_05, new_fr_chg_05)

# 4. Update FR-ADM-04
old_fr_adm_04 = "Tổng hợp doanh thu sạc điện, tổng chi phí bảo dưỡng phát sinh, tổng số dư quỹ chung và các khoản nợ tồn đọng."
new_fr_adm_04 = "Tổng hợp doanh thu sạc điện trạm sạc, tổng chi phí bảo dưỡng phát sinh của các nhóm xe, tổng số dư công nợ nghĩa vụ chi phí cần thanh toán (Active Obligations), các khoản đã quyết toán thành công và lưu trữ lịch sử quỹ dự phòng trước chuyển đổi."
assert old_fr_adm_04 in content, "old_fr_adm_04 not found!"
content = content.replace(old_fr_adm_04, new_fr_adm_04)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_canonical_catalogs.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully created v6_canonical_catalogs.py")
