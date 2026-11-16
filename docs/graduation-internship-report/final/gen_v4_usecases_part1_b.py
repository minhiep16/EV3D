# -*- coding: utf-8 -*-
"""
gen_v4_usecases_part1_b.py - Tạo các Use Case OWN (11), CON (5), BOOK (4), TRIP (11) cho Part 1.
"""

UCS_OWN_CON_BOOK_TRIP = [
    # =========================================================================
    # 3. CO-OWNERSHIP MANAGEMENT & EQUITY (11 UCs)
    # =========================================================================
    {
        "id": "UC-OWN-01",
        "name": "Xem thông tin nhóm đồng sở hữu xe",
        "primary_actor": "Đồng sở hữu, Nhân viên, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL và Nhóm sở hữu",
        "description": "Người dùng tra cứu thông tin tổng thể về nhóm đồng sở hữu của phương tiện xe điện bao gồm tên nhóm, ngày thành lập, quy chế hoạt động, danh sách thành viên và xe sở hữu.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấp vào tab 'Nhóm đồng sở hữu' trên bảng điều khiển xe.",
        "preconditions": "Người dùng đăng nhập và thuộc nhóm sở hữu hoặc có quyền STAFF/ADMIN.",
        "postconditions": "Thông tin nhóm được hiển thị đầy đủ trên màn hình `CoOwnershipManagementPanel.tsx`.",
        "main_flow": (
            "1. Người dùng mở tab 'Nhóm sở hữu' tại trang chi tiết xe `/co-ownership/groups/{groupId}`.\n"
            "2. Giao diện gửi HTTP GET tới `/api/co-ownership-groups/{groupId}` kèm Bearer Token.\n"
            "3. Controller `CoOwnershipController:getGroupById()` tiếp nhận request.\n"
            "4. `CoOwnershipService` kiểm tra quyền truy cập: người dùng phải là thành viên trong nhóm hoặc có quyền STAFF/ADMIN.\n"
            "5. Service truy vấn bảng `co_ownership_groups`, kết nối dữ liệu từ `vehicles` và đếm số lượng thành viên từ `co_ownership_members`.\n"
            "6. Dữ liệu được đóng gói vào `CoOwnershipGroupResponse`.\n"
            "7. Máy chủ trả về HTTP 200 OK kèm thông tin nhóm.\n"
            "8. Giao diện hiển thị: Tên nhóm, Xe gán kèm (Biển số, Model), Trưởng nhóm đại diện, Tổng số thành viên và Bản quy chế đính kèm."
        ),
        "alt_flow": (
            "Tại bước 4, nếu người dùng không thuộc nhóm và không phải ADMIN/STAFF: Hệ thống trả về HTTP 403 Forbidden kèm thông báo 'Bạn không có quyền xem thông tin nhóm đồng sở hữu này'."
        ),
        "exception_flow": (
            "Tại bước 5, nếu groupId không tồn tại: Hệ thống trả về HTTP 404 Not Found kèm thông báo 'Nhóm đồng sở hữu không tồn tại trong hệ thống'."
        ),
        "business_rules": "BR-CO-01, BR-CO-02",
        "related_fr": "FR-CO-01",
        "related_tc": "TC-CO-01"
    },
    {
        "id": "UC-OWN-02",
        "name": "Xem cơ cấu tỷ lệ phần trăm sở hữu vốn",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Hiển thị biểu đồ tròn phân bổ tỷ lệ phần trăm cổ phần của từng thành viên trong xe, chứng minh tính bất biến tổng luôn bằng 100.0000%.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng mở tab 'Cổ phần & Vốn góp' trong giao diện quản lý nhóm.",
        "preconditions": "Người dùng thuộc nhóm đồng sở hữu phương tiện.",
        "postconditions": "Biểu đồ tròn Recharts hiển thị cơ cấu cổ phần của toàn bộ các đồng sở hữu.",
        "main_flow": (
            "1. Người dùng mở tab 'Cổ phần' trong `CoOwnershipManagementPanel.tsx`.\n"
            "2. Frontend gửi HTTP GET tới `/api/co-ownership-groups/{groupId}/vehicles/{vehicleId}/ownership-shares`.\n"
            "3. `CoOwnershipController:getOwnershipShares()` tiếp nhận yêu cầu.\n"
            "4. `CoOwnershipService` truy vấn bảng `ownership_shares` lọc theo `vehicle_id`.\n"
            "5. Hệ thống tính tổng kiểm tra `sum(percentage)` bảo đảm đạt đúng 100.0000%.\n"
            "6. Danh sách thành viên, số lượng cổ phần, tỷ lệ % và giá trị vốn góp tương ứng được trả về trong danh sách DTO.\n"
            "7. Máy chủ trả về HTTP 200 OK.\n"
            "8. Frontend kết xuất biểu đồ tròn Donut Chart (Recharts) trực quan với màu sắc riêng cho từng thành viên kèm bảng chú giải chi tiết."
        ),
        "alt_flow": (
            "Tại bước 5, nếu phát hiện tổng tỷ lệ lệch 100% (do lỗi làm tròn dữ liệu cũ): Hệ thống tự động ghi nhật ký cảnh báo và kích hoạt quy tắc cân bằng vốn."
        ),
        "exception_flow": (
            "Tại bước 4, nếu phương tiện chưa được phân bổ cổ phần ban đầu: Hệ thống trả về HTTP 200 kèm danh sách rỗng và gợi ý 'Phương tiện chưa được thiết lập cơ cấu cổ phần'."
        ),
        "business_rules": "BR-CO-01",
        "related_fr": "FR-CO-04",
        "related_tc": "TC-CO-02"
    },
    {
        "id": "UC-OWN-03",
        "name": "Khởi tạo và thực thi chuyển nhượng cổ phần đồng sở hữu",
        "primary_actor": "Đồng sở hữu chuyển nhượng (Transferor)",
        "secondary_actor": "Bên nhận chuyển nhượng, Hệ thống CSDL",
        "description": "Thành viên đề xuất chuyển nhượng một phần hoặc toàn bộ tỷ lệ sở hữu của mình cho thành viên khác trong nhóm kèm mức giá thỏa thuận.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Chuyển nhượng cổ phần' tại bảng danh sách cổ đông.",
        "preconditions": "Bên chuyển nhượng nắm giữ số cổ phần >= số chuyển nhượng; không có khoản nợ chi phí tồn đọng (unpaid balance = 0).",
        "postconditions": "Tạo bản ghi `OwnershipTransferRequest` ở trạng thái PENDING, gửi thông báo đẩy tới bên nhận.",
        "main_flow": (
            "1. Người dùng mở hộp thoại `CreateTransferRequestModal.tsx`.\n"
            "2. Chọn bên nhận chuyển nhượng từ danh sách thành viên trong nhóm, nhập tỷ lệ chuyển nhượng (ví dụ 10.00%) và giá trị giao dịch (VND).\n"
            "3. Người dùng nhấn 'Tạo yêu cầu chuyển nhượng'.\n"
            "4. Frontend gửi HTTP POST tới `/api/groups/{groupId}/transfers` kèm payload `CreateTransferRequest`.\n"
            "5. Controller `OwnershipTransferController:createTransferRequest()` tiếp nhận.\n"
            "6. `OwnershipTransferService` kiểm tra số dư nợ của bên chuyển qua `ExpenseShareRepository.existsByMemberIdAndStatus(id, UNPAID)`.\n"
            "7. Kiểm tra tỷ lệ sở hữu hiện có trong `ownership_shares`: bảo đảm percentage >= transferPercentage.\n"
            "8. Tạo bản ghi trong `ownership_transfer_requests` với trạng thái `PENDING`, ghi nhận transferor_id, transferee_id, transfer_percentage, price.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm mã yêu cầu chuyển nhượng `transferId`.\n"
            "10. Hệ thống gửi thông báo WebSocket / Push Notification tới bên nhận chuyển nhượng để chờ chấp thuận."
        ),
        "alt_flow": (
            "Tại bước 6, nếu bên chuyển nhượng còn nợ chi phí chưa thanh toán: Hệ thống từ chối yêu cầu, trả về HTTP 400 Bad Request kèm thông báo 'Bạn phải tất toán toàn bộ các khoản nợ chi phí cá nhân trước khi thực hiện chuyển nhượng cổ phần'."
        ),
        "exception_flow": (
            "Tại bước 7, nếu tỷ lệ muốn chuyển nhượng vượt quá tỷ lệ cổ phần thực tế đang nắm giữ: Hệ thống ném `InvalidTransferAmountException`, trả về HTTP 400 Bad Request kèm thông báo lỗi."
        ),
        "business_rules": "BR-CO-01, BR-CO-04, BR-CO-05",
        "related_fr": "FR-CO-05",
        "related_tc": "TC-CO-03"
    },
    {
        "id": "UC-OWN-04",
        "name": "Bên nhận chấp thuận hoặc từ chối chuyển nhượng",
        "primary_actor": "Bên nhận chuyển nhượng (Transferee)",
        "secondary_actor": "Bên chuyển nhượng, Hệ thống CSDL",
        "description": "Bên nhận xem xét các điều khoản chuyển nhượng, giá trị thanh toán và tỷ lệ cổ phần, sau đó đưa ra quyết định chấp thuận hoặc từ chối giao dịch.",
        "priority": "Cao (High)",
        "trigger": "Bên nhận nhấp vào thông báo chuyển nhượng hoặc mở tab 'Yêu cầu gửi đến tôi'.",
        "preconditions": "Yêu cầu chuyển nhượng đang ở trạng thái PENDING; bên nhận là người được chỉ định trong yêu cầu.",
        "postconditions": "Cập nhật trạng thái yêu cầu sang ACCEPTED (nếu đồng ý) hoặc REJECTED (nếu từ chối).",
        "main_flow": (
            "1. Bên nhận mở giao diện `IncomingTransfersPanel.tsx` xem chi tiết yêu cầu.\n"
            "2. Hệ thống hiển thị: Người chuyển, Tỷ lệ nhận (% cổ phần), Giá trị cần thanh toán, Điều kiện đi kèm.\n"
            "3. Người dùng chọn 'Chấp thuận' (hoặc 'Từ chối').\n"
            "4. Nếu chấp thuận, Frontend gửi HTTP POST tới `/api/ownership-transfers/{transferId}/accept`.\n"
            "5. Controller `OwnershipTransferController:acceptTransfer()` tiếp nhận.\n"
            "6. `OwnershipTransferService` kiểm tra người thực hiện request chính là `transferee_id`.\n"
            "7. Cập nhật trường `transferee_accepted = true`, trạng thái chuyển sang `ACCEPTED`.\n"
            "8. Máy chủ trả về HTTP 200 OK kèm thông báo xác nhận.\n"
            "9. Hệ thống gửi thông báo tới bên chuyển nhượng để tiến hành bước ký kết chữ ký điện tử đồng thuận."
        ),
        "alt_flow": (
            "Tại bước 3, nếu người dùng chọn 'Từ chối': Frontend gửi HTTP POST tới `/api/ownership-transfers/{transferId}/reject` kèm lý do từ chối. Trạng thái chuyển thành `REJECTED`, yêu cầu kết thúc và giải phóng khóa cổ phần."
        ),
        "exception_flow": (
            "Tại bước 6, nếu người nhấn duyệt không phải là bên nhận chỉ định: Hệ thống ném `AccessDeniedException`, trả về HTTP 403 Forbidden."
        ),
        "business_rules": "BR-CO-05",
        "related_fr": "FR-CO-06",
        "related_tc": "TC-CO-04"
    },
    {
        "id": "UC-OWN-05",
        "name": "Trưởng nhóm phê duyệt chuyển nhượng cổ phần",
        "primary_actor": "Trưởng nhóm đồng sở hữu / Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Trong các trường hợp quy chế nhóm yêu cầu, Trưởng nhóm tiến hành xem xét tính hợp lệ của giao dịch chuyển nhượng giữa các thành viên trước khi tiến hành tất toán chính thức.",
        "priority": "Trung bình (Medium)",
        "trigger": "Trưởng nhóm nhận thông báo yêu cầu chuyển nhượng đã được hai bên đồng thuận.",
        "preconditions": "Yêu cầu chuyển nhượng ở trạng thái ACCEPTED bởi bên nhận; người duyệt có vai trò GROUP_LEADER hoặc ADMIN.",
        "postconditions": "Yêu cầu chuyển nhượng được xác nhận đủ điều kiện pháp lý để tất toán CSDL.",
        "main_flow": (
            "1. Trưởng nhóm mở trang phê duyệt chuyển nhượng `/co-ownership/groups/{groupId}/transfers/pending`.\n"
            "2. Hệ thống liệt kê các yêu cầu đã có sự đồng thuận của bên bán và bên mua.\n"
            "3. Trưởng nhóm kiểm tra thông tin đối chiếu với quy chế nhóm.\n"
            "4. Trưởng nhóm nhấn nút 'Phê duyệt chuyển nhượng'.\n"
            "5. Frontend gửi HTTP POST tới `/api/ownership-transfers/{transferId}/leader-approve`.\n"
            "6. Service kiểm tra quyền trưởng nhóm trong bảng `co_ownership_members`.\n"
            "7. Đánh dấu `leader_approved = true` và chuyển giao diện sang bước hoàn tất thủ tục phụ lục."
        ),
        "alt_flow": (
            "Tại bước 3, nếu phát hiện vi phạm quy chế nhóm (ví dụ vượt giới hạn số cổ phần tối đa của một cá nhân): Trưởng nhóm chọn 'Bác bỏ' kèm văn bản giải trình lý do."
        ),
        "exception_flow": (
            "Tại bước 6, nếu người thực hiện không phải trưởng nhóm: Hệ thống trả về HTTP 403 Forbidden kèm thông báo 'Chỉ trưởng nhóm hoặc quản trị viên mới có thẩm quyền duyệt giao dịch này'."
        ),
        "business_rules": "BR-CO-02, BR-CO-05",
        "related_fr": "FR-CO-05",
        "related_tc": "TC-CO-05"
    },
    {
        "id": "UC-OWN-06",
        "name": "Tất toán chuyển nhượng và bảo toàn bất biến vốn 100%",
        "primary_actor": "Hệ thống kế toán tự động / Quản trị viên",
        "secondary_actor": "CSDL MySQL (Giao dịch ACID)",
        "description": "Hệ thống thực thi điều chỉnh tỷ lệ sở hữu giữa bên chuyển và bên nhận trong một giao dịch cơ sở dữ liệu có tính cô lập cao (ACID Transaction), bảo đảm tuyệt đối tổng cổ phần bằng 100.0000%.",
        "priority": "Bắt buộc (High)",
        "trigger": "Hai bên hoàn tất nghĩa vụ tài chính và ký kết chữ ký điện tử chuyển nhượng.",
        "preconditions": "Hai bên đã ký đồng thuận, thanh toán xác nhận hoàn tất.",
        "postconditions": "Tỷ lệ cổ phần bên bán giảm, bên mua tăng; ghi nhật ký biến động sở hữu; sinh phiên bản hợp đồng mới.",
        "main_flow": (
            "1. Người dùng hoặc quản trị viên nhấn 'Hoàn tất giao dịch' trên màn hình chuyển nhượng.\n"
            "2. Frontend gửi HTTP POST tới `/api/ownership-transfers/{transferId}/complete`.\n"
            "3. Controller chuyển tới phương thức `@Transactional(isolation = Isolation.SERIALIZABLE)` trong `OwnershipTransferService`.\n"
            "4. Hệ thống khóa ghi các bản ghi `ownership_shares` của hai bên để chống Race Condition.\n"
            "5. Khấu trừ tỷ lệ sở hữu của bên chuyển: `transferor_share.percentage -= transfer_percentage`.\n"
            "6. Cộng tỷ lệ sở hữu cho bên nhận: `transferee_share.percentage += transfer_percentage`.\n"
            "7. Kiểm tra bất biến số học nghiêm ngặt: `SELECT SUM(percentage) FROM ownership_shares WHERE vehicle_id = ?`.\n"
            "8. Nếu tổng bằng đúng 100.0000%: Tiếp tục commit giao dịch; nếu sai lệch dù 0.0001% hệ thống ném ngoại lệ và Rollback toàn bộ.\n"
            "9. Ghi bản ghi biến động lịch sử vào bảng `ownership_change_history` lưu rõ người chuyển, người nhận, tỷ lệ và thời điểm.\n"
            "10. Kích hoạt `CoOwnershipContractService:createAppendixVersion()` tạo phiên bản phụ lục hợp đồng pháp lý mới.\n"
            "11. Cập nhật `ownership_transfer_requests.status = COMPLETED` và trả về HTTP 200 OK."
        ),
        "alt_flow": (
            "Tại bước 5, nếu bên chuyển nhượng nhượng hết 100% cổ phần đang có: Tỷ lệ về 0%, hệ thống chuyển trạng thái thành viên sang INACTIVE trong nhóm."
        ),
        "exception_flow": (
            "Tại bước 8, nếu tổng tỷ lệ sau tính toán khác 100.0000%: Hệ thống kích hoạt Rollback toàn bộ giao dịch, ném `EquityInvariantViolationException` và ghi log an ninh mức CRITICAL."
        ),
        "business_rules": "BR-CO-01, BR-CO-06, BR-SEC-02",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-06"
    },
    {
        "id": "UC-OWN-07",
        "name": "Xem lịch sử chuyển nhượng cổ phần",
        "primary_actor": "Đồng sở hữu, Kiểm toán viên, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Truy vấn danh sách lịch sử toàn bộ các giao dịch chuyển dịch cổ phần đã diễn ra trong nhóm từ ngày thành lập đến nay.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn tab 'Lịch sử giao dịch' trong bảng điều khiển nhóm.",
        "preconditions": "Người dùng thuộc nhóm hoặc có vai trò quản trị viên.",
        "postconditions": "Bảng dữ liệu lịch sử chuyển nhượng được hiển thị đầy đủ.",
        "main_flow": (
            "1. Người dùng mở tab 'Lịch sử cổ phần' tại `/co-ownership/groups/{groupId}/history`.\n"
            "2. Giao diện gửi HTTP GET tới `/api/groups/{groupId}/ownership-history`.\n"
            "3. Controller `OwnershipTransferController:getOwnershipHistory()` tiếp nhận.\n"
            "4. Service truy vấn bảng `ownership_change_history` sắp xếp giảm dần theo thời gian `created_at`.\n"
            "5. Dữ liệu trả về danh sách DTO gồm: Ngày giao dịch, Bên chuyển, Bên nhận, Tỷ lệ nhượng, Giá trị, Mã phụ lục hợp đồng liên kết.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng lịch sử có phân trang và hỗ trợ lọc theo tên thành viên."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp vào mã phụ lục hợp đồng để mở bản PDF chi tiết của giao dịch lịch sử đó."
        ),
        "exception_flow": (
            "Tại bước 4, nếu nhóm chưa từng phát sinh giao dịch chuyển nhượng: Hệ thống trả về danh sách rỗng kèm thông báo 'Chưa có biến động cổ phần nào được ghi nhận'."
        ),
        "business_rules": "BR-CO-01",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-07"
    },
    {
        "id": "UC-OWN-08",
        "name": "Gửi thư mời thành viên mới gia nhập nhóm",
        "primary_actor": "Trưởng nhóm đồng sở hữu / Quản trị viên",
        "secondary_actor": "Hệ thống thông báo và CSDL",
        "description": "Gửi lời mời tham gia nhóm đồng sở hữu xe điện tới địa chỉ email người dùng mới kèm tỷ lệ cổ phần đề xuất và thời hạn hiệu lực 72 giờ.",
        "priority": "Cao (High)",
        "trigger": "Trưởng nhóm nhấn nút 'Mời thành viên mới' tại màn hình quản lý thành viên.",
        "preconditions": "Số lượng thành viên hiện tại của nhóm < 10 người (BR-CO-02); người mời có quyền quản trị nhóm.",
        "postconditions": "Tạo bản ghi `membership_invitations` với trạng thái PENDING, sinh mã kích hoạt duy nhất, gửi email mời.",
        "main_flow": (
            "1. Trưởng nhóm mở modal `InviteMemberModal.tsx`.\n"
            "2. Nhập địa chỉ email người được mời, tỷ lệ cổ phần dự kiến chuyển nhượng và lời nhắn.\n"
            "3. Người dùng nhấn 'Gửi lời mời'. Frontend gửi HTTP POST tới `/api/onboarding/invitations`.\n"
            "4. Controller `OnboardingController:createInvitation()` tiếp nhận.\n"
            "5. `MembershipInvitationService` kiểm tra số lượng thành viên trong nhóm: nếu >= 10 ném ngoại lệ `GroupFullException`.\n"
            "6. Kiểm tra email chưa có lời mời nào đang chờ duyệt trong cùng nhóm.\n"
            "7. Tạo bản ghi trong `membership_invitations`: sinh chuỗi ngẫu nhiên bí mật `invitation_code`, xác lập `expires_at = NOW() + 72 hours`, trạng thái `PENDING`.\n"
            "8. Dịch vụ gửi email thông báo kích hoạt kèm liên kết tham gia `/join?code={invitation_code}`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm chi tiết lời mời.\n"
            "10. Giao diện hiển thị thông báo 'Đã gửi lời mời thành công. Thư mời có hiệu lực trong 72 giờ'."
        ),
        "alt_flow": (
            "Tại bước 5, nếu nhóm đã đủ 10 thành viên: Hệ thống chặn lại và cảnh báo 'Nhóm đã đạt số lượng tối đa 10 đồng sở hữu theo quy chế'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu email người dùng đang có lời mời chưa hết hạn: Hệ thống trả về HTTP 409 Conflict kèm thông báo 'Người dùng này đang có một lời mời chưa xử lý'."
        ),
        "business_rules": "BR-CO-02, BR-CO-03",
        "related_fr": "FR-CO-02",
        "related_tc": "TC-CO-08"
    },
    {
        "id": "UC-OWN-09",
        "name": "Người được mời xem xét thư mời gia nhập",
        "primary_actor": "Người dùng nhận được lời mời",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng nhấp vào liên kết trong email hoặc mở giao diện Onboarding để xem thông tin nhóm, mẫu xe, quy chế và các cổ đông hiện hữu trước khi quyết định gia nhập.",
        "priority": "Cao (High)",
        "trigger": "Người dùng truy cập liên kết kích hoạt hoặc mở trang `/my-invitations`.",
        "preconditions": "Mã lời mời hợp lệ và chưa quá hạn 72 giờ.",
        "postconditions": "Chi tiết lời mời và dự thảo hợp đồng được hiển thị minh bạch.",
        "main_flow": (
            "1. Người dùng mở trang kích hoạt `/join?code={code}`.\n"
            "2. Frontend gửi HTTP GET tới `/api/onboarding/invitations/preview?code={code}`.\n"
            "3. Controller gọi `MembershipInvitationService:previewInvitation()`.\n"
            "4. Hệ thống kiểm tra mã code và thời hạn `expires_at > NOW()`.\n"
            "5. Trả về thông tin nhóm: Tên nhóm, Xe sử dụng (Hình ảnh 3D, Model, Pin), Tỷ lệ cổ phần được phân bổ, Danh sách thành viên sáng lập.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị màn hình Onboarding chuyên nghiệp kèm nút 'Xem dự thảo hợp đồng' và 'Xác nhận tham gia'."
        ),
        "alt_flow": (
            "Tại bước 4, nếu mã lời mời đã quá hạn 72 giờ: Hệ thống hiển thị thông báo 'Lời mời này đã hết hạn hiệu lực. Vui lòng liên hệ trưởng nhóm để nhận lời mời mới'."
        ),
        "exception_flow": (
            "Tại bước 4, nếu mã code không tồn tại hoặc đã được sử dụng: Hệ thống trả về HTTP 404 Not Found kèm cảnh báo 'Mã mời không hợp lệ'."
        ),
        "business_rules": "BR-CO-03",
        "related_fr": "FR-CO-02",
        "related_tc": "TC-CO-08"
    },
    {
        "id": "UC-OWN-10",
        "name": "Cổ đông hiện hữu đồng thuận trích phần vốn góp",
        "primary_actor": "Các cổ đông hiện hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Khi kết nạp thành viên mới bằng cách trích đều cổ phần của các cổ đông hiện hữu, từng cổ đông thực hiện ký điện tử xác nhận đồng thuận nhượng lại tỷ lệ tương ứng.",
        "priority": "Trung bình (Medium)",
        "trigger": "Cổ đông nhận thông báo yêu cầu đồng thuận trích vốn cho thành viên mới.",
        "preconditions": "Có đề xuất kết nạp thành viên mới đang mở quy trình lấy ý kiến.",
        "postconditions": "Ghi nhận chữ ký đồng thuận của cổ đông vào bảng `contract_acceptances`.",
        "main_flow": (
            "1. Cổ đông mở thông báo 'Yêu cầu đồng thuận phân bổ lại cổ phần' tại `/co-ownership/invitations/{id}/consent`.\n"
            "2. Hệ thống hiển thị bảng tính: Tỷ lệ cổ phần hiện tại, Tỷ lệ trích nhượng, Tỷ lệ còn lại sau khi kết nạp.\n"
            "3. Cổ đông xem xét và nhấp nút 'Ký xác nhận đồng thuận'.\n"
            "4. Frontend gửi HTTP POST tới `/api/onboarding/invitations/{id}/consent`.\n"
            "5. `MembershipInvitationService` ghi nhận bản ghi đồng thuận của cổ đông.\n"
            "6. Kiểm tra tiến độ: nếu 100% cổ đông hiện hữu đã ký đồng thuận thì chuyển trạng thái lời mời sang READY_TO_ACTIVATE."
        ),
        "alt_flow": (
            "Tại bước 3, nếu một cổ đông chọn 'Từ chối': Quy trình phân bổ lại cổ phần bị dừng lại để nhóm mở phiên họp thảo luận lại."
        ),
        "exception_flow": (
            "Tại bước 5, nếu cổ đông đã ký đồng thuận trước đó: Hệ thống thông báo 'Bạn đã gửi xác nhận đồng thuận cho yêu cầu này'."
        ),
        "business_rules": "BR-CO-01, BR-CO-05",
        "related_fr": "FR-CO-03",
        "related_tc": "TC-CO-08"
    },
    {
        "id": "UC-OWN-11",
        "name": "Kích hoạt tư cách thành viên mới sau khi đủ điều kiện",
        "primary_actor": "Hệ thống tự động / Người được mời",
        "secondary_actor": "CSDL MySQL",
        "description": "Sau khi người được mời ký xác nhận hợp đồng và hoàn tất nghĩa vụ góp vốn ban đầu, hệ thống chính thức cấp quyền thành viên nhóm và khởi tạo tài khoản cổ phần.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Hoàn tất gia nhập' sau khi ký hợp đồng.",
        "preconditions": "Lời mời ở trạng thái ACCEPTED, đã đủ 100% điều kiện chữ ký và phê duyệt.",
        "postconditions": "Tạo bản ghi `co_ownership_members` và `ownership_shares`, cấp quyền truy cập xe trên ứng dụng.",
        "main_flow": (
            "1. Người dùng hoàn thành bước ký số tại màn hình Onboarding.\n"
            "2. Frontend gửi HTTP POST tới `/api/onboarding/invitations/{id}/sign-accept`.\n"
            "3. Controller gọi `OnboardingService:signAndAcceptInvitation()` trong giao dịch `@Transactional`.\n"
            "4. Cập nhật `membership_invitations.status = COMPLETED`.\n"
            "5. Thêm bản ghi mới vào `co_ownership_members` gán `user_id` và `group_id`.\n"
            "6. Tạo bản ghi `ownership_shares` gán tỷ lệ phần trăm sở hữu được chuyển nhượng.\n"
            "7. Cập nhật số dư cổ phần tương ứng của các thành viên trích nhượng.\n"
            "8. Kích hoạt phiên bản hợp đồng đồng sở hữu mới.\n"
            "9. Máy chủ trả về HTTP 200 OK.\n"
            "10. Giao diện chào mừng thành viên mới và tự động chuyển hướng người dùng vào màn hình điều khiển Garage 3D của chiếc xe."
        ),
        "alt_flow": (
            "Tại bước 6, nếu xảy ra lỗi xung đột phiên làm việc: Hệ thống thử lại tự động 3 lần trước khi trả về lỗi."
        ),
        "exception_flow": (
            "Tại bước 4, nếu lời mời đã bị hủy bỏ bởi trưởng nhóm: Hệ thống ném `InvitationCancelledException` và dừng quy trình kích hoạt."
        ),
        "business_rules": "BR-CO-01, BR-CO-06",
        "related_fr": "FR-CO-03",
        "related_tc": "TC-CO-08"
    },

    # =========================================================================
    # 4. SMART CONTRACTS & LEGAL APPENDICES (5 UCs)
    # =========================================================================
    {
        "id": "UC-CON-01",
        "name": "Xem hợp đồng đồng sở hữu hiện hành",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống lưu trữ tài liệu CSDL",
        "description": "Người dùng tra cứu nội dung văn bản hợp đồng đồng sở hữu phương tiện đang có hiệu lực pháp lý cao nhất của nhóm.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn vào mục 'Hợp đồng pháp lý' trong bảng cài đặt nhóm.",
        "preconditions": "Người dùng là thành viên hợp lệ của nhóm sở hữu.",
        "postconditions": "Nội dung hợp đồng được hiển thị đầy đủ qua trình xem PDF / HTML chuyên dụng.",
        "main_flow": (
            "1. Người dùng mở tab 'Hợp đồng' tại `/co-ownership/contracts`.\n"
            "2. Frontend gửi HTTP GET tới `/api/contracts/groups/{groupId}/active`.\n"
            "3. Controller `CoOwnershipContractController:getActiveContract()` tiếp nhận.\n"
            "4. Service truy vấn bảng `co_ownership_contracts` và `co_ownership_contract_versions` lọc theo trạng thái `ACTIVE`.\n"
            "5. Hệ thống trả về chi tiết phiên bản hợp đồng: Số hợp đồng, Phiên bản (ví dụ v1.2), Ngày kích hoạt, Nội dung điều khoản quy chế, Danh sách các bên ký kết.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị văn bản hợp đồng trong khung xem `ContractViewerModal.tsx` kèm dấu mộc số xác nhận hiệu lực."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp nút 'Tải bản PDF' để tải tệp hợp đồng có chữ ký số về thiết bị cá nhân."
        ),
        "exception_flow": (
            "Tại bước 4, nếu nhóm mới thành lập chưa ban hành hợp đồng chính thức: Hệ thống hiển thị thông báo 'Hợp đồng đang trong giai đoạn soạn thảo dự thảo'."
        ),
        "business_rules": "BR-CO-06",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-07"
    },
    {
        "id": "UC-CON-02",
        "name": "Xem dự thảo phiên bản hợp đồng mới",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Xem trước bản dự thảo sửa đổi bổ sung hợp đồng (Phụ lục hợp đồng) chuẩn bị ban hành sau khi có sự biến động cổ phần hoặc quy chế nhóm.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhận được thông báo yêu cầu ký kết phụ lục hợp đồng mới.",
        "preconditions": "Có bản ghi `co_ownership_contract_versions` ở trạng thái `DRAFT` liên kết với nhóm.",
        "postconditions": "Hiển thị nội dung dự thảo kèm chế độ so sánh đối chiếu (Diff View) các điều khoản thay đổi.",
        "main_flow": (
            "1. Người dùng nhấp vào thông báo 'Dự thảo phụ lục hợp đồng mới'.\n"
            "2. Frontend gửi HTTP GET tới `/api/contracts/versions/{versionId}`.\n"
            "3. Controller trả về nội dung dự thảo phiên bản mới.\n"
            "4. Giao diện kích hoạt chế độ so sánh `ContractDiffViewer.tsx`: bôi đỏ các điều khoản bị bãi bỏ và bôi xanh các điều khoản mới thêm vào.\n"
            "5. Người dùng kiểm tra bảng điều chỉnh cơ cấu tỷ lệ sở hữu mới của các thành viên.\n"
            "6. Hiển thị danh sách các thành viên đã ký và chưa ký dự thảo."
        ),
        "alt_flow": (
            "Tại bước 5, người dùng có thể gửi ý kiến phản hồi về điều khoản dự thảo nếu phát hiện sai sót số liệu."
        ),
        "exception_flow": (
            "Tại bước 2, nếu versionId không tồn tại: Hệ thống trả về HTTP 404 Not Found."
        ),
        "business_rules": "BR-CO-06",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-07"
    },
    {
        "id": "UC-CON-03",
        "name": "Ký kết hợp đồng điện tử mô phỏng (DEMO Signature)",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống xác thực chữ ký và CSDL",
        "description": "Người dùng thực hiện ký số điện tử mô phỏng (vẽ chữ ký cảm ứng hoặc nhập mã OTP xác thực) để phê chuẩn nội dung hợp đồng hoặc phụ lục chuyển nhượng.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Ký hợp đồng điện tử' tại chân trang văn bản hợp đồng.",
        "preconditions": "Người dùng đã đọc hết nội dung hợp đồng (cuộn trang xuống đáy); phiên bản hợp đồng đang ở trạng thái DRAFT chờ ký.",
        "postconditions": "Bản ghi `contract_acceptances` được tạo, lưu mã băm chữ ký và thời điểm ký số UTC.",
        "main_flow": (
            "1. Người dùng đọc văn bản hợp đồng và cuộn tới trang cuối cùng.\n"
            "2. Nút 'Ký tên xác nhận' chuyển từ trạng thái Disabled sang Active.\n"
            "3. Người dùng nhấp nút 'Ký tên xác nhận', hiển thị hộp thoại ký số `SignaturePadModal.tsx`.\n"
            "4. Người dùng vẽ chữ ký lên khung cảm ứng Canvas hoặc chọn phương thức ký nhanh bằng mã OTP SMS.\n"
            "5. Người dùng tích chọn cam kết 'Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ quy chế và điều khoản đồng sở hữu'.\n"
            "6. Nhấn nút 'Xác nhận ký số'. Frontend gửi HTTP POST tới `/api/contracts/versions/{versionId}/accept` kèm dữ liệu chữ ký số Base64.\n"
            "7. Controller `CoOwnershipContractController:acceptContractVersion()` tiếp nhận.\n"
            "8. Service ghi nhận bản ghi vào bảng `contract_acceptances`: `user_id`, `contract_version_id`, `signature_hash`, `signed_at = NOW()`.\n"
            "9. Máy chủ trả về HTTP 200 OK.\n"
            "10. Giao diện gắn con dấu 'ĐÃ KÝ ĐIỆN TỬ BỞI [TÊN NGƯỜI DÙNG]' lên trang hợp đồng."
        ),
        "alt_flow": (
            "Tại bước 4, nếu người dùng chọn ký bằng OTP: Hệ thống gửi mã OTP 6 số giả lập về giao diện để người dùng nhập xác nhận."
        ),
        "exception_flow": (
            "Tại bước 5, nếu người dùng chưa tích chọn cam kết: Hệ thống cảnh báo 'Bạn bắt buộc phải tích đồng ý với các điều khoản trước khi ký'."
        ),
        "business_rules": "BR-CO-05, BR-CO-06",
        "related_fr": "FR-CO-03",
        "related_tc": "TC-CO-08"
    },
    {
        "id": "UC-CON-04",
        "name": "Theo dõi tiến độ chữ ký các bên trong hợp đồng",
        "primary_actor": "Đồng sở hữu, Trưởng nhóm, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Theo dõi trực quan tỷ lệ % các thành viên đã hoàn thành ký kết hợp đồng (ví dụ 3/4 thành viên đã ký, 75%) để đôn đốc hoàn tất quy trình pháp lý.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng mở trang quản lý phiên bản hợp đồng.",
        "preconditions": "Hợp đồng phiên bản mới đang trong giai đoạn thu thập chữ ký.",
        "postconditions": "Hiển thị thanh tiến độ chữ ký và danh sách trạng thái từng cá nhân.",
        "main_flow": (
            "1. Người dùng mở trang chi tiết phiên bản hợp đồng `/contracts/versions/{versionId}/status`.\n"
            "2. Frontend gửi HTTP GET tới `/api/contracts/versions/{versionId}/signatures`.\n"
            "3. Controller truy vấn danh sách thành viên nhóm và đối chiếu với bảng `contract_acceptances`.\n"
            "4. Tính tỷ lệ hoàn thành: `signedCount / totalMemberCount * 100%`.\n"
            "5. Máy chủ trả về danh sách thành viên kèm thời điểm ký (nếu đã ký) hoặc trạng thái 'Chờ ký'.\n"
            "6. Giao diện hiển thị thanh tiến độ Progress Bar và hỗ trợ nút 'Gửi nhắc nhở' đối với những thành viên chưa ký."
        ),
        "alt_flow": (
            "Tại bước 6, trưởng nhóm có thể nhấn nút 'Gửi nhắc nhở' để hệ thống gửi thông báo Notification tới người chưa ký."
        ),
        "exception_flow": (
            "Tại bước 3, nếu có thành viên đã rời nhóm trong khi thu thập chữ ký: Hệ thống tự động loại trừ thành viên đó khỏi tổng số cần ký."
        ),
        "business_rules": "BR-CO-06",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-08"
    },
    {
        "id": "UC-CON-05",
        "name": "Tra cứu lịch sử các phiên bản hợp đồng",
        "primary_actor": "Đồng sở hữu, Kiểm toán viên pháp lý",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Truy xuất danh sách lưu trữ toàn bộ các phiên bản hợp đồng từ phiên bản sơ khởi v1.0 tới phiên bản hiện hành, phục vụ đối chiếu và kiểm toán khi xảy ra tranh chấp.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn tab 'Lịch sử phiên bản' trong mục Hợp đồng.",
        "preconditions": "Người dùng là thành viên của nhóm xe.",
        "postconditions": "Hiển thị danh sách các phiên bản hợp đồng kèm lý do ban hành.",
        "main_flow": (
            "1. Người dùng mở tab 'Lịch sử phiên bản' tại `/contracts/history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/co-ownership/contracts/{contractId}/versions`.\n"
            "3. Controller `CoOwnershipContractController:getContractVersions()` tiếp nhận.\n"
            "4. Service truy vấn bảng `co_ownership_contract_versions` sắp xếp theo số phiên bản giảm dần.\n"
            "5. Trả về danh sách: Version, Trạng thái (ACTIVE / ARCHIVED), Ngày ban hành, Sự kiện kích hoạt (Chuyển nhượng cổ phần / Thêm thành viên mới).\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị cây lịch sử phiên bản (Timeline) trực quan."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp vào một phiên bản cũ (ARCHIVED) để xem lại nguyên văn nội dung và chữ ký của phiên bản quá khứ đó."
        ),
        "exception_flow": (
            "Tại bước 4, nếu hợp đồng không có phiên bản nào: Trả về HTTP 200 danh sách rỗng."
        ),
        "business_rules": "BR-CO-06",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-CO-07"
    },

    # =========================================================================
    # 5. SMART BOOKING & USAGE CALENDAR (4 UCs)
    # =========================================================================
    {
        "id": "UC-BOOK-01",
        "name": "Tra cứu khung giờ rảnh và lịch biểu xe",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL và Lịch biểu",
        "description": "Người dùng mở lịch biểu xe điện dạng tuần/tháng để tra cứu các khung giờ xe đang bận (đã có người đặt), khung giờ bảo dưỡng kỹ thuật và các khung giờ trống sẵn sàng đặt xe.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng mở tab 'Lịch đặt xe' trên thanh điều hướng hoặc tại màn hình Garage 3D.",
        "preconditions": "Người dùng là thành viên thuộc nhóm đồng sở hữu của chiếc xe.",
        "postconditions": "Lịch biểu tương tác `BookingCalendar.tsx` hiển thị đầy đủ các khối sự kiện thời gian theo chuẩn màu sắc.",
        "main_flow": (
            "1. Người dùng mở màn hình đặt xe tại `/bookings`.\n"
            "2. Giao diện nạp component `BookingCalendar.tsx` và gửi HTTP GET tới `/api/vehicles/{vehicleId}/bookings?from={start}&to={end}`.\n"
            "3. Controller `BookingController:getVehicleBookings()` tiếp nhận request.\n"
            "4. `BookingService` truy vấn các bản ghi trong bảng `bookings` có trạng thái `CONFIRMED` hoặc `IN_PROGRESS` trong khoảng thời gian truy vấn.\n"
            "5. Đồng thời truy vấn bảng `maintenances` để lấy các khung giờ bảo dưỡng định kỳ của xe.\n"
            "6. Dữ liệu được chuẩn hóa thành danh sách sự kiện lịch (Calendar Events) kèm thông tin: startTime, endTime, loại sự kiện (Đặt xe / Bảo dưỡng), tên người đặt (ẩn bớt thông tin nhạy cảm).\n"
            "7. Máy chủ trả về HTTP 200 OK.\n"
            "8. Giao diện hiển thị lịch biểu dạng lưới thời gian: Khối màu xanh dương (Chuyến đi của bạn), Khối màu xám (Thành viên khác đã đặt), Khối màu cam (Khung giờ bảo dưỡng), Vùng nền trắng (Khả dụng có thể đặt xe)."
        ),
        "alt_flow": (
            "Tại bước 8, người dùng có thể chuyển đổi giữa chế độ xem 'Theo ngày', 'Theo tuần' hoặc 'Theo tháng' trên thanh công cụ của lịch."
        ),
        "exception_flow": (
            "Tại bước 4, nếu phương tiện đang bị khóa khẩn cấp do sự cố kỹ thuật: Toàn bộ lưới lịch biểu chuyển sang màu đỏ kèm cảnh báo 'Phương tiện đang tạm ngừng vận hành để kiểm định'."
        ),
        "business_rules": "BR-BOOK-01, BR-BOOK-03",
        "related_fr": "FR-BOOK-01",
        "related_tc": "TC-BOOK-01"
    },
    {
        "id": "UC-BOOK-02",
        "name": "Tạo lịch đặt xe mới và xử lý khử xung đột thời gian",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kiểm tra xung đột",
        "description": "Người dùng chọn khung giờ bắt đầu và kết thúc để tạo lịch đặt xe. Hệ thống tự động kích hoạt thuật toán chống trùng lấn biên thời gian (Boundary Overlap Guard), kiểm tra thời gian đệm và hạn ngạch giờ sử dụng.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng kéo chọn khoảng thời gian trên lịch hoặc nhấn nút 'Đặt xe ngay' tại form `CreateBookingModal.tsx`.",
        "preconditions": "Người dùng là thành viên hợp lệ; khung giờ đặt cách thời điểm hiện tại tối thiểu 30 phút; tổng giờ đặt không vượt hạn ngạch tháng theo % cổ phần (BR-BOOK-05).",
        "postconditions": "Bản ghi `Booking` được tạo ở trạng thái `CONFIRMED`, khóa khung giờ trên lịch biểu nhóm.",
        "main_flow": (
            "1. Người dùng mở hộp thoại `CreateBookingModal.tsx`.\n"
            "2. Chọn thời gian bắt đầu `startTime` (ví dụ: 08:00 ngày mai) và thời gian kết thúc `endTime` (17:00 cùng ngày).\n"
            "3. Người dùng nhập mục đích sử dụng (Công tác / Gia đình) và số km dự kiến di chuyển.\n"
            "4. Người dùng nhấn nút 'Xác nhận đặt xe'. Frontend gửi HTTP POST tới `/api/bookings` kèm payload `CreateBookingRequest`.\n"
            "5. Controller `BookingController:createBooking()` tiếp nhận và kiểm tra ràng buộc DTO (`@NotNull`, `@Future`).\n"
            "6. `BookingService` thực thi thuật toán kiểm tra giao thoa thời gian nghiêm ngặt:\n"
            "   `NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = :vId AND b.status IN ('CONFIRMED', 'IN_PROGRESS') AND b.start_time < :newEndTime AND b.end_time > :newStartTime)`.\n"
            "7. Kiểm tra thời gian đệm vệ sinh/kiểm định 30 phút với chuyến đi liền trước và liền sau (BR-BOOK-02).\n"
            "8. Kiểm tra không bị xung đột với lịch bảo dưỡng xe trong bảng `maintenances` (BR-BOOK-03).\n"
            "9. Kiểm tra hạn ngạch giờ sử dụng trong tháng của thành viên theo tỷ lệ sở hữu (BR-BOOK-05).\n"
            "10. Tạo bản ghi mới trong bảng `bookings`: gán `vehicle_id`, `user_id`, `start_time`, `end_time`, `status = CONFIRMED`, `created_at = NOW()`.\n"
            "11. Máy chủ trả về HTTP 201 Created kèm mã đặt chỗ `bookingId`.\n"
            "12. Giao diện cập nhật ngay lập tức khối sự kiện mới màu xanh lên lịch biểu và hiển thị thông báo 'Đặt xe thành công'."
        ),
        "alt_flow": (
            "Tại bước 6, nếu khung giờ chọn bị trùng lấn một phần với lịch đặt của thành viên khác: `BookingService` ném `BookingConflictException`. Hệ thống trả về HTTP 409 Conflict kèm danh sách các khung giờ trống gần nhất gợi ý (Smart Reschedule Suggestions)."
        ),
        "exception_flow": (
            "Tại bước 9, nếu người dùng đã sử dụng vượt quá hạn ngạch giờ được phân bổ trong tháng: Hệ thống từ chối và cảnh báo 'Bạn đã sử dụng hết hạn ngạch giờ đặt xe trong tháng theo tỷ lệ cổ phần sở hữu. Vui lòng đàm phán mượn giờ từ thành viên khác hoặc đợi kỳ sao kê kế tiếp'."
        ),
        "business_rules": "BR-BOOK-01, BR-BOOK-02, BR-BOOK-03, BR-BOOK-05",
        "related_fr": "FR-BOOK-02",
        "related_tc": "TC-BOOK-02"
    },
    {
        "id": "UC-BOOK-03",
        "name": "Hủy lịch đặt xe hợp lệ trước giờ khởi hành",
        "primary_actor": "Đồng sở hữu đã tạo lịch đặt",
        "secondary_actor": "Hệ thống CSDL và Lịch biểu",
        "description": "Người dùng hủy lịch đặt xe đã tạo khi thay đổi kế hoạch di chuyển, giải phóng khung giờ sử dụng trên lịch biểu nhóm cho các thành viên khác.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn nút 'Hủy lịch đặt' trên chi tiết chuyến đi đã đặt.",
        "preconditions": "Lịch đặt ở trạng thái CONFIRMED; thời điểm hiện tại cách thời gian bắt đầu tối thiểu 60 phút để được miễn phí hủy (BR-BOOK-04).",
        "postconditions": "Cập nhật trạng thái `bookings.status = CANCELLED`, giải phóng hoàn toàn khung giờ trên lịch biểu.",
        "main_flow": (
            "1. Người dùng mở danh sách lịch đặt tại `/bookings/my-bookings` và chọn một lịch đặt sắp tới.\n"
            "2. Hệ thống hiển thị chi tiết lịch đặt kèm nút 'Hủy lịch'.\n"
            "3. Người dùng nhấp nút 'Hủy lịch', giao diện hiển thị hộp thoại xác nhận kèm lý do hủy.\n"
            "4. Người dùng chọn lý do (Thay đổi lịch trình cá nhân / Thời tiết xấu) và nhấn 'Xác nhận hủy'.\n"
            "5. Frontend gửi HTTP POST tới `/api/bookings/{bookingId}/cancel`.\n"
            "6. Controller `BookingController:cancelBooking()` tiếp nhận.\n"
            "7. `BookingService` kiểm tra người thực hiện là chủ nhân của lịch đặt hoặc có quyền ADMIN.\n"
            "8. Kiểm tra thời điểm hiện tại: nếu `startTime - NOW() >= 60 phút`, thực hiện hủy lịch bình thường không trừ hạn ngạch.\n"
            "9. Cập nhật `bookings.status = CANCELLED`, `updated_at = NOW()`.\n"
            "10. Hoàn trả lại số giờ đã đặt vào hạn ngạch sử dụng trong tháng của thành viên.\n"
            "11. Máy chủ trả về HTTP 200 OK kèm thông điệp 'Đã hủy lịch đặt thành công'.\n"
            "12. Lịch biểu giải phóng khung giờ, gửi thông báo đẩy cho các thành viên khác trong nhóm về khung giờ vừa trống."
        ),
        "alt_flow": (
            "Tại bước 8, nếu hủy lịch sát giờ khởi hành (< 60 phút): Hệ thống ghi nhận trạng thái LATE_CANCEL và trừ 5 điểm tín nhiệm cá nhân của thành viên theo quy chế nhóm."
        ),
        "exception_flow": (
            "Tại bước 7, nếu lịch đặt đã quá giờ bắt đầu hoặc đang ở trạng thái IN_PROGRESS: Hệ thống từ chối hủy và thông báo 'Không thể hủy lịch đặt xe khi chuyến đi đã bắt đầu'."
        ),
        "business_rules": "BR-BOOK-04",
        "related_fr": "FR-BOOK-05",
        "related_tc": "TC-BOOK-03"
    },
    {
        "id": "UC-BOOK-04",
        "name": "Xem lịch sử đặt xe cá nhân",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu toàn bộ danh sách các phiên đặt xe của mình trong quá khứ bao gồm các chuyến đã hoàn thành, chuyến bị hủy và các chuyến sắp diễn ra.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng nhấp vào tab 'Lịch đặt của tôi' trên thanh điều hướng.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Hiển thị danh sách phân trang các phiên đặt xe cá nhân.",
        "main_flow": (
            "1. Người dùng truy cập trang `/bookings/history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/bookings/my-bookings?page=0&size=10`.\n"
            "3. Controller tiếp nhận và lấy userId từ Security Context.\n"
            "4. `BookingService` truy vấn bảng `bookings` lọc theo `user_id` sắp xếp giảm dần theo `start_time`.\n"
            "5. Kết quả được đóng gói vào danh sách DTO `BookingResponse` kèm thông tin biển số xe, thời gian, trạng thái và chi phí liên kết.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng lịch sử đặt xe kèm bộ lọc trạng thái (Sắp tới, Hoàn thành, Đã hủy)."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp vào một phiên đặt xe đã hoàn thành để chuyển sang màn hình xem chi tiết chuyến đi và hóa đơn tiền điện."
        ),
        "exception_flow": (
            "Tại bước 4, nếu người dùng chưa từng đặt chuyến nào: Giao diện hiển thị trạng thái trống (Empty State) kèm nút điều hướng 'Đặt xe ngay'."
        ),
        "business_rules": "BR-BOOK-01",
        "related_fr": "FR-BOOK-01",
        "related_tc": "TC-BOOK-04"
    },

    # =========================================================================
    # 6. VEHICLE HANDOVER & TRIP EXECUTION (11 UCs)
    # =========================================================================
    {
        "id": "UC-TRIP-01",
        "name": "Bàn giao xe kỹ thuật và xác nhận hai bên",
        "primary_actor": "Nhân viên vận hành và Đồng sở hữu nhận xe",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kiểm định",
        "description": "Quy trình lập biên bản bàn giao xe kỹ thuật số trước chuyến đi: nhân viên và đồng sở hữu cùng kiểm tra tình trạng xe thực tế, mức pin, số km và ký xác nhận hai phía.",
        "priority": "Bắt buộc (High)",
        "trigger": "Đồng sở hữu đến trạm nhận xe trước giờ khởi hành 15 phút.",
        "preconditions": "Phiên đặt xe ở trạng thái CONFIRMED; xe không có hư hỏng nghiêm trọng chưa khắc phục; mức pin >= 20%.",
        "postconditions": "Tạo bản ghi `vehicle_handovers` hoàn tất; xe chuyển trạng thái READY_FOR_TRIP.",
        "main_flow": (
            "1. Nhân viên vận hành mở ứng dụng tại trạm `/staff/handover/{bookingId}`.\n"
            "2. Hệ thống kiểm tra điều kiện bàn giao xe qua API `/api/bookings/{bookingId}/handover-eligibility` (pin >= 20%, xe tại trạm).\n"
            "3. Nhân viên nhập các thông số thực tế của xe: Mức pin hiện thời (SOC %), Số km công tơ mét hiện tại (Odometer km).\n"
            "4. Nhân viên và đồng sở hữu đi vòng quanh xe, kiểm tra thân vỏ và đối chiếu với các vết tổn hại 3D đã có sẵn trên hệ thống.\n"
            "5. Nhân viên chụp 4 ảnh góc xe (Trước, Sau, Trái, Phải) tải lên hệ thống qua `VehicleInspectionController`.\n"
            "6. Nhân viên nhấn nút 'Xác nhận kiểm tra kỹ thuật đạt yêu cầu'. Bản ghi `vehicle_handovers` được tạo ở bước 1.\n"
            "7. Giao diện trên điện thoại của đồng sở hữu nhận thông báo yêu cầu xác nhận.\n"
            "8. Đồng sở hữu xem lại biên bản số, đối chiếu số liệu và nhấn nút 'Ký xác nhận nhận xe' trên ứng dụng của mình.\n"
            "9. Controller `VehicleHandoverController:confirmOwnerReceipt()` ghi nhận chữ ký hai phía hoàn tất.\n"
            "10. Trạng thái biên bản chuyển sang `COMPLETED`, hệ thống cấp chìa khóa ảo số (Digital Key) cho phép mở cửa xe."
        ),
        "alt_flow": (
            "Tại bước 4, nếu phát hiện vết trầy xước mới phát sinh chưa có trong hồ sơ: Nhân viên kích hoạt ngay tính năng ghi nhận tổn hại mới (UC-MAINT-01) trước khi tiếp tục bàn giao."
        ),
        "exception_flow": (
            "Tại bước 2, nếu mức pin xe hiện thời < 20%: Hệ thống chặn bàn giao và hiển thị cảnh báo 'Mức pin không đủ an toàn để bàn giao (Pin < 20%). Vui lòng đổi sang xe khác hoặc nạp sạc khẩn cấp'."
        ),
        "business_rules": "BR-TRIP-01, BR-TRIP-02",
        "related_fr": "FR-BOOK-07, FR-BOOK-08",
        "related_tc": "TC-TRIP-01"
    },
    {
        "id": "UC-TRIP-02",
        "name": "Nhân viên xác minh bàn giao xe kỹ thuật",
        "primary_actor": "Nhân viên vận hành tại trạm (ROLE_STAFF)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Nhân viên vận hành thực hiện kiểm tra các hạng mục kỹ thuật an toàn của xe (áp suất lốp, đèn chiếu sáng, còi, phanh, độ sạch sẽ) và lập biên bản kiểm định ban đầu.",
        "priority": "Cao (High)",
        "trigger": "Nhân viên bắt đầu ca trực tiếp nhận phương tiện chuẩn bị giao khách.",
        "preconditions": "Nhân viên đăng nhập với quyền STAFF; có lịch đặt xe sắp diễn ra.",
        "postconditions": "Biên bản kiểm tra kỹ thuật ban đầu được lưu trữ kèm ảnh chụp hiện trường.",
        "main_flow": (
            "1. Nhân viên mở danh sách xe cần bàn giao tại `/staff/handovers/pending`.\n"
            "2. Chọn xe điện cần kiểm tra và nhấn 'Bắt đầu kiểm định xe'.\n"
            "3. Frontend gửi HTTP POST tới `/api/bookings/{bookingId}/handover/start`.\n"
            "4. Nhân viên tích chọn các hạng mục an toàn trong danh sách kiểm tra (Checklist): Lốp xe đạt chuẩn, Đèn hoạt động tốt, Xe đã rửa sạch, Thảm sàn sạch sẽ.\n"
            "5. Nhập số liệu km và SOC % hiển thị trên bảng đồng hồ taplo xe.\n"
            "6. Nhấn nút 'Lưu biên bản kiểm tra'.\n"
            "7. Hệ thống lưu dữ liệu vào bảng `vehicle_inspections` và gắn liên kết với biên bản bàn giao."
        ),
        "alt_flow": (
            "Tại bước 4, nếu phát hiện xe quá bẩn: Nhân viên gắn cờ yêu cầu rửa xe nhanh tại trạm trước khi giao xe cho đồng sở hữu."
        ),
        "exception_flow": (
            "Tại bước 5, nếu số km nhập vào nhỏ hơn số km của chuyến đi liền trước: Hệ thống cảnh báo lỗi logic công tơ mét và yêu cầu nhập lại chính xác."
        ),
        "business_rules": "BR-TRIP-02",
        "related_fr": "FR-BOOK-07",
        "related_tc": "TC-TRIP-02"
    },
    {
        "id": "UC-TRIP-03",
        "name": "Co-Owner xem và ký nhận bàn giao xe",
        "primary_actor": "Đồng sở hữu nhận xe (ROLE_CO_OWNER)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Đồng sở hữu xem lại toàn bộ thông số và ảnh chụp kiểm định do nhân viên lập trên ứng dụng di động, ký số xác nhận đồng ý tiếp nhận trách nhiệm quản lý phương tiện.",
        "priority": "Bắt buộc (High)",
        "trigger": "Đồng sở hữu nhận thông báo yêu cầu ký nhận xe trên ứng dụng.",
        "preconditions": "Nhân viên đã hoàn thành bước kiểm định và ký xác nhận bước 1.",
        "postconditions": "Cập nhật chữ ký người nhận vào `vehicle_handovers`, chuyển giao quyền điều khiển xe.",
        "main_flow": (
            "1. Đồng sở hữu mở màn hình xác nhận nhận xe trên ứng dụng `/trips/handover/confirm`.\n"
            "2. Xem các thông số do nhân viên lập: Mức pin khởi hành 85%, Odometer 12.450 km, 4 ảnh chụp ngoại thất.\n"
            "3. Đồng sở hữu kiểm tra thực tế xe xem có khớp với biên bản không.\n"
            "4. Nhấn nút 'Ký nhận xe'.\n"
            "5. Vẽ chữ ký cảm ứng hoặc nhấn nút xác nhận OTP.\n"
            "6. Frontend gửi HTTP POST tới `/api/handovers/{handoverId}/owner-confirm`.\n"
            "7. Controller cập nhật `owner_confirmed = true` và `owner_confirmed_at = NOW()`.\n"
            "8. Giao diện hiển thị nút 'Mở khóa xe' và thông báo 'Tiếp nhận xe thành công. Chúc bạn có một chuyến đi an toàn!'."
        ),
        "alt_flow": (
            "Tại bước 3, nếu phát hiện sai lệch số km hoặc mức pin thực tế so với biên bản: Đồng sở hữu báo lại cho nhân viên để chỉnh sửa biên bản trước khi ký."
        ),
        "exception_flow": (
            "Tại bước 6, nếu mã bàn giao đã hết hạn hoặc bị hủy: Hệ thống thông báo 'Biên bản bàn giao không còn khả dụng'."
        ),
        "business_rules": "BR-TRIP-02",
        "related_fr": "FR-BOOK-08",
        "related_tc": "TC-TRIP-03"
    },
    {
        "id": "UC-TRIP-04",
        "name": "Khởi hành và bắt đầu chuyến đi trực tuyến",
        "primary_actor": "Đồng sở hữu đang trong phiên đặt",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ điều hành",
        "description": "Đồng sở hữu kích hoạt bắt đầu chuyến đi chính thức trên ứng dụng sau khi đã nhận xe, hệ thống kiểm tra chốt chặn an toàn dung lượng pin >= 20% và khởi tạo hồ sơ chuyến đi.",
        "priority": "Bắt buộc (High)",
        "trigger": "Đồng sở hữu nhấn nút 'Bắt đầu chuyến đi' (Start Trip) trên ứng dụng.",
        "preconditions": "Biên bản bàn giao đã hoàn tất (COMPLETED); trong khung giờ đặt xe; mức pin hiện thời >= 20% (BR-TRIP-01).",
        "postconditions": "Tạo bản ghi `trips` với trạng thái `IN_PROGRESS`, ghi nhận Start SOC và Start Odometer, mở khóa khởi động xe.",
        "main_flow": (
            "1. Người dùng ngồi vào xe và mở ứng dụng tại màn hình `ActiveTripDetailPanel.tsx`.\n"
            "2. Hệ thống kiểm tra điều kiện khởi hành qua API `/api/bookings/{bookingId}/trip/start-eligibility`.\n"
            "3. Kiểm tra mức pin hiện thời của xe: pin đạt 85% (lớn hơn ngưỡng an toàn tối thiểu 20%).\n"
            "4. Người dùng nhấn nút 'Bắt đầu chuyến đi'.\n"
            "5. Frontend gửi HTTP POST tới `/api/bookings/{bookingId}/trip/start` kèm Bearer Token.\n"
            "6. Controller `TripController:startTrip()` tiếp nhận yêu cầu.\n"
            "7. `TripService` kiểm tra chốt chặn an toàn `BR-TRIP-01`: nếu pin < 20% lập tức ném `InsufficientBatteryException`.\n"
            "8. Kiểm tra trạng thái bàn giao xe `BR-TRIP-02`: bắt buộc handover.status == COMPLETED.\n"
            "9. Tạo bản ghi mới trong bảng `trips`: `booking_id`, `vehicle_id`, `driver_id`, `start_time = NOW()`, `start_soc = 85.0`, `start_odometer = 12450`, `status = IN_PROGRESS`.\n"
            "10. Cập nhật trạng thái xe trong bảng `vehicles` sang `IN_USE`.\n"
            "11. Máy chủ trả về HTTP 200 OK kèm payload `TripResponse`.\n"
            "12. Giao diện chuyển sang màn hình điều hướng hành trình thời gian thực, hiển thị đồng hồ thời gian chuyến đi và cảnh báo an toàn."
        ),
        "alt_flow": (
            "Tại bước 7, nếu pin < 20%: Hệ thống từ chối khởi hành, hiển thị cảnh báo đỏ 'Mức pin xe hiện thời chỉ còn [SOC]%, dưới ngưỡng an toàn 20%. Bạn phải cắm sạc xe đạt trên 20% trước khi bắt đầu hành trình'."
        ),
        "exception_flow": (
            "Tại bước 8, nếu chưa hoàn thành bàn giao: Hệ thống trả về HTTP 400 Bad Request kèm thông báo 'Chuyến đi chưa thể bắt đầu do chưa hoàn tất biên bản bàn giao xe kỹ thuật'."
        ),
        "business_rules": "BR-TRIP-01, BR-TRIP-02",
        "related_fr": "FR-TRIP-01",
        "related_tc": "TC-TRIP-04"
    },
    {
        "id": "UC-TRIP-05",
        "name": "Theo dõi hành trình chuyến đi đang hoạt động",
        "primary_actor": "Đồng sở hữu đang lái xe",
        "secondary_actor": "Hệ thống Telemetry và Định vị xe điện",
        "description": "Người dùng theo dõi thời gian di chuyển đã trôi qua, thời gian còn lại trước hạn trả xe, mức tiêu hao năng lượng tức thời (kWh) và ước tính tầm hoạt động còn lại trên màn hình ứng dụng.",
        "priority": "Cao (High)",
        "trigger": "Chuyến đi đang ở trạng thái IN_PROGRESS.",
        "preconditions": "Chuyến đi đang hoạt động hợp lệ.",
        "postconditions": "Các thông số vận hành của chuyến đi được cập nhật liên tục mỗi 10 giây trên `ActiveTripDetailPanel.tsx`.",
        "main_flow": (
            "1. Người dùng quan sát màn hình hành trình `ActiveTripDetailPanel.tsx`.\n"
            "2. Component sử dụng hook `useActiveTrip()` định kỳ gửi HTTP GET tới `/api/vehicles/{vehicleId}/active-trip` mỗi 10 giây.\n"
            "3. Controller `TripController:getActiveTripForVehicle()` tiếp nhận.\n"
            "4. `VehicleEnergyModelService` tính toán các chỉ số động học:\n"
            "   - Thời gian chuyến đi đã sử dụng: `formatDuration(now - trip.startTime)`.\n"
            "   - Thời gian còn lại trước hạn trả: `formatDuration(booking.endTime - now)`.\n"
            "   - Quãng đường ước tính đã đi: lấy số km từ thiết bị giám sát hành trình IoT.\n"
            "   - Ước tính mức tiêu thụ pin: năng lượng tiêu hao theo chu trình lái.\n"
            "5. Máy chủ trả về DTO `TripResponse` cập nhật.\n"
            "6. Giao diện hiển thị thanh tiến độ thời gian: Nếu thời gian còn lại < 30 phút, thanh tiến độ chuyển sang màu vàng cảnh báo."
        ),
        "alt_flow": (
            "Tại bước 6, nếu thời gian còn lại < 15 phút mà người dùng chưa yêu cầu trả xe: Hệ thống gửi thông báo Notification khẩn cấp kèm nút bấm 'Yêu cầu gia hạn' hoặc 'Tìm đường về trạm'."
        ),
        "exception_flow": (
            "Tại bước 2, nếu xe đi vào khu vực mất sóng GPS / 4G: Ứng dụng Frontend giữ nguyên số liệu gần nhất và hiển thị biểu tượng 'Đang đồng bộ ngoại tuyến'."
        ),
        "business_rules": "BR-TRIP-01",
        "related_fr": "FR-TRIP-02",
        "related_tc": "TC-TRIP-05"
    },
    {
        "id": "UC-TRIP-06",
        "name": "Yêu cầu gia hạn thời gian chuyến đi",
        "primary_actor": "Đồng sở hữu đang trong chuyến đi",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kiểm tra lịch",
        "description": "Người dùng gửi yêu cầu kéo dài thời gian sử dụng xe thêm một khoảng thời gian (ví dụ thêm 1 giờ hoặc 2 giờ) khi phát sinh nhu cầu đột xuất trên đường.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn nút 'Gia hạn chuyến đi' trên bảng điều khiển hành trình.",
        "preconditions": "Chuyến đi đang ở trạng thái IN_PROGRESS; khoảng thời gian xin gia hạn không được xung đột với lịch đặt của người tiếp theo.",
        "postconditions": "Cập nhật thời gian kết thúc `endTime` của phiên đặt xe và chuyến đi nếu thành công.",
        "main_flow": (
            "1. Người dùng nhấn nút 'Gia hạn thời gian' trên `ActiveTripDetailPanel.tsx`.\n"
            "2. Hệ thống hiển thị hộp thoại `TripExtensionModal.tsx` cho phép chọn số phút muốn gia hạn (30 phút, 60 phút, 120 phút).\n"
            "3. Người dùng chọn gia hạn thêm 60 phút và nhấn 'Kiểm tra khả dụng'.\n"
            "4. Frontend gửi HTTP POST tới `/api/trips/{tripId}/extend/check` kèm payload số phút gia hạn.\n"
            "5. Controller `TripController:checkExtensionAvailability()` tiếp nhận.\n"
            "6. `TripExtensionService` kiểm tra xung đột: tính toán `newEndTime = currentEndTime + extensionMinutes + 30 minutes buffer`.\n"
            "7. Hệ thống truy vấn bảng `bookings` tìm các lịch đặt kế tiếp của cùng phương tiện.\n"
            "8. Nếu không có lịch nào giao thoa: Hệ thống trả về `TripExtensionCheckResponse` với trạng thái `AVAILABLE`.\n"
            "9. Người dùng nhấn 'Xác nhận gia hạn'. Frontend gửi HTTP POST tới `/api/bookings/{bookingId}/extend`.\n"
            "10. Hệ thống cập nhật `bookings.end_time = newEndTime` trong CSDL, ghi nhận bản ghi gia hạn.\n"
            "11. Máy chủ trả về HTTP 200 OK. Giao diện cập nhật thời hạn trả xe mới và hiển thị thông báo 'Gia hạn thành công thêm 60 phút'."
        ),
        "alt_flow": (
            "Tại bước 8, nếu khung giờ xin gia hạn bị trùng với lịch đặt kế tiếp của thành viên khác: Hệ thống trả về trạng thái `CONFLICT`, hiển thị thông tin thành viên đang đặt chuyến tiếp theo và đề xuất mở kênh đàm phán chuyển nhượng quyền ưu tiên (UC-TRIP-07)."
        ),
        "exception_flow": (
            "Tại bước 6, nếu xe có lịch bảo dưỡng cố định ngay sau chuyến đi: Hệ thống từ chối gia hạn và cảnh báo 'Không thể gia hạn do xe phải vào xưởng bảo dưỡng theo lịch định kỳ bắt buộc'."
        ),
        "business_rules": "BR-BOOK-01, BR-BOOK-02, BR-BOOK-03",
        "related_fr": "FR-BOOK-03",
        "related_tc": "TC-TRIP-06"
    },
    {
        "id": "UC-TRIP-07",
        "name": "Đàm phán chấp thuận hoặc từ chối gia hạn chuyến đi",
        "primary_actor": "Đồng sở hữu có lịch đặt kế tiếp",
        "secondary_actor": "Đồng sở hữu đang xin gia hạn, Hệ thống CSDL",
        "description": "Khi người đang đi xe muốn gia hạn khẩn cấp nhưng bị trùng lịch với người kế tiếp, hệ thống gửi yêu cầu đàm phán; người kế tiếp có thể chấp thuận lùi giờ (kèm nhận phí đền bù) hoặc từ chối.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng có lịch đặt kế tiếp nhận được thông báo yêu cầu nhượng khung giờ.",
        "preconditions": "Có bản ghi `trip_extension_requests` ở trạng thái PENDING gửi đích danh tới người dùng.",
        "postconditions": "Lùi lịch đặt kế tiếp nếu chấp thuận, hoặc giữ nguyên lịch nếu từ chối.",
        "main_flow": (
            "1. Người dùng có lịch kế tiếp nhận thông báo đẩy 'Thành viên [Tên] đề xuất xin gia hạn thêm 45 phút do kẹt xe và đề xuất bồi hoàn 50.000 đ vào quỹ chung'.\n"
            "2. Người dùng mở hộp thoại xem xét đàm phán `NegotiationDetailModal.tsx`.\n"
            "3. Hệ thống hiển thị: Thời gian xin lùi lịch, Số tiền bồi hoàn đề xuất, Thời gian nhận xe mới.\n"
            "4. Người dùng chọn 'Chấp thuận nhượng giờ'.\n"
            "5. Frontend gửi HTTP POST tới `/api/trips/extension-requests/{requestId}/accept`.\n"
            "6. Controller `TripController:acceptExtensionRequest()` tiếp nhận.\n"
            "7. `TripExtensionService` trong giao dịch `@Transactional` thực hiện:\n"
            "   - Kéo dài endTime của chuyến đi hiện tại.\n"
            "   - Tịnh tiến lùi startTime và endTime của phiên đặt kế tiếp thêm 45 phút.\n"
            "   - Tạo giao dịch chuyển tiền bồi hoàn giữa hai thành viên.\n"
            "8. Cập nhật `trip_extension_requests.status = ACCEPTED`.\n"
            "9. Máy chủ trả về HTTP 200 OK. Gửi thông báo xác nhận thành công tới cả hai bên."
        ),
        "alt_flow": (
            "Tại bước 4, nếu người dùng có việc gấp không thể lùi giờ: Chọn 'Từ chối'. Yêu cầu chuyển sang REJECTED, người đang lái xe nhận thông báo bắt buộc phải đưa xe về trạm đúng giờ."
        ),
        "exception_flow": (
            "Tại bước 5, nếu trong thời gian chờ trả lời mà người lái xe đã hoàn thành chuyến đi: Yêu cầu tự động hủy bỏ (CANCELLED)."
        ),
        "business_rules": "BR-BOOK-01, BR-DISP-01",
        "related_fr": "FR-BOOK-04",
        "related_tc": "TC-TRIP-07"
    },
    {
        "id": "UC-TRIP-08",
        "name": "Yêu cầu trả xe và nghiệm thu hoàn tất hành trình",
        "primary_actor": "Đồng sở hữu hoàn thành chuyến đi",
        "secondary_actor": "Nhân viên trạm, Hệ thống CSDL",
        "description": "Đồng sở hữu đưa xe về bãi đỗ tại trạm chỉ định, tắt máy, đóng kín cửa và nhấn nút 'Yêu cầu trả xe' trên ứng dụng để gọi nhân viên trực trạm ra nghiệm thu tiếp nhận.",
        "priority": "Bắt buộc (High)",
        "trigger": "Đồng sở hữu đỗ xe vào đúng ô quy định tại trạm EVShare.",
        "preconditions": "Xe đã về vị trí địa lý trạm (Geofence trạm sạc); chuyến đi ở trạng thái IN_PROGRESS.",
        "postconditions": "Chuyển trạng thái `trips.status = PENDING_RETURN`, gửi cảnh báo trực ban tới nhân viên.",
        "main_flow": (
            "1. Người dùng đưa xe về vị trí đỗ tại trạm EVShare, kéo phanh tay, tắt máy và đóng kín toàn bộ cửa kính.\n"
            "2. Mở ứng dụng và nhấn nút 'Yêu cầu hoàn trả xe' tại `ActiveTripDetailPanel.tsx`.\n"
            "3. Ứng dụng kiểm tra tọa độ GPS của thiết bị: xác nhận xe nằm trong phạm vi bán kính 50 mét của trạm đỗ xe quy định.\n"
            "4. Frontend gửi HTTP POST tới `/api/trips/{tripId}/request-return` kèm Bearer Token.\n"
            "5. Controller `TripController:requestReturn()` tiếp nhận.\n"
            "6. `TripService` cập nhật trạng thái chuyến đi sang `PENDING_RETURN`.\n"
            "7. Hệ thống phát thông báo chuông cảnh báo tới bảng điều khiển trực ban của nhân viên trạm `StaffOperationalCarousel.tsx`.\n"
            "8. Máy chủ trả về HTTP 200 OK.\n"
            "9. Giao diện người dùng hiển thị hướng dẫn: 'Đã gửi yêu cầu trả xe. Vui lòng chờ nhân viên kiểm định trong ít phút'."
        ),
        "alt_flow": (
            "Tại bước 3, nếu tọa độ xe nằm ngoài trạm đỗ xe quy định (> 100 mét): Hệ thống cảnh báo 'Bạn đang ở ngoài khu vực trạm xe quy định. Vui lòng di chuyển xe về đúng trạm đỗ của nhóm trước khi trả xe'."
        ),
        "exception_flow": (
            "Tại bước 1, nếu cửa xe hoặc nắp cốp còn mở: Hệ thống cảnh báo qua Telemetry và yêu cầu kiểm tra đóng kín cửa xe trước khi bấm trả."
        ),
        "business_rules": "BR-TRIP-01",
        "related_fr": "FR-TRIP-03",
        "related_tc": "TC-TRIP-08"
    },
    {
        "id": "UC-TRIP-09",
        "name": "Kiểm định kỹ thuật nghiệm thu trả xe",
        "primary_actor": "Nhân viên vận hành tại trạm (ROLE_STAFF)",
        "secondary_actor": "Đồng sở hữu trả xe, Hệ thống CSDL",
        "description": "Nhân viên tiếp nhận xe, kiểm tra thân vỏ đối chiếu với biên bản bàn giao ban đầu, đọc số km công tơ mét kết thúc, mức pin kết thúc và chụp ảnh nghiệm thu.",
        "priority": "Bắt buộc (High)",
        "trigger": "Nhân viên nhận thông báo xe đang chờ trả tại trạm.",
        "preconditions": "Chuyến đi ở trạng thái PENDING_RETURN; nhân viên có mặt tại hiện trường xe.",
        "postconditions": "Tạo biên bản nghiệm thu hoàn trả `VehicleInspection` lưu trữ đầy đủ số liệu và hình ảnh.",
        "main_flow": (
            "1. Nhân viên mở danh sách xe chờ tiếp nhận trên ứng dụng trực ban `/trips/pending-returns`.\n"
            "2. Chọn chuyến đi tương ứng và nhấn 'Bắt đầu nghiệm thu trả xe'.\n"
            "3. Nhân viên đọc và nhập số km kết thúc `End Odometer` và mức pin kết thúc `End SOC %`.\n"
            "4. Nhân viên đi vòng quanh xe kiểm tra thân vỏ: đối chiếu các vị trí tổn hại cũ trên màn hình 3D.\n"
            "5. Nhân viên chụp ảnh 4 góc xe và ảnh bảng đồng hồ taplo tải lên qua `VehicleInspectionController:recordItem()`.\n"
            "6. Nếu phát hiện vết trầy xước mới: nhân viên chụp ảnh cận cảnh, đánh dấu tọa độ 3D và ghi chú biên bản.\n"
            "7. Nhân viên nhấn nút 'Hoàn thành nghiệm thu trả xe'.\n"
            "8. Bản ghi kiểm định được lưu vào CSDL, chuyển tiếp sang bước chốt chi phí tự động."
        ),
        "alt_flow": (
            "Tại bước 6, nếu xe không phát sinh bất kỳ tổn hại mới nào: Biên bản được đánh dấu 'Tình trạng xe nguyên vẹn, sạch sẽ'."
        ),
        "exception_flow": (
            "Tại bước 3, nếu số km kết thúc nhỏ hơn số km bắt đầu của chuyến đi: Hệ thống báo lỗi và không cho phép lưu biên bản."
        ),
        "business_rules": "BR-TRIP-04",
        "related_fr": "FR-TRIP-04, FR-TRIP-06",
        "related_tc": "TC-TRIP-09"
    },
    {
        "id": "UC-TRIP-10",
        "name": "Nhân viên xác nhận hoàn tất trả xe và chốt chi phí",
        "primary_actor": "Nhân viên vận hành tại trạm",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ năng lượng WAC",
        "description": "Nhân viên nhấn xác nhận kết thúc chuyến đi. Hệ thống tự động tính toán điện năng tiêu thụ thực tế, áp dụng đơn giá vốn bình quân gia quyền WAC, trừ kho năng lượng và phát sinh hóa đơn tiền điện cá nhân.",
        "priority": "Bắt buộc (High)",
        "trigger": "Nhân viên nhấn nút 'Xác nhận hoàn tất chuyến đi' sau khi kiểm định xong.",
        "preconditions": "Biên bản nghiệm thu trả xe đã được lập hoàn chỉnh.",
        "postconditions": "Chuyển `trips.status = COMPLETED`, khấu trừ kho năng lượng pin xe, tạo khoản nợ `ExpenseShare` cho người lái.",
        "main_flow": (
            "1. Nhân viên xem màn hình tóm tắt nghiệm thu tại `/staff/trips/{tripId}/summary`.\n"
            "2. Nhấn nút 'Xác nhận kết thúc chuyến đi'.\n"
            "3. Frontend gửi HTTP POST tới `/api/trips/{tripId}/confirm-return` kèm Bearer Token của nhân viên.\n"
            "4. Controller `TripController:confirmReturn()` tiếp nhận.\n"
            "5. `TripService` phối hợp với `VehicleEnergyInventoryService` thực thi logic nghiệp vụ trong `@Transactional`:\n"
            "   - Tính mức tiêu thụ pin: `deltaSOC = trip.startSOC - trip.endSOC` (ví dụ 85% - 60% = 25%).\n"
            "   - Tính điện năng tiêu thụ thực tế: `energyUsedKwh = deltaSOC / 100 * batteryCapacityKwh` (ví dụ 0.25 * 82 kWh = 20.5 kWh).\n"
            "   - Lấy đơn giá vốn bình quân gia quyền hiện hành `currentWAC` của chiếc xe từ bảng `vehicle_energy_inventories` (ví dụ 3.850 đ/kWh).\n"
            "   - Tính thành tiền điện: `totalEnergyCost = energyUsedKwh * currentWAC` (ví dụ 20.5 * 3.850 = 78.925 đ).\n"
            "   - Khấu trừ lượng điện năng tiêu thụ khỏi kho năng lượng của xe: `current_energy_kwh -= energyUsedKwh`.\n"
            "   - Ghi bản ghi xuất kho vào bảng `vehicle_energy_transactions` với loại `TRIP_CONSUMPTION`.\n"
            "   - Tạo khoản nợ chi phí cá nhân trong bảng `expense_shares` gán cho người lái với trạng thái `UNPAID`.\n"
            "6. Cập nhật `trips.status = COMPLETED`, `trips.end_time = NOW()`, `trips.total_cost = totalEnergyCost`.\n"
            "7. Cập nhật trạng thái xe trong bảng `vehicles` trở về `AVAILABLE` (hoặc `NEEDS_CHARGING` nếu pin < 30%).\n"
            "8. Thu hồi chìa khóa số ảo (Digital Key) của phiên đặt xe.\n"
            "9. Máy chủ trả về HTTP 200 OK kèm `TripResponse` đầy đủ số liệu tài chính.\n"
            "10. Gửi thông báo sao kê chuyến đi tới ứng dụng của đồng sở hữu kèm số tiền điện cần thanh toán."
        ),
        "alt_flow": (
            "Tại bước 7, nếu sau chuyến đi mức pin kết thúc < 30%: Xe tự động chuyển trạng thái `NEEDS_CHARGING`, hệ thống tự động gán lệnh công việc sạc pin cho nhân viên trực ca."
        ),
        "exception_flow": (
            "Tại bước 5, nếu deltaSOC âm (mức pin kết thúc lớn hơn mức pin ban đầu do người dùng tự sạc điện trên đường): Hệ thống ghi nhận mức tiêu thụ năng lượng = 0 và chuyển sang quy trình ghi nhận nạp năng lượng."
        ),
        "business_rules": "BR-CHG-03, BR-TRIP-03",
        "related_fr": "FR-TRIP-05, FR-CHG-04",
        "related_tc": "TC-TRIP-10"
    },
    {
        "id": "UC-TRIP-11",
        "name": "Xem lịch sử chuyến đi và bàn giao",
        "primary_actor": "Đồng sở hữu, Nhân viên, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu lịch sử các chuyến đi đã hoàn thành kèm theo chi tiết biên bản bàn giao, biên bản hoàn trả xe và các khoản chi phí năng lượng đã hạch toán.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn tab 'Lịch sử chuyến đi' tại `/trips/history`.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Hiển thị danh sách phân trang các chuyến đi kèm chi tiết hành trình.",
        "main_flow": (
            "1. Người dùng mở trang `/trips/history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/trips?page=0&size=10`.\n"
            "3. Controller `TripController` tiếp nhận và lọc theo quyền hạn (Co-Owner chỉ xem chuyến của mình hoặc xe của nhóm; Staff/Admin xem toàn bộ).\n"
            "4. Service truy vấn bảng `trips`, kết nối dữ liệu từ `bookings`, `vehicles` và `users`.\n"
            "5. Trả về danh sách DTO chứa: Thời gian đi/về, Quãng đường (km), Điện năng tiêu thụ (kWh), Chi phí (VND), Trạng thái thanh toán.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng lịch sử chuyến đi kèm nút 'Xem biên bản bàn giao' và 'Xem hóa đơn năng lượng'."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng nhấp 'Xem biên bản bàn giao' để mở cửa sổ đối chiếu ảnh chụp lúc nhận xe và lúc trả xe."
        ),
        "exception_flow": (
            "Tại bước 4, nếu chưa có chuyến đi nào: Hiển thị bảng trống kèm thông báo 'Chưa có dữ liệu chuyến đi'."
        ),
        "business_rules": "BR-TRIP-01",
        "related_fr": "FR-TRIP-05",
        "related_tc": "TC-TRIP-11"
    }
]

print(f"Loaded {len(UCS_OWN_CON_BOOK_TRIP)} use cases in Part 1b.")
