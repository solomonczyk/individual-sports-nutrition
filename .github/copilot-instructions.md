# AI Copilot Instructions - Individual Sports Nutrition

## Architecture Overview

**3-Service Microservices with AI-Driven Personalization**

- **Backend API** (Node.js/Express): REST API serving mobile app & orchestrating other services
- **AI Service** (Python/FastAPI): ML recommendations, meal planning, nutrition scoring
- **Mobile App** (React Native/Expo): Cross-platform client with file-based routing (Expo Router)
- **Database**: PostgreSQL (data), Redis (cache), MongoDB (analytics)

**Critical Data Flow**: Mobile → Backend → Backend orchestrates AI Service + Database → Response with personalized recommendations based on user health profile & contraindications.

## Key Architectural Patterns

### Service Communication
- Backend calls AI Service via `AIServiceClient` wrapper with **retry logic** (exponential backoff in `app/services/ai-service-client.ts`)
- API contracts defined in `docs/API_CONTRACTS.md` - reference before inter-service changes
- Health-profile → User-specific scoring → Contraindication filtering (3-step recommendation pipeline)

### ML Configuration
- **External config file**: `ai-service/ml_config.json` (not hardcoded parameters) - loaded on startup
- Recommendation scoring, meal planning weights, dosage thresholds all configurable
- See `app/utils/ml_config.py` for loading pattern

### State Management
- **Backend**: Service-based architecture with dependency injection
- **Mobile**: Zustand for auth + language; React Query (TanStack) for server state
- No Redux - keep mobile lean with hooks (useAuth, useUserProfile, useMealPlan)

## Development Workflows

### Testing (202+ tests across project)

**Backend API** (152 tests):
```bash
npm test              # Vitest - all unit tests
npm run test:watch   # Watch mode
npm run test:e2e     # Playwright E2E (registration, health, meals)
npm run test:coverage # Coverage report (target: 60%+ met)
```

Test structure: `src/__tests__/{services,middleware,controllers,integration}`
- **Services**: Dependency injection + mocking repos (`vi.fn()` for mocks)
- **Middleware**: Mock req/res/next pattern
- **Integration**: Full API flow tests with test data fixtures

**Mobile App** (50+ tests):
```bash
jest              # Component & hook tests
jest --watch     # Watch mode
```

- Setup mocks in `src/__tests__/setup.ts` (React Navigation, AsyncStorage, Expo Router)
- Hook tests cover data fetching & auth flows
- Component tests verify UI + validation

**AI Service** (Python):
```bash
pytest tests/     # if pytest configured
python test_scoring.py  # Manual test script for ML features
```

### Build & Run Commands

**Local Development** (3-service stack):
```bash
# Terminal 1: Backend
cd backend-api && npm run dev      # :3000

# Terminal 2: AI Service
cd ai-service && python run.py    # :8000 (or: uvicorn app.main:app --reload)

# Terminal 3: Mobile
cd mobile-app && npm start        # Expo - pick platform (a/i/w)

# One-off scripts for mobile
./scripts/test-mobile.ps1         # Interactive (Windows)
./scripts/test-mobile.sh android  # Direct platform (Linux/Mac)
```

**Database Setup**:
```bash
# Migrations in sequence (order matters - schemas → data → localization)
psql -U postgres -d individual_sports_nutrition -f database/migrations/001_initial_schema.sql
psql -U postgres -d individual_sports_nutrition -f database/migrations/002_stores_and_prices.sql
psql -U postgres -d individual_sports_nutrition -f database/migrations/003_ingredients_and_meals.sql
psql -U postgres -d individual_sports_nutrition -f database/migrations/004_serbian_localization.sql
```

## Code Patterns & Conventions

### Backend (Node.js/TypeScript)

**Services** - Business logic layer with DI:
```typescript
// Pattern from recommendation-service.ts
export class RecommendationService {
  constructor(
    private healthProfileService: HealthProfileService,
    private productService: ProductService,
    private aiServiceClient: AIServiceClient
  ) {}
  
  async getRecommendations(userId: string, options?: RecommendationOptions) {
    const profile = await this.healthProfileService.getByUserId(userId)
    // Filter by contraindications
    const filtered = await this.contraindicationRepository.filterProducts(...)
    // Enrich with AI scores
    const scored = await this.aiServiceClient.scoreProducts(...)
    return sorted results
  }
}
```

**Error Handling**: Custom middleware in `src/middlewares/error-handler.ts` - catches all service errors and returns typed responses. Always throw Error with message.

**Validation**: Zod schemas in models - validate input before passing to services.

### Mobile (React Native/Expo)

