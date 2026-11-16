import sys
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_data_testcases as tc_old

tcs = []
for t in tc_old.ALL_TEST_CASES:
    t_new = dict(t)
    # Check TC-AUTH-01
    if t_new['id'] == 'TC-AUTH-01':
        t_new['name'] = 'Đăng ký tài khoản người dùng mới thành công'
        t_new['req_id'] = 'FR-AUTH-01'
        t_new['related_uc'] = 'UC-AUTH-03'
        t_new['actor'] = 'Khách vãng lai / Người dùng mới'
        t_new['priority'] = 'High'
        t_new['preconditions'] = 'Email và số điện thoại chưa tồn tại trong hệ thống'
        t_new['test_data'] = '`fullName: "Trần Văn Mới"`, `email: "tranvanmoi@evshare.com"`, `pass: "Password@123"`, `phone: "0901234567"`'
        t_new['steps'] = '1. Truy cập trang đăng ký tài khoản (/register)\n2. Nhập đầy đủ thông tin hợp lệ\n3. Nhấn nút "Đăng Ký"'
        t_new['expected'] = 'Tạo User mới trong CSDL, mã hóa BCrypt mật khẩu, gửi email thông báo kích hoạt, trả về mã trạng thái HTTP 201 Created'
        t_new['actual'] = 'Chưa ghi nhận (Chưa thực thi thực tế)'
        t_new['status'] = 'NOT EXECUTED'
        t_new['evidence'] = 'Chưa có (Chưa thực thi thực tế)'
        t_new['source'] = '`AuthService.java:register()`'
    
    # Check TC-AUTH-02
    elif t_new['id'] == 'TC-AUTH-02':
        t_new['name'] = 'Đăng nhập thành công với thông tin hợp lệ'
        t_new['req_id'] = 'FR-AUTH-02'
        t_new['related_uc'] = 'UC-AUTH-01'
        t_new['actor'] = 'CO_OWNER / Người dùng'
        t_new['priority'] = 'High'
        t_new['preconditions'] = 'Tài khoản đã được kích hoạt trong CSDL'
        t_new['test_data'] = '`email: "owner1@evshare.com"`, `pass: "Password@123"`'
        t_new['steps'] = '1. Nhập email & password hợp lệ\n2. Nhấn nút "Đăng Nhập"'
        t_new['expected'] = 'Nhận Access Token & Refresh Token, giải mã Role CO_OWNER, chuyển hướng vào /garage'
        t_new['actual'] = 'Chưa ghi nhận (Chưa thực thi thực tế)'
        t_new['status'] = 'NOT EXECUTED'
        t_new['evidence'] = 'Chưa có (Chưa thực thi thực tế)'
        t_new['source'] = '`AuthService.java:login()`'
        
    # Check TC-3D-04
    elif t_new['id'] == 'TC-3D-04':
        t_new['name'] = 'Kích hoạt chế độ X-Ray soi xuyên thấu khối Pin xe điện'
        t_new['req_id'] = 'FR-3D-04'
        t_new['related_uc'] = 'UC-3D-04'
        t_new['actor'] = 'CO_OWNER / STAFF'
        t_new['priority'] = 'Medium'
        t_new['preconditions'] = 'Mô hình xe điện đang hiển thị trên bục Garage 3D'
        t_new['test_data'] = 'Nhấp nút công tắc X-Ray Mode trên thanh công cụ'
        t_new['steps'] = '1. Nhấp nút biểu tượng "X-Ray Pin" trên thanh công cụ 3D\n2. Quan sát độ trong suốt vỏ xe và khối cell pin'
        t_new['expected'] = 'Vỏ xe chuyển sang vật liệu bán trong suốt (opacity = 0.15), Mesh khối pin bên dưới gầm xe nổi bật với màu sắc biểu thị SOC / nhiệt độ cell pin'
        t_new['actual'] = 'Chưa ghi nhận (Chưa thực thi thực tế)'
        t_new['status'] = 'NOT EXECUTED'
        t_new['evidence'] = 'Chưa có (Chưa thực thi thực tế)'
        t_new['source'] = '`BatteryXRayOverlay.tsx`'

    # Check TC-3D-05
    elif t_new['id'] == 'TC-3D-05':
        t_new['name'] = 'Điều khiển xoay tự do và khóa góc xoay quanh trục Y (Vehicle Yaw Rotation)'
        t_new['req_id'] = 'FR-3D-05'
        t_new['related_uc'] = 'UC-3D-06'
        t_new['actor'] = 'CO_OWNER / STAFF'
        t_new['priority'] = 'Medium'
        t_new['preconditions'] = 'Mô hình xe hiển thị tại bục 3D'
        t_new['test_data'] = 'Kéo rê chuột trái (drag) theo phương ngang hoặc bật Auto-Rotate'
        t_new['steps'] = '1. Giữ chuột trái và kéo rê ngang màn hình\n2. Bật công tắc Auto-Rotate trên UI điều khiển 3D'
        t_new['expected'] = 'Xe/Camera xoay mượt mà 360 độ quanh trục thẳng đứng Y (Yaw); góc ngẩng (polar angle) bị khóa trong khoảng an toàn 0.40 rad đến 1.43 rad không bị lộn ngược sàn'
        t_new['actual'] = 'Chưa ghi nhận (Chưa thực thi thực tế)'
        t_new['status'] = 'NOT EXECUTED'
        t_new['evidence'] = 'Chưa có (Chưa thực thi thực tế)'
        t_new['source'] = '`CameraRig.tsx, GarageScene.tsx`'

    # Check TC-REG-12
    elif t_new['id'] == 'TC-REG-12':
        t_new['name'] = 'Kiểm tra phục hồi góc nhìn camera mặc định sau khi xoay lật tự do (Camera Reset Regression)'
        t_new['req_id'] = 'FR-3D-07'
        t_new['related_uc'] = 'UC-3D-07'
        t_new['actor'] = 'Người dùng'
        t_new['priority'] = 'High'
        t_new['preconditions'] = 'Camera bị xoay lệch xa bục Garage'
        t_new['test_data'] = 'Click "Reset Camera" trên thanh công cụ'
        t_new['steps'] = '1. Bấm nút Đặt Lại Góc Nhìn (Reset Camera)\n2. Quan sát chuyển động nội suy Lerp'
        t_new['expected'] = 'Camera chuyển động Lerp mượt mà trong 800ms đưa vị trí camera về Focus [-0.25, 2.05, 8.8], LookAt target về [0.0, 0.85, 1.8], giữ góc cực polar trong khoảng [0.40, 1.43] rad'
        t_new['actual'] = 'Chưa ghi nhận (Chưa thực thi thực tế)'
        t_new['status'] = 'NOT EXECUTED'
        t_new['evidence'] = 'Chưa có (Chưa thực thi thực tế)'
        t_new['source'] = '`CameraRig.tsx, worldStore.ts`'
        
    tcs.append(t_new)

# Output v6_data_testcases.py
with open('D:/EV3D/docs/graduation-internship-report/final/v6_data_testcases.py', 'w', encoding='utf-8') as f:
    f.write('"""\nEVShare 3D - Authoritative Test Cases Dataset (V6)\nTotal: 100 Test Cases (69 Functional + 31 Regression)\n"""\n\n')
    f.write('ALL_TEST_CASES = [\n')
    for t in tcs:
        f.write('    {\n')
        for k, v in t.items():
            f.write(f'        {repr(k)}: {repr(v)},\n')
        f.write('    },\n')
    f.write(']\n\n')
    f.write('def get_all_test_cases():\n    return ALL_TEST_CASES\n')

print(f"Successfully generated v6_data_testcases.py with {len(tcs)} test cases.")
