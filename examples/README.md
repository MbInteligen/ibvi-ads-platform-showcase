# Code Examples

This directory contains production-ready code examples demonstrating key concepts and patterns used in the IBVI Ads Platform.

## 📁 Structure

```
examples/
├── rust/               # Rust Core API examples
│   └── campaign_aggregator.rs
├── python/             # Python Gateway examples
│   └── conversion_tracker.py
└── typescript/         # Frontend examples
    └── campaign-client.ts
```

---

## 🦀 Rust Examples

### `campaign_aggregator.rs`
**Purpose**: Demonstrates the core aggregation logic that unifies Google Ads and Meta Ads campaigns.

**Key Concepts**:
- ✅ Axum web framework handlers
- ✅ Parallel async requests with `tokio::join!`
- ✅ Unified data models with Serde
- ✅ Error handling with `Result<T, E>`
- ✅ Unit tests with `#[cfg(test)]`

**Highlights**:
```rust
// Parallel requests to both platforms
let (google_result, meta_result) = tokio::join!(
    fetch_google_campaigns(&state),
    fetch_meta_campaigns(&state)
);
```

**Run**:
```bash
# Copy to your Rust project
cp examples/rust/campaign_aggregator.rs src/routes/

# Test
cargo test --lib
```

---

## 🐍 Python Examples

### `conversion_tracker.py`
**Purpose**: Shows how to upload conversions to Google Ads Enhanced Conversions API with PII hashing.

**Key Concepts**:
- ✅ FastAPI route handlers
- ✅ Pydantic models for validation
- ✅ Google Ads API v22 integration
- ✅ Enhanced conversions with SHA-256 hashing
- ✅ Error handling and HTTP status codes
- ✅ Async/await patterns

**Highlights**:
```python
# Enhanced conversion with PII hashing
user_data = self._build_enhanced_conversion_data(request)
click_conversion.user_identifiers.append(user_data)
```

**Run**:
```bash
# Copy to your Python project
cp examples/python/conversion_tracker.py app/routes/

# Test locally
uvicorn app.main:app --reload
curl -X POST http://localhost:8000/v1/conversions/google \
  -H "Content-Type: application/json" \
  -d '{"gclid": "abc123", ...}'
```

---

## 📘 TypeScript Examples

### `campaign-client.ts`
**Purpose**: Frontend client for fetching and displaying campaign data from the Rust Core API.

**Key Concepts**:
- ✅ TypeScript type definitions
- ✅ React hooks (`useCampaigns`)
- ✅ Fetch API with Next.js caching
- ✅ Data filtering and aggregation
- ✅ Component composition
- ✅ State management

**Highlights**:
```typescript
// Custom React hook with auto-refetch
const { campaigns, stats, loading } = useCampaigns({
  platform: 'google',
  status: 'ENABLED'
});
```

**Run**:
```bash
# Copy to your Next.js project
cp examples/typescript/campaign-client.ts lib/api/

# Use in page
import { CampaignDashboard } from '@/components/CampaignDashboard';
```

---

## 🎯 Usage Patterns

### 1. **Parallel API Calls** (Rust)
```rust
// Fetch from multiple sources concurrently
let (google, meta) = tokio::join!(
    fetch_google_campaigns(),
    fetch_meta_campaigns()
);
```

### 2. **PII Hashing** (Python)
```python
# Hash email before sending to API
hashed = hashlib.sha256(email.lower().encode()).hexdigest()
```

### 3. **Type-Safe API Client** (TypeScript)
```typescript
// Fully typed responses
const campaigns: Campaign[] = await client.getCampaigns();
```

---

## 🧪 Testing

### Rust
```bash
cd examples/rust
cargo test --lib campaign_aggregator
```

### Python
```bash
cd examples/python
pytest conversion_tracker.py -v
```

### TypeScript
```bash
cd examples/typescript
npm test campaign-client.test.ts
```

---

## 📚 Learn More

- **[Rust Documentation](../../docs/rust-patterns.md)** - Advanced Rust patterns
- **[Python Documentation](../../docs/python-integration.md)** - API integration guide
- **[TypeScript Documentation](../../docs/frontend-architecture.md)** - Frontend best practices
- **[Architecture Diagrams](../../docs/diagrams/SYSTEM_ARCHITECTURE.md)** - Visual system overview

---

## 🤝 Contributing

Found a better pattern? Want to add more examples?

1. Fork the repo
2. Add your example with documentation
3. Ensure tests pass
4. Submit a PR

---

## 📄 License

These examples are provided under the MIT License.  
See [LICENSE](../LICENSE) for details.
