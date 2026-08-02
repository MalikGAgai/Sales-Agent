"use client";

import { useEffect, useState } from "react";
import { HealthService } from "@/services/health.service";
import { HealthStatus } from "@/types/health";

export function useHealth() {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await HealthService.checkHealth();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to SalesAI API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { data, loading, error, refetch: fetchHealth };
}
