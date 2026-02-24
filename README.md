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

## 📖 상세 문서

- [PRD](./prd.md) - 프로젝트 요구사항
- [SETUP](./SETUP.md) - 상세 설정 가이드
- [DISTRIBUTION](./DISTRIBUTION.md) - 배포 가이드
