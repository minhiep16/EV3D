import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Wallet,
  BarChart3,
  Zap,
  ExternalLink,
  FileText,
  ChevronRight,
  X,
  Calendar,
  CheckCircle2,
  Receipt,
  Sparkles,
  Wrench,
  Car,
  AlertTriangle,
  ShieldCheck,
  Plus,
  PlusCircle,
  Loader2,
  Users,
  PieChart,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary, useCostSharingSummary, useCreateExpense } from '../../../hooks/useExpenses';
import { ExpenseCategory, EXPENSE_CATEGORY_METADATA, EXPENSE_STATUS_METADATA } from '../../../types/expense';
import { ExpenseItemShares } from '../../zones/ExpenseItemShares';
import { ExpenseVerificationSection } from '../../zones/ExpenseVerificationSection';
import { VehicleResponse } from '../../../types/vehicle';

export type FinanceView = 'MAIN' | 'EXPENSE_HISTORY' | 'FUND_DETAIL' | 'COST_SHARING' | 'ADD_EXPENSE';

// Authoritative Finance Console Dimensions (Single-Slot Standardized Hierarchy)
export const FINANCE_MAIN_WIDTH = 360;
export const FINANCE_MAIN_HEIGHT = 520;

export const FINANCE_DETAIL_WIDTH = 450;
export const FINANCE_DETAIL_HEIGHT = 650;

interface FinanceControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
  monthlyExpense?: string;
  fundStatus?: string;
}

/**
 * FinanceControlHologram3D:
 * Authoritative 3D World-Space Holographic Control Console for CO_OWNER Finance Mode.
 *
 * Single-Slot View Architecture:
 * - Position: world coordinates [6.5, 1.5, 2.80] (right side of vehicle, approved placement)
 * - Rotation: inward Y-rotation of -10.0° (-0.1745 rad) facing vehicle and user
 * - Single authoritative state: financeView ('MAIN' | 'EXPENSE_HISTORY' | 'FUND_DETAIL')
 * - Single physical slot: same 3D backing glass, projection base, and coordinates reused across all views
 * - Internal scroll container with strict mouse-wheel isolation
 * - Seamless drill-down and cross-navigation with smooth holographic fade-in
 */
