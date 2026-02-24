#!/bin/bash

# Holonet Kubernetes 배포 스크립트

set -e

NAMESPACE="holonet"
IMAGE_REGISTRY="${IMAGE_REGISTRY:-holonet/server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🚀 Holonet 배포 시작..."
echo "Namespace: $NAMESPACE"
echo "Image: $IMAGE_REGISTRY:$IMAGE_TAG"

# 네임스페이스 확인
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "📦 네임스페이스 생성 중..."
    kubectl apply -f namespace.yaml
fi

# Secret 적용
echo "🔐 Secret 적용 중..."
if [ -f "postgres-secret.yaml" ]; then
  kubectl apply -f postgres-secret.yaml
else
  echo "⚠️  postgres-secret.yaml이 없습니다. postgres-secret.yaml.example을 복사하여 수정하세요:"
  echo "   cp postgres-secret.yaml.example postgres-secret.yaml"
  echo "   # postgres-secret.yaml을 편집하여 실제 비밀번호로 변경"
  exit 1
fi

# PostgreSQL 배포
echo "🐘 PostgreSQL 배포 중..."
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deployment.yaml

# PostgreSQL 준비 대기
echo "⏳ PostgreSQL 준비 대기 중..."
kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s

# ConfigMap 적용
echo "⚙️  ConfigMap 적용 중..."
kubectl apply -f server-configmap.yaml

# 이미지 태그 업데이트
if [ -f server-deployment.yaml ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|image:.*holonet/server.*|image: $IMAGE_REGISTRY:$IMAGE_TAG|" server-deployment.yaml
    else
        # Linux
        sed -i "s|image:.*holonet/server.*|image: $IMAGE_REGISTRY:$IMAGE_TAG|" server-deployment.yaml
    fi
fi

# 서버 배포
echo "🖥️  서버 배포 중..."
kubectl apply -f server-deployment.yaml

# 서버 준비 대기
echo "⏳ 서버 준비 대기 중..."
kubectl wait --for=condition=available deployment/holonet-server -n "$NAMESPACE" --timeout=300s

echo "✅ 배포 완료!"
echo ""
echo "📊 상태 확인:"
kubectl get pods -n "$NAMESPACE"
echo ""
echo "🌐 서비스 확인:"
kubectl get svc -n "$NAMESPACE"
echo ""
echo "📝 로그 확인:"
echo "kubectl logs -f deployment/holonet-server -n $NAMESPACE"
echo ""
echo "🔌 Port Forward:"
echo "kubectl port-forward svc/holonet-server 3001:3001 -n $NAMESPACE"
