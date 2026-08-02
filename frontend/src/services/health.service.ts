import { fetchApi } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { HealthStatus } from "@/types/health";

export class HealthService {
  /**
   * Fetch application health status from backend API.
   */
  static async checkHealth(): Promise<ApiResponse<HealthStatus>> {
    return fetchApi<HealthStatus>("/health");
  }
}
