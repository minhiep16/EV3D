export interface HealthStatus {
  status: 'UP' | 'DOWN';
  api: 'UP' | 'DOWN';
  database: 'UP' | 'DOWN';
  timestamp?: string;
  message?: string;
}
