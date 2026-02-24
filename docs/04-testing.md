# 테스트 기능

Holonet의 테스트 기능을 사용하여 API 응답을 자동으로 검증할 수 있습니다.

## 📝 테스트 스크립트 작성

### 테스트 탭 열기

1. 요청을 선택합니다
2. 상단의 **"Tests"** 탭을 클릭합니다

### 기본 문법

Postman과 유사한 문법을 사용합니다:

```javascript
// pm.test() - 테스트 케이스 정의
pm.test("테스트 이름", function () {
  // 검증 로직
});

// pm.expect() - 값 검증
pm.expect(actual).to.be.equal(expected);
pm.expect(actual).to.be.above(expected);
pm.expect(actual).to.be.below(expected);
pm.expect(actual).to.have.property('key');
```

## 🔍 응답 검증

### 상태 코드 검증

```javascript
pm.test("Status code is 200", function () {
  pm.expect(pm.response.code).to.be.equal(200);
});

pm.test("Status code is success", function () {
  pm.expect(pm.response.code).to.be.above(199);
  pm.expect(pm.response.code).to.be.below(300);
});
```

### 응답 시간 검증

```javascript
pm.test("Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});
```

### JSON 응답 검증

```javascript
pm.test("Response has required fields", function () {
  const json = pm.response.json();
  pm.expect(json).to.have.property('data');
  pm.expect(json).to.have.property('status');
});

pm.test("Response data is valid", function () {
  const json = pm.response.json();
  pm.expect(json.data).to.be.an('array');
  pm.expect(json.data.length).to.be.above(0);
});
```

### 헤더 검증

```javascript
pm.test("Content-Type is JSON", function () {
  pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});
```

## 🎯 실전 예제

### 사용자 API 테스트

```javascript
// 상태 코드 검증
pm.test("Status code is 200", function () {
  pm.expect(pm.response.code).to.be.equal(200);
});

// 응답 구조 검증
pm.test("Response has user data", function () {
  const json = pm.response.json();
  pm.expect(json).to.have.property('user');
  pm.expect(json.user).to.have.property('id');
  pm.expect(json.user).to.have.property('name');
  pm.expect(json.user).to.have.property('email');
});

// 데이터 타입 검증
pm.test("User ID is number", function () {
  const json = pm.response.json();
  pm.expect(typeof json.user.id).to.be.equal('number');
});

// 응답 시간 검증
pm.test("Response is fast", function () {
  pm.expect(pm.response.responseTime).to.be.below(300);
});
```

### 목록 API 테스트

```javascript
pm.test("Status code is 200", function () {
  pm.expect(pm.response.code).to.be.equal(200);
});

pm.test("Response is array", function () {
  const json = pm.response.json();
  pm.expect(json).to.be.an('array');
});

pm.test("Array has items", function () {
  const json = pm.response.json();
  pm.expect(json.length).to.be.above(0);
});

pm.test("Each item has required fields", function () {
  const json = pm.response.json();
  json.forEach(item => {
    pm.expect(item).to.have.property('id');
    pm.expect(item).to.have.property('name');
  });
});
```

## ▶️ 테스트 실행

### 실행 방법

1. 테스트 스크립트를 작성합니다
2. **"Run Tests"** 버튼을 클릭합니다
3. 오른쪽 패널에 결과가 표시됩니다

### 결과 확인

- ✅ **통과**: 초록색 배지, 모든 검증이 성공
- ❌ **실패**: 빨간색 배지, 실패한 검증과 에러 메시지 표시

### 결과 정보

- **Assertions**: 총 검증 개수
- **Execution Time**: 테스트 실행 시간
- **Timestamp**: 실행 시각

## 💾 테스트 저장

테스트 스크립트는 자동으로 저장됩니다:
1. 테스트 스크립트를 작성합니다
2. **"Save Script"** 버튼을 클릭합니다
3. 다음에 요청을 열면 저장된 스크립트가 자동으로 로드됩니다

## 🔄 자동 실행

향후 버전에서 다음 기능이 추가될 예정입니다:
- 요청 실행 시 자동으로 테스트 실행
- 테스트 실패 시 알림
- 테스트 결과 히스토리

## 🎯 다음 단계

- [기본 사용법](./02-basic-usage.md) - API 요청 관리
- [Kubernetes 통합](./03-kubernetes-integration.md) - K8s 서비스 테스트
