# 써코니 소재 마케팅 대시보드 - 웹 버전

## 📁 파일 구조

```
web_dashboard/
├── index.html          # 메인 대시보드 (50KB)
├── config.js           # 설정 파일
├── dashboard.js        # 대시보드 로직
├── data.json           # 데이터 (100KB) ← 업데이트 대상
├── images.json         # 이미지 (4.8MB) ← 이미지 추가 시
└── README.md           # 이 파일
```

## 🚀 사용 방법

### 1. 로컬에서 실행
```bash
# Python 3이 설치된 경우
cd web_dashboard
python3 -m http.server 8000

# 브라우저에서 접속
http://localhost:8000
```

### 2. 웹 호스팅 (권장)

#### GitHub Pages (무료)
1. GitHub 저장소 생성
2. `web_dashboard` 폴더 내용 업로드
3. Settings > Pages > 활성화
4. https://[username].github.io/[repo] 접속

#### Netlify / Vercel (무료)
1. 계정 생성
2. 폴더 드래그 앤 드롭
3. 자동 배포 URL 생성

## 🔄 데이터 업데이트 방법

### 방법 1: data.json만 교체
```bash
# 1. 새 엑셀 데이터를 data.json으로 변환
# 2. 기존 data.json을 새 파일로 교체
# 3. 사용자는 F5 (새로고침)만 하면 최신 데이터 확인
```

### 방법 2: 자동 업데이트 (권장)
```bash
# 주기적으로 data.json을 업데이트하는 스크립트 실행
python3 update_data.py
```

## ⚙️ 설정

`config.js` 파일에서 설정 가능:

```javascript
enableAutoRefresh: true,  // 자동 새로고침 활성화
autoRefreshInterval: 300000,  // 5분(300,000ms)
```

## 📊 기능

- ✅ 자동 데이터 로딩
- ✅ 캐시 방지 (항상 최신 데이터)
- ✅ 수동 새로고침 버튼
- ✅ 실시간 업데이트 시간 표시
- ✅ 41개 이미지 완벽 지원
- ✅ 모든 필터링/정렬 기능

## 🔧 문제 해결

### CORS 에러 발생 시
```bash
# Chrome 실행 시 플래그 추가
chrome --disable-web-security --user-data-dir=/tmp
```

### 데이터가 업데이트 안 될 때
- 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
- 시크릿 모드로 접속
- config.js의 getCacheBreaker() 확인

## 📞 문의
- 버전: v15.0-web
- 생성일: 2026-02-06
