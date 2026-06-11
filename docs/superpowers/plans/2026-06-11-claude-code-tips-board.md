# Claude Code 꿀팁 익명 게시판 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모니모 앱 개발팀이 Claude Code 노하우를 포스트잇 형태로 익명 게시·공유할 수 있는 정적 웹 페이지를 Vercel에 배포한다.

**Architecture:** Vanilla HTML/CSS/JS 프론트엔드가 Google Apps Script Web App을 통해 Google Sheets를 읽고 쓴다. 빌드 도구 없이 정적 파일만으로 구성되며 Vercel이 서빙한다.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Google Apps Script, Google Sheets API, Vercel

---

## 파일 구조

| 경로 | 역할 |
|------|------|
| `index.html` | 보드 UI — 헤더, 필터, 그리드, 작성 모달 |
| `style.css` | 포스트잇 카드, 그리드, 모달, 반응형 스타일 |
| `app.js` | API 호출, 카드 렌더링, 좋아요, 필터링 |
| `vercel.json` | Vercel 캐시·헤더 설정 |
| `gas/Code.gs` | Google Apps Script — GET(목록), POST(제출·좋아요) |

---

## Task 1: Google Apps Script 백엔드

**Files:**
- Create: `gas/Code.gs`

Google Sheets 시트명 `tips`, 컬럼 순서: A=timestamp, B=title, C=body, D=tag, E=likes

