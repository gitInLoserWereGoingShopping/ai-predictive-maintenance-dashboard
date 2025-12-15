"use client";

import { useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import { AssetTable } from "@/components/AssetTable";
import { Upload } from "lucide-react";

export default function Home() {
  const [showUploadForm, setShowUploadForm] = useState(false);

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">AI Maintenance Predictor</h1>
          <p className="dashboard-subtitle">
            Monitor assets • Gather insights • Prevent failures
          </p>
        </header>

        {/* Upload CSV Card */}
        <div className="stats-grid">
          <div
            className="stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <div className="stat-label">Upload CSV</div>
            <div className="stat-value">
              <Upload size={32} />
            </div>
            <div className="stat-change">
              {showUploadForm ? "Click to hide form" : "Add new sensor data"}
            </div>
          </div>
        </div>

        {/* Upload Form - Conditionally Rendered */}
        {showUploadForm && <UploadForm />}

        {/* Asset Table */}
        <AssetTable />
      </div>
    </div>
  );
}
