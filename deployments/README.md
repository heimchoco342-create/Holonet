# Holonet Kubernetes 배포 가이드

이 디렉토리에는 Holonet 백엔드 서버를 Kubernetes에 배포하기 위한 YAML 매니페스트가 포함되어 있습니다.

## 파일 구조

```
deployments/
├── namespace.yaml                    # holonet 네임스페이스
├── postgres-secret.yaml.example      # PostgreSQL 비밀번호 예시 (Git에 포함)
├── postgres-secret.yaml              # PostgreSQL 비밀번호 (Git에 포함하지 않음!)
├── postgres-pvc.yaml                 # PostgreSQL 영구 저장소
├── postgres-deployment.yaml          # PostgreSQL StatefulSet + Service
├── server-configmap.yaml             # 백엔드 서버 환경 변수
├── server-deployment.yaml            # 백엔드 서버 Deployment + Service
├── kustomization.yaml                # Kustomize 설정 (선택사항)
└── README.md                         # 이 파일
```

## 사전 요구사항

1. Kubernetes 클러스터 (v1.20+)
2. kubectl 설치 및 클러스터 접근 권한
3. Docker 이미지 레지스트리 접근 권한
4. (선택) Kustomize 설치

## 배포 단계

### 1. Docker 이미지 빌드 및 푸시

```bash
# 루트 디렉토리에서
docker build -f apps/server/Dockerfile -t holonet/server:latest .
docker tag holonet/server:latest your-registry/holonet/server:latest
docker push your-registry/holonet/server:latest
```

### 2. 이미지 레지스트리 설정

`server-deployment.yaml`의 이미지 경로를 수정:

```yaml
image: your-registry/holonet/server:latest
```

### 3. 비밀번호 설정 (프로덕션)

**⚠️ 중요**: `postgres-secret.yaml`은 Git에 커밋하지 마세요. 실제 비밀번호가 포함되어 있습니다.

```bash
# 예시 파일을 복사하여 실제 비밀번호로 수정
cp postgres-secret.yaml.example postgres-secret.yaml
# postgres-secret.yaml을 편집하여 CHANGE_ME_TO_SECURE_PASSWORD를 실제 비밀번호로 변경
```

또는 kubectl로 직접 생성:

```bash
# Secret 생성
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=holonet \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --from-literal=POSTGRES_DB=holonet \
  -n holonet
```

그 후 적용:

```bash
kubectl apply -f postgres-secret.yaml
```

### 4. 배포 실행

#### 방법 1: 개별 파일 적용

```bash
# 순서대로 적용
kubectl apply -f namespace.yaml
kubectl apply -f postgres-secret.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f server-configmap.yaml
kubectl apply -f server-deployment.yaml
```

#### 방법 2: Kustomize 사용

```bash
kubectl apply -k .
```

#### 방법 3: 전체 디렉토리 적용

```bash
kubectl apply -f .
```

### 5. 배포 확인

```bash
# 네임스페이스 확인
kubectl get ns holonet

# Pod 상태 확인
kubectl get pods -n holonet

# 서비스 확인
kubectl get svc -n holonet

# 로그 확인
kubectl logs -f deployment/holonet-server -n holonet
```

### 6. 데이터베이스 마이그레이션

```bash
# Pod에 접속하여 마이그레이션 실행
kubectl exec -it deployment/holonet-server -n holonet -- sh
cd /app/apps/server
pnpm db:migrate
```

또는 initContainer를 사용하여 자동 마이그레이션 (권장):

`server-deployment.yaml`의 주석 처리된 `initContainers` 섹션을 활성화하세요.

## 외부 접근 설정

### Port Forward (개발/테스트)

```bash
kubectl port-forward svc/holonet-server 3001:3001 -n holonet
```

### Ingress 설정 (프로덕션)

`server-deployment.yaml`의 주석 처리된 Ingress 섹션을 활성화하고 도메인을 수정하세요.

### LoadBalancer (클라우드 환경)

```yaml
# server-deployment.yaml의 Service 섹션 수정
spec:
  type: LoadBalancer
  ports:
  - port: 3001
    targetPort: 3001
```

## 환경별 설정

### 개발 환경

```bash
# replicas: 1
# resources: 낮은 리소스
```

### 프로덕션 환경

```bash
# replicas: 3+
# resources: 높은 리소스
# HPA (Horizontal Pod Autoscaler) 설정
# Ingress + TLS 설정
```

## 외부 PostgreSQL 사용

외부 PostgreSQL을 사용하는 경우:

1. `postgres-deployment.yaml` 제거
2. `server-configmap.yaml`의 `DATABASE_URL` 수정:

```yaml
DATABASE_URL: "postgresql://user:password@external-host:5432/holonet?schema=public"
```

## 스케일링

```bash
# 수동 스케일링
kubectl scale deployment/holonet-server --replicas=3 -n holonet

# HPA 설정 (자동 스케일링)
kubectl autoscale deployment holonet-server \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n holonet
```

## 모니터링

```bash
# 리소스 사용량 확인
kubectl top pods -n holonet

# 이벤트 확인
kubectl get events -n holonet --sort-by='.lastTimestamp'
```

## 롤백

```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/holonet-server -n holonet

# 특정 리비전으로 롤백
kubectl rollout undo deployment/holonet-server --to-revision=2 -n holonet
```

## 문제 해결

### Pod가 시작되지 않는 경우

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n holonet

# 로그 확인
kubectl logs <pod-name> -n holonet
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL Pod 확인
kubectl get pods -l app=postgres -n holonet

# PostgreSQL 로그 확인
kubectl logs -l app=postgres -n holonet

# 서비스 연결 테스트
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- \
  psql -h postgres.holonet.svc.cluster.local -U holonet -d holonet
```

## 정리

```bash
# 모든 리소스 삭제
kubectl delete -f .

# 또는 네임스페이스 전체 삭제 (주의!)
kubectl delete namespace holonet
```

## 추가 리소스

- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)
- [Fastify 프로덕션 가이드](https://www.fastify.io/docs/latest/Guides/Production/)