- [ ] **Step 1: Google Sheets 준비**

  1. [Google Sheets](https://sheets.google.com) 에서 새 스프레드시트 생성, 이름: `claude-tips-db`
  2. 첫 번째 시트 이름을 `tips`로 변경
  3. 1행 헤더 입력:
     ```
     A1: timestamp  B1: title  C1: body  D1: tag  E1: likes
     ```

- [ ] **Step 2: Apps Script 프로젝트 생성**

  1. 스프레드시트 메뉴 → 확장 프로그램 → Apps Script
  2. `코드.gs` 파일을 열어 전체 내용을 아래 코드로 교체:

  ```javascript
  // gas/Code.gs
  const SHEET_NAME = 'tips';

  function doGet(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const tips = rows.slice(1).map((row, i) => ({
      id: i + 2, // 실제 시트 행 번호 (1-indexed, 헤더 제외)
      timestamp: row[0],
      title: row[1],
      body: row[2],
      tag: row[3],
      likes: row[4] || 0
    }));
    return ContentService
      .createTextOutput(JSON.stringify({ tips }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function doPost(e) {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (data.action === 'submit') {
      sheet.appendRow([
        new Date(),
        data.title,
        data.body,
        data.tag,
        0
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'like') {
      const row = data.id; // 시트 행 번호
      const likesCell = sheet.getRange(row, 5);
      likesCell.setValue((likesCell.getValue() || 0) + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ error: 'unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  ```

- [ ] **Step 3: Apps Script 배포**

  1. Apps Script 에디터 → 배포 → 새 배포
  2. 유형: 웹 앱
  3. 설정:
     - 설명: `claude-tips-board`
     - 다음 사용자로 실행: **나**
     - 액세스 권한: **모든 사용자** (익명 접근 허용)
  4. 배포 클릭 → 생성된 URL 복사 (형식: `https://script.google.com/macros/s/AKfy.../exec`)

- [ ] **Step 4: CORS 동작 확인**

  브라우저 주소창에 배포 URL 직접 입력 → JSON 응답 확인:
  ```json
  {"tips":[]}
  ```
  빈 배열이면 정상.

- [ ] **Step 5: gas/Code.gs 로컬 저장**

  `gas/Code.gs` 파일을 생성하고 Step 2의 코드를 그대로 저장 (버전 관리용).

  ```bash
  mkdir gas
  ```

  파일 생성 후 커밋:
  ```bash
  git add gas/Code.gs
  git commit -m "feat: add Google Apps Script backend"
  ```

---

## Task 2: HTML 구조

**Files:**
- Create: `index.html`

- [ ] **Step 1: index.html 작성**

  ```html
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code 꿀팁 게시판</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <header>
      <h1>🗒️ Claude Code 꿀팁 게시판</h1>
      <p class="subtitle">모니모 개발팀의 Claude Code 노하우를 익명으로 공유해요</p>
    </header>

    <main>
      <div class="toolbar">
        <div class="filters" id="filters">
          <button class="filter-btn active" data-tag="전체">전체</button>
          <button class="filter-btn" data-tag="프롬프트작성">프롬프트작성</button>
          <button class="filter-btn" data-tag="디버깅">디버깅</button>
          <button class="filter-btn" data-tag="코드리뷰">코드리뷰</button>
          <button class="filter-btn" data-tag="워크플로우">워크플로우</button>
          <button class="filter-btn" data-tag="기타">기타</button>
        </div>
        <button class="add-btn" id="openModalBtn">✏️ 팁 올리기</button>
      </div>

      <div class="board" id="board">
        <div class="loading" id="loading">팁을 불러오는 중...</div>
      </div>
    </main>

    <!-- 작성 모달 -->
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <h2>새 팁 작성</h2>
        <p class="modal-notice">⚠️ 고객정보·API 키·내부 시스템 정보는 포함하지 마세요.</p>
        <form id="tipForm">
          <label for="titleInput">제목 <span class="char-count" id="titleCount">0/20</span></label>
          <input type="text" id="titleInput" maxlength="20" placeholder="핵심을 한 문장으로" required />

          <label for="bodyInput">내용 <span class="char-count" id="bodyCount">0/200</span></label>
          <textarea id="bodyInput" maxlength="200" rows="4" placeholder="구체적인 방법이나 예시를 적어주세요" required></textarea>

          <label for="tagSelect">태그</label>
          <select id="tagSelect" required>
            <option value="">태그 선택</option>
            <option value="프롬프트작성">프롬프트작성</option>
            <option value="디버깅">디버깅</option>
            <option value="코드리뷰">코드리뷰</option>
            <option value="워크플로우">워크플로우</option>
            <option value="기타">기타</option>
          </select>

          <div class="modal-actions">
            <button type="button" id="closeModalBtn">취소</button>
            <button type="submit" id="submitBtn">게시하기</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
    </script>
    <script src="app.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: 브라우저에서 구조 확인**

  ```bash
  npx serve . -p 3000
  ```

  `http://localhost:3000` 열어서 헤더·필터 버튼·팁 올리기 버튼 표시 확인.
  `YOUR_APPS_SCRIPT_URL_HERE` 자리에 Task 1에서 복사한 URL 입력.

- [ ] **Step 3: 커밋**

  ```bash
  git add index.html
  git commit -m "feat: add HTML structure for tips board"
  ```

---

## Task 3: CSS 스타일

**Files:**
- Create: `style.css`

- [ ] **Step 1: style.css 작성**

  ```css
  /* ===== 기본 리셋 & 변수 ===== */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --yellow: #fef08a;
    --green: #bbf7d0;
    --blue: #bae6fd;
    --pink: #fbcfe8;
    --shadow: 2px 4px 8px rgba(0,0,0,0.15);
    --font: 'Segoe UI', 'Apple SD Gothic Neo', sans-serif;
  }

  body {
    font-family: var(--font);
    background: #f5f5f0;
    min-height: 100vh;
  }

  /* ===== 헤더 ===== */
  header {
    background: #1a1a2e;
    color: #fff;
    padding: 1.5rem 2rem;
    text-align: center;
  }

  header h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
  header .subtitle { opacity: 0.7; font-size: 0.9rem; }

  /* ===== 툴바 ===== */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 2rem;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
  }

  .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  .filter-btn {
    padding: 0.4rem 0.9rem;
    border: 1px solid #d1d5db;
    border-radius: 9999px;
    background: #fff;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }

  .filter-btn.active,
  .filter-btn:hover {
    background: #1a1a2e;
    color: #fff;
    border-color: #1a1a2e;
  }

  .add-btn {
    padding: 0.5rem 1.2rem;
    background: #f59e0b;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.15s;
  }

  .add-btn:hover { background: #d97706; }

  /* ===== 보드 & 카드 ===== */
  .board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.2rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .card {
    border-radius: 4px;
    padding: 1rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    min-height: 160px;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .card:hover { transform: translateY(-3px); box-shadow: 4px 8px 16px rgba(0,0,0,0.18); }

  .card[data-color="yellow"] { background: var(--yellow); }
  .card[data-color="green"]  { background: var(--green); }
  .card[data-color="blue"]   { background: var(--blue); }
  .card[data-color="pink"]   { background: var(--pink); }

  .card-title { font-weight: 700; font-size: 0.95rem; line-height: 1.3; }
  .card-body  { font-size: 0.85rem; line-height: 1.5; flex: 1; word-break: keep-all; }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .card-tag {
    font-size: 0.75rem;
    background: rgba(0,0,0,0.1);
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
  }

  .like-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .like-btn:hover { background: rgba(0,0,0,0.1); }
  .like-btn.liked  { opacity: 0.5; cursor: default; }

  .loading {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem;
    color: #9ca3af;
  }

  /* ===== 모달 ===== */
  .modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
    align-items: center;
    justify-content: center;
  }

  .modal-overlay.open { display: flex; }

  .modal {
    background: #fff;
    border-radius: 12px;
    padding: 2rem;
    width: min(480px, 90vw);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal h2 { font-size: 1.2rem; }

  .modal-notice {
    font-size: 0.8rem;
    color: #ef4444;
    background: #fef2f2;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
  }

  .modal form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal label {
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
  }

  .char-count { font-weight: 400; color: #9ca3af; }

  .modal input,
  .modal textarea,
  .modal select {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: var(--font);
    resize: vertical;
  }

  .modal input:focus,
  .modal textarea:focus,
  .modal select:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .modal-actions button {
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
  }

  #closeModalBtn { background: #f3f4f6; color: #374151; }
  #submitBtn { background: #f59e0b; color: #fff; }
  #submitBtn:disabled { background: #d1d5db; cursor: not-allowed; }

  /* ===== 반응형 ===== */
  @media (max-width: 640px) {
    .board { padding: 1rem; gap: 1rem; }
    .toolbar { padding: 0.75rem 1rem; }
  }
  ```

- [ ] **Step 2: 브라우저에서 스타일 확인**

  `http://localhost:3000` 새로고침.
  확인 항목:
  - 헤더가 어두운 배경으로 표시됨
  - 필터 버튼이 pill 형태로 표시됨
  - "팁 올리기" 버튼이 주황색으로 표시됨
  - "팁 올리기" 클릭 시 아직 모달이 열리지 않음 (app.js 미완성)

- [ ] **Step 3: 커밋**

  ```bash
  git add style.css
  git commit -m "feat: add post-it board styles"
  ```

---

## Task 4: app.js — API 연동 & 카드 렌더링

**Files:**
- Create: `app.js`

- [ ] **Step 1: app.js 기본 구조 + fetchTips 작성**

  ```javascript
  // app.js
  const COLORS = ['yellow', 'green', 'blue', 'pink'];
  let allTips = [];
  let activeTag = '전체';

  async function fetchTips() {
    const board = document.getElementById('board');
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      if (!res.ok) throw new Error('fetch failed');
      const { tips } = await res.json();
      allTips = tips.reverse(); // 최신순
      renderCards(allTips);
    } catch (err) {
      board.innerHTML = '<p class="loading">팁을 불러오지 못했어요. 잠시 후 새로고침 해주세요.</p>';
      console.error(err);
    }
  }

  function renderCards(tips) {
    const board = document.getElementById('board');
    if (tips.length === 0) {
      board.innerHTML = '<p class="loading">아직 등록된 팁이 없어요. 첫 번째 팁을 올려보세요! 🎉</p>';
      return;
    }
    board.innerHTML = tips.map((tip, i) => createCardHTML(tip, i)).join('');
    attachLikeListeners();
  }

  function createCardHTML(tip, index) {
    const color = COLORS[index % COLORS.length];
    const likedIds = getLikedIds();
    const isLiked = likedIds.includes(String(tip.id));
    return `
      <div class="card" data-id="${tip.id}" data-color="${color}">
        <div class="card-title">${escapeHtml(tip.title)}</div>
        <div class="card-body">${escapeHtml(tip.body)}</div>
        <div class="card-footer">
          <span class="card-tag">#${escapeHtml(tip.tag)}</span>
          <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${tip.id}" ${isLiked ? 'disabled' : ''}>
            👍 ${tip.likes}
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  ```

- [ ] **Step 2: 필터링 함수 추가**

  `app.js` 하단에 추가:

  ```javascript
  function filterCards(tag) {
    activeTag = tag;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tag === tag);
    });
    const filtered = tag === '전체' ? allTips : allTips.filter(t => t.tag === tag);
    renderCards(filtered);
  }

  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (btn) filterCards(btn.dataset.tag);
  });
  ```

- [ ] **Step 3: 좋아요 함수 추가**

  ```javascript
  function getLikedIds() {
    return JSON.parse(localStorage.getItem('likedTips') || '[]');
  }

  function addLikedId(id) {
    const ids = getLikedIds();
    ids.push(String(id));
    localStorage.setItem('likedTips', JSON.stringify(ids));
  }

  function attachLikeListeners() {
    document.querySelectorAll('.like-btn:not(.liked)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        btn.disabled = true;
        btn.classList.add('liked');
        try {
          await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'like', id })
          });
          addLikedId(id);
          const tip = allTips.find(t => t.id === id);
          if (tip) { tip.likes += 1; }
          btn.textContent = `👍 ${(parseInt(btn.textContent.replace('👍', '')) || 0) + 1}`;
        } catch {
          btn.disabled = false;
          btn.classList.remove('liked');
        }
      });
    });
  }
  ```

- [ ] **Step 4: 모달 & 제출 함수 추가**

  ```javascript
  const modalOverlay = document.getElementById('modalOverlay');

  document.getElementById('openModalBtn').addEventListener('click', () => {
    modalOverlay.classList.add('open');
  });

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    modalOverlay.classList.remove('open');
    document.getElementById('tipForm').reset();
    document.getElementById('titleCount').textContent = '0/20';
    document.getElementById('bodyCount').textContent = '0/200';
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) document.getElementById('closeModalBtn').click();
  });

  document.getElementById('titleInput').addEventListener('input', (e) => {
    document.getElementById('titleCount').textContent = `${e.target.value.length}/20`;
  });

  document.getElementById('bodyInput').addEventListener('input', (e) => {
    document.getElementById('bodyCount').textContent = `${e.target.value.length}/200`;
  });

  document.getElementById('tipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '게시 중...';

    const payload = {
      action: 'submit',
      title: document.getElementById('titleInput').value.trim(),
      body: document.getElementById('bodyInput').value.trim(),
      tag: document.getElementById('tagSelect').value
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      document.getElementById('closeModalBtn').click();
      await fetchTips(); // 목록 갱신
    } catch {
      alert('게시에 실패했어요. 다시 시도해주세요.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '게시하기';
    }
  });

  // 초기 로드
  fetchTips();
  ```

- [ ] **Step 5: 동작 확인**

  `http://localhost:3000` 새로고침.
  확인 항목:
  - 로딩 메시지 표시 후 팁 목록 렌더링 (Sheets에 테스트 데이터 1행 수동 입력 후 확인)
  - 팁 올리기 버튼 클릭 → 모달 오픈
  - 제목 입력 시 글자 수 카운터 작동
  - 모달 오버레이 클릭 시 닫힘
  - 팁 제출 후 목록 자동 갱신 확인
  - 좋아요 클릭 후 버튼 비활성화, 새로고침 후에도 비활성 유지

