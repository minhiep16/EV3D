# -*- coding: utf-8 -*-
"""
gen_v4_usecases_part2_b.py - Tạo 23 Use Case VOTE/DISP (9), ADMIN (11), NOTI (3) cho Part 2.
"""

UCS_VOTE_ADMIN_NOTI = [
    # =========================================================================
    # 10. DEMOCRATIC GOVERNANCE & DISPUTE RESOLUTION (9 UCs)
    # =========================================================================
    {
        "id": "UC-VOTE-01",
        "name": "Tạo đề xuất biểu quyết tập thể nhóm",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ biểu quyết",
        "description": "Thành viên tạo đề xuất lấy ý kiến tập thể về các vấn đề chung của xe: nâng cấp phụ kiện (camera hành trình, dán phim cách nhiệt), thay đổi quy chế nội bộ, bầu trưởng nhóm mới hoặc thanh lý tài sản.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Tạo đề xuất mới' tại màn hình biểu quyết nhóm.",
        "preconditions": "Người tạo là thành viên chính thức của nhóm đồng sở hữu; tài khoản đang hoạt động bình thường.",
        "postconditions": "Tạo bản ghi `vote_proposals` ở trạng thái ACTIVE; xác lập thời hạn biểu quyết tối đa 72 giờ (BR-VOTE-04).",
        "main_flow": (
            "1. Người dùng mở trang biểu quyết `/co-ownership/groups/{groupId}/voting`.\n"
            "2. Nhấn nút 'Tạo đề xuất mới', hiển thị modal `CreateProposalModal.tsx`.\n"
            "3. Người dùng nhập: Tiêu đề đề xuất, Nội dung giải trình chi tiết, Dự toán kinh phí (nếu có), Thời hạn đóng biểu quyết (24h - 72h theo BR-VOTE-04) và Tùy chọn bỏ phiếu (Đồng ý / Phản đối / Phiếu trắng).\n"
            "4. Người dùng nhấn 'Phát hành đề xuất'. Frontend gửi HTTP POST tới `/api/vote-proposals` kèm payload `CreateVoteProposalRequest`.\n"
            "5. Controller `VoteProposalController:createProposal()` tiếp nhận.\n"
            "6. `VoteProposalService` kiểm tra người tạo thuộc nhóm và thời hạn biểu quyết hợp lệ.\n"
            "7. Tạo bản ghi mới trong bảng `vote_proposals`: `group_id`, `creator_id`, `title`, `description`, `deadline = NOW() + hours`, `status = ACTIVE`, `created_at = NOW()`.\n"
            "8. Tự động khởi tạo bản ghi quyền biểu quyết cho toàn bộ các thành viên trong bảng `proposal_vote_eligibility`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm mã đề xuất `proposalId`.\n"
            "10. Hệ thống phát thông báo chuông tới tất cả các thành viên trong nhóm kêu gọi tham gia bỏ phiếu."
        ),
        "alt_flow": (
            "Tại bước 3, nếu đề xuất liên quan tới sửa đổi quy chế cốt lõi của nhóm: Hệ thống tự động thiết lập ngưỡng thông qua đặc biệt là 66.0000% (thay vì 50.0000% thông thường)."
        ),
        "exception_flow": (
            "Tại bước 3, nếu thời hạn biểu quyết nhập vào < 24 giờ hoặc > 72 giờ: Hệ thống cảnh báo vi phạm quy tắc BR-VOTE-04 và yêu cầu chọn lại thời gian hợp lệ."
        ),
        "business_rules": "BR-VOTE-01, BR-VOTE-04",
        "related_fr": "FR-VOTE-01",
        "related_tc": "TC-VOTE-01"
    },
    {
        "id": "UC-VOTE-02",
        "name": "Xem danh sách các đề xuất biểu quyết",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu danh sách toàn bộ các đề xuất đang mở bỏ phiếu, các đề xuất đã thông qua (PASSED) và các đề xuất bị bác bỏ (REJECTED) trong nhóm.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng mở tab 'Biểu quyết dân chủ' trên thanh điều hướng nhóm.",
        "preconditions": "Người dùng là thành viên thuộc nhóm sở hữu.",
        "postconditions": "Danh sách các đề xuất được hiển thị trực quan kèm tiến độ bỏ phiếu thời gian thực.",
        "main_flow": (
            "1. Người dùng truy cập trang `/co-ownership/voting`.\n"
            "2. Frontend gửi HTTP GET tới `/api/vote-proposals/group/{groupId}`.\n"
            "3. Controller `VoteProposalController` tiếp nhận request.\n"
            "4. Service truy vấn bảng `vote_proposals` sắp xếp các đề xuất đang `ACTIVE` lên đầu, tiếp theo là các đề xuất đã hoàn tất.\n"
            "5. Tính toán tiến độ hiện tại cho từng đề xuất: % cổ phần đã bỏ phiếu, tỷ lệ Đồng ý / Phản đối tức thời, thời gian còn lại.\n"
            "6. Máy chủ trả về danh sách DTO `VoteProposalResponse`.\n"
            "7. Giao diện hiển thị các thẻ đề xuất với thanh đo tiến độ màu sắc rõ ràng kèm nhãn 'Chưa bỏ phiếu' đối với các đề xuất người dùng chưa tham gia."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp vào bộ lọc để chỉ xem 'Đề xuất tôi chưa bỏ phiếu' hoặc 'Đề xuất đã có nghị quyết'."
        ),
        "exception_flow": (
            "Tại bước 4, nếu nhóm chưa từng có đề xuất biểu quyết nào: Hiển thị giao diện hướng dẫn 'Chưa có đề xuất biểu quyết nào trong nhóm'."
        ),
        "business_rules": "BR-VOTE-01",
        "related_fr": "FR-VOTE-04",
        "related_tc": "TC-VOTE-02"
    },
    {
        "id": "UC-VOTE-03",
        "name": "Bỏ phiếu biểu quyết theo trọng số vốn",
        "primary_actor": "Đồng sở hữu hợp lệ",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ tính toán trọng số",
        "description": "Thành viên bỏ phiếu lựa chọn quan điểm (Đồng ý, Phản đối, Phiếu trắng). Sức nặng lá phiếu của thành viên được tự động gán bằng đúng tỷ lệ % cổ phần sở hữu xe của người đó (Weighted Voting). Phiếu đã bầu là bất biến, không thể sửa đổi (BR-VOTE-05).",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn chọn một phương án và nhấn nút 'Xác nhận bỏ phiếu' tại `VoteActionModal.tsx`.",
        "preconditions": "Đề xuất đang ở trạng thái ACTIVE; thành viên sở hữu cổ phần > 0%; chưa từng bỏ phiếu cho đề xuất này trước đó (BR-VOTE-05).",
        "postconditions": "Tạo bản ghi `proposal_votes` gán trọng số voteWeight = % cổ phần; cập nhật tổng điểm đề xuất.",
        "main_flow": (
            "1. Người dùng mở chi tiết đề xuất tại `/voting/proposals/{proposalId}`.\n"
            "2. Hệ thống hiển thị nội dung đề xuất và tỷ lệ cổ phần người dùng đang nắm giữ (ví dụ: Bạn sở hữu 25.0000% cổ phần tương ứng 25.0000 điểm biểu quyết).\n"
            "3. Người dùng chọn một phương án biểu quyết: 'Đồng ý' (FOR), 'Phản đối' (AGAINST) hoặc 'Phiếu trắng' (ABSTAIN).\n"
            "4. Người dùng nhập lời bình luận giải thích quan điểm (không bắt buộc) và nhấn 'Xác nhận bỏ phiếu'.\n"
            "5. Frontend gửi HTTP POST tới `/api/vote-proposals/{proposalId}/votes` kèm payload `CastVoteRequest` (choice, comments).\n"
            "6. Controller `VoteProposalController:castVote()` tiếp nhận.\n"
            "7. `VoteProposalService` kiểm tra quy tắc bất biến `BR-VOTE-05`: truy vấn `ProposalVoteRepository.existsByProposalIdAndVoterId()`. Nếu đã vote, chặn lại ngay lập tức.\n"
            "8. Lấy tỷ lệ sở hữu chính xác của người dùng từ bảng `ownership_shares` tại thời điểm biểu quyết: `voteWeight = share.percentage` (BR-VOTE-01).\n"
            "9. Tạo bản ghi mới trong `proposal_votes`: `proposal_id`, `voter_id`, `choice`, `vote_weight = voteWeight`, `comments`, `created_at = NOW()`.\n"
            "10. Cập nhật tổng trọng số tích lũy của đề xuất trong bảng `vote_proposals`.\n"
            "11. Kiểm tra điều kiện hoàn thành sớm: nếu tổng trọng số 'Đồng ý' vượt ngưỡng quá bán 50.0000% (hoặc 66.0000%) thì tự động kích hoạt chốt kết quả sớm (UC-VOTE-04).\n"
            "12. Máy chủ trả về HTTP 200 OK kèm thông điệp 'Bỏ phiếu thành công với trọng số [X]%'.\n"
            "13. Giao diện cập nhật biểu đồ kết quả kiểm phiếu ngay lập tức."
        ),
        "alt_flow": (
            "Tại bước 11, nếu sau khi bỏ phiếu mà tổng trọng số ủng hộ đạt > 50%: Hệ thống tự động chuyển trạng thái đề xuất sang `PASSED` và thông báo đề xuất đã chính thức được phê chuẩn."
        ),
        "exception_flow": (
            "Tại bước 7, nếu thành viên cố tình gửi request bỏ phiếu lần 2: Hệ thống ném `DuplicateVoteException`, trả về HTTP 400 Bad Request kèm thông báo 'Vi phạm quy chế: Mỗi thành viên chỉ được bỏ phiếu một lần duy nhất cho một đề xuất'."
        ),
        "business_rules": "BR-VOTE-01, BR-VOTE-02, BR-VOTE-05",
        "related_fr": "FR-VOTE-02",
        "related_tc": "TC-VOTE-03"
    },
    {
        "id": "UC-VOTE-04",
        "name": "Xem kết quả kiểm phiếu và quyết định thông qua",
        "primary_actor": "Đồng sở hữu trong nhóm, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng theo dõi bảng tổng hợp kết quả kiểm phiếu biểu quyết: tổng tỷ lệ tham gia bỏ phiếu (Quorum %), tổng tỷ lệ ủng hộ, tỷ lệ phản đối và quyết định nghị quyết cuối cùng của tập thể.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng mở chi tiết đề xuất đã kết thúc hoặc đang mở.",
        "preconditions": "Người dùng thuộc nhóm đồng sở hữu.",
        "postconditions": "Biểu đồ tỷ lệ kiểm phiếu và biên bản nghị quyết được kết xuất rõ ràng.",
        "main_flow": (
            "1. Người dùng mở trang xem kết quả biểu quyết `/voting/proposals/{proposalId}/results`.\n"
            "2. Frontend gửi HTTP GET tới `/api/vote-proposals/{proposalId}/results`.\n"
            "3. Controller `VoteProposalController:getVoteResults()` tiếp nhận.\n"
            "4. Service truy vấn toàn bộ các phiếu bầu trong `proposal_votes` thuộc đề xuất.\n"
            "5. Tổng hợp số liệu: Tổng trọng số ĐỒNG Ý (ví dụ 65.0000%), Tổng trọng số PHẢN ĐỐI (20.0000%), Tổng trọng số PHIẾU TRẮNG (0.0000%), Chưa bỏ phiếu (15.0000%).\n"
            "6. Xác định trạng thái nghị quyết: PASSED (Đã thông qua do đạt 65% > 50% theo BR-VOTE-02).\n"
            "7. Máy chủ trả về HTTP 200 OK kèm danh sách phiếu bầu chi tiết (họ tên cử tri, tỷ lệ cổ phần, quan điểm và nhận xét).\n"
            "8. Giao diện hiển thị thanh tiến độ ba màu trực quan kèm con dấu 'NGHỊ QUYẾT ĐÃ ĐƯỢC THÔNG QUA'."
        ),
        "alt_flow": (
            "Tại bước 6, nếu hết thời hạn 72 giờ mà tổng trọng số ủng hộ chỉ đạt <= 50%: Trạng thái chuyển thành REJECTED (Bị bác bỏ) và đề xuất không được thực thi."
        ),
        "exception_flow": (
            "Tại bước 5, nếu tỷ lệ tham gia bỏ phiếu không đạt ngưỡng tối thiểu Quorum 50% tổng cổ phần: Đề xuất bị tuyên bố không có giá trị (INVALID_QUORUM) và phải tổ chức lấy ý kiến lại."
        ),
        "business_rules": "BR-VOTE-01, BR-VOTE-02, BR-VOTE-04",
        "related_fr": "FR-VOTE-04, FR-VOTE-05",
        "related_tc": "TC-VOTE-04"
    },
    {
        "id": "UC-VOTE-05",
        "name": "Khởi tạo khiếu nại tranh chấp sau sự cố",
        "primary_actor": "Đồng sở hữu bị ảnh hưởng quyền lợi",
        "secondary_actor": "Hệ thống phát hiện sự cố tự động, CSDL",
        "description": "Người dùng tạo hồ sơ khiếu nại tranh chấp khi gặp sự cố: xe bị trả muộn làm lỡ chuyến, phát hiện vết trầy xước không nhận trách nhiệm, nội thất xe bị vấy bẩn hoặc không tuân thủ nạp pin. Hệ thống hỗ trợ tính năng tự động phát hiện xung đột và điền trước form (Prefill Dispute).",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Gửi khiếu nại' trên lịch đặt bị ảnh hưởng hoặc tại trung tâm hòa giải.",
        "preconditions": "Người tạo là thành viên nhóm hoặc người thuê chuyến đi liên quan; sự việc xảy ra trong vòng 48 giờ gần nhất.",
        "postconditions": "Tạo bản ghi `disputes` ở trạng thái `OPEN`, phân loại danh mục và mức độ ưu tiên, phân công nhân viên xử lý.",
        "main_flow": (
            "1. Người dùng mở trang Trung tâm hòa giải tranh chấp tại `/disputes/create`.\n"
            "2. Hệ thống kiểm tra nếu có sự cố trả xe muộn xâm lấn lịch đặt của người dùng, tự động gọi API `/api/disputes/prefill/booking/{bookingId}`.\n"
            "3. Dịch vụ `BookingIncidentDetectionService` tự động điền trước các thông số: Mã chuyến đi vi phạm, Số phút bị trễ (ví dụ trễ 45 phút), Tên người vi phạm, và gợi ý mức phạt bồi thường 150.000 đ theo quy tắc BR-DISP-01.\n"
            "4. Người dùng kiểm tra thông tin điền trước, chọn danh mục tranh chấp (TRẢ XE MUỘN / HƯ HỎNG THÂN VỎ / VỆ SINH XE / NỢ CHI PHÍ / KHÁC).\n"
            "5. Người dùng nhập nội dung giải trình khiếu nại chi tiết và tải lên các ảnh chụp chứng cứ (ảnh đồng hồ chờ đợi, ảnh nội thất bẩn).\n"
            "6. Người dùng nhấn nút 'Gửi hồ sơ khiếu nại'. Frontend gửi HTTP POST tới `/api/disputes` kèm payload `CreateDisputeRequest`.\n"
            "7. Controller `DisputeController:createDispute()` tiếp nhận.\n"
            "8. `DisputeService` tạo bản ghi trong bảng `disputes`: `category`, `status = OPEN`, `priority = HIGH`, `creator_id`, `target_user_id`, `created_at = NOW()`.\n"
            "9. Tự động thêm hai bên vào bảng `dispute_participants` với vai trò COMPLAINANT (Bên khiếu nại) và RESPONDENT (Bên bị khiếu nại).\n"
            "10. Máy chủ trả về HTTP 201 Created kèm mã hồ sơ `disputeId`.\n"
            "11. Hệ thống gửi thông báo khẩn tới bên bị khiếu nại yêu cầu phản hồi và gửi thông báo tới nhân viên trực ban trạm."
        ),
        "alt_flow": (
            "Tại bước 2, nếu không có sự cố tự động: Người dùng tự nhập mã đặt xe hoặc chọn thời điểm xảy ra sự việc thủ công."
        ),
        "exception_flow": (
            "Tại bước 6, nếu sự việc đã xảy ra quá 48 giờ: Hệ thống từ chối mở hồ sơ khiếu nại theo thời hiệu quy chế nhóm."
        ),
        "business_rules": "BR-DISP-01, BR-DISP-03",
        "related_fr": "FR-DISP-01, FR-DISP-02",
        "related_tc": "TC-DISP-01"
    },
    {
        "id": "UC-VOTE-06",
        "name": "Nộp bổ sung bằng chứng và tin nhắn hòa giải",
        "primary_actor": "Các bên tranh chấp (Người khiếu nại / Người bị khiếu nại)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ phòng hòa giải",
        "description": "Các bên tham gia phòng hòa giải trực tuyến gửi tin nhắn trao đổi văn minh, tải lên các bằng chứng bổ sung (video camera hành trình, ảnh chụp đối chiếu, biên lai sửa xe) để làm sáng tỏ sự việc.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhập tin nhắn hoặc chọn tệp bằng chứng tại phòng hòa giải `/disputes/{id}`.",
        "preconditions": "Hồ sơ tranh chấp đang ở trạng thái OPEN hoặc UNDER_MEDIATION; người gửi là thành viên được mời vào phòng hòa giải.",
        "postconditions": "Tạo bản ghi `dispute_messages` và `dispute_evidences`, cập nhật cuộc trò chuyện thời gian thực qua WebSocket.",
        "main_flow": (
            "1. Người dùng mở phòng hòa giải trực tuyến tại `/disputes/{disputeId}`.\n"
            "2. Hệ thống hiển thị dòng thời gian sự việc, danh sách các bên tham gia và khung chat bảo mật `DisputeChatRoom.tsx`.\n"
            "3. Người dùng nhập tin nhắn phản hồi giải trình sự việc (ví dụ: 'Do đoạn đường Nguyễn Trãi bị ùn tắc do tai nạn nên tôi không kịp đưa xe về đúng giờ, tôi xin nhận trách nhiệm và chấp nhận mức bồi thường').\n"
            "4. Người dùng nhấn nút đính kèm và tải lên ảnh chụp màn hình bản đồ giao thông lúc xảy ra sự việc.\n"
            "5. Nhấn 'Gửi'. Frontend gửi HTTP POST tới `/api/disputes/{id}/messages` kèm nội dung tin nhắn và tệp ảnh.\n"
            "6. Controller `DisputeController:addMessage()` tiếp nhận.\n"
            "7. `DisputeService` kiểm tra người gửi thuộc danh sách `dispute_participants`.\n"
            "8. Lưu bản ghi tin nhắn vào `dispute_messages` và tệp đính kèm vào `dispute_evidences`.\n"
            "9. Phát sự kiện WebSocket tới toàn bộ các bên trong phòng chat để hiển thị tin nhắn tức thời.\n"
            "10. Máy chủ trả về HTTP 201 Created kèm dữ liệu tin nhắn đã gửi."
        ),
        "alt_flow": (
            "Tại bước 3, người dùng có thể chọn chế độ gửi 'Tin nhắn riêng cho hòa giải viên' nếu có các thông tin nhạy cảm cần trình bày riêng."
        ),
        "exception_flow": (
            "Tại bước 7, nếu người dùng ngoài phòng cố tình gửi tin nhắn: Hệ thống từ chối và ném `AccessDeniedException`."
        ),
        "business_rules": "BR-DISP-03",
        "related_fr": "FR-DISP-04",
        "related_tc": "TC-DISP-02"
    },
    {
        "id": "UC-VOTE-07",
        "name": "Nhân viên tiếp nhận điều tra khiếu nại",
        "primary_actor": "Nhân viên vận hành được phân công (Hòa giải viên)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kiểm định",
        "description": "Nhân viên trung gian độc lập tiếp nhận hồ sơ tranh chấp, xem xét các chứng cứ hai bên nộp, trích xuất dữ liệu camera trạm xe và lịch sử kiểm định để lập báo cáo điều tra khách quan. Hòa giải viên không được là thành viên của nhóm đang tranh chấp (BR-DISP-02).",
        "priority": "Bắt buộc (High)",
        "trigger": "Nhân viên nhận phân công hòa giải viên hoặc chủ động nhận án tại `/staff/disputes`.",
        "preconditions": "Nhân viên có quyền STAFF; không sở hữu cổ phần chiếc xe liên quan (BR-DISP-02).",
        "postconditions": "Cập nhật `disputes.status = UNDER_MEDIATION`, gán `staff_id` vào hồ sơ, ban hành kết luận điều tra sơ bộ.",
        "main_flow": (
            "1. Nhân viên mở bảng quản lý khiếu nại của nhân viên tại `/staff/disputes/dashboard`.\n"
            "2. Chọn hồ sơ tranh chấp đang ở trạng thái OPEN.\n"
            "3. Nhân viên nhấn nút 'Nhận làm hòa giải viên'. Frontend gửi HTTP PATCH tới `/api/disputes/{id}/assign-staff`.\n"
            "4. Controller `DisputeController:assignStaffMediator()` tiếp nhận.\n"
            "5. Service kiểm tra quy tắc tính khách quan `BR-DISP-02`: xác nhận nhân viên không nằm trong danh sách thành viên nhóm xe trong `co_ownership_members`.\n"
            "6. Cập nhật `disputes.staff_id = staffId`, `status = UNDER_MEDIATION`, ghi nhận vào `dispute_action_logs`.\n"
            "7. Nhân viên mở công cụ đối chiếu biên bản kiểm định (UC-MAINT-03) để kiểm tra ảnh chụp trước và sau chuyến đi.\n"
            "8. Nhân viên soạn thảo văn bản kết luận sơ bộ: Xác định bên có lỗi, căn cứ quy chế và đề xuất phương án bồi hoàn cụ thể (ví dụ: bồi thường 150.000 đ tiền phạt trễ giờ cho người kế tiếp).\n"
            "9. Nhân viên gửi đề xuất hòa giải vào phòng giải quyết tranh chấp."
        ),
        "alt_flow": (
            "Tại bước 5, nếu nhân viên là thành viên của nhóm xe: Hệ thống chặn lại và thông báo 'Vi phạm quy chế khách quan: Hòa giải viên không được là thành viên trong nhóm đang xảy ra tranh chấp'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu hồ sơ đã có hòa giải viên khác nhận xử lý: Hệ thống thông báo 'Hồ sơ này đã được tiếp nhận bởi nhân viên khác'."
        ),
        "business_rules": "BR-DISP-02, BR-DISP-03",
        "related_fr": "FR-DISP-03",
        "related_tc": "TC-DISP-03"
    },
    {
        "id": "UC-VOTE-08",
        "name": "Thực thi giải pháp bồi thường hòa giải",
        "primary_actor": "Các bên tranh chấp và Hòa giải viên",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ tài chính",
        "description": "Các bên xác nhận chấp thuận phương án bồi thường do hòa giải viên đề xuất. Hệ thống tự động tạo nghĩa vụ bồi hoàn tài chính và chuyển trạng thái hồ sơ sang đã giải quyết (RESOLVED) sau khi thanh toán xong.",
        "priority": "Bắt buộc (High)",
        "trigger": "Các bên nhấn nút 'Chấp thuận phương án hòa giải' trên màn hình giải quyết.",
        "preconditions": "Hòa giải viên đã ban hành phương án bồi thường chi tiết; cả hai bên đều đồng ý.",
        "postconditions": "Tạo bản ghi `dispute_compensations`, tự động trừ/cộng tiền bồi hoàn, đóng hồ sơ tranh chấp.",
        "main_flow": (
            "1. Các bên xem phương án kết luận của hòa giải viên trên giao diện `/disputes/{id}/resolution`.\n"
            "2. Phương án quy định: Bên vi phạm bồi hoàn số tiền 150.000 đ cho bên bị ảnh hưởng trong vòng 24 giờ.\n"
            "3. Cả hai bên lần lượt nhấn nút 'Tôi chấp thuận phương án này'.\n"
            "4. Frontend gửi HTTP POST tới `/api/disputes/{id}/respond-resolution`.\n"
            "5. Khi nhận đủ 100% sự đồng thuận, `DisputeService` tạo bản ghi trong bảng `dispute_compensations`:\n"
            "   `payer_id = respondentId`, `recipient_id = complainantId`, `amount = 150000`, `status = PENDING`.\n"
            "6. Hệ thống hỗ trợ tính năng chuyển tiền bồi thường nhanh qua giao diện giả lập (Demo Payment).\n"
            "7. Bên vi phạm nhấn 'Thực hiện thanh toán bồi hoàn'. Cổng thanh toán ghi nhận giao dịch thành công (BR-DISP-04).\n"
            "8. Bản ghi `dispute_compensation_payments` được tạo với trạng thái `VERIFIED`.\n"
            "9. Cập nhật `disputes.status = RESOLVED`, `resolved_at = NOW()`.\n"
            "10. Hòa giải viên nhấn nút 'Đóng hồ sơ tranh chấp'. Gửi thông báo kết thúc vụ việc tới các bên liên quan."
        ),
        "alt_flow": (
            "Tại bước 3, nếu một trong hai bên không đồng ý với phương án: Vụ việc được chuyển tiếp lên Ban Quản trị cấp cao (Admin) để ban hành phán quyết cưỡng chế cuối cùng."
        ),
        "exception_flow": (
            "Tại bước 7, nếu bên vi phạm cố tình không thanh toán sau 24 giờ: Hệ thống tự động khóa tài khoản và tạm giữ quyền đặt xe của thành viên vi phạm."
        ),
        "business_rules": "BR-DISP-03, BR-DISP-04",
        "related_fr": "FR-DISP-05, FR-DISP-06",
        "related_tc": "TC-DISP-04"
    },
    {
        "id": "UC-VOTE-09",
        "name": "Xem lịch sử giải quyết tranh chấp",
        "primary_actor": "Đồng sở hữu, Hòa giải viên, Quản trị viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu danh sách toàn bộ các vụ khiếu nại tranh chấp đã được thụ lý và giải quyết trong quá khứ kèm kết quả bồi thường và nhật ký kiểm toán hành vi.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn tab 'Lịch sử hòa giải' tại `/disputes/history`.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Hiển thị danh sách các hồ sơ tranh chấp đã đóng.",
        "main_flow": (
            "1. Người dùng mở trang `/disputes/history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/disputes/my-disputes` (đối với Co-Owner) hoặc `/api/disputes/staff/dashboard?status=CLOSED` (đối với Staff).\n"
            "3. Controller `DisputeController` tiếp nhận request.\n"
            "4. Service truy vấn bảng `disputes` lọc theo trạng thái `RESOLVED` hoặc `CLOSED`.\n"
            "5. Trả về danh sách: Mã hồ sơ, Tiêu đề, Ngày mở, Ngày đóng, Hòa giải viên, Số tiền bồi hoàn đã tất toán, Đánh giá chất lượng hòa giải.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng lưu trữ hồ sơ, cho phép mở lại xem toàn bộ lịch sử tin nhắn và chứng từ của vụ việc."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp nút 'Tải biên bản hòa giải' để xuất tệp PDF tóm tắt kết luận vụ việc."
        ),
        "exception_flow": (
            "Tại bước 4, nếu chưa có vụ việc nào: Hiển thị giao diện thông báo 'Chưa có hồ sơ khiếu nại nào'."
        ),
        "business_rules": "BR-DISP-03",
        "related_fr": "FR-DISP-06",
        "related_tc": "TC-DISP-05"
    },

    # =========================================================================
    # 11. SYSTEM ADMINISTRATION & AUDITING (11 UCs)
    # =========================================================================
    {
        "id": "UC-ADMIN-01",
        "name": "Quản trị danh sách tài khoản và phân quyền người dùng",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ xác thực",
        "description": "Quản trị viên xem danh sách toàn bộ người dùng trong hệ sinh thái EVShare, tra cứu thông tin chi tiết, điều chỉnh quyền hạn vai trò (ADMIN / STAFF / CO_OWNER) và khóa/mở khóa tài khoản.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên truy cập mục 'Quản lý tài khoản' tại `/admin/users`.",
        "preconditions": "Tài khoản đăng nhập có quyền tối cao ROLE_ADMIN (BR-SEC-03).",
        "postconditions": "Hiển thị bảng danh trị người dùng kèm các công cụ quản trị bảo mật.",
        "main_flow": (
            "1. Quản trị viên mở trang `/admin/users`.\n"
            "2. Frontend gửi HTTP GET tới `/api/admin/users?page=0&size=20` kèm Bearer Token của Admin.\n"
            "3. `JwtAuthenticationFilter` giải mã token và xác thực quyền `ROLE_ADMIN`.\n"
            "4. Controller `AdminController` gọi `AdminService:getAllUsers()`.\n"
            "5. Service truy vấn bảng `users` kết nối thông tin quyền hạn và ngày đăng ký.\n"
            "6. Danh sách được ánh xạ sang `UserResponse` DTO (không để lộ trường mật khẩu băm theo BR-SEC-01).\n"
            "7. Máy chủ trả về HTTP 200 OK.\n"
            "8. Giao diện hiển thị bảng danh sách tài khoản kèm bộ lọc vai trò, nút 'Đổi quyền' và 'Khóa tài khoản'."
        ),
        "alt_flow": (
            "Tại bước 8, quản trị viên có thể xuất toàn bộ danh sách người dùng ra tệp định dạng Excel / CSV để báo cáo định kỳ."
        ),
        "exception_flow": (
            "Tại bước 3, nếu người dùng có vai trò STAFF hoặc CO_OWNER cố tình gọi API này: Spring Security chặn đứng và trả về HTTP 403 Forbidden theo quy tắc BR-SEC-03."
        ),
        "business_rules": "BR-SEC-01, BR-SEC-03",
        "related_fr": "FR-ADM-02",
        "related_tc": "TC-ADM-01"
    },
    {
        "id": "UC-ADMIN-02",
        "name": "Tìm kiếm và lọc tài khoản người dùng",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Hỗ trợ tìm kiếm nhanh người dùng theo từ khóa họ tên, địa chỉ email, số điện thoại và lọc đa tiêu chí theo vai trò (Role) hoặc trạng thái hoạt động (Active / Locked).",
        "priority": "Trung bình (Medium)",
        "trigger": "Quản trị viên nhập từ khóa vào ô tìm kiếm hoặc chọn bộ lọc.",
        "preconditions": "Quản trị viên đang ở màn hình `/admin/users`.",
        "postconditions": "Danh sách người dùng được lọc chính xác theo tiêu chí.",
        "main_flow": (
            "1. Quản trị viên nhập từ khóa tìm kiếm (ví dụ: 'nguyen.van.a@gmail.com') vào ô tìm kiếm.\n"
            "2. Chọn bộ lọc vai trò: 'CO_OWNER' và trạng thái: 'ACTIVE'.\n"
            "3. Frontend gửi HTTP GET tới `/api/admin/users/search?keyword=...&role=CO_OWNER&status=ACTIVE`.\n"
            "4. Controller tiếp nhận và chuyển tới `UserRepository` thực thi truy vấn JPA Specification.\n"
            "5. Kết quả tìm kiếm trả về danh sách người dùng thỏa mãn điều kiện.\n"
            "6. Giao diện cập nhật bảng kết quả trong 200ms."
        ),
        "alt_flow": (
            "Tại bước 5, nếu không tìm thấy bản ghi nào khớp: Giao diện hiển thị thông báo 'Không tìm thấy người dùng nào phù hợp với từ khóa'."
        ),
        "exception_flow": (
            "Tại bước 3, nếu chuỗi tìm kiếm chứa các ký tự nguy hiểm (SQL Injection): Tầng Repository sử dụng Prepared Statements để ngăn chặn triệt để."
        ),
        "business_rules": "BR-SEC-03",
        "related_fr": "FR-ADM-02",
        "related_tc": "TC-ADM-01"
    },
    {
        "id": "UC-ADMIN-03",
        "name": "Cập nhật vai trò người dùng (Role Assignment)",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ phân quyền",
        "description": "Quản trị viên nâng cấp hoặc hạ cấp vai trò của tài khoản (ví dụ: nâng cấp CO_OWNER lên STAFF để bổ nhiệm nhân viên trực trạm mới) kèm ghi nhật ký kiểm toán.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên chọn 'Đổi vai trò' tại dòng tài khoản người dùng.",
        "preconditions": "Tài khoản thực hiện là ADMIN; không thể tự hạ quyền của chính mình.",
        "postconditions": "Cập nhật trường `users.role` trong CSDL; thu hồi toàn bộ token cũ của tài khoản được đổi để nạp quyền mới.",
        "main_flow": (
            "1. Quản trị viên chọn một tài khoản người dùng và nhấp nút 'Chỉnh sửa vai trò'.\n"
            "2. Hộp thoại `ChangeRoleModal.tsx` hiển thị vai trò hiện tại và danh sách vai trò mới (CO_OWNER, STAFF, ADMIN).\n"
            "3. Quản trị viên chọn vai trò mới 'STAFF' và nhập lý do điều động công tác.\n"
            "4. Nhấn 'Xác nhận thay đổi'. Frontend gửi HTTP PATCH tới `/api/admin/users/{userId}/role` kèm payload `{role: 'STAFF'}`.\n"
            "5. Controller `AdminController:updateUserRole()` tiếp nhận.\n"
            "6. Service kiểm tra an toàn: ngăn chặn quản trị viên tự tước quyền ADMIN của chính mình.\n"
            "7. Cập nhật `users.role = 'STAFF'`, `updated_at = NOW()`.\n"
            "8. Vô hiệu hóa toàn bộ Refresh Token của tài khoản đó trong `refresh_tokens` để bắt buộc đăng nhập lại nhằm làm mới quyền hạn trong Security Context.\n"
            "9. Ghi nhật ký kiểm toán an ninh vào bảng `audit_logs` (BR-SEC-02).\n"
            "10. Máy chủ trả về HTTP 200 OK kèm thông điệp 'Cập nhật vai trò thành công'."
        ),
        "alt_flow": (
            "Tại bước 6, nếu quản trị viên vô tình chọn đổi quyền của chính tài khoản mình đang đăng nhập: Hệ thống từ chối và cảnh báo 'Không thể tự thay đổi vai trò của chính tài khoản hiện tại'."
        ),
        "exception_flow": (
            "Tại bước 4, nếu userId không tồn tại trong hệ thống: Trả về HTTP 404 Not Found."
        ),
        "business_rules": "BR-SEC-02, BR-SEC-03",
        "related_fr": "FR-ADM-02",
        "related_tc": "TC-ADM-01"
    },
    {
        "id": "UC-ADMIN-04",
        "name": "Khóa hoặc mở khóa tài khoản người dùng",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Quản trị viên tạm khóa tài khoản khi phát hiện dấu hiệu vi phạm quy chế hoặc mở khóa tài khoản sau khi người dùng đã giải quyết xong tranh chấp.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên nhấn nút 'Khóa tài khoản' (hoặc 'Mở khóa').",
        "preconditions": "Quản trị viên có quyền ADMIN; tài khoản mục tiêu không phải là chính mình.",
        "postconditions": "Cập nhật `users.active_status = LOCKED` (hoặc `ACTIVE`); chặn toàn bộ các request tiếp theo của tài khoản đó.",
        "main_flow": (
            "1. Quản trị viên chọn tài khoản có dấu hiệu vi phạm và nhấp 'Khóa tài khoản'.\n"
            "2. Nhập lý do khóa: 'Tài khoản bị tạm khóa do vi phạm quy chế hoàn trả xe và chậm thanh toán nợ'.\n"
            "3. Frontend gửi HTTP PATCH tới `/api/admin/users/{userId}/status` kèm payload `{status: 'LOCKED', reason: '...'}`.\n"
            "4. Controller `AdminController:updateUserStatus()` tiếp nhận.\n"
            "5. Service cập nhật `users.active_status = 'LOCKED'`.\n"
            "6. Thu hồi toàn bộ Refresh Token của người dùng trong CSDL.\n"
            "7. Ghi bản ghi vào `audit_logs`.\n"
            "8. Máy chủ trả về HTTP 200 OK.\n"
            "9. Tài khoản bị khóa sẽ không thể đăng nhập hoặc gọi bất kỳ API nghiệp vụ nào."
        ),
        "alt_flow": (
            "Tại bước 1, nếu tài khoản đang bị LOCKED và quản trị viên nhấn 'Mở khóa': Hệ thống chuyển trạng thái sang `ACTIVE`, người dùng có thể đăng nhập bình thường trở lại."
        ),
        "exception_flow": (
            "Tại bước 5, nếu quản trị viên cố tình khóa tài khoản Super Admin gốc: Hệ thống chặn lại để bảo đảm luôn có ít nhất một quản trị viên hoạt động."
        ),
        "business_rules": "BR-SEC-02, BR-SEC-03",
        "related_fr": "FR-ADM-02",
        "related_tc": "TC-ADM-01"
    },
    {
        "id": "UC-ADMIN-05",
        "name": "Xem danh sách đội xe (Vehicle Fleet Overview)",
        "primary_actor": "Quản trị viên hệ thống, Điều hành viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Quản trị viên tra cứu toàn bộ danh mục phương tiện xe điện trong toàn hệ thống, theo dõi trạng thái hoạt động tức thời (AVAILABLE, IN_USE, CHARGING, MAINTENANCE, NEEDS_CHARGING) và vị trí trạm đỗ của từng xe.",
        "priority": "Cao (High)",
        "trigger": "Quản trị viên mở menu 'Quản lý Đội xe' tại `/admin/vehicles`.",
        "preconditions": "Tài khoản có quyền ROLE_ADMIN hoặc ROLE_STAFF.",
        "postconditions": "Bảng tổng quan đội xe hiển thị số liệu trực quan kèm bộ lọc theo trạm và trạng thái.",
        "main_flow": (
            "1. Người dùng mở trang `/admin/vehicles`.\n"
            "2. Frontend gửi HTTP GET tới `/api/vehicles?page=0&size=50`.\n"
            "3. Controller `VehicleController:getAllVehicles()` tiếp nhận.\n"
            "4. Service truy vấn bảng `vehicles` kết nối dữ liệu từ `charging_stations` và `co_ownership_groups`.\n"
            "5. Dữ liệu trả về danh sách xe: Biển số, Model (VF8/VF9), Mức pin hiện thời (SOC %), Trạng thái hoạt động, Tên nhóm đồng sở hữu gán kèm, Trạm hiện tại.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị danh sách thẻ xe dạng Grid hoặc bảng kèm màu sắc trạng thái chuẩn hóa."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể chuyển sang chế độ xem bản đồ để quan sát vị trí phân bố của toàn bộ đội xe tại các trạm thực địa."
        ),
        "exception_flow": (
            "Tại bước 4, nếu hệ thống chưa có phương tiện nào: Hiển thị giao diện rỗng kèm nút 'Thêm phương tiện mới'."
        ),
        "business_rules": "BR-SEC-03",
        "related_fr": "FR-ADM-01",
        "related_tc": "TC-ADM-02"
    },
    {
        "id": "UC-ADMIN-06",
        "name": "Quản lý thông tin phương tiện (Vehicle Management)",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Thêm mới phương tiện xe điện vào đội xe, cập nhật thông số kỹ thuật (dung lượng pin, số VIN, màu sơn, năm sản xuất, đường dẫn mô hình 3D GLB) hoặc ngưng vận hành xe.",
        "priority": "Cao (High)",
        "trigger": "Quản trị viên nhấn 'Thêm xe mới' hoặc 'Chỉnh sửa thông số xe'.",
        "preconditions": "Biển số xe và số khung VIN không bị trùng lặp trong CSDL.",
        "postconditions": "Tạo hoặc cập nhật bản ghi trong bảng `vehicles`.",
        "main_flow": (
            "1. Quản trị viên mở modal `VehicleEditModal.tsx`.\n"
            "2. Nhập các trường: Biển số xe, Mẫu xe (Model), Số VIN, Dung lượng pin danh định (82 kWh), Đơn giá mua xe ban đầu, Đường dẫn tệp 3D `/models/vf8.glb`.\n"
            "3. Nhấn 'Lưu phương tiện'. Frontend gửi HTTP POST (hoặc PATCH) tới `/api/vehicles`.\n"
            "4. Controller `VehicleController` tiếp nhận và kiểm tra tính duy nhất của biển số và VIN.\n"
            "5. Lưu bản ghi vào bảng `vehicles` kèm `created_at = NOW()`.\n"
            "6. Tự động khởi tạo kho năng lượng `vehicle_energy_inventories` cho xe mới với giá vốn WAC mặc định 3.850 đ/kWh.\n"
            "7. Máy chủ trả về HTTP 201 Created.\n"
            "8. Giao diện thông báo 'Thêm phương tiện mới thành công' và hiển thị xe trong danh sách đội xe."
        ),
        "alt_flow": (
            "Tại bước 4, nếu biển số xe đã tồn tại trong hệ thống: Trả về HTTP 409 Conflict kèm cảnh báo trùng lặp biển số."
        ),
        "exception_flow": (
            "Tại bước 2, nếu định dạng biển số không đúng quy chuẩn Việt Nam: Tầng DTO Validation ném lỗi 400 Bad Request."
        ),
        "business_rules": "BR-CHG-03, BR-SEC-02",
        "related_fr": "FR-ADM-01",
        "related_tc": "TC-ADM-02"
    },
    {
        "id": "UC-ADMIN-07",
        "name": "Quản lý nhóm đồng sở hữu và kiểm soát bất biến vốn",
        "primary_actor": "Quản trị viên hệ thống (ROLE_ADMIN)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kiểm toán vốn",
        "description": "Quản trị viên theo dõi toàn bộ các nhóm đồng sở hữu, thực thi công cụ kiểm tra tự động bất biến vốn (Equity Invariant Audit) trên toàn bộ các phương tiện, phát hiện và sửa chữa các sai lệch tỷ lệ nếu có.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên mở trang quản trị nhóm tại `/admin/co-ownership-groups`.",
        "preconditions": "Quản trị viên đăng nhập với quyền ADMIN.",
        "postconditions": "Hiển thị danh sách các nhóm và trạng thái toàn vẹn bất biến vốn 100.0000% của từng nhóm.",
        "main_flow": (
            "1. Quản trị viên mở trang `/admin/co-ownership-groups`.\n"
            "2. Frontend gửi HTTP GET tới `/api/admin/co-ownership-groups/audit-equity`.\n"
            "3. Controller tiếp nhận request.\n"
            "4. Service duyệt qua toàn bộ các nhóm sở hữu trong hệ thống, tính tổng `SUM(percentage)` của từng phương tiện trong bảng `ownership_shares`.\n"
            "5. Kiểm tra điều kiện: Nếu tổng khớp chính xác 100.0000% -> Đánh dấu 'VALID' (Hợp lệ); nếu khác 100.0000% -> Đánh dấu 'ANOMALY' (Bất thường).\n"
            "6. Máy chủ trả về HTTP 200 OK kèm danh sách phân tích toàn vẹn vốn.\n"
            "7. Giao diện hiển thị trạng thái của 100% các nhóm với nhãn xanh lá 'BẢO TOÀN VỐN 100%'."
        ),
        "alt_flow": (
            "Tại bước 5, nếu phát hiện một nhóm bị lệch do lỗi dữ liệu cũ (ví dụ 99.9999%): Quản trị viên có thể nhấn nút 'Tự động cân bằng vốn theo Hare-Niemeyer' để bù trừ phần dư vào cổ đông lớn nhất."
        ),
        "exception_flow": (
            "Tại bước 4, nếu CSDL bị nghẽn mạng: Hệ thống hiển thị cảnh báo timeout và cho phép thử lại."
        ),
        "business_rules": "BR-CO-01",
        "related_fr": "FR-CO-01, FR-ADM-01",
        "related_tc": "TC-ADM-03"
    },
    {
        "id": "UC-ADMIN-08",
        "name": "Xem chi tiết thành viên nhóm đồng sở hữu",
        "primary_actor": "Quản trị viên, Nhân viên điều phối",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Xem danh sách hồ sơ chi tiết của từng thành viên trong một nhóm xe cụ thể: ngày gia nhập, tỷ lệ cổ phần nắm giữ, quyền biểu quyết, lịch sử vi phạm và tổng số giờ đã đặt trong tháng.",
        "priority": "Trung bình (Medium)",
        "trigger": "Quản trị viên nhấp vào tên một nhóm sở hữu.",
        "preconditions": "Nhóm đồng sở hữu tồn tại trong CSDL.",
        "postconditions": "Hiển thị bảng chi tiết các thành viên của nhóm.",
        "main_flow": (
            "1. Quản trị viên mở chi tiết nhóm tại `/admin/groups/{groupId}`.\n"
            "2. Frontend gửi HTTP GET tới `/api/co-ownership-groups/{groupId}/members`.\n"
            "3. Controller `CoOwnershipController:getGroupMembers()` tiếp nhận.\n"
            "4. Service truy vấn bảng `co_ownership_members`, kết nối `users` và `ownership_shares`.\n"
            "5. Trả về danh sách thành viên kèm: Tên, Email, Số điện thoại, Vai trò trong nhóm (Trưởng nhóm / Cổ đông), Tỷ lệ phần trăm cổ phần, Điểm tín nhiệm.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị danh sách thành viên có ảnh đại diện và thông tin liên hệ."
        ),
        "alt_flow": (
            "Tại bước 7, quản trị viên có thể chỉ định một thành viên khác làm Trưởng nhóm mới nếu trưởng nhóm cũ rút lui."
        ),
        "exception_flow": (
            "Tại bước 2, nếu groupId không tồn tại: Trả về HTTP 404 Not Found."
        ),
        "business_rules": "BR-CO-02",
        "related_fr": "FR-CO-01",
        "related_tc": "TC-ADM-03"
    },
    {
        "id": "UC-ADMIN-09",
        "name": "Xem lịch sử biến động tỷ lệ sở hữu (Ownership History)",
        "primary_actor": "Quản trị viên hệ thống, Kiểm toán viên",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Truy xuất sổ cái lưu vết biến động cổ phần của toàn bộ hệ thống hoặc một xe cụ thể, chứng minh tính minh bạch và bất biến của các giao dịch chuyển nhượng.",
        "primary_actor": "Quản trị viên hệ thống",
        "priority": "Cao (Medium)",
        "trigger": "Quản trị viên chọn xem 'Nhật ký biến động sở hữu' tại `/admin/ownership-history`.",
        "preconditions": "Quản trị viên đăng nhập với quyền ADMIN.",
        "postconditions": "Bảng dữ liệu sổ cái biến động sở hữu được hiển thị chi tiết.",
        "main_flow": (
            "1. Quản trị viên mở trang `/admin/ownership-history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/admin/ownership-history?page=0&size=20`.\n"
            "3. Controller tiếp nhận và truy vấn bảng `ownership_change_history`.\n"
            "4. Dữ liệu trả về: Mã giao dịch, Xe liên quan, Bên bán, Bên mua, Tỷ lệ %, Giá trị thanh toán, Mã hợp đồng phụ lục, Thời điểm giao dịch.\n"
            "5. Máy chủ trả về HTTP 200 OK.\n"
            "6. Giao diện hiển thị dòng thời gian biến động cổ phần với tính năng tìm kiếm theo biển số xe."
        ),
        "alt_flow": (
            "Tại bước 6, quản trị viên có thể xuất báo cáo kiểm toán sở hữu ra tệp PDF có chữ ký số xác thực của hệ thống."
        ),
        "exception_flow": (
            "Tại bước 3, nếu có lỗi cơ sở dữ liệu: Hệ thống ghi log và trả về HTTP 500."
        ),
        "business_rules": "BR-CO-01, BR-SEC-02",
        "related_fr": "FR-CO-07",
        "related_tc": "TC-ADM-03"
    },
    {
        "id": "UC-ADMIN-10",
        "name": "Xem bảng điều khiển thống kê vận hành (Operational Analytics)",
        "primary_actor": "Quản trị viên cấp cao, Giám đốc điều hành",
        "secondary_actor": "Dịch vụ phân tích dữ liệu tổng hợp và CSDL",
        "description": "Hiển thị bảng điều khiển KPI tổng thể của toàn bộ nền tảng EVShare: tổng số km đã vận hành, tổng điện năng nạp/xả, tỷ lệ tận dụng xe (Fleet Utilization Rate), doanh thu dịch vụ, số lượng sự cố tranh chấp và tỷ lệ giải quyết thành công.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên đăng nhập và truy cập trang chủ Admin Dashboard tại `/admin/dashboard`.",
        "preconditions": "Tài khoản có quyền ROLE_ADMIN.",
        "postconditions": "Bảng điều khiển số liệu KPI thời gian thực được kết xuất hoàn chỉnh.",
        "main_flow": (
            "1. Quản trị viên mở trang `/admin/dashboard`.\n"
            "2. Giao diện gửi đồng thời các HTTP GET tới `/api/admin/dashboard/stats` và `/api/admin/financial-overview`.\n"
            "3. Controller `AdminController:getDashboardStats()` tiếp nhận.\n"
            "4. Dịch vụ phân tích tổng hợp dữ liệu từ các bảng `vehicles`, `bookings`, `trips`, `charging_sessions`, `expenses` và `disputes`.\n"
            "5. Dữ liệu trả về: Tổng số xe đang vận hành (50 xe), Tỷ lệ xe sẵn sàng (88%), Tổng số km đã chạy trong tháng (145.200 km), Tổng điện năng đã sạc (29.500 kWh), Doanh thu dịch vụ trạm sạc, Số vụ tranh chấp đang mở (2 vụ).\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị các thẻ KPI Cards nổi bật, biểu đồ đường doanh thu theo tuần, biểu đồ tròn phân bổ trạng thái đội xe và danh sách các cảnh báo cần xử lý khẩn cấp."
        ),
        "alt_flow": (
            "Tại bước 7, quản trị viên có thể thay đổi khoảng thời gian thống kê: 'Hôm nay', 'Tuần này', 'Tháng này' hoặc 'Tùy chỉnh'."
        ),
        "exception_flow": (
            "Tại bước 4, nếu một bảng dịch vụ phụ trợ phản hồi chậm: Hệ thống nạp trước các chỉ số khả dụng và hiển thị skeleton loading cho phần dữ liệu đang chờ."
        ),
        "business_rules": "BR-SEC-03",
        "related_fr": "FR-ADM-01, FR-ADM-04",
        "related_tc": "TC-ADM-04"
    },
    {
        "id": "UC-ADMIN-11",
        "name": "Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)",
        "primary_actor": "Quản trị viên an ninh thông tin (Security Admin)",
        "secondary_actor": "CSDL MySQL (Bảng audit_logs)",
        "description": "Quản trị viên tra cứu lịch sử toàn bộ các hành động nhạy cảm trên hệ thống: phân bổ lại cổ phần, gạch nợ chi phí, cấp quyền quản trị, xóa dữ liệu, đăng nhập thất bại. Bản ghi lưu trữ địa chỉ IP máy khách, người thực hiện, trạng thái dữ liệu trước và sau thao tác.",
        "priority": "Bắt buộc (High)",
        "trigger": "Quản trị viên mở tab 'Nhật ký kiểm toán' tại `/admin/audit-logs`.",
        "preconditions": "Quản trị viên đăng nhập với quyền ADMIN tối cao (BR-SEC-03).",
        "postconditions": "Bảng dữ liệu nhật ký kiểm toán bảo mật được hiển thị phân trang.",
        "main_flow": (
            "1. Quản trị viên mở trang `/admin/audit-logs`.\n"
            "2. Frontend gửi HTTP GET tới `/api/admin/audit-logs?page=0&size=25`.\n"
            "3. Controller `AdminController:getAuditLogs()` tiếp nhận.\n"
            "4. Service truy vấn bảng `audit_logs` sắp xếp giảm dần theo thời gian `created_at`.\n"
            "5. Dữ liệu trả về danh sách: Mã log, Thời điểm (UTC), Tác nhân (Actor Name, Email, Role), Hành động (CREATE, UPDATE, DELETE, VERIFY, ROLE_CHANGE), Tài nguyên tác động (RESOURCE_TYPE, RESOURCE_ID), Địa chỉ IP, Trạng thái trước (Previous State JSON), Trạng thái sau (New State JSON).\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng nhật ký an ninh, hỗ trợ nhấp vào một dòng để xem cửa sổ so sánh JSON Diff chi tiết giữa trạng thái cũ và mới."
        ),
        "alt_flow": (
            "Tại bước 7, quản trị viên có thể lọc nhật ký theo địa chỉ IP hoặc theo loại tài nguyên (ví dụ chỉ xem các log liên quan tới `OWNERSHIP_SHARE` hoặc `PERSONAL_PAYMENT`)."
        ),
        "exception_flow": (
            "Tại bước 3, nếu người dùng không có quyền ADMIN: Spring Security lập tức từ chối, trả về HTTP 403 Forbidden và tự động ghi một bản ghi cảnh báo truy cập trái phép vào `audit_logs`."
        ),
        "business_rules": "BR-SEC-02, BR-SEC-03",
        "related_fr": "FR-ADM-03",
        "related_tc": "TC-ADM-05"
    },

    # =========================================================================
    # 12. NOTIFICATIONS & AI ASSISTANT (3 UCs)
    # =========================================================================
    {
        "id": "UC-NOTI-01",
        "name": "Xem danh sách thông báo thời gian thực",
        "primary_actor": "Mọi người dùng đã đăng nhập",
        "secondary_actor": "Hệ thống CSDL và WebSocket Notification Service",
        "description": "Người dùng xem danh sách các thông báo nhận được: thông báo lịch đặt sắp diễn ra, thông báo sạc đầy pin, thông báo nợ chi phí mới, đề xuất biểu quyết mới, tin nhắn hòa giải mới.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấp vào biểu tượng Quả chuông trên thanh điều hướng đầu trang.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Mở danh sách thông báo nổi `NotificationDropdown.tsx` hiển thị số lượng chưa đọc.",
        "main_flow": (
            "1. Người dùng quan sát biểu tượng Quả chuông trên thanh điều hướng có huy hiệu số lượng thông báo chưa đọc (ví dụ: số 3 màu đỏ).\n"
            "2. Người dùng nhấp vào biểu tượng Quả chuông.\n"
            "3. Giao diện mở menu thả xuống `NotificationDropdown.tsx` và gửi HTTP GET tới `/api/notifications?page=0&size=10`.\n"
            "4. Controller `NotificationController:getNotifications()` tiếp nhận.\n"
            "5. Service truy vấn bảng `notifications` lọc theo `user_id` sắp xếp giảm dần theo thời gian tạo.\n"
            "6. Danh sách trả về: Tiêu đề, Nội dung tóm tắt, Loại thông báo (BOOKING, CHARGING, EXPENSE, VOTING, DISPUTE), Trạng thái đã đọc (isRead), Đường dẫn điều hướng liên kết.\n"
            "7. Máy chủ trả về HTTP 200 OK.\n"
            "8. Giao diện hiển thị danh sách các mục thông báo kèm biểu tượng màu sắc trực quan."
        ),
        "alt_flow": (
            "Tại bước 8, người dùng nhấp vào một thông báo cụ thể: Hệ thống tự động đánh dấu thông báo đó đã đọc và điều hướng màn hình tới đúng trang nghiệp vụ tương ứng (ví dụ nhấp vào thông báo biểu quyết thì mở thẳng trang đề xuất)."
        ),
        "exception_flow": (
            "Tại bước 5, nếu người dùng không có thông báo nào: Hiển thị thông báo 'Bạn không có thông báo mới'."
        ),
        "business_rules": "BR-SEC-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-REG-23"
    },
    {
        "id": "UC-NOTI-02",
        "name": "Đánh dấu thông báo đã đọc",
        "primary_actor": "Người dùng đang đăng nhập",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng đánh dấu một thông báo hoặc toàn bộ danh sách thông báo là đã đọc để xóa huy hiệu số đỏ trên thanh điều hướng.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng nhấp vào nút 'Đánh dấu tất cả đã đọc' trên bảng thông báo.",
        "preconditions": "Có ít nhất một thông báo ở trạng thái chưa đọc (is_read = false).",
        "postconditions": "Cập nhật `notifications.is_read = true`, huy hiệu số đếm trên thanh điều hướng trở về 0.",
        "main_flow": (
            "1. Người dùng mở bảng thông báo và nhấn nút 'Đánh dấu tất cả đã đọc'.\n"
            "2. Frontend gửi HTTP PATCH tới `/api/notifications/read-all` kèm Bearer Token.\n"
            "3. Controller `NotificationController:markAllAsRead()` tiếp nhận.\n"
            "4. Service cập nhật trường `is_read = true`, `read_at = NOW()` cho toàn bộ thông báo của `user_id` hiện tại.\n"
            "5. Máy chủ trả về HTTP 200 OK.\n"
            "6. Giao diện chuyển toàn bộ các dòng thông báo sang màu nền đọc rồi và ẩn huy hiệu số đỏ trên biểu tượng Quả chuông."
        ),
        "alt_flow": (
            "Tại bước 1, người dùng có thể nhấp vào nút 'Xóa thông báo' để xóa vĩnh viễn các thông báo cũ khỏi danh sách."
        ),
        "exception_flow": (
            "Tại bước 3, nếu phiên đăng nhập hết hạn: Trả về HTTP 401 Unauthorized."
        ),
        "business_rules": "BR-SEC-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-REG-23"
    },
    {
        "id": "UC-NOTI-03",
        "name": "Tra cứu quy chế và đối thoại với Trợ lý ảo AI",
        "primary_actor": "Đồng sở hữu, Người dùng mới",
        "secondary_actor": "AI Assistant Service (Google Gemini / RAG Engine) & CSDL",
        "description": "Người dùng mở cửa sổ chat trợ lý ảo AI để đặt câu hỏi về quy chế vận hành xe, cách tính tiền điện WAC, thủ tục chuyển nhượng cổ phần hoặc giải đáp thắc mắc bảo dưỡng; Trợ lý ảo AI phân tích ngữ cảnh và trả lời chính xác theo tài liệu quy chế.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng nhấp vào biểu tượng Trợ lý AI (AI Zone) nổi ở góc màn hình.",
        "preconditions": "Dịch vụ AI Backend đang hoạt động bình thường.",
        "postconditions": "Nhận được câu trả lời chính xác, thông minh trích dẫn từ quy chế nhóm.",
        "main_flow": (
            "1. Người dùng nhấp vào biểu tượng Bot trợ lý ảo tại góc phải dưới màn hình.\n"
            "2. Mở cửa sổ chat `AiZonePanel.tsx`.\n"
            "3. Người dùng nhập câu hỏi: 'Nếu tôi đi chuyến đi bị trễ 30 phút thì bị phạt bao nhiêu tiền và cách giải quyết thế nào?'.\n"
            "4. Nhấn nút Gửi. Frontend gửi HTTP POST tới `/api/ai/chat` kèm payload `{prompt: '...', context: 'GROUP_REGULATIONS'}`.\n"
            "5. Controller `AiAssistantController:chat()` tiếp nhận.\n"
            "6. `AiAssistantService` nạp tài liệu quy chế nội bộ nhóm xe, trích xuất quy tắc `BR-DISP-01` về phạt trễ giờ trả xe xâm lấn (100.000 đ cho mỗi 30 phút).\n"
            "7. Mô hình AI sinh câu trả lời giải thích chi tiết, thân thiện và hướng dẫn các bước mở tính năng đàm phán gia hạn (UC-TRIP-06).\n"
            "8. Máy chủ trả về HTTP 200 OK kèm nội dung phản hồi định dạng Markdown.\n"
            "9. Cửa sổ chat hiển thị câu trả lời với hiệu ứng gõ chữ (Streaming Effect) và đính kèm nút bấm liên kết nhanh tới tính năng liên quan."
        ),
        "alt_flow": (
            "Tại bước 6, nếu câu hỏi của người dùng hỏi về số dư nợ hoặc lịch xe cá nhân: Dịch vụ AI truy vấn thông tin an toàn từ CSDL của người dùng đó và trả lời số liệu cá nhân chính xác."
        ),
        "exception_flow": (
            "Tại bước 5, nếu dịch vụ AI bị Timeout hoặc quá tải: Hệ thống kích hoạt phương án dự phòng (Fallback) hiển thị các câu hỏi thường gặp (FAQ) được biên soạn sẵn."
        ),
        "business_rules": "BR-DISP-01, BR-SEC-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-REG-27"
    }
]

print(f"Loaded {len(UCS_VOTE_ADMIN_NOTI)} use cases in Part 2b.")
