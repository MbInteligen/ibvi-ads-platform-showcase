# System Architecture Diagrams

## High-Level System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App<br/>Future]
    end
    
    subgraph "Edge Layer - CDN"
        CDN[Vercel Edge Network]
    end
    
    subgraph "Application Layer"
        Frontend[Next.js Frontend<br/>:3000<br/>React 19 + TypeScript]
        
        subgraph "Backend Services"
            Core[Rust Core API<br/>:8080<br/>Axum + Tokio]
            Gateway[Python Gateway<br/>:8000<br/>FastAPI]
        end
    end
    
    subgraph "Data Layer"
        Cache[(Redis Cache<br/>Campaign Data<br/>5min TTL)]
        DB[(PostgreSQL<br/>Optimization History)]
    end
    
    subgraph "External Services"
        GoogleAds[Google Ads API v22<br/>Campaign Management]
        MetaAds[Meta Marketing API<br/>Campaign Management]
        MakeCom[Make.com<br/>Webhook Router]
    end
    
    Browser -->|HTTPS| CDN
    Mobile -.->|Future| CDN
    CDN -->|SSR/SSG| Frontend
    Frontend -->|REST API| Core
    Core -->|HTTP| Gateway
    Core -->|Read/Write| DB
    Core -->|Get/Set| Cache
    Gateway -->|OAuth2| GoogleAds
    Gateway -->|OAuth2| MetaAds
    GoogleAds -->|Webhooks| MakeCom
    MakeCom -->|POST| Gateway
    
    style Frontend fill:#61dafb
    style Core fill:#f74c00
    style Gateway fill:#3776ab
    style GoogleAds fill:#4285f4
    style MetaAds fill:#0668e1
```

---

## Request Flow - Campaign Retrieval

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant CoreAPI
    participant Cache
    participant Gateway
    participant GoogleAds
    participant MetaAds
    
    User->>Frontend: Visit /campaigns
    Frontend->>CoreAPI: GET /api/campaigns
    
    CoreAPI->>Cache: Check cache
    alt Cache Hit
        Cache-->>CoreAPI: Return cached data
        CoreAPI-->>Frontend: Return campaigns
    else Cache Miss
        CoreAPI->>Gateway: GET /v1/google/campaigns
        CoreAPI->>Gateway: GET /v1/meta/campaigns
        
        par Parallel API Calls
            Gateway->>GoogleAds: List campaigns
            GoogleAds-->>Gateway: 51 campaigns
        and
            Gateway->>MetaAds: List campaigns
            MetaAds-->>Gateway: 95 campaigns
        end
        
        Gateway-->>CoreAPI: Return Google campaigns
        Gateway-->>CoreAPI: Return Meta campaigns
        
        CoreAPI->>CoreAPI: Aggregate & normalize
        CoreAPI->>Cache: Store (TTL 5min)
        CoreAPI-->>Frontend: Return 146 campaigns
    end
    
    Frontend->>Frontend: Render dashboard
    Frontend-->>User: Display campaigns
```

---

## Conversion Tracking Flow

```mermaid
sequenceDiagram
    participant Customer
    participant GoogleAds
    participant Website
    participant Gateway
    participant GoogleAdsAPI
    participant CoreAPI
    
    Customer->>GoogleAds: Clicks ad (gclid captured)
    GoogleAds->>Website: Redirect with ?gclid=abc123
    Website->>Website: Store gclid in cookie
    
    Customer->>Website: Completes purchase
    Website->>Gateway: POST /v1/conversions/google<br/>{gclid, value, time}
    
    Gateway->>Gateway: Validate payload
    Gateway->>GoogleAdsAPI: Upload enhanced conversion
    GoogleAdsAPI-->>Gateway: 200 OK
    
    Gateway->>CoreAPI: Notify conversion
    CoreAPI->>CoreAPI: Update metrics
    
    Gateway-->>Website: 201 Created
    Website-->>Customer: Show confirmation
```

---

## Lead Form Webhook Flow

```mermaid
sequenceDiagram
    participant User
    participant GoogleAds
    participant MakeCom
    participant Gateway
    participant CRM
    participant Notification
    
    User->>GoogleAds: Fills Lead Form<br/>(name, email, phone)
    GoogleAds->>GoogleAds: Validate & store
    
    GoogleAds->>MakeCom: Webhook POST<br/>Lead form data
    MakeCom->>MakeCom: Parse & route<br/>based on campaign
    
    alt Priority: URGENTE
        MakeCom->>Notification: SMS to sales team
        MakeCom->>Gateway: POST /webhooks/zapier<br/>Priority: URGENTE
    else Priority: ALTA
        MakeCom->>Gateway: POST /webhooks/zapier<br/>Priority: ALTA
        MakeCom->>CRM: Create lead
    else Priority: NORMAL
        MakeCom->>CRM: Create lead
        MakeCom->>Gateway: POST /webhooks/zapier
    end
    
    Gateway->>Gateway: Process lead data
    Gateway->>CRM: Sync to CRM
    Gateway-->>MakeCom: 200 OK
    
    CRM->>CRM: Auto-assign to agent
    CRM->>Notification: Email notification
    Notification-->>User: Thank you email
```

---

