# Holonet (SkyForge) UI/UX Design Spec

## 1. Design Philosophy
**"Dual-Core Interface"**
- **Seamless Context Switching:** 개발자는 API 테스트와 인프라 관제를 빈번하게 오갑니다. 탭 전환 한 번으로 맥락을 유지하며 도구를 변경합니다.
- **Dark & Data-Dense:** 불필요한 여백을 줄이고, 정보 밀도를 높인 다크 모드 전용 UI (VS Code, Lens 스타일).
- **Z-Pattern Layout:** `Global Nav` -> `Context Sidebar` -> `Main Workspace` -> `Detail/Terminal`.

---

## 2. Global Layout Structure

화면은 크게 4분할로 구성됩니다.

```text
+-----------------------+-----------------------------------------------+
| [A] Global Nav (Left) |  [C] Tab Bar (Breadcrumbs / Active Tabs)      |
|                       +-----------------------------------------------+
| - Mode Switcher       |                                               |
|   (API / Cluster)     |                                               |
| - Settings            |           [D] Main Workspace Area             |
| - Account             |           (Split View Capable)                |
|                       |                                               |
+-----------------------+                                               |
| [B] Context Sidebar   |                                               |
| - Collection Tree     |                                               |
|   OR                  |                                               |
| - K8s Resource List   |                                               |
+-----------------------+-----------------------------------------------+
| [E] Status Bar / Mini Terminal (Bottom)                               |
+-----------------------------------------------------------------------+
```

### [A] Global Nav (App-Level)
*   **API Mode Icon:** Postman 기능 활성화.
*   **Cluster Mode Icon:** Lens 기능 활성화.
*   **Sync Status:** 서버/로컬 동기화 상태 표시 (🟢 Online / 🟠 Offline).
*   **Settings:** 테마, 단축키, 플러그인 관리. 클릭 시 **Settings Modal** 호출.

---

## 3. Mode 1: The Bridge (API Client - Postman Style)

### [B] Context Sidebar
*   **Collections:** 폴더 트리 구조. 드래그 앤 드롭 지원.
*   **Environments:** 우측 상단 드롭다운 대신 사이드바에서 변수 세트 관리.
*   **History:** 최근 보낸 요청 목록.

### [D] Main Workspace
*   **Request Pane (Top/Left):**
    *   `Method` (GET/POST...) | `URL Input` (with Variable Auto-complete) | `Send` Button
    *   **Tabs:** Params | Auth | Headers | Body | Pre-request | Tests
*   **Response Pane (Bottom/Right):**
    *   Status Code (200 OK), Time (ms), Size (KB).
    *   **Body Viewer:** JSON (Syntax Highlight), Raw, Preview (HTML).
    *   **Tunnel Info:** K8s 터널링 중일 경우, 실제 포워딩된 Pod 정보 표시.

---

## 4. Mode 2: The Lens (Cluster IDE - Lens Style)

### [B] Context Sidebar
*   **Cluster Picker:** 등록된 Kubeconfig Context 목록.
*   **Namespace Selector:** 드롭다운 + 검색.
*   **Resource Menu:**
    *   **Workloads:** Pods, Deployments, StatefulSets, DaemonSets.
    *   **Network:** Services, Ingresses.
    *   **Config:** ConfigMaps, Secrets.
    *   **Storage:** PVC, SC.

### [D] Main Workspace
*   **Dashboard View:** 클러스터 CPU/Memory 요약 (Prometheus 연동 시).
*   **Resource Table:**
    *   필터링 가능한 데이터 그리드.
    *   상태 아이콘 (Running, Pending, Error).
    *   Action Menu: Logs, Shell, Port-forward, Edit YAML, Delete.
*   **Detail Drawer:** 리소스 클릭 시 우측에서 슬라이드 오버되는 상세 정보 패널.

### [E] Integrated Terminal
*   하단 패널을 열어 `kubectl` 쉘이나 파드 내부 쉘(`exec`)을 탭으로 여러 개 띄움.

---

## 5. Shared Components (Common UX)

*   **Command Palette (`Cmd+K`):** 모든 기능(요청 찾기, 리소스 이동, 테마 변경)을 키보드로 접근.
*   **Toasts:** 작업 성공/실패 알림 (우측 하단).
*   **Smart Variables:** API URL이나 Body에서 `{{pod_ip}}` 처럼 K8s 리소스 정보를 변수로 바로 참조 가능 (Holonet의 핵심 차별점).

---

## 6. Implementation Plan (Phase 1 UI)

1.  **Project Setup:** React + Vite + Tailwind + Shadcn/ui 설치.
2.  **Shell Layout:** 사이드바, 헤더, 메인 영역 레이아웃 잡기 (`Resizble Panels`).
3.  **Navigation State:** Zustand를 사용하여 Mode(`API` vs `Cluster`) 상태 관리.
4.  **Mock Data:** 실제 로직 연결 전, 더미 데이터로 UI 인터랙션 먼저 구현.

---

## 7. Settings Modal & API Key Management

사용자는 **Settings** 메뉴를 통해 전역 설정을 관리할 수 있습니다.

### [Modal Layout]
*   **Sidebar (Categories):** General, Appearance, **API Keys**, Shortcuts, About.
*   **Content Area:** 선택된 카테고리의 설정 항목 표시.

### [API Keys Section]
Deep Agents(Cyber War Room) 실행을 위해 외부 LLM Provider의 API Key가 필요합니다.
*   **Provider List:** OpenAI, Anthropic, Google Gemini 등 지원되는 제공자 목록.
*   **Key Input:**
    *   **Masked Field:** 입력된 키는 기본적으로 가려짐 (`sk-....`).
    *   **Visibility Toggle:** 눈 아이콘으로 키 확인 가능.
    *   **Validation:** 키 형식(Regex) 또는 간단한 API 호출로 유효성 검사 (옵션).
*   **Security:**
    *   키는 `electron-store` 등을 통해 로컬에 암호화되어 저장되거나, OS 키체인(Keytar)을 사용해야 합니다.
    *   UI 상에서 평문으로 노출되는 시간을 최소화합니다.
