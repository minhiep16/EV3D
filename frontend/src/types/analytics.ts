export interface DailyAnalyticsData {
  date: string;
  dayOfWeek: string;
  energyKwh: number;
  distanceKm: number;
  tripsCount: number;
  costVnd: number;
}

export interface MemberUsageShare {
  userId: string;
  userName: string;
  distanceKm: number;
  tripsCount: number;
  ownershipPercentage: number;
  usagePercentage: number;
}

export interface VehicleAnalyticsResponse {
  vehicleId: string;
  vehicleName: string;
  brand: string;
  model: string;
  licensePlate: string;
  batteryCapacity: number;
  currentBatteryLevel: number;
  currentOdometer: number;

  fromDate: string;
  toDate: string;
  periodDays: number;

  totalDistanceKm: number;
  completedTripsCount: number;
  activeDrivingDays: number;
  totalDrivingHours: number;

  totalEnergyKwh: number;
  energyConsumptionKwhPer100Km: number | null;
  isEnergyEstimated?: boolean | null;
  totalOperatingExpenses: number;
  directTripExpenses?: number | null;
  sharedOperatingExpenses?: number | null;
  costPerKm: number | null;
  utilizationRatePercent: number;
  sohPercent: number;

  hasTripData: boolean;
  hasEnergyData: boolean;
  hasExpenseData: boolean;

  dailySeries: DailyAnalyticsData[];
  memberUsage: MemberUsageShare[];
}

