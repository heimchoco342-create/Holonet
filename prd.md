**Holonet (홀로넷)** 프로젝트의 PRD입니다.
기존의 **인간 개발자(Human)**를 위한 GUI와 **AI 에이전트(Droid)**를 위한 MCP 인터페이스가 공존하는 **하이브리드 플랫폼**으로 정의되었습니다.

---

# [PRD] Holonet: The Galactic Network & Droid Interface

| 문서 정보 | 내용 |
| --- | --- |
| **Project Name** | **Holonet (홀로넷)** |
| **Version** | v1.1.0 (MCP Integrated) |
| **Core Concept** | **DevOps-First API Client** + **AI Agent Interface** |
| **Protocol** | **Model Context Protocol (MCP) Compliant** |
| **Target User** | Backend Dev, DevOps, **AI Agents (Cursor, Claude, Windsurf)** |

---

## 1. Executive Summary (개요)

**Holonet**은 팀 단위 API 협업과 Kubernetes 인프라 접근을 통합한 **차세대 개발 플랫폼**입니다.
Postman의 API 관리 기능과 Lens의 포트포워딩 기능을 하나로 합쳐, 인간 개발자는 물론 **AI 에이전트까지도 사내 인프라와 통신할 수 있는 표준 프로토콜(MCP)**을 제공합니다. 이를 통해 **"AI가 코드를 짜고, 테스트까지 수행하는"** 완전한 자동화 워크플로우를 실현합니다.

---

## 2. System Architecture (시스템 아키텍처)

Holonet은 크게 3가지 인터페이스를 제공합니다.

1. **Human Interface (Electron):** 개발자가 눈으로 보고 클릭하는 GUI.
2. **Droid Interface (MCP Server):** AI 에이전트가 통신하는 Stdio/SSE 인터페이스.
3. **Holonet Core (Node.js):** K8s 터널링, HTTP 요청, 데이터 동기화를 담당하는 핵심 엔진.

```mermaid
graph TD
    subgraph "Local Environment (User PC)"
        AI[AI Agent / IDE] <-->|MCP Protocol| MCP[Holonet MCP Server]
        User[Human Developer] <-->|GUI Interaction| UI[Electron Renderer]
        
        MCP <--> Core[Holonet Core (Main Process)]
        UI <--> Core
        
        Core <-->|Read| Kube[~/.kube/config]
        Core -->|Port-Forward| Tunnel[Localhost Tunnel]
    end

    subgraph "Remote Infrastructure"
        Core <-->|Sync API| Backend[Sync Server]
        Tunnel <-->|Traffic| K8s[Target K8s Cluster]
    end

```

---

## 3. Tech Stack (기술 스택)

### 3.1. Client & MCP Server (Local)

* **Electron (Main Process):** 앱의 본체이자 MCP 서버 호스트.
* **Model Context Protocol SDK:** `@modelcontextprotocol/sdk` (Node.js). AI와의 표준 통신 규격 준수.
* **@kubernetes/client-node:** K8s 제어 및 포트포워딩 엔진.
* **Axios / Got:** HTTP 요청 실행기.

### 3.2. Sync Server (Remote)

* **Fastify + Socket.io:** 실시간 데이터 동기화.
* **PostgreSQL + Prisma:** API 명세 저장소.

---

## 4. Key Features (핵심 기능)

### 4.1. The Bridge (K8s Tunneling Integration)

* **Context Auto-Discovery:** 로컬 `kubeconfig`를 읽어 K8s 클러스터 목록 자동화.
* **Smart Tunneling:** 요청 시점에 백그라운드에서 `kubectl port-forward`를 수행하고, 로컬 포트로 트래픽을 라우팅.
* **Zero-Config:** 개발자와 AI는 복잡한 인프라 설정 없이 `Service Name`만으로 호출 가능.

### 4.2. The Archives (Team API Sync)

* **Centralized DB:** 팀원 간 API 명세, 환경 변수 실시간 동기화.
* **Postman Migration:** 기존 컬렉션(JSON) 100% 호환 Import.