- [ ] **Step 6: 커밋**

  ```bash
  git add app.js
  git commit -m "feat: add tip fetch, render, like, and submit logic"
  ```

---

## Task 5: Vercel 배포 설정

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json 작성**

  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
        ]
      },
      {
        "source": "/style.css",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }]
      },
      {
        "source": "/app.js",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }]
      }
    ]
  }
  ```

- [ ] **Step 2: .gitignore 생성**

  ```
  .vercel
  node_modules
  ```

  ```bash
  git add vercel.json .gitignore
  git commit -m "chore: add Vercel config and gitignore"
  ```

---

## Task 6: Git 초기화 & Vercel 배포

**Files:**
- 기존 파일 전체

- [ ] **Step 1: Git 저장소 초기화 (아직 안 한 경우)**

  ```bash
  git init
  git add .
  git commit -m "feat: initial project setup"
  ```

- [ ] **Step 2: GitHub 저장소 연결**

  GitHub에서 `claude-tips-board` 새 레포 생성 (Private 권장) 후:

  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/claude-tips-board.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **Step 3: Vercel 배포**

  Vercel CLI 설치 후:
  ```bash
  npm i -g vercel
  vercel login
  vercel deploy --prod
  ```

  또는 [vercel.com](https://vercel.com) → New Project → GitHub 레포 연결 → Deploy.

  배포 완료 후 생성된 URL 확인 (예: `https://claude-tips-board.vercel.app`).

