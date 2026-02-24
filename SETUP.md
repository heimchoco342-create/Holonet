# Holonet 설정 가이드

## 초기 설정

### 1. 의존성 설치

```powershell
npx -y pnpm@latest install
```

### 2. 데이터베이스 초기화

기존 PostgreSQL을 사용합니다 (localhost:5432, 포트포워딩 가능).

```powershell
.\start.ps1 -init
```

이 스크립트는:
- holonet 데이터베이스 생성
- Prisma 스키마 적용
- DATABASE_URL 설정 안내

### 3. 실행

```powershell
# 서버와 클라이언트 모두 실행
.\start.ps1

# 또는 개별 실행
.\start.ps1 -server   # 백엔드 서버만
.\start.ps1 -client   # Electron 클라이언트만
```

## 환경 변수

서버 실행 시 DATABASE_URL이 필요합니다:

```powershell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/holonet?schema=public"
```

또는 `apps/server/.env` 파일 생성:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/holonet?schema=public"
PORT=3001
NODE_ENV=development
```

## 기능

### K8s 터널링

- `~/.kube/config` 자동 스캔
- 요청 시 자동 포트포워딩
- URL 자동 변환 (localhost:{port})

### Postman Import

- Collection Tree에서 📦 버튼 클릭
- Postman collection JSON 파일 드래그 앤 드롭

### MCP 서버

AI 에이전트(Cursor, Claude 등)와 통신:
- `holonet://collections` 리소스
- `execute_k8s_request` 도구

## 문제 해결

### 데이터베이스 연결 실패

- PostgreSQL이 localhost:5432에서 실행 중인지 확인
- DATABASE_URL이 올바른지 확인
- holonet 데이터베이스가 생성되었는지 확인

### K8s 터널링 실패

- `~/.kube/config` 파일 존재 확인
- Kubernetes 클러스터 접근 가능한지 확인