## Budget Optimization Flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant CoreAPI
    participant DB
    participant Gateway
    participant GoogleAds
    participant MetaAds
    
    Scheduler->>CoreAPI: Trigger optimization<br/>(every hour)
    CoreAPI->>Gateway: Fetch performance data
    Gateway->>GoogleAds: Get last 7 days metrics
    Gateway->>MetaAds: Get last 7 days metrics
    Gateway-->>CoreAPI: Return metrics
    
    CoreAPI->>CoreAPI: Calculate ROI per campaign
    CoreAPI->>CoreAPI: ML model prediction
    CoreAPI->>CoreAPI: Generate budget plan
    
    alt Budget change > 10%
        CoreAPI->>DB: Log optimization run
        CoreAPI->>Gateway: Update campaign budgets
        
        par Update both platforms
            Gateway->>GoogleAds: PATCH budget
            GoogleAds-->>Gateway: Updated
        and
            Gateway->>MetaAds: PATCH budget
            MetaAds-->>Gateway: Updated
        end
        
        CoreAPI->>DB: Save results
        CoreAPI->>CoreAPI: Send alert email
    else Budget change < 10%
        CoreAPI->>DB: Log (no changes)
    end
```

---

## Monorepo CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        Dev[Developer]
        Branch[Feature Branch]
    end
    
    subgraph "GitHub"
        PR[Pull Request]
        Main[Main Branch]
    end
    
    subgraph "CI - GitHub Actions"
        Lint[Linting<br/>rustfmt + black]
        TestRust[Rust Tests<br/>cargo test]
        TestPython[Python Tests<br/>pytest]
        TestFrontend[Frontend Tests<br/>npm test]
        Build[Build All<br/>Docker images]
    end
    
    subgraph "CD - Fly.io"
        DeployCore[Deploy Core<br/>Rust API]
        DeployGateway[Deploy Gateway<br/>Python API]
        DeployFrontend[Deploy Frontend<br/>Next.js]
    end
    
    subgraph "Production"
        Prod[Live Services]
    end
    
    Dev -->|git push| Branch
    Branch -->|Open PR| PR
    PR --> Lint
    Lint --> TestRust
    Lint --> TestPython
    Lint --> TestFrontend
    
    TestRust --> Build
    TestPython --> Build
    TestFrontend --> Build
    
    Build -->|Merge to main| Main
    Main --> DeployCore
    Main --> DeployGateway
    Main --> DeployFrontend
    
    DeployCore --> Prod
    DeployGateway --> Prod
    DeployFrontend --> Prod
    
    style Dev fill:#28a745
    style PR fill:#ffc107
    style Build fill:#17a2b8
    style Prod fill:#28a745
```

---

## Data Model

```mermaid
erDiagram
    CAMPAIGN ||--o{ AD_GROUP : contains
    CAMPAIGN ||--o{ OPTIMIZATION_RUN : has
    AD_GROUP ||--o{ KEYWORD : contains
    AD_GROUP ||--o{ AD : contains
    CAMPAIGN ||--o{ CONVERSION : tracks
    LEAD_FORM ||--o{ LEAD_SUBMISSION : receives
    
    CAMPAIGN {
        uuid id PK
        string platform "google|meta"
        string external_id
        string name
        string status
        bigint budget_micros
        bigint daily_budget_micros
        timestamp created_at
        timestamp updated_at
    }
    
    AD_GROUP {
        uuid id PK
        uuid campaign_id FK
        string external_id
        string name
        string status
    }
    
    KEYWORD {
        uuid id PK
        uuid ad_group_id FK
        string text
        string match_type "EXACT|PHRASE|BROAD"
        bigint cpc_bid_micros
        int quality_score
    }
    
    AD {
        uuid id PK
        uuid ad_group_id FK
        string type "RESPONSIVE_SEARCH_AD"
        jsonb headlines
        jsonb descriptions
    }
    
    OPTIMIZATION_RUN {
        uuid id PK
        uuid campaign_id FK
        bigint old_budget_micros
        bigint new_budget_micros
        string reason
        timestamp created_at
    }
    
    CONVERSION {
        uuid id PK
        uuid campaign_id FK
        string gclid
        string conversion_action
        decimal conversion_value
        timestamp conversion_time
    }
    
    LEAD_FORM {
        uuid id PK
        uuid campaign_id FK
        string external_id
        string webhook_url
    }
    
    LEAD_SUBMISSION {
        uuid id PK
        uuid lead_form_id FK
        string full_name
        string email
        string phone
        timestamp submitted_at
    }
```

---

## Deployment Architecture (Fly.io)

```mermaid
graph TB
    subgraph "Global Edge - Anycast"
        Edge[Fly.io Edge<br/>150+ locations]
    end
    
    subgraph "Region: South America East (GRU)"
        LB[Load Balancer<br/>Fly Proxy]
        
        subgraph "Core API Instances"
            Core1[Core Instance 1<br/>Rust + 512MB]
            Core2[Core Instance 2<br/>Rust + 512MB]
        end
        
        subgraph "Gateway Instances"
            Gateway1[Gateway Instance 1<br/>Python + 512MB]
            Gateway2[Gateway Instance 2<br/>Python + 512MB]
        end
        
        subgraph "Data"
            Redis[(Redis Cache<br/>256MB)]
            PG[(PostgreSQL<br/>10GB Volume)]
        end
    end
    
    subgraph "Region: US East (IAD)"
        Frontend[Frontend<br/>Vercel Edge]
    end
    
    Edge --> LB
    Edge --> Frontend
    
    LB --> Core1
    LB --> Core2
    
    Core1 --> Gateway1
    Core2 --> Gateway2
    Core1 --> Gateway2
    Core2 --> Gateway1
    
    Core1 --> Redis
    Core2 --> Redis
    Core1 --> PG
    Core2 --> PG
    
    Gateway1 --> Redis
    Gateway2 --> Redis
    
    style Edge fill:#7c3aed
    style LB fill:#2563eb
    style Core1 fill:#f97316
    style Core2 fill:#f97316
    style Gateway1 fill:#0891b2
    style Gateway2 fill:#0891b2
    style Frontend fill:#10b981
```

---

**Generated**: 2025-11-17  
**Tool**: Mermaid.js (GitHub native rendering)
