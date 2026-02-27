# Holonet (SkyForge)

**DevOps-First API Client** & **AI Agent Interface**

A next-generation development platform combining **Postman** (API Client), **Lens** (K8s IDE), and **MCP** (AI Interface).

---

## 📋 Prerequisites (필수 요구사항)

Before you start, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher
- **Docker**: For running the local PostgreSQL database
- **Kubernetes Config**: `~/.kube/config` (if using Cluster features)

---

## 🚀 Installation & Setup (설치 및 실행)

### 1. Install Dependencies
Install all dependencies using `pnpm`.

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Database Setup (Docker)
Start the PostgreSQL database container using Docker Compose.

```bash
docker-compose up -d
```

Initialize the database schema:

```bash
pnpm db:migrate
```

### 3. Run the App
Start both the Backend Server (Fastify) and Client (Electron) with a single command.

```bash
pnpm dev
```

---

## 🛠️ Development Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run both Server and Client concurrently |
| `pnpm dev:client` | Run only the Electron Client |
| `pnpm dev:server` | Run only the Fastify Server |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm db:studio` | Open Prisma Studio (DB GUI) |

---

## 📁 Project Structure

```text
holonet/
├── apps/
│   ├── client/          # [Electron] React Frontend + Main Process
│   └── server/          # [Fastify] Sync Server + Database
├── packages/
│   └── shared/          # Shared Types & DTOs
├── docs/                # Documentation & Planning
└── docker-compose.yml   # Local DB Configuration
```

## 📖 Documentation

- **[PRD & Specs](./docs/planning/)**: Detailed feature specifications.
- **[UI/UX Spec](./docs/planning/UI_UX_SPEC.md)**: Design philosophy and layout.

---

## 🤖 For AI Agents (MCP)

This project supports **Model Context Protocol (MCP)**.
- **Resources:** `holonet://collections`
- **Tools:** `execute_k8s_request`

Connect your AI agent (Cursor, Claude Desktop) to the running Holonet instance to enable automated infrastructure control.
