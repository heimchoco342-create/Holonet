**Holonet (홀로넷)** 프로젝트의 최종 확정된 통합 PRD입니다.
이 문서는 **"DevOps-First API Client"**이자 **"AI Agent Interface"**를 겸하는 Holonet의 모든 기획 사항과 기술적 구조(디렉토리 포함)를 포함합니다.

---

# [PRD] Holonet: The Galactic Network & Droid Interface

| 문서 정보 | 내용 |
| --- | --- |
| **Project Name** | **Holonet (홀로넷)** |
| **Version** | v1.0.0 (Final Release) |
| **Type** | Desktop Application (Electron) + Sync Server |
| **Core Concept** | Postman + Lens + MCP (AI Interface) |
| **Repository** | Monorepo (pnpm workspace) |

---

## 1. Executive Summary (개요)

**Holonet**은 팀 단위 API 협업과 Kubernetes 인프라 접근을 통합한 **차세대 개발 플랫폼**입니다.
인간 개발자에게는 **"클릭 한 번으로 K8s 내부망 터널링"**을 제공하고, AI 에이전트(Cursor, Claude)에게는 **"사내 인프라와 통신할 수 있는 표준 프로토콜(MCP)"**을 제공하여, **"AI가 코드를 짜고, 테스트까지 수행하는"** 완전한 자동화 워크플로우를 실현합니다.

---

## 2. System Architecture (시스템 아키텍처)

### 2.1. Interfaces

1. **Human Interface (GUI):** Electron 기반 데스크탑 앱. 개발자가 직접 조작.
2. **Droid Interface (MCP):** AI 에이전트가 `Stdio`로 접속하는 서버.

### 2.2. Data Flow

* **Traffic:** `Localhost` -> `Electron Main Process` -> `K8s Tunnel` -> `Target Pod` (서버 경유 X, 로컬 직접 연결).
* **Sync:** `Electron` <-> `Sync Server` <-> `PostgreSQL` (API 명세 데이터 동기화).

---

## 3. Tech Stack (기술 스택)

| 영역 | 구분 | 기술 스택 | 선정 이유 |
| --- | --- | --- | --- |
| **Client** | **Core** | **Electron** | Node.js 환경 접근(File System, Net) 및 CORS 제약 없는 HTTP 요청. |
|  | **Bundler** | **Vite** | 빠른 빌드 속도 및 HMR 지원. |
|  | **UI** | **React + Tailwind** | Shadcn/UI 기반의 모던 다크모드 인터페이스. |
|  | **K8s** | **@kubernetes/client-node** | `kubectl` 없이 Node.js 레벨에서 포트포워딩 스트림 제어. |
|  | **AI** | **@modelcontextprotocol/sdk** | AI 에이전트와의 표준 통신 규격 준수. |
| **Server** | **Runtime** | **Node.js (Fastify)** | Express 대비 높은 처리량, 낮은 오버헤드. |
|  | **DB** | **PostgreSQL + Prisma** | JSONB 타입을 활용한 유연한 API 명세 저장. |
|  | **Sync** | **Socket.io** | 실시간 데이터 변경 사항 전파. |

---

## 4. Directory Structure (Monorepo)

`pnpm workspace`를 기반으로 Client와 Server를 통합 관리합니다.

```text
holonet/
├── package.json              # Root Configuration
├── pnpm-workspace.yaml       # Workspace definitions
├── docker-compose.yml        # Local DB (Postgres)
│
├── apps/
│   ├── client/               # [Electron App] The Interface
│   │   ├── src/
│   │   │   ├── main/         # [Main Process]
│   │   │   │   ├── k8s/      # [The Bridge] Tunneling Engine
│   │   │   │   └── mcp/      # [The Droid] MCP Server Logic
│   │   │   ├── preload/      # IPC Bridge
│   │   │   └── renderer/     # [React UI]
│   │   └── electron.vite.config.ts
│   │
│   └── server/               # [Sync Server] The Archives
│       ├── prisma/           # Database Schema
│       ├── src/
│       │   ├── modules/      # Feature logic (Workspace, Collection...)
│       │   ├── events/       # Socket.io handlers
│       │   └── plugins/      # Fastify plugins
│       └── Dockerfile
│
└── packages/
    └── shared/               # Shared Types (DTOs)

```

