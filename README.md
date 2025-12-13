# AI Maintenance Predictor Dashboard

> Predictive maintenance platform for monitoring industrial assets and preventing unexpected failures through ML-powered risk assessment.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 Overview

This dashboard helps maintenance teams transition from reactive to proactive asset management by:

- **Analyzing sensor data** from industrial equipment (temperature, pressure, vibration)
- **Predicting failure risk** using machine learning models
- **Visualizing trends** through interactive time-series charts
- **Recommending actions** based on risk levels (Green/Yellow/Red)

**Key Features:**

- 📤 CSV upload with intelligent validation and outlier detection
- 🎨 Color-coded accordion table with pastel risk indicators
- 📊 Expandable asset details with time-series visualization
- 🤖 ML-powered failure prediction and risk mapping
- 🗄️ SQLite database for efficient local storage
- 🚀 Deployed on Vercel for instant accessibility

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │  Frontend (React + TypeScript + CSS)
│   (Vercel)      │  - Asset Table (Custom Accordion)
└────────┬────────┘  - Charts (Recharts)
         │           - Upload UI
         │
         ▼
┌─────────────────┐
│   API Routes    │  Backend (Next.js Serverless)
│   (TypeScript)  │  - /api/upload
└────────┬────────┘  - /api/train
         │           - /api/predict
         │           - /api/assets
         ▼
┌─────────────────┐
│  SQLite + ORM   │  Data Layer (Drizzle)
│                 │  - sensor_readings
└────────┬────────┘  - assets
         │           - predictions
         │
         ▼
┌─────────────────┐
│   ML Service    │  Prediction Layer
│  (Python/TS)    │  - Feature Engineering
└─────────────────┘  - Model Training
                     - Risk Mapping
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Python 3.10+ (if using Python ML service)
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd skills-project

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate

# Generate seed data
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
skills-project/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities & database
│   ├── styles/           # CSS files
│   └── types/            # TypeScript definitions
├── docs/                 # Documentation
├── data/                 # Seed & upload data
└── tests/                # Test suites
```

See [MVP_GAMEPLAN.md](MVP_GAMEPLAN.md) for detailed structure.

---

## 📊 Data Schema

### CSV Upload Format

Required columns for sensor data upload:

```csv
timestamp,asset_id,tempF,pressurePSI,vibrationMM,failure_flag
2025-12-13T10:00:00Z,ASSET-001,165.2,95.3,1.2,0
2025-12-13T10:01:00Z,ASSET-001,166.1,94.8,1.3,0
2025-12-13T10:02:00Z,ASSET-002,172.5,102.1,2.1,0
```

**Field Definitions:**

- `timestamp`: ISO 8601 datetime
- `asset_id`: Unique asset identifier
- `tempF`: Temperature in Fahrenheit
- `pressurePSI`: Pressure in PSI
- `vibrationMM`: Vibration in millimeters
- `failure_flag`: 0 = normal, 1 = failure/imminent failure

See [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md) for full documentation.

---

## 🎨 UI Features

### Asset Table (Accordion Design)

- **Color-coded rows** based on risk level:
  - 🟢 **Green (Pastel)**: Low risk (p < 0.3)
  - 🟡 **Yellow (Pastel)**: Medium risk (0.3 ≤ p < 0.7)
  - 🔴 **Red (Pastel)**: High risk (p ≥ 0.7)

### Expandable Asset Detail

Each row expands to show:

- Time-series charts for all sensors
- Risk history timeline
- Feature importance (top contributors)
- Actionable maintenance recommendation

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Drizzle schema
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with sample data
npm run db:studio        # Open Drizzle Studio

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript validation
```

### Git Workflow

See [MVP_GAMEPLAN.md](MVP_GAMEPLAN.md#-git-workflow) for branching strategy.

**Example feature development:**

```bash
git checkout -b feature/new-feature
# Make changes...
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR → Review → Merge
```

---

## 📖 Documentation

| Document                                   | Description                  |
| ------------------------------------------ | ---------------------------- |
| [MVP_GAMEPLAN.md](MVP_GAMEPLAN.md)         | Complete development roadmap |
| [docs/API.md](docs/API.md)                 | API endpoint reference       |
| [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md) | Database & CSV schemas       |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development guide            |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)   | Deployment instructions      |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Environment variables needed:

```env
DATABASE_URL=./data/production.db
NODE_ENV=production
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🧪 Testing Strategy

- **Unit Tests**: Utility functions, feature engineering
- **Integration Tests**: API endpoints, database operations
- **Component Tests**: React components (Vitest + Testing Library)
- **E2E Tests**: Critical user flows (Playwright)

```bash
# Run specific test suite
npm test src/lib/ml/features.test.ts
```

---

## 🛣️ Roadmap

### ✅ MVP (Current)

- CSV upload and validation
- Predictive model training
- Risk-based asset visualization
- Accordion table with expandable details

### 🔜 Phase 2

- [ ] Real-time asset monitoring
- [ ] Multi-model comparison
- [ ] Exportable PDF reports
- [ ] User authentication
- [ ] Advanced outlier detection

### 🔮 Future

- [ ] Mobile app
- [ ] Alert notifications
- [ ] Integration with IoT devices
- [ ] Multi-tenant support

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Charts powered by [Recharts](https://recharts.org/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Styled with custom CSS variables

---

## 📧 Contact

For questions or feedback, please open an issue or contact the maintainers.

**Project Status:** 🚧 Active Development - Phase 0 Complete

---

Made with ❤️ for proactive maintenance teams
