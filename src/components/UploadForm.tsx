"use client";

/**
 * CSV Upload Form Component
 *
 * Allows users to upload CSV files with sensor data.
 * Includes optional fields for asset metadata.
 */

import { useState, FormEvent } from "react";
import { useUploadCSV } from "@/lib/hooks/useApi";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadCSV();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) return;

    const formData = new FormData(e.currentTarget);

    try {
      await uploadMutation.mutateAsync(formData);
      // Reset form on success
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: "1rem" }}>Upload Sensor Data</h2>

      <form onSubmit={handleSubmit}>
        {/* File Input */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="file"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 500,
            }}
          >
            CSV File *
          </label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".csv"
            required
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
            }}
          />
          {selectedFile && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Optional Metadata Fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label
              htmlFor="manufacturer"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              Manufacturer (optional)
            </label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              placeholder="e.g., Grundfos"
              disabled={uploadMutation.isPending}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="model"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              Model (optional)
            </label>
            <input
              type="text"
              id="model"
              name="model"
              placeholder="e.g., CR-95"
              disabled={uploadMutation.isPending}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="location"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              Location (optional)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="e.g., Building A - Floor 2"
              disabled={uploadMutation.isPending}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!selectedFile || uploadMutation.isPending}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2
                size={20}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload CSV
            </>
          )}
        </button>

        {/* Status Messages */}
        {uploadMutation.isSuccess && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "var(--color-green-100)",
              border: "1px solid var(--color-green-300)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--color-green-900)",
            }}
          >
            <CheckCircle size={20} />
            <div>
              <strong>Upload successful!</strong>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>
                {uploadMutation.data.rows_ingested} rows ingested,{" "}
                {uploadMutation.data.assets_detected} assets detected
              </p>
            </div>
          </div>
        )}

        {uploadMutation.isError && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "var(--color-red-100)",
              border: "1px solid var(--color-red-300)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--color-red-900)",
            }}
          >
            <XCircle size={20} />
            <div>
              <strong>Upload failed</strong>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>
                {uploadMutation.error.message}
              </p>
            </div>
          </div>
        )}
      </form>

      {/* Add spinner animation */}
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
