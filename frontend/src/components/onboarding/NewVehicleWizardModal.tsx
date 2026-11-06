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
  BookOpen,
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
import { ContractBookReaderModal } from './ContractBookReaderModal';

interface WizardStepErrorBoundaryProps {
  stepKey: number;
  onBack: () => void;
  children: React.ReactNode;
}

interface WizardStepErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WizardStepErrorBoundary extends React.Component<
  WizardStepErrorBoundaryProps,
  WizardStepErrorBoundaryState
> {
  constructor(props: WizardStepErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WizardStepErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[WizardStepErrorBoundary] Step rendering error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: WizardStepErrorBoundaryProps): void {
    if (prevProps.stepKey !== this.props.stepKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '20px 22px',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '14px', fontWeight: 800 }}>
              Không thể hiển thị bước hợp đồng. Vui lòng quay lại hoặc thử lại.
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            Dữ liệu bạn đã nhập ở các bước trước vẫn được giữ nguyên. Bạn có thể quay lại bước phân bổ cổ phần để kiểm tra hoặc thử tải lại bước hợp đồng.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onBack();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: '#ffffff',
                border: '1.2px solid rgba(148, 163, 184, 0.5)',
                color: '#334155',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Quay lại bước 3</span>
            </button>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        setResults(Array.isArray(data) ? data : []);
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

  const ownerFullName = String(owner?.fullName || '').trim();
  const ownerEmail = String(owner?.email || '').trim();

  // If already selected / populated
  if (ownerFullName && ownerEmail) {
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
            {ownerFullName.charAt(0).toUpperCase()}
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
              {ownerFullName}
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
              {ownerEmail}
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

export function getSuggestedGroupName(modelName?: string): string {
  const entry = modelName ? findCatalogEntryByModel(modelName) : undefined;
  const resolvedDisplayName = (entry?.displayName || modelName || 'VinFast VF8 Plus').trim();
  return `Nhóm Đồng Sở Hữu ${resolvedDisplayName}`;
}

function isAutoGeneratedGroupName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed === 'Nhóm Đồng Sở Hữu VF8') return true;
  return VEHICLE_CATALOG.some((c) => trimmed === `Nhóm Đồng Sở Hữu ${c.displayName}`) ||
    EV_MODELS.some((m) => trimmed === `Nhóm Đồng Sở Hữu ${m.name}`);
}

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
  const initialModelName = selectedModel || 'VinFast VF8 Plus';
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const submittingRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorActionStep, setErrorActionStep] = useState<number | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);
  const [isContractBookOpen, setIsContractBookOpen] = useState<boolean>(false);
  const [hasReviewedContractBook, setHasReviewedContractBook] = useState<boolean>(false);
  const [submittedApplication, setSubmittedApplication] = useState<VehicleRegistrationDraftResponse | null>(null);
  const [userExistingApplications, setUserExistingApplications] = useState<VehicleRegistrationDraftResponse[]>([]);
  const [loadedDraftStatus, setLoadedDraftStatus] = useState<string | undefined>(undefined);
  const [staffReviewFeedback, setStaffReviewFeedback] = useState<string | undefined>(undefined);

  // Form State - Step 1: Thông tin xe
  const [plateNumber, setPlateNumber] = useState('30A-999.88');
  const [plateValidationStatus, setPlateValidationStatus] = useState<'IDLE' | 'CHECKING' | 'AVAILABLE' | 'DUPLICATE'>('IDLE');
  const [plateValidationError, setPlateValidationError] = useState<string | null>(null);
  const [vinValidationError, setVinValidationError] = useState<string | null>(null);
  const plateCheckRequestIdRef = useRef<number>(0);
  const latestPlateNumberRef = useRef<string>('30A-999.88');
  const [model, setModel] = useState(initialModelName);
  const [exteriorColor, setExteriorColor] = useState<string>('Trắng ngọc trai');
  const [vin, setVin] = useState('VF8VN2026888999');
  const [isVinCustomized, setIsVinCustomized] = useState<boolean>(false);
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(87.7);
  const [manufactureYear, setManufactureYear] = useState(2025);
  const [vehicleValue, setVehicleValue] = useState(1200000000);
  const [registrationCity, setRegistrationCity] = useState('Hà Nội');

  const deriveSuggestedVin = (modelName: string, plate: string): string => {
    const lower = (modelName || '').toLowerCase();
    let prefix = 'EVS';
    if (lower.includes('hyundai') || lower.includes('mistra') || lower.includes('kona')) {
      prefix = 'HYU';
    } else if (lower.includes('tesla')) {
      prefix = 'TSL';
    } else if (lower.includes('vinfast') || lower.includes('vf')) {
      prefix = 'VFS';
    }
    const cleanPlate = (plate || '30A99988').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${prefix}VN2026${cleanPlate}99999999`.slice(0, 17);
  };

  // Keep latestPlateNumberRef synchronized
  useEffect(() => {
    latestPlateNumberRef.current = plateNumber;
  }, [plateNumber]);

  // Auto-sync default VIN when model or plate changes (unless manually customized by user)
  useEffect(() => {
    if (!isVinCustomized) {
      setVin(deriveSuggestedVin(model, plateNumber));
    }
  }, [model, plateNumber, isVinCustomized]);

  // Debounced live license plate uniqueness validation with request-ID + AbortController + normalized comparison
  useEffect(() => {
    if (!isOpen) return;
    const normalizedInputPlate = (plateNumber || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!normalizedInputPlate || normalizedInputPlate.length < 5) {
      plateCheckRequestIdRef.current += 1;
      setPlateValidationStatus('IDLE');
      setPlateValidationError(null);
      return;
    }

    const requestId = ++plateCheckRequestIdRef.current;
    const abortController = new AbortController();
    setPlateValidationStatus('CHECKING');

    const debounceTimer = window.setTimeout(async () => {
      try {
        const res = await onboardingApi.validateLicensePlate(
          normalizedInputPlate,
          draftId,
          abortController.signal
        );
        if (abortController.signal.aborted || requestId !== plateCheckRequestIdRef.current) {
          return;
        }
        const latestNormalized = (latestPlateNumberRef.current || '')
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '');
        if (latestNormalized !== normalizedInputPlate) {
          return;
        }

        if (res.available) {
          setPlateValidationStatus('AVAILABLE');
          setPlateValidationError(null);
        } else if (res.code === 'LICENSE_PLATE_EXISTS') {
          setPlateValidationStatus('DUPLICATE');
          setPlateValidationError(res.message || 'Biển số xe đã được đăng ký trong hệ thống.');
        } else {
          setPlateValidationStatus('IDLE');
          setPlateValidationError(null);
        }
      } catch (err: any) {
        if (abortController.signal.aborted || requestId !== plateCheckRequestIdRef.current) {
          return;
        }
        setPlateValidationStatus('IDLE');
      }
    }, 320);

    return () => {
      window.clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [plateNumber, draftId, isOpen]);

  const handlePlateNumberChange = (nextPlateValue: string) => {
    latestPlateNumberRef.current = nextPlateValue;
    setPlateNumber(nextPlateValue);
    setPlateValidationError(null);
    setPlateValidationStatus('IDLE');
    if (!isVinCustomized) {
      setVin(deriveSuggestedVin(model, nextPlateValue));
    }
    if (error) {
      const lowerErr = error.toLowerCase();
      if (
        errorActionStep === 1 ||
        lowerErr.includes('biển số') ||
        lowerErr.includes('license_plate') ||
        lowerErr.includes('trùng lặp')
      ) {
        setError(null);
        setErrorActionStep(null);
      }
    }
  };

  const handleVinChange = (nextVinValue: string) => {
    setVin(nextVinValue);
    setIsVinCustomized(true);
    setVinValidationError(null);
    if (error) {
      const lowerErr = error.toLowerCase();
      if (lowerErr.includes('vin') || lowerErr.includes('số khung') || lowerErr.includes('trùng lặp')) {
        setError(null);
        setErrorActionStep(null);
      }
    }
  };

  // Fetch user's existing drafts/pending applications so we can detect if entered plate already belongs to their own pending application
  useEffect(() => {
    if (!isOpen) return;
    onboardingApi
      .getMyDrafts()
      .then((list) => {
        if (Array.isArray(list)) {
          setUserExistingApplications(list);
        }
      })
      .catch(() => {
        // Ignore background lookup failure
      });
  }, [isOpen]);

  const matchingOwnPendingApplication = useMemo(() => {
    const normalizedInputPlate = (plateNumber || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!normalizedInputPlate) return null;
    return (
      userExistingApplications.find((app) => {
        const appPlate = String(app.plateNumber || app.licensePlate || '')
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '');
        return (
          appPlate === normalizedInputPlate &&
          (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW')
        );
      }) || null
    );
  }, [plateNumber, userExistingApplications]);

  // Form State - Step 2: Cấu hình nhóm
  const [groupName, setGroupName] = useState(() => getSuggestedGroupName(initialModelName));
  const [isGroupNameCustomized, setIsGroupNameCustomized] = useState<boolean>(false);
  const [monthlyFundContribution, setMonthlyFundContribution] = useState(2000000);
  const [latePaymentFeeRate, setLatePaymentFeeRate] = useState(0.05);
  const [maintenanceReserveRate, setMaintenanceReserveRate] = useState(0.15);
  const [maxConsecutiveBookingDays, setMaxConsecutiveBookingDays] = useState(7);

  // Synchronize incoming selectedModel if changed externally
  useEffect(() => {
    if (selectedModel && selectedModel !== model) {
      setModel(selectedModel);
      if (!isGroupNameCustomized) {
        setGroupName(getSuggestedGroupName(selectedModel));
      }
    }
  }, [selectedModel, model, isGroupNameCustomized]);

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
          setLoadedDraftStatus(draft.status);
          setStaffReviewFeedback(draft.reviewReason || draft.adminReviewNotes || undefined);
          setPlateNumber(draft.plateNumber || draft.licensePlate || '');
          const loadedModel = draft.model || draft.vehicleModel || 'VinFast VF8 Plus';
          setModel(loadedModel);
          onModelChange?.(loadedModel);
          if (draft.exteriorColor) {
            setExteriorColor(draft.exteriorColor);
            onColorChange?.(resolveVehicleColorHex(draft.exteriorColor));
          }
          setVin(draft.vin || '');
          setBatteryCapacityKwh(draft.batteryCapacityKwh || draft.batteryCapacity || 87.7);
          setManufactureYear(draft.manufactureYear || draft.productionYear || 2025);
          setVehicleValue(draft.vehicleValue || 1200000000);
          setRegistrationCity(draft.registrationCity || 'Hà Nội');

          const suggested = getSuggestedGroupName(loadedModel);
          const draftGroup = (draft.groupName || '').trim();
          const isStaleVf8Default =
            draftGroup === 'Nhóm Đồng Sở Hữu VF8' && !loadedModel.toLowerCase().includes('vf8');
          if (!draftGroup || isStaleVf8Default) {
            setGroupName(suggested);
            setIsGroupNameCustomized(false);
          } else {
            setGroupName(draftGroup);
            setIsGroupNameCustomized(draftGroup !== suggested && !isAutoGeneratedGroupName(draftGroup));
          }

          setMonthlyFundContribution(draft.monthlyFundContribution ?? 2000000);
          setLatePaymentFeeRate(draft.latePaymentFeeRate ?? 0.05);
          setMaintenanceReserveRate(draft.maintenanceReserveRate ?? 0.15);
          setMaxConsecutiveBookingDays(draft.maxConsecutiveBookingDays ?? 7);
          if (draft.coOwners && draft.coOwners.length > 0) {
            const val = draft.vehicleValue || 1200000000;
            setCoOwners(
              draft.coOwners.map((o: any, idx: number) => {
                const pct = Number(o.sharePercentage ?? o.percentage ?? 0);
                return {
                  userId: o.userId,
                  fullName: o.fullName || o.name || '',
                  email: o.email || '',
                  phoneNumber: o.phoneNumber || '',
                  sharePercentage: pct,
                  contributionAmount: o.contributionAmount || Math.round((val * pct) / 100),
                  role: idx === 0 ? 'REPRESENTATIVE' : (o.role || 'CO_OWNER'),
                  isVerifiedAccount: Boolean(o.userId || idx === 0),
                };
              })
            );
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
    if (isOpen && currentStep === 1 && !submittedApplication) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, submittedApplication]);

  // Escape key handler (only close wizard if contract book reader is not open)
  useEffect(() => {
    if (!isOpen || isContractBookOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isContractBookOpen, onClose]);

  if (!isOpen) return null;

  const safeVehicleValue = Number.isFinite(Number(vehicleValue)) ? Number(vehicleValue) : 0;
  const safeBatteryKwh = Number.isFinite(Number(batteryCapacityKwh)) ? Number(batteryCapacityKwh) : 0;
  const safeMonthlyFund = Number.isFinite(Number(monthlyFundContribution)) ? Number(monthlyFundContribution) : 0;
  const safeMaintenanceReserveRate = Number.isFinite(Number(maintenanceReserveRate))
    ? Number(maintenanceReserveRate)
    : 0.15;
  const safeMaintenanceReservePercent = Math.round(safeMaintenanceReserveRate * 100);
  const safeMaintenanceReserveAmount = Math.round(safeMonthlyFund * safeMaintenanceReserveRate);
  const safeLatePaymentFeeRate = Number.isFinite(Number(latePaymentFeeRate)) ? Number(latePaymentFeeRate) : 0.05;
  const safeLatePaymentFeePercent = Math.round(safeLatePaymentFeeRate * 100);
  const safeMaxConsecutiveDays = Math.max(
    1,
    Number.isFinite(Number(maxConsecutiveBookingDays)) ? Number(maxConsecutiveBookingDays) : 7
  );

  const normalizedCoOwners: CoOwnerInviteDraft[] = (Array.isArray(coOwners) ? coOwners : []).map((o, idx) => {
    const pct = Number.isFinite(Number(o?.sharePercentage)) ? Number(o.sharePercentage) : 0;
    const rawContrib = Number(o?.contributionAmount);
    const computedContrib =
      Number.isFinite(rawContrib) && rawContrib >= 0
        ? rawContrib
        : Math.round((safeVehicleValue * pct) / 100);
    return {
      userId: o?.userId,
      fullName: String(o?.fullName ?? (idx === 0 ? user?.fullName || '' : '')).trim(),
      email: String(o?.email ?? (idx === 0 ? user?.email || '' : '')).trim(),
      phoneNumber: String(o?.phoneNumber ?? '').trim(),
      sharePercentage: pct,
      contributionAmount: computedContrib,
      role: idx === 0 ? 'REPRESENTATIVE' : (o?.role || 'CO_OWNER'),
      isVerifiedAccount: Boolean(o?.isVerifiedAccount || o?.userId || idx === 0),
    };
  });

  const totalSharePercentage = normalizedCoOwners.reduce(
    (sum, o) => sum + (Number(o.sharePercentage) || 0),
    0
  );
  const isShares100Percent = Math.abs(totalSharePercentage - 100) < 0.001;

  // Duplicate checks
  const duplicateErrors = (() => {
    const userIds = new Set<string>();
    const emails = new Set<string>();
    for (const o of normalizedCoOwners) {
      if (o.userId) {
        if (userIds.has(o.userId)) return true;
        userIds.add(o.userId);
      }
      const em = o.email.toLowerCase();
      if (em) {
        if (emails.has(em)) return true;
        emails.add(em);
      }
    }
    return false;
  })();

  const hasIncompleteRow = normalizedCoOwners.some(
    (o) => !o.fullName || !o.email || Number(o.sharePercentage) <= 0
  );

  const isStep3Valid =
    isShares100Percent &&
    normalizedCoOwners.length >= 2 &&
    !hasIncompleteRow &&
    !duplicateErrors;

  const isSharesValid = isStep3Valid;

  const handleModelChange = (selectedModelName: string) => {
    setModel(selectedModelName);
    onModelChange?.(selectedModelName);

    // Dynamically update group name unless user customized it
    if (!isGroupNameCustomized || isAutoGeneratedGroupName(groupName)) {
      setGroupName(getSuggestedGroupName(selectedModelName));
      setIsGroupNameCustomized(false);
    }

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
        contributionAmount: Math.round((safeVehicleValue * remainingPct) / 100),
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
      updated[index].contributionAmount = Math.round((safeVehicleValue * pct) / 100);
    }
    setCoOwners(updated);
  };

  const resolvedGroupName = (groupName || '').trim() || getSuggestedGroupName(model);

  const buildContractMarkdown = (): string => {
    const ownerLines = normalizedCoOwners
      .map(
        (o, idx) =>
          `- Thành viên #${idx + 1}: ${o.fullName} (${o.email}) — ${o.sharePercentage}% (${(o.contributionAmount / 1e6).toLocaleString()} triệu VNĐ) [${idx === 0 ? 'Đại diện nhóm' : 'Đồng sở hữu'}]`
      )
      .join('\n');
    return [
      `# HỢP ĐỒNG ĐỒNG SỞ HỮU XE ĐIỆN EVSHARE 3D`,
      `- Nhóm đồng sở hữu: ${resolvedGroupName}`,
      `- Phương tiện: ${model} (${currentCatalogEntry?.brand || 'EVShare'})`,
      `- Biển số đăng ký: ${(plateNumber || '').trim().toUpperCase()}`,
      `- Số khung (VIN): ${(vin || '').trim().toUpperCase()}`,
      `- Dung lượng pin: ${safeBatteryKwh} kWh | Màu ngoại thất: ${exteriorColor} | Năm SX: ${manufactureYear}`,
      `- Định giá phương tiện: ${safeVehicleValue.toLocaleString()} VNĐ | Khu vực: ${registrationCity}`,
      `- Quỹ bảo dưỡng hàng tháng: ${safeMonthlyFund.toLocaleString()} VNĐ/tháng | Đặt xe liên tiếp tối đa: ${safeMaxConsecutiveDays} ngày`,
      `## Cơ cấu cổ phần (Tổng 100%):`,
      ownerLines,
    ].join('\n');
  };

  const buildPayload = (): VehicleRegistrationDraftRequest => ({
    name: model,
    plateNumber: (plateNumber || '').trim().toUpperCase(),
    model,
    manufacturer: currentCatalogEntry?.brand || undefined,
    model3dUrl: currentCatalogEntry?.publicUrl || undefined,
    exteriorColor,
    vin: (vin || '').trim().toUpperCase(),
    batteryCapacityKwh: safeBatteryKwh,
    manufactureYear,
    vehicleValue: safeVehicleValue,
    registrationCity,
    groupName: resolvedGroupName,
    monthlyFundContribution: safeMonthlyFund,
    latePaymentFeeRate: safeLatePaymentFeeRate,
    maintenanceReserveRate: safeMaintenanceReserveRate,
    maxConsecutiveBookingDays: safeMaxConsecutiveDays,
    coOwners: normalizedCoOwners,
    contractDraftMarkdown: buildContractMarkdown(),
    currentStep,
  });

  const resolveFriendlyWizardError = (
    err: any,
    currentPlate: string,
    currentVin: string
  ): { message: string; targetStep: number | null } => {
    const rawMsg = String(err?.data?.message || err?.message || '');
    const lower = rawMsg.toLowerCase();
    const code = String(err?.data?.code || '');
    const normalizedPlate = (currentPlate || '').trim().toUpperCase();
    const normalizedVin = (currentVin || '').trim().toUpperCase();

    if (
      code === 'LICENSE_PLATE_EXISTS' ||
      lower.includes('license_plate') ||
      lower.includes('biển số')
    ) {
      const cleanMessage = 'Biển số xe đã được đăng ký trong hệ thống.';
      setPlateValidationStatus('DUPLICATE');
      setPlateValidationError(cleanMessage);
      return {
        message: cleanMessage,
        targetStep: 1,
      };
    }

    if (
      code === 'VIN_EXISTS' ||
      lower.includes('vehicles.vin') ||
      lower.includes("for key 'vin'") ||
      lower.includes('số khung') ||
      lower.includes('số vin')
    ) {
      const cleanVinMessage =
        rawMsg && (rawMsg.toLowerCase().includes('vin') || rawMsg.toLowerCase().includes('số khung'))
          ? rawMsg
          : normalizedVin
          ? `Số khung (VIN) ${normalizedVin} đã được đăng ký cho một phương tiện hoặc hồ sơ khác. Vui lòng kiểm tra lại thông tin xe ở Bước 1.`
          : 'Số khung (VIN) đã được đăng ký trong hệ thống. Vui lòng kiểm tra lại thông tin xe ở Bước 1.';
      setVinValidationError(cleanVinMessage);
      return {
        message: cleanVinMessage,
        targetStep: 1,
      };
    }

    const isTechnical =
      lower.includes('could not execute statement') ||
      lower.includes('duplicate entry') ||
      lower.includes('sql [') ||
      lower.includes('insert into ') ||
      lower.includes('constraintviolationexception') ||
      lower.includes('dataintegrityviolationexception') ||
      lower.includes('hibernate');

    if (isTechnical) {
      return {
        message: 'Thông tin đăng ký xe bị trùng lặp hoặc không hợp lệ. Vui lòng kiểm tra lại thông tin xe.',
        targetStep: 1,
      };
    }

    return {
      message: rawMsg || 'Không thể xử lý yêu cầu đăng ký xe. Vui lòng thử lại.',
      targetStep: null,
    };
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    setErrorActionStep(null);
    if (currentStep === 1) {
      if (!(plateNumber || '').trim()) {
        setError('Vui lòng nhập biển số xe.');
        return false;
      }
      if (plateValidationStatus === 'DUPLICATE' || plateValidationError) {
        setError(plateValidationError || 'Biển số xe đã được đăng ký trong hệ thống.');
        return false;
      }
      if (!(vin || '').trim() || (vin || '').trim().length < 6) {
        setError('Vui lòng nhập số khung (VIN) hợp lệ (tối thiểu 6 ký tự).');
        return false;
      }
      if (vinValidationError) {
        setError(vinValidationError);
        return false;
      }
      if (!(model || '').trim()) {
        setError('Vui lòng chọn dòng xe điện.');
        return false;
      }
      if (!safeVehicleValue || safeVehicleValue <= 0) {
        setError('Định giá xe phải lớn hơn 0 VNĐ.');
        return false;
      }
      if (!isCurrentModelRegistrable) {
        setError('Mô hình này là xe động cơ đốt trong (ICE) chỉ dùng để xem trước 3D. Vui lòng chọn dòng xe thuần điện (BEV) để tiếp tục đăng ký.');
        return false;
      }
      if (!safeBatteryKwh || safeBatteryKwh <= 0) {
        setError('Dung lượng pin phải lớn hơn 0 kWh.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!(groupName || '').trim()) {
        setError('Vui lòng nhập tên nhóm đồng sở hữu.');
        return false;
      }
      if (safeMonthlyFund < 0) {
        setError('Mức đóng quỹ không thể âm.');
        return false;
      }
      if (safeMaxConsecutiveDays < 1) {
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
      if (normalizedCoOwners.length < 2) {
        setError('Cần tối thiểu 2 thành viên để thành lập nhóm đồng sở hữu xe.');
        return false;
      }
      if (duplicateErrors) {
        setError('Có thành viên bị trùng lặp trong danh sách. Vui lòng kiểm tra lại.');
        return false;
      }
      const invalidOwner = normalizedCoOwners.find(
        (o) => !o.fullName || !o.email || Number(o.sharePercentage) <= 0
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
    if (submittedApplication || submittingRef.current) return;
    if (targetStep < currentStep) {
      setError(null);
      setErrorActionStep(null);
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      if (validateCurrentStep()) {
        setCurrentStep(targetStep);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (loading || submitting || submittingRef.current) return;
    setError(null);
    setErrorActionStep(null);
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
      onSuccess();
      alert('Đã lưu bản nháp đăng ký xe thành công!');
    } catch (err: any) {
      const resolved = resolveFriendlyWizardError(err, plateNumber, vin);
      setError(resolved.message);
      setErrorActionStep(resolved.targetStep);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting || submittingRef.current) return;
    if (!validateCurrentStep()) return;
    if (!isStep3Valid) {
      setError('Vui lòng hoàn thành hợp lệ phân bổ cổ phần (tổng 100%, tối thiểu 2 thành viên không trùng lặp và cổ phần > 0%).');
      return;
    }
    if (!agreementAccepted) {
      setError('Vui lòng đọc và xác nhận đồng ý với điều khoản hợp đồng đồng sở hữu.');
      return;
    }
    setError(null);
    setErrorActionStep(null);
    submittingRef.current = true;
    setSubmitting(true);
    try {
      let currentDraftId = draftId;
      const payload = buildPayload();
      if (!currentDraftId) {
        const draftRes = await onboardingApi.saveDraft(payload);
        currentDraftId = draftRes.id;
        setDraftId(currentDraftId);
      } else {
        await onboardingApi.updateDraft(currentDraftId, payload);
      }
      const submittedRes = await onboardingApi.submitDraft(currentDraftId);
      setSubmittedApplication(submittedRes);
      onSuccess();
    } catch (err: any) {
      const resolved = resolveFriendlyWizardError(err, plateNumber, vin);
      setError(resolved.message);
      setErrorActionStep(resolved.targetStep);
    } finally {
      submittingRef.current = false;
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
      {/* LEFT 42% REGION: 3D VEHICLE METADATA OVERLAY (HIDDEN IN EXCLUSIVE CONTRACT READING MODE) */}
      <div
        style={{
          flex: '1 1 auto',
          position: 'relative',
          pointerEvents: 'none',
          display: isContractBookOpen ? 'none' : 'flex',
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

      {/* RIGHT 58% REGION: FROSTED WHITE GLASS REGISTRATION WORKSPACE (HIDDEN IN EXCLUSIVE CONTRACT READING MODE) */}
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
          display: isContractBookOpen ? 'none' : 'flex',
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
          onWheel={(e) => e.stopPropagation()}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '18px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {staffReviewFeedback && !submittedApplication && (
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                background:
                  loadedDraftStatus === 'REJECTED'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(245, 158, 11, 0.1)',
                border:
                  loadedDraftStatus === 'REJECTED'
                    ? '1.2px solid rgba(239, 68, 68, 0.35)'
                    : '1.2px solid rgba(245, 158, 11, 0.4)',
                color: loadedDraftStatus === 'REJECTED' ? '#b91c1c' : '#92400e',
                fontSize: '12px',
                lineHeight: 1.5,
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              <AlertCircle
                size={16}
                color={loadedDraftStatus === 'REJECTED' ? '#dc2626' : '#d97706'}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, marginBottom: '2px' }}>
                  {loadedDraftStatus === 'REJECTED'
                    ? 'Phản hồi từ Nhân viên vận hành (Hồ sơ bị từ chối):'
                    : 'Yêu cầu chỉnh sửa / bổ sung từ Nhân viên vận hành:'}
                </div>
                <div>{staffReviewFeedback}</div>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.2px solid rgba(239, 68, 68, 0.38)',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 240px' }}>
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>{error}</span>
              </div>
              {errorActionStep === 1 && currentStep !== 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                  }}
                  style={{
                    flexShrink: 0,
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    background: '#ffffff',
                    border: '1.2px solid rgba(239, 68, 68, 0.45)',
                    color: '#dc2626',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 4px rgba(239, 68, 68, 0.12)',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Quay lại thông tin xe</span>
                </button>
              )}
            </div>
          )}

          {/* PENDING STAFF REVIEW CONFIRMATION STATE */}
          {submittedApplication ? (
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '22px 24px',
                border: '1.5px solid rgba(0, 201, 216, 0.45)',
                boxShadow: '0 8px 28px rgba(0, 180, 200, 0.1)',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1.2px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  ⏳
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#b45309',
                      background: 'rgba(245, 158, 11, 0.14)',
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      marginBottom: '4px',
                    }}
                  >
                    TRẠNG THÁI HỒ SƠ: {submittedApplication.status || 'SUBMITTED'} (ĐANG CHỜ NHÂN VIÊN XÉT DUYỆT)
                  </div>
                  <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 900, color: '#1e293b' }}>
                    Đăng ký xe thành công. Hồ sơ của bạn đang chờ nhân viên xét duyệt.
                  </h2>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                Hồ sơ đăng ký xe và thành lập nhóm đồng sở hữu của bạn đã được chuyển tới bộ phận{' '}
                <strong>Nhân viên vận hành (STAFF)</strong> để thẩm định thông tin phương tiện, biển số, số VIN
                và cơ cấu cổ phần. Phương tiện và lời mời thành viên sẽ được kích hoạt ngay sau khi hồ sơ được
                phê duyệt.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>MÃ HỒ SƠ ĐĂNG KÝ</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {submittedApplication.id}
                  </div>
                </div>
                <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>THỜI GIAN GỬI HỒ SƠ</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {new Date(
                      submittedApplication.submittedAt || submittedApplication.updatedAt || Date.now()
                    ).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>PHƯƠNG TIỆN ĐĂNG KÝ</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#009e9d', marginTop: '2px' }}>
                    {submittedApplication.model || model}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    Biển số: <strong>{submittedApplication.plateNumber || plateNumber}</strong> • VIN:{' '}
                    {submittedApplication.vin || vin}
                  </div>
                </div>
                <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>NHÓM ĐỒNG SỞ HỮU ĐỀ XUẤT</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {submittedApplication.groupName || resolvedGroupName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    {coOwners.length} thành viên • Định giá: {(vehicleValue / 1e6).toLocaleString()} triệu VNĐ
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* STEP 1: THÔNG TIN XE */}
          {!submittedApplication && currentStep === 1 && (
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
                    onChange={(e) => handlePlateNumberChange(e.target.value)}
                    placeholder="VD: 30A-999.88"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border:
                        plateValidationStatus === 'DUPLICATE' || plateValidationError
                          ? '1.5px solid #ef4444'
                          : plateValidationStatus === 'AVAILABLE'
                          ? '1.5px solid #10b981'
                          : '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  {plateValidationStatus === 'CHECKING' && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#009e9d',
                      }}
                    >
                      Đang kiểm tra biển số...
                    </div>
                  )}
                  {(plateValidationStatus === 'DUPLICATE' || plateValidationError) && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      {plateValidationError || 'Biển số xe đã được đăng ký trong hệ thống.'}
                    </div>
                  )}
                  {plateValidationStatus === 'AVAILABLE' && !plateValidationError && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#059669',
                      }}
                    >
                      Biển số hợp lệ để tiếp tục.
                    </div>
                  )}
                </div>

                {/* Số khung VIN */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Số khung VIN <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => handleVinChange(e.target.value)}
                    placeholder="VD: VF8VN2026888999"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: vinValidationError
                        ? '1.5px solid #ef4444'
                        : '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  {vinValidationError && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      {vinValidationError}
                    </div>
                  )}
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
          {!submittedApplication && currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Tên nhóm đồng sở hữu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: isGroupNameCustomized
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(0, 201, 216, 0.12)',
                        color: isGroupNameCustomized ? '#2563eb' : '#009e9d',
                      }}
                    >
                      {isGroupNameCustomized ? 'Tên tùy chỉnh' : `Tự động theo xe (${model})`}
                    </span>
                    {(isGroupNameCustomized || groupName.trim() !== getSuggestedGroupName(model)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setGroupName(getSuggestedGroupName(model));
                          setIsGroupNameCustomized(false);
                        }}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          borderRadius: '5px',
                          border: '1px solid rgba(0, 201, 216, 0.45)',
                          background: '#ffffff',
                          color: '#009e9d',
                          cursor: 'pointer',
                        }}
                      >
                        Đặt lại theo tên xe
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setGroupName(nextVal);
                    const suggested = getSuggestedGroupName(model);
                    if (!nextVal.trim() || nextVal.trim() === suggested) {
                      setIsGroupNameCustomized(false);
                    } else {
                      setIsGroupNameCustomized(true);
                    }
                  }}
                  onBlur={() => {
                    if (!groupName.trim()) {
                      setGroupName(getSuggestedGroupName(model));
                      setIsGroupNameCustomized(false);
                    }
                  }}
                  placeholder={`VD: ${getSuggestedGroupName(model)}`}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
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

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '14px' }}>
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
          {!submittedApplication && currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
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
                          gridTemplateColumns: 'minmax(0, 3.5fr) minmax(0, 1.2fr) minmax(0, 1.5fr) 28px',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                              boxSizing: 'border-box',
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
                        gridTemplateColumns: 'minmax(0, 3.5fr) minmax(0, 1.2fr) minmax(0, 1.5fr) 28px',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
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
                            boxSizing: 'border-box',
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
          {!submittedApplication && currentStep === 4 && (
            <WizardStepErrorBoundary
              stepKey={currentStep}
              onBack={() => setCurrentStep(3)}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '0 0 auto',
                  gap: '12px',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {(!(model || '').trim() ||
                  !(plateNumber || '').trim() ||
                  !(vin || '').trim() ||
                  safeVehicleValue <= 0 ||
                  !isStep3Valid) && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1.2px solid rgba(245, 158, 11, 0.45)',
                      color: '#b45309',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    <span>
                      Một số thông tin phương tiện hoặc phân bổ cổ phần chưa hoàn tất. Vui lòng kiểm tra lại trước khi đăng ký xe.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentStep(
                          !(model || '').trim() || !(plateNumber || '').trim() || !(vin || '').trim()
                            ? 1
                            : 3
                        )
                      }
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        background: '#ffffff',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#b45309',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Quay lại kiểm tra
                    </button>
                  </div>
                )}

                {/* Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '10px',
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      border: '1px solid rgba(0, 201, 216, 0.3)',
                      minWidth: 0,
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                      Phương tiện
                    </span>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                      {model || 'Chưa chọn dòng xe'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#60748c' }}>
                      Biển số: <strong>{plateNumber || '—'}</strong> • VIN: {vin || '—'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#60748c' }}>
                      Pin: {safeBatteryKwh} kWh • Màu: {exteriorColor || '—'} • {registrationCity || '—'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#009e9d', fontWeight: 700, marginTop: '2px' }}>
                      Định giá: {(safeVehicleValue / 1e6).toLocaleString()} triệu VNĐ
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      border: '1px solid rgba(0, 201, 216, 0.3)',
                      minWidth: 0,
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                      Nhóm đồng sở hữu
                    </span>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                      {resolvedGroupName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#60748c' }}>
                      Đại diện: <strong>{normalizedCoOwners[0]?.fullName || user?.fullName || 'Chủ xe'}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#60748c' }}>
                      Số thành viên: {normalizedCoOwners.length} người • Quỹ tháng: {safeMonthlyFund.toLocaleString()} đ/người
                    </div>
                  </div>
                </div>

                {/* Co-Owner Share Table Summary */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '9px 14px',
                    border: '1px solid rgba(148, 163, 184, 0.28)',
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                    DANH SÁCH ĐỒNG SỞ HỮU TRONG HỒ SƠ ({normalizedCoOwners.length} THÀNH VIÊN — TỔNG {totalSharePercentage}%)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {normalizedCoOwners.map((o, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11.5px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: idx === 0 ? 'rgba(0, 201, 216, 0.08)' : '#f8fafc',
                          gap: '8px',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#1e293b',
                            fontWeight: idx === 0 ? 700 : 600,
                          }}
                        >
                          {idx + 1}. {o.fullName || 'Chưa nhập tên'} ({o.email || 'Chưa nhập email'}){' '}
                          {idx === 0 ? '— Đại diện' : ''}
                        </span>
                        <span style={{ flexShrink: 0, fontWeight: 800, color: '#009e9d' }}>
                          {o.sharePercentage}% ({(o.contributionAmount / 1e6).toLocaleString()} tr đ)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {matchingOwnPendingApplication && (
                  <div
                    role="status"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(0, 201, 216, 0.1)',
                      border: '1.2px solid rgba(0, 201, 216, 0.45)',
                      color: '#0f172a',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: '#007a78', marginBottom: '2px' }}>
                        Bạn đã có hồ sơ chờ xét duyệt cho biển số {plateNumber}
                      </div>
                      <div style={{ color: '#334155', fontSize: '11.5px' }}>
                        Nếu nhấn &ldquo;ĐĂNG KÝ XE&rdquo;, hệ thống sẽ tự động cập nhật hồ sơ chờ duyệt hiện tại của bạn mà không báo lỗi trùng biển số.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmittedApplication(matchingOwnPendingApplication)}
                      style={{
                        flexShrink: 0,
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        background: '#009e9d',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Xem trạng thái hồ sơ đang chờ duyệt
                    </button>
                  </div>
                )}

                {/* Compact Contract Book Card (Replaces Large Inline Scrollable Box) */}
                <div
                  role="region"
                  aria-label="Hợp đồng đồng sở hữu xe"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f4fbfb 100%)',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    border: '1.5px solid rgba(0, 201, 216, 0.45)',
                    boxShadow: '0 8px 24px rgba(0, 158, 157, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    flexShrink: 0,
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 0, flex: '1 1 280px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #0f2942 0%, #0a192f 100%)',
                          border: '1.5px solid rgba(0, 201, 216, 0.5)',
                          boxShadow: '0 6px 16px rgba(15, 41, 66, 0.22)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#00c9d8',
                        }}
                      >
                        <FileText size={24} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: 900,
                              color: '#0f172a',
                              letterSpacing: '0.2px',
                            }}
                          >
                            HỢP ĐỒNG ĐỒNG SỞ HỮU XE
                          </h4>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 9px',
                              borderRadius: '9999px',
                              background: hasReviewedContractBook
                                ? 'rgba(16, 185, 129, 0.14)'
                                : 'rgba(0, 201, 216, 0.14)',
                              color: hasReviewedContractBook ? '#059669' : '#007a78',
                              border: hasReviewedContractBook
                                ? '1px solid rgba(16, 185, 129, 0.35)'
                                : '1px solid rgba(0, 201, 216, 0.35)',
                            }}
                          >
                            {hasReviewedContractBook ? '✓ Đã xem chi tiết hợp đồng' : 'Chi tiết hợp đồng (4 trang)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#009e9d', marginTop: '3px' }}>
                          {model || 'Chưa chọn dòng xe'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                           Văn kiện pháp lý điện tử gồm 6 điều khoản quy định quyền sở hữu, lịch đặt xe, quỹ vận hành và quy trình phê duyệt của Nhân viên vận hành.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsContractBookOpen(true)}
                      style={{
                        flexShrink: 0,
                        padding: '11px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0f2942 0%, #007a78 100%)',
                        border: '1.2px solid rgba(0, 201, 216, 0.55)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        letterSpacing: '0.4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 18px rgba(0, 122, 120, 0.28)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <FileText size={16} color="#00c9d8" />
                      <span>XEM CHI TIẾT HỢP ĐỒNG</span>
                    </button>
                  </div>

                  {/* Supporting Contract Metadata Pills */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(0, 201, 216, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(248, 250, 252, 0.9)',
                        borderRadius: '10px',
                        padding: '7px 10px',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Số thành viên
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                        {normalizedCoOwners.length} đồng sở hữu
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(248, 250, 252, 0.9)',
                        borderRadius: '10px',
                        padding: '7px 10px',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Tổng tỷ lệ sở hữu
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#009e9d', marginTop: '1px' }}>
                        {totalSharePercentage}% cổ phần
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(248, 250, 252, 0.9)',
                        borderRadius: '10px',
                        padding: '7px 10px',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Trạng thái văn kiện
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                        {hasReviewedContractBook ? 'Đã đọc điều khoản' : 'Sẵn sàng mở đọc'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#1e293b',
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreementAccepted}
                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#00c9d8', marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    Tôi đã đọc, hiểu rõ và đồng ý với các điều khoản thỏa thuận đồng sở hữu EVShare 3D và gửi hồ sơ đăng ký xe chờ nhân viên xét duyệt.
                  </span>
                </label>
              </div>
            </WizardStepErrorBoundary>
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
          {submittedApplication ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 26px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 180, 200, 0.35)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Đóng & Theo dõi trạng thái hồ sơ</span>
              </button>
            </div>
          ) : (
            <>
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
                    <span>{submitting ? 'Đang đăng ký...' : 'ĐĂNG KÝ XE'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DEDICATED 3D CONTRACT BOOK READER (EXCLUSIVE READING MODE) */}
      {isContractBookOpen && (
        <div style={{ pointerEvents: 'auto' }}>
          <ContractBookReaderModal
            isOpen={isContractBookOpen}
            onClose={() => setIsContractBookOpen(false)}
            onCompleteReview={() => {
              setHasReviewedContractBook(true);
              setIsContractBookOpen(false);
            }}
            model={model || 'Xe điện EVShare 3D'}
            brand={currentCatalogEntry?.brand}
            plateNumber={plateNumber || '—'}
            vin={vin || '—'}
            batteryKwh={safeBatteryKwh}
            exteriorColor={exteriorColor || '—'}
            manufactureYear={manufactureYear}
            vehicleValue={safeVehicleValue}
            registrationCity={registrationCity || 'Hà Nội'}
            groupName={resolvedGroupName}
            coOwners={normalizedCoOwners.map((o, idx) => ({
              name: o.fullName || `Thành viên #${idx + 1}`,
              email: o.email || '',
              sharePercentage: Number(o.sharePercentage) || 0,
              isRepresentative: idx === 0 || o.role === 'REPRESENTATIVE',
            }))}
            totalSharePercentage={totalSharePercentage}
            maxConsecutiveDays={safeMaxConsecutiveDays}
            monthlyFund={safeMonthlyFund}
            maintenanceReservePercent={safeMaintenanceReservePercent}
            maintenanceReserveAmount={safeMaintenanceReserveAmount}
            latePaymentFeePercent={safeLatePaymentFeePercent}
            votingRuleLabel="Biểu quyết theo tỷ lệ cổ phần sở hữu (Ngưỡng thông qua ≥ 65%)"
          />
        </div>
      )}
    </div>,
    document.body
  );
};
