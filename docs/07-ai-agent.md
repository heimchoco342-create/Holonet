# AI 에이전트 연동

Holonet은 Model Context Protocol (MCP)을 통해 AI 에이전트(Cursor, Claude 등)와 통신할 수 있습니다.

## 🤖 MCP란?

Model Context Protocol은 AI 에이전트가 외부 시스템과 통신하기 위한 표준 프로토콜입니다.

### 지원 에이전트

- **Cursor**: 코드 에디터
- **Claude**: AI 어시스턴트
- **Windsurf**: AI 개발 도구
- 기타 MCP 프로토콜을 지원하는 에이전트

## 🔌 MCP 서버 시작

### 자동 시작

MCP 서버는 Electron 앱이 실행될 때 자동으로 초기화됩니다.

### 수동 시작 (향후 지원)

```javascript
// Renderer Process에서
await window.electronAPI.mcp.start();
```

## 📚 리소스 (AI 읽기 전용)

### holonet://collections

팀 전체 API 리스트를 조회합니다.

**사용 예시:**
```
AI: "팀의 모든 API 목록을 보여줘"
→ holonet://collections 리소스 조회
→ API 목록 반환
```

### holonet://collections/{id}/openapi

특정 서비스 명세를 OpenAPI 포맷으로 변환하여 제공합니다.

**사용 예시:**
```
AI: "주문 API 명세를 OpenAPI 형식으로 줘"
→ holonet://collections/order-service/openapi 조회
→ OpenAPI 스키마 반환
```

## 🛠️ 도구 (AI 액션)

### execute_k8s_request

Kubernetes 서비스에 HTTP 요청을 실행합니다.

**파라미터:**
- `service`: Kubernetes 서비스 이름
- `namespace`: 네임스페이스 (기본값: default)
- `path`: API 경로 (예: /api/users)
- `method`: HTTP 메서드 (GET, POST, PUT, DELETE, PATCH)
- `body`: 요청 본문 (선택사항)
- `headers`: 요청 헤더 (선택사항)

**사용 예시:**
```
AI: "user-service의 /api/users 엔드포인트를 테스트해봐"
→ execute_k8s_request({
    service: "user-service",
    namespace: "dev",
    path: "/api/users",
    method: "GET"
  })
→ 응답 반환
```

## 💬 대화형 워크플로우

### 예시 1: API 테스트 자동화

```
사용자: "작성한 코드를 테스트해줘"
AI: "어떤 서비스를 테스트할까요?"
사용자: "user-service"
AI: execute_k8s_request로 GET /api/users 호출
AI: "테스트 결과: 상태 코드 200, 응답 시간 120ms"
```

### 예시 2: API 명세 조회

```
사용자: "주문 API 스키마를 보여줘"
AI: holonet://collections/order-service/openapi 조회
AI: OpenAPI 스키마를 포맷팅하여 표시
```

### 예시 3: 보안 점검 (향후 지원)

```
사용자: "새로 배포한 서비스 보안 점검해줘"
AI: 여러 엔드포인트에 대해 보안 테스트 실행
AI: "SQL 인젝션 취약점 발견: /api/users?id=1' OR '1'='1"
```

## 🔧 설정

### Cursor 설정

`.cursor/mcp.json` 파일에 Holonet MCP 서버를 추가:

```json
{
  "mcpServers": {
    "holonet": {
      "command": "node",
      "args": ["path/to/holonet/mcp-server.js"]
    }
  }
}
```

### Claude 설정

Claude Desktop 설정에 MCP 서버 추가 (설정 방법은 Claude 문서 참조)

## 🎯 사용 시나리오

### 시나리오 1: 코드 작성 후 자동 테스트

1. AI가 코드를 작성합니다
2. AI가 `execute_k8s_request`로 테스트를 실행합니다
3. 결과를 분석하여 피드백을 제공합니다

### 시나리오 2: API 문서 기반 코드 생성

1. AI가 `holonet://collections`로 API 목록을 조회합니다
2. 특정 API의 OpenAPI 스키마를 가져옵니다
3. 스키마를 기반으로 클라이언트 코드를 생성합니다

### 시나리오 3: 반복적인 보안 점검

1. AI가 주기적으로 API 엔드포인트를 테스트합니다
2. 보안 취약점을 발견하면 알림을 제공합니다
3. 수정 사항을 제안합니다

## ⚠️ 주의사항

1. **권한**: K8s 클러스터 접근 권한이 필요합니다
2. **보안**: AI가 실제 프로덕션 환경에 요청을 보낼 수 있으므로 주의가 필요합니다
3. **비용**: 많은 요청을 보내면 리소스 사용량이 증가할 수 있습니다

## 🎯 다음 단계

- [Kubernetes 통합](./03-kubernetes-integration.md) - K8s 서비스 자동 발견
- [테스트 기능](./04-testing.md) - 테스트 자동화
