# 🚀 IBVI Ads Platform

> **Unified Google Ads & Meta Ads Campaign Management Platform**  
> Real-time optimization, automated conversions tracking, and intelligent budget allocation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Rust](https://img.shields.io/badge/Rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Overview

IBVI Ads Platform is a **monorepo-based** campaign management system that unifies **Google Ads** and **Meta Ads** operations into a single, powerful interface. Built for scale, performance, and developer experience.

### ✨ Key Features

- 🔄 **Unified API**: Single endpoint for Google Ads + Meta Ads operations
- ⚡ **Real-time Conversions**: Instant conversion tracking with webhook integration
- 📊 **Budget Optimization**: AI-powered budget allocation across campaigns
- 🎯 **Lead Forms**: Native Google Ads Lead Forms with Make.com integration
- 🔍 **Campaign Analytics**: Deep insights with 3,670+ keywords tracked
- 🚀 **Auto-scaling**: Rust core for performance-critical operations
- 🛡️ **Type-safe**: End-to-end TypeScript + Rust type safety

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│              Dashboard + Campaign Management                │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│              Rust Core API (Axum) :8080                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Unified Campaigns Aggregator                      │   │
│  │  • Budget Optimization Engine                        │   │
│  │  • Real-time Performance Metrics                     │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┬─────────────────────────────────┬───────────────────┘
        │                                 │
        │ gRPC/HTTP                       │ HTTP
        ▼                                 ▼
┌───────────────────────┐      ┌──────────────────────────────┐
│ Python Gateway :8000  │      │   External APIs              │
│  ┌─────────────────┐  │      │  ┌────────────────────────┐  │
│  │ Google Ads API  │  │      │  │  Google Ads API v22    │  │
│  │ Meta Ads API    │  │◄─────┼─►│  Meta Marketing API    │  │
│  │ Conversions     │  │      │  │  Make.com Webhooks     │  │
│  └─────────────────┘  │      │  └────────────────────────┘  │
└───────────────────────┘      └──────────────────────────────┘
```


### 🧩 Components

| Component | Technology | Purpose | Port |
|-----------|-----------|---------|------|
| **Frontend** | Next.js 15 + TypeScript | Campaign dashboard & management UI | 3000 |
| **Core API** | Rust + Axum | High-performance aggregation & optimization | 8080 |
| **Gateway** | Python + FastAPI | API integrations (Google/Meta) | 8000 |
| **Scripts** | Python 3.12 | Automation & analytics (89 scripts) | - |

---

## 🛠️ Technology Stack

### Backend
- **Rust** (Core API)
  - Axum web framework
  - Tokio async runtime
  - Serde for JSON
  
- **Python** (Gateway + Scripts)
  - FastAPI
  - Google Ads API v22
  - Meta Marketing API

### Frontend
- **Next.js 15** (App Router)
- **TypeScript 5**
- **Tailwind CSS**
- **React 19**

---

## 📊 Platform Capabilities

### Campaign Management
```typescript
// Unified campaign query across Google Ads + Meta Ads
GET /campaigns
→ Returns 146 campaigns (51 Google, 95 Meta)
→ Unified schema, consistent metrics
```

### Conversion Tracking
```python
# Google Ads conversion upload
POST /v1/conversions/google
{
  "gclid": "abc123",
  "conversion_action": "purchase",
  "conversion_value": 1500.00
}
```

### Lead Forms Integration
- **13 Active Lead Forms** with native Google Ads integration
- **Make.com webhook**: Real-time lead delivery
- **Field collection**: Name, Email, Phone

---

## 📈 Performance Metrics (30 days)

- **Total Keywords**: 3,670 (3,341 active)
- **Daily Budget**: R$ 610/day across 14 campaigns
- **Conversions**: 84 tracked
- **Average CPA**: R$ 88.91
- **Best CPA**: R$ 4.69

### Optimization Results
- **+141% keywords** (from 340 to 481)
- **231 keywords** with optimized bids
- **4 STOC Casa Jardim** properties optimized

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/MbInteligen/ibvi-ads-platform.git
cd ibvi-ads-platform

# Start Rust Core API
cd ibvi-core && cargo run
# → http://localhost:8080

# Start Python Gateway  
cd ibvi-ads-gateway
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000

# Start Frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000
```

---

## 📦 Monorepo Structure

```
ibvi-ads-platform/
├── .github/workflows/ci.yml    # Unified CI/CD
├── ibvi-core/                  # Rust Core API
├── ibvi-ads-gateway/           # Python Gateway
├── frontend/                   # Next.js Frontend
├── scripts/                    # 89 automation scripts
├── data/                       # Data & configs
└── docs/                       # Documentation
```

---

## 🤝 Contributing

This is a **private repository** for internal development.

**Contact**: @limaronaldo  
**Organization**: [MbInteligen](https://github.com/MbInteligen)

### Development Workflow
1. Clone repo
2. Create feature branch
3. Make changes (respecting CODEOWNERS)
4. Run tests (CI automatic)
5. Open PR (requires CODEOWNERS approval)
6. Merge after CI ✅ + Review ✅

---

## 🔒 Security

- ✅ Private repository
- ✅ Credentials in `.env` (never committed)
- ✅ Branch protection enabled
- ✅ CODEOWNERS review required

---

## 📊 Project Stats

```
Languages:
  Python      52.1%
  Rust        28.4%
  TypeScript  15.3%

Files: 232
Scripts: 89
Contributors: 3 teams
```

---

## 🎯 Roadmap

- [x] Google Ads API v22 integration
- [x] Meta Ads API integration
- [x] Lead Forms with Make.com
- [x] Campaign analytics
- [x] Budget optimization
- [ ] AI-powered keyword suggestions
- [ ] Multi-account management
- [ ] Real-time bidding optimization

---

## 📄 License

Proprietary software owned by **MbInteligen**.

---

<div align="center">

**[🔗 Private Repository](https://github.com/MbInteligen/ibvi-ads-platform)**

Made with 🚀 by [MbInteligen](https://github.com/MbInteligen)

</div>
