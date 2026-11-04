import React, { useState, useEffect } from 'react';
import {
  VehicleRegistrationDraftRequest,
  VehicleRegistrationDraftResponse,
  CoOwnerInviteDraft,
} from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';
import { useAuthStore } from '../../store/authStore';

interface NewVehicleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDraftId?: string;
}

export const NewVehicleWizardModal: React.FC<NewVehicleWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDraftId,
}) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [plateNumber, setPlateNumber] = useState('30A-999.88');
  const [model, setModel] = useState('VinFast VF8 Plus');
  const [vin, setVin] = useState('VF8VN2026888999');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(87.7);
  const [manufactureYear, setManufactureYear] = useState(2025);
  const [vehicleValue, setVehicleValue] = useState(1200000000);
  const [registrationCity, setRegistrationCity] = useState('Hà Nội');

  // Step 2 Group config
  const [groupName, setGroupName] = useState('Nhóm Đồng Sở Hữu VF8');
  const [monthlyFundContribution, setMonthlyFundContribution] = useState(2000000);
  const [latePaymentFeeRate, setLatePaymentFeeRate] = useState(0.05);
  const [maintenanceReserveRate, setMaintenanceReserveRate] = useState(0.15);
  const [maxConsecutiveBookingDays, setMaxConsecutiveBookingDays] = useState(7);

  // Step 3 Co-owners & Shares
  const [coOwners, setCoOwners] = useState<CoOwnerInviteDraft[]>([
    {
      fullName: user?.fullName || 'Tôi (Đại diện)',
      email: user?.email || 'admin@evshare.vn',
      phoneNumber: user?.phone || '0901234567',
      sharePercentage: 50,
      contributionAmount: 600000000,
      role: 'REPRESENTATIVE',
    },
    {
      fullName: 'Thành viên 2',
      email: 'member2@example.com',
      phoneNumber: '0912345678',
      sharePercentage: 50,
      contributionAmount: 600000000,
      role: 'CO_OWNER',
    },
  ]);

  // Load draft if initialDraftId
  useEffect(() => {
    if (initialDraftId) {
      setLoading(true);
      onboardingApi
        .getDraftById(initialDraftId)
        .then((draft) => {
          setDraftId(draft.id);
          setPlateNumber(draft.plateNumber);
          setModel(draft.model);
          setVin(draft.vin || '');
          setBatteryCapacityKwh(draft.batteryCapacityKwh);
          setManufactureYear(draft.manufactureYear || 2025);
          setVehicleValue(draft.vehicleValue);
          setRegistrationCity(draft.registrationCity || 'Hà Nội');
          setGroupName(draft.groupName);
          setMonthlyFundContribution(draft.monthlyFundContribution);
          setLatePaymentFeeRate(draft.latePaymentFeeRate);
          setMaintenanceReserveRate(draft.maintenanceReserveRate);
          setMaxConsecutiveBookingDays(draft.maxConsecutiveBookingDays);
          if (draft.coOwners && draft.coOwners.length > 0) {
            setCoOwners(draft.coOwners);
          }
          setCurrentStep(draft.currentStep || 1);
        })
        .catch((err) => {
          console.error('Failed to load draft:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [initialDraftId]);

  if (!isOpen) return null;

  const totalSharePercentage = coOwners.reduce((sum, o) => sum + (Number(o.sharePercentage) || 0), 0);
  const isSharesValid = Math.abs(totalSharePercentage - 100) < 0.001;

  const handleAddCoOwner = () => {
    setCoOwners([
      ...coOwners,
      {
        fullName: '',
        email: '',
        phoneNumber: '',
        sharePercentage: 0,
        contributionAmount: 0,
        role: 'CO_OWNER',
      },
    ]);
  };

  const handleRemoveCoOwner = (index: number) => {
    if (coOwners.length <= 1) return;
    setCoOwners(coOwners.filter((_, i) => i !== index));
  };

  const handleUpdateCoOwner = (index: number, field: keyof CoOwnerInviteDraft, value: any) => {
    const updated = [...coOwners];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'sharePercentage') {
      const pct = Number(value) || 0;
      updated[index].contributionAmount = Math.round((vehicleValue * pct) / 100);
    }
    setCoOwners(updated);
  };

  const buildPayload = (): VehicleRegistrationDraftRequest => ({
    plateNumber,
    model,
    vin,
    batteryCapacityKwh,
    manufactureYear,
    vehicleValue,
    registrationCity,
    groupName,
    monthlyFundContribution,
    latePaymentFeeRate,
    maintenanceReserveRate,
    maxConsecutiveBookingDays,
    coOwners,
    currentStep,
  });

  const handleSaveDraft = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload = buildPayload();
      let res: VehicleRegistrationDraftResponse;
      if (draftId) {
        res = await onboardingApi.updateDraft(draftId, payload);
      } else {
        res = await onboardingApi.saveDraft(payload);
        setDraftId(res.id);
      }
      alert('Đã lưu bản nháp thành công!');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi lưu bản nháp.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isSharesValid) {
      setError('Tổng tỷ lệ sở hữu của tất cả thành viên phải bằng đúng 100%.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let currentDraftId = draftId;
      if (!currentDraftId) {
        const draftRes = await onboardingApi.saveDraft(buildPayload());
        currentDraftId = draftRes.id;
        setDraftId(currentDraftId);
      } else {
        await onboardingApi.updateDraft(currentDraftId, buildPayload());
      }
      await onboardingApi.submitDraft(currentDraftId);
      alert('Đăng ký xe và thành lập nhóm thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi nộp hồ sơ đăng ký.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 10, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(13, 26, 48, 0.95), rgba(7, 15, 30, 0.98))',
          borderRadius: '18px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 242, 254, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(2, 6, 23, 0.5)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
              ĐĂNG KÝ XE MỚI & THÀNH LẬP NHÓM ĐỒNG SỞ HỮU
            </h2>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Quy trình thiết lập xe, phân chia cổ phần và hợp đồng tự động (Bước {currentStep}/4)
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Stepper Indicator */}
        <div
          style={{
            display: 'flex',
            padding: '12px 28px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            gap: '8px',
          }}
        >
          {[
            { step: 1, label: '1. Thông tin xe' },
            { step: 2, label: '2. Cấu hình nhóm' },
            { step: 3, label: '3. Phân bổ cổ phần' },
            { step: 4, label: '4. Điều khoản hợp đồng' },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: currentStep === item.step ? 700 : 500,
                color: currentStep === item.step ? '#00f2fe' : '#64748b',
                background: currentStep === item.step ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                border: currentStep === item.step ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Biển số xe *
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                  placeholder="VD: 30A-999.88"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Dòng xe điện *
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="VinFast VF8 Plus">VinFast VF8 Plus</option>
                  <option value="VinFast VF9">VinFast VF9</option>
                  <option value="VinFast VF6">VinFast VF6</option>
                  <option value="VinFast VF7">VinFast VF7</option>
                  <option value="VinFast VFe34">VinFast VFe34</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Số khung (VIN)
                </label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                  placeholder="VF8VN2026888999"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Dung lượng Pin (kWh)
                </label>
                <input
                  type="number"
                  value={batteryCapacityKwh}
                  onChange={(e) => setBatteryCapacityKwh(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Năm sản xuất
                </label>
                <input
                  type="number"
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Định giá xe (VNĐ) *
                </label>
                <input
                  type="number"
                  value={vehicleValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVehicleValue(val);
                    // update contributions
                    setCoOwners((prev) =>
                      prev.map((co) => ({
                        ...co,
                        contributionAmount: Math.round((val * (co.sharePercentage || 0)) / 100),
                      }))
                    );
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Thành phố đăng ký
                </label>
                <input
                  type="text"
                  value={registrationCity}
                  onChange={(e) => setRegistrationCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Tên nhóm đồng sở hữu *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                  placeholder="VD: Nhóm Đồng Sở Hữu VF8 Skyline"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Đóng quỹ hàng tháng / thành viên (VNĐ)
                </label>
                <input
                  type="number"
                  value={monthlyFundContribution}
                  onChange={(e) => setMonthlyFundContribution(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Tỷ lệ phạt nộp quỹ muộn (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={latePaymentFeeRate}
                  onChange={(e) => setLatePaymentFeeRate(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Tỷ lệ trích quỹ bảo dưỡng dự phòng (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={maintenanceReserveRate}
                  onChange={(e) => setMaintenanceReserveRate(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Số ngày đặt xe liên tiếp tối đa (ngày)
                </label>
                <input
                  type="number"
                  value={maxConsecutiveBookingDays}
                  onChange={(e) => setMaxConsecutiveBookingDays(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>Tổng tỷ lệ phân bổ: </span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isSharesValid ? '#10b981' : '#f87171',
                    }}
                  >
                    {totalSharePercentage}% / 100%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCoOwner}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid #00f2fe',
                    color: '#00f2fe',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  + Thêm thành viên
                </button>
              </div>

              {coOwners.map((owner, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1.2fr 1.8fr auto',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Họ và tên</label>
                    <input
                      type="text"
                      value={owner.fullName}
                      onChange={(e) => handleUpdateCoOwner(idx, 'fullName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: '#0a101f',
                        border: '1px solid #1e293b',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Email mời</label>
                    <input
                      type="email"
                      value={owner.email}
                      onChange={(e) => handleUpdateCoOwner(idx, 'email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: '#0a101f',
                        border: '1px solid #1e293b',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Tỷ lệ (%)</label>
                    <input
                      type="number"
                      value={owner.sharePercentage}
                      onChange={(e) => handleUpdateCoOwner(idx, 'sharePercentage', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: '#0a101f',
                        border: '1px solid #1e293b',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Góp vốn (VNĐ)</label>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', padding: '6px 0' }}>
                      {owner.contributionAmount?.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCoOwner(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px',
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div>
              <div
                style={{
                  background: 'rgba(2, 6, 23, 0.7)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#00f2fe' }}>HỢP ĐỒNG ĐỒNG SỞ HỮU XE ĐIỆN — BẢN TÓM TẮT</h4>
                <p>
                  1. <strong>Tài sản sở hữu chung:</strong> Xe ô tô điện {model}, Biển kiểm soát {plateNumber}, Số khung {vin}.
                </p>
                <p>
                  2. <strong>Định giá xe & Góp vốn:</strong> Tổng giá trị {vehicleValue.toLocaleString('vi-VN')} VNĐ. Các bên cam kết góp vốn theo tỷ lệ cổ phần đã thỏa thuận.
                </p>
                <p>
                  3. <strong>Phân chia quyền sử dụng:</strong> Thành viên được quyền đặt xe theo điểm ưu tiên và tỷ lệ cổ phần. Số ngày đặt liên tiếp tối đa là {maxConsecutiveBookingDays} ngày.
                </p>
                <p>
                  4. <strong>Quỹ vận hành & Bảo dưỡng:</strong> Mức đóng định kỳ {monthlyFundContribution.toLocaleString('vi-VN')} VNĐ/tháng. Trích {maintenanceReserveRate * 100}% vào quỹ dự phòng.
                </p>
                <p>
                  5. <strong>Chữ ký điện tử:</strong> Hợp đồng sẽ tự động được gửi tới email của từng thành viên qua mã lời mời kèm liên kết xác thực số OTP.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid rgba(0, 242, 254, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(2, 6, 23, 0.6)',
          }}
        >
          <div>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              💾 Lưu bản nháp
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Quay lại
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                  border: 'none',
                  color: '#050914',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !isSharesValid}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  background: isSharesValid
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'rgba(100, 116, 139, 0.5)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: isSharesValid ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  boxShadow: isSharesValid ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                }}
              >
                {submitting ? 'Đang tạo nhóm...' : '🚀 Hoàn tất & Kích hoạt xe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