---

## 5. Core Features (핵심 기능)

### 5.1. The Bridge (K8s Integration)

* **Context Auto-Discovery:** `~/.kube/config` 자동 스캔 및 Context 목록화.
* **Smart Tunneling:**
* 요청 시 `Service Name`, `Namespace`, `Port`가 감지되면 백그라운드 포트포워딩 시작.
* 요청 URL을 `localhost:{random_port}`로 자동 치환하여 발송.


* **Zero-Config:** 개발자는 인프라 설정 없이 "Send" 버튼만 누르면 됨.

### 5.2. The Archives (API Management)

* **Postman Import:** 기존 `.json` 컬렉션(v2.1) 드래그 앤 드롭 마이그레이션.
* **Real-time Sync:** 팀원이 수정한 API 명세가 내 화면에도 즉시 반영.
* **Environment Variables:** 팀 공유 변수(DB)와 로컬 전용 변수(Local Storage) 분리.

### 5.3. The Droid Protocol (MCP Support)

AI 에이전트(Cursor, Windsurf 등)를 위한 전용 인터페이스입니다.

#### **A. Resources (AI Read-Only)**

* `holonet://collections`: 팀 전체 API 리스트 조회.
* `holonet://collections/{id}/openapi`: 특정 서비스 명세를 OpenAPI 포맷으로 변환 제공.
* *Use Case:* AI가 "주문 API 명세 줘"라고 하면 Holonet이 스키마를 던져줌.



#### **B. Tools (AI Action)**

* `execute_k8s_request`:
* Input: `service`, `namespace`, `path`, `method`, `body`.
* Action: Holonet이 터널을 뚫고 요청을 대리 수행 후 결과 반환.
* *Use Case:* AI가 "작성한 코드 테스트해봐"라고 하면 Holonet이 실제 K8s망에 요청을 쏨.



---

## 6. Database Schema (Prisma)

```prisma
// apps/server/prisma/schema.prisma

model Workspace {
  id        String   @id @default(uuid())
  name      String
  items     Item[]
  createdAt DateTime @default(now())
}

model Item {
  id           String  @id @default(uuid())
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  parentId     String?
  parent       Item?   @relation("FolderTree", fields: [parentId], references: [id])
  children     Item[]  @relation("FolderTree")
  
  type         String  // 'FOLDER' | 'REQUEST'
  name         String
  sortOrder    Int     @default(0)

  // Request Data
  method       String?
  url          String?
  headers      Json?
  body         Json?

  // The Bridge Config (K8s Tunnel)
  k8sService   String?
  k8sNamespace String? @default("default")
  k8sPort      Int?
}

model Environment {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  variables   Json
}

```

---

## 7. Roadmap (개발 로드맵)

### Phase 1: Foundation (The Base)

* [Server] Fastify + Prisma 기본 CRUD 및 소켓 서버 구축.
* [Client] Electron + React 보일러플레이트.
* [Client] Postman Import 파서 구현.

### Phase 2: Connection (The Bridge)

* [Client] `~/.kube/config` 파싱 로직 (Main Process).
* [Client] `@kubernetes/client-node` 포트포워딩 엔진 구현.
* [Client] Axios 요청 인터셉터(Interceptor)에 터널링 로직 주입.

### Phase 3: Intelligence (The Droid)

* [Client] MCP SDK 연동 및 서버 임베딩.
* [Client] `holonet://` 리소스 프로바이더 구현.
* [Client] `execute_tool` 핸들러 구현.

---

이 문서는 개발팀이 즉시 구현에 착수할 수 있는 **마스터플랜**입니다.
이제 **`npm init`** 하러 가시죠. May the Force be with your code.