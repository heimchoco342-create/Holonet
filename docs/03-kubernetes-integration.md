# Kubernetes 통합

Holonet은 Kubernetes 클러스터와 완벽하게 통합되어 있습니다. K8s 서비스를 자동으로 발견하고 포트포워딩을 통해 직접 접근할 수 있습니다.

## 🔍 자동 서비스 발견

### 설정

Holonet은 `~/.kube/config` 파일을 자동으로 읽습니다.

**사전 요구사항:**
- `kubectl`이 설치되어 있어야 합니다
- `~/.kube/config` 파일이 존재해야 합니다
- 클러스터 접근 권한이 있어야 합니다

### 동작 방식

앱이 시작되면:
1. `~/.kube/config`에서 컨텍스트 목록을 읽습니다
2. 모든 네임스페이스의 서비스를 스캔합니다
3. **"K8s Services"** 워크스페이스를 자동 생성합니다
4. 발견된 서비스를 컬렉션 아이템으로 추가합니다

### 서비스 구조

발견된 서비스는 다음과 같이 구성됩니다:

```
K8s Services/
├── namespace:dev/
│   ├── user-service (GET)
│   ├── order-service (GET)
│   └── payment-service (GET)
└── namespace:production/
    └── ...
```

## 🌉 Smart Tunneling (스마트 터널링)

### 자동 포트포워딩

K8s 서비스로 요청을 보내면:
1. Holonet이 자동으로 포트포워딩을 생성합니다
2. 요청 URL을 `localhost:{random_port}`로 변환합니다
3. 백그라운드에서 포트포워딩을 유지합니다

### 사용 방법

1. **"K8s Services"** 워크스페이스를 선택합니다
2. 원하는 서비스를 클릭합니다
3. 요청 패널에서 URL을 확인합니다:
   ```
   🔗 K8s Tunnel: user-service (dev:8080)
   ```
4. **"Send"** 버튼을 클릭합니다

### 터널 관리

- **자동 생성**: 요청 시 자동으로 터널이 생성됩니다
- **재사용**: 같은 서비스에 대한 후속 요청은 기존 터널을 재사용합니다
- **자동 정리**: 앱 종료 시 모든 터널이 자동으로 닫힙니다

## 🔧 수동 설정

### 서비스 정보 확인

요청 패널에서 다음 정보를 확인할 수 있습니다:
- **Service Name**: Kubernetes 서비스 이름
- **Namespace**: 네임스페이스 (기본값: default)
- **Port**: 서비스 포트

### 커스텀 요청

일반 HTTP 요청도 K8s 터널을 사용할 수 있습니다:
1. 요청을 생성합니다
2. URL에 서비스 이름을 사용합니다: `http://user-service/api/users`
3. Holonet이 자동으로 터널을 생성합니다

## 🎯 사용 예시

### 예시 1: 서비스 상태 확인

```
GET http://health-check-service/health
```

### 예시 2: API 호출

```
GET http://api-service/api/v1/users
POST http://api-service/api/v1/orders
Body: { "productId": 123, "quantity": 2 }
```

### 예시 3: 여러 서비스 연속 호출

여러 서비스를 연속으로 호출해도 각각의 터널이 자동으로 관리됩니다.

## ⚠️ 주의사항

1. **포트 충돌**: 로컬 포트가 이미 사용 중이면 자동으로 다른 포트를 선택합니다
2. **네트워크 지연**: 포트포워딩은 약간의 오버헤드가 있습니다
3. **권한**: 클러스터 접근 권한이 필요합니다

## 🎯 다음 단계

- [Lens 기능](./05-lens.md) - 클러스터 리소스 시각화
- [테스트 기능](./04-testing.md) - K8s 서비스 테스트 자동화
