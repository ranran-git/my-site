"use strict";

// お知らせデータの置き場所
const DATA_URL = "data/news.json";
// 掲載日からこの日数以内なら「NEW」を表示する
const NEW_DAYS = 7;
// 強調表示するカテゴリ
const IMPORTANT_CATEGORY = "重要";
const ALL = "すべて";

const listEl = document.getElementById("news-list");
const statusEl = document.getElementById("status");
const filtersEl = document.getElementById("filters");

let allItems = [];
let currentCategory = ALL;

// フッターの年
document.getElementById("year").textContent = new Date().getFullYear();

// ---- テーマ切り替え（選択はブラウザに保存。保存できない環境でも動作する） ----
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

// ---- 日付の処理 ----
// "YYYY-MM-DD" をローカル時刻の日付として読む（不正な値は null）
function parseDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1) return null; // 2月30日などを除外
  return d;
}

function formatDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function isNew(d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today - d) / (24 * 60 * 60 * 1000);
  return diffDays >= 0 && diffDays < NEW_DAYS;
}

// http / https のリンクだけ許可する
function safeUrl(text) {
  try {
    const url = new URL(text, location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch (e) {
    return null;
  }
}

// ---- 表示 ----
// データは必ず textContent で入れる（HTML として解釈させない）
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderItem(item) {
  const li = el("li", "news-item");
  const details = el("details");
  const summary = el("summary");

  summary.append(el("time", "news-date", formatDate(item.dateObj)));
  summary.lastChild.dateTime = item.date;

  if (item.category) {
    const cls = item.category === IMPORTANT_CATEGORY ? "badge badge-important" : "badge";
    summary.append(el("span", cls, item.category));
  }
  if (isNew(item.dateObj)) {
    summary.append(el("span", "badge badge-new", "NEW"));
  }
  summary.append(el("span", "news-title", item.title));
  details.append(summary);

  if (item.body) {
    details.append(el("p", "news-body", item.body));
  }
  const url = item.link ? safeUrl(item.link) : null;
  if (url) {
    const a = el("a", "news-link", item.linkText || "詳細を見る");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    details.append(a);
  }

  li.append(details);
  return li;
}

function renderList() {
  const items = currentCategory === ALL
    ? allItems
    : allItems.filter((item) => item.category === currentCategory);

  listEl.replaceChildren(...items.map(renderItem));
  statusEl.textContent = items.length === 0 ? "お知らせはありません。" : "";
}

function renderFilters() {
  const categories = [ALL, ...new Set(allItems.map((item) => item.category).filter(Boolean))];
  filtersEl.replaceChildren(...categories.map((category) => {
    const button = el("button", "filter-button", category);
    button.type = "button";
    button.setAttribute("aria-pressed", String(category === currentCategory));
    button.addEventListener("click", () => {
      currentCategory = category;
      renderFilters();
      renderList();
    });
    return button;
  }));
}

// ---- 読み込み ----
async function load() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("データの形式が配列ではありません");

    allItems = data
      .map((item) => ({ ...item, dateObj: parseDate(item.date) }))
      // 日付とタイトルがそろっているものだけ表示する
      .filter((item) => item.dateObj && typeof item.title === "string" && item.title !== "")
      // 新しい順（同じ日付なら id の降順）
      .sort((a, b) => (b.dateObj - a.dateObj) || String(b.id).localeCompare(String(a.id)));

    renderFilters();
    renderList();
  } catch (e) {
    console.error(e);
    statusEl.textContent = location.protocol === "file:"
      ? "お知らせを読み込めませんでした。ファイルを直接開くと読み込めません。README の「ローカルで確認する」の手順で確認してください。"
      : "お知らせを読み込めませんでした。時間をおいて再度お試しください。";
  }
}

load();
