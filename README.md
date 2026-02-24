# Holonet (홀로넷)

**DevOps-First API Client**이자 **AI Agent Interface**

Postman + Lens + MCP를 결합한 차세대 개발 플랫폼

## 🚀 빠른 시작

### 1. 의존성 설치 (한 줄로 모든 것 설치)

```powershell
npx -y pnpm@latest install
```

**참고**: Electron 바이너리는 자동으로 다운로드됩니다. 별도 설정 불필요.

### 2. 데이터베이스 초기화 (기존 PostgreSQL 사용)

```powershell
.\start.ps1 -init
```

### 3. 실행

```powershell
# 서버와 클라이언트 모두 실행
.\start.ps1

# 또는 개별 실행
.\start.ps1 -server   # 백엔드만
.\start.ps1 -client   # 클라이언트만
```

## 📋 요구사항

- Node.js >= 18.0.0
- PostgreSQL (localhost:5432, 포트포워딩 가능)
- Kubernetes 클러스터 (K8s 기능 사용 시)

## 📁 프로젝트 구조

```
holonet/
├── apps/
│   ├── client/      # Electron App
│   └── server/      # Fastify Server
├── packages/
│   └── shared/      # Shared Types
└── deployments/     # Kubernetes 배포 파일
```

## 📖 문서

### 사용자 가이드 (docs/)
- [📚 전체 가이드](./docs/README.md) - 모든 가이드 문서 목록
- [🚀 시작하기](./docs/01-getting-started.md) - 설치 및 초기 설정
- [📡 기본 사용법](./docs/02-basic-usage.md) - 워크스페이스, API 요청 관리
- [☸️ Kubernetes 통합](./docs/03-kubernetes-integration.md) - K8s 서비스 자동 발견 및 터널링
- [🧪 테스트 기능](./docs/04-testing.md) - 테스트 스크립트 작성 및 실행
- [🔭 Lens 기능](./docs/05-lens.md) - Kubernetes 클러스터 시각화
- [💾 오프라인 모드](./docs/06-offline-mode.md) - 서버 없이 동작하기
- [🤖 AI 에이전트 연동](./docs/07-ai-agent.md) - MCP를 통한 AI 통신
- [🔧 문제 해결](./docs/08-troubleshooting.md) - 자주 발생하는 문제와 해결 방법

### 개발자 문서
- [PRD](./prd.md) - 프로젝트 요구사항
- [SETUP](./SETUP.md) - 상세 설정 가이드
- [배포 가이드](./deployments/README.md) - Kubernetes 배포
