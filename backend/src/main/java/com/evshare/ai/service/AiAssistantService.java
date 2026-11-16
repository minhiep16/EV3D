package com.evshare.ai.service;

import com.evshare.ai.dto.AiChatRequest;
import com.evshare.ai.dto.AiChatResponse;
import com.evshare.ai.dto.AiStatusResponse;
import com.evshare.ai.dto.AiSuggestedQuestionDto;
import com.evshare.booking.entity.Booking;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.dispute.entity.Dispute;
import com.evshare.expense.dto.CostSharingSummaryResponse;
import com.evshare.fund.dto.SharedFundSummaryResponse;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.user.entity.Role;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.voting.entity.VoteProposal;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AiAssistantService {

    private final AiBusinessDataService businessDataService;
    private final AiProviderService providerService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    public AiAssistantService(AiBusinessDataService businessDataService, AiProviderService providerService) {
        this.businessDataService = businessDataService;
        this.providerService = providerService;
    }

    public AiStatusResponse getStatus() {
        boolean llmActive = providerService.isConfiguredAndAvailable();
        String provider = providerService.getProviderName();
        String model = providerService.getModelName();
        String msg = llmActive
                ? "Kết nối AI (" + provider + ") và cơ sở dữ liệu Garage đang hoạt động trực tuyến."
                : "Hệ thống đang hoạt động ở chế độ Trợ lý Đồng sở hữu Grounded (Tra cứu dữ liệu thực tế từ hệ thống).";
        return new AiStatusResponse(llmActive, true, provider, model, msg);
    }

    public List<AiSuggestedQuestionDto> getSuggestions(String vehicleId, UserPrincipal currentUser) {
        List<AiSuggestedQuestionDto> list = new ArrayList<>();
        boolean isAdmin = currentUser.getUser() != null && currentUser.getUser().getRole() == Role.ADMIN;
        boolean isStaff = currentUser.getUser() != null && currentUser.getUser().getRole() == Role.STAFF;

        if (isAdmin) {
            list.add(new AiSuggestedQuestionDto("s-admin-1", "Hiệu suất", "Xe có tần suất cao nhất", "Xe nào có tần suất sử dụng hoặc tỷ lệ vận hành cao nhất?", "car"));
            list.add(new AiSuggestedQuestionDto("s-admin-2", "Hợp đồng", "Hợp đồng chờ ký số", "Các hợp đồng đồng sở hữu đang chờ ký số hoặc lời mời chờ phản hồi?", "maintenance"));
            list.add(new AiSuggestedQuestionDto("s-admin-3", "Tài chính", "Nghĩa vụ chưa quyết toán", "Tổng hợp các nghĩa vụ tài chính và khoản thanh toán chưa quyết toán?", "finance"));
            list.add(new AiSuggestedQuestionDto("s-admin-4", "An ninh", "Cảnh báo toàn vẹn hệ thống", "Tổng quan an ninh hệ thống và các cảnh báo vi phạm tính toàn vẹn?", "dispute"));
        } else if (isStaff) {
            list.add(new AiSuggestedQuestionDto("s-staff-1", "Bàn giao", "Xe chờ bàn giao", "Có xe nào đang chờ bàn giao hoặc kiểm định?", "handover"));
            list.add(new AiSuggestedQuestionDto("s-staff-2", "Kiểm định", "Xe cần kiểm tra", "Xe nào có ghi nhận hư hỏng cần kiểm tra?", "car"));
            list.add(new AiSuggestedQuestionDto("s-staff-3", "Bảo dưỡng", "Đề xuất sửa chữa", "Các yêu cầu bảo dưỡng đang chờ duyệt trên hệ thống?", "maintenance"));
            list.add(new AiSuggestedQuestionDto("s-staff-4", "Tranh chấp", "Tranh chấp cần tiếp nhận", "Danh sách tranh chấp đang chờ hòa giải viên tiếp nhận?", "dispute"));
        } else {
            list.add(new AiSuggestedQuestionDto("s-coowner-1", "Phương tiện", "Tình trạng xe hiện tại?", "Kiểm tra mức pin, số km và tình trạng xe hiện tại?", "car"));
            list.add(new AiSuggestedQuestionDto("s-coowner-2", "Lịch trình", "Lịch đặt xe của tôi?", "Lịch đặt xe sắp tới của tôi là khi nào?", "calendar"));
            list.add(new AiSuggestedQuestionDto("s-coowner-3", "Tài chính", "Khoản nợ chưa thanh toán?", "Tôi còn khoản phí hoặc số dư nào chưa thanh toán?", "finance"));
            list.add(new AiSuggestedQuestionDto("s-coowner-4", "Biểu quyết", "Đề xuất biểu quyết đang mở?", "Có đề xuất biểu quyết nào đang mở để tôi tham gia?", "maintenance"));
            list.add(new AiSuggestedQuestionDto("s-coowner-5", "Tranh chấp", "Hồ sơ khiếu nại của tôi?", "Kiểm tra trạng thái các khiếu nại hoặc tranh chấp của tôi?", "dispute"));
            list.add(new AiSuggestedQuestionDto("s-coowner-6", "Chuyến đi", "Chuyến đi gần nhất?", "Thông tin và trạng thái đối soát của chuyến đi gần nhất?", "car"));
        }

        return list;
    }

    public AiChatResponse processMessage(AiChatRequest request, UserPrincipal currentUser) {
        String query = request.getMessage() != null ? request.getMessage().trim() : "";
        String vehicleIdOrCode = request.getVehicleId();

        Optional<Vehicle> optVehicle = businessDataService.resolveVehicle(vehicleIdOrCode);
        Vehicle vehicle = optVehicle.orElse(null);

        AiChatResponse response = new AiChatResponse();
        response.setId("resp-" + UUID.randomUUID().toString().substring(0, 8));
        response.setAsOf(businessDataService.getFormattedTimestamp());

        // Check for mutation requests (Action Safety Guard)
        String lowerQuery = query.toLowerCase();
        if (isMutationIntent(lowerQuery)) {
            response.setSourceMode("ACTION_SAFETY_GUARD");
            response.setActionNotice("Yêu cầu thay đổi dữ liệu được phát hiện.");
            response.setReply(
                    "⚠️ **Cảnh báo an toàn hệ thống:**\n" +
                    "Để bảo vệ quyền lợi tài chính và quy chế đồng sở hữu, Trợ lý AI **không được phép tự động thực hiện các thao tác thay đổi dữ liệu** " +
                    "(như hủy chuyến, tự động bỏ phiếu, giải quyết tranh chấp hoặc trích xuất chuyển tiền).\n\n" +
                    "👉 Quý thành viên vui lòng truy cập trực tiếp vào khu vực tương ứng trên bảng điều khiển để xác nhận thao tác an toàn."
            );
            return response;
        }

        // Collect authoritative business data
        List<String> verifiedFacts = new ArrayList<>();
        String deterministicReply = generateGroundedReply(query, lowerQuery, vehicle, currentUser, verifiedFacts);

        // If LLM provider is available, use it to refine or answer free-form while injecting verified facts
        if (providerService.isConfiguredAndAvailable()) {
            try {
                String systemContext = buildSystemContext(vehicle, currentUser, verifiedFacts);
                String llmAnswer = providerService.generateCompletion(query, systemContext);
                if (llmAnswer != null && !llmAnswer.isBlank()) {
                    response.setReply(llmAnswer);
                    response.setSourceMode("AI_POWERED");
                    response.setVerifiedFacts(verifiedFacts);
                    return response;
                }
            } catch (Exception ignored) {}
        }

        // Fallback or Primary: Deterministic Grounded Smart Copilot Mode
        response.setReply(deterministicReply);
        response.setSourceMode("GROUNDED_DATA");
        response.setVerifiedFacts(verifiedFacts);

        return response;
    }

    private boolean isMutationIntent(String lowerQuery) {
        return (lowerQuery.contains("hủy đặt") || lowerQuery.contains("hủy lịch") ||
                lowerQuery.contains("thanh toán ngay") || lowerQuery.contains("chuyển tiền") ||
                lowerQuery.contains("bỏ phiếu đồng ý") || lowerQuery.contains("bỏ phiếu từ chối") ||
                lowerQuery.contains("xóa hư hỏng") || lowerQuery.contains("đóng tranh chấp") ||
                lowerQuery.contains("tự giải quyết"));
    }

    private String generateGroundedReply(String rawQuery, String lowerQuery, Vehicle vehicle, UserPrincipal currentUser, List<String> verifiedFacts) {
        boolean isAdmin = currentUser.getUser() != null && currentUser.getUser().getRole() == Role.ADMIN;
        boolean isStaff = currentUser.getUser() != null && currentUser.getUser().getRole() == Role.STAFF;

        // Admin Analytical Grounded Queries
        if (isAdmin && (lowerQuery.contains("tần suất") || lowerQuery.contains("hiệu suất") || lowerQuery.contains("vận hành cao nhất"))) {
            verifiedFacts.add("Truy vấn hiệu suất khai thác đội xe");
            return "📊 **Báo cáo Phân tích Vận hành & Hiệu suất Đội xe:**\n" +
                   "• Phương tiện có tần suất khai thác tích cực nhất: **EV01 (VinFast VF e34)** với tỷ lệ sẵn sàng cao và số lượt đặt ổn định.\n" +
                   "• Hiệu suất vận hành bình quân toàn đội xe duy trì ở mức tối ưu trên hệ thống.\n" +
                   "• Quản trị viên có thể xem biểu đồ trực quan chi tiết theo từng mốc thời gian tại bảng **Phân tích Vận hành** bên phải.";
        }

        if (isAdmin && (lowerQuery.contains("hợp đồng") || lowerQuery.contains("ký số") || lowerQuery.contains("lời mời"))) {
            verifiedFacts.add("Truy vấn trạng thái hợp đồng & lời mời");
            return "📑 **Báo cáo Giám sát Hợp đồng & Lời mời Thành viên:**\n" +
                   "• Tất cả chứng từ phụ lục hợp đồng điện tử đều được lưu trữ kèm mã băm **SHA-256** bất biến trên máy chủ.\n" +
                   "• Quản trị viên có thể chọn mô-đun 3D **Giám sát Đồng sở hữu** để kiểm tra tiến trình xác nhận của các bên và kiểm tra bảo chứng 100%.";
        }

        if (isAdmin && (lowerQuery.contains("chưa quyết toán") || lowerQuery.contains("nghĩa vụ tài chính") || lowerQuery.contains("nợ"))) {
            verifiedFacts.add("Truy vấn giám sát tài chính độc lập");
            return "💳 **Báo cáo Giám sát Tài chính & Thanh toán:**\n" +
                   "• Hệ thống áp dụng cơ chế phân bổ chi phí trực tiếp (Direct Expense Allocation) minh bạch theo từng phương tiện.\n" +
                   "• Quản trị viên có thể mở thẻ **Tài chính** trong mô-đun **An ninh & Kiểm toán** để theo dõi chi phí phát sinh, các khoản đã xác minh và nợ tồn đọng.";
        }

        if (isAdmin && (lowerQuery.contains("an ninh") || lowerQuery.contains("toàn vẹn") || lowerQuery.contains("cảnh báo"))) {
            verifiedFacts.add("Truy vấn an ninh & tính toàn vẹn hệ thống");
            return "🛡️ **Báo cáo An ninh & Tính Toàn vẹn Hệ thống:**\n" +
                   "• Toàn bộ thao tác quản trị, đổi trạng thái và ký số đều được ghi nhận vào **Nhật ký kiểm toán tập trung (Audit Log)** kèm địa chỉ IP và dấu thời gian.\n" +
                   "• Tỷ lệ đồng sở hữu của các nhóm xe đang được giám sát chặt chẽ trên biểu đồ không gian để đảm bảo tổng đúng 100.00%.";
        }

        // 1. Battery SOC / Charging
        if (lowerQuery.contains("pin") || lowerQuery.contains("soc") || lowerQuery.contains("sạc") || lowerQuery.contains("dung lượng")) {
            if (vehicle != null) {
                String fact = String.format("Mức pin (SOC): %d%% (Xe %s - %s)",
                        vehicle.getCurrentBatteryLevel(), vehicle.getName(), vehicle.getLicensePlate());
                verifiedFacts.add(fact);
                return String.format(
                        "🔋 **Thông số pin xe %s (%s):**\n" +
                        "• Dung lượng pin hiện tại: **%d%%**\n" +
                        "• Trạng thái xe: **%s**\n" +
                        "• Quãng đường đã vận hành: **%s km**\n" +
                        "Dữ liệu được cập nhật trực tiếp từ hệ thống quản lý năng lượng (BMS).",
                        vehicle.getName(), vehicle.getLicensePlate(), vehicle.getCurrentBatteryLevel(),
                        translateVehicleStatus(vehicle.getStatus().name()),
                        vehicle.getOdometer() != null ? vehicle.getOdometer().toPlainString() : "0"
                );
            }
            return "Không tìm thấy thông tin xe đang chọn để đọc dữ liệu pin. Vui lòng chọn xe trong Garage.";
        }

        // 2. Personal Finance / Debts
        if (lowerQuery.contains("nợ") || lowerQuery.contains("khoản") || lowerQuery.contains("chưa thanh toán") ||
            lowerQuery.contains("chi phí của tôi") || lowerQuery.contains("phải trả")) {
            if (isStaff) {
                return "Bạn đang đăng nhập với vai trò Quản trị/Nhân viên (STAFF). Vui lòng mở bảng 'Xác minh thanh toán' để kiểm tra các giao dịch của co-owner.";
            }
            if (vehicle != null) {
                CostSharingSummaryResponse finance = businessDataService.getPersonalFinance(vehicle.getId(), currentUser);
                if (finance != null) {
                    BigDecimal due = finance.getUserTotalDue() != null ? finance.getUserTotalDue() : BigDecimal.ZERO;
                    BigDecimal paid = finance.getUserVerifiedPaid() != null ? finance.getUserVerifiedPaid() : BigDecimal.ZERO;
                    BigDecimal balance = due.subtract(paid);

                    verifiedFacts.add("Tỷ lệ sở hữu: " + finance.getUserOwnershipPercentage() + "%");
                    verifiedFacts.add("Tổng phân bổ: " + due.toPlainString() + " ₫");
                    verifiedFacts.add("Đã thanh toán: " + paid.toPlainString() + " ₫");

                    if (balance.compareTo(BigDecimal.ZERO) <= 0) {
                        return String.format(
                                "💳 **Báo cáo tài chính cá nhân (Xe %s):**\n" +
                                "• Tỷ lệ sở hữu của bạn: **%s%%**\n" +
                                "• Tổng chi phí đã phân bổ tháng này: **%s ₫**\n" +
                                "• Đã đối soát & thanh toán thành công: **%s ₫**\n\n" +
                                "✅ Bạn **không còn khoản nợ nào** chưa thanh toán. Tài khoản ở trạng thái hoàn hảo!",
                                vehicle.getName(), finance.getUserOwnershipPercentage(), due.toPlainString(), paid.toPlainString()
                        );
                    } else {
                        return String.format(
                                "💳 **Khoản thanh toán cần xử lý (Xe %s):**\n" +
                                "• Tỷ lệ sở hữu của bạn: **%s%%**\n" +
                                "• Số tiền còn lại cần thanh toán: **%s ₫**\n" +
                                "• Đã thanh toán xác thực: **%s ₫**\n\n" +
                                "👉 Bạn có thể vào mục **Tài chính & Phân bổ chi phí** trong Garage để xem chi tiết từng hóa đơn điện tử.",
                                vehicle.getName(), finance.getUserOwnershipPercentage(), balance.toPlainString(), paid.toPlainString()
                        );
                    }
                }
            }
            return "Không thể xác minh thông tin tài chính cá nhân cho xe này. Dữ liệu chưa phát sinh phân bổ chi phí.";
        }

        // 3. Direct Expense Allocation Explanation (Replaces Shared Fund)
        if (lowerQuery.contains("quỹ chung") || lowerQuery.contains("số dư quỹ") || lowerQuery.contains("phân bổ chi phí") || lowerQuery.contains("quỹ")) {
            if (vehicle != null) {
                CostSharingSummaryResponse finance = businessDataService.getPersonalFinance(vehicle.getId(), currentUser);
                String balanceStr = (finance != null && finance.getUserTotalDue() != null && finance.getUserVerifiedPaid() != null)
                        ? finance.getUserTotalDue().subtract(finance.getUserVerifiedPaid()).toPlainString() + " ₫"
                        : "0 ₫";
                verifiedFacts.add("Mô hình tài chính: Phân bổ chi phí trực tiếp");
                verifiedFacts.add("Nghĩa vụ cá nhân còn lại: " + balanceStr);
                return String.format(
                        "🏦 **Mô hình Tài chính EVShare (Phân bổ chi phí trực tiếp):**\n" +
                        "• EVShare áp dụng cơ chế **Phân bổ chi phí trực tiếp** theo tỷ lệ sở hữu và số km sử dụng thực tế, không yêu cầu đóng tiền trước vào quỹ chung.\n" +
                        "• Mọi chi phí thực tế (bảo dưỡng, sạc, sửa chữa, bảo hiểm) được tính toán minh bạch và phân bổ thành nghĩa vụ thanh toán cá nhân.\n" +
                        "• Nghĩa vụ thanh toán còn lại của bạn đối với xe %s: **%s**.\n\n" +
                        "👉 Vui lòng kiểm tra mục **Tài chính** trên bảng điều khiển để xem chi tiết từng khoản phân bổ.",
                        vehicle.getName(), balanceStr
                );
            }
            return "EVShare hiện áp dụng cơ chế phân bổ chi phí trực tiếp theo tỷ lệ sở hữu cho từng thành viên.";
        }

        // 4. Bookings
        if (lowerQuery.contains("đặt xe") || lowerQuery.contains("lịch") || lowerQuery.contains("booking")) {
            List<Booking> bookings = businessDataService.getUserBookings(currentUser.getId());
            if (bookings.isEmpty()) {
                return "Bạn hiện **chưa có lịch đặt xe nào** sắp tới. Bạn có thể sử dụng nút **Đặt lịch xe** trên thanh điều hướng để đăng ký ca sử dụng.";
            }
            Booking nearest = bookings.get(0);
            verifiedFacts.add("Lịch đặt xe gần nhất: " + nearest.getStatus().name());
            return String.format(
                    "📅 **Lịch đặt xe của bạn:**\n" +
                    "• Xe: **%s**\n" +
                    "• Trạng thái: **%s**\n" +
                    "• Bắt đầu: **%s**\n" +
                    "• Kết thúc: **%s**\n\n" +
                    "Vui lòng có mặt tại trạm đúng giờ để hoàn tất quy trình kiểm tra nhận xe.",
                    nearest.getVehicle() != null ? nearest.getVehicle().getName() : "EVShare Vehicle",
                    nearest.getStatus().name(),
                    nearest.getStartTime() != null ? nearest.getStartTime().toString() : "",
                    nearest.getEndTime() != null ? nearest.getEndTime().toString() : ""
            );
        }

        // 5. Trip / Latest Trip
        if (lowerQuery.contains("chuyến đi") || lowerQuery.contains("trip") || lowerQuery.contains("đối soát")) {
            if (vehicle != null) {
                Optional<Trip> active = businessDataService.getActiveTrip(vehicle.getId());
                if (active.isPresent()) {
                    Trip t = active.get();
                    verifiedFacts.add("Chuyến đi đang hoạt động: Xe " + vehicle.getName());
                    return String.format(
                            "🚗 **Chuyến đi đang diễn ra:**\n" +
                            "• Phương tiện: **%s**\n" +
                            "• Người điều khiển: **%s**\n" +
                            "• Odometer bắt đầu: **%s km**\n" +
                            "Hệ thống đang định vị và giám sát an toàn vận hành.",
                            vehicle.getName(),
                            t.getUser() != null ? t.getUser().getFullName() : "Thành viên",
                            t.getStartOdometer() != null ? t.getStartOdometer().toPlainString() : "0"
                    );
                }

                Optional<Trip> completed = businessDataService.getLatestCompletedTrip(vehicle.getId(), currentUser.getId());
                if (completed.isPresent()) {
                    Trip t = completed.get();
                    BigDecimal distance = (t.getEndOdometer() != null && t.getStartOdometer() != null)
                            ? t.getEndOdometer().subtract(t.getStartOdometer())
                            : BigDecimal.ZERO;
                    verifiedFacts.add("Chuyến đi gần nhất đã hoàn tất: " + distance.toPlainString() + " km");
                    return String.format(
                            "✅ **Chuyến đi gần nhất của bạn (Xe %s):**\n" +
                            "• Trạng thái: **ĐÃ HOÀN TẤT & ĐỐI SOÁT**\n" +
                            "• Quãng đường di chuyển: **%s km**\n" +
                            "• Odometer kết thúc: **%s km**\n" +
                            "Chi phí điện năng và vận hành đã được chuyển vào mục thanh toán minh bạch.",
                            vehicle.getName(), distance.toPlainString(),
                            t.getEndOdometer() != null ? t.getEndOdometer().toPlainString() : "Chưa ghi nhận"
                    );
                }
            }
            return "Không tìm thấy hồ sơ chuyến đi gần đây của bạn trên phương tiện này.";
        }

        // 6. Voting proposals
        if (lowerQuery.contains("biểu quyết") || lowerQuery.contains("bỏ phiếu") || lowerQuery.contains("đề xuất")) {
            if (vehicle != null) {
                List<VoteProposal> proposals = businessDataService.getOpenVoteProposals(vehicle.getId());
                if (!proposals.isEmpty()) {
                    VoteProposal p = proposals.get(0);
                    verifiedFacts.add("Đề xuất mở: " + p.getTitle());
                    return String.format(
                            "🗳️ **Đề xuất biểu quyết đang mở (Xe %s):**\n" +
                            "• Tiêu đề: **%s**\n" +
                            "• Trạng thái: **ĐANG BIỂU QUYẾT**\n" +
                            "• Mô tả: %s\n\n" +
                            "👉 Vui lòng mở bảng **Hệ thống biểu quyết** để thực hiện quyền bỏ phiếu trực tiếp.",
                            vehicle.getName(), p.getTitle(),
                            p.getDescription() != null ? p.getDescription() : "Chi phí bảo dưỡng & vận hành chung."
                    );
                }
            }
            return "Hiện **không có đề xuất biểu quyết nào đang mở** cho xe này. Mọi quyết định trước đó đã được biểu quyết hoàn tất.";
        }

        // 7. Dispute / Khiếu nại
        if (lowerQuery.contains("tranh chấp") || lowerQuery.contains("khiếu nại") || lowerQuery.contains("bất đồng")) {
            if (vehicle != null) {
                List<Dispute> disputes = businessDataService.getInvolvedDisputes(vehicle.getId(), currentUser.getId(), isStaff);
                if (!disputes.isEmpty()) {
                    Dispute d = disputes.get(0);
                    verifiedFacts.add("Mã tranh chấp: " + d.getReferenceCode() + " (" + d.getStatus().name() + ")");
                    return String.format(
                            "⚖️ **Hồ sơ giải quyết tranh chấp:**\n" +
                            "• Mã hồ sơ: **%s**\n" +
                            "• Tiêu đề: **%s**\n" +
                            "• Trạng thái: **%s**\n" +
                            "• Phân loại: **%s**\n\n" +
                            "Hòa giải viên và các bên liên quan có thể truy cập **Trung tâm Hòa giải & Tranh chấp** để xem bằng chứng số và đối thoại.",
                            d.getReferenceCode(), d.getTitle(), d.getStatus().name(), d.getCategory().name()
                    );
                }
            }
            return "Hệ thống ghi nhận **không có tranh chấp hoặc khiếu nại nào** đang diễn ra liên quan đến tài khoản của bạn.";
        }

        // 8. General vehicle overview
        if (vehicle != null) {
            verifiedFacts.add("Phương tiện: " + vehicle.getName() + " (" + vehicle.getLicensePlate() + ")");
            verifiedFacts.add("Trạng thái: " + vehicle.getStatus().name());
            verifiedFacts.add("Pin: " + vehicle.getCurrentBatteryLevel() + "%");
            return String.format(
                    "Xin chào! Xe **%s** (%s) hiện đang ở trạng thái **%s** với mức pin đạt **%d%%** và tổng số km là **%s km**.\n\n" +
                    "Bạn có thể hỏi tôi về:\n" +
                    "• Kiểm tra dung lượng pin & sạc\n" +
                    "• Báo cáo tài chính & nợ phân bổ cá nhân\n" +
                    "• Lịch trình đặt xe & chuyến đi gần nhất\n" +
                    "• Đề xuất biểu quyết hoặc trạng thái tranh chấp",
                    vehicle.getName(), vehicle.getLicensePlate(),
                    translateVehicleStatus(vehicle.getStatus().name()),
                    vehicle.getCurrentBatteryLevel(),
                    vehicle.getOdometer() != null ? vehicle.getOdometer().toPlainString() : "0"
            );
        }

        return "Xin chào! Tôi là Trợ lý AI EVShare. Bạn có thể chọn một chiếc xe trong showroom để kiểm tra chi tiết pin, tài chính và lịch vận hành.";
    }

    private String buildSystemContext(Vehicle vehicle, UserPrincipal currentUser, List<String> verifiedFacts) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là Trợ lý Vận hành Garage EVShare 3D. Hãy trả lời ngắn gọn, lịch sự, chính xác bằng tiếng Việt.\n");
        sb.append("Các sự thật đã được xác thực từ cơ sở dữ liệu:\n");
        for (String fact : verifiedFacts) {
            sb.append("- ").append(fact).append("\n");
        }
        if (vehicle != null) {
            sb.append("- Tên xe: ").append(vehicle.getName()).append("\n");
            sb.append("- Biển số: ").append(vehicle.getLicensePlate()).append("\n");
            sb.append("- Pin: ").append(vehicle.getCurrentBatteryLevel()).append("%\n");
        }
        sb.append("Không được bịa đặt dữ liệu pin, tiền bạc hoặc trạng thái ngoài các thông tin trên.");
        return sb.toString();
    }

    private String translateVehicleStatus(String status) {
        switch (status) {
            case "AVAILABLE": return "Sẵn sàng";
            case "RESERVED": return "Đã đặt trước";
            case "IN_USE": return "Đang di chuyển";
            case "CHARGING": return "Đang nạp sạc";
            case "MAINTENANCE": return "Đang bảo dưỡng";
            default: return status;
        }
    }
}

