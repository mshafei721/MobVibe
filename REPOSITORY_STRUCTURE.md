# MobVibe Repository Structure

**Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Cleaned & Organized

## Overview

MobVibe is a React Native mobile application built with Expo that enables AI-powered coding sessions using Claude AI, E2B sandboxes, and Supabase backend. This document defines the canonical repository structure and organization conventions.

## Directory Structure

```
MobVibe/
├── .docs/                      # Claude-generated analysis & design documentation
│   ├── *.md                    # Architecture, analysis, recommendations
│   ├── ui/                     # UI framework integration plans
│   └── vibecode/               # VibeCode design assets (gitignored)
│
├── .github/                    # GitHub CI/CD workflows
│   └── workflows/
│       └── security-scan.yml   # Automated security scanning
│
├── app/                        # React Native screens (Expo Router)
│   ├── (auth)/                 # Authentication screens
│   ├── (tabs)/                 # Tab-based navigation screens
│   ├── _layout.tsx             # Root layout
│   └── index.tsx               # Entry point
│
├── assets/                     # Static assets
│   └── (fonts, images added as needed)
│
├── backend/                    # Backend services
│   ├── shared/                 # Shared constants & types
│   │   └── constants/          # Backend constants
│   └── worker/                 # E2B worker service
│       ├── dist/               # Build output (gitignored)
│       ├── node_modules/       # Dependencies (gitignored)
│       ├── sandbox/            # Sandbox templates
│       ├── src/                # TypeScript source
│       │   ├── agent/          # Claude agent integration
│       │   ├── errors/         # Error handling
│       │   ├── preview/        # Code preview generation
│       │   ├── sandbox/        # Sandbox lifecycle management
│       │   ├── services/       # Business logic services
│       │   └── utils/          # Utility functions
│       ├── .env.example        # Environment template
│       ├── Dockerfile          # Container definition
│       ├── docker-compose.yml  # Local development
│       ├── package.json        # Node dependencies
│       └── tsconfig.json       # TypeScript configuration
│
├── components/                 # React Native UI components
│   ├── ui/                     # Gluestack UI components
│   └── *.tsx                   # Custom components
│
├── constants/                  # Application-wide constants
│   └── *.ts                    # Color schemes, configs, etc.
│
├── docs/                       # Project documentation
│   ├── backend/                # Backend feature documentation
│   │   ├── CODE_VIEWER.md      # Code viewer implementation
│   │   ├── E2E_TESTING.md      # End-to-end testing guide
│   │   ├── ERROR_HANDLING.md   # Error handling patterns
│   │   ├── PERFORMANCE.md      # Performance optimization
│   │   ├── SECURITY_AUDIT.md   # Security audit guide
│   │   └── *.md                # Other feature docs
│   │
│   ├── context/                # Context documentation
│   │   └── phase1/             # Phase 1 context files
│   │
│   ├── phases/                 # Phase planning & completion
│   │   ├── phase 0.5/          # UI framework integration
│   │   ├── phase1/             # Development phases 14-34
│   │   │   ├── 14-worker-service.md
│   │   │   ├── 15-COMPLETE.md  # Completion markers
│   │   │   └── ...             # Through phase 33
│   │   ├── phase2/             # Future phases
│   │   └── links-map.md        # Phase dependency tracking
│   │
│   ├── research/               # Research notes & findings
│   │   ├── 01-08/              # Phase 0.5 research
│   │   └── phase1/             # Phase 1 research
│   │
│   ├── sequencing/             # Development sequencing
│   │   └── phase1/             # Phase 1 sequencing docs
│   │
│   └── ui/                     # UI documentation
│       └── *.md                # UI-specific docs
│
├── e2e/                        # End-to-end tests
│   ├── helpers/                # Test utilities
│   ├── *.test.ts               # E2E test suites
│   ├── config.json             # Test configuration
│   └── setup.ts                # Test setup
│
├── reports/                    # Audit & analysis reports
│   └── ui/                     # UI audit reports
│       ├── *.json              # Performance, bundle, a11y data
│       └── *.md                # Audit documentation
│
├── scripts/                    # Utility scripts
│   └── security/               # Security scanning scripts
│       ├── scan-secrets.sh     # Secret scanning
│       └── validate-env.ts     # Environment validation
│
├── security-tests/             # Security test suites
│   └── owasp-compliance.test.ts # OWASP Top 10 tests
│
├── services/                   # Application services
│   ├── anthropic.ts            # Claude API integration
│   ├── e2b.ts                  # E2B sandbox service
│   └── supabase.ts             # Supabase client
│
├── src/                        # Additional source code
│   ├── __tests__/              # Co-located tests
│   │   └── security/           # Security tests
│   ├── hooks/                  # React hooks
│   ├── services/               # Service implementations
│   └── utils/                  # Utility functions
│
├── store/                      # State management
│   └── *.ts                    # Zustand stores
│
├── supabase/                   # Supabase backend
│   ├── functions/              # Edge functions
│   │   ├── generate-icons/     # Icon generation
│   │   ├── get-file-content/   # File retrieval
│   │   ├── get-session-files/  # Session file listing
│   │   └── speech-to-text/     # Voice input
│   ├── migrations/             # Database migrations
│   │   └── *.sql               # Sequential migrations
│   └── tests/                  # Database tests
│       └── rls-tests.sql       # RLS policy tests
│
├── tests/                      # Unit & integration tests
│   ├── backend/                # Backend tests
│   │   └── job-queue.test.ts   # Job queue tests
│   ├── database/               # Database tests
│   │   ├── profiles.test.ts
│   │   ├── projects.test.ts
│   │   ├── rls.test.ts
│   │   └── sessions.test.ts
│   └── integration/            # Integration tests
│       └── edge-functions.test.ts
│
├── utils/                      # Shared utility functions
│   └── *.ts                    # Helper utilities
│
├── .detoxrc.js                 # Detox E2E config
├── .gitignore                  # Git ignore patterns
├── .size-limit.json            # Bundle size limits
├── app.json                    # Expo configuration
├── expo-env.d.ts               # Expo type definitions
├── metro.config.js             # Metro bundler config
├── package.json                # Dependencies
├── README.md                   # Project README
├── REPOSITORY_STRUCTURE.md     # This file
└── tsconfig.json               # TypeScript configuration
```

