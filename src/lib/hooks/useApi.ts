/**
 * React Query Hooks for API Integration
 *
 * Custom hooks for fetching and mutating data from the API.
 * Uses TanStack Query for caching, refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Type definitions
interface Asset {
  id: string;
  name: string;
  type: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  lastMaintenanceDate?: string;
  riskLevel: "green" | "yellow" | "red";
  failureProbability: number;
  recommendation: string;
  lastPredictionDate: string | null;
}

interface AssetDetail {
  id: string;
  name: string;
  type: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  installationDate?: string;
  lastMaintenanceDate?: string;
}

interface SensorReading {
  id: number;
  assetId: string;
  timestamp: string;
  tempF: number;
  pressurePSI: number;
  vibrationMM: number;
  failureFlag: number;
}

interface Prediction {
  id: number;
  assetId: string;
  probability: number;
  riskLevel: "green" | "yellow" | "red";
  recommendation: string;
  modelVersion?: string;
  predictedAt: string;
}

/**
 * Fetch all assets with their risk levels
 */
export function useAssets(filters?: { type?: string; riskLevel?: string }) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.riskLevel) params.set("riskLevel", filters.riskLevel);

      const res = await fetch(`/api/assets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch assets");

      const data = await res.json();
      return data.data.assets as Asset[];
    },
  });
}

/**
 * Fetch single asset with detailed information
 */
export function useAsset(assetId: string, readingsLimit?: number) {
  return useQuery({
    queryKey: ["asset", assetId, readingsLimit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (readingsLimit) params.set("readingsLimit", readingsLimit.toString());

      const res = await fetch(`/api/assets/${assetId}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch asset");

      const data = await res.json();
      return {
        asset: data.data.asset as AssetDetail,
        readings: data.data.readings as SensorReading[],
        prediction: data.data.prediction as Prediction | null,
        stats: data.data.stats as {
          totalReadings: number;
          dateRange: { start: string; end: string };
        },
      };
    },
    enabled: !!assetId, // Only fetch if assetId is provided
  });
}

/**
 * Upload CSV file
 */
export function useUploadCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate assets cache to refetch with new data
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
