# Holonet 배포 가이드

## 설치 파일 생성

### 사전 준비

1. **아이콘 파일 생성**

   SVG 파일을 각 플랫폼용 아이콘으로 변환해야 합니다:

   **Windows (.ico)**
   ```bash
   # ImageMagick 사용
   magick convert apps/client/build/icon.svg -resize 256x256 apps/client/build/icon.ico
   
   # 또는 온라인 도구: https://convertio.co/svg-ico/
   ```

   **macOS (.icns)**
   ```bash
   # macOS에서만 가능
   # 1. SVG를 512x512 PNG로 변환
   magick convert apps/client/build/icon.svg -resize 512x512 apps/client/build/icon.png
   
   # 2. icon.iconset 디렉토리 생성 및 다양한 크기 추가
   mkdir -p apps/client/build/icon.iconset
   sips -z 16 16 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_16x16.png
   sips -z 32 32 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_16x16@2x.png
   sips -z 32 32 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_32x32.png
   sips -z 64 64 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_32x32@2x.png
   sips -z 128 128 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_128x128.png
   sips -z 256 256 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_128x128@2x.png
   sips -z 256 256 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_256x256.png
   sips -z 512 512 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_256x256@2x.png
   sips -z 512 512 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_512x512.png
   sips -z 1024 1024 apps/client/build/icon.png --out apps/client/build/icon.iconset/icon_512x512@2x.png
   
   # 3. ICNS 파일 생성
   iconutil -c icns apps/client/build/icon.iconset -o apps/client/build/icon.icns
   ```

   **Linux (.png)**
   ```bash
   magick convert apps/client/build/icon.svg -resize 512x512 apps/client/build/icon.png
   ```

2. **의존성 설치**
   ```bash
   pnpm install
   ```

3. **빌드**
   ```bash
   pnpm build:client
   ```

### 배포 파일 생성

#### Windows

```bash
# NSIS 설치 파일 + Portable 버전
pnpm dist:win

# 생성 파일:
# - release/Holonet-1.0.0-x64.exe (설치 파일)
# - release/Holonet-1.0.0-x64-portable.exe (포터블 버전)
```

#### macOS

```bash
# DMG 파일
pnpm dist:mac

# 생성 파일:
# - release/Holonet-1.0.0-x64.dmg
# - release/Holonet-1.0.0-arm64.dmg (Apple Silicon)
```

#### Linux

```bash
# AppImage + DEB 패키지
pnpm dist:linux

# 생성 파일:
# - release/Holonet-1.0.0-x64.AppImage
# - release/Holonet-1.0.0-x64.deb
```

### 전체 플랫폼 빌드

```bash
# 모든 플랫폼용 설치 파일 생성
pnpm dist
```

## 배포 파일 위치

모든 배포 파일은 `apps/client/release/` 디렉토리에 생성됩니다.

## 코드 서명 (선택사항)

### Windows

```bash
# 코드 서명 인증서 필요
# electron-builder.config.js에 서명 설정 추가
```

### macOS

```bash
# Apple Developer 인증서 필요
# Xcode에서 코드 서명 설정
```

## 자동 업데이트 (향후 구현)

Electron Builder는 자동 업데이트를 지원합니다:
- Windows: Squirrel.Windows
- macOS: Sparkle
- Linux: AppImage 업데이트

## 배포 체크리스트

- [ ] 버전 번호 업데이트 (`package.json`)
- [ ] 아이콘 파일 생성 (ico, icns, png)
- [ ] 빌드 테스트
- [ ] 설치 파일 테스트
- [ ] 코드 서명 (선택)
- [ ] 릴리스 노트 작성
- [ ] GitHub Releases에 업로드

## 문제 해결

### 아이콘이 표시되지 않는 경우

1. 아이콘 파일 경로 확인
2. 파일 크기 확인 (최소 256x256 권장)
3. 빌드 디렉토리 구조 확인

### 빌드 실패 시

1. `node_modules` 삭제 후 재설치
2. `dist-electron` 및 `dist` 디렉토리 삭제 후 재빌드
3. Electron Builder 캐시 삭제: `rm -rf ~/.cache/electron-builder`