## Organization Conventions

### Documentation

- **`.docs/`**: Claude-generated technical analysis (architecture, design systems, UX)
- **`docs/`**: Human-maintained project documentation
  - `backend/`: Feature-specific backend docs
  - `phases/`: Development phase planning & completion tracking
  - `research/`: Research findings & decisions
  - `sequencing/`: Development sequence & dependencies
  - `ui/`: UI-specific documentation

### Testing Strategy

```yaml
Unit Tests:
  Location: tests/
  Pattern: *.test.ts
  Coverage: Database, backend services

Integration Tests:
  Location: tests/integration/
  Pattern: *.test.ts
  Coverage: Edge functions, service interactions

Security Tests:
  Location 1: security-tests/
  Location 2: src/__tests__/security/
  Pattern: *.test.ts
  Coverage: OWASP compliance, RLS enforcement

E2E Tests:
  Location: e2e/
  Pattern: *.test.ts
  Framework: Detox
  Coverage: User flows, authentication, sessions

Database Tests:
  Location: supabase/tests/
  Pattern: *.sql
  Framework: pgTAP
  Coverage: RLS policies, migrations
```

### Backend Structure

The backend is split into:
1. **Worker Service** (`backend/worker/`): Standalone Node.js service for E2B sandbox orchestration
2. **Edge Functions** (`supabase/functions/`): Serverless functions for specific operations
3. **Shared Constants** (`backend/shared/`): Shared types & constants

### File Naming Conventions

```yaml
Components: PascalCase (UserProfile.tsx)
Services: camelCase (supabase.ts, anthropic.ts)
Utils: camelCase (languageDetection.ts)
Tests: *.test.ts (sessions.test.ts)
Configs: kebab-case (.detoxrc.js, metro.config.js)
Docs: SCREAMING_SNAKE_CASE.md or kebab-case.md
```

### Git Ignore Patterns

**Ignored:**
- `node_modules/`, `backend/worker/node_modules/`
- `dist/`, `backend/worker/dist/`
- `.env`, `.env.local`, `backend/worker/.env`
- `coverage/`, `.nyc_output/`
- `secrets-report.json`, `audit-report.json`
- `.docs/vibecode/*` (design assets)

**Tracked:**
- All source code (`*.ts`, `*.tsx`)
- Configuration files
- Documentation (`*.md`)
- Tests (`*.test.ts`, `*.sql`)
- Build configurations
- Example files (`.env.example`)

## Development Workflow

### Phase-Based Development

The project follows a phase-based development model:
- **Phase 0.5**: UI framework integration (complete)
- **Phase 1**: Core features (phases 14-33)
  - Each phase has a planning doc (`XX-feature.md`) and completion marker (`XX-COMPLETE.md`)
  - Dependencies tracked in `docs/phases/phase1/links-map.md`
- **Phase 2**: Advanced features (planned)

### Adding New Features

1. Create phase planning doc in `docs/phases/phase1/`
2. Document research in `docs/research/phase1/`
3. Implement backend in `backend/worker/src/`
4. Add edge functions to `supabase/functions/`
5. Create tests in appropriate test directory
6. Document in `docs/backend/`
7. Mark complete with `XX-COMPLETE.md`
8. Update `links-map.md`

### Security-First Approach

All security infrastructure is in place (Phase 33):
- Automated scanning via GitHub Actions
- OWASP Top 10 compliance tests
- RLS policy verification (SQL + TypeScript)
- Secret scanning & environment validation
- Comprehensive security documentation

## Build Artifacts

**Generated (gitignored):**
- `backend/worker/dist/` - Compiled TypeScript
- `coverage/` - Test coverage reports
- `.expo/` - Expo build cache
- `secrets-report.json` - Security scan results

**Committed:**
- `package-lock.json` - Dependency lock file
- `backend/worker/package-lock.json` - Backend dependencies

## Quick Reference

```bash
# Find empty directories
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*"

# List all test files
find . -name "*.test.ts" -not -path "./node_modules/*"

# Count documentation files
find docs -name "*.md" | wc -l

# Check repository cleanliness
git status --short

# Run security scan
bash scripts/security/scan-secrets.sh

# Validate environment
ts-node scripts/security/validate-env.ts
```

## Maintenance

**Regular Tasks:**
- Remove empty directories: `find . -type d -empty -delete`
- Update `.gitignore` when adding new generated artifacts
- Keep `REPOSITORY_STRUCTURE.md` synchronized with actual structure
- Update phase completion markers in `docs/phases/phase1/`
- Clean old build artifacts before major updates

## Version History

| Version | Date       | Changes                           |
|---------|------------|-----------------------------------|
| 1.0     | 2025-11-08 | Initial cleaned repository structure |

---

**Maintained by:** Development Team
**Questions:** Refer to phase documentation in `docs/phases/`
