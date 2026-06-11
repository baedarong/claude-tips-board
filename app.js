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
    await fetchTips();
  } catch {
    alert('게시에 실패했어요. 다시 시도해주세요.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '게시하기';
  }
});

// 초기 로드
fetchTips();
