import { LaunchItem } from "../shared/types";

const inputElement = document.getElementById(
  "search-input"
) as HTMLInputElement | null;
const listElement = document.getElementById(
  "result-list"
) as HTMLUListElement | null;
const statusElement = document.getElementById(
  "status-text"
) as HTMLDivElement | null;

if (!inputElement || !listElement || !statusElement) {
  throw new Error("Renderer failed to initialize: required DOM not found");
}

const input = inputElement;
const list = listElement;
const statusText = statusElement;

let items: LaunchItem[] = [];
let selectedIndex = 0;
let currentQuery = "";
let latestSearchToken = 0;

function setStatus(message: string): void {
  statusText.textContent = message;
}

function normalizeType(type: LaunchItem["type"]): string {
  if (type === "application") {
    return "App";
  }
  if (type === "folder") {
    return "Folder";
  }
  if (type === "file") {
    return "File";
  }
  if (type === "web") {
    return "Web";
  }
  return "Command";
}

function clearList(): void {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
}

function renderList(): void {
  clearList();

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-item";
    empty.textContent = "没有匹配结果";
    list.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "result-item";
    if (index === selectedIndex) {
      row.classList.add("active");
    }
    row.dataset.index = String(index);

    const header = document.createElement("div");
    header.className = "result-header";

    const title = document.createElement("span");
    title.className = "result-title";
    title.textContent = item.title;

    const type = document.createElement("span");
    type.className = "result-type";
    type.textContent = normalizeType(item.type);

    header.append(title, type);

    const subtitle = document.createElement("div");
    subtitle.className = "result-subtitle";
    subtitle.textContent = item.subtitle;

    row.append(header, subtitle);

    row.addEventListener("mouseenter", () => {
      selectedIndex = index;
      renderList();
    });

    row.addEventListener("click", () => {
      selectedIndex = index;
      void executeSelected();
    });

    list.appendChild(row);
  });
}

function moveSelection(delta: number): void {
  if (items.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + delta + items.length) % items.length;
  renderList();
}

async function updateResults(query: string): Promise<void> {
  const token = ++latestSearchToken;

  try {
    if (!query.trim()) {
      items = await window.launcher.getInitialItems();
      if (token !== latestSearchToken) {
        return;
      }
      selectedIndex = 0;
      renderList();
      setStatus("显示最近使用项");
      return;
    }

    items = await window.launcher.search(query);
    if (token !== latestSearchToken) {
      return;
    }
    selectedIndex = 0;
    renderList();
    setStatus(`匹配 ${items.length} 项`);
  } catch {
    setStatus("搜索失败");
  }
}

async function executeSelected(): Promise<void> {
  const selected = items[selectedIndex];
  if (!selected) {
    return;
  }

  const result = await window.launcher.execute(selected);
  if (!result.ok) {
    setStatus(result.message ?? "执行失败");
    return;
  }

  setStatus(result.message ?? "已执行");
}

function registerEvents(): void {
  input.addEventListener("input", () => {
    currentQuery = input.value;
    void updateResults(currentQuery);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void executeSelected();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (input.value.trim()) {
        input.value = "";
        currentQuery = "";
        void updateResults("");
      } else {
        void window.launcher.hide();
      }
    }
  });

  window.launcher.onFocusInput(() => {
    input.focus();
    input.select();
  });

  window.launcher.onOpenPanel((panel) => {
    if (panel === "clip") {
      setStatus("剪贴板历史视图待实现");
      return;
    }
    if (panel === "settings") {
      setStatus("设置页面待实现");
    }
  });
}

function bootstrap(): void {
  registerEvents();
  input.focus();
  void updateResults("");
}

bootstrap();
