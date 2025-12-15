"use client";

/**
 * Asset Table Component
 *
 * Displays all assets in a sortable table view.
 * Each row is expandable to show detailed sensor data and visualizations inline.
 */

import { useState, useMemo } from "react";
import { useAssets, useAsset } from "@/lib/hooks/useApi";
import {
  Waves,
  Wind,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
  Loader2,
  Thermometer,
  Gauge,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SortField =
  | "id"
  | "name"
  | "location"
  | "riskLevel"
  | "failureProbability";
type SortDirection = "asc" | "desc";

// Icon mapping based on asset type
function getAssetIcon(type: string) {
  const lowerType = type.toLowerCase();

  if (lowerType.includes("pump")) return <Waves size={24} />;
  if (lowerType.includes("compressor")) return <Wind size={24} />;
  if (lowerType.includes("motor")) return <Zap size={24} />;
  return <Settings size={24} />;
}

// Custom Tooltip Component for Charts
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "0.5rem",
          fontSize: "12px",
        }}
      >
        <p style={{ margin: 0, color: "#111827", fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, color: "#111827", fontWeight: 500 }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// Format readings count to human-readable duration
function formatReadingsDuration(count: number): string {
  const hoursOfData = (count / 60).toFixed(1); // Assuming ~1 reading per minute
  return `~${hoursOfData}hrs of data (${count} readings)`;
}

// Calculate chunked metrics for trend analysis
function calculateChunkedMetrics(
  readings: Array<{
    tempF: number;
    pressurePSI: number;
    vibrationMM: number;
    timestamp: string;
  }>,
  timeRange: number
) {
  if (readings.length === 0) return [];

  // Determine chunk size based on time range
  const chunkSizes: { [key: number]: { size: number; label: string } } = {
    1: { size: 15, label: "15min" }, // 1 hour: 4 chunks of 15 min
    4: { size: 60, label: "1hr" }, // 4 hours: 4 chunks of 1 hour
    8: { size: 60, label: "1hr" }, // 8 hours: 8 chunks of 1 hour
    12: { size: 120, label: "2hr" }, // 12 hours: 6 chunks of 2 hours
    24: { size: 180, label: "3hr" }, // 24 hours: 8 chunks of 3 hours
  };

  const chunkConfig = chunkSizes[timeRange] || { size: 60, label: "1hr" };
  const chunkSize = chunkConfig.size;
  const numChunks = Math.ceil(readings.length / chunkSize);

  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, readings.length);
    const chunkReadings = readings.slice(start, end);

    if (chunkReadings.length === 0) continue;

    const tempValues = chunkReadings.map((r) => r.tempF);
    const pressureValues = chunkReadings.map((r) => r.pressurePSI);
    const vibrationValues = chunkReadings.map((r) => r.vibrationMM);

    // Calculate how many hours ago this chunk represents (counting backwards from latest)
    const hoursAgoEnd = Math.floor(((numChunks - i - 1) * chunkSize) / 60);
    const hoursAgoStart = Math.floor(((numChunks - i) * chunkSize) / 60);

    // Generate time-based label
    let periodLabel: string;
    if (hoursAgoEnd === 0) {
      periodLabel = `Last ${chunkConfig.label}`;
    } else if (timeRange === 1) {
      // For 1-hour range, show minutes ago
      const minsAgoEnd = (numChunks - i - 1) * 15;
      const minsAgoStart = (numChunks - i) * 15;
      periodLabel = `${minsAgoStart}-${minsAgoEnd} mins ago`;
    } else if (hoursAgoStart === hoursAgoEnd) {
      periodLabel = `${hoursAgoEnd}hr ago`;
    } else {
      periodLabel = `${hoursAgoStart}-${hoursAgoEnd}hrs ago`;
    }

    chunks.push({
      chunkIndex: i,
      label: periodLabel,
      timeLabel: chunkConfig.label,
      tempMean: (
        tempValues.reduce((a, b) => a + b, 0) / tempValues.length
      ).toFixed(2),
      pressureMean: (
        pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length
      ).toFixed(2),
      vibrationMean: (
        vibrationValues.reduce((a, b) => a + b, 0) / vibrationValues.length
      ).toFixed(2),
      tempRoC:
        tempValues.length > 1
          ? (
              ((tempValues[tempValues.length - 1] - tempValues[0]) /
                tempValues[0]) *
              100
            ).toFixed(2)
          : "0.00",
      pressureRoC:
        pressureValues.length > 1
          ? (
              ((pressureValues[pressureValues.length - 1] - pressureValues[0]) /
                pressureValues[0]) *
              100
            ).toFixed(2)
          : "0.00",
      vibrationRoC:
        vibrationValues.length > 1
          ? (
              ((vibrationValues[vibrationValues.length - 1] -
                vibrationValues[0]) /
                vibrationValues[0]) *
              100
            ).toFixed(2)
          : "0.00",
    });
  }

  // Reverse chunks so most recent is at the top
  return chunks.reverse();
}

