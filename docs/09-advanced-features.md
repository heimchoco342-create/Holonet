# 고급 기능

Holonet의 고급 기능과 팁을 알아봅니다.

## 🔄 실시간 동기화

### 동작 방식

서버가 실행 중일 때:
- 워크스페이스, 아이템, 환경 변수 변경이 실시간으로 동기화됩니다
- Socket.io를 통해 여러 클라이언트 간 변경사항이 즉시 반영됩니다

### 이벤트 구독

컴포넌트에서 실시간 업데이트를 받으려면:

```typescript
const unsubscribe = serverClient.on('workspace:created', (workspace) => {
  // 워크스페이스가 생성되면 실행
  console.log('New workspace:', workspace);
});

// 컴포넌트 언마운트 시 구독 해제
useEffect(() => {
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);
```

## 🎨 환경 변수 관리

### 환경 변수 사용

환경 변수는 향후 버전에서 지원될 예정입니다. 현재는 요청 URL과 헤더에 직접 값을 입력해야 합니다.

### 계획된 기능

- 팀 공유 환경 변수 (서버에 저장)
- 로컬 전용 환경 변수 (IndexedDB에 저장)
- 환경별 변수 관리 (dev, staging, production)

## 📦 Postman Import

### 지원 형식

- **Postman Collection v2.1**: 완전 지원
- **OpenAPI/Swagger**: 향후 지원 예정

### Import 방법

1. 워크스페이스를 선택합니다
2. 중앙 패널 상단의 **"📦"** 버튼을 클릭합니다
3. Postman Collection JSON 파일을 드래그 앤 드롭합니다

### Import 결과

- 폴더 구조가 그대로 유지됩니다
- 요청 메서드, URL, 헤더, 본문이 모두 가져옵니다
- 테스트 스크립트는 향후 버전에서 지원될 예정입니다

## 🔐 보안 고려사항

### K8s 자격 증명

- `~/.kube/config` 파일은 안전하게 보관하세요
- 프로덕션 클러스터 접근 시 주의하세요

### API 키 관리

- 환경 변수에 민감한 정보를 저장하지 마세요
- 향후 버전에서 안전한 키 관리 기능이 추가될 예정입니다

## 🚀 성능 최적화

### 대량 서비스 처리

224개 이상의 K8s 서비스가 있을 때:
- 초기 로딩에 시간이 걸릴 수 있습니다
- 서비스는 백그라운드에서 점진적으로 로드됩니다

### IndexedDB 최적화

- 오래된 데이터는 주기적으로 정리하세요
- 브라우저 개발자 도구에서 IndexedDB 크기를 확인할 수 있습니다

## 🎯 다음 단계

- [기본 사용법](./02-basic-usage.md) - 기본 기능 익히기
- [문제 해결](./08-troubleshooting.md) - 성능 문제 해결
