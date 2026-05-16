# 🍿 Urban Snacks Server (E-Commerce API)

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-Session-7C3AED)](https://better-auth.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com/)
[![SSLCommerz](https://img.shields.io/badge/SSLCommerz-Gateway-FF6B00)](https://www.sslcommerz.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-RAG%20%2F%20LLM-6366F1)](https://openrouter.ai/)
[![pgvector](https://img.shields.io/badge/pgvector-Vector%20Search-336791)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?logo=redis)](https://redis.io/)

The backend engine of **Urban Snacks** — a premium Bangladeshi snacks ordering platform. This server handles secure authentication (including Google OAuth), full order lifecycle management with multi-gateway payments (Stripe + SSLCommerz), coupon & discount systems, dynamic banner management, granular role-based access control, and an **AI-powered RAG (Retrieval-Augmented Generation) system** for intelligent product discovery and natural-language Q&A over the snack catalog.

---

## Frontend

[Frontend Repository](https://github.com/sayed725/urban_snacks_client)

## 📖 Table of Contents

1. [Technical Core](#-technical-core)
2. [Database Architecture](#️-database-architecture)
3. [Modular System Design](#️-modular-system-design)
4. [Security & Authentication](#-security--authentication)
5. [Payment Infrastructure](#-payment-infrastructure)
6. [RAG & AI Architecture](#-rag--ai-architecture)
7. [Key API Modules](#-key-api-modules)
8. [Setup & Deployment](#️-setup--deployment)

---

## 🚀 Technical Core

- **Runtime**: Node.js 20+ with ES Modules (`"type": "module"`).
- **Engine**: Express 5 (Next Generation) for high-performance routing and native async error propagation.
- **ORM**: Prisma 7 with `@prisma/adapter-pg` for native PostgreSQL driver compatibility and multi-file schema support.
- **Authentication**: Better Auth with session-based flows, email/password, and Google OAuth 2.0.
- **Payments**: Dual payment gateway architecture — **Stripe** (international) + **SSLCommerz** (local Bangladesh).
- **AI / RAG**: Retrieval-Augmented Generation pipeline via **OpenRouter** (embeddings + LLM) with **pgvector** for cosine-similarity vector search.
- **Caching**: **Redis** for RAG query response caching with configurable TTL.
- **Validation**: Zod 4 for runtime schema validation on all incoming request payloads.
- **Error Handling**: Centralized global error handler, async wrapper, request logger, and a 404 not-found middleware for clean, boilerplate-free controllers.
- **Build**: `tsup` for optimized TypeScript compilation + `tsx` for lightning-fast dev watch mode.

---

## 🗄️ Database Architecture

The system uses a relational PostgreSQL schema with **multi-file Prisma organization** — each domain entity lives in its own `.prisma` file for maximum clarity.

### Entities & Relationships

- **Users**: Extended with custom roles (`USER`, `ADMIN`) and status (`ACTIVE`, `INACTIVE`, `BANNED`). Supports soft-delete.
- **Items**: Product catalog with multi-image galleries, weight, pack size, spicy flags, featured status, and category linkage.
- **Categories**: Taxonomy model for classifying snack items, with featured flags and optional images.
- **Orders**: Full lifecycle tracking (`PLACED → PROCESSING → SHIPPED → DELIVERED` or `CANCELLED`) with delivery charges, discount logic, and coupon association.
- **OrderItems**: Junction table linking orders to items with unit pricing and quantity.
- **Payments**: Records transaction data for Stripe and SSLCommerz, including gateway metadata and invoice URLs.
- **Reviews**: Order-locked entities validated by a unique `[orderId, customerId]` constraint — one review per order.
- **Coupons**: Promotional codes with fixed/percentage discounts, minimum order thresholds, usage limits, and expiry dates.
- **Banners**: Dynamic hero slider content with ordering, category linking, and admin toggle.
- **DocumentEmbeddings**: Vector store for RAG — stores chunked text content with 2048-dimension `pgvector` embeddings, source metadata, and soft-delete support. Uses a unique `chunkKey` for upsert-based re-indexing.

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--o{ SESSION : manages
    USER ||--o{ ACCOUNT : "linked to"
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : "paid via"
    ORDER ||--o{ REVIEW : "reviewed by"
    ORDER }o--o| COUPON : "discounted by"
    ORDER_ITEM }o--|| ITEM : references
    ITEM }o--|| CATEGORY : "belongs to"
    ITEM ||--o{ DOCUMENT_EMBEDDING : "indexed as"
    CATEGORY ||--o{ DOCUMENT_EMBEDDING : "indexed as"
```

### Enumerations

| Enum | Values |
|------|--------|
| `UserRole` | `USER`, `ADMIN` |
| `UserStatus` | `ACTIVE`, `INACTIVE`, `BANNED` |
| `OrderStatus` | `PLACED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `PaymentStatus` | `PAID`, `UNPAID` |
| `DiscountType` | `FIXED`, `PERCENTAGE` |

### Schema Files

| File | Entities |
|------|----------|
| `auth.prisma` | `User`, `Session`, `Account`, `Verification` |
| `snack.prisma` | `Category`, `Item` |
| `order.prisma` | `Order`, `OrderItem`, `Payment`, `Coupon` |
| `review.prisma` | `Review` |
| `banner.prisma` | `Banner` |
| `rag.prisma` | `DocumentEmbedding` (pgvector-backed vector store) |

---

## 🛠️ Modular System Design

The codebase follows a **Module-Based Pattern** (Domain-Driven) to enforce clear separation of concerns. Each module contains its own route, controller, service, types, and constants:

```text
src/
├── config/             # Environment variable validation & app config
├── constants/          # Global enums and magic values
├── generated/          # Prisma-generated client & enum exports
├── interfaces/         # Shared TypeScript interfaces
├── lib/                # Auth SDK, Prisma client, Redis singleton
├── middlewares/        # Auth RBAC guard, async handler, logger, error handler, 404
├── modules/            # Core Business Logic (Domain Driven)
│   ├── banner/         # Dynamic hero slider management
│   ├── category/       # Snack category taxonomy
│   ├── coupon/         # Promotional code engine
│   ├── item/           # Product catalog CRUD
│   ├── order/          # Order lifecycle (create, cancel, status flow)
│   ├── payment/        # Stripe + SSLCommerz gateway handlers
│   ├── rag/            # RAG pipeline (embedding, indexing, LLM, query)
│   ├── review/         # Customer feedback & ratings
│   ├── stats/          # Admin analytics & dashboard KPIs
│   └── user/           # User management & status control
├── routes/             # Centralized route index
├── types/              # Express request augmentations
├── utils/              # Shared utility functions
├── app.ts              # Express app setup (CORS, auth, routes, error handling)
└── server.ts           # Entry point (port binding)
```

### Module Internal Pattern

Each module follows a consistent 4-file structure:

```text
module/
├── module.route.ts       # Express router with auth guards
├── module.controller.ts  # Request parsing & response formatting
├── module.service.ts     # Core business logic & Prisma queries
└── module.type.ts        # Module-specific TypeScript types
```

> **Note:** The `rag/` module extends this pattern with additional service files — `embedding.service.ts`, `indexing.service.ts`, and `llm.service.ts` — to cleanly separate the embedding generation, data indexing, and LLM orchestration concerns.

---

## 🔐 Security & Authentication

- **Better Auth**: Enterprise-grade session management with email/password and **Google OAuth 2.0** social login.
- **RBAC Middleware**: A `requireAuth(UserRole.ADMIN, UserRole.USER, ...)` middleware enforces role-based route-level protection. Routes are guarded at the handler level — unauthorized requests are rejected before any business logic executes.
- **Soft Delete**: All critical entities (Users, Items, Orders, Payments, Categories, Coupons) implement soft-delete with `isDeleted` + `deletedAt` columns for full auditability.
- **Vercel Proxy Trust**: `app.set("trust proxy", 1)` ensures secure cookie forwarding in serverless deployments.
- **CORS Guard**: Only configured origins (`APP_ORIGIN` + `PROD_APP_ORIGIN`) are permitted to make credentialed cross-origin requests.
- **Webhook Security**: Stripe webhooks are validated with raw body parsing on a dedicated `/webhook` endpoint registered before any JSON middleware.

---

## 💳 Payment Infrastructure

Urban Snacks supports a **dual payment gateway** architecture to serve both local and international customers:

### Stripe (International)

- **Checkout Sessions**: Server-generated Stripe Checkout sessions redirect users to Stripe-hosted payment pages.
- **Webhooks**: A `/webhook` endpoint listens for `checkout.session.completed` events to automatically mark orders as paid and record transaction IDs.

### SSLCommerz (Local — Bangladesh)

- **Session Initiation**: Generates SSLCommerz payment sessions with order metadata.
- **IPN Callbacks**: Handles `/ssl-success`, `/ssl-fail`, and `/ssl-cancel` endpoints for payment status resolution.

### Additional Payment Flows

- **Cash on Delivery (COD)**: Orders placed without online payment, tracked as `UNPAID` until manual confirmation.
- **Manual Orders**: Admin-created orders with a direct `PAID`/`UNPAID` status toggle.

---

## 🤖 RAG & AI Architecture

Urban Snacks features a full **Retrieval-Augmented Generation (RAG)** pipeline that enables AI-powered natural-language search and Q&A over the product catalog.

### How It Works

```mermaid
flowchart LR
    A["User Query"] --> B["Embedding Service"]
    B -->|"Generate query vector"| C["pgvector Similarity Search"]
    C -->|"Top-K relevant documents"| D["LLM Service"]
    D -->|"Context-augmented prompt"| E["AI-Generated Answer"]
    E --> F["Redis Cache (30 min TTL)"]
```

### Components

| Service | Responsibility |
|---------|----------------|
| **EmbeddingService** | Generates 2048-dimension vector embeddings via OpenRouter (`nvidia/llama-nemotron-embed-vl-1b-v2:free` by default). |
| **IndexingService** | Ingests Items and Categories from the database, converts them into rich text chunks, generates embeddings, and upserts them into the `document_embeddings` table using `ON CONFLICT` for idempotent re-indexing. |
| **LLMService** | Sends context-augmented prompts to an OpenRouter LLM (`nvidia/nemotron-3-super-120b-a12b:free` by default) with support for both plain-text and structured JSON responses. |
| **RAGService** | Orchestrates the full pipeline — retrieves relevant documents via cosine similarity (`1 - (embedding <=> query_vector)`), passes them as context to the LLM, and returns the answer with source attribution. |
| **Redis Cache** | Caches RAG query results with a 30-minute TTL to reduce redundant API calls. Cache keys are derived from the query text, limit, and source type. |

### Vector Storage

- **Engine**: PostgreSQL `pgvector` extension with `vector(2048)` columns.
- **Similarity Metric**: Cosine distance (`<=>` operator).
- **Indexing Strategy**: Unique `chunkKey` per document chunk enables upsert-based re-indexing without duplicates.
- **Source Types**: `ITEM` and `CATEGORY` — filterable at query time.

### RAG Module Structure

```text
modules/rag/
├── embedding.service.ts   # Vector embedding generation (OpenRouter API)
├── indexing.service.ts    # Data ingestion & chunk upsert into pgvector
├── llm.service.ts         # LLM prompt construction & response generation
├── rag.controller.ts      # Request handling with Redis cache layer
├── rag.route.ts           # Express router for RAG endpoints
└── rag.service.ts         # Pipeline orchestrator (retrieve → augment → generate)
```

---

## 📡 Key API Modules

> Base path for all custom routes: `/api/v1`
> Auth routes managed by Better Auth: `/api/auth/*`

### 🍿 Item Management

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/items` | Public | Browse all snack items (with pagination & filters) |
| `GET` | `/items/:id` | Public | Get a single item with full details |
| `POST` | `/items` | Admin | Add a new snack product |
| `PATCH` | `/items/:id` | Admin | Update item details, images, pricing |
| `DELETE` | `/items/:id` | Admin | Soft-delete an item |

### 📦 Order Management

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/orders` | User, Admin | Place a new order |
| `GET` | `/orders/all` | Admin | List all platform orders |
| `GET` | `/orders/my-orders` | User, Admin | Current user's order history |
| `GET` | `/orders/:orderId` | Authenticated | Get a single order with items |
| `PATCH` | `/orders/cancel/:orderId` | User, Admin | Cancel a pending order |
| `PATCH` | `/orders/change-status/:orderId` | Admin | Advance order through status flow |
| `PATCH` | `/orders/update-payment-method/:orderId` | User, Admin | Switch payment method |
| `DELETE` | `/orders/:orderId` | Admin | Soft-delete an order |

### 💳 Payment Processing

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/payments/create-checkout-session/:orderId` | User, Admin | Generate Stripe checkout session |
| `POST` | `/payments/initiate-ssl/:orderId` | User, Admin | Initiate SSLCommerz payment |
| `POST` | `/payments/ssl-success` | Public (IPN) | SSLCommerz success callback |
| `POST` | `/payments/ssl-fail` | Public (IPN) | SSLCommerz failure callback |
| `POST` | `/payments/ssl-cancel` | Public (IPN) | SSLCommerz cancellation callback |
| `GET` | `/payments/all` | Admin | View all payment records |
| `GET` | `/payments/order/:orderId` | User, Admin | Get payment by order |

### 🗂️ Categories

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/categories` | Public | List all snack categories |
| `POST` | `/categories` | Admin | Create a new category |
| `PATCH` | `/categories/:id` | Admin | Update a category |
| `DELETE` | `/categories/:id` | Admin | Delete a category |

### ⭐ Reviews

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/reviews` | Public | Retrieve all approved reviews |
| `GET` | `/reviews/:id` | Public | Get a single review |
| `POST` | `/reviews` | Authenticated | Submit a post-order review |
| `PATCH` | `/reviews/:id` | Authenticated | Update own review |
| `PATCH` | `/reviews/:id/status` | Admin | Approve or reject a review |
| `DELETE` | `/reviews/:id` | Authenticated | Delete own review |

### 🎟️ Coupons

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/coupons/verify/:code` | User, Admin | Validate and calculate coupon discount |
| `POST` | `/coupons` | Admin | Create a new coupon |
| `GET` | `/coupons` | Admin | List all coupons |
| `GET` | `/coupons/:id` | Admin | Get coupon details |
| `PATCH` | `/coupons/:id` | Admin | Update a coupon |
| `DELETE` | `/coupons/:id` | Admin | Delete a coupon |

### 🖼️ Banners

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/banners` | Public | Fetch active hero banners |
| `POST` | `/banners` | Admin | Create a new banner |
| `GET` | `/banners/:id` | Admin | Get a single banner |
| `PATCH` | `/banners/:id` | Admin | Update banner content |
| `DELETE` | `/banners/:id` | Admin | Remove a banner |

### 👤 User Management

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/users` | Admin | View all platform users |
| `PATCH` | `/users/status/:id` | Admin | Ban, activate, or deactivate accounts |

### 📊 Analytics

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/stats/admin` | Admin | Dashboard KPIs — revenue, orders, users, 30-day performance |

### 🤖 RAG (AI-Powered Q&A)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/rag/query` | Public | Ask a natural-language question about snacks — returns an AI-generated answer with source documents |
| `POST` | `/rag/ingest-items` | Admin | Index all active items into the vector store |
| `POST` | `/rag/ingest-categories` | Admin | Index all active categories into the vector store |
| `GET` | `/rag/stats` | Public | Get vector store statistics (total documents, source type breakdown) |

---

## ⚙️ Advanced Query Engine

The server includes a powerful, reusable `QueryBuilder` class that provides:

- 🔍 **Full-Text Search**: Case-insensitive search across configurable fields, including nested relations.
- 🎛️ **Dynamic Filtering**: Supports flat fields, dot-notation relation fields (`category.name`), range operators (`gt`, `gte`, `lt`, `lte`), and boolean/number auto-parsing.
- 📄 **Pagination**: Configurable `page` and `limit` with automatic `totalPage` calculation.
- 🔃 **Sorting**: Multi-level sorting support including nested relation fields (`category.name`).
- 📌 **Field Selection**: Comma-separated field projection (`?fields=name,price`).
- 🔗 **Relation Includes**: Dynamic relation loading with `hasMany`/`hasOne` awareness.
- 🚫 **Omit Fields**: Exclude sensitive fields from responses.

```typescript
// Example usage
const result = await new QueryBuilder(prisma.item, req.query, {
  searchableFields: ["name", "category.name"],
  filterableFields: ["categoryId", "isActive", "isFeatured"],
})
  .search()
  .filter()
  .where({ isDeleted: false })
  .include({ category: true })
  .sort()
  .paginate()
  .execute();
```

---

## 🛠️ Setup & Deployment

### Prerequisites

- **Node.js** v20+
- **pnpm** (recommended) or npm
- A PostgreSQL database with **pgvector** extension enabled (e.g., [Neon](https://neon.tech) — pgvector is enabled by default)
- **Redis** instance (e.g., [Upstash](https://upstash.com), [Redis Cloud](https://redis.com/cloud/), or local)
- Stripe account for payment processing
- SSLCommerz sandbox/live credentials
- [OpenRouter](https://openrouter.ai/) API key for RAG embeddings & LLM

### Environment Configuration

Create a `.env` file using the template below:

```env
# Server
NODE_ENV=development
PORT=5001

# Frontend Origins
APP_ORIGIN="http://localhost:3000"
PROD_APP_ORIGIN="https://your-production-domain.com"

# Database
DATABASE_URL="your_postgresql_connection_string"

# Better Auth
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:5001"

# Admin Seed Credentials
APP_ADMIN="Admin"
APP_ADMIN_EMAIL="admin@example.com"
APP_ADMIN_PASS="secure_password"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# SSLCommerz
SSL_STORE_ID="your_store_id"
SSL_STORE_PASSWD="your_store_password"
SSL_IS_SANDBOX=true

# Redis (provide REDIS_URL or individual host/port/password)
REDIS_URL="redis://localhost:6379"
# REDIS_HOST="localhost"
# REDIS_PORT="6379"
# REDIS_PASSWORD=""

# OpenRouter (RAG & AI)
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_EMBEDDING_MODEL="nvidia/llama-nemotron-embed-vl-1b-v2:free"
OPENROUTER_LLM_MODEL="nvidia/nemotron-3-super-120b-a12b:free"
```

### Quick Commands

```bash
npm install              # Install dependencies
npx prisma generate       # Generate Prisma Client from multi-file schema
npx prisma migrate dev    # Apply DB migrations in development
npm run admin:seed       # Seed the initial system administrator
npm run dev              # Start dev server with tsx watch mode
npm run build            # Generate client + compile with tsup (production)

# Stripe local webhook forwarding
npm run stripe:webhook   # stripe listen --forward-to localhost:5001/webhook
```

### Deployment (Vercel)

The project is configured for serverless deployment on Vercel:

- `trust proxy` is pre-configured for secure session cookies behind Vercel's edge network.
- Multi-origin CORS support for staging and production frontends.
- `postinstall` script automatically generates the Prisma client on deploy.

---

**Built for scalability, security, and the love of snacks. 🍿**
