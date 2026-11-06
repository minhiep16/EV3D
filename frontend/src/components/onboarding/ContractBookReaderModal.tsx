import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Calendar,
  DollarSign,
  Car,
  Users,
} from 'lucide-react';

export interface ContractCoOwnerItem {
  name: string;
  email: string;
  sharePercentage: number;
  isRepresentative?: boolean;
}

export interface ContractBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteReview: () => void;
  model: string;
  brand?: string;
  plateNumber: string;
  vin: string;
  batteryKwh: number;
  exteriorColor: string;
  manufactureYear: string | number;
  vehicleValue: number;
  registrationCity: string;
  groupName: string;
  coOwners: ContractCoOwnerItem[];
  totalSharePercentage: number;
  maxConsecutiveDays: number;
  monthlyFund: number;
  maintenanceReservePercent: number;
  maintenanceReserveAmount: number;
  latePaymentFeePercent: number;
  votingRuleLabel: string;
}

export const ContractBookReaderModal: React.FC<ContractBookReaderModalProps> = ({
  isOpen,
  onClose,
  onCompleteReview,
  model,
  brand,
  plateNumber,
  vin,
  batteryKwh,
  exteriorColor,
  manufactureYear,
  vehicleValue,
  registrationCity,
  groupName,
  coOwners,
  totalSharePercentage,
  maxConsecutiveDays,
  monthlyFund,
  maintenanceReservePercent,
  maintenanceReserveAmount,
  latePaymentFeePercent,
  votingRuleLabel,
}) => {
  const TOTAL_PAGES = 4;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modalPhase, setModalPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  const [isMobileView, setIsMobileView] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Responsive listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  // Modal open / close lifecycle
  useEffect(() => {
    if (!isOpen) {
      setModalPhase('closed');
      return;
    }

    setCurrentPage(1);
    if (prefersReducedMotion) {
      setModalPhase('open');
      return;
    }

    setModalPhase('opening');
    const timer = window.setTimeout(() => setModalPhase('open'), 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, prefersReducedMotion]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (prefersReducedMotion) {
      onClose();
      return;
    }
    setModalPhase('closing');
    window.setTimeout(() => {
      onClose();
    }, 200);
  }, [prefersReducedMotion, onClose]);

  const handleFinishReview = useCallback(() => {
    if (prefersReducedMotion) {
      onCompleteReview();
      return;
    }
    setModalPhase('closing');
    window.setTimeout(() => {
      onCompleteReview();
    }, 200);
  }, [prefersReducedMotion, onCompleteReview]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(TOTAL_PAGES, prev + 1));
  }, [TOTAL_PAGES]);

  // Keyboard navigation: ArrowLeft, ArrowRight, Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleNextPage, handlePrevPage]);

  if (!isOpen || typeof document === 'undefined') return null;

  const formattedToday = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < TOTAL_PAGES;

  // Render content of specific page (1 to 4)
  const renderPageContent = (pageNumber: number) => {
    switch (pageNumber) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Formal National Header */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(0, 158, 157, 0.25)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#475569',
                }}
              >
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
                Độc lập – Tự do – Hạnh phúc
              </div>
              <div
                style={{
                  width: '64px',
                  height: '2px',
                  background: '#009e9d',
                  margin: '10px auto',
                  borderRadius: '9999px',
                }}
              />
              <h2
                style={{
                  margin: '4px 0 0',
                  fontSize: isMobileView ? '20px' : '24px',
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                }}
              >
                HỢP ĐỒNG ĐỒNG SỞ HỮU XE ĐIỆN
              </h2>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#007a78',
                  marginTop: '6px',
                }}
              >
                Nhóm đồng sở hữu: {groupName}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                Ngày lập văn kiện: {formattedToday} • Khu vực đăng ký: {registrationCity}
              </div>
            </div>

            {/* Preamble */}
            <div
              style={{
                fontSize: isMobileView ? '14px' : '15px',
                lineHeight: 1.7,
                color: '#1e293b',
              }}
            >
              Văn kiện điện tử này xác lập thỏa thuận đồng sở hữu, quản trị vận hành và khai thác phương tiện
              giao thông điện trên nền tảng <strong>EVShare 3D</strong> giữa các thành viên góp vốn có tên
              tại Điều 2 dưới đây.
            </div>

            {/* Clause 1: Vehicle Asset & Valuation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(0, 158, 157, 0.15)',
                    color: '#007a78',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  01
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobileView ? '16px' : '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Điều 1. Thông tin phương tiện &amp; Định giá tài sản
                </h3>
              </div>

              <div
                style={{
                  fontSize: isMobileView ? '14px' : '15px',
                  lineHeight: 1.68,
                  color: '#1e293b',
                }}
              >
                Các đồng chủ sở hữu thống nhất đăng ký đưa phương tiện điện có thông số kỹ thuật và pháp lý sau
                đây vào tài sản đồng sở hữu của nhóm:
              </div>

              {/* Vehicle Specifications Grid */}
              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  padding: '16px 18px',
                  display: 'grid',
                  gridTemplateColumns: isMobileView ? '1fr' : 'repeat(2, 1fr)',
                  gap: '14px 18px',
                  fontSize: '13.5px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Mẫu xe đăng ký
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                    {model} {brand && !model.toLowerCase().includes(brand.toLowerCase()) ? `(${brand})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Biển kiểm soát đăng ký
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#007a78', fontFamily: 'monospace', marginTop: '3px' }}>
                    {plateNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Số khung (VIN)
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '3px' }}>
                    {vin}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Dung lượng pin &amp; Năm SX
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {batteryKwh} kWh • Năm {manufactureYear}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Màu sơn ngoại thất
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                    {exteriorColor}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Tổng giá trị định giá xe
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#007a78', marginTop: '3px' }}>
                    {vehicleValue.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: 'rgba(0, 158, 157, 0.15)',
                  color: '#007a78',
                  fontWeight: 800,
                  fontSize: '12px',
                  flexShrink: 0,
                }}
              >
                02
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: isMobileView ? '16px' : '18px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                Điều 2. Cơ cấu cổ phần &amp; Danh sách đồng sở hữu
              </h3>
            </div>

            <div
              style={{
                fontSize: isMobileView ? '14px' : '15px',
                lineHeight: 1.7,
                color: '#1e293b',
              }}
            >
              Tổng tỷ lệ sở hữu tài sản là <strong>{totalSharePercentage}%</strong> chia cho{' '}
              <strong>{coOwners.length} thành viên</strong>. Quyền biểu quyết, hạn mức khai thác quãng
              đường và nghĩa vụ đóng góp chi phí bảo dưỡng định kỳ được phân bổ tỷ lệ thuận với phần trăm cổ
              phần nắm giữ của từng thành viên:
            </div>

            {/* Member Share Table */}
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '5fr 3fr 2fr 2fr',
                  background: '#f1f5f9',
                  padding: '10px 14px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#334155',
                  borderBottom: '1px solid #cbd5e1',
                  letterSpacing: '0.04em',
                }}
              >
                <div>Thành viên</div>
                <div style={{ textAlign: 'center' }}>Vai trò</div>
                <div style={{ textAlign: 'right' }}>Cổ phần</div>
                <div style={{ textAlign: 'right' }}>Vốn góp</div>
              </div>

              {/* Table Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {coOwners.map((member, idx) => {
                  const memberCapital = Math.round((vehicleValue * member.sharePercentage) / 100);
                  const isRep = idx === 0 || member.isRepresentative;

                  return (
                    <div
                      key={`${member.email || member.name}-${idx}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '5fr 3fr 2fr 2fr',
                        alignItems: 'center',
                        padding: '10px 14px',
                        fontSize: '13px',
                        borderBottom: idx < coOwners.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <div style={{ paddingRight: '8px', minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {member.name}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {member.email || 'Chưa cập nhật email'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: isRep ? 'rgba(0, 158, 157, 0.12)' : '#f1f5f9',
                            color: isRep ? '#007a78' : '#475569',
                            border: isRep ? '1px solid rgba(0, 158, 157, 0.35)' : '1px solid #cbd5e1',
                          }}
                        >
                          {isRep ? 'Đại diện nhóm' : 'Đồng sở hữu'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: 800, color: '#007a78', fontSize: '13.5px' }}>
                        {member.sharePercentage}%
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: '12.5px' }}>
                        {(memberCapital / 1_000_000).toLocaleString('vi-VN', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        tr
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Total Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '8fr 2fr 2fr',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#0f172a',
                  borderTop: '1px solid #cbd5e1',
                }}
              >
                <div>Tổng cộng ({coOwners.length} thành viên)</div>
                <div style={{ textAlign: 'right', color: '#007a78', fontSize: '14px' }}>
                  {totalSharePercentage}%
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  {(vehicleValue / 1_000_000).toLocaleString('vi-VN', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  tr
                </div>
              </div>
            </div>

            {/* Voting Governance Box */}
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0, 158, 157, 0.3)',
                background: 'rgba(0, 158, 157, 0.06)',
                padding: '14px 16px',
                fontSize: isMobileView ? '13px' : '14px',
                color: '#1e293b',
                lineHeight: 1.65,
              }}
            >
              <strong style={{ color: '#0f172a' }}>Nguyên tắc biểu quyết nhóm: </strong>
              Áp dụng cơ chế <strong>{votingRuleLabel}</strong>. Mọi quyết định nâng cấp tài sản, chuyển
              nhượng cổ phần hoặc thay đổi quy chế tài chính đều được ghi nhận bằng biên bản biểu quyết điện
              tử trên hệ thống.
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Clause 3: Booking & Fair Usage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(0, 158, 157, 0.15)',
                    color: '#007a78',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  03
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobileView ? '16px' : '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Điều 3. Quy chế đặt lịch &amp; Sử dụng xe công bằng
                </h3>
              </div>

              <div
                style={{
                  fontSize: isMobileView ? '14px' : '15px',
                  lineHeight: 1.7,
                  color: '#1e293b',
                }}
              >
                Mỗi thành viên được đặt lịch sử dụng phương tiện liên tiếp tối đa{' '}
                <strong>{maxConsecutiveDays} ngày/lượt</strong> trên lịch vận hành chung. Hệ thống tự động
                tính điểm ưu tiên dựa trên tỷ lệ sở hữu cổ phần và lịch sử sử dụng thực tế nhằm đảm bảo công
                bằng giữa các đồng chủ sở hữu vào ngày lễ và cuối tuần.
              </div>

              <ul
                style={{
                  margin: '0',
                  paddingLeft: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: isMobileView ? '13.5px' : '14px',
                  color: '#334155',
                  lineHeight: 1.6,
                }}
              >
                <li>
                  Thành viên đặt lịch phải thực hiện Check-in và Check-out đúng khung giờ đã đăng ký trên ứng
                  dụng.
                </li>
                <li>
                  Trường hợp hủy lịch đột xuất dưới 12 giờ trước giờ nhận xe mà không có lý do bất khả kháng,
                  hệ thống sẽ ghi nhận vào chỉ số ưu tiên của kỳ kế tiếp.
                </li>
              </ul>
            </div>

            {/* Clause 4: Shared Financial Fund */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(0, 158, 157, 0.15)',
                    color: '#007a78',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  04
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobileView ? '16px' : '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Điều 4. Quỹ vận hành chung &amp; Nghĩa vụ tài chính
                </h3>
              </div>

              <div
                style={{
                  fontSize: isMobileView ? '14px' : '15px',
                  lineHeight: 1.7,
                  color: '#1e293b',
                }}
              >
                Nhóm thiết lập quỹ vận hành định kỳ để chi trả phí sạc điện, bảo hiểm vật chất, phí đường bộ,
                gửi xe và bảo dưỡng tiêu chuẩn:
              </div>

              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Tổng quỹ vận hành hàng tháng:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '14.5px' }}>
                    {monthlyFund.toLocaleString('vi-VN')} VNĐ / tháng
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>
                    Trích lập dự phòng bảo trì ({maintenanceReservePercent}%):
                  </span>
                  <span style={{ fontWeight: 800, color: '#007a78', fontSize: '14px' }}>
                    {maintenanceReserveAmount.toLocaleString('vi-VN')} VNĐ / tháng
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Phí phạt chậm đóng quỹ:</span>
                  <span style={{ fontWeight: 800, color: '#b45309', fontSize: '14px' }}>
                    {latePaymentFeePercent}% / ngày quá hạn
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Clause 5: Vehicle Care & Handover */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(0, 158, 157, 0.15)',
                    color: '#007a78',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  05
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobileView ? '16px' : '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Điều 5. Trách nhiệm bảo quản &amp; Bàn giao phương tiện
                </h3>
              </div>

              <div
                style={{
                  fontSize: isMobileView ? '14px' : '15px',
                  lineHeight: 1.7,
                  color: '#1e293b',
                }}
              >
                Thành viên trực tiếp điều khiển phương tiện chịu trách nhiệm hoàn toàn đối với các khoản phạt vi
                phạm hành chính giao thông và chi phí khắc phục hư hỏng phát sinh do lỗi chủ quan trong suốt thời
                gian nhận bàn giao xe. Khi kết thúc hành trình, thành viên đảm bảo vệ sinh khoang xe và duy trì
                dung lượng pin tối thiểu theo quy chuẩn vận hành của nhóm.
              </div>
            </div>

            {/* Clause 6: Staff Approval Workflow & Legal Validity */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(0, 158, 157, 0.15)',
                    color: '#007a78',
                    fontWeight: 800,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  06
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobileView ? '16px' : '18px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Điều 6. Quy trình thẩm định của Nhân viên vận hành &amp; Hiệu lực
                </h3>
              </div>

              <div
                style={{
                  fontSize: isMobileView ? '14px' : '15px',
                  lineHeight: 1.7,
                  color: '#1e293b',
                }}
              >
                Sau khi Người đại diện hoàn tất xác nhận điều khoản và nhấn{' '}
                <strong>&ldquo;ĐĂNG KÝ XE&rdquo;</strong>, hồ sơ đăng ký phương tiện sẽ chuyển vào hàng đợi thẩm
                định với trạng thái <strong>SUBMITTED (Chờ nhân viên xét duyệt)</strong>. Phương tiện, nhóm
                đồng sở hữu và lời mời các thành viên sẽ chính thức kích hoạt ngay sau khi Nhân viên vận hành (
                <strong>STAFF</strong>) kiểm tra hợp lệ biển số <strong>{plateNumber}</strong> và phê duyệt
                hồ sơ.
              </div>

              {/* Electronic Verification Certificate Box */}
              <div
                style={{
                  borderRadius: '14px',
                  border: '1.5px solid rgba(0, 158, 157, 0.35)',
                  background: 'rgba(0, 158, 157, 0.08)',
                  padding: '16px 20px',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: isMobileView ? 'column' : 'row',
                  alignItems: isMobileView ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#007a78',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Chứng thực văn kiện điện tử EVShare 3D</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    Đại diện lập hồ sơ: <strong>{coOwners[0]?.name || 'Đại diện nhóm'}</strong> • Biển số:{' '}
                    <strong>{plateNumber}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinishReview}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #009e9d 0%, #007a78 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    letterSpacing: '0.3px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 122, 120, 0.3)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Hoàn tất xem điều khoản</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-details-dialog-title"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobileView ? '8px' : '20px',
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
        opacity: modalPhase === 'open' ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 0.22s ease-out',
      }}
    >
      {/* Main Contract Details Card Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          height: '100%',
          maxHeight: isMobileView ? '98vh' : '88vh',
          background: '#f8fafc',
          borderRadius: isMobileView ? '16px' : '20px',
          border: '1.5px solid rgba(0, 201, 216, 0.45)',
          boxShadow: '0 25px 65px rgba(15, 23, 42, 0.45), 0 0 35px rgba(0, 201, 216, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: modalPhase === 'open' ? 'scale(1)' : 'scale(0.97)',
          transition: prefersReducedMotion ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* 1. READER HEADER */}
        <header
          style={{
            padding: isMobileView ? '12px 16px' : '14px 24px',
            background: '#ffffff',
            borderBottom: '1px solid rgba(203, 213, 225, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 201, 216, 0.12)',
                border: '1.2px solid rgba(0, 201, 216, 0.35)',
                color: '#009e9d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={20} />
            </div>

            <div style={{ minWidth: 0 }}>
              <h1
                id="contract-details-dialog-title"
                style={{
                  margin: 0,
                  fontSize: isMobileView ? '14.5px' : '16px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                CHI TIẾT HỢP ĐỒNG
              </h1>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Hợp đồng đồng sở hữu • <strong style={{ color: '#007a78' }}>{model}</strong> • Biển số:{' '}
                <strong style={{ color: '#0f172a' }}>{plateNumber}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng chi tiết hợp đồng"
            title="Đóng chi tiết hợp đồng"
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <X size={14} />
            <span>Đóng</span>
          </button>
        </header>

        {/* 2. READER BODY (WHITE DOCUMENT SURFACE) */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobileView ? '14px 12px' : '22px 28px',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '860px',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid rgba(203, 213, 225, 0.85)',
              boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
              padding: isMobileView ? '20px 16px' : '32px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100%',
              boxSizing: 'border-box',
            }}
          >
            {renderPageContent(currentPage)}

            {/* Document Internal Footer Note */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: '#64748b',
              }}
            >
              <span>Văn kiện pháp lý điện tử EVShare 3D</span>
              <span style={{ fontWeight: 700, color: '#007a78' }}>
                Trang {currentPage} / {TOTAL_PAGES}
              </span>
            </div>
          </div>
        </main>

        {/* 3. READER FOOTER WITH PAGINATION */}
        <footer
          style={{
            padding: isMobileView ? '10px 14px' : '12px 24px',
            background: '#ffffff',
            borderTop: '1px solid rgba(203, 213, 225, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Previous Page Button */}
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={!canGoPrev}
            style={{
              padding: isMobileView ? '7px 12px' : '8px 16px',
              borderRadius: '10px',
              background: canGoPrev ? '#f8fafc' : '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              color: canGoPrev ? '#1e293b' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeft size={15} />
            <span>Trang trước</span>
          </button>

          {/* Center: Page Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[1, 2, 3, 4].map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: isMobileView ? '5px 9px' : '6px 12px',
                    borderRadius: '8px',
                    background: isActive ? '#009e9d' : '#f1f5f9',
                    border: isActive ? '1px solid #009e9d' : '1px solid rgba(203, 213, 225, 0.7)',
                    color: isActive ? '#ffffff' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Trang {pageNum}
                </button>
              );
            })}
          </div>

          {/* Right: Next Page / Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canGoNext ? (
              <button
                type="button"
                onClick={handleNextPage}
                style={{
                  padding: isMobileView ? '7px 14px' : '8px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #009e9d 0%, #007a78 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(0, 158, 157, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Trang sau</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishReview}
                style={{
                  padding: isMobileView ? '7px 14px' : '8px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(5, 150, 105, 0.28)',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Hoàn tất xem điều khoản</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: isMobileView ? '7px 12px' : '8px 14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Đóng
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
