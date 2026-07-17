(() => {
  type DictionaryEntry = {
    word: string;
    phonetic: string;
    translation: string;
    definition: string;
    pos: string;
    tags: string;
  };

  type SelectionPopupPayload =
    | {
        mode: "dictionary";
        sourceText: string;
        entry: DictionaryEntry;
        candidates?: DictionaryEntry[];
      }
    | {
        mode: "translate";
        sourceText: string;
        translatedText: string;
      }
    | {
        mode: "empty" | "error";
        message: string;
      };

  type SelectionPopupApi = {
    close: () => Promise<boolean>;
    copyText: (text: string) => Promise<boolean>;
    getPayload: () => Promise<SelectionPopupPayload | null>;
    onPayload: (listener: (payload: SelectionPopupPayload) => void) => () => void;
  };

  const titleEl = document.getElementById("title");
  const bodyEl = document.getElementById("body");
  const copyBtn = document.getElementById("copyBtn");
  const closeBtn = document.getElementById("closeBtn");
  const closeFootBtn = document.getElementById("closeFootBtn");

  let copyTextValue = "";
  let activeDictionaryPayload:
    | Extract<SelectionPopupPayload, { mode: "dictionary" }>
    | null = null;

  function escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderDictionaryEntry(entry: DictionaryEntry): string {
    return `
      <div class="selection-popup__word">${escapeHtml(entry.word)}</div>
      ${
        entry.phonetic
          ? `<div class="selection-popup__phonetic">/${escapeHtml(entry.phonetic)}/</div>`
          : ""
      }
      <div class="selection-popup__meta">
        ${escapeHtml([entry.pos, entry.tags].filter(Boolean).join(" · "))}
      </div>
      ${
        entry.translation
          ? `<div class="selection-popup__section">
              <div class="selection-popup__label">中文释义</div>
              <div class="selection-popup__text">${escapeHtml(entry.translation)}</div>
            </div>`
          : ""
      }
      ${
        entry.definition
          ? `<div class="selection-popup__section">
              <div class="selection-popup__label">英文释义</div>
              <div class="selection-popup__text">${escapeHtml(entry.definition)}</div>
            </div>`
          : ""
      }
    `;
  }

  function renderDictionaryCandidates(
    entry: DictionaryEntry,
    candidates: DictionaryEntry[] | undefined
  ): string {
    const others = (candidates ?? []).filter((item) => item.word !== entry.word).slice(0, 6);
    if (others.length === 0) {
      return "";
    }
    return `
      <div class="selection-popup__section">
        <div class="selection-popup__label">其他释义</div>
        <div class="selection-popup__candidates">
          ${others
            .map(
              (item) => `
            <button type="button" class="selection-popup__candidate" data-word="${escapeHtml(
              item.word
            )}">
              <span class="selection-popup__candidate-word">${escapeHtml(item.word)}</span>
              <span class="selection-popup__candidate-preview">${escapeHtml(
                item.translation.split("\n")[0]?.trim() || ""
              )}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function setActiveDictionaryEntry(entry: DictionaryEntry): void {
    if (!activeDictionaryPayload || !bodyEl || !titleEl) {
      return;
    }
    activeDictionaryPayload = {
      ...activeDictionaryPayload,
      entry,
      candidates: activeDictionaryPayload.candidates
    };
    copyTextValue = [entry.word, entry.phonetic, entry.translation, entry.definition]
      .filter(Boolean)
      .join("\n");
    const isChinese = /[\u3400-\u9fff]/.test(activeDictionaryPayload.sourceText);
    titleEl.textContent = isChinese ? "词典 · 中→英" : "词典 · 英→中";
    bodyEl.innerHTML =
      renderDictionaryEntry(entry) +
      renderDictionaryCandidates(entry, activeDictionaryPayload.candidates);
    bindCandidateClicks();
  }

  function bindCandidateClicks(): void {
    if (!bodyEl || !activeDictionaryPayload) {
      return;
    }
    bodyEl.querySelectorAll<HTMLButtonElement>(".selection-popup__candidate").forEach((button) => {
      button.addEventListener("click", () => {
        const word = button.dataset.word ?? "";
        const next = (activeDictionaryPayload?.candidates ?? []).find(
          (item) => item.word === word
        );
        if (next) {
          setActiveDictionaryEntry(next);
        }
      });
    });
  }

  function renderPayload(payload: SelectionPopupPayload | null): void {
    if (!bodyEl || !titleEl) {
      return;
    }

    if (!payload) {
      titleEl.textContent = "划词翻译";
      bodyEl.innerHTML = `<div class="selection-popup__message">等待结果…</div>`;
      copyTextValue = "";
      activeDictionaryPayload = null;
      return;
    }

    if (payload.mode === "dictionary") {
      activeDictionaryPayload = payload;
      const isChinese = /[\u3400-\u9fff]/.test(payload.sourceText);
      titleEl.textContent = isChinese ? "词典 · 中→英" : "词典 · 英→中";
      setActiveDictionaryEntry(payload.entry);
      // Keep direction label after setActiveDictionaryEntry overwrites title.
      titleEl.textContent = isChinese ? "词典 · 中→英" : "词典 · 英→中";
      return;
    }

    activeDictionaryPayload = null;

    if (payload.mode === "translate") {
      titleEl.textContent = "翻译";
      copyTextValue = payload.translatedText;
      bodyEl.innerHTML = `
      <div class="selection-popup__section">
        <div class="selection-popup__label">原文</div>
        <div class="selection-popup__text selection-popup__source">${escapeHtml(
          payload.sourceText
        )}</div>
      </div>
      <div class="selection-popup__section">
        <div class="selection-popup__label">译文</div>
        <div class="selection-popup__text">${escapeHtml(payload.translatedText)}</div>
      </div>
    `;
      return;
    }

    titleEl.textContent = payload.mode === "error" ? "出错了" : "划词翻译";
    copyTextValue = "";
    bodyEl.innerHTML = `<div class="selection-popup__message">${escapeHtml(
      payload.message
    )}</div>`;
  }

  async function bootstrap(): Promise<void> {
    const api = (window as Window & { selectionPopup?: SelectionPopupApi }).selectionPopup;
    if (!api) {
      renderPayload({
        mode: "error",
        message: "划词弹窗桥接不可用。"
      });
      return;
    }

    closeBtn?.addEventListener("click", () => {
      void api.close();
    });
    closeFootBtn?.addEventListener("click", () => {
      void api.close();
    });
    copyBtn?.addEventListener("click", () => {
      if (!copyTextValue.trim()) {
        return;
      }
      void api.copyText(copyTextValue);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void api.close();
      }
    });

    api.onPayload((payload) => {
      renderPayload(payload);
    });

    const initial = await api.getPayload();
    renderPayload(initial);
  }

  void bootstrap();
})();
