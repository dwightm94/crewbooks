# CrewBooks
### The Dead-Simple Business App for Small Construction Subcontractors

**Stack:** Next.js 14 PWA + AWS Serverless (Lambda, DynamoDB, Cognito, S3, API Gateway)

---

## Project Structure

```
crewbooks/
├── backend/
│   ├── lambda/           # Lambda function handlers
│   │   ├── auth/         # Post-confirmation trigger
│   │   ├── jobs/         # CRUD for jobs
│   │   ├── expenses/     # CRUD for expenses
│   │   ├── invoices/     # Create, send, mark paid
│   │   ├── dashboard/    # Aggregated summary data
│   │   └── photos/       # S3 presigned URL generation
│   ├── lib/              # Shared utilities (DynamoDB client, response helpers)
│   ├── config/           # Environment config
│   └── template.yaml     # AWS SAM template (infrastructure as code)
│
├── frontend/
│   ├── app/              # Next.js 14 App Router pages
│   │   ├── dashboard/    # "Who Owes Me Money" main screen
│   │   ├── jobs/         # Job list + detail
│   │   ├── expenses/     # Expense tracking
│   │   ├── invoices/     # Invoice management
│   │   ├── settings/     # Profile & preferences
│   │   ├── login/        # Auth pages
│   │   └── signup/
│   ├── components/       # Reusable React components
│   │   ├── ui/           # Buttons, cards, inputs, modals
│   │   ├── layout/       # Shell, nav, header
│   │   ├── jobs/         # Job-specific components
│   │   ├── expenses/     # Expense-specific components
│   │   ├── invoices/     # Invoice-specific components
│   │   └── dashboard/    # Dashboard widgets
│   ├── lib/              # API client, auth helpers, utils
│   ├── public/           # Static assets, PWA manifest, icons
│   └── styles/           # Global CSS, Tailwind config
│
└── README.md
```

## Phase 1 Features (MVP)
- [x] User registration & login (Cognito)
- [x] Create/edit/list jobs with status tracking
- [x] "Who Owes Me Money" dashboard
- [x] Expense tracking per job with receipt photos
- [x] Invoice generation & sending
- [x] Payment reminder automation
- [x] Job profitability tracking (bid vs actual)

## Quick Start

### Backend
```bash
cd backend
sam build
sam deploy --guided
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## DynamoDB Tables
- **Users** — User profiles and settings
- **Jobs** — Job tracking with status pipeline
- **Expenses** — Per-job expense tracking
- **Invoices** — Invoice generation and payment tracking
