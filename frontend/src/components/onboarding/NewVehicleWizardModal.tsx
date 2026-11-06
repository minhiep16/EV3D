import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Car,
  Users,
  PieChart,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Search,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  VehicleRegistrationDraftRequest,
  VehicleRegistrationDraftResponse,
  CoOwnerInviteDraft,
  OnboardingUserSearchResult,
} from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';
import { useAuthStore } from '../../store/authStore';
import { VEHICLE_EXTERIOR_COLORS, resolveVehicleColorHex } from '../../config/vehicleColors';
import {
  VEHICLE_CATALOG,
  findCatalogEntryByModel,
  getCatalogEntryById,
  getPreview3DModels,
  getRegistrableEVModels,
} from '../../data/vehicleCatalog';

interface UserAutocompleteSelectorProps {
  owner: CoOwnerInviteDraft;
  index: number;
  creatorUserId?: string;
  creatorEmail?: string;
  allOwners: CoOwnerInviteDraft[];
  onSelectUser: (user: OnboardingUserSearchResult) => void;
  onClearUser: () => void;
  onCustomEmail: (email: string) => void;
}

const UserAutocompleteSelector: React.FC<UserAutocompleteSelectorProps> = ({
  owner,
  index,
  creatorUserId,
  creatorEmail,
  allOwners,
  onSelectUser,
  onClearUser,
  onCustomEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<OnboardingUserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDuplicateWarning(null);
    if (searchTerm.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await onboardingApi.searchUsers(searchTerm.trim());
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to search users:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // If already selected / populated
  if (owner.fullName && owner.email) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '9px',
          background: owner.isVerifiedAccount ? 'rgba(0, 201, 216, 0.08)' : '#f8fafc',
          border: owner.isVerifiedAccount
            ? '1.2px solid rgba(0, 201, 216, 0.4)'
            : '1px solid rgba(148, 163, 184, 0.4)',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: owner.isVerifiedAccount ? '#00c9d8' : '#94a3b8',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {owner.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {owner.fullName}
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
              {owner.email}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {owner.isVerifiedAccount && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '5px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
              }}
            >
              ✓ Xác thực
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onClearUser();
              setSearchTerm('');
              setShowDropdown(false);
              setDuplicateWarning(null);
            }}
            title="Đổi tài khoản"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Đổi
          </button>
        </div>
      </div>
    );
  }

  const isEmailInput = searchTerm.includes('@') && searchTerm.includes('.');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            setDuplicateWarning(null);
          }}
          onFocus={() => {
            if (searchTerm.trim().length >= 3) setShowDropdown(true);
          }}
          placeholder="Tìm theo tên hoặc email EVShare..."
          style={{
            width: '100%',
            padding: '7px 28px 7px 30px',
            borderRadius: '8px',
            border: duplicateWarning
              ? '1.2px solid #ef4444'
              : '1.2px solid rgba(0, 201, 216, 0.4)',
            fontSize: '12.5px',
            background: '#ffffff',
            outline: 'none',
            color: '#1e293b',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '9px', display: 'flex', alignItems: 'center' }}>
            <Loader2 size={13} className="animate-spin" style={{ color: '#00c9d8' }} />
          </div>
        )}
      </div>

      {duplicateWarning && (
        <div style={{ fontSize: '10.5px', color: '#ef4444', marginTop: '3px', fontWeight: 600 }}>
          {duplicateWarning}
        </div>
      )}

      {showDropdown && searchTerm.trim().length >= 3 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '9px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0, 201, 216, 0.3)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {results.length === 0 && !loading && !isEmailInput && (
            <div style={{ padding: '8px 12px', fontSize: '11.5px', color: '#64748b', textAlign: 'center' }}>
              Không tìm thấy tài khoản EVShare phù hợp.
            </div>
          )}

          {results.map((res) => {
            const isCreator =
              (creatorUserId && res.id === creatorUserId) ||
              (creatorEmail && res.email.toLowerCase() === creatorEmail.toLowerCase());

            const isAlreadyAdded = allOwners.some(
              (o, idx) =>
                idx !== index &&
                ((o.userId && o.userId === res.id) ||
                  (o.email && o.email.toLowerCase() === res.email.toLowerCase()))
            );

            const isBlocked = isCreator || isAlreadyAdded;

            return (
              <div
                key={res.id}
                onClick={() => {
                  if (isCreator) {
                    setDuplicateWarning('Bạn là người tạo nhóm, không thể thêm chính mình.');
                    return;
                  }
                  if (isAlreadyAdded) {
                    setDuplicateWarning('Tài khoản này đã có trong danh sách.');
                    return;
                  }
                  onSelectUser(res);
                  setShowDropdown(false);
                  setSearchTerm('');
                  setDuplicateWarning(null);
                }}
                style={{
                  padding: '7px 9px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isBlocked ? 'not-allowed' : 'pointer',
                  opacity: isBlocked ? 0.55 : 1,
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isBlocked) e.currentTarget.style.background = 'rgba(0, 201, 216, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    {res.fullName}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    {res.email}
                  </div>
                </div>
                {isCreator && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontWeight: 700,
                    }}
                  >
                    Người đại diện (Bạn)
                  </span>
                )}
                {!isCreator && isAlreadyAdded && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: '#d97706',
                      fontWeight: 700,
                    }}
                  >
                    Đã có trong danh sách
                  </span>
                )}
                {!isBlocked && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(0, 201, 216, 0.12)',
                      color: '#009e9d',
                      fontWeight: 700,
                    }}
                  >
                    Chọn
                  </span>
                )}
              </div>
            );
          })}

          {/* Fallback option if user typed a valid email format */}
          {isEmailInput && (
            <div
              onClick={() => {
                const em = searchTerm.trim().toLowerCase();
                const isCreator = creatorEmail && creatorEmail.toLowerCase() === em;
                const isAlreadyAdded = allOwners.some(
                  (o, idx) => idx !== index && o.email && o.email.toLowerCase() === em
                );
                if (isCreator) {
                  setDuplicateWarning('Bạn là người tạo nhóm, không thể thêm email của chính mình.');
                  return;
                }
                if (isAlreadyAdded) {
                  setDuplicateWarning('Tài khoản này đã có trong danh sách.');
                  return;
                }
                onCustomEmail(searchTerm.trim());
                setShowDropdown(false);
                setSearchTerm('');
                setDuplicateWarning(null);
              }}
              style={{
                padding: '7px 9px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'rgba(0, 201, 216, 0.05)',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                marginTop: '4px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#009e9d', fontWeight: 600 }}>
                ✉️ Gửi lời mời tới: <strong>{searchTerm.trim()}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NewVehicleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDraftId?: string;
  selectedColor?: string;
  onColorChange?: (colorHex: string) => void;
  selectedModel?: string;
  onModelChange?: (modelName: string) => void;
}

const EV_MODELS = [
  { name: 'VinFast VF3', battery: 18.64, value: 240000000 },
  { name: 'VinFast VF8 Plus', battery: 87.7, value: 1200000000 },
  { name: 'VinFast VF9 Plus', battery: 123.0, value: 1600000000 },
  { name: 'VinFast VF7 Plus', battery: 75.3, value: 999000000 },
  { name: 'VinFast VF6 Plus', battery: 59.6, value: 765000000 },
  { name: 'Tesla Model 3 2018', battery: 75.0, value: 1200000000 },
  { name: 'Tesla Cybertruck', battery: 123.0, value: 2500000000 },
  { name: 'Tesla Roadster 2008', battery: 53.0, value: 1800000000 },
  { name: 'Tesla Model Y Long Range', battery: 75.0, value: 1500000000 },
  { name: 'Volvo EX30 Ultra', battery: 69.0, value: 1350000000 },
  { name: 'Hyundai Mistra EV 2021', battery: 56.5, value: 750000000 },
  { name: 'Hyundai Kona Electric 2024', battery: 64.8, value: 1150000000 },
  { name: 'Khác (Tùy chỉnh)', battery: 75.0, value: 1000000000 },
];

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Khác'];

const MEMBER_COLORS = ['#00c9d8', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const NewVehicleWizardModal: React.FC<NewVehicleWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDraftId,
  selectedColor,
  onColorChange,
  selectedModel,
  onModelChange,
}) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);

  // Form State - Step 1: Thông tin xe
  const [plateNumber, setPlateNumber] = useState('30A-999.88');
  const [model, setModel] = useState(selectedModel || 'VinFast VF8 Plus');
  const [exteriorColor, setExteriorColor] = useState<string>('Trắng ngọc trai');
  const [vin, setVin] = useState('VF8VN2026888999');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(87.7);
  const [manufactureYear, setManufactureYear] = useState(2025);
  const [vehicleValue, setVehicleValue] = useState(1200000000);
  const [registrationCity, setRegistrationCity] = useState('Hà Nội');

  // Synchronize incoming selectedModel if changed externally
  useEffect(() => {
    if (selectedModel && selectedModel !== model) {
      setModel(selectedModel);
    }
  }, [selectedModel]);

  // Catalog inspection for currently selected vehicle
  const currentCatalogEntry = useMemo(() => findCatalogEntryByModel(model), [model]);
  const isCurrentModelRegistrable = currentCatalogEntry ? currentCatalogEntry.isRegistrableEV : true;
  const isPaintCustomizationSupported = currentCatalogEntry?.paintConfig?.supportsPaintCustomization ?? true;

  // Synchronize exteriorColor if model changes and has a specific default
  useEffect(() => {
    if (selectedColor) {
      // Find matching color name
      const matched = VEHICLE_EXTERIOR_COLORS.find(
        (c) => c.hex.toLowerCase() === selectedColor.toLowerCase() || c.id === selectedColor
      );
      if (matched && matched.nameVi !== exteriorColor) {
        setExteriorColor(matched.nameVi);
      }
    }
  }, [selectedColor]);

  // Form State - Step 2: Cấu hình nhóm
  const [groupName, setGroupName] = useState('Nhóm Đồng Sở Hữu VF8');
  const [monthlyFundContribution, setMonthlyFundContribution] = useState(2000000);
  const [latePaymentFeeRate, setLatePaymentFeeRate] = useState(0.05);
  const [maintenanceReserveRate, setMaintenanceReserveRate] = useState(0.15);
  const [maxConsecutiveBookingDays, setMaxConsecutiveBookingDays] = useState(7);

  // Form State - Step 3: Phân bổ cổ phần
  const [coOwners, setCoOwners] = useState<CoOwnerInviteDraft[]>([
    {
      userId: user?.id,
      fullName: user?.fullName || 'Người đại diện',
      email: user?.email || 'creator@evshare.vn',
      phoneNumber: user?.phone || '',
      sharePercentage: 50,
      contributionAmount: 600000000,
      role: 'REPRESENTATIVE',
      isVerifiedAccount: true,
    },
    {
      fullName: '',
      email: '',
      phoneNumber: '',
      sharePercentage: 50,
      contributionAmount: 600000000,
      role: 'CO_OWNER',
      isVerifiedAccount: false,
    },
  ]);

  // Ensure creator row (index 0) has authenticated user's identity
  useEffect(() => {
    if (user && !initialDraftId) {
      setCoOwners((prev) => {
        if (prev.length === 0) return prev;
        const first = prev[0];
        if (!first.userId || first.userId !== user.id || first.email !== user.email) {
          const updatedFirst: CoOwnerInviteDraft = {
            ...first,
            userId: user.id,
            fullName: user.fullName || first.fullName || 'Người đại diện',
            email: user.email || first.email,
            phoneNumber: user.phone || first.phoneNumber || '',
            role: 'REPRESENTATIVE',
            isVerifiedAccount: true,
          };
          return [updatedFirst, ...prev.slice(1)];
        }
        return prev;
      });
    }
  }, [user, initialDraftId]);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Load draft if initialDraftId is provided
  useEffect(() => {
    if (initialDraftId) {
      setLoading(true);
      onboardingApi
        .getDraftById(initialDraftId)
        .then((draft) => {
          setDraftId(draft.id);
          setPlateNumber(draft.plateNumber);
          setModel(draft.model);
          if (draft.exteriorColor) {
            setExteriorColor(draft.exteriorColor);
            onColorChange?.(resolveVehicleColorHex(draft.exteriorColor));
          }
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

  // Autofocus first input on step 1 open
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSharePercentage = coOwners.reduce(
    (sum, o) => sum + (Number(o.sharePercentage) || 0),
    0
  );
  const isShares100Percent = Math.abs(totalSharePercentage - 100) < 0.001;

  // Duplicate checks
  const duplicateErrors = (() => {
    const userIds = new Set<string>();
    const emails = new Set<string>();
    for (const o of coOwners) {
      if (o.userId) {
        if (userIds.has(o.userId)) return true;
        userIds.add(o.userId);
      }
      const em = o.email?.trim().toLowerCase();
      if (em) {
        if (emails.has(em)) return true;
        emails.add(em);
      }
    }
    return false;
  })();

  const hasIncompleteRow = coOwners.some(
    (o) => !o.fullName.trim() || !o.email.trim() || Number(o.sharePercentage) <= 0
  );

  const isStep3Valid =
    isShares100Percent &&
    coOwners.length >= 2 &&
    !hasIncompleteRow &&
    !duplicateErrors;

  const isSharesValid = isStep3Valid;

  const handleModelChange = (selectedModelName: string) => {
    setModel(selectedModelName);
    onModelChange?.(selectedModelName);

    // 1. Resolve in central vehicle catalog
    const entry = findCatalogEntryByModel(selectedModelName);
    if (entry) {
      if (entry.isRegistrableEV) {
        setBatteryCapacityKwh(entry.batteryCapacityKwh || 87.7);
        const val = entry.estimatedValueVnd || 1200000000;
        setVehicleValue(val);
        setCoOwners((prev) =>
          prev.map((o) => ({
            ...o,
            contributionAmount: Math.round((val * (Number(o.sharePercentage) || 0)) / 100),
          }))
        );
      } else {
        // ICE model: Do not fabricate battery capacity or pretend it is an EV
        setBatteryCapacityKwh(0);
        const val = entry.estimatedValueVnd || 1000000000;
        setVehicleValue(val);
        setCoOwners((prev) =>
          prev.map((o) => ({
            ...o,
            contributionAmount: Math.round((val * (Number(o.sharePercentage) || 0)) / 100),
          }))
        );
      }

      if (entry.defaultColorNameVi) {
        setExteriorColor(entry.defaultColorNameVi);
        onColorChange?.(entry.defaultColorHex);
      }
      return;
    }

    // 2. Fallback for custom options in EV_MODELS
    const matched = EV_MODELS.find((m) => m.name === selectedModelName);
    if (matched) {
      setBatteryCapacityKwh(matched.battery);
      setVehicleValue(matched.value);
      setCoOwners((prev) =>
        prev.map((o) => ({
          ...o,
          contributionAmount: Math.round((matched.value * (Number(o.sharePercentage) || 0)) / 100),
        }))
      );
    }
  };

  const handleAddCoOwner = () => {
    const remainingPct = Math.max(0, 100 - totalSharePercentage);
    setCoOwners([
      ...coOwners,
      {
        fullName: '',
        email: '',
        phoneNumber: '',
        sharePercentage: remainingPct,
        contributionAmount: Math.round((vehicleValue * remainingPct) / 100),
        role: 'CO_OWNER',
        isVerifiedAccount: false,
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
    exteriorColor,
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

  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!plateNumber.trim()) {
        setError('Vui lòng nhập biển số xe.');
        return false;
      }
      if (!model.trim()) {
        setError('Vui lòng chọn dòng xe điện.');
        return false;
      }
      if (!vehicleValue || vehicleValue <= 0) {
        setError('Định giá xe phải lớn hơn 0 VNĐ.');
        return false;
      }
      if (!isCurrentModelRegistrable) {
        setError('Mô hình này là xe động cơ đốt trong (ICE) chỉ dùng để xem trước 3D. Vui lòng chọn dòng xe thuần điện (BEV) để tiếp tục đăng ký.');
        return false;
      }
      if (!batteryCapacityKwh || batteryCapacityKwh <= 0) {
        setError('Dung lượng pin phải lớn hơn 0 kWh.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!groupName.trim()) {
        setError('Vui lòng nhập tên nhóm đồng sở hữu.');
        return false;
      }
      if (monthlyFundContribution < 0) {
        setError('Mức đóng quỹ không thể âm.');
        return false;
      }
      if (maxConsecutiveBookingDays < 1) {
        setError('Số ngày đặt xe liên tiếp tối thiểu là 1 ngày.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!isShares100Percent) {
        setError(
          `Tổng tỷ lệ cổ phần của tất cả thành viên phải bằng đúng 100% (Hiện tại: ${totalSharePercentage}%).`
        );
        return false;
      }
      if (coOwners.length < 2) {
        setError('Cần tối thiểu 2 thành viên để thành lập nhóm đồng sở hữu xe.');
        return false;
      }
      if (duplicateErrors) {
        setError('Có thành viên bị trùng lặp trong danh sách. Vui lòng kiểm tra lại.');
        return false;
      }
      const invalidOwner = coOwners.find(
        (o) => !o.fullName.trim() || !o.email.trim() || Number(o.sharePercentage) <= 0
      );
      if (invalidOwner) {
        setError('Vui lòng chọn tài khoản hoặc điền đầy đủ họ tên, email và tỷ lệ cổ phần (> 0%) cho mọi thành viên.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < currentStep) {
      setError(null);
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      if (validateCurrentStep()) {
        setCurrentStep(targetStep);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (loading) return;
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
      alert('Đã lưu bản nháp đăng ký xe thành công!');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi lưu bản nháp.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isStep3Valid) {
      setError('Vui lòng hoàn thành hợp lệ phân bổ cổ phần (tổng 100%, tối thiểu 2 thành viên không trùng lặp và cổ phần > 0%).');
      return;
    }
    if (!agreementAccepted) {
      setError('Vui lòng đọc và xác nhận đồng ý với điều khoản hợp đồng đồng sở hữu.');
      return;
    }
    if (submitting) return;
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
      alert('Đăng ký xe và thành lập nhóm đồng sở hữu thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi nộp hồ sơ đăng ký.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { number: 1, title: 'Thông tin xe', icon: <Car size={15} /> },
    { number: 2, title: 'Cấu hình nhóm', icon: <Users size={15} /> },
    { number: 3, title: 'Phân bổ cổ phần', icon: <PieChart size={15} /> },
    { number: 4, title: 'Hợp đồng', icon: <FileText size={15} /> },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-workspace-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 900,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'transparent',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* LEFT 42% REGION: 3D VEHICLE METADATA OVERLAY (3D SCENE UNDERNEATH IS INTERACTIVE) */}
      <div
        style={{
          flex: '1 1 auto',
          position: 'relative',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 32px',
        }}
      >
        {/* Top Floating Badge */}
        <div style={{ pointerEvents: 'auto', alignSelf: 'flex-start' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1.2px solid rgba(0, 201, 216, 0.45)',
              boxShadow: '0 4px 16px rgba(0, 180, 200, 0.15)',
            }}
          >
            <Sparkles size={14} color="#009e9d" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '0.5px' }}>
              3D DIGITAL TWIN
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{model}</span>
          </div>
        </div>

        {/* Bottom Floating Metadata Card */}
        <div style={{ pointerEvents: 'auto', alignSelf: 'flex-start' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1.2px solid rgba(0, 201, 216, 0.35)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px rgba(0, 160, 190, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '260px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                HỒ SƠ XE ĐANG THIẾT LẬP
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Bước {currentStep}/4
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>
              {plateNumber || 'Chưa có biển số'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#60748c', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isCurrentModelRegistrable ? (
                <>
                  <span>Pin: <strong>{batteryCapacityKwh} kWh</strong></span>
                  <span>•</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>
                    {currentCatalogEntry?.powertrain === 'ICE' ? 'Động cơ: Xăng (3D Preview)' : 'Mô hình 3D Preview'}
                  </span>
                  <span>•</span>
                </>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: resolveVehicleColorHex(exteriorColor),
                    border: '1px solid #cbd5e1',
                    display: 'inline-block',
                  }}
                />
                <strong>{exteriorColor}</strong>
              </span>
              <span>•</span>
              <span>Định giá: <strong>{(vehicleValue / 1e6).toLocaleString()} tr đ</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 58% REGION: FROSTED WHITE GLASS REGISTRATION WORKSPACE */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 'clamp(540px, 58vw, 860px)',
          height: '100vh',
          maxHeight: '100vh',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1.5px solid rgba(0, 201, 216, 0.45)',
          boxShadow: '-12px 0 45px rgba(0, 180, 200, 0.12), -2px 0 12px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          color: '#24374c',
          overflow: 'hidden',
        }}
      >
        {/* WORKSPACE HEADER */}
        <div
          style={{
            flex: '0 0 auto',
            padding: '20px 32px 14px 32px',
            borderBottom: '1px solid rgba(0, 201, 216, 0.2)',
            background: 'rgba(240, 248, 255, 0.6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>⚡</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '1px' }}>
                  EVSHARE 3D ONBOARDING WORKSPACE
                </span>
              </div>
              <h1
                id="wizard-workspace-title"
                style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e293b' }}
              >
                THÊM XE MỚI & THÀNH LẬP NHÓM
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#60748c' }}>
                Thiết lập phương tiện và cơ cấu nhóm đồng sở hữu minh bạch
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng workspace"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 201, 216, 0.3)',
                color: '#60748c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* COMPACT 4-STEP HORIZONTAL PROGRESS INDICATOR */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {stepsList.map((step) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <div
                  key={step.number}
                  onClick={() => handleStepClick(step.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: isCurrent
                      ? 'linear-gradient(90deg, rgba(0, 201, 216, 0.18), rgba(0, 158, 157, 0.12))'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(255, 255, 255, 0.7)',
                    border: isCurrent
                      ? '1.5px solid #00c9d8'
                      : isCompleted
                      ? '1px solid #10b981'
                      : '1px solid rgba(148, 163, 184, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isCurrent
                        ? '#00c9d8'
                        : isCompleted
                        ? '#10b981'
                        : 'rgba(148, 163, 184, 0.3)',
                      color: isCurrent || isCompleted ? '#ffffff' : '#60748c',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? '✓' : step.number}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#009e9d' : isCompleted ? '#10b981' : '#60748c',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE SCROLLABLE CONTENT BODY */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            padding: '22px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={15} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: THÔNG TIN XE */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Dòng xe điện */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Dòng xe (Đồng bộ 3D Preview) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCurrentModelRegistrable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: isCurrentModelRegistrable ? '#10b981' : '#d97706',
                      }}
                    >
                      {isCurrentModelRegistrable ? 'Xe thuần điện (BEV) — Đủ điều kiện đăng ký' : 'Mô hình 3D trải nghiệm (Chỉ xem trước)'}
                    </span>
                  </div>
                  <select
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: isCurrentModelRegistrable ? '1.2px solid rgba(0, 201, 216, 0.4)' : '1.5px solid #f59e0b',
                      color: '#1e293b',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <optgroup label="XE ĐIỆN — CÓ THỂ ĐĂNG KÝ">
                      {getRegistrableEVModels().map((entry) => (
                        <option key={entry.id} value={entry.displayName}>
                          {entry.displayName} ({entry.batteryCapacityKwh ? `${entry.batteryCapacityKwh} kWh` : 'BEV'})
                        </option>
                      ))}
                      <option value="Khác (Tùy chỉnh)">Khác (Tùy chỉnh) (75.0 kWh)</option>
                    </optgroup>
                    <optgroup label="MÔ HÌNH 3D TRẢI NGHIỆM">
                      {getPreview3DModels().map((entry) => (
                        <option key={entry.id} value={entry.displayName}>
                          {entry.displayName} {entry.powertrain === 'ICE' ? '[Động cơ xăng]' : '[Chỉ xem trước 3D]'}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Warning banner when a non-registrable preview model is selected */}
                  {!isCurrentModelRegistrable && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1.2px solid rgba(245, 158, 11, 0.35)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '11.5px', color: '#92400e', lineHeight: 1.5 }}>
                        <strong>
                          {currentCatalogEntry?.powertrain === 'ICE'
                            ? 'Chế độ xem trước 3D (Động cơ xăng / ICE):'
                            : 'Mô hình 3D trải nghiệm (Chỉ xem trước):'}
                        </strong>
                        <div style={{ marginTop: '2px', color: '#b45309' }}>
                          {currentCatalogEntry?.noticeVi ||
                            `Mô hình ${model} đang được hiển thị 3D trên showroom. Nền tảng EVShare yêu cầu phương tiện đăng ký vào nhóm phải là Xe thuần điện (BEV) đã kiểm định.`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Màu sơn ngoại thất */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Màu sơn ngoại thất (Đồng bộ 3D Preview)</span>
                      {isPaintCustomizationSupported ? (
                        <span style={{ fontSize: '10px', color: '#009e9d', background: 'rgba(0, 201, 216, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          3D Live Sync
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#64748b', background: 'rgba(100, 116, 139, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Màu nguyên bản GLB
                        </span>
                      )}
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: isPaintCustomizationSupported ? '#009e9d' : '#64748b' }}>
                      {exteriorColor}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {VEHICLE_EXTERIOR_COLORS.map((colorItem) => {
                      const isSelected =
                        exteriorColor === colorItem.nameVi ||
                        exteriorColor === colorItem.code ||
                        exteriorColor === colorItem.hex;
                      return (
                        <button
                          key={colorItem.id}
                          type="button"
                          onClick={() => {
                            setExteriorColor(colorItem.nameVi);
                            onColorChange?.(colorItem.hex);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(0, 201, 216, 0.12)' : '#ffffff',
                            border: isSelected
                              ? '1.8px solid #00c9d8'
                              : '1.2px solid rgba(148, 163, 184, 0.35)',
                            boxShadow: isSelected
                              ? '0 2px 8px rgba(0, 201, 216, 0.22)'
                              : '0 1px 2px rgba(0, 0, 0, 0.03)',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: colorItem.hex,
                              border: colorItem.id === 'WHITE' ? '1.5px solid #cbd5e1' : '1px solid rgba(0, 0, 0, 0.2)',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: isSelected ? 800 : 600,
                              color: isSelected ? '#009e9d' : '#334155',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {colorItem.nameVi}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Biển số xe */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Biển số xe <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="VD: 30A-999.88"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Số khung VIN */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Số khung VIN <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="VD: VF8VN2026888999"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Dung lượng pin */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Dung lượng pin (kWh) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(Number(e.target.value))}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Năm sản xuất */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Năm sản xuất <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={manufactureYear}
                    onChange={(e) => setManufactureYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Định giá xe */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Định giá xe (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={vehicleValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVehicleValue(val);
                      setCoOwners(
                        coOwners.map((o) => ({
                          ...o,
                          contributionAmount: Math.round((val * (Number(o.sharePercentage) || 0)) / 100),
                        }))
                      );
                    }}
                    step="10000000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#60748c', marginTop: '2px', display: 'block' }}>
                    = {(vehicleValue / 1e6).toLocaleString()} triệu VNĐ
                  </span>
                </div>

                {/* Thành phố đăng ký */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Thành phố đăng ký <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={registrationCity}
                    onChange={(e) => setRegistrationCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CẤU HÌNH NHÓM */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Tên nhóm đồng sở hữu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="VD: Nhóm Đồng Sở Hữu VF8 Plus - Hà Nội"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1.2px solid rgba(0, 201, 216, 0.4)',
                    color: '#1e293b',
                    fontSize: '14px',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Mức đóng quỹ bảo dưỡng (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    value={monthlyFundContribution}
                    onChange={(e) => setMonthlyFundContribution(Number(e.target.value))}
                    step="100000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#60748c' }}>
                    {(monthlyFundContribution).toLocaleString()} VNĐ/tháng mỗi thành viên
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Số ngày đặt xe liên tiếp tối đa
                  </label>
                  <input
                    type="number"
                    value={maxConsecutiveBookingDays}
                    onChange={(e) => setMaxConsecutiveBookingDays(Number(e.target.value))}
                    min="1"
                    max="30"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#60748c' }}>
                    Đảm bảo công bằng quyền sử dụng xe
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Tỷ lệ dự phòng bảo dưỡng (%)
                  </label>
                  <input
                    type="number"
                    value={Math.round(maintenanceReserveRate * 100)}
                    onChange={(e) => setMaintenanceReserveRate(Number(e.target.value) / 100)}
                    min="0"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Phí nộp muộn (%)
                  </label>
                  <input
                    type="number"
                    value={Math.round(latePaymentFeeRate * 100)}
                    onChange={(e) => setLatePaymentFeeRate(Number(e.target.value) / 100)}
                    min="0"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PHÂN BỔ CỔ PHẦN */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Visual Segmented Ownership Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: '1px solid rgba(0, 201, 216, 0.3)',
                  boxShadow: '0 2px 10px rgba(0, 180, 200, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                    Cơ cấu cổ phần xe:
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: isStep3Valid
                        ? '#10b981'
                        : duplicateErrors
                        ? '#ef4444'
                        : '#f59e0b',
                    }}
                  >
                    {isStep3Valid
                      ? `✓ Đã phân bổ hợp lệ 100% (${coOwners.length} thành viên)`
                      : duplicateErrors
                      ? '⚠️ Có thành viên bị trùng lặp trong nhóm'
                      : hasIncompleteRow
                      ? `⚠️ Cần hoàn tất thông tin & tỷ lệ (> 0%) (${totalSharePercentage}% / 100%)`
                      : `Hiện tại: ${totalSharePercentage}% / 100%`}
                  </span>
                </div>

                <div
                  style={{
                    height: '10px',
                    borderRadius: '9999px',
                    background: 'rgba(148, 163, 184, 0.2)',
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  {coOwners.map((owner, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(owner.sharePercentage) || 0))}%`,
                        height: '100%',
                        background: MEMBER_COLORS[idx % MEMBER_COLORS.length],
                        transition: 'width 0.3s ease',
                      }}
                      title={`${owner.fullName || 'Thành viên'}: ${owner.sharePercentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Members List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {coOwners.map((owner, idx) => {
                  const isRep = idx === 0;
                  if (isRep) {
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1.2px solid rgba(0, 201, 216, 0.4)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'grid',
                          gridTemplateColumns: '3.5fr 1.2fr 1.5fr 28px',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <label style={{ fontSize: '11px', color: '#009e9d', fontWeight: 800, textTransform: 'uppercase' }}>
                              Người đại diện (Bạn)
                            </label>
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(0, 201, 216, 0.12)',
                                color: '#009e9d',
                                fontWeight: 700,
                              }}
                            >
                              Chủ xe / Sáng lập
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                              {owner.fullName || user?.fullName || 'Người đại diện'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              ({owner.email || user?.email})
                            </div>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '10.5px', color: '#60748c', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            Cổ phần (%)
                          </label>
                          <input
                            type="number"
                            value={owner.sharePercentage}
                            onChange={(e) =>
                              handleUpdateCoOwner(idx, 'sharePercentage', Number(e.target.value))
                            }
                            min="1"
                            max="100"
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1.2px solid rgba(0, 201, 216, 0.5)',
                              fontSize: '13px',
                              fontWeight: 800,
                              color: '#009e9d',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '10.5px', color: '#60748c', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            Số tiền góp
                          </label>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', paddingTop: '4px' }}>
                            {(owner.contributionAmount / 1e6).toLocaleString()} tr đ
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span title="Không thể xóa người đại diện" style={{ color: '#00c9d8' }}>
                            <ShieldCheck size={18} />
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: '3.5fr 1.2fr 1.5fr 28px',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '10.5px', color: '#60748c', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          Thành viên đồng sở hữu #{idx + 1}
                        </label>
                        <UserAutocompleteSelector
                          owner={owner}
                          index={idx}
                          creatorUserId={user?.id}
                          creatorEmail={user?.email}
                          allOwners={coOwners}
                          onSelectUser={(selectedUser) => {
                            const updated = [...coOwners];
                            updated[idx] = {
                              ...updated[idx],
                              userId: selectedUser.id,
                              fullName: selectedUser.fullName,
                              email: selectedUser.email,
                              isVerifiedAccount: true,
                            };
                            setCoOwners(updated);
                          }}
                          onClearUser={() => {
                            const updated = [...coOwners];
                            updated[idx] = {
                              ...updated[idx],
                              userId: undefined,
                              fullName: '',
                              email: '',
                              isVerifiedAccount: false,
                            };
                            setCoOwners(updated);
                          }}
                          onCustomEmail={(customEmail) => {
                            const updated = [...coOwners];
                            updated[idx] = {
                              ...updated[idx],
                              userId: undefined,
                              fullName: customEmail.split('@')[0],
                              email: customEmail,
                              isVerifiedAccount: false,
                            };
                            setCoOwners(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', color: '#60748c', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          Cổ phần (%)
                        </label>
                        <input
                          type="number"
                          value={owner.sharePercentage}
                          onChange={(e) =>
                            handleUpdateCoOwner(idx, 'sharePercentage', Number(e.target.value))
                          }
                          min="1"
                          max="100"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1.2px solid rgba(0, 201, 216, 0.5)',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#009e9d',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', color: '#60748c', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                          Số tiền góp
                        </label>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', paddingTop: '4px' }}>
                          {(owner.contributionAmount / 1e6).toLocaleString()} tr đ
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoOwner(idx)}
                          title="Xóa thành viên"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddCoOwner}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: 'rgba(0, 201, 216, 0.1)',
                    border: '1.2px dashed #00c9d8',
                    color: '#009e9d',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>+ Thêm thành viên đồng sở hữu</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ĐIỀU KHOẢN HỢP ĐỒNG */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: '1px solid rgba(0, 201, 216, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                    Phương tiện
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {model}
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c' }}>
                    Biển số: {plateNumber} • VIN: {vin}
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c' }}>
                    Pin: {batteryCapacityKwh} kWh • {registrationCity}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: '1px solid rgba(0, 201, 216, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                    Nhóm đồng sở hữu
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {groupName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c' }}>
                    Số thành viên: {coOwners.length} người
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c' }}>
                    Quỹ tháng: {monthlyFundContribution.toLocaleString()} đ/người
                  </div>
                </div>
              </div>

              {/* Agreement Terms Box */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: '#475569',
                }}
              >
                <h4 style={{ margin: '0 0 6px 0', fontSize: '12.5px', fontWeight: 800, color: '#1e293b' }}>
                  ĐIỀU KHOẢN THỎA THUẬN ĐỒNG SỞ HỮU EVSHARE 3D
                </h4>
                <p style={{ margin: '0 0 6px 0' }}>
                  1. <strong>Quyền sở hữu và tỷ lệ biểu quyết:</strong> Mỗi thành viên có quyền sở hữu
                  và quyền biểu quyết các đề xuất bảo trì, nâng cấp tương ứng với tỷ lệ cổ phần đã đăng ký.
                </p>
                <p style={{ margin: '0 0 6px 0' }}>
                  2. <strong>Quy chế đặt xe và sử dụng:</strong> Thành viên được đặt xe tối đa {maxConsecutiveBookingDays} ngày
                  liên tiếp. Chi phí sạc xe tự thanh toán dựa trên lượng điện nạp thực tế.
                </p>
                <p style={{ margin: '0 0 6px 0' }}>
                  3. <strong>Quỹ vận hành và bảo dưỡng:</strong> Khoản đóng quỹ {monthlyFundContribution.toLocaleString()} VNĐ/tháng
                  được quản lý tự động và minh bạch thông qua hệ thống quỹ chung EVShare 3D.
                </p>
              </div>

              {/* Acceptance Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#00c9d8' }}
                />
                <span>
                  Tôi đã đọc, hiểu rõ và đồng ý với các điều khoản thỏa thuận đồng sở hữu EVShare 3D.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* WORKSPACE PERSISTENT STICKY FOOTER */}
        <div
          style={{
            flex: '0 0 auto',
            padding: '16px 32px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderTop: '1px solid rgba(0, 201, 216, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: '9999px',
                background: 'rgba(0, 201, 216, 0.1)',
                border: '1px solid rgba(0, 201, 216, 0.35)',
                color: '#009e9d',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={14} />
              <span>{loading ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && !isCurrentModelRegistrable}
                style={{
                  padding: '9px 24px',
                  borderRadius: '9999px',
                  background:
                    currentStep === 1 && !isCurrentModelRegistrable
                      ? 'rgba(148, 163, 184, 0.4)'
                      : 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: currentStep === 1 && !isCurrentModelRegistrable ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow:
                    currentStep === 1 && !isCurrentModelRegistrable
                      ? 'none'
                      : '0 4px 14px rgba(0, 180, 200, 0.35)',
                }}
              >
                <span>
                  {currentStep === 1 && !isCurrentModelRegistrable
                    ? 'Chỉ xem trước 3D — Chọn dòng xe điện để tiếp tục'
                    : 'Tiếp tục'}
                </span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !agreementAccepted || !isSharesValid}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background:
                    agreementAccepted && isSharesValid
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : 'rgba(148, 163, 184, 0.3)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: agreementAccepted && isSharesValid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow:
                    agreementAccepted && isSharesValid
                      ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                      : 'none',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Đang nộp hồ sơ...' : 'GỬI ĐĂNG KÝ XE'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
