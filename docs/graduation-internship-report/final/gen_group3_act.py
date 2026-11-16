# -*- coding: utf-8 -*-
"""
gen_group3_act.py - Tạo các sơ đồ hoạt động phân làn (ACT-01 đến ACT-12)
"""
import os

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"
os.makedirs(BASE_DIR, exist_ok=True)

SKIN_HEADER = """
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam handwritten false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
"""

act_diagrams = {
    "act_01_login_auth.puml": f"""@startuml
title QUY TRÌNH ĐĂNG NHẬP VÀ XÁC THỰC PHI TRẠNG THÁI JWT (ACT-01)
{SKIN_HEADER}

|Người Dùng|
start
:Mở màn hình AuthScene.tsx;
:Nhập địa chỉ Email và Mật khẩu;
:Bấm nút "Đăng Nhập";

|Giao Diện Web (React)|
:Gửi yêu cầu POST /api/auth/login;

|Hệ Thống Backend (Spring Boot)|
:Tìm kiếm tài khoản theo Email;
if (Tài khoản tồn tại và đang hoạt động?) then (Có)
    :Đối chiếu mật khẩu qua BCryptPasswordEncoder;
    if (Mật khẩu trùng khớp?) then (Đúng)
        :Sinh Access Token JWT (HMAC-SHA256);
        :Sinh Refresh Token ngẫu nhiên và lưu vào CSDL;
        :Trả về HTTP 200 OK kèm cặp Token & Role;
        
        |Giao Diện Web (React)|
        :Lưu Access Token & Refresh Token vào authStore;
        :Cập nhật trạng thái người dùng;
        :Chuyển hướng camera vào không gian /garage;
        
        |Người Dùng|
        :Trải nghiệm không gian Virtual Garage 3D;
        stop
    else (Sai)
        |Hệ Thống Backend (Spring Boot)|
        :Ném ngoại lệ BadCredentialsException;
        :Trả về HTTP 401 Unauthorized;
    endif
else (Không)
    |Hệ Thống Backend (Spring Boot)|
    :Trả về HTTP 401 Unauthorized;
endif

|Giao Diện Web (React)|
:Hiển thị thông báo lỗi màu đỏ trên form;
|Người Dùng|
:Kiểm tra và nhập lại thông tin;
stop
@enduml
""",

    "act_02_booking_conflict.puml": f"""@startuml
title QUY TRÌNH ĐẶT LỊCH VÀ KHỬ XUNG ĐỘT THỜI GIAN (ACT-02)
{SKIN_HEADER}

|Chủ Đồng Sở Hữu (CO_OWNER)|
start
:Chọn xe trong không gian Virtual Garage 3D;
:Mở bảng điều khiển CoOwnerBookingPanel;
:Chọn thời gian bắt đầu và thời gian kết thúc;
:Bấm nút "Xác Nhận Đặt Lịch";

|Hệ Thống Backend (Spring Boot)|
:Tiếp nhận POST /api/bookings/vehicle/{{id}};
:Kiểm tra: startTime < endTime và không ở quá khứ;
if (Dữ liệu thời gian hợp lệ?) then (Hợp lệ)
    :Kiểm tra người dùng có thuộc nhóm xe hoạt động?;
    if (Là thành viên hoạt động?) then (Đúng)
        :Kiểm tra trạng thái xe có phải MAINTENANCE?;
        if (Xe sẵn sàng?) then (Sẵn sàng)
            :Truy vấn findConflictingBookings trong CSDL\\n(existing.start < new.end AND existing.end > new.start);
            if (Có lịch đặt xung đột?) then (Không có xung đột)
                :Lưu bản ghi Booking (Status = CONFIRMED);
                :Trả về HTTP 201 Created;
                
                |Giao Diện Web (React)|
                :Cập nhật thanh tiến trình lịch trên 3D HUD;
                :Hiển thị thông báo đặt xe thành công;
                |Chủ Đồng Sở Hữu (CO_OWNER)|
                :Hoàn tất đặt lịch xe;
                stop
            else (Phát hiện xung đột)
                :Ném ngoại lệ IllegalArgumentException\\n"Khung giờ này đã được đặt";
                :Trả về HTTP 400 Bad Request;
            endif
        else (Xe bảo dưỡng)
            :Báo lỗi: Xe đang bảo dưỡng;
        endif
    else (Không thuộc nhóm)
        :Ném ngoại lệ AccessDeniedException (HTTP 403);
    endif
else (Không hợp lệ)
    :Báo lỗi: Thời gian không hợp lệ;
endif

|Giao Diện Web (React)|
:Hiển thị cảnh báo lỗi màu đỏ;
|Chủ Đồng Sở Hữu (CO_OWNER)|
:Chọn lại khung giờ khả dụng khác;
stop
@enduml
""",

    "act_03_handover_inspection.puml": f"""@startuml
title QUY TRÌNH BÀN GIAO XE VÀ KIỂM ĐỊNH KỸ THUẬT (ACT-03)
{SKIN_HEADER}

|Nhân Viên Điều Hành (STAFF)|
start
:Mở danh sách xe tại trạm, chọn xe có lịch đặt sắp đến;
:Mở StaffHandoverModal;
:Kiểm tra thực tế xe: số ODO và % Pin (SOC);
:Nhập số ODO xuất phát và % Pin xuất phát;
:Bấm "Xác Nhận Bàn Giao Kỹ Thuật";

|Hệ Thống Backend (Spring Boot)|
:Lưu bản ghi VehicleHandover (status = COMPLETED);
:Cập nhật trạng thái xe thành RESERVED;
:Gửi thông báo thời gian thực đến Co-Owner;

|Chủ Đồng Sở Hữu (CO_OWNER)|
:Nhận thông báo mời kiểm tra xe tại bãi;
:Đối chiếu hiện trạng thực tế phương tiện;
:Mở bảng xác nhận trên giao diện 3D;
:Bấm "Ký Xác Nhận Biên Bản Bàn Giao";

|Hệ Thống Backend (Spring Boot)|
:Ghi nhận ownerConditionAcknowledgedAt = now();
:Mở khóa nút "Bắt Đầu Chuyến Đi";

|Chủ Đồng Sở Hữu (CO_OWNER)|
:Bấm "Bắt Đầu Chuyến Đi";
:Hệ thống chuyển trạng thái xe sang IN_USE;
:Bắt đầu hành trình di chuyển;
stop
@enduml
""",

    "act_04_trip_start_extension.puml": f"""@startuml
title QUY TRÌNH VẬN HÀNH CHUYẾN ĐI VÀ GIA HẠN THÊM GIỜ (ACT-04)
{SKIN_HEADER}

|Chủ Đồng Sở Hữu (CO_OWNER)|
start
:Xe đang di chuyển thực tế trên đường (Trip ACTIVE);
if (Có nhu cầu đi thêm giờ?) then (Có nhu cầu)
    :Mở panel chuyến đi trên giao diện;
    :Nhập số phút cần gia hạn thêm;
    :Bấm "Yêu Cầu Gia Hạn";
    
    |Hệ Thống Backend (Spring Boot)|
    :Truy vấn khung giờ liền kề của xe;
    if (Khung giờ xin thêm có người khác đặt trước?) then (Không có ai đặt)
        :Tự động gia hạn: endTime mới = endTime + thêm giờ;
        :Cập nhật bản ghi Booking và Trip;
        :Trả về kết quả gia hạn thành công;
        
        |Chủ Đồng Sở Hữu (CO_OWNER)|
        :Nhận thông báo gia hạn thành công;
        :Tiếp tục hành trình an tâm;
    else (Có người khác đã đặt)
        :Tạo yêu cầu đàm phán TripExtensionRequest\\n(trạng thái PENDING_CONSENT);
        :Gửi thông báo đến thành viên bị ảnh hưởng;
        
        |Thành Viên Bị Ảnh Hưởng|
        :Xem xét đề nghị đàm phán đổi giờ;
        if (Đồng ý nhường giờ?) then (Đồng ý)
            :Bấm "Chấp Thuận Đổi Giờ";
            |Hệ Thống Backend (Spring Boot)|
            :Cập nhật lại lịch hai bên;
        else (Từ chối)
            :Bấm "Từ Chối";
            |Hệ Thống Backend (Spring Boot)|
            :Bác bỏ yêu cầu gia hạn;
            |Chủ Đồng Sở Hữu (CO_OWNER)|
            :Nhận thông báo: Phải trả xe đúng giờ;
        endif
    endif
else (Không)
    :Tiếp tục hành trình theo lịch;
endif
stop
@enduml
""",

    "act_05_return_and_post_inspection.puml": f"""@startuml
title QUY TRÌNH TRẢ XE, ĐỐI SOÁT VÀ GHI NHẬN HƯ HỎNG 3D (ACT-05)
{SKIN_HEADER}

|Chủ Đồng Sở Hữu (CO_OWNER)|
start
:Đưa xe về trạm sạc / bãi đỗ tập trung;
:Xem đồng hồ ODO và % Pin lúc đỗ xe;
:Mở giao diện chuyến đi, bấm "Yêu Cầu Trả Xe";
:Nhập ODO và % Pin kết thúc;

|Hệ Thống Backend (Spring Boot)|
:Ghi nhận returnRequestedAt = now();
:Chuyển trạng thái Trip sang RETURN_REQUESTED;
:Thông báo cho Nhân viên trực trạm;

|Nhân Viên Điều Hành (STAFF)|
:Mở StaffReturnInspectionModal;
:Kiểm tra đối chiếu ODO và Pin thực tế;
:Thực hiện Checklist kỹ thuật (Lốp, Phanh, Kính, Đèn);
if (Phát hiện vết trầy xước / va đập mới?) then (Có hư hại)
    :Nhấp trực tiếp lên vị trí tương ứng trên mô hình 3D;
    :Lưu DamageRecord kèm tọa độ không gian (x, y, z);
    :Điểm Hotspot phát sáng nhấp nháy màu đỏ;
else (Không có hư hại)
    :Đánh dấu Checklist hoàn hảo;
endif
:Bấm "Xác Nhận Hoàn Tất Trả Xe";

|Hệ Thống Backend (Spring Boot)|
:Cập nhật Trip status = COMPLETED;
:Cập nhật trạng thái xe = AVAILABLE;
:Gọi VehicleEnergyInventoryService.recordTripConsumption;
:Trừ số kWh điện tiêu thụ trong kho pin;
:Tính tiền điện chuyến đi (kWh x WAC);
:Tạo khoản chi Expense (loại CHARGING, USER_RESPONSIBILITY);
:Gán 100% nghĩa vụ tiền điện cho người lái;

|Chủ Đồng Sở Hữu (CO_OWNER)|
:Nhận biên bản nghiệm thu và thông báo nợ tiền điện;
stop
@enduml
""",

    "act_06_charging_energy_inventory.puml": f"""@startuml
title QUY TRÌNH NẠP SẠC VÀ CẬP NHẬT TỒN KHO NĂNG LƯỢNG WAC (ACT-06)
{SKIN_HEADER}

|Người Dùng (CoOwner / Staff)|
start
:Cắm súng sạc thông minh vào cổng nạp của xe;
:Mở panel ChargingPanel trên giao diện 3D;
:Chọn trụ sạc và bấm "Bắt Đầu Sạc";

|Hệ Thống Backend (Spring Boot)|
:Tạo bản ghi ChargingSession (status = CHARGING);
:Chuyển trạng thái xe sang CHARGING;
:Chuyển trạng thái trụ sạc sang OCCUPIED;

|Tiến Trình Sạc Tự Động|
:Mô phỏng dòng sạc theo đường cong CC/CV;
:Tăng dần % Pin (SOC) và kWh điện nạp;

|Người Dùng (CoOwner / Staff)|
:Bấm nút "Dừng & Hoàn Tất Phiên Sạc";

|Hệ Thống Backend (Spring Boot)|
:Kiểm tra Idempotency chống ghi trùng lặp;
:Lấy điện năng thực nạp: deliveredEnergy;
:Tính điện lưu kho thực tế: storedEnergy = deliveredEnergy x 0.90;
:Tính tổn hao truyền dẫn: energyLoss = deliveredEnergy x 0.10;
:Lấy biểu giá điện trụ sạc: tariff;
:Tính giá trị điện nạp mới: addedValue = storedEnergy x tariff;
:Cập nhật tồn kho năng lượng (WAC):\\nnewEnergy = prevEnergy + storedEnergy\\nnewValue = prevValue + addedValue\\nnewAvgCost = newValue / newEnergy;
:Lưu bản ghi VehicleEnergyTransaction (CHARGING_INFLOW);
:Cập nhật trạng thái xe về AVAILABLE;
:Chuyển trạng thái trụ sạc về AVAILABLE;
stop
@enduml
""",

    "act_07_expense_allocation_payment.puml": f"""@startuml
title QUY TRÌNH PHÂN BỔ CHI PHÍ VÀ THANH TOÁN DEMO (ACT-07)
{SKIN_HEADER}

|Nhân Viên / Admin|
start
:Khởi tạo khoản chi phí phương tiện (Bảo dưỡng / Tiền điện);
:Phê duyệt khoản chi (Approve Expense);

|Hệ Thống Backend (Spring Boot)|
if (Chính sách phân bổ là gì?) then (USER_RESPONSIBILITY)
    :Gán 100% số tiền hóa đơn cho người lái chuyến đi;
    :Tạo 1 bản ghi ExpenseShare;
else (OWNERSHIP_RATIO)
    :Sắp xếp thành viên theo % sở hữu giảm dần;
    :Tính toán chia tiền theo tỷ lệ và lấy phần nguyên sàn;
    :Tính phần dư lẻ do làm tròn: remainder = total - sum;
    :Phân phối từng đồng lẻ phần dư theo thuật toán Hare-Niemeyer;
    :Tạo danh sách ExpenseShare cho toàn bộ thành viên nhóm;
endif

|Chủ Đồng Sở Hữu (CO_OWNER)|
:Nhận thông báo nợ chi phí trên giao diện 3D;
:Mở modal thanh toán cá nhân;
:Chuyển khoản mô phỏng theo số tài khoản hiển thị;
:Nhập mã tham chiếu giao dịch và bấm "Nộp Thanh Toán";

|Hệ Thống Backend (Spring Boot)|
:Lưu PersonalExpensePayment (status = PAYMENT_SUBMITTED);
:Khoản nợ vẫn ở trạng thái ALLOCATED (chưa tất toán);
:Gửi thông báo chờ đối soát đến Nhân viên;

|Nhân Viên Điều Hành (STAFF)|
:Mở StaffPaymentVerificationModal;
:Kiểm tra biến động số dư tài khoản thực tế;
if (Đã nhận đủ tiền?) then (Đủ tiền)
    :Bấm "Xác Nhận Phê Duyệt";
    |Hệ Thống Backend (Spring Boot)|
    :Cập nhật Payment status = PAYMENT_VERIFIED;
    :Cập nhật ExpenseShare status = SETTLED (Đã tất toán);
    |Chủ Đồng Sở Hữu (CO_OWNER)|
    :Nhận biên lai xác nhận: Hết nợ;
else (Sai lệch / Thiếu)
    |Nhân Viên Điều Hành (STAFF)|
    :Bấm "Từ Chối";
    |Hệ Thống Backend (Spring Boot)|
    :Cập nhật Payment status = REJECTED;
    |Chủ Đồng Sở Hữu (CO_OWNER)|
    :Nhận thông báo từ chối thanh toán;
endif
stop
@enduml
""",

    "act_08_ownership_transfer.puml": f"""@startuml
title QUY TRÌNH CHUYỂN NHƯỢNG TỶ LỆ SỞ HỮU PHƯƠNG TIỆN (ACT-08)
{SKIN_HEADER}

|Bên Chuyển Nhượng (CO_OWNER)|
start
:Mở TransferModal trong nhóm đồng sở hữu;
:Chọn thành viên nhận và nhập % cổ phần chuyển;
:Bấm "Gửi Yêu Cầu Chuyển Nhượng";

|Hệ Thống Backend (Spring Boot)|
:Kiểm tra: % chuyển nhượng <= % đang sở hữu?;
if (Hợp lệ?) then (Hợp lệ)
    :Tạo OwnershipTransferRequest (PENDING_CONSENT);
    :Gửi thông báo đến Bên Nhận và Trưởng nhóm;
else (Vượt quá số sở hữu)
    :Báo lỗi: Số cổ phần không đủ để chuyển;
    stop
endif

|Bên Nhận Cổ Phần|
:Nhận thông báo đề nghị chuyển nhượng;
:Mở bảng xem xét thỏa thuận vốn góp;
if (Đồng ý nhận?) then (Đồng ý)
    :Bấm "Chấp Thuận Nhận Cổ Phần";
    
    |Trưởng Nhóm (LEADER)|
    :Xem xét và ký xác nhận phê duyệt giao dịch;
    
    |Hệ Thống Backend (Spring Boot)|
    :Thực thi giao dịch nguyên tử (@Transactional):;
    :Trừ cổ phần của Bên Chuyển Nhượng;
    :Cộng cổ phần cho Bên Nhận;
    :Kiểm tra bất biến: Tổng cổ phần nhóm = 100.0000%?;
    :Ghi nhật ký lịch sử vào OwnershipChangeHistory;
    :Sinh phiên bản hợp đồng mới (DRAFT);
    
    |Các Bên Liên Quan|
    :Nhận thông báo hoàn tất chuyển nhượng;
else (Từ chối)
    :Bấm "Từ Chối Nhận";
    |Hệ Thống Backend (Spring Boot)|
    :Hủy yêu cầu chuyển nhượng;
endif
stop
@enduml
""",

    "act_09_member_invitation_contract.puml": f"""@startuml
title QUY TRÌNH MỜI THÀNH VIÊN MỚI VÀ KÝ KẾT HỢP ĐỒNG (ACT-09)
{SKIN_HEADER}

|Trưởng Nhóm (LEADER)|
start
:Mở panel quản lý nhóm;
:Nhập Email người nhận và % cổ phần dự kiến chuyển giao;
:Bấm "Gửi Lời Mời Gia Nhập";

|Hệ Thống Backend (Spring Boot)|
:Tạo MembershipInvitation kèm hạn chót 7 ngày;
:Gửi thư mời điện tử kèm đường dẫn xác nhận;

|Người Được Mời (Invitee)|
:Nhận thư mời, đăng nhập vào EVShare 3D;
:Xem bảng minh họa quyền lợi và nghĩa vụ tài chính;
if (Đồng ý tham gia?) then (Đồng ý)
    :Bấm "Chấp Thuận Gia Nhập";
    
    |Hệ Thống Backend (Spring Boot)|
    :Tự động thêm thành viên mới vào GroupMember;
    :Sinh phiên bản hợp đồng mới CoOwnershipContractVersion (DRAFT);
    :Thông báo cho toàn bộ thành viên nhóm vào ký số;
    
    |Toàn Bộ Thành Viên Nhóm|
    :Đọc điều khoản hợp đồng trên CoOwnerContractPanel;
    :Bấm "Ký Xác Nhận Hợp Đồng (DEMO Signature)";
    
    |Hệ Thống Backend (Spring Boot)|
    :Lưu bản ghi chấp thuận ContractAcceptance;
    if (Đủ 100% chữ ký thành viên?) then (Đủ 100%)
        :Chuyển trạng thái hợp đồng mới sang ACTIVE;
        :Đánh dấu hợp đồng cũ sang SUPERSEDED;
        :Cấp quyền truy cập đầy đủ vào Virtual Garage 3D;
    else (Chưa đủ chữ ký)
        :Duy trì trạng thái PENDING_SIGNATURES;
    endif
else (Từ chối)
    :Bấm "Từ Chối";
    |Hệ Thống Backend (Spring Boot)|
    :Hủy bỏ lời mời;
endif
stop
@enduml
""",

    "act_10_voting_democracy.puml": f"""@startuml
title QUY TRÌNH BIỂU QUYẾT TẬP THỂ VÀ THỰC THI NGHỊ QUYẾT (ACT-10)
{SKIN_HEADER}

|Thành Viên (CO_OWNER)|
start
:Mở panel CoOwnerVotingPanel;
:Tạo đề xuất mới (Bảo dưỡng, Sửa chữa, Mua bảo hiểm);
:Thiết lập thời hạn bình chọn và phương thức biểu quyết;
:Bấm "Phát Động Biểu Quyết";

|Hệ Thống Backend (Spring Boot)|
:Lưu VoteProposal (status = OPEN);
:Gửi thông báo đến toàn bộ đồng sở hữu trong nhóm;

|Các Thành Viên Nhóm|
:Mở danh sách đề xuất đang mở;
:Bấm chọn Bỏ phiếu (FOR - Đồng ý, AGAINST - Phản đối);

|Hệ Thống Backend (Spring Boot)|
:Kiểm tra: Thành viên đã bỏ phiếu cho đề xuất này chưa?;
if (Chưa bỏ phiếu) then (Hợp lệ)
    :Lưu ProposalVote kèm trọng số = % sở hữu của thành viên;
else (Đã bỏ phiếu rồi)
    :Từ chối: Mỗi thành viên chỉ bỏ phiếu 1 lần;
endif

|Hệ Thống Tự Động (Scheduler)|
:Kiểm tra khi hết thời hạn biểu quyết;
:Tổng hợp tổng trọng số phiếu FOR và AGAINST;
if (Tỷ lệ phiếu FOR > 50.00%?) then (Thông qua)
    :Cập nhật đề xuất status = APPROVED;
    :Tự động tạo lệnh công việc tương ứng cho Staff;
    :Thông báo kết quả: Đề xuất đã được duyệt;
else (Không đủ quá bán)
    :Cập nhật đề xuất status = REJECTED;
    :Thông báo kết quả: Đề xuất bị bác bỏ;
endif
stop
@enduml
""",

    "act_11_dispute_mediation.puml": f"""@startuml
title QUY TRÌNH KHIẾU NẠI, HÒA GIẢI VÀ BỒI THƯỜNG SỰ CỐ (ACT-11)
{SKIN_HEADER}

|Người Khiếu Nại (CO_OWNER)|
start
:Phát hiện sai lệch hóa đơn hoặc hư hỏng tranh chấp;
:Mở CoOwnerDisputePanel, bấm "Mở Khiếu Nại";
:Nhập mô tả sự việc, chọn người liên quan;
:Tải lên tệp ảnh hiện trường / hóa đơn chứng từ;
:Bấm "Gửi Hồ Sơ Khiếu Nại";

|Hệ Thống Backend (Spring Boot)|
:Lưu bản ghi Dispute (status = OPEN);
:Lưu các tệp đính kèm vào DisputeEvidence;
:Thông báo cho Nhân viên điều hành và Bên bị khiếu nại;

|Nhân Viên Điều Hành (STAFF)|
:Mở StaffDisputeDashboardModal;
:Đối chiếu nhật ký hành trình ODO, pin và biên bản bàn giao;
:Liên hệ phỏng vấn các bên liên quan;
:Ghi nhận biên bản kết luận điều tra;
if (Cần bồi hoàn thiệt hại?) then (Có bồi thường)
    :Xác định số tiền bồi hoàn và bên chịu trách nhiệm;
    :Thực thi lệnh bồi thường mô phỏng (DEMO Compensation);
    |Hệ Thống Backend (Spring Boot)|
    :Tạo giao dịch cấn trừ nợ DisputeCompensation;
endif

|Nhân Viên Điều Hành (STAFF)|
:Chuyển trạng thái hồ sơ sang RESOLVED;

|Các Bên Tranh Chấp|
:Nhận thông báo kết quả hòa giải và biên bản đóng hồ sơ;
stop
@enduml
""",

    "act_12_gantt_roadmap.puml": f"""@startuml
title TIẾN TRÌNH THỰC HIỆN ĐỀ TÀI EVSHARE 3D (ROADMAP HOẠT ĐỘNG)
{SKIN_HEADER}

start
partition "Giai đoạn 1: Khảo sát & Thiết kế CSDL (Tuần 1 - 4)" {{
    :Khảo sát mô hình kinh tế đồng sở hữu xe điện;
    :Xác định 3 tác nhân: ADMIN, STAFF, CO_OWNER;
    :Thiết kế lược đồ ERD chuẩn 3NF;
    :Viết 46 bản di chuyển Flyway Migrations;
}}

partition "Giai đoạn 2: Phát triển Backend Cốt Lõi (Tuần 5 - 8)" {{
    :Cấu hình Spring Security 6 & chuỗi lọc JWT;
    :Hiện thực hóa phân hệ Xe, Người dùng & Đặt lịch;
    :Xây dựng thuật toán khử xung đột lịch đặt;
    :Hiện thực hóa chu trình bàn giao & kiểm định kỹ thuật;
}}

partition "Giai đoạn 3: Frontend 3D & Động Cơ Tài Chính (Tuần 9 - 12)" {{
    :Xây dựng Virtual Garage 3D trên Three.js & R3F;
    :Nạp mô hình Digital Twin GLB, bóc tách phụ tùng, X-Ray Pin;
    :Hiện thực hóa động cơ tồn kho WAC & tổn hao sạc 10%;
    :Hiện thực hóa thuật toán phân chia chi phí Hare-Niemeyer;
}}

partition "Giai đoạn 4: Tích hợp, Kiểm thử & Đóng gói (Tuần 13 - 16)" {{
    :Tích hợp Biểu quyết, Hợp đồng số & Khiếu nại;
    :Thiết kế 100 ca kiểm thử chức năng & phi chức năng;
    :Tối ưu hóa bộ nhớ GPU WebGL, dọn dẹp Geometry/Material;
    :Biên soạn và hoàn thiện Báo cáo Thực tập Tốt nghiệp;
}}

stop
@enduml
"""
}

for name, content in act_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 3 (Activity) completed.")
