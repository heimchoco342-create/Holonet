# 시작하기

Holonet을 처음 사용하시나요? 이 가이드에서 설치부터 첫 API 요청까지 단계별로 안내합니다.

## 📋 사전 요구사항

- **Node.js**: v18.0.0 이상
- **pnpm**: v8.0.0 이상 (또는 `npx pnpm` 사용)
- **PostgreSQL**: v14 이상 (로컬 또는 원격)
- **Kubernetes**: 클러스터 접근 권한 (선택사항, K8s 기능 사용 시)

## 🔧 설치

### 1단계: 저장소 클론 및 의존성 설치

```powershell
# 저장소가 이미 있다면 이 단계는 건너뛰세요
git clone <repository-url>
cd Holonet

# 의존성 설치
npx -y pnpm@latest install
```

### 2단계: 데이터베이스 설정

#### 옵션 A: 기존 PostgreSQL 사용

로컬 또는 원격 PostgreSQL을 사용하는 경우:

```powershell
# 데이터베이스 초기화
.\start.ps1 -init
```

스크립트가 다음을 수행합니다:
- `holonet` 데이터베이스 생성
- Prisma 스키마 적용
- DATABASE_URL 설정 안내

#### 옵션 B: Docker로 PostgreSQL 실행

```powershell
# docker-compose.yml의 주석을 해제하고 실행
docker-compose up -d
```

### 3단계: 환경 변수 설정

서버 디렉토리에 `.env` 파일을 생성합니다:

```env
# apps/server/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/holonet?schema=public"
PORT=3001
NODE_ENV=development
```

**중요**: `postgres`와 `password`를 실제 값으로 변경하세요.

## 🚀 실행

### 전체 실행 (서버 + 클라이언트)

```powershell
.\start.ps1
```

이 명령은:
1. 백엔드 서버를 시작합니다 (포트 3001)
2. Electron 앱을 실행합니다

### 개별 실행

```powershell
# 백엔드 서버만
.\start.ps1 -server

# Electron 클라이언트만
.\start.ps1 -client
```

## ✅ 설치 확인

앱이 정상적으로 실행되면:

1. **Electron 창**이 열립니다
2. 왼쪽 사이드바에 **"Workspaces"** 섹션이 보입니다
3. 상단에 **"📡 API Client"**와 **"🔭 Lens (K8s)"** 탭이 보입니다

### 첫 워크스페이스 생성

1. **"+ New"** 버튼 클릭
2. 워크스페이스 이름 입력 (예: "My API Collection")
3. **"Create"** 버튼 클릭

워크스페이스가 생성되면 설치가 완료된 것입니다! 🎉

## 🎯 다음 단계

- [기본 사용법](./02-basic-usage.md) - API 요청 만들기
- [Kubernetes 통합](./03-kubernetes-integration.md) - K8s 서비스 자동 발견
- [테스트 기능](./04-testing.md) - 테스트 스크립트 작성

## ❓ 문제가 발생했나요?

[문제 해결 가이드](./08-troubleshooting.md)를 확인하세요.
