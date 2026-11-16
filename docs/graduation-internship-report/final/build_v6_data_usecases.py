import sys
sys.path.append('D:/EV3D/docs/graduation-internship-report/final')
import v5_data_usecases as uc_old

ucs = []
for u in uc_old.ALL_USE_CASES:
    u_new = dict(u)
    uid = u_new['id']
    
    if uid == 'UC-3D-07':
        u_new['alt_flow'] = "Tại bước 4, nếu người dùng đang kích hoạt chế độ X-Ray: Hành động reset camera vẫn đưa góc nhìn về vị trí chuẩn (Focus preset) mà không làm mất trạng thái X-Ray của khối pin."
        u_new['exception_flow'] = "Tại bước 4, nếu quá trình chuyển động camera bị gián đoạn do người dùng bất ngờ nhấp chuột kéo OrbitControls: Hoạt ảnh tween lập tức dừng lại (kill tween) và trao quyền điều khiển tức thì cho thao tác chuột của người dùng để tránh giật khung hình."
        
    elif uid == 'UC-TRIP-07':
        u_new['main_flow'] = u_new['main_flow'].replace(
            "bồi hoàn 50.000 đ vào quỹ chung",
            "bồi hoàn 50.000 đ trực tiếp cho thành viên bị dời lịch kế tiếp"
        )
        
    elif uid == 'UC-FIN-03':
        u_new['alt_flow'] = "Tại bước 5, thành viên có thể nhấp 'Xem ảnh chứng từ' để phóng to xem hóa đơn thanh toán của gara sửa xe hoặc biên lai tiền điện."
        u_new['exception_flow'] = "Tại bước 3, nếu phát hiện chi phí của chuyến đi đã được phân bổ trước đó: Hệ thống kích hoạt cơ chế Idempotency, chặn tạo trùng lặp nghĩa vụ và trả về HTTP 409 Conflict."
        
    elif uid == 'UC-FIN-04':
        u_new['alt_flow'] = "Tại bước 2, người dùng có thể chọn gộp nhiều nghĩa vụ chi phí cá nhân (tiền điện chuyến đi và chi phí bảo dưỡng chia sẻ) để thanh toán tập trung trong một giao dịch VietQR duy nhất."
        u_new['exception_flow'] = "Tại bước 4, nếu hệ thống phát hiện đã tồn tại giao dịch nộp tiền đang ở trạng thái PAYMENT_SUBMITTED chưa được nhân viên đối soát: Chặn việc gửi trùng lặp và yêu cầu chờ kết quả phê duyệt."
        
    elif uid == 'UC-FIN-05':
        u_new['alt_flow'] = "Tại bước 4, nếu phát hiện biên lai giả mạo hoặc số tiền không khớp tài khoản thực nhận: Nhân viên chuyển sang luồng từ chối thanh toán (UC-FIN-06) kèm lý do giải trình."
        u_new['exception_flow'] = "Tại bước 3, nếu một nhân viên kiêm đồng sở hữu cố tình tự bấm duyệt thanh toán nợ của chính mình: Hệ thống chặn đứng giao dịch theo quy tắc No Self-Approval (BR-EXP-02), trả về HTTP 403 Forbidden kèm thông báo 'Vi phạm quy tắc bảo mật: Bạn không được phép tự phê duyệt khoản thanh toán của chính mình'."
        
    elif uid == 'UC-FIN-06':
        u_new['alt_flow'] = "Tại bước 4, sau khi nhận được thông báo từ chối kèm lý do giải trình, thành viên có thể mở lại giao diện công nợ để tải lên biên lai chuyển khoản chính xác hoặc liên hệ trực ban hỗ trợ."
        u_new['exception_flow'] = "Tại bước 4, nếu nhân viên không nhập lý do từ chối: Hệ thống yêu cầu bắt buộc phải có nội dung giải trình lý do trước khi gửi."
        
    elif uid == 'UC-FIN-07':
        u_new['alt_flow'] = "Tại bước 2, người dùng có thể nhấp vào từng khoản giao dịch để xem chi tiết danh sách các hóa đơn ExpenseShare đã được gạch nợ thành công."
        u_new['exception_flow'] = "Tại bước 4, nếu người dùng chưa từng thanh toán giao dịch nào: Hiển thị bảng trống kèm thông báo 'Chưa có lịch sử thanh toán'."
        
    elif uid == 'UC-MAINT-07':
        u_new['alt_flow'] = "Tại bước 8, đối với các trường hợp sửa chữa được bảo hiểm chi trả một phần: Nhân viên chỉ nhập phần chi phí khấu trừ tự chi trả (deductible), hệ thống tự động phân bổ phần chênh lệch này qua ExpenseShare theo tỷ lệ sở hữu mà không sử dụng quỹ tiền mặt tập trung."
        
    ucs.append(u_new)

with open('D:/EV3D/docs/graduation-internship-report/final/v6_data_usecases.py', 'w', encoding='utf-8') as f:
    f.write('"""\nEVShare 3D - Authoritative Use Cases Dataset (V6)\nTotal: 88 Use Cases with full tabular specifications\n"""\n\n')
    f.write('ALL_USE_CASES = [\n')
    for u in ucs:
        f.write('    {\n')
        for k, v in u.items():
            f.write(f'        {repr(k)}: {repr(v)},\n')
        f.write('    },\n')
    f.write(']\n\n')
    f.write('def get_all_use_cases():\n    return ALL_USE_CASES\n')

print(f"Successfully generated v6_data_usecases.py with {len(ucs)} Use Cases.")
