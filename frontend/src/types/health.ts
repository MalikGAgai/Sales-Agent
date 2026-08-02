export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  environment: string;
  version: string;
  timestamp: string;
  database: "healthy" | "unhealthy";
  redis: "healthy" | "unhealthy";
}