### 4.3. The Droid Protocol (MCP Support) - **New & Critical**

이 프로젝트의 차별점입니다. Holonet은 **MCP 표준 스펙**을 준수하는 서버를 내장합니다.

#### **A. Protocol Compliance (준수 사항)**

* **Transport:** `Stdio` (Standard Input/Output) 기반 통신 지원 (Claude Desktop, Cursor 연동 최적화).
* **Capabilities:** `resources` (읽기), `tools` (실행), `prompts` (템플릿) 기능 구현.

#### **B. Exposed Resources (AI가 읽을 수 있는 정보)**

* `holonet://collections`: 팀이 공유 중인 모든 API 컬렉션 리스트.
* `holonet://collections/{id}/openapi`: 특정 서비스의 API 명세를 OpenAPI(Swagger) 포맷으로 변환하여 제공.
* *AI 활용 예:* "주문 서비스 API 명세 읽어와서 `OrderController` 코드 짜줘."


* `holonet://environments`: 현재 활성화된 환경 변수(Dev/Staging) 값.

#### **C. Exposed Tools (AI가 수행할 수 있는 행동)**

* `execute_saved_request(request_id, environment_name)`:
* DB에 저장된 특정 API를 실행하고 결과(JSON)를 반환.
* **자동 터널링 포함:** 대상이 K8s 서비스라면, Holonet이 터널을 뚫고 결과를 가져다 줌.


* `proxy_curl(method, url, headers, body, k8s_context)`:
* 저장되지 않은 임의의 요청을 특정 K8s 클러스터로 터널링하여 발송.
* *AI 활용 예:* "지금 Dev 클러스터의 `user-service` 헬스 체크 엔드포인트 좀 찔러봐."



---

## 5. Development Roadmap (로드맵)

### Phase 1: Foundation (The Base)

* Electron + React 기반의 기본 API 클라이언트 구축.
* PostgreSQL 기반의 중앙 동기화 서버(BE) 구축.
* Postman Import 기능 구현.

### Phase 2: Connection (The Bridge)

* Electron Main Process에 K8s 포트포워딩 엔진 탑재.
* `~/.kube/config` 파싱 및 Context 스위칭 UI 구현.

### Phase 3: Intelligence (The Droid)

* **MCP SDK 연동:** Electron 앱 실행 시 MCP 서버 사이드카 실행.
* **Resource Provider 구현:** DB 데이터를 AI가 읽기 좋은 포맷(Markdown/JSON)으로 변환 서빙.
* **Tool Provider 구현:** AI의 요청을 받아 K8s 터널링 엔진을 트리거하는 로직 구현.

---

## 6. User Scenario (AI Integration)

**상황:** 개발자가 IDE(Cursor)에서 "결제 실패 버그"를 수정 중.

1. **개발자:** *"@Holonet, 지금 `Payment-Service`의 '결제 승인' API 명세 좀 보여줘."*
2. **Holonet (MCP Resource):** DB에서 최신 명세를 긁어와 AI에게 제공.
3. **AI:** *"명세를 확인했습니다. 코드를 수정했습니다. 이제 테스트해 볼까요?"*
4. **개발자:** *"어, 지금 `Staging` 환경에다가 이 요청으로 테스트해봐."*
5. **AI:** (Holonet의 `execute_saved_request` 툴 호출)
6. **Holonet (Core):**
* `Staging` 클러스터로 포트포워딩 터널 개통.
* 요청 발송 -> 응답 수신.
* 터널 폐쇄.


7. **AI:** *"테스트 성공! 응답 코드는 200 OK입니다."*

---

**Holonet**은 이제 단순한 툴이 아닙니다. **인간과 AI가 함께 쓰는 인프라 OS**입니다.
이 스펙으로 확정하고, **MCP 서버 설정을 포함한 초기 프로젝트 구조(Scaffolding)**를 잡아드릴까요?