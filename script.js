// フッターの年を自動で表示
document.getElementById("year").textContent = new Date().getFullYear();

// テーマ切り替え（選択はブラウザに保存。保存できない環境でも動作する）
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function loadTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {
    // 保存領域が使えない場合は無視
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

applyTheme(loadTheme());

themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {
    // 保存できなくても切り替え自体は行う
  }
});

// カウンターのデモ
let count = 0;
const countEl = document.getElementById("count");
document.getElementById("count-button").addEventListener("click", () => {
  count += 1;
  countEl.textContent = count;
});