**Hooks Pattern** (centralize data fetching):
```typescript
// useAuth, useUserProfile, useMealPlan in src/hooks/
export function useAuth() {
  const store = useAuthStore()  // Zustand
  const query = useQuery(['auth'], authService.getProfile)
  return { ...store, ...query }
}
```

**Screens**: File-based routing with Expo Router in `app/` directory. Layout hierarchy defines navigation structure.

**Forms**: React Hook Form + Zod validation (health profile, login, meals).

**Localization**: 6 languages (sr, hu, ro, en, ru, uk) with i18n store - access via `useLanguageStore()`.

### AI Service (Python/FastAPI)

**ML Config Loading**:
```python
from app.utils.ml_config import get_ml_config
config = get_ml_config()  # Loads ml_config.json
# Use config['recommendation_weights'], config['dosage_thresholds'], etc.
```

**Service Pattern** (RecommendationService in app/services/):
- Fetch base products from Backend API
- Apply health profile filtering
- Call ML scoring logic
- Return with reasons + warnings

**Pydantic Models**: Strict validation for API contracts.

## Critical Files & Integration Points

| File | Purpose | Why Important |
|------|---------|---|
| `backend-api/src/services/recommendation-service.ts` | Orchestrates recommendations | Core business logic; calls AI Service |
| `ai-service/ml_config.json` | ML parameters | Controls scoring, weights - externalized |
| `database/migrations/` | Schema setup | Must run in order; 004 = Serbian localization |
| `docs/API_CONTRACTS.md` | Service contracts | Source of truth for inter-service APIs |
| `backend-api/src/__tests__/setup.ts` | Test mocks | Required for all service tests |
| `mobile-app/src/__tests__/setup.ts` | Mobile mocks | React Navigation, AsyncStorage, routing |
| `docs/TESTING_INFRASTRUCTURE_COMPLETE.md` | Test patterns | 202 tests, coverage targets, mocking examples |

## Multi-Language & Localization

- **Supported**: Serbian (sr), Hungarian (hu), Romanian (ro), English (en), Russian (ru), Ukrainian (uk)
- **Frontend**: Language selected in onboarding, stored in Zustand `language-store`
- **Backend**: Accept `Accept-Language` header or `language` query param
- **Database**: `serbia_products` table normalized - brands, products by market
- **Key**: Always include language in API calls; test with different locales

## Deployment & Environment Context

**Three environments**: local (dev), staging (docs/DEPLOYMENT_STAGING.md), production

**Critical Env Vars**:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_HOST` / `REDIS_PORT` - caching
- `AI_SERVICE_URL` - Backend → AI Service endpoint
- `JWT_SECRET` - Auth token signing (rotate in production)
- `CORS_ORIGIN` - Security: restrict in production

**Monitoring Stack**: Prometheus + Grafana + AlertManager + Loki (setup in docs/MONITORING_SETUP.md)

## Common Tasks & Quick Refs

**Add new recommendation feature**:
1. Update `RecommendationService.getRecommendations()` orchestration logic
2. Add ML scoring in `ai-service/app/ml/` modules
3. Update `ml_config.json` if parameters needed
4. Write tests in `backend-api/src/__tests__/services/`
5. Update `docs/API_CONTRACTS.md` if API changes

**Debug health profile filtering**:
- Check `contraindication-repository.ts` for filter logic
- Verify `004_serbian_localization.sql` contraindication data loaded
- Test with specific user health profile in Postman/curl

**Update mobile UI**:
- Screens in `mobile-app/app/` (Expo Router)
- Components in `mobile-app/src/components/`
- Forms use React Hook Form + Zod
- Language keys in component - auto-resolved via i18n hook

## References

- **Full Status**: [PROJECT_STATUS_SUMMARY.md](../PROJECT_STATUS_SUMMARY.md)
- **Testing Guide**: [TESTING_QUICK_START.md](../TESTING_QUICK_START.md)
- **API Docs**: [docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md)
- **Architecture**: [docs/PROJECT_ANALYSIS_REPORT.md](../docs/PROJECT_ANALYSIS_REPORT.md)
- **Deployment**: [docs/DEPLOYMENT_STAGING.md](../docs/DEPLOYMENT_STAGING.md)
- **Test Patterns**: [docs/TESTING_INFRASTRUCTURE_COMPLETE.md](../docs/TESTING_INFRASTRUCTURE_COMPLETE.md)

---

**Last Updated**: Week 3 Ready (202 tests passing, 80%+ coverage). See [WEEKS_1_2_FINAL_SUMMARY.md](../WEEKS_1_2_FINAL_SUMMARY.md) for full project metrics.
