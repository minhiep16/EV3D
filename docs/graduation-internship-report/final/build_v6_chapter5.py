# -*- coding: utf-8 -*-
with open('D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace legacy BRs
br_map = {
    'BR-CTR-02': 'BR-CO-03',
    'BR-GRP-05': 'BR-CO-05',
    'BR-BKG-02': 'BR-BOOK-01',
    'BR-TRP-03': 'BR-TRIP-03',
    'BR-INV-03': 'BR-CHG-03',
    'BR-HDV-02': 'BR-TRIP-02',
    'BR-GRP-04': 'BR-CO-01',
    'BR-TRP-01': 'BR-TRIP-01',
}
for old_br, new_br in br_map.items():
    content = content.replace(old_br, new_br)

old_sec57_controls = (
    '"- OrbitControls được thiết lập các giới hạn bảo vệ: góc polar từ 35° đến 82° (chống lật camera xuống dưới mặt sàn), khoảng cách zoom tối thiểu 6.0m (chống đâm xuyên qua kính lái vào bên trong buồng lái).\\n"\n'
    '        "- Nút \'Đặt lại góc nhìn\' (Camera Reset) kích hoạt action `triggerCameraReset()` đưa camera về preset chuẩn của vai trò người dùng hiện thời.\\n"'
)

new_sec57_controls = (
    '"- OrbitControls được thiết lập các giới hạn bảo vệ nghiêm ngặt: góc quay cực polar từ 0.40 rad (~23°) đến 1.43 rad (~82°) (chống lật camera xuống sàn và bảo đảm tầm nhìn trực quan), khoảng cách zoom an toàn.\\n"\n'
    '        "- Nút \'Đặt lại góc nhìn\' (Camera Reset) kích hoạt action `triggerCameraReset()` đưa camera về tọa độ Focus chuẩn: vị trí [-0.25, 2.05, 8.8], LookAt target [0.0, 0.85, 1.8], đồng thời hỗ trợ chuyển đổi linh hoạt với Panel Safe và Overview theo garageCameraConfig.ts và vehicleCameraPresets.ts.\\n"'
)

assert old_sec57_controls in content, "old_sec57_controls not found!"
content = content.replace(old_sec57_controls, new_sec57_controls)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter5.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully created v6_chapter5.py")
