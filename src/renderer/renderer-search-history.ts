const searchHistoryKey = "litelauncher.search-history.v1";
let searchHistoryEntries: string[] = [];
let searchHistoryTimer: ReturnType<typeof setTimeout> | undefined;
try {
  const saved: unknown = JSON.parse(localStorage.getItem(searchHistoryKey) || "[]");
  if (Array.isArray(saved)) searchHistoryEntries = saved.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 50);
} catch { /* A damaged or unavailable store must not interrupt search. */ }

function saveSearchHistory(): void {
  try { localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryEntries)); } catch { /* Search remains available. */ }
  renderSearchHistory();
}

function rememberSearchHistory(query: string): void {
  clearTimeout(searchHistoryTimer);
  const value = query.trim();
  if (!value || value.length > 500) return;
  searchHistoryEntries = [value, ...searchHistoryEntries.filter(item => item.toLocaleLowerCase() !== value.toLocaleLowerCase())].slice(0, 50);
  saveSearchHistory();
}

function scheduleSearchHistory(query: string): void {
  clearTimeout(searchHistoryTimer);
  if (mode !== "search" || !query.trim()) return;
  searchHistoryTimer = setTimeout(() => {
    if (mode === "search" && input.value.trim() === query.trim()) rememberSearchHistory(query);
  }, 1500);
}

function renderSearchHistory(): void {
  const list = document.getElementById("search-history-list");
  if (!list) return;
  list.replaceChildren();
  if (!searchHistoryEntries.length) {
    list.textContent = "暂无搜索历史，搜索后会显示在这里。";
  }
  for (const query of searchHistoryEntries) {
    const row = document.createElement("div");
    row.className = "search-history-item";
    const replay = document.createElement("button");
    replay.type = "button";
    replay.textContent = query;
    replay.title = `重新搜索：${query}`;
    replay.addEventListener("click", () => {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `删除搜索记录：${query}`);
    remove.addEventListener("click", () => {
      clearTimeout(searchHistoryTimer);
      searchHistoryEntries = searchHistoryEntries.filter(item => item !== query);
      saveSearchHistory();
    });
    row.append(replay, remove);
    list.appendChild(row);
  }
  const clear = document.getElementById("search-history-clear") as HTMLButtonElement | null;
  if (clear) clear.disabled = !searchHistoryEntries.length;
}

document.getElementById("search-history-clear")?.addEventListener("click", () => {
  clearTimeout(searchHistoryTimer);
  searchHistoryEntries = [];
  saveSearchHistory();
});
renderSearchHistory();
