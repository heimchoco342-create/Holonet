# 문제 해결

Holonet 사용 중 발생할 수 있는 문제와 해결 방법을 안내합니다.

## 🔴 일반적인 문제

### 문제 1: 워크스페이스 생성 실패

**증상:**
- "Failed to create workspace: Error: Server unavailable" 에러
- 워크스페이스가 생성되지 않음

**해결 방법:**

1. **오프라인 모드 확인**
   - 콘솔에 "Server is not available, using offline mode" 메시지가 있으면 정상입니다
   - 오프라인 모드에서도 워크스페이스 생성이 가능합니다

2. **서버 실행 확인**
   - 백엔드 서버를 실행하려면: `.\start.ps1 -server`
   - 서버가 실행 중인지 확인: `http://localhost:3001/health`

3. **IndexedDB 확인**
   - 브라우저 개발자 도구 > Application > IndexedDB > holonet
   - 데이터가 저장되어 있는지 확인

### 문제 2: Electron 앱이 검은 화면만 표시

**증상:**
- Electron 창이 열리지만 검은 화면만 보임
- 콘솔에 에러 메시지 없음

**해결 방법:**

1. **Vite dev 서버 확인**
   - `pnpm dev`가 실행 중인지 확인
   - 포트 5173, 5174, 5175 중 하나가 열려있는지 확인

2. **Electron 재시작**
   - Electron 앱을 완전히 종료
   - `.\start.ps1 -client`로 다시 실행

3. **캐시 삭제**
   ```powershell
   # Electron 캐시 삭제
   Remove-Item -Recurse -Force "$env:APPDATA\Holonet"
   ```

### 문제 3: K8s 서비스가 발견되지 않음

**증상:**
- "K8s Services" 워크스페이스가 생성되지 않음
- 콘솔에 "No K8s contexts found" 메시지

**해결 방법:**

1. **kubeconfig 확인**
   ```powershell
   # kubeconfig 파일 확인
   Test-Path "$env:USERPROFILE\.kube\config"
   ```

2. **kubectl 테스트**
   ```powershell
   kubectl get namespaces
   ```
   - 이 명령이 작동하면 kubeconfig가 올바릅니다

3. **권한 확인**
   - 클러스터 접근 권한이 있는지 확인
   - `kubectl auth can-i list services --all-namespaces`

### 문제 4: K8s 터널링 실패

**증상:**
- 요청 시 "Failed to create K8s tunnel" 에러
- 포트포워딩이 생성되지 않음

**해결 방법:**

1. **포트 확인**
   - 로컬 포트가 이미 사용 중일 수 있습니다
   - 다른 포트를 자동으로 선택하므로 재시도

2. **서비스 확인**
   ```powershell
   kubectl get svc -n dev
   ```
   - 서비스가 존재하는지 확인

3. **네임스페이스 확인**
   - 요청 패널에서 네임스페이스가 올바른지 확인
   - 기본값은 "default"이지만 "dev"를 사용해야 할 수 있음

### 문제 5: 테스트가 실행되지 않음

**증상:**
- "Run Tests" 버튼을 클릭해도 아무 반응 없음
- 테스트 결과가 표시되지 않음

**해결 방법:**

1. **요청 실행 확인**
   - 먼저 요청을 실행해야 테스트를 실행할 수 있습니다
   - "Send" 버튼을 클릭하여 응답을 받은 후 테스트 실행

2. **스크립트 문법 확인**
   - 테스트 스크립트 문법이 올바른지 확인
   - 콘솔에 에러 메시지가 있는지 확인

3. **응답 데이터 확인**
   - `pm.response` 객체가 올바르게 설정되었는지 확인

## 🟡 데이터베이스 문제

### 문제: 데이터베이스 연결 실패

**증상:**
- "P1010: User was denied access" 에러
- Prisma 마이그레이션 실패

**해결 방법:**

1. **DATABASE_URL 확인**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/holonet?schema=public"
   ```
   - 사용자명, 비밀번호, 호스트, 포트가 올바른지 확인

2. **데이터베이스 생성**
   ```sql
   CREATE DATABASE holonet;
   ```

3. **권한 부여**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE holonet TO postgres;
   ```

### 문제: Prisma 마이그레이션 실패

**해결 방법:**

```powershell
# 강제로 스키마 동기화
cd apps/server
npx prisma db push --force
```

## 🟢 성능 문제

### 문제: 앱이 느림

**해결 방법:**

1. **리소스 확인**
   - 많은 K8s 서비스가 있으면 로딩에 시간이 걸릴 수 있습니다
   - 콘솔에서 "Discovered X K8s services" 메시지 확인

2. **캐시 정리**
   - IndexedDB 데이터가 많으면 성능이 저하될 수 있습니다
   - 브라우저 개발자 도구에서 IndexedDB 정리

## 🔵 네트워크 문제

### 문제: 서버 연결 실패

**증상:**
- "ERR_CONNECTION_REFUSED" 에러
- "Server is not available" 메시지

**해결 방법:**

1. **서버 실행 확인**
   ```powershell
   .\start.ps1 -server
   ```

2. **포트 확인**
   - 기본 포트는 3001입니다
   - 다른 프로세스가 포트를 사용 중인지 확인

3. **오프라인 모드 사용**
   - 서버가 없어도 오프라인 모드로 동작 가능합니다
   - 모든 기능이 로컬에서 작동합니다

## 📞 추가 도움

문제가 해결되지 않으면:

1. **콘솔 로그 확인**
   - 개발자 도구 콘솔에서 에러 메시지 확인
   - 스크린샷과 함께 에러 메시지 기록

2. **환경 정보 수집**
   - Node.js 버전: `node --version`
   - pnpm 버전: `pnpm --version`
   - OS 버전

3. **재현 단계 기록**
   - 문제가 발생한 정확한 단계를 기록
   - 예상 동작과 실제 동작 비교

## 🎯 다음 단계

- [시작하기](./01-getting-started.md) - 설치 가이드
- [기본 사용법](./02-basic-usage.md) - 사용 방법