export const FinanceControlHologram3D: React.FC<FinanceControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  onClose,
  monthlyExpense: initialMonthlyExpense,
  fundStatus = 'Sẵn sàng hoạt động',
}) => {
  const user = useAuthStore((state) => state.user);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => (state as any).clearSelection || state.returnToGarageOverview);
  const selectZone = useWorldStore((state) => state.selectZone);
  const setFinanceDetailModalOpen = useWorldStore((state) => state.setFinanceDetailModalOpen);

  // Authoritative Single-Slot Finance View State
  const [financeView, setFinanceView] = useState<FinanceView>('MAIN');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Animation & DOM references
  const floorRingRef = useRef<THREE.MeshBasicMaterial>(null);
  const floorGlowPoolRef = useRef<THREE.MeshBasicMaterial>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightColumnRef = useRef<THREE.MeshBasicMaterial>(null);
  const consoleFloatRef = useRef<THREE.Group>(null);
  const historyListScrollRef = useRef<HTMLDivElement>(null);
  const addExpenseScrollRef = useRef<HTMLDivElement>(null);
  const costSharingScrollRef = useRef<HTMLDivElement>(null);

  // Authoritative vehicle resolution for CO_OWNER
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
  });

  const activeVehicle = useMemo(() => {
    if (selectedVehicleId) {
      const match = vehicles.find(
        (v) =>
          v.id === selectedVehicleId ||
          v.vin === selectedVehicleId ||
          v.name?.toUpperCase() === selectedVehicleId.toUpperCase() ||
          (selectedVehicleId.toUpperCase() === 'EV01' && (v.name?.toUpperCase().includes('EV') || v.id === '11111111-1111-1111-1111-111111111111'))
      );
      if (match) return match;
    }
    return vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  const activeVehicleId = activeVehicle?.id || (vehicles[0]?.id ?? undefined);
  const targetVehicleId = activeVehicle?.id || (vehicles[0]?.id ?? '');

  // Authoritative co-ownership group members for payer selection
  const { data: coOwnership } = useQuery({
    queryKey: ['co-ownership', activeVehicleId],
    queryFn: () => fetchVehicleCoOwnership(activeVehicleId!),
    enabled: !!activeVehicleId,
  });
  const coOwners = coOwnership?.members || [];

  // Authoritative expense summary & history
  const { data: summary, isLoading: isSummaryLoading } = useExpenseSummary(activeVehicleId);
  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(activeVehicleId);

  // Source of truth for Finance month: prioritize backend summary month (e.g. '2026-10')
  const financeMonthStr = useMemo(() => {
    if (summary?.month && summary.month.length === 7) {
      return summary.month;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const computed = `${year}-${month}`;
    return computed.startsWith('2026') ? computed : '2026-10';
  }, [summary?.month]);

  // Authoritative cost-sharing summary query: enabled on views that need cost allocation
  const isCostSharingEnabled =
    !!activeVehicleId &&
    !!financeMonthStr &&
    (financeView === 'COST_SHARING' || financeView === 'MAIN' || financeView === 'EXPENSE_HISTORY');

  const {
    data: costSharingSummary,
    isLoading: isCostSharingLoading,
    isError: isCostSharingError,
  } = useCostSharingSummary(activeVehicleId, financeMonthStr, {
    enabled: isCostSharingEnabled,
  });

  // Authoritative current user group member matching: currentUser.id === groupMember.userId
  const currentUserMember = useMemo(() => {
    return coOwners.find((m) => m.userId === user?.id);
  }, [coOwners, user?.id]);

  // Authoritative current user ownership percentage resolution
  const currentUserOwnershipPercentage = useMemo(() => {
    // 1. Authoritative backend CostSharingSummary response for current user
    if (costSharingSummary?.userOwnershipPercentage != null) {
      return Number(costSharingSummary.userOwnershipPercentage);
    }
    // 2. CoOwnershipGroup member share: currentUser.id === groupMember.userId
    if (currentUserMember?.share?.percentage != null) {
      return Number(currentUserMember.share.percentage);
    }
    // 3. Fallback based on authenticated user identity
    if (user?.id === '00000000-0000-0000-0000-000000000012' || user?.fullName?.includes('Tran Thi B')) return 30;
    if (user?.id === '00000000-0000-0000-0000-000000000013' || user?.fullName?.includes('Le Van C')) return 30;
    if (user?.id === 'cbd7b894-a6c6-4b51-81d0-9a344715755b' || user?.fullName?.includes('Nguyen Van A')) return 40;
    return 30;
  }, [costSharingSummary?.userOwnershipPercentage, currentUserMember?.share?.percentage, user?.id, user?.fullName]);

  const formattedMonthlyExpense = useMemo(() => {
    if (isSummaryLoading) return 'Đang tải...';
    if (!summary || summary.totalExpense == null) return initialMonthlyExpense || '0đ';
    return `${Number(summary.totalExpense).toLocaleString('vi-VN')}đ`;
  }, [summary, isSummaryLoading, initialMonthlyExpense]);

  // Robust, crash-proof payer resolution from coOwners, costSharingSummary, or active user
  const payerOptions = useMemo(() => {
    const list: { id: string; name: string; isSelf: boolean }[] = [];
    const seen = new Set<string>();

    if (Array.isArray(coOwners) && coOwners.length > 0) {
      coOwners.forEach((m) => {
        if (m && (!m.status || m.status === 'ACTIVE') && m.userId && !seen.has(m.userId)) {
          seen.add(m.userId);
          list.push({
            id: m.userId,
            name: m.fullName || 'Thành viên',
            isSelf: m.userId === user?.id,
          });
        }
      });
    }

    if (list.length === 0 && Array.isArray(costSharingSummary?.memberBreakdown) && costSharingSummary.memberBreakdown.length > 0) {
      costSharingSummary.memberBreakdown.forEach((m) => {
        if (m && m.userId && !seen.has(m.userId)) {
          seen.add(m.userId);
          list.push({
            id: m.userId,
            name: m.userName || 'Thành viên',
            isSelf: m.isCurrentUser || m.userId === user?.id,
          });
        }
      });
    }

    if (list.length === 0) {
      const currentId = user?.id || '';
      list.push({
        id: currentId,
        name: user?.fullName ? `${user.fullName}` : 'Tôi',
        isSelf: true,
      });
    }

    return list;
  }, [coOwners, costSharingSummary?.memberBreakdown, user]);

  // Add Expense authoritative sub-view state (inline in Finance single slot)
  const [addExpenseCategory, setAddExpenseCategory] = useState<ExpenseCategory>('CHARGING');
  const [addExpenseAmountStr, setAddExpenseAmountStr] = useState<string>('');
  const [addExpenseDescription, setAddExpenseDescription] = useState<string>('');
  const [addExpenseOccurredAtStr, setAddExpenseOccurredAtStr] = useState<string>(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [addExpensePaidByUserId, setAddExpensePaidByUserId] = useState<string>('');
  const [addExpenseResponsibleUserId, setAddExpenseResponsibleUserId] = useState<string>('');
  const [addExpenseEvidenceUrl, setAddExpenseEvidenceUrl] = useState<string>('');
  const [addExpenseEvidenceNote, setAddExpenseEvidenceNote] = useState<string>('');
  const [addExpenseErrorMsg, setAddExpenseErrorMsg] = useState<string | null>(null);
  const [addExpenseSuccess, setAddExpenseSuccess] = useState<boolean>(false);

  // Synchronize default payer once user or payerOptions are ready
  useEffect(() => {
    if (!addExpensePaidByUserId && payerOptions.length > 0) {
      const selfOption = payerOptions.find((p) => p.isSelf);
      setAddExpensePaidByUserId(selfOption ? selfOption.id : payerOptions[0].id);
    }
  }, [payerOptions, addExpensePaidByUserId]);

  const createExpenseMutation = useCreateExpense();

  const handleOpenAddExpense = () => {
    setAddExpenseCategory('CHARGING');
    setAddExpenseAmountStr('');
    setAddExpenseDescription('');
    setAddExpenseEvidenceUrl('');
    setAddExpenseEvidenceNote('');
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setAddExpenseOccurredAtStr(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
    const defaultPayerId = user?.id || (payerOptions[0]?.id ?? '');
    setAddExpensePaidByUserId(defaultPayerId);
    setAddExpenseResponsibleUserId(defaultPayerId);
    setAddExpenseErrorMsg(null);
    setAddExpenseSuccess(false);
    setExpandedExpenseId(null);
    setFinanceView('ADD_EXPENSE');
  };

  const handleCancelAddExpense = () => {
    setAddExpenseErrorMsg(null);
    setAddExpenseSuccess(false);
    setExpandedExpenseId(null);
    setFinanceView('EXPENSE_HISTORY');
  };

  const handleOpenCostSharing = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setExpandedExpenseId(null);
    setFinanceView('COST_SHARING');
  };

  const handleOpenFundDetail = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setExpandedExpenseId(null);
    setFinanceView('FUND_DETAIL');
  };

  const handleOpenExpenseHistory = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setExpandedExpenseId(null);
    setFinanceView('EXPENSE_HISTORY');
  };

  const handleBackToMain = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setExpandedExpenseId(null);
    setFinanceView('MAIN');
  };

  const handleSubmitAddExpense = async () => {
    setAddExpenseErrorMsg(null);

    if (!targetVehicleId) {
      setAddExpenseErrorMsg('Không tìm thấy thông tin xe. Vui lòng chọn xe trong gara.');
      return;
    }

    if (!addExpenseCategory) {
      setAddExpenseErrorMsg('Vui lòng chọn loại chi phí');
      return;
    }

    const raw = addExpenseAmountStr.replace(/\D/g, '');
    const amount = raw ? parseInt(raw, 10) : 0;
    if (amount <= 0) {
      setAddExpenseErrorMsg('Số tiền phải lớn hơn 0');
      return;
    }

    if (!addExpenseDescription.trim()) {
      setAddExpenseErrorMsg('Vui lòng nhập nội dung chi tiết');
      return;
    }

    if (addExpenseDescription.length > 255) {
      setAddExpenseErrorMsg('Nội dung chi phí không được vượt quá 255 ký tự');
      return;
    }

    let occurredAtIso: string;
    try {
      const parsedDate = new Date(addExpenseOccurredAtStr);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
      occurredAtIso = parsedDate.toISOString();
    } catch {
      setAddExpenseErrorMsg('Thời gian phát sinh chi phí không hợp lệ');
      return;
    }

    const resolvedPayerId = addExpensePaidByUserId || user?.id || (payerOptions[0]?.id ?? '');
    if (!resolvedPayerId) {
      setAddExpenseErrorMsg('Vui lòng chọn người thanh toán');
      return;
    }

    const isUserRespCat =
      addExpenseCategory === 'CHARGING' ||
      addExpenseCategory === 'PARKING' ||
      addExpenseCategory === 'TOLL';
    const isUsageCapitalCat =
      addExpenseCategory === 'MAINTENANCE' ||
      addExpenseCategory === 'REPAIR';
    const policy: ExpenseAllocationPolicy = isUserRespCat
      ? 'USER_RESPONSIBILITY'
      : isUsageCapitalCat
      ? 'USAGE_AND_CAPITAL'
      : 'OWNERSHIP_RATIO';
    const responsibleUserId = isUserRespCat
      ? (addExpenseResponsibleUserId || resolvedPayerId)
      : undefined;

    try {
      await createExpenseMutation.mutateAsync({
        vehicleId: targetVehicleId,
        category: addExpenseCategory,
        amount,
        description: addExpenseDescription.trim(),
        occurredAt: occurredAtIso,
        paidByUserId: resolvedPayerId,
        allocationPolicy: policy,
        responsibleUserId,
        sourceType: 'MANUAL',
        evidenceUrl: addExpenseEvidenceUrl.trim() || undefined,
        evidenceNote: addExpenseEvidenceNote.trim() || undefined,
      });

      setAddExpenseSuccess(true);
      setTimeout(() => {
        setAddExpenseSuccess(false);
        setFinanceView('EXPENSE_HISTORY');
      }, 1600);
    } catch (err: any) {
      const message = err?.message || 'Không thể lưu chi phí. Vui lòng thử lại.';
      setAddExpenseErrorMsg(message);
    }
  };

  const handleClose = () => {
    setFinanceView('MAIN');
    if (onClose) {
      onClose();
    } else if (clearSelection) {
      clearSelection();
    } else {
      selectZone(null);
    }
  };

  // Keyboard accessibility: ESC cleanly navigates sub-view back to EXPENSE_HISTORY or MAIN, or closes modal/zone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (financeView === 'ADD_EXPENSE') {
          handleCancelAddExpense();
        } else if (financeView !== 'MAIN') {
          setFinanceView('MAIN');
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [financeView]);

  // Strict native wheel isolation for the internal expense history, add expense & cost sharing scroll containers
  useEffect(() => {
    const historyEl = historyListScrollRef.current;
    const addExpenseEl = addExpenseScrollRef.current;
    const costSharingEl = costSharingScrollRef.current;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    if (historyEl) {
      historyEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    if (addExpenseEl) {
      addExpenseEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    if (costSharingEl) {
      costSharingEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (historyEl) historyEl.removeEventListener('wheel', handleWheel);
      if (addExpenseEl) addExpenseEl.removeEventListener('wheel', handleWheel);
      if (costSharingEl) costSharingEl.removeEventListener('wheel', handleWheel);
    };
  }, [financeView]);

  // Frame animation loop: subtle holographic breathing & floor emitter pulsation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle spatial floating breathing
    if (consoleFloatRef.current) {
      consoleFloatRef.current.position.y = Math.sin(t * 1.5) * 0.015;
    }

    // Floor projection pulse
    if (floorRingRef.current) {
      floorRingRef.current.opacity = 0.50 + Math.sin(t * 2.0) * 0.15;
    }
    if (floorGlowPoolRef.current) {
      floorGlowPoolRef.current.opacity = 0.06 + Math.sin(t * 1.6) * 0.02;
    }
    if (frameGlowMatRef.current) {
      frameGlowMatRef.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.35;
    }
    if (lightColumnRef.current) {
      lightColumnRef.current.opacity = 0.035 + Math.sin(t * 1.8) * 0.012;
    }
  });



  // Dimensions of 3D layered structure (scaled proportionally to frame Drei Html console)
  const isDetailView = financeView !== 'MAIN';
  const panelWidthPx = isDetailView ? FINANCE_DETAIL_WIDTH : FINANCE_MAIN_WIDTH;
  const panelHeightPx = isDetailView ? FINANCE_DETAIL_HEIGHT : FINANCE_MAIN_HEIGHT;

  // Proportional 3D world backing dimensions
  const panelW = isDetailView ? 3.85 : 3.10;
  const panelH = isDetailView ? 5.85 : 4.80;
  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = isDetailView ? 0.38 : 0.34;
  const bracketThick = isDetailView ? 0.022 : 0.020;

  // Floor emitter Y coordinate
  const floorY = 0.005;

  return (
    <>
      {/* =========================================================================
          1. HOLOGRAPHIC PROJECTION BASE (FLOOR ANCHOR)
          Sits on showroom floor directly beneath the control panel
          ========================================================================= */}
      <group position={[position[0], floorY, position[2]]}>
        {/* Low-profile dark alloy floor emitter plinth disc */}
        <mesh position={[0, 0.007, 0]} receiveShadow raycast={() => null}>
          <cylinderGeometry args={[0.62, 0.70, 0.016, 32]} />
          <meshStandardMaterial color="#071324" roughness={0.25} metalness={0.88} />
        </mesh>

        {/* Soft radial ambient floor glow pool */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0, 1.65, 48]} />
          <meshBasicMaterial
            ref={floorGlowPoolRef}
            color="#00f2fe"
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Outer subtle concentric projection ring */}
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[1.35, 1.38, 64]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Main precision cyan floor emitter ring */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[1.05, 1.09, 64]} />
          <meshBasicMaterial
            ref={floorRingRef}
            color="#00f2fe"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Inner recessed LED ring on plinth surface */}
        <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.42, 0.47, 32]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* 4 Floor calibration tick marks */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={`base-tick-${idx}`}
            position={[Math.cos(angle) * 1.15, 0.004, Math.sin(angle) * 1.15]}
            rotation={[-Math.PI / 2, 0, angle]}
            raycast={() => null}
          >
            <planeGeometry args={[0.08, 0.010]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Subtle vertical projection guide cone rising to panel base */}
        <mesh position={[0, 0.05, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.35, 0.15, 0.10, 24, 1, true]} />
          <meshBasicMaterial
            ref={lightColumnRef}
            color="#00f2fe"
            transparent
            opacity={0.035}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* 4 Ascending photonic guide rays */}
        {[-0.24, 0.24].map((rx, i) =>
          [-0.24, 0.24].map((rz, j) => (
            <mesh key={`ray-${i}-${j}`} position={[rx * 0.8, 0.05, rz * 0.8]} raycast={() => null}>
              <cylinderGeometry args={[0.0022, 0.0022, 0.10, 8]} />
              <meshBasicMaterial color="#00f2fe" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))
        )}
      </group>

      {/* =========================================================================
          2. AUTHORITATIVE SINGLE-SLOT 3D WORLD-SPACE HOLOGRAPHIC CONSOLE
          Reused by: MAIN, EXPENSE_HISTORY, FUND_DETAIL
          ========================================================================= */}
      <group position={position} rotation={rotation} name="FinanceControlHologramRoot">
        <group ref={consoleFloatRef}>
          {/* -------------------------------------------------------------
              LAYER 1: REAR DARK NAVY TINTED GLASS BACKING
              ------------------------------------------------------------- */}
          <mesh position={[0, 0, -0.045]} raycast={() => null}>
            <planeGeometry args={[panelW, panelH]} />
            <meshStandardMaterial
              color="#040c1c"
              roughness={0.12}
              metalness={0.88}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Technical Interior Grid */}
          <mesh position={[0, 0, -0.035]} raycast={() => null}>
            <planeGeometry args={[panelW - 0.12, panelH - 0.12]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.03}
              wireframe
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* -------------------------------------------------------------
              LAYER 2: EMISSIVE NEON CYAN OUTLINE FRAME
              ------------------------------------------------------------- */}
          <group position={[0, 0, -0.005]}>
            {/* Top Frame Bar */}
            <mesh position={[0, hh, 0]} raycast={() => null}>
              <boxGeometry args={[panelW, 0.022, 0.012]} />
              <meshStandardMaterial
                ref={frameGlowMatRef}
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Bottom Frame Bar */}
            <mesh position={[0, -hh, 0]} raycast={() => null}>
              <boxGeometry args={[panelW, 0.022, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Left Frame Bar */}
            <mesh position={[-hw, 0, 0]} raycast={() => null}>
              <boxGeometry args={[0.022, panelH, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Right Frame Bar */}
            <mesh position={[hw, 0, 0]} raycast={() => null}>
              <boxGeometry args={[0.022, panelH, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* -------------------------------------------------------------
              LAYER 3: CORNER HOLOGRAPHIC BRACKETS & HARDWARE ACCENTS
              ------------------------------------------------------------- */}
          <group>
            {/* Top-Left Bracket */}
            <group position={[-hw, hh, 0.005]}>
              <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Top-Right Bracket */}
            <group position={[hw, hh, 0.005]}>
              <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Bottom-Left Bracket */}
            <group position={[-hw, -hh, 0.005]}>
              <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Bottom-Right Bracket */}
            <group position={[hw, -hh, 0.005]}>
              <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
                <meshStandardMaterial
                  color="#00f2fe"
                  emissive="#00f2fe"
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[0, 0, 0]} raycast={() => null}>
                <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Top Center Sensor / Telemetry Bead */}
            <mesh position={[0, hh + 0.045, 0.005]} raycast={() => null}>
              <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={2.2}
              />
            </mesh>

            {/* Bottom Projection Connector Node Lens */}
            <group position={[0, -hh - 0.045, 0.005]}>
              <mesh raycast={() => null}>
                <cylinderGeometry args={[0.08, 0.045, 0.08, 16]} />
                <meshStandardMaterial
                  color="#091628"
                  metalness={0.8}
                  roughness={0.2}
                  emissive="#00f2fe"
                  emissiveIntensity={0.5}
                />
              </mesh>
              <mesh position={[0, 0.025, 0]} raycast={() => null}>
                <torusGeometry args={[0.055, 0.010, 8, 16]} />
                <meshBasicMaterial color="#00f2fe" />
              </mesh>
            </group>
          </group>

          {/* -------------------------------------------------------------
              LAYER 4: MAIN FRONT INTERACTIVE GLASS CONSOLE (DREI HTML TRANSFORM)
              Single Authority Slot for: MAIN, EXPENSE_HISTORY, FUND_DETAIL
              ------------------------------------------------------------- */}
          <Html
            transform
            distanceFactor={3.25}
            position={[0, 0, 0.015]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            <QueryClientProvider client={queryClient}>
              {/* Scoped Custom Scrollbar & Subtle Sub-View Transitions */}
            <style>{`
              .finance-detail-scroll::-webkit-scrollbar {
                width: 5px;
              }
              .finance-detail-scroll::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 9999px;
                margin: 4px 0;
              }
              .finance-detail-scroll::-webkit-scrollbar-thumb {
                background: rgba(0, 242, 254, 0.32);
                border-radius: 9999px;
                border: 1px solid rgba(0, 242, 254, 0.15);
                transition: background 0.2s ease;
              }
              .finance-detail-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 242, 254, 0.65);
                box-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
              }
              .finance-detail-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 242, 254, 0.35) transparent;
              }
              @keyframes financeViewFadeIn {
                from {
                  opacity: 0;
                  transform: translateX(8px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              .finance-view-fade-in {
                animation: financeViewFadeIn 0.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>

            <div
              data-testid="finance-3d-control-panel"
              data-ui-interactive="true"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              style={{
                width: `${panelWidthPx}px`,
                height: `${panelHeightPx}px`,
                background: 'linear-gradient(180deg, rgba(8, 22, 42, 0.90) 0%, rgba(4, 12, 26, 0.97) 100%)',
                backdropFilter: 'blur(26px)',
                WebkitBackdropFilter: 'blur(26px)',
                border: '2px solid rgba(0, 242, 254, 0.75)',
                borderRadius: '28px',
                boxShadow:
                  '0 28px 70px rgba(0, 0, 0, 0.88), 0 0 40px rgba(0, 242, 254, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 24px rgba(0, 242, 254, 0.14)',
                padding: isDetailView ? '24px 26px' : '22px 24px',
                color: '#ffffff',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* ========================================================
                  VIEW 1: MAIN FINANCE OVERVIEW
                  ======================================================== */}
              {financeView === 'MAIN' && (
                <div
                  key="finance-main-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Header with Icon, Title, and Close Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Wallet size={26} color="#00f2fe" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                            color: '#ffffff',
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Tài chính
                        </h2>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          Quản lý quỹ chung & chi phí
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={handleClose}
                      title="Đóng bảng tài chính"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* Item 1: Chi tháng này */}
                  <div
                    onClick={handleOpenExpenseHistory}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '18px',
                      padding: '13px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 38, 70, 0.90)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.32)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.78)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.28)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '1.4px solid rgba(0, 242, 254, 0.50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BarChart3 size={19} color="#00f2fe" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                            Chi tháng này
                          </span>
                          {summary?.pendingCount != null && summary.pendingCount > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                background: 'rgba(245, 158, 11, 0.16)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#f59e0b',
                                padding: '1px 6px',
                                borderRadius: '9999px',
                              }}
                            >
                              ⏳ {summary.pendingCount} chờ xác minh
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.01em',
                            marginTop: '1px',
                          }}
                        >
                          {formattedMonthlyExpense}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#38bdf8" />
                  </div>

                  {/* Item 2: Phần chi phí của bạn (Cost Sharing Summary Card) */}
                  <div
                    onClick={handleOpenCostSharing}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(10, 30, 56, 0.85)',
                      border: '1.4px solid rgba(0, 242, 254, 0.40)',
                      borderRadius: '18px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.32)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 40, 76, 0.95)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.85)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.32)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 242, 254, 0.16)',
                            border: '1.4px solid rgba(0, 242, 254, 0.50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Users size={16} color="#00f2fe" />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Phần chi phí của bạn
                          </div>
                          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                            Tỷ lệ: {costSharingSummary?.userOwnershipPercentage != null ? `${costSharingSummary.userOwnershipPercentage}%` : `${currentUserOwnershipPercentage}%`}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={17} color="#38bdf8" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '2px' }}>
                      <div style={{ background: 'rgba(4, 16, 36, 0.60)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Phải chịu</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#f8fafc', marginTop: '1px' }}>
                          {costSharingSummary?.userRequiredShare != null ? `${Number(costSharingSummary.userRequiredShare).toLocaleString('vi-VN')}đ` : '...'}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(4, 16, 36, 0.60)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Chênh lệch</div>
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 800,
                            marginTop: '1px',
                            color: (costSharingSummary?.userNetPosition ?? 0) > 0 ? '#10b981' : (costSharingSummary?.userNetPosition ?? 0) < 0 ? '#fb7185' : '#38bdf8',
                          }}
                        >
                          {costSharingSummary?.userNetPosition != null
                            ? `${(costSharingSummary.userNetPosition > 0 ? '+' : '')}${Number(costSharingSummary.userNetPosition).toLocaleString('vi-VN')}đ`
                            : '...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item 3: Trạng thái */}
                  <div
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '18px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.18)',
                          border: '1.4px solid rgba(16, 185, 129, 0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Zap size={18} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                          Trạng thái quỹ
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#10b981',
                            marginTop: '1px',
                          }}
                        >
                          <div
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 10px #10b981',
                            }}
                          />
                          <span>{fundStatus}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#38bdf8" />
                  </div>

                  {/* Primary Action Button: Mở bảng quỹ */}
                  <button
                    type="button"
                    onClick={handleOpenFundDetail}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '13px 20px',
                      color: '#041628',
                      fontSize: '15px',
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 6px 22px rgba(0, 242, 254, 0.45)',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 242, 254, 0.70)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 242, 254, 0.45)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <ExternalLink size={18} color="#041628" />
                      <span>Mở bảng quỹ</span>
                    </div>
                    <ChevronRight size={18} color="#041628" />
                  </button>

                  {/* Secondary Action Button: Phân bổ chi phí */}
                  <button
                    type="button"
                    onClick={handleOpenCostSharing}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(10, 30, 56, 0.85)',
                      border: '1.4px solid rgba(0, 242, 254, 0.45)',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      color: '#00f2fe',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 38, 70, 0.95)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.30)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.45)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.85)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <Users size={18} color="#00f2fe" />
                      <span>Phân bổ chi phí</span>
                    </div>
                    <ChevronRight size={18} color="#00f2fe" />
                  </button>

                  {/* Tertiary Action Button: Lịch sử chi phí */}
                  <button
                    type="button"
                    onClick={handleOpenExpenseHistory}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(10, 30, 56, 0.75)',
                      border: '1.2px solid rgba(0, 242, 254, 0.30)',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 38, 70, 0.90)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.20)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.75)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <FileText size={18} color="#00f2fe" />
                      <span>Lịch sử chi phí</span>
                    </div>
                    <ChevronRight size={18} color="#00f2fe" />
                  </button>
                </div>
              )}

              {/* ========================================================
                  VIEW 2: EXPENSE HISTORY SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'EXPENSE_HISTORY' && (
                <div
                  key="finance-history-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* A. Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Receipt size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2
                            style={{
                              fontSize: '21px',
                              fontWeight: 850,
                              margin: 0,
                              letterSpacing: '-0.01em',
                              color: '#ffffff',
                              lineHeight: 1.2,
                              textTransform: 'uppercase',
                            }}
                          >
                            Lịch sử chi phí
                          </h2>
                          <span
                            style={{
                              background: 'rgba(0, 242, 254, 0.12)',
                              border: '1.2px solid rgba(0, 242, 254, 0.35)',
                              color: '#00f2fe',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {summary?.month
                              ? `Tháng ${summary.month.slice(5)} / ${summary.month.slice(0, 4)}`
                              : 'Tháng 10 / 2026'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          {activeVehicle?.name || 'EV01'} · {expenses.length} khoản chi thực tế
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToMain}
                      onPointerDown={(e) => e.stopPropagation()}
                      title="Quay lại bảng tài chính"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        pointerEvents: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* B. Summary section (Enlarged and Spacious) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Tổng chi */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(251, 113, 133, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Tổng chi
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#fb7185', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {expenses
                          .reduce((sum, e) => sum + Number(e.amount || 0), 0)
                          .toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    {/* Chi tháng này */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(0, 242, 254, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Tháng này
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formattedMonthlyExpense}
                      </div>
                    </div>

                    {/* Số khoản */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(255, 255, 255, 0.14)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Số khoản
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                        {expenses.length}
                      </div>
                    </div>

                    {/* Xe */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(56, 189, 248, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Xe
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeVehicle?.name || 'EV01'}
                      </div>
                    </div>
                  </div>

                  {/* C. Category filter pills */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(6, 18, 36, 0.60)',
                      padding: '5px 7px',
                      borderRadius: '14px',
                      border: '1.2px solid rgba(0, 242, 254, 0.16)',
                      flexWrap: 'wrap',
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'CHARGING', label: 'Sạc xe' },
                      { id: 'MAINTENANCE', label: 'Bảo dưỡng' },
                      { id: 'CLEANING', label: 'Vệ sinh' },
                      { id: 'PARKING', label: 'Đỗ xe' },
                      { id: 'TOLL', label: 'Cầu đường' },
                      { id: 'INSURANCE', label: 'Bảo hiểm' },
                      { id: 'OTHER', label: 'Khác' },
                    ].map((tab) => {
                      const isTabActive = historyCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setHistoryCategoryFilter(tab.id)}
                          style={{
                            background: isTabActive
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(14, 165, 233, 0.45) 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: isTabActive ? '1.4px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.10)',
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: isTabActive ? 750 : 600,
                            color: isTabActive ? '#ffffff' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isTabActive ? '0 0 10px rgba(0, 242, 254, 0.35)' : 'none',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* D. Scrollable expense list with native wheel isolation */}
                  <div
                    ref={historyListScrollRef}
                    className="finance-detail-scroll"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      paddingRight: '4px',
                    }}
                  >
                    {isExpensesLoading ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px',
                          gap: '10px',
                          color: '#94a3b8',
                        }}
                      >
                        <Loader2 size={20} className="animate-spin" color="#00f2fe" />
                        <span style={{ fontSize: '13px' }}>Đang tải lịch sử chi phí...</span>
                      </div>
                    ) : expenses.filter(
                        (e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter
                      ).length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '32px 16px',
                          background: 'rgba(10, 30, 56, 0.40)',
                          borderRadius: '16px',
                          border: '1.2px dashed rgba(0, 242, 254, 0.20)',
                        }}
                      >
                        <FileText size={26} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                          Chưa có chi phí trong danh mục này.
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenAddExpense}
                          style={{
                            background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '8px 15px',
                            color: '#041628',
                            fontSize: '12px',
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                            marginTop: '10px',
                          }}
                        >
                          <PlusCircle size={15} />
                          <span>Thêm chi phí</span>
                        </button>
                      </div>
                    ) : (
                      expenses
                        .filter((e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter)
                        .map((exp) => {
                          const meta =
                            EXPENSE_CATEGORY_METADATA[exp.category] || EXPENSE_CATEGORY_METADATA.OTHER;
                          let CategoryIcon = FileText;
                          if (exp.category === 'CHARGING') CategoryIcon = Zap;
                          else if (exp.category === 'MAINTENANCE') CategoryIcon = Wrench;
                          else if (exp.category === 'CLEANING') CategoryIcon = Sparkles;
                          else if (exp.category === 'PARKING') CategoryIcon = Car;
                          else if (exp.category === 'TOLL') CategoryIcon = Receipt;
                          else if (exp.category === 'REPAIR') CategoryIcon = AlertTriangle;
                          else if (exp.category === 'INSURANCE') CategoryIcon = ShieldCheck;

                          let dateDisplay = exp.occurredAt;
                          try {
                            const d = new Date(exp.occurredAt);
                            const now = new Date();
                            const isToday =
                              d.getDate() === now.getDate() &&
                              d.getMonth() === now.getMonth() &&
                              d.getFullYear() === now.getFullYear();
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            dateDisplay = isToday ? `Hôm nay, ${hours}:${minutes}` : `${day}/${month}/${year}`;
                          } catch {
                            dateDisplay = exp.occurredAt;
                          }

                          const isExpanded = expandedExpenseId === exp.id;
                          return (
                            <div
                              key={exp.id}
                              style={{
                                background: isExpanded ? 'rgba(14, 38, 70, 0.90)' : 'rgba(10, 30, 56, 0.65)',
                                borderRadius: '15px',
                                padding: '11px 14px',
                                border: `1.2px solid ${isExpanded ? '#00f2fe' : 'rgba(0, 242, 254, 0.16)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s ease',
                                boxShadow: isExpanded ? '0 0 16px rgba(0, 242, 254, 0.25)' : '0 3px 10px rgba(0, 0, 0, 0.20)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setExpandedExpenseId((current) => (current === exp.id ? null : exp.id));
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '50%',
                                      background: meta.chipBg,
                                      border: `1.4px solid ${meta.chipBorder}`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <CategoryIcon size={16} color={meta.accentColor} />
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span
                                        style={{
                                          fontSize: '13.5px',
                                          fontWeight: 750,
                                          color: '#f8fafc',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {exp.description}
                                      </span>
                                      <span
                                        style={{
                                          background: meta.chipBg,
                                          border: `1px solid ${meta.chipBorder}`,
                                          color: meta.accentColor,
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '9999px',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {exp.categoryLabel || meta.label}
                                      </span>
                                      {(() => {
                                        const statusMeta = EXPENSE_STATUS_METADATA[exp.status || 'APPROVED'] || EXPENSE_STATUS_METADATA.APPROVED;
                                        return (
                                          <span
                                            style={{
                                              background: statusMeta.bg,
                                              border: `1px solid ${statusMeta.border}`,
                                              color: statusMeta.color,
                                              fontSize: '9.5px',
                                              fontWeight: 750,
                                              padding: '2px 6px',
                                              borderRadius: '9999px',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {statusMeta.label}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>
                                      {dateDisplay} · Người trả: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{exp.paidByUserName || 'Thành viên'}</span>
                                      {exp.createdByUserName && exp.createdByUserName !== exp.paidByUserName && (
                                        <span> (Khai bởi: {exp.createdByUserName})</span>
                                      )}
                                    </div>
                                    {(exp.evidenceUrl || exp.evidenceNote) && (
                                      <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FileText size={11} color="#00f2fe" />
                                        <span>Chứng từ: {exp.evidenceUrl || 'Có ghi chú đính kèm'}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                                  <div
                                    style={{
                                      fontSize: '14.5px',
                                      fontWeight: 800,
                                      color: exp.status === 'REJECTED' || exp.status === 'CANCELLED' ? '#94a3b8' : '#fb7185',
                                      textDecoration: exp.status === 'REJECTED' || exp.status === 'CANCELLED' ? 'line-through' : 'none',
                                      letterSpacing: '-0.01em',
                                    }}
                                  >
                                    -{Number(exp.amount).toLocaleString('vi-VN')}đ
                                  </div>
                                  <button
                                    type="button"
                                    data-testid={`expense-share-btn-${exp.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedExpenseId((current) => (current === exp.id ? null : exp.id));
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '10.5px',
                                      fontWeight: 650,
                                      color: '#00f2fe',
                                      marginTop: '3px',
                                      background: isExpanded ? 'rgba(0, 242, 254, 0.22)' : 'rgba(0, 242, 254, 0.10)',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isExpanded ? '#00f2fe' : 'rgba(0, 242, 254, 0.28)'}`,
                                      cursor: 'pointer',
                                      pointerEvents: 'auto',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <span>{isExpanded ? 'Thu gọn' : exp.status === 'PENDING_VERIFICATION' ? 'Xác minh' : 'Phân bổ'}</span>
                                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Expense Allocation Detail */}
                              {isExpanded && (
                                <div
                                  data-testid={`expanded-expense-${exp.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  style={{
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(0, 242, 254, 0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    pointerEvents: 'auto',
                                  }}
                                >
                                  <ExpenseItemShares
                                    expenseId={exp.id}
                                    expenseAmount={Number(exp.amount)}
                                    expenseStatus={exp.status}
                                    allocationPolicy={exp.allocationPolicy}
                                    responsibleUserId={exp.responsibleUserId}
                                    category={exp.category}
                                    expense={exp}
                                    description={exp.description}
                                    evidenceNote={exp.evidenceNote}
                                    sourceType={exp.sourceType}
                                    relatedTripId={exp.relatedTripId}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* E. Footer actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      flexShrink: 0,
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleOpenAddExpense}
                        style={{
                          background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '9px 15px',
                          color: '#041628',
                          fontSize: '12.5px',
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(0, 242, 254, 0.40)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Plus size={15} color="#041628" />
                        <span>Thêm chi phí</span>
                      </button>

                      <button
                        type="button"
                        data-testid="finance-history-cost-sharing-btn"
                        onClick={handleOpenCostSharing}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'rgba(0, 242, 254, 0.10)',
                          border: '1.2px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '14px',
                          padding: '9px 14px',
                          color: '#00f2fe',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'auto',
                        }}
                      >
                        <Users size={14} color="#00f2fe" />
                        <span>Phân bổ chi phí</span>
                      </button>

                      <button
                        type="button"
                        data-testid="finance-history-fund-detail-btn"
                        onClick={handleOpenFundDetail}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'rgba(0, 242, 254, 0.10)',
                          border: '1.2px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '14px',
                          padding: '9px 14px',
                          color: '#00f2fe',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'auto',
                        }}
                      >
                        <FileText size={14} color="#00f2fe" />
                        <span>Xem quỹ chung</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid="finance-history-close-btn"
                      onClick={handleBackToMain}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                        border: '1.2px solid #00f2fe',
                        borderRadius: '14px',
                        padding: '9px 20px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 242, 254, 0.25)',
                        transition: 'all 0.2s ease',
                        pointerEvents: 'auto',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 3: SHARED FUND DETAIL SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'FUND_DETAIL' && (
                <div
                  key="finance-fund-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  {/* A. Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Wallet size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: '22px',
                            fontWeight: 850,
                            margin: 0,
                            letterSpacing: '-0.01em',
                            color: '#ffffff',
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                          }}
                        >
                          Quỹ chung
                        </h2>
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          {activeVehicle?.name || 'EV01'} · Nhóm đồng sở hữu xe
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToMain}
                      onPointerDown={(e) => e.stopPropagation()}
                      title="Quay lại bảng tài chính"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        pointerEvents: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* B. Hero summary block */}
                  <div
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '18px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.04em' }}>
                        Tổng quỹ hiện tại
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#00f2fe', marginTop: '2px', letterSpacing: '-0.01em' }}>
                        25.000.000đ
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.04em' }}>
                        Phần của bạn ({currentUserOwnershipPercentage}%)
                      </div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                        {((25000000 * currentUserOwnershipPercentage) / 100).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* C. Recurring cost blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 750, color: '#a5f3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Khoản chi định kỳ
                    </div>
                    {[
                      { label: 'Sạc điện công cộng', cost: '1.250.000đ', rawCost: 1250000, icon: Zap },
                      { label: 'Bảo dưỡng định kỳ', cost: '1.800.000đ', rawCost: 1800000, icon: CheckCircle2 },
                      { label: 'Vệ sinh & bãi đỗ', cost: '400.000đ', rawCost: 400000, icon: Calendar },
                    ].map((item, idx) => {
                      const shareVal = (item.rawCost * currentUserOwnershipPercentage) / 100;
                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(10, 30, 56, 0.65)',
                            borderRadius: '15px',
                            padding: '11px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1.2px solid rgba(0, 242, 254, 0.16)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                background: 'rgba(0, 242, 254, 0.12)',
                                border: '1.2px solid rgba(0, 242, 254, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <item.icon size={16} color="#00f2fe" />
                            </div>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                              {item.label}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                              {item.cost}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
                              Bạn: <span style={{ color: '#38bdf8', fontWeight: 650 }}>{shareVal.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* D. Mini insight section */}
                  <div
                    style={{
                      background: 'rgba(6, 18, 36, 0.60)',
                      border: '1.2px solid rgba(0, 242, 254, 0.16)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Tỷ lệ sở hữu
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
                        {currentUserOwnershipPercentage}% (Bạn)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Chi tháng này
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formattedMonthlyExpense}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Khoản gần nhất
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: '3px' }}>
                        1.250.000đ
                      </div>
                    </div>
                  </div>

                  {/* E. Footer actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleOpenExpenseHistory}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(0, 242, 254, 0.10)',
                        border: '1.2px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '14px',
                        padding: '9px 18px',
                        color: '#00f2fe',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        pointerEvents: 'auto',
                      }}
                    >
                      <FileText size={15} color="#00f2fe" />
                      <span>Xem lịch sử chi phí</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToMain}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                        border: '1.2px solid #00f2fe',
                        borderRadius: '14px',
                        padding: '9px 24px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 242, 254, 0.25)',
                        transition: 'all 0.2s ease',
                        pointerEvents: 'auto',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 4: COST SHARING DETAIL SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'COST_SHARING' && (
                <div
                  key="finance-cost-sharing-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    gap: '12px',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    color: '#ffffff',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* A. Header: Guaranteed visible static content first (never depends on query result) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Users size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2
                            style={{
                              fontSize: '20px',
                              fontWeight: 850,
                              margin: 0,
                              letterSpacing: '-0.01em',
                              color: '#ffffff',
                              lineHeight: 1.2,
                              textTransform: 'uppercase',
                            }}
                          >
                            PHÂN BỔ CHI PHÍ
                          </h2>
                          <span
                            style={{
                              background: 'rgba(0, 242, 254, 0.12)',
                              border: '1.2px solid rgba(0, 242, 254, 0.35)',
                              color: '#00f2fe',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {costSharingSummary?.month && costSharingSummary.month.length === 7
                              ? `Tháng ${costSharingSummary.month.slice(5)} / ${costSharingSummary.month.slice(0, 4)}`
                              : financeMonthStr && financeMonthStr.length === 7
                              ? `Tháng ${financeMonthStr.slice(5)} / ${financeMonthStr.slice(0, 4)}`
                              : 'Tháng 10 / 2026'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                          Theo tỷ lệ sở hữu {activeVehicle?.name || 'EV01'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        data-testid="finance-cost-sharing-back-btn"
                        onClick={handleOpenExpenseHistory}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Quay lại lịch sử chi phí"
                        style={{
                          background: 'rgba(10, 30, 56, 0.85)',
                          border: '1.4px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '12px',
                          padding: '7px 11px',
                          color: '#38bdf8',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                          pointerEvents: 'auto',
                        }}
                      >
                        <ArrowLeft size={13} color="#38bdf8" />
                        <span>Lịch sử</span>
                      </button>
                      <button
                        type="button"
                        data-testid="finance-cost-sharing-close-btn"
                        onClick={handleBackToMain}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Đóng về trang chính"
                        style={{
                          background: 'rgba(10, 30, 56, 0.85)',
                          border: '1.4px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '12px',
                          padding: '7px 9px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          pointerEvents: 'auto',
                        }}
                      >
                        <X size={15} color="#94a3b8" />
                      </button>
                    </div>
                  </div>

                  {/* B. Scrollable Body: Explicit Null-Safe Branches (Loading, Error, Empty, Live Data) */}
                  <div
                    ref={costSharingScrollRef}
                    className="finance-detail-scroll"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      paddingRight: '4px',
                    }}
                  >
                    {isCostSharingLoading ? (
                      /* Mandatory Loading State */
                      <div
                        style={{
                          flex: 1,
                          minHeight: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 16px',
                          gap: '12px',
                          color: '#94a3b8',
                          background: 'rgba(10, 30, 56, 0.40)',
                          borderRadius: '18px',
                          border: '1px dashed rgba(0, 242, 254, 0.20)',
                          textAlign: 'center',
                        }}
                      >
                        <Loader2 size={28} className="animate-spin" color="#00f2fe" />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>
                          Đang tải dữ liệu phân bổ chi phí...
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Đang tổng hợp theo tỷ lệ sở hữu nhóm đồng sở hữu
                        </span>
                      </div>
                    ) : isCostSharingError ? (
                      /* Mandatory Error State */
                      <div
                        style={{
                          flex: 1,
                          minHeight: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px 16px',
                          gap: '10px',
                          color: '#fb7185',
                          background: 'rgba(251, 113, 133, 0.08)',
                          borderRadius: '18px',
                          border: '1px solid rgba(251, 113, 133, 0.25)',
                          textAlign: 'center',
                        }}
                      >
                        <AlertTriangle size={28} color="#fb7185" />
                        <span style={{ fontSize: '14px', fontWeight: 750, color: '#fda4af' }}>
                          Không thể tải dữ liệu phân bổ chi phí.
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '340px', lineHeight: 1.4 }}>
                          Nếu khoản chi đang chờ xác minh, dữ liệu phân bổ sẽ chỉ xuất hiện sau khi được duyệt.
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Hero Metrics Area: Live API values with fallback */}
                        {(() => {
                          const totalApproved = costSharingSummary?.totalExpense != null
                            ? Number(costSharingSummary.totalExpense)
                            : (summary?.totalExpense != null ? Number(summary.totalExpense) : 0);
                          const userPct = costSharingSummary?.userOwnershipPercentage != null
                            ? Number(costSharingSummary.userOwnershipPercentage)
                            : currentUserOwnershipPercentage;
                          const userReq = costSharingSummary?.userRequiredShare != null
                            ? Number(costSharingSummary.userRequiredShare)
                            : (totalApproved * userPct) / 100;
                          const userPaid = costSharingSummary?.userPaidAmount != null
                            ? Number(costSharingSummary.userPaidAmount)
                            : 0;
                          const userNet = costSharingSummary?.userNetPosition != null
                            ? Number(costSharingSummary.userNetPosition)
                            : (userPaid - userReq);

                          return (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, rgba(8, 28, 54, 0.85) 0%, rgba(4, 16, 36, 0.95) 100%)',
                                border: '1.4px solid rgba(0, 242, 254, 0.35)',
                                borderRadius: '18px',
                                padding: '14px 16px',
                                flexShrink: 0,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                              }}
                            >
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    TỔNG CHI ĐÃ XÁC MINH
                                  </div>
                                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                    {Number(totalApproved).toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    PHẦN CỦA BẠN ({userPct}%)
                                  </div>
                                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                                    {Number(userReq).toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: '10px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid rgba(0, 242, 254, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                }}
                              >
                                <div style={{ color: '#94a3b8' }}>
                                  ĐÃ THANH TOÁN:{' '}
                                  <strong style={{ color: '#f8fafc' }}>
                                    {Number(userPaid).toLocaleString('vi-VN')}đ
                                  </strong>
                                </div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      userNet > 0
                                        ? '#10b981'
                                        : userNet < 0
                                        ? '#fb7185'
                                        : '#38bdf8',
                                  }}
                                >
                                  CHÊNH LỆCH:{' '}
                                  {userNet > 0
                                    ? `+${Number(userNet).toLocaleString('vi-VN')}đ (Trả dư)`
                                    : userNet < 0
                                    ? `${Number(userNet).toLocaleString('vi-VN')}đ (Còn thiếu)`
                                    : '0đ (Cân bằng)'}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Co-Owner Allocation Breakdown Section */}
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            margin: '2px 0',
                          }}
                        >
                          CHI TIẾT THEO ĐỒNG SỞ HỮU ({costSharingSummary?.memberBreakdown?.length || 0})
                        </div>

                        {(!costSharingSummary?.memberBreakdown || costSharingSummary.memberBreakdown.length === 0) ? (
                          /* Mandatory Empty State */
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '32px 16px',
                              gap: '8px',
                              color: '#94a3b8',
                              background: 'rgba(10, 30, 56, 0.40)',
                              borderRadius: '16px',
                              border: '1px dashed rgba(0, 242, 254, 0.20)',
                              textAlign: 'center',
                            }}
                          >
                            <Users size={24} color="#00f2fe" style={{ opacity: 0.6 }} />
                            <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                              Chưa có dữ liệu phân bổ chi phí trong tháng này.
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Chưa có khoản chi đã được xác minh để phân bổ. Các khoản chi mới sau khi được duyệt sẽ tự động phân bổ theo tỷ lệ sở hữu.
                            </span>
                          </div>
                        ) : (
                          /* Real Member Breakdown Rows */
                          costSharingSummary.memberBreakdown.map((member) => {
                            const isCurrent = Boolean(member.isCurrentUser || (user?.id && member.userId === user.id));
                            const net = Number(member.netPosition || 0);
                            const reqShare = Number(member.requiredShare || 0);
                            const paidAmt = Number(member.paidAmount || 0);
                            const pct = Number(member.ownershipPercentage || 0);

                            return (
                              <div
                                key={member.userId || member.userName}
                                style={{
                                  background: isCurrent ? 'rgba(0, 242, 254, 0.12)' : 'rgba(10, 30, 56, 0.65)',
                                  border: isCurrent ? '1.5px solid rgba(0, 242, 254, 0.60)' : '1px solid rgba(0, 242, 254, 0.18)',
                                  borderRadius: '14px',
                                  padding: '10px 14px',
                                  boxShadow: isCurrent ? '0 0 16px rgba(0, 242, 254, 0.20)' : '0 2px 8px rgba(0,0,0,0.2)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13.5px', fontWeight: 750, color: isCurrent ? '#00f2fe' : '#f8fafc' }}>
                                      {member.userName || 'Thành viên'} {isCurrent && '(Bạn)'}
                                    </span>
                                    <span
                                      style={{
                                        background: 'rgba(0, 242, 254, 0.15)',
                                        border: '1px solid rgba(0, 242, 254, 0.35)',
                                        color: '#38bdf8',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '9999px',
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    Phải chịu: <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{reqShare.toLocaleString('vi-VN')}đ</strong>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    marginTop: '6px',
                                    paddingTop: '6px',
                                    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                                    color: '#94a3b8',
                                  }}
                                >
                                  <div>
                                    Đã trả: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{paidAmt.toLocaleString('vi-VN')}đ</span>
                                  </div>
                                  <div>
                                    Chênh lệch:{' '}
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: net > 0 ? '#10b981' : net < 0 ? '#fb7185' : '#38bdf8',
                                      }}
                                    >
                                      {net > 0 ? `+${net.toLocaleString('vi-VN')}đ (Trả dư)` : net < 0 ? `${net.toLocaleString('vi-VN')}đ (Thiếu)` : '0đ'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    )}
                  </div>

                  {/* C. Bottom invariant notice & actions */}
                  <div
                    style={{
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                      ✓ Tổng phân bổ = Chi phí (100%) · Tự động chuẩn hóa
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleOpenExpenseHistory}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'rgba(0, 242, 254, 0.12)',
                          border: '1.2px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '12px',
                          padding: '7px 12px',
                          color: '#00f2fe',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          pointerEvents: 'auto',
                        }}
                      >
                        <Receipt size={13} color="#00f2fe" />
                        <span>Lịch sử</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBackToMain}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                          border: '1.2px solid #00f2fe',
                          borderRadius: '12px',
                          padding: '7px 14px',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 5: ADD EXPENSE SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'ADD_EXPENSE' && (
                <div
                  key="finance-add-expense-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    gap: '12px',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    color: '#ffffff',
                    pointerEvents: 'auto',
                    opacity: 1,
                  }}
                >
                  {/* A. Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <PlusCircle size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2
                            style={{
                              fontSize: '21px',
                              fontWeight: 850,
                              margin: 0,
                              letterSpacing: '-0.01em',
                              color: '#ffffff',
                              lineHeight: 1.2,
                              textTransform: 'uppercase',
                            }}
                          >
                            THÊM CHI PHÍ
                          </h2>
                        </div>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          Khai báo chi phí cho {activeVehicle?.name || 'EV01'} (Chờ đồng sở hữu xác minh)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelAddExpense}
                      title="Quay lại lịch sử chi phí"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {/* B. Scrollable Form Body with native wheel isolation */}
                  <div
                    ref={addExpenseScrollRef}
                    className="finance-detail-scroll"
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                      flex: '1 1 auto',
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '11px',
                      paddingRight: '4px',
                    }}
                  >
                    {/* Transparency Verification Notice */}
                    <div
                      style={{
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={16} color="#00f2fe" style={{ flexShrink: 0 }} />
                      <span>
                        Khoản chi cần được các đồng sở hữu độc lập xác nhận đạt <strong style={{ color: '#00f2fe' }}>≥ 50%</strong> cổ phần trước khi chính thức tính vào quỹ chung.
                      </span>
                    </div>

                    {/* Inline Vehicle Missing Alert */}
                    {!targetVehicleId && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1.2px solid rgba(239, 68, 68, 0.45)',
                          borderRadius: '12px',
                          padding: '9px 13px',
                          fontSize: '12px',
                          color: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <AlertTriangle size={16} color="#fca5a5" style={{ flexShrink: 0 }} />
                        <span>Đang tải thông tin xe... Vui lòng chờ trong giây lát.</span>
                      </div>
                    )}

                    {/* Inline Vietnamese Validation Alert */}
                    {addExpenseErrorMsg && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1.2px solid rgba(239, 68, 68, 0.45)',
                          borderRadius: '12px',
                          padding: '9px 13px',
                          fontSize: '12px',
                          color: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <AlertTriangle size={16} color="#fca5a5" style={{ flexShrink: 0 }} />
                        <span>{addExpenseErrorMsg}</span>
                      </div>
                    )}

                    {/* Inline Success Notice */}
                    {addExpenseSuccess && (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1.2px solid rgba(16, 185, 129, 0.45)',
                          borderRadius: '12px',
                          padding: '9px 13px',
                          fontSize: '12px',
                          color: '#6ee7b7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={16} color="#6ee7b7" style={{ flexShrink: 0 }} />
                        <span>Khoản chi đã được gửi và đang chờ các đồng sở hữu xác minh.</span>
                      </div>
                    )}

                    {/* Field 1: Loại chi phí */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#94a3b8',
                          marginBottom: '5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Loại chi phí *
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                        }}
                      >
                        {[
                          { id: 'CHARGING', label: 'Sạc xe', icon: Zap },
                          { id: 'MAINTENANCE', label: 'Bảo dưỡng', icon: Wrench },
                          { id: 'CLEANING', label: 'Vệ sinh xe', icon: Sparkles },
                          { id: 'PARKING', label: 'Đỗ xe', icon: Car },
                          { id: 'TOLL', label: 'Phí đường bộ', icon: Receipt },
                          { id: 'REPAIR', label: 'Sửa chữa', icon: AlertTriangle },
                          { id: 'INSURANCE', label: 'Bảo hiểm', icon: ShieldCheck },
                          { id: 'OTHER', label: 'Khác', icon: FileText },
                        ].map((opt) => {
                          const isSelected = addExpenseCategory === opt.id;
                          const meta =
                            EXPENSE_CATEGORY_METADATA[opt.id as ExpenseCategory] || EXPENSE_CATEGORY_METADATA.OTHER;
                          const IconComponent = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setAddExpenseCategory(opt.id as ExpenseCategory);
                                if (addExpenseErrorMsg) setAddExpenseErrorMsg(null);
                              }}
                              style={{
                                background: isSelected
                                  ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(10, 30, 56, 0.95) 100%)'
                                  : 'rgba(10, 26, 48, 0.60)',
                                border: isSelected ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '12px',
                                padding: '7px 4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.30)' : 'none',
                              }}
                            >
                              <IconComponent size={16} color={isSelected ? '#00f2fe' : meta.accentColor} />
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: isSelected ? 750 : 500,
                                  color: isSelected ? '#ffffff' : '#cbd5e1',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Field 2: Số tiền (VNĐ) */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#94a3b8',
                          marginBottom: '5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Số tiền (VNĐ) *
                      </label>
                      <div
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          value={addExpenseAmountStr}
                          onChange={(e) => {
                            if (addExpenseErrorMsg) setAddExpenseErrorMsg(null);
                            const raw = e.target.value.replace(/\D/g, '');
                            if (!raw) {
                              setAddExpenseAmountStr('');
                              return;
                            }
                            const num = parseInt(raw, 10);
                            setAddExpenseAmountStr(num.toLocaleString('vi-VN'));
                          }}
                          placeholder="VD: 185.000"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 18, 34, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '12px',
                            padding: '9px 38px 9px 13px',
                            color: '#ffffff',
                            fontSize: '15px',
                            fontWeight: 750,
                            outline: 'none',
                            letterSpacing: '0.02em',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#00f2fe';
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '13px',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#00f2fe',
                            pointerEvents: 'none',
                          }}
                        >
                          ₫
                        </span>
                      </div>
                    </div>

                    {/* Field 3: Nội dung chi tiết */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#94a3b8',
                          marginBottom: '5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Nội dung chi tiết *
                      </label>
                      <input
                        type="text"
                        value={addExpenseDescription}
                        onChange={(e) => {
                          setAddExpenseDescription(e.target.value);
                          if (addExpenseErrorMsg) setAddExpenseErrorMsg(null);
                        }}
                        placeholder="VD: Trạm sạc VinFast Landmark 81 — Sạc nhanh DC"
                        maxLength={255}
                        style={{
                          width: '100%',
                          background: 'rgba(6, 18, 34, 0.75)',
                          border: '1.2px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '12px',
                          padding: '9px 13px',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#00f2fe';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    {/* Fields 4 & 5: Thời gian & Người thanh toán */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Thời gian phát sinh
                        </label>
                        <input
                          type="datetime-local"
                          value={addExpenseOccurredAtStr}
                          onChange={(e) => {
                            setAddExpenseOccurredAtStr(e.target.value);
                            if (addExpenseErrorMsg) setAddExpenseErrorMsg(null);
                          }}
                          style={{
                            width: '100%',
                            background: 'rgba(6, 18, 34, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '12px',
                            padding: '8px 9px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Người thanh toán
                        </label>
                        <select
                          value={addExpensePaidByUserId || (payerOptions[0]?.id ?? '')}
                          onChange={(e) => {
                            setAddExpensePaidByUserId(e.target.value);
                            if (addExpenseErrorMsg) setAddExpenseErrorMsg(null);
                          }}
                          style={{
                            width: '100%',
                            background: 'rgba(6, 18, 34, 0.90)',
                            border: '1.2px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '12px',
                            padding: '8px 9px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                          }}
                        >
                          {payerOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} style={{ background: '#0a1e38', color: '#fff' }}>
                              {opt.name} {opt.isSelf ? '(Bạn)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Policy Notice & Responsible User Selector */}
                    {addExpenseCategory === 'CHARGING' || addExpenseCategory === 'PARKING' || addExpenseCategory === 'TOLL' ? (
                      <div
                        style={{
                          background: 'rgba(0, 242, 254, 0.08)',
                          border: '1px solid rgba(0, 242, 254, 0.25)',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '10.5px', color: '#00f2fe', fontWeight: 700, textTransform: 'uppercase' }}>
                            Phương thức: Theo người sử dụng (100%)
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Phí phát sinh theo phiên lái/chuyến đi
                          </span>
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#94a3b8',
                              marginBottom: '3px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Người chịu chi phí *
                          </label>
                          <select
                            value={addExpenseResponsibleUserId || (payerOptions[0]?.id ?? '')}
                            onChange={(e) => setAddExpenseResponsibleUserId(e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(6, 18, 34, 0.90)',
                              border: '1.2px solid rgba(0, 242, 254, 0.35)',
                              borderRadius: '10px',
                              padding: '7px 9px',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 600,
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {payerOptions.map((opt) => (
                              <option key={opt.id} value={opt.id} style={{ background: '#0a1e38', color: '#fff' }}>
                                {opt.name} {opt.isSelf ? '(Bạn)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'rgba(148, 163, 184, 0.08)',
                          border: '1px solid rgba(148, 163, 184, 0.20)',
                          borderRadius: '10px',
                          padding: '7px 11px',
                          fontSize: '10.5px',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Phương thức: <strong style={{ color: '#e2e8f0' }}>Theo tỷ lệ sở hữu</strong></span>
                        <span>Phân bổ theo % cổ phần của từng đồng sở hữu</span>
                      </div>
                    )}

                    {/* Fields 6 & 7: Chứng từ & Ghi chú chứng từ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Chứng từ / Link biên lai
                        </label>
                        <input
                          type="text"
                          value={addExpenseEvidenceUrl}
                          onChange={(e) => setAddExpenseEvidenceUrl(e.target.value)}
                          placeholder="VD: HD-2026-10 hoặc link ảnh"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 18, 34, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '12px',
                            padding: '8px 9px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Ghi chú chứng từ
                        </label>
                        <input
                          type="text"
                          value={addExpenseEvidenceNote}
                          onChange={(e) => setAddExpenseEvidenceNote(e.target.value)}
                          placeholder="VD: Hóa đơn VAT, có chữ ký"
                          style={{
                            width: '100%',
                            background: 'rgba(6, 18, 34, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '12px',
                            padding: '8px 9px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* C. Footer actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCancelAddExpense}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '14px',
                        padding: '10px',
                        color: '#cbd5e1',
                        fontSize: '13px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      HỦY
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitAddExpense}
                      disabled={!targetVehicleId || createExpenseMutation.isPending || addExpenseSuccess}
                      style={{
                        flex: 2,
                        background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '10px',
                        color: '#041628',
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.01em',
                        cursor: !targetVehicleId || createExpenseMutation.isPending || addExpenseSuccess ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 18px rgba(0, 242, 254, 0.40)',
                        opacity: !targetVehicleId || createExpenseMutation.isPending ? 0.75 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (targetVehicleId && !createExpenseMutation.isPending && !addExpenseSuccess) {
                          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.65)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 242, 254, 0.40)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {createExpenseMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : addExpenseSuccess ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Đã ghi nhận!</span>
                        </>
                      ) : (
                        <span>GHI NHẬN CHI PHÍ</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            </QueryClientProvider>
          </Html>
        </group>
      </group>
    </>
  );
};