- [ ] **Step 4: 배포된 URL에서 전체 동작 확인**

  배포 URL 접속 후 확인:
  - [ ] 팁 목록 로드됨
  - [ ] 팁 작성 모달 오픈·제출 작동
  - [ ] 좋아요 작동, 새로고침 후 유지
  - [ ] 태그 필터 작동
  - [ ] 모바일(또는 좁은 뷰포트)에서 레이아웃 깨지지 않음

- [ ] **Step 5: Apps Script CORS 허용 확인**

  배포 URL에서 팁 제출 시 CORS 오류 발생하면:
  1. Apps Script 에디터 → 배포 관리 → 기존 배포 편집
  2. 액세스 권한이 **모든 사용자**인지 재확인
  3. 새 버전으로 재배포

---

## Task 7: .claude/ 설정 파일 최종 점검

**Files:**
- Modify: `.claude/CLAUDE.md` (APPS_SCRIPT_URL 실제 값으로 업데이트)

- [ ] **Step 1: CLAUDE.md의 URL 자리표시자 업데이트**

  `.claude/CLAUDE.md` 내 `YOUR_ID` 부분을 실제 배포된 Apps Script URL로 교체.

- [ ] **Step 2: 팀 공유용 README 없는지 확인 & 최종 커밋**

  ```bash
  git add .claude/CLAUDE.md
  git commit -m "chore: update Apps Script URL in CLAUDE.md"
  git push
  ```

---

## 완료 기준

- [ ] Vercel URL에서 팁 목록 조회 가능
- [ ] 익명 팁 제출 → Google Sheets에 행 추가 확인
- [ ] 좋아요 클릭 → Sheets likes 컬럼 값 증가 확인
- [ ] 태그 필터 클릭 시 해당 태그 팁만 표시
- [ ] `/tip-write`, `/tip-summary`, `/board-ops` Claude Code 스킬 동작 확인
- [ ] `board-manager` 에이전트 WRITE/REPORT 모드 전환 동작 확인
