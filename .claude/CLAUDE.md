# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

모니모 앱 개발팀의 Claude Code 활용 노하우를 공유하는 익명 포스트잇 게시판.
Google Sheets를 DB로, Vercel을 호스팅으로 사용하는 정적 웹 앱.

## 기술 스택

- **프론트엔드**: Vanilla HTML/CSS/JS (빌드 도구 없음)
- **백엔드**: Google Apps Script Web App (Sheets 읽기/쓰기 API)
- **DB**: Google Sheets
- **배포**: Vercel (정적 파일 서빙)

## 파일 역할

| 파일 | 역할 |
|------|------|
| `index.html` | 포스트잇 보드 UI, 작성 모달 |
| `style.css` | 포스트잇 카드 스타일 (색상 4종, 그리드 레이아웃) |
| `app.js` | Apps Script API 연동, 카드 렌더링, 좋아요 처리 |
| `vercel.json` | Vercel 배포 설정 |

## 환경변수

`app.js` 상단의 `APPS_SCRIPT_URL` 상수에 Apps Script 배포 URL을 설정.
Vercel 환경변수로 주입할 경우 `vercel.json`의 `env` 섹션에 추가.

```js
// app.js 상단
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrq4sb_KjVgSFDoCt82BD8AbhcIHmVOV95Bz_Cv5Xpf1_YU7weaHNNvg04WJ7z3R0/exec';
```

## Google Sheets 구조

시트명: `tips`

| 컬럼 순서 | 컬럼명 | 타입 |
|-----------|--------|------|
| A | timestamp | DateTime |
| B | title | String (20자 이내) |
| C | body | String (200자 이내) |
| D | tag | 프롬프트작성 / 디버깅 / 코드리뷰 / 워크플로우 / 기타 |
| E | likes | Number |

## 로컬 개발

빌드 도구 없음 — 브라우저에서 직접 `index.html` 오픈.
Apps Script CORS 정책으로 `file://` 프로토콜에서 API 호출이 차단될 수 있음.
로컬 테스트 시 `npx serve .` 또는 VS Code Live Server 사용.

## Vercel 배포

```bash
# Vercel CLI 설치 후
vercel deploy --prod
```

## 보안 주의사항

- 팁 본문에 고객 데이터·내부 시스템 정보·API 키 포함 금지
- Apps Script URL을 코드에 하드코딩하지 말 것 (환경변수 사용)
- Sheets 편집 권한은 Apps Script 서비스 계정으로만 제한

## 사용 가능한 스킬

| 스킬 | 명령 | 용도 |
|------|------|------|
| tip-writer | `/tip-write` | 팁 카드 작성 보조 |
| tip-summarizer | `/tip-summary` | 팁 요약·분류 |
| board-ops | `/board-ops` | 게시판 운영 전반 |

에이전트: `board-manager` — 작성 도우미 + 주간 리포트 통합
