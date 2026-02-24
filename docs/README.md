# Holonet 사용 가이드

Holonet은 DevOps-First API Client이자 AI Agent Interface입니다. Postman, Lens, MCP를 통합한 차세대 개발 플랫폼입니다.

## 📚 문서 목록

### 초급자 가이드
- [🚀 시작하기](./01-getting-started.md) - 설치 및 초기 설정
- [📡 기본 사용법](./02-basic-usage.md) - 워크스페이스, API 요청 관리

### 주요 기능
- [☸️ Kubernetes 통합](./03-kubernetes-integration.md) - K8s 서비스 자동 발견 및 터널링
- [🧪 테스트 기능](./04-testing.md) - 테스트 스크립트 작성 및 실행
- [🔭 Lens 기능](./05-lens.md) - Kubernetes 클러스터 시각화
- [💾 오프라인 모드](./06-offline-mode.md) - 서버 없이 동작하기
- [🤖 AI 에이전트 연동](./07-ai-agent.md) - MCP를 통한 AI 통신

### 고급 및 문제 해결
- [🎯 고급 기능](./09-advanced-features.md) - 실시간 동기화, 성능 최적화
- [🔧 문제 해결](./08-troubleshooting.md) - 자주 발생하는 문제와 해결 방법

## 🚀 빠른 시작

```powershell
# 1. 의존성 설치
npx -y pnpm@latest install

# 2. 데이터베이스 초기화
.\start.ps1 -init

# 3. 앱 실행
.\start.ps1
```

## 💡 주요 기능

- **API 클라이언트**: Postman과 유사한 API 요청 관리
- **Kubernetes 통합**: 자동 서비스 발견 및 포트포워딩
- **테스트 자동화**: Postman 스타일 테스트 스크립트
- **클러스터 시각화**: Lens와 유사한 K8s 리소스 관리
- **오프라인 모드**: 서버 없이도 완전히 동작
- **AI 에이전트 지원**: MCP 프로토콜을 통한 AI 통신

## 📖 다음 단계

[시작하기 가이드](./01-getting-started.md)를 읽고 설치를 진행하세요.