// Asset Detail Component (shown when accordion is expanded)
function AssetDetail({
  assetId,
  timeRange,
  setTimeRange,
}: {
  assetId: string;
  timeRange: number;
  setTimeRange: (value: number) => void;
}) {
  // Calculate readings limit based on time range
  // Assuming ~1 reading per minute: 1 hour = 60, 4 hours = 240, etc.
  const readingsLimit = timeRange * 60;

  const { data, isLoading } = useAsset(assetId, readingsLimit);

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Loader2
          size={32}
          style={{ animation: "spin 1s linear infinite", margin: "0 auto" }}
        />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          Loading details...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { asset, readings, prediction } = data;

  // Reverse readings once for chronological order (oldest to newest)
  const chronologicalReadings = [...readings].reverse();

  // Export detailed report to CSV
  const handleExportDetailedReport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${asset.name.replace(
      /\s+/g,
      "_"
    )}_${timeRange}h_report_${timestamp}.csv`;

    // Calculate metrics for export
    const chunks = calculateChunkedMetrics(chronologicalReadings, timeRange);

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push(`"Asset Detailed Report - ${asset.name}"`);
    lines.push(`"Generated: ${new Date().toLocaleString()}"`);
    lines.push(`"Time Range: ${timeRange} hours"`);
    lines.push(`"Total Readings: ${readings.length}"`);
    lines.push("");

    // Asset Info
    lines.push('"ASSET INFORMATION"');
    lines.push(`"Type","${asset.name}"`);
    lines.push(`"Location","${asset.location || "N/A"}"`);
    lines.push(`"Manufacturer","${asset.manufacturer || "N/A"}"`);
    lines.push(`"Model","${asset.model || "N/A"}"`);
    if (prediction) {
      lines.push(`"Risk Level","${prediction.riskLevel}"`);
      lines.push(
        `"Failure Probability","${(prediction.probability * 100).toFixed(1)}%"`
      );
    }
    lines.push("");

    // Current Status
    if (readings.length > 0) {
      lines.push('"CURRENT SENSOR STATUS"');
      lines.push(`"Temperature","${readings[0].tempF}°F"`);
      lines.push(`"Pressure","${readings[0].pressurePSI} PSI"`);
      lines.push(`"Vibration","${readings[0].vibrationMM} mm"`);
      lines.push("");
    }

    // Half-to-Half Analysis
    const midpoint = Math.floor(chronologicalReadings.length / 2);
    const firstHalf = chronologicalReadings.slice(0, midpoint);
    const secondHalf = chronologicalReadings.slice(midpoint);

    const calcMetrics = (data: typeof readings) => {
      const temps = data.map((r) => r.tempF);
      const pressures = data.map((r) => r.pressurePSI);
      const vibrations = data.map((r) => r.vibrationMM);
      return {
        tempAvg:
          temps.length > 0
            ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2)
            : "N/A",
        tempMax: temps.length > 0 ? Math.max(...temps).toFixed(2) : "N/A",
        tempMin: temps.length > 0 ? Math.min(...temps).toFixed(2) : "N/A",
        pressureAvg:
          pressures.length > 0
            ? (pressures.reduce((a, b) => a + b, 0) / pressures.length).toFixed(
                2
              )
            : "N/A",
        pressureMax:
          pressures.length > 0 ? Math.max(...pressures).toFixed(2) : "N/A",
        pressureMin:
          pressures.length > 0 ? Math.min(...pressures).toFixed(2) : "N/A",
        vibrationAvg:
          vibrations.length > 0
            ? (
                vibrations.reduce((a, b) => a + b, 0) / vibrations.length
              ).toFixed(2)
            : "N/A",
        vibrationMax:
          vibrations.length > 0 ? Math.max(...vibrations).toFixed(2) : "N/A",
        vibrationMin:
          vibrations.length > 0 ? Math.min(...vibrations).toFixed(2) : "N/A",
      };
    };

    const firstMetrics = calcMetrics(firstHalf);
    const secondMetrics = calcMetrics(secondHalf);

    lines.push('"TREND ANALYSIS: FIRST HALF vs SECOND HALF"');
    lines.push(
      '"Metric","Temperature (°F) Change %","Pressure (PSI) Change %","Vibration (mm) Change %"'
    );

    const calcRoc = (first: string, second: string) => {
      if (first === "N/A" || second === "N/A") return "N/A";
      return (
        ((parseFloat(second) - parseFloat(first)) / parseFloat(first)) *
        100
      ).toFixed(2);
    };

    lines.push(
      `"Average","${calcRoc(
        firstMetrics.tempAvg,
        secondMetrics.tempAvg
      )}%","${calcRoc(
        firstMetrics.pressureAvg,
        secondMetrics.pressureAvg
      )}%","${calcRoc(firstMetrics.vibrationAvg, secondMetrics.vibrationAvg)}%"`
    );
    lines.push(
      `"Maximum","${calcRoc(
        firstMetrics.tempMax,
        secondMetrics.tempMax
      )}%","${calcRoc(
        firstMetrics.pressureMax,
        secondMetrics.pressureMax
      )}%","${calcRoc(firstMetrics.vibrationMax, secondMetrics.vibrationMax)}%"`
    );
    lines.push(
      `"Minimum","${calcRoc(
        firstMetrics.tempMin,
        secondMetrics.tempMin
      )}%","${calcRoc(
        firstMetrics.pressureMin,
        secondMetrics.pressureMin
      )}%","${calcRoc(firstMetrics.vibrationMin, secondMetrics.vibrationMin)}%"`
    );
    lines.push("");

    // Time Segment Analysis
    if (chunks.length > 0) {
      lines.push('"TIME SEGMENT TREND ANALYSIS"');
      lines.push(
        '"Period","Temp Avg (°F)","Temp RoC %","Pressure Avg (PSI)","Pressure RoC %","Vibration Avg (mm)","Vibration RoC %"'
      );
      chunks.forEach((chunk) => {
        lines.push(
          `"${chunk.label}","${chunk.tempMean}","${chunk.tempRoC}","${chunk.pressureMean}","${chunk.pressureRoC}","${chunk.vibrationMean}","${chunk.vibrationRoC}"`
        );
      });
      lines.push("");
    }

    // Prediction
    if (prediction) {
      lines.push('"ML PREDICTION"');
      lines.push(
        `"Failure Probability","${(prediction.probability * 100).toFixed(1)}%"`
      );
      lines.push(`"Risk Level","${prediction.riskLevel}"`);
      if (prediction.modelVersion) {
        lines.push(`"Model Version","${prediction.modelVersion}"`);
      }
    }

    // Create and download
    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{ padding: "1.5rem", borderTop: "2px solid var(--border-color)" }}
    >
      {/* Asset Metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        {asset.manufacturer && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Manufacturer
            </div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {asset.manufacturer}
            </div>
          </div>
        )}
        {asset.model && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Model
            </div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {asset.model}
            </div>
          </div>
        )}
        {asset.installationDate && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Installed
            </div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {new Date(asset.installationDate).toLocaleDateString()}
            </div>
          </div>
        )}
        {asset.lastMaintenanceDate && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Last Maintenance
            </div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {new Date(asset.lastMaintenanceDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Header with Export Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            {asset.name} - Detailed Analysis
          </h3>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            {timeRange}h analysis window • {readings.length} readings
          </p>
        </div>
        <button
          onClick={handleExportDetailedReport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1rem",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          <FileText size={16} />
          Export Report
        </button>
      </div>

      {/* Time Range Selector - Tab Style */}
      <div
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              backgroundColor: "#f3f4f6",
              padding: "0.25rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            {[1, 4, 8, 12, 24].map((hours) => (
              <button
                key={hours}
                onClick={() => setTimeRange(hours)}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor:
                    timeRange === hours ? "#3b82f6" : "transparent",
                  color: timeRange === hours ? "#ffffff" : "#6b7280",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (timeRange !== hours) {
                    e.currentTarget.style.backgroundColor = "#e5e7eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeRange !== hours) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {hours}h
              </button>
            ))}
          </div>
          <div
            style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}
          >
            {formatReadingsDuration(readings.length)}
          </div>
        </div>
      </div>

      {/* Latest Sensor Readings Summary */}
      {readings.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              marginBottom: "1rem",
              fontSize: "1.125rem",
              color: "#111827",
              fontWeight: 600,
            }}
          >
            Current Sensor Status
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #e5e7eb",
              }}
            >
              <Thermometer
                size={24}
                style={{
                  margin: "0 auto 0.5rem",
                  color: "#dc2626",
                }}
              />
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Temperature
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {readings[0].tempF}°F
              </div>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #e5e7eb",
              }}
            >
              <Gauge
                size={24}
                style={{
                  margin: "0 auto 0.5rem",
                  color: "#ca8a04",
                }}
              />
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Pressure
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {readings[0].pressurePSI} PSI
              </div>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid #e5e7eb",
              }}
            >
              <Activity
                size={24}
                style={{
                  margin: "0 auto 0.5rem",
                  color: "#16a34a",
                }}
              />
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Vibration
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {readings[0].vibrationMM} mm
              </div>
            </div>
          </div>

          {/* Mini Charts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Temperature Chart */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Temperature Trend ({timeRange}h)
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={chronologicalReadings.map((r) => ({
                    time: new Date(r.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    value: r.tempF,
                  }))}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    name="Temp (°F)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pressure Chart */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Pressure Trend ({timeRange}h)
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={chronologicalReadings.map((r) => ({
                    time: new Date(r.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    value: r.pressurePSI,
                  }))}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ca8a04"
                    strokeWidth={2}
                    dot={false}
                    name="Pressure (PSI)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Vibration Chart */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Vibration Trend ({timeRange}h)
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={chronologicalReadings.map((r) => ({
                    time: new Date(r.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    value: r.vibrationMM,
                  }))}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    name="Vibration (mm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Half-to-Half Comparison Table */}
          <div style={{ marginTop: "1.5rem" }}>
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.125rem",
                color: "#111827",
                fontWeight: 600,
              }}
            >
              Trend Analysis: First Half → Second Half
            </h3>

            {(() => {
              // Split readings into two halves (chronological order: oldest to newest)
              const midpoint = Math.floor(chronologicalReadings.length / 2);
              const firstHalf = chronologicalReadings.slice(0, midpoint); // Older half
              const secondHalf = chronologicalReadings.slice(midpoint); // Newer half (most recent)

              // Calculate metrics for first and second half
              const calcHalfMetrics = (data: typeof readings) => {
                const temps = data.map((r) => r.tempF);
                const pressures = data.map((r) => r.pressurePSI);
                const vibrations = data.map((r) => r.vibrationMM);

                return {
                  tempAvg:
                    temps.length > 0
                      ? (
                          temps.reduce((a, b) => a + b, 0) / temps.length
                        ).toFixed(2)
                      : "N/A",
                  tempMax:
                    temps.length > 0 ? Math.max(...temps).toFixed(2) : "N/A",
                  tempMin:
                    temps.length > 0 ? Math.min(...temps).toFixed(2) : "N/A",
                  pressureAvg:
                    pressures.length > 0
                      ? (
                          pressures.reduce((a, b) => a + b, 0) /
                          pressures.length
                        ).toFixed(2)
                      : "N/A",
                  pressureMax:
                    pressures.length > 0
                      ? Math.max(...pressures).toFixed(2)
                      : "N/A",
                  pressureMin:
                    pressures.length > 0
                      ? Math.min(...pressures).toFixed(2)
                      : "N/A",
                  vibrationAvg:
                    vibrations.length > 0
                      ? (
                          vibrations.reduce((a, b) => a + b, 0) /
                          vibrations.length
                        ).toFixed(2)
                      : "N/A",
                  vibrationMax:
                    vibrations.length > 0
                      ? Math.max(...vibrations).toFixed(2)
                      : "N/A",
                  vibrationMin:
                    vibrations.length > 0
                      ? Math.min(...vibrations).toFixed(2)
                      : "N/A",
                };
              };

              const firstMetrics = calcHalfMetrics(firstHalf);
              const secondMetrics = calcHalfMetrics(secondHalf);

              // Helper to render value with "was" format
              const renderValue = (first: string, second: string) => {
                if (first === "N/A" || second === "N/A")
                  return { display: "N/A", roc: "N/A" };
                return {
                  display: (
                    <>
                      {second}
                      <span
                        style={{
                          color: "#9ca3af",
                          fontSize: "0.75rem",
                          marginLeft: "0.25rem",
                        }}
                      >
                        (was {first})
                      </span>
                    </>
                  ),
                  roc: (
                    ((parseFloat(second) - parseFloat(first)) /
                      parseFloat(first)) *
                    100
                  ).toFixed(2),
                };
              };

              // Helper to render ROC with color
              const renderRoC = (roc: string) => {
                if (roc === "N/A") return "N/A";
                const rocVal = parseFloat(roc);
                const color =
                  rocVal > 0 ? "#dc2626" : rocVal < 0 ? "#16a34a" : "#6b7280";
                return (
                  <span style={{ color, fontWeight: 600 }}>
                    {rocVal > 0 ? "+" : ""}
                    {roc}%
                  </span>
                );
              };

              return (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "2px solid #d1d5db",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Metric
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Temperature (°F)
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Δ Change
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Pressure (PSI)
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Δ Change
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Vibration (mm)
                        </th>
                        <th
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Δ Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Average
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.tempAvg,
                              secondMetrics.tempAvg
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.tempAvg,
                              secondMetrics.tempAvg
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.pressureAvg,
                              secondMetrics.pressureAvg
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.pressureAvg,
                              secondMetrics.pressureAvg
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.vibrationAvg,
                              secondMetrics.vibrationAvg
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.vibrationAvg,
                              secondMetrics.vibrationAvg
                            ).roc
                          )}
                        </td>
                      </tr>
                      <tr
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Maximum
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.tempMax,
                              secondMetrics.tempMax
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.tempMax,
                              secondMetrics.tempMax
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.pressureMax,
                              secondMetrics.pressureMax
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.pressureMax,
                              secondMetrics.pressureMax
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.vibrationMax,
                              secondMetrics.vibrationMax
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.vibrationMax,
                              secondMetrics.vibrationMax
                            ).roc
                          )}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: "#ffffff" }}>
                        <td
                          style={{
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          Minimum
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.tempMin,
                              secondMetrics.tempMin
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.tempMin,
                              secondMetrics.tempMin
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.pressureMin,
                              secondMetrics.pressureMin
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.pressureMin,
                              secondMetrics.pressureMin
                            ).roc
                          )}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {
                            renderValue(
                              firstMetrics.vibrationMin,
                              secondMetrics.vibrationMin
                            ).display
                          }
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderRoC(
                            renderValue(
                              firstMetrics.vibrationMin,
                              secondMetrics.vibrationMin
                            ).roc
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Trend Analysis - Chunked Metrics */}
          <div style={{ marginTop: "2rem" }}>
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.125rem",
                color: "#111827",
                fontWeight: 600,
              }}
            >
              Trend Analysis - Time Segments
            </h3>

            {(() => {
              const chunks = calculateChunkedMetrics(
                chronologicalReadings,
                timeRange
              );

              if (chunks.length === 0) return null;

              return (
                <>
                  {/* Chunked Statistics Table */}
                  <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.875rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "2px solid #d1d5db",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            Period
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              fontWeight: 600,
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            Temperature (°F)
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              fontWeight: 600,
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            Pressure (PSI)
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              fontWeight: 600,
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            Vibration (mm)
                          </th>
                        </tr>
                        <tr
                          style={{
                            borderBottom: "2px solid #d1d5db",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "left",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            {chunks[0].timeLabel} intervals
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            Avg
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            RoC %
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            Avg
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            RoC %
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            Avg
                          </th>
                          <th
                            style={{
                              padding: "0.5rem 0.75rem",
                              textAlign: "right",
                              fontWeight: 500,
                              color: "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            RoC %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunks.map((chunk, index) => (
                          <tr
                            key={chunk.chunkIndex}
                            style={{
                              borderBottom:
                                index === chunks.length - 1
                                  ? "none"
                                  : "1px solid #e5e7eb",
                              backgroundColor:
                                index % 2 === 0 ? "#ffffff" : "#f9fafb",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.75rem",
                                fontWeight: 600,
                                color: "#374151",
                              }}
                            >
                              {chunk.label}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                                fontWeight: 500,
                              }}
                            >
                              {chunk.tempMean}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                fontWeight: 600,
                                color:
                                  parseFloat(chunk.tempRoC) > 0
                                    ? "#dc2626"
                                    : parseFloat(chunk.tempRoC) < 0
                                    ? "#16a34a"
                                    : "#111827",
                              }}
                            >
                              {chunk.tempRoC}%
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                                fontWeight: 500,
                              }}
                            >
                              {chunk.pressureMean}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                fontWeight: 600,
                                color:
                                  parseFloat(chunk.pressureRoC) > 0
                                    ? "#dc2626"
                                    : parseFloat(chunk.pressureRoC) < 0
                                    ? "#16a34a"
                                    : "#111827",
                              }}
                            >
                              {chunk.pressureRoC}%
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                                fontWeight: 500,
                              }}
                            >
                              {chunk.vibrationMean}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                fontWeight: 600,
                                color:
                                  parseFloat(chunk.vibrationRoC) > 0
                                    ? "#dc2626"
                                    : parseFloat(chunk.vibrationRoC) < 0
                                    ? "#16a34a"
                                    : "#111827",
                              }}
                            >
                              {chunk.vibrationRoC}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Trend Visualization Charts */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Temperature Trend Chart */}
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Temperature Trend by Period
                      </h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart
                          data={chunks.reverse().map((c) => ({
                            period: c.label,
                            avg: parseFloat(c.tempMean),
                            roc: parseFloat(c.tempRoC),
                          }))}
                          margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "RoC %",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "Avg °F",
                              angle: 90,
                              position: "insideRight",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avg"
                            stroke="#dc2626"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Avg Temp"
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="roc"
                            stroke="#f97316"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                            name="Rate of Change"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pressure Trend Chart */}
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Pressure Trend by Period
                      </h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart
                          data={chunks.map((c) => ({
                            period: c.label,
                            avg: parseFloat(c.pressureMean),
                            roc: parseFloat(c.pressureRoC),
                          }))}
                          margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "RoC %",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "Avg PSI",
                              angle: 90,
                              position: "insideRight",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avg"
                            stroke="#ca8a04"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Avg Pressure"
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="roc"
                            stroke="#f97316"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                            name="Rate of Change"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Vibration Trend Chart */}
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        padding: "1rem",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Vibration Trend by Period
                      </h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart
                          data={chunks.map((c) => ({
                            period: c.label,
                            avg: parseFloat(c.vibrationMean),
                            roc: parseFloat(c.vibrationRoC),
                          }))}
                          margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "RoC %",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10, fill: "#6b7280" }}
                            label={{
                              value: "Avg mm",
                              angle: 90,
                              position: "insideRight",
                              style: { fontSize: 10, fill: "#6b7280" },
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avg"
                            stroke="#16a34a"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Avg Vibration"
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="roc"
                            stroke="#f97316"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                            name="Rate of Change"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Prediction Details */}
      {prediction && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            borderLeft: `4px solid ${
              prediction.riskLevel === "green"
                ? "#16a34a"
                : prediction.riskLevel === "yellow"
                ? "#ca8a04"
                : "#dc2626"
            }`,
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
              fontWeight: 500,
            }}
          >
            ML Prediction
          </div>
          <div
            style={{
              fontWeight: 600,
              marginBottom: "0.25rem",
              color: "#111827",
            }}
          >
            Failure Probability: {(prediction.probability * 100).toFixed(1)}%
          </div>
          {prediction.modelVersion && (
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Model: {prediction.modelVersion}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AssetTable() {
  const { data: assets, isLoading, error } = useAssets();
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(24); // Default to 24 hours
  const [sortField, setSortField] = useState<SortField>("riskLevel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const toggleAsset = (assetId: string) => {
    setExpandedAssetId(expandedAssetId === assetId ? null : assetId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  // Sort assets
  const sortedAssets = useMemo(() => {
    if (!assets) return [];

    const sorted = [...assets].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "location":
          comparison = (a.location || "").localeCompare(b.location || "");
          break;
        case "riskLevel":
          const riskOrder = { red: 3, yellow: 2, green: 1 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
        case "failureProbability":
          comparison = a.failureProbability - b.failureProbability;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [assets, sortField, sortDirection]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!sortedAssets || sortedAssets.length === 0) return;

    const headers = [
      "Asset ID",
      "Type",
      "Location",
      "Risk Level",
      "Failure Probability (%)",
      "Recommendation",
      "Manufacturer",
      "Model",
    ];

    const rows = sortedAssets.map((asset) => [
      asset.id,
      asset.name,
      asset.location || "",
      asset.riskLevel,
      (asset.failureProbability * 100).toFixed(1),
      asset.recommendation,
      asset.manufacturer || "",
      asset.model || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `assets-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <Loader2
          size={40}
          style={{ animation: "spin 1s linear infinite", margin: "0 auto" }}
        />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          Loading assets...
        </p>

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "var(--color-red-700)" }}>
          Error loading assets: {error.message}
        </p>
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="card">
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
          No assets found. Upload a CSV file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header with Export Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Assets ({sortedAssets.length})</h2>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            backgroundColor: "#374151",
            color: "#f3f4f6",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "0.875rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4b5563";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#374151";
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Table View */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#374151",
                borderBottom: "2px solid var(--border-color)",
              }}
            >
              <th
                onClick={() => handleSort("id")}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  color: "#f3f4f6",
                  backgroundColor: "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Asset {getSortIcon("id")}
                </div>
              </th>
              <th
                onClick={() => handleSort("name")}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  color: "#f3f4f6",
                  backgroundColor: "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Type {getSortIcon("name")}
                </div>
              </th>
              <th
                onClick={() => handleSort("location")}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  color: "#f3f4f6",
                  backgroundColor: "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Location {getSortIcon("location")}
                </div>
              </th>
              <th
                onClick={() => handleSort("riskLevel")}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  color: "#f3f4f6",
                  backgroundColor: "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  Risk Level {getSortIcon("riskLevel")}
                </div>
              </th>
              <th
                onClick={() => handleSort("failureProbability")}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background-color 0.15s ease",
                  color: "#f3f4f6",
                  backgroundColor: "#374151",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#374151";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Recommendation {getSortIcon("failureProbability")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.map((asset) => {
              const isExpanded = expandedAssetId === asset.id;

              return (
                <>
                  <tr
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    style={{
                      backgroundColor:
                        asset.riskLevel === "green"
                          ? "var(--color-green-300)"
                          : asset.riskLevel === "yellow"
                          ? "var(--color-yellow-300)"
                          : "var(--color-red-300)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      borderBottom: isExpanded
                        ? "none"
                        : "1px solid var(--border-color)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.005)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Asset ID with Chevron */}
                    <td
                      style={{
                        padding: "1rem",
                        fontWeight: 600,
                        fontSize: "1rem",
                        color:
                          asset.riskLevel === "green"
                            ? "var(--color-green-900)"
                            : asset.riskLevel === "yellow"
                            ? "var(--color-yellow-900)"
                            : "var(--color-red-900)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        {getAssetIcon(asset.type)}
                        {asset.id}
                      </div>
                    </td>

                    {/* Type */}
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color:
                          asset.riskLevel === "green"
                            ? "var(--color-green-900)"
                            : asset.riskLevel === "yellow"
                            ? "var(--color-yellow-900)"
                            : "var(--color-red-900)",
                      }}
                    >
                      {asset.name}
                    </td>

                    {/* Location */}
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color:
                          asset.riskLevel === "green"
                            ? "var(--color-green-900)"
                            : asset.riskLevel === "yellow"
                            ? "var(--color-yellow-900)"
                            : "var(--color-red-900)",
                      }}
                    >
                      {asset.location || "-"}
                    </td>

                    {/* Risk Badge with Probability */}
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span
                          className={`risk-badge ${asset.riskLevel.toLowerCase()}`}
                          style={{
                            padding: "0.25rem 0.75rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {asset.riskLevel === "green"
                            ? "Low"
                            : asset.riskLevel === "yellow"
                            ? "Medium"
                            : "High"}
                        </span>
                        <span
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: 600,
                            color:
                              asset.riskLevel === "green"
                                ? "var(--color-green-900)"
                                : asset.riskLevel === "yellow"
                                ? "var(--color-yellow-900)"
                                : "var(--color-red-900)",
                          }}
                        >
                          {(asset.failureProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Recommendation */}
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color:
                          asset.riskLevel === "green"
                            ? "var(--color-green-900)"
                            : asset.riskLevel === "yellow"
                            ? "var(--color-yellow-900)"
                            : "var(--color-red-900)",
                      }}
                    >
                      {asset.recommendation}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: 0,
                          backgroundColor:
                            asset.riskLevel === "green"
                              ? "var(--color-green-200)"
                              : asset.riskLevel === "yellow"
                              ? "var(--color-yellow-200)"
                              : "var(--color-red-200)",
                          borderBottom: "2px solid var(--border-color)",
                        }}
                      >
                        <AssetDetail
                          assetId={asset.id}
                          timeRange={timeRange}
                          setTimeRange={setTimeRange}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
