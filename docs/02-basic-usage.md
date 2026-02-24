# 기본 사용법

Holonet의 핵심 기능을 사용하는 방법을 알아봅니다.

## 📁 워크스페이스 관리

### 워크스페이스 생성

1. 왼쪽 사이드바의 **"+ New"** 버튼 클릭
2. 워크스페이스 이름 입력
3. **"Create"** 버튼 클릭

워크스페이스는 API 컬렉션을 그룹화하는 단위입니다.

### 워크스페이스 선택

생성된 워크스페이스를 클릭하면 중앙 패널에 컬렉션 트리가 표시됩니다.

## 📡 API 요청 만들기

### Postman에서 가져오기

1. 워크스페이스를 선택합니다
2. 중앙 패널 상단의 **"📦"** 버튼 클릭
3. Postman Collection JSON 파일을 드래그 앤 드롭하거나 **"Select File"** 클릭

Postman v2.1 형식의 컬렉션을 자동으로 가져옵니다.

### 수동으로 요청 추가

현재는 Postman Import를 통해 요청을 추가할 수 있습니다. 향후 UI에서 직접 추가하는 기능이 추가될 예정입니다.

## 🔍 API 요청 실행

1. 컬렉션 트리에서 요청을 선택합니다
2. 오른쪽 패널에 요청 상세가 표시됩니다
3. **"Send"** 버튼을 클릭합니다

### 요청 수정

- **Method**: GET, POST, PUT, DELETE, PATCH 등 선택
- **URL**: 엔드포인트 주소 입력
- **Headers**: 요청 헤더 추가/수정
- **Body**: POST/PUT 요청의 본문 (JSON 형식)

### 응답 확인

요청 실행 후 오른쪽 패널 하단에 응답이 표시됩니다:
- **Status Code**: HTTP 상태 코드
- **Response Time**: 응답 시간
- **Headers**: 응답 헤더
- **Body**: 응답 본문 (JSON 포맷팅)

## 🧪 테스트 작성

### 테스트 탭 열기

1. 요청을 선택합니다
2. 상단의 **"Tests"** 탭을 클릭합니다

### 테스트 스크립트 작성

Postman과 유사한 문법을 사용합니다:

```javascript
// 상태 코드 검증
pm.test("Status code is 200", function () {
  pm.expect(pm.response.code).to.be.equal(200);
});

// 응답 시간 검증
pm.test("Response time is less than 500ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// JSON 응답 검증
pm.test("Response has data property", function () {
  const json = pm.response.json();
  pm.expect(json).to.have.property('data');
});
```

### 테스트 실행

1. 테스트 스크립트를 작성합니다
2. **"Run Tests"** 버튼을 클릭합니다
3. 오른쪽 패널에 테스트 결과가 표시됩니다

### 테스트 결과

- ✅ **통과**: 초록색으로 표시
- ❌ **실패**: 빨간색으로 표시, 에러 메시지 포함

## 🌍 환경 변수

환경 변수는 향후 버전에서 지원될 예정입니다.

## 💾 데이터 저장

모든 데이터는 자동으로 저장됩니다:
- **온라인 모드**: 서버와 IndexedDB에 저장
- **오프라인 모드**: IndexedDB에만 저장

## 🎯 다음 단계

- [Kubernetes 통합](./03-kubernetes-integration.md) - K8s 서비스 자동 발견
- [테스트 기능](./04-testing.md) - 고급 테스트 작성
- [Lens 기능](./05-lens.md) - 클러스터 시각화
