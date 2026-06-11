# Claude Code 꿀팁 익명 게시판 — 설계 문서

**작성일**: 2026-06-11  
**프로젝트**: 모니모 앱 개발팀 내 Claude Code 노하우 공유 포스트잇 게시판

---

## 개요

모니모 앱 개발 시 축적된 Claude Code 활용 노하우를 팀원 간 익명으로 공유하는 정적 웹 게시판.
기술 개발 없이 Google Sheets를 DB로, Vercel을 호스팅으로 사용하여 즉시 운영 가능한 수준으로 구현.

---

## 아키텍처

```
[개발자 브라우저]
      ↓ 팁 제출 (fetch POST)
[Google Apps Script Web App]  ←→  [Google Sheets (DB)]
      ↓ 팁 목록 반환 (fetch GET)
[Vercel — 정적 파일 서빙]
  ├── index.html
  ├── style.css
  └── app.js
```

### 파일 구조

```
프로젝트 루트/
├── index.html                      # 포스트잇 보드 UI
├── style.css                       # 포스트잇 카드 스타일
├── app.js                          # Sheets API 연동, 카드 렌더링
├── vercel.json                     # Vercel 배포 설정
└── .claude/
    ├── CLAUDE.md                   # Claude Code 프로젝트 가이드
    ├── skills/
    │   ├── tip-writer.md           # 스킬: 팁 작성 보조
    │   ├── tip-summarizer.md       # 스킬: 요약·분류
    │   └── board-ops.md            # 스킬: 게시판 운영 전반
    └── agents/
        └── board-manager.md        # 에이전트: 작성+운영 통합
```

---

## 데이터 모델

### Google Sheets 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| timestamp | DateTime | Apps Script 자동 기록 |
| title | String | 팁 제목 (20자 이내) |
| body | String | 팁 본문 (200자 이내) |
| tag | Enum | `프롬프트작성` / `디버깅` / `코드리뷰` / `워크플로우` / `기타` |
| likes | Number | 👍 수 (초기값 0) |

작성자 식별 컬럼 없음 — 익명성 보장.

---

## UI 설계

- **헤더**: "Claude Code 꿀팁 게시판 🗒️"
- **태그 필터**: 전체 / 프롬프트작성 / 디버깅 / 코드리뷰 / 워크플로우 / 기타
- **팁 작성 버튼**: 모달 오픈 → 제목 + 본문 + 태그 선택 + 제출
- **포스트잇 그리드**: 카드 색상 랜덤 배정 (노랑·연두·하늘·분홍 4종)
- **좋아요**: localStorage로 카드당 1회 중복 방지

---

## Claude Code 파일 설계

### CLAUDE.md
- 기술 스택, 파일 역할, 환경변수 위치
- Vercel 배포 명령, 로컬 개발 방법
- Google Sheets 컬럼 구조 요약
- 보안 주의사항

### 스킬 3종

| 파일 | 트리거 | 역할 |
|------|--------|------|
| `tip-writer.md` | `/tip-write` | 대화로 팁 구조화 (제목·본문·태그 추출) |
| `tip-summarizer.md` | `/tip-summary` | Sheets 데이터 → 카테고리 분류 + 베스트 3 선정 |
| `board-ops.md` | `/board-ops` | 작성·분류·요약·중복 탐지 단계별 메뉴 |

### AGENT.md — board-manager

두 모드 전환:
- **WRITE 모드**: 대화형으로 팁 완성 → `app.js` POST 포맷으로 출력
- **REPORT 모드**: 주간 팁 데이터 입력 → 분류·요약·베스트픽 보고서 초안 생성

---

## 보안·컴플라이언스

- 팁 작성 시 실제 고객 데이터·내부 시스템 정보·API 키 포함 금지 (폼 안내문 고지)
- Apps Script URL은 환경변수(`VITE_APPS_SCRIPT_URL`)로 관리, 코드에 하드코딩 금지
- 익명성: Sheets 제출자 추적 기능 비활성화
- AI 요약 생성 시 외부 AI 서비스에 추상화된 내용만 입력
