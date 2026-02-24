#!/bin/bash

# Docker 이미지 빌드 및 푸시 스크립트

set -e

IMAGE_REGISTRY="${IMAGE_REGISTRY:-holonet/server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKERFILE="${DOCKERFILE:-deployments/Dockerfile.production}"

echo "🐳 Docker 이미지 빌드 및 푸시"
echo "Registry: $IMAGE_REGISTRY"
echo "Tag: $IMAGE_TAG"
echo "Dockerfile: $DOCKERFILE"
echo ""

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# 이미지 빌드
echo "📦 이미지 빌드 중..."
docker build -f "$DOCKERFILE" -t "$IMAGE_REGISTRY:$IMAGE_TAG" .

# 태그 추가 (레지스트리 경로)
if [ -n "$REGISTRY_HOST" ]; then
    FULL_IMAGE="$REGISTRY_HOST/$IMAGE_REGISTRY:$IMAGE_TAG"
    echo "🏷️  태그 추가: $FULL_IMAGE"
    docker tag "$IMAGE_REGISTRY:$IMAGE_TAG" "$FULL_IMAGE"
    IMAGE_TO_PUSH="$FULL_IMAGE"
else
    IMAGE_TO_PUSH="$IMAGE_REGISTRY:$IMAGE_TAG"
fi

# 이미지 푸시 (선택사항)
if [ "$PUSH_IMAGE" = "true" ] || [ "$1" = "--push" ]; then
    echo "📤 이미지 푸시 중..."
    docker push "$IMAGE_TO_PUSH"
    echo "✅ 푸시 완료: $IMAGE_TO_PUSH"
else
    echo "💡 이미지 푸시를 원하면 다음 명령어를 사용하세요:"
    echo "   PUSH_IMAGE=true ./deployments/build-and-push.sh"
    echo "   또는"
    echo "   ./deployments/build-and-push.sh --push"
fi

echo ""
echo "✅ 빌드 완료: $IMAGE_TO_PUSH"
