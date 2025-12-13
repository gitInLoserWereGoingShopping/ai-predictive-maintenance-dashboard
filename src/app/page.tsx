export default function Home() {
  return (
    <div className="dashboard">
      <div className="container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">AI Maintenance Predictor</h1>
          <p className="dashboard-subtitle">
            Predictive maintenance dashboard for monitoring industrial assets
            and preventing failures
          </p>
        </header>

        {/* Test our CSS components */}
        <section style={{ marginBottom: "2rem" }}>
          <h2>CSS Design System Test</h2>

          {/* Risk Badges */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <span className="risk-badge green">Low Risk</span>
            <span className="risk-badge yellow">Medium Risk</span>
            <span className="risk-badge red">High Risk</span>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Assets</div>
              <div className="stat-value">10</div>
              <div className="stat-change">Ready for monitoring</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Green (Low Risk)</div>
              <div className="stat-value">6</div>
              <div className="stat-change">Operating normally</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Yellow (Medium)</div>
              <div className="stat-value">2</div>
              <div className="stat-change">Monitor closely</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Red (High Risk)</div>
              <div className="stat-value">2</div>
              <div className="stat-change">Action required</div>
            </div>
          </div>

          {/* Accordion Test */}
          <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            Asset Table (Accordion)
          </h3>
          <div className="accordion">
            <div className="accordion-item risk-green">
              <div className="accordion-header">
                <div>
                  <strong>PUMP-101</strong> - Water Pump
                  <span
                    className="risk-badge green"
                    style={{ marginLeft: "1rem" }}
                  >
                    Green
                  </span>
                </div>
                <span>▼</span>
              </div>
            </div>

            <div className="accordion-item risk-yellow">
              <div className="accordion-header">
                <div>
                  <strong>COMP-204</strong> - Compressor
                  <span
                    className="risk-badge yellow"
                    style={{ marginLeft: "1rem" }}
                  >
                    Yellow
                  </span>
                </div>
                <span>▼</span>
              </div>
            </div>

            <div className="accordion-item risk-red">
              <div className="accordion-header">
                <div>
                  <strong>MOTOR-307</strong> - Primary Motor
                  <span
                    className="risk-badge red"
                    style={{ marginLeft: "1rem" }}
                  >
                    Red
                  </span>
                </div>
                <span>▼</span>
              </div>
            </div>
          </div>

          {/* Recommendation Cards */}
          <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            Recommendation Cards
          </h3>

          <div className="recommendation-card green">
            <div className="recommendation-title">
              ✓ Low Risk - Normal Operation
            </div>
            <p>Asset operating normally. Continue routine monitoring.</p>
          </div>

          <div className="recommendation-card yellow">
            <div className="recommendation-title">
              ⚠️ Medium Risk - Monitor Closely
            </div>
            <p>Elevated risk detected. Schedule inspection within 7 days.</p>
          </div>

          <div className="recommendation-card red">
            <div className="recommendation-title">
              🚨 High Risk - Immediate Action
            </div>
            <p>
              High failure risk. Immediate inspection and maintenance required.
            </p>
          </div>

          {/* Buttons */}
          <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Buttons</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-primary">Upload CSV</button>
            <button className="btn btn-secondary">Train Model</button>
          </div>
        </section>

        {/* Next Steps */}
        <div className="card">
          <h3>✅ Phase 0 Complete</h3>
          <p>Next.js project initialized with custom CSS design system.</p>
          <ul style={{ marginLeft: "1.5rem", lineHeight: "1.8" }}>
            <li>✅ TypeScript configuration</li>
            <li>✅ Custom CSS with pastel risk colors</li>
            <li>✅ Component styles ready</li>
            <li>✅ Design system established</li>
          </ul>
          <p style={{ marginTop: "1rem", fontWeight: 600 }}>
            Ready for Phase 1: Database Layer & Schema
          </p>
        </div>
      </div>
    </div>
  );
}
