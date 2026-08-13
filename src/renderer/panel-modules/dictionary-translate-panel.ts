namespace RendererPanelRuntime {

  export interface TranslateToolPanelData {
    settings: {
      baiduAppId: string;
      baiduSecret: string;
      baiduEngine: "standard" | "llm";
      baiduApiKey: string;
    };
    statusMessage: string;
  }

  export const DEFAULT_TRANSLATE_TOOL_PANEL_DATA: TranslateToolPanelData = {
    settings: {
      baiduAppId: "",
      baiduSecret: "",
      baiduEngine: "standard",
      baiduApiKey: ""
    },
    statusMessage: "粘贴或输入文字，翻译为中文（英译中，使用百度翻译）。"
  };

  export let translateToolPanelData: TranslateToolPanelData = {
    settings: { ...DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings },
    statusMessage: DEFAULT_TRANSLATE_TOOL_PANEL_DATA.statusMessage
  };

  export let translateToolPanelView: "main" | "settings" = "main";

  export let translateToolSourceText = "";

  export let translateToolResultText = "";

  export let translateToolDictionaryEntry: {
    word: string;
    phonetic: string;
    translation: string;
    definition: string;
    pos: string;
    tags: string;
  } | null = null;

  export let selectionTranslateSettingsState = {
    enabled: true,
    hotkey: "F4",
    restoreClipboard: true,
    dismissOnOutsideClick: true
  };

  export type DictionaryPanelEntry = {
    word: string;
    phonetic: string;
    translation: string;
    definition: string;
    pos: string;
    tags: string;
    exchange?: string;
  };

  export let dictionaryQueryText = "";

  export let dictionaryPanelEntry: DictionaryPanelEntry | null = null;

  export let dictionaryPanelCandidates: DictionaryPanelEntry[] = [];

  export let dictionaryPanelStatusMessage = "输入英文单词或词组后查询。";

  export let dictionaryPanelHistoryFilter: "all" | "en" | "zh" = "all";

  export let dictionaryPanelTtsEnabled = false;

  export let dictionaryPackStatus: import("../../shared/dictionary").DictionaryPackStatus | null = null;

  export let dictionaryPackDownloadProgress: import("../../shared/dictionary").DictionaryPackDownloadProgress | null =
    null;

  export let dictionaryPanelHistory: Array<{
    word: string;
    phonetic: string;
    translationPreview: string;
    note?: string;
    savedAt: number;
  }> = [];

  export let dictionaryPanelFavorites: Array<{
    word: string;
    phonetic: string;
    translationPreview: string;
    note?: string;
    savedAt: number;
  }> = [];

  export function applyDictionaryPanelState(state: {
    history: typeof dictionaryPanelHistory;
    favorites: typeof dictionaryPanelFavorites;
    ttsEnabled?: boolean;
  }): void {
    dictionaryPanelHistory = [...state.history];
    dictionaryPanelFavorites = [...state.favorites];
    if (typeof state.ttsEnabled === "boolean") {
      dictionaryPanelTtsEnabled = state.ttsEnabled;
    }
  }

  export function formatDictionaryExchangeForPanel(exchange: string): string {
    const trimmed = exchange.trim();
    if (!trimmed) {
      return "";
    }
    return trimmed
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = /^([a-z]):(.+)$/i.exec(part);
        if (!match) {
          return part;
        }
        const kind = match[1]?.toLowerCase() ?? "";
        const value = match[2] ?? "";
        const labels: Record<string, string> = {
          p: "过去式",
          d: "过去分词",
          i: "现在分词",
          3: "第三人称",
          s: "复数",
          r: "比较级",
          t: "最高级",
          0: "原型",
          1: "原型"
        };
        const label = labels[kind];
        return label ? `${label}: ${value}` : part;
      })
      .join(" · ");
  }

  export function speakDictionaryEntry(entry: DictionaryPanelEntry): void {
    if (typeof window.speechSynthesis === "undefined") {
      setStatus("当前环境不支持系统朗读。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(entry.word);
    utterance.lang = /[\u3400-\u9fff]/.test(entry.word) ? "zh-CN" : "en-US";
    window.speechSynthesis.speak(utterance);
    setStatus(`正在朗读「${entry.word}」。`);
  }

  export function isCurrentDictionaryEntryFavorited(): boolean {
    if (!dictionaryPanelEntry) {
      return false;
    }
    const key = dictionaryPanelEntry.word.trim().toLowerCase();
    return dictionaryPanelFavorites.some(
      (item) => item.word.trim().toLowerCase() === key
    );
  }

  export function formatDictionaryBookmarkTime(savedAt: number): string {
    return new Date(savedAt).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  export async function hydrateDictionaryPanelState(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.getDictionaryPanelState) {
      return;
    }
    try {
      const state = await launcher.getDictionaryPanelState();
      applyDictionaryPanelState(state);
    } catch (error) {
      console.warn("[dictionary] load panel state failed", error);
    }
  }

  export async function exportDictionaryFavoritesFromPanel(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.exportDictionaryFavoritesCsv) {
      setStatus("导出接口不可用，请重启应用后重试。");
      return;
    }
    if (dictionaryPanelFavorites.length === 0) {
      setStatus("当前没有收藏词条可导出。");
      return;
    }
    setStatus("正在导出收藏 CSV…");
    try {
      const result = await launcher.exportDictionaryFavoritesCsv();
      setStatus(result.message);
    } catch (error) {
      console.warn("[dictionary] export favorites failed", error);
      setStatus("导出收藏失败，请稍后重试。");
    }
  }

  export async function setDictionaryPanelTtsEnabled(enabled: boolean): Promise<void> {
    const launcher = getLauncherApi();
    dictionaryPanelTtsEnabled = enabled;
    if (!launcher?.setDictionaryTtsEnabled) {
      return;
    }
    try {
      const state = await launcher.setDictionaryTtsEnabled(enabled);
      applyDictionaryPanelState(state);
      setStatus(enabled ? "已开启查词后朗读。" : "已关闭查词后朗读。");
    } catch (error) {
      console.warn("[dictionary] set tts failed", error);
      setStatus("更新朗读设置失败，请稍后重试。");
    }
  }

  export function formatDictionaryPackDownloadProgress(
    progress: import("../../shared/dictionary").DictionaryPackDownloadProgress
  ): string {
    const receivedMb = (progress.received / (1024 * 1024)).toFixed(1);
    if (progress.total && progress.total > 0) {
      const totalMb = (progress.total / (1024 * 1024)).toFixed(1);
      const percent = Math.min(100, Math.round((progress.received / progress.total) * 100));
      return `已下载 ${receivedMb} / ${totalMb} MB（${percent}%）`;
    }
    return `已下载 ${receivedMb} MB`;
  }

  export function buildDictionaryPackStatusText(
    status: import("../../shared/dictionary").DictionaryPackStatus | null
  ): string {
    if (!status) {
      return "词典词库状态未知";
    }
    if (status.tier === "full") {
      return status.usingUserPack
        ? `完整词库（约 ${Math.round(status.entryCount / 1000)}k 词，含 FTS 中译英加速）`
        : "安装包已含完整词库";
    }
    if (status.tier === "seed") {
      return "种子词库（约 7k 词，覆盖中考/四六级常用词）";
    }
    return `当前词库约 ${status.entryCount} 词`;
  }

  export function buildDictionaryPackStatusHint(
    status: import("../../shared/dictionary").DictionaryPackStatus | null
  ): string {
    if (!status) {
      return "完整词库约 160MB，按需下载到本机用户目录";
    }
    if (status.packPath) {
      return `路径：${status.packPath}`;
    }
    if (status.tier === "seed") {
      return "可在下方下载完整词库（约 160MB，含全量词条和 FTS 索引）";
    }
    return "完整词库约 160MB，按需下载到本机用户目录";
  }

  export async function hydrateDictionaryPackStatus(): Promise<
    import("../../shared/dictionary").DictionaryPackStatus | null
  > {
    const launcher = getLauncherApi();
    if (!launcher?.getDictionaryPackStatus) {
      return null;
    }
    try {
      dictionaryPackStatus = await launcher.getDictionaryPackStatus();
      return dictionaryPackStatus;
    } catch (error) {
      console.warn("[dictionary] pack status failed", error);
      return null;
    }
  }

  export async function downloadDictionaryPackFromPanel(
    downloadButton: HTMLButtonElement,
    progressWrap?: HTMLElement,
    progressBar?: HTMLProgressElement,
    progressText?: HTMLElement
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.downloadDictionaryPack) {
      setStatus("词典下载接口不可用，请重启应用后重试。");
      return;
    }
    const previous = downloadButton.textContent ?? "下载完整词库";
    const stopProgress =
      launcher.onDictionaryPackDownloadProgress?.((progress) => {
        dictionaryPackDownloadProgress = progress;
        if (progressBar) {
          if (progress.total && progress.total > 0) {
            progressBar.max = progress.total;
            progressBar.value = progress.received;
          } else {
            progressBar.removeAttribute("value");
          }
        }
        if (progressText) {
          progressText.textContent = formatDictionaryPackDownloadProgress(progress);
        }
        if (progressWrap) {
          progressWrap.hidden = false;
        }
      }) ?? (() => undefined);
    downloadButton.disabled = true;
    downloadButton.textContent = "下载中…";
    if (progressWrap) {
      progressWrap.hidden = false;
    }
    if (progressText) {
      progressText.textContent = "正在连接…";
    }
    setStatus("正在下载完整词库，请稍候…");
    try {
      const result = await launcher.downloadDictionaryPack();
      setStatus(result.message);
      if (result.ok) {
        dictionaryPackDownloadProgress = null;
        await hydrateDictionaryPackStatus();
        if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
          renderList();
        }
      }
    } catch (error) {
      console.warn("[dictionary] download pack failed", error);
      setStatus("下载完整词库失败，请稍后重试。");
    } finally {
      stopProgress();
      downloadButton.disabled = false;
      downloadButton.textContent = previous;
      if (progressWrap) {
        progressWrap.hidden = true;
      }
      dictionaryPackDownloadProgress = null;
    }
  }

  export function renderDictionaryBookmarkList(
    container: HTMLElement,
    items: typeof dictionaryPanelHistory,
    options: {
      emptyText: string;
      removeLabel: string;
      onSelect: (word: string) => void;
      onRemove: (word: string) => void;
    }
  ): void {
    container.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dictionary-word-empty";
      empty.textContent = options.emptyText;
      container.appendChild(empty);
      return;
    }

    for (const item of items) {
      const row = document.createElement("article");
      row.className = "dictionary-word-row";

      const mainButton = document.createElement("button");
      mainButton.type = "button";
      mainButton.className = "dictionary-word-row-main";
      const wordEl = document.createElement("div");
      wordEl.className = "dictionary-word-row-word";
      wordEl.textContent = item.word;
      const previewEl = document.createElement("div");
      previewEl.className = "dictionary-word-row-preview";
      previewEl.textContent =
        item.note?.trim()
          ? item.note.trim()
          : item.translationPreview || item.phonetic
            ? [item.phonetic ? `/${item.phonetic}/` : "", item.translationPreview]
                .filter(Boolean)
                .join(" · ")
            : "点击再次查询";
      const timeEl = document.createElement("div");
      timeEl.className = "dictionary-word-row-time";
      timeEl.textContent = formatDictionaryBookmarkTime(item.savedAt);
      mainButton.append(wordEl, previewEl, timeEl);
      mainButton.addEventListener("click", () => {
        options.onSelect(item.word);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "dictionary-word-row-remove";
      removeButton.textContent = options.removeLabel;
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        void options.onRemove(item.word);
      });

      row.append(mainButton, removeButton);
      container.appendChild(row);
    }
  }

  export async function lookupDictionaryWordFromPanel(
    form: HTMLFormElement,
    word: string
  ): Promise<void> {
    dictionaryQueryText = word;
    const input = form.querySelector<HTMLInputElement>("#dictionary-query");
    if (input) {
      input.value = word;
    }
    await runDictionaryPanelLookup(form);
  }

  export async function toggleDictionaryPanelFavorite(form: HTMLFormElement): Promise<void> {
    if (!dictionaryPanelEntry) {
      setStatus("请先查询一个词再收藏。");
      return;
    }
    const launcher = getLauncherApi();
    if (!launcher?.toggleDictionaryFavorite) {
      setStatus("收藏功能不可用，请重启应用后重试。");
      return;
    }
    try {
      const state = await launcher.toggleDictionaryFavorite({
        word: dictionaryPanelEntry.word,
        entry: dictionaryPanelEntry
      });
      applyDictionaryPanelState(state);
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
      setStatus(
        isCurrentDictionaryEntryFavorited()
          ? `已收藏「${dictionaryPanelEntry.word}」。`
          : `已取消收藏「${dictionaryPanelEntry.word}」。`
      );
    } catch (error) {
      console.warn("[dictionary] toggle favorite failed", error);
      setStatus("收藏操作失败，请稍后重试。");
    }
  }

  export async function removeDictionaryPanelHistoryItem(
    form: HTMLFormElement,
    word: string
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.removeDictionaryHistoryItem) {
      return;
    }
    try {
      const state = await launcher.removeDictionaryHistoryItem(word);
      applyDictionaryPanelState(state);
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
      setStatus(`已移除历史记录「${word}」。`);
    } catch (error) {
      console.warn("[dictionary] remove history failed", error);
      setStatus("移除历史失败，请稍后重试。");
    }
  }

  export async function clearDictionaryPanelHistory(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.clearDictionaryHistory) {
      return;
    }
    try {
      const state = await launcher.clearDictionaryHistory();
      applyDictionaryPanelState(state);
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
      setStatus("已清空查询历史。");
    } catch (error) {
      console.warn("[dictionary] clear history failed", error);
      setStatus("清空历史失败，请稍后重试。");
    }
  }

  export async function removeDictionaryPanelFavorite(
    form: HTMLFormElement,
    word: string
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.removeDictionaryFavorite) {
      return;
    }
    try {
      const state = await launcher.removeDictionaryFavorite(word);
      applyDictionaryPanelState(state);
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
      setStatus(`已取消收藏「${word}」。`);
    } catch (error) {
      console.warn("[dictionary] remove favorite failed", error);
      setStatus("取消收藏失败，请稍后重试。");
    }
  }

  export async function saveDictionaryFavoriteNote(
    form: HTMLFormElement,
    word: string,
    note: string
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.updateDictionaryFavoriteNote) {
      setStatus("收藏备注不可用，请重启应用后重试。");
      return;
    }
    try {
      const state = await launcher.updateDictionaryFavoriteNote({ word, note });
      applyDictionaryPanelState(state);
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
      setStatus(`已更新「${word}」的收藏备注。`);
    } catch (error) {
      console.warn("[dictionary] update favorite note failed", error);
      setStatus("更新收藏备注失败，请稍后重试。");
    }
  }

  export function populateDictionaryEntryCard(
    card: HTMLElement,
    entry: DictionaryPanelEntry
  ): void {
    card.replaceChildren();
    const wordEl = document.createElement("div");
    wordEl.className = "translate-dictionary-card__word";
    wordEl.textContent = entry.word;
    card.appendChild(wordEl);
    if (entry.phonetic) {
      const phoneticEl = document.createElement("div");
      phoneticEl.className = "translate-dictionary-card__phonetic";
      phoneticEl.textContent = `/${entry.phonetic}/`;
      card.appendChild(phoneticEl);
    }
    const metaText = [entry.pos, entry.tags].filter(Boolean).join(" · ");
    if (metaText) {
      const metaEl = document.createElement("div");
      metaEl.className = "translate-dictionary-card__meta";
      metaEl.textContent = metaText;
      card.appendChild(metaEl);
    }
    if (entry.translation) {
      const translationLabel = document.createElement("div");
      translationLabel.className = "translate-dictionary-card__meta";
      translationLabel.textContent = "中文释义";
      const translationEl = document.createElement("div");
      translationEl.className = "translate-dictionary-card__text";
      translationEl.textContent = entry.translation;
      card.append(translationLabel, translationEl);
    }
    if (entry.definition) {
      const definitionLabel = document.createElement("div");
      definitionLabel.className = "translate-dictionary-card__meta";
      definitionLabel.textContent = "英文释义";
      definitionLabel.style.marginTop = entry.translation ? "8px" : "";
      const definitionEl = document.createElement("div");
      definitionEl.className = "translate-dictionary-card__text";
      definitionEl.textContent = entry.definition;
      card.append(definitionLabel, definitionEl);
    }
    const exchangeText = formatDictionaryExchangeForPanel(entry.exchange ?? "");
    if (exchangeText) {
      const exchangeLabel = document.createElement("div");
      exchangeLabel.className = "translate-dictionary-card__meta";
      exchangeLabel.textContent = "词形变化";
      exchangeLabel.style.marginTop = "8px";
      const exchangeEl = document.createElement("div");
      exchangeEl.className = "translate-dictionary-card__text";
      exchangeEl.textContent = exchangeText;
      card.append(exchangeLabel, exchangeEl);
    }
  }

  export function normalizeDictionaryPanelData(value: unknown): {
    query: string;
    statusMessage: string;
  } {
    const record = toRecord(value);
    return {
      query: typeof record?.query === "string" ? record.query : "",
      statusMessage:
        typeof record?.statusMessage === "string"
          ? record.statusMessage
          : dictionaryPanelStatusMessage
    };
  }

  export function isDictionaryLookupText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.length <= 64 && /^[A-Za-z][A-Za-z' \-]*$/.test(trimmed)) {
      return true;
    }
    if (!/[\u3400-\u9fff]/.test(trimmed) || trimmed.length > 32) {
      return false;
    }
    return /^[\u3400-\u9fffA-Za-z0-9\s·，、；：""''（）()《》【】…—\-]+$/.test(
      trimmed
    );
  }

  export async function runDictionaryPanelLookup(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("词典接口不可用，请重启应用后重试。");
      return;
    }
    const input = form.querySelector<HTMLInputElement>("#dictionary-query");
    const lookupButton = form.querySelector<HTMLButtonElement>(
      'button[data-action="dictionary-lookup"]'
    );
    const cardHost = form.querySelector<HTMLElement>("#dictionary-result-card");
    const text = input?.value.replace(/\r\n/g, "\n").trim() ?? "";
    dictionaryQueryText = text;

    if (!text) {
      dictionaryPanelEntry = null;
      if (cardHost) {
        cardHost.hidden = true;
        cardHost.replaceChildren();
      }
      setStatus("请输入英文单词或词组。");
      return;
    }

    if (!isDictionaryLookupText(text)) {
      dictionaryPanelEntry = null;
      if (cardHost) {
        cardHost.hidden = true;
        cardHost.replaceChildren();
      }
      setStatus("仅支持英文或中文单词/词组查询。");
      return;
    }

    if (!launcher.lookupDictionaryWord && !launcher.lookupDictionaryCandidates) {
      setStatus("词典接口不可用，请重启应用后重试。");
      return;
    }

    const previousLabel = lookupButton?.textContent ?? "查询";
    if (lookupButton) {
      lookupButton.disabled = true;
      lookupButton.textContent = "查询中…";
    }
    setStatus(`正在查询「${text}」…`);

    try {
      const candidates =
        typeof launcher.lookupDictionaryCandidates === "function"
          ? await launcher.lookupDictionaryCandidates(text, 8)
          : launcher.lookupDictionaryWord
            ? [await launcher.lookupDictionaryWord(text)].filter(
                (item): item is NonNullable<typeof item> => Boolean(item)
              )
            : [];
      const entry = candidates[0];
      if (!entry) {
        dictionaryPanelEntry = null;
        dictionaryPanelCandidates = [];
        if (cardHost) {
          cardHost.hidden = true;
          cardHost.replaceChildren();
        }
        setStatus(`离线词典未收录「${text}」，请检查拼写或尝试词组变体。`);
        return;
      }

      dictionaryPanelCandidates = candidates.map((item) => ({
        word: item.word,
        phonetic: item.phonetic,
        translation: item.translation,
        definition: item.definition,
        pos: item.pos,
        tags: item.tags,
        exchange: item.exchange
      }));
      dictionaryPanelEntry = dictionaryPanelCandidates[0] ?? null;
      if (launcher.recordDictionaryLookup && dictionaryPanelEntry) {
        try {
          const state = await launcher.recordDictionaryLookup({
            query: text,
            entry
          });
          applyDictionaryPanelState(state);
        } catch (error) {
          console.warn("[dictionary] record lookup failed", error);
        }
      }
      if (cardHost && dictionaryPanelEntry) {
        cardHost.hidden = false;
        populateDictionaryEntryCard(cardHost, dictionaryPanelEntry);
      }
      if (dictionaryPanelTtsEnabled && dictionaryPanelEntry) {
        speakDictionaryEntry(dictionaryPanelEntry);
      } else {
        setStatus(
          dictionaryPanelCandidates.length > 1
            ? `已找到「${entry.word}」，另有 ${dictionaryPanelCandidates.length - 1} 个相关词条。`
            : `已找到「${entry.word}」。`
        );
      }
      if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
        renderList();
      }
    } catch (error) {
      console.warn("[dictionary] lookup failed", error);
      dictionaryPanelEntry = null;
      dictionaryPanelCandidates = [];
      if (cardHost) {
        cardHost.hidden = true;
        cardHost.replaceChildren();
      }
      setStatus("查询失败，请稍后重试。");
    } finally {
      if (lookupButton) {
        lookupButton.disabled = false;
        lookupButton.textContent = previousLabel;
      }
    }
  }

  export async function maybeAutoRunDictionaryPanelLookup(): Promise<void> {
    if (!dictionaryQueryText.trim()) {
      return;
    }
    const form = document.querySelector<HTMLFormElement>("form.dictionary-form");
    if (!form) {
      return;
    }
    const input = form.querySelector<HTMLInputElement>("#dictionary-query");
    if (input && !input.value.trim()) {
      input.value = dictionaryQueryText;
    }
    await runDictionaryPanelLookup(form);
  }

  export function normalizeTranslateToolPanelData(value: unknown): TranslateToolPanelData {
    const record = toRecord(value);
    const settingsRecord = toRecord(record?.settings);
    return {
      settings: {
        baiduAppId:
          typeof settingsRecord?.baiduAppId === "string"
            ? settingsRecord.baiduAppId
            : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduAppId,
        baiduSecret:
          typeof settingsRecord?.baiduSecret === "string"
            ? settingsRecord.baiduSecret
            : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduSecret,
        baiduEngine:
          settingsRecord?.baiduEngine === "llm" ||
          settingsRecord?.baiduEngine === "standard"
            ? settingsRecord.baiduEngine
            : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduEngine,
        baiduApiKey:
          typeof settingsRecord?.baiduApiKey === "string"
            ? settingsRecord.baiduApiKey
            : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.settings.baiduApiKey
      },
      statusMessage:
        typeof record?.statusMessage === "string"
          ? record.statusMessage
          : DEFAULT_TRANSLATE_TOOL_PANEL_DATA.statusMessage
    };
  }

  export function openTranslateToolSettingsView(): void {
    translateToolPanelView = "settings";
    if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
      renderList();
    }
  }

  export function returnToTranslateToolMainView(): void {
    translateToolPanelView = "main";
    if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
      renderList();
    }
  }

  export async function hydrateTranslateToolPanelFromSettings(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.getTranslateToolSettings) {
      return;
    }

    try {
      const settings = await launcher.getTranslateToolSettings();
      translateToolPanelData = normalizeTranslateToolPanelData({
        ...translateToolPanelData,
        settings
      });
      if (launcher.getSelectionTranslateSettings) {
        selectionTranslateSettingsState =
          await launcher.getSelectionTranslateSettings();
      }
      if (activePluginPanel?.pluginId === WEBTOOLS_TRANSLATE_PLUGIN_ID) {
        renderList();
      }
    } catch {
      // Keep the last known panel state if settings cannot be loaded.
    }
  }

  export async function runTranslateToolPanelTranslate(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.translateToolTranslateText) {
      setStatus("翻译功能未加载，请重启 LiteLauncher。");
      return;
    }

    const sourceTextarea = form.querySelector<HTMLTextAreaElement>(
      "#webtools-translate-source"
    );
    if (!sourceTextarea) {
      return;
    }

    const text = sourceTextarea.value.replace(/\r\n/g, "\n").trim();
    if (!text) {
      setStatus("请输入要翻译的文字。");
      return;
    }

    const resultTextarea = form.querySelector<HTMLTextAreaElement>(
      "#webtools-translate-result"
    );
    const translateButton = form.querySelector<HTMLButtonElement>(
      'button[data-action="translate-run"]'
    );
    const previousLabel = translateButton?.textContent ?? "翻译";
    if (translateButton) {
      translateButton.disabled = true;
      translateButton.textContent = "翻译中…";
    }
    if (resultTextarea) {
      resultTextarea.value = "";
      resultTextarea.placeholder = "正在翻译，请稍候…";
    }

    const dictionaryCardHost = form.querySelector<HTMLElement>(
      "#webtools-translate-dictionary-card"
    );
    if (dictionaryCardHost) {
      dictionaryCardHost.hidden = true;
      dictionaryCardHost.replaceChildren();
    }
    translateToolDictionaryEntry = null;

    try {
      const formData = new FormData(form);
      if (
        text.length <= 64 &&
        (typeof launcher.lookupDictionaryCandidates === "function" ||
          typeof launcher.lookupDictionaryWord === "function")
      ) {
        const isLookupText =
          /^[A-Za-z][A-Za-z' \-]*$/.test(text) ||
          (/[\u3400-\u9fff]/.test(text) &&
            /^[\u3400-\u9fffA-Za-z0-9\s·，、；：""''（）()《》【】…—\-]+$/.test(text));
        if (isLookupText) {
          const candidates =
            typeof launcher.lookupDictionaryCandidates === "function"
              ? await launcher.lookupDictionaryCandidates(text, 1)
              : launcher.lookupDictionaryWord
                ? [await launcher.lookupDictionaryWord(text)].filter(
                    (item): item is NonNullable<typeof item> => Boolean(item)
                  )
                : [];
          const entry = candidates[0];
          if (entry) {
            translateToolDictionaryEntry = {
              word: entry.word,
              phonetic: entry.phonetic,
              translation: entry.translation,
              definition: entry.definition,
              pos: entry.pos,
              tags: entry.tags
            };
            if (dictionaryCardHost) {
              dictionaryCardHost.hidden = false;
              const wordEl = document.createElement("div");
              wordEl.className = "translate-dictionary-card__word";
              wordEl.textContent = entry.word;
              dictionaryCardHost.appendChild(wordEl);
              if (entry.phonetic) {
                const phoneticEl = document.createElement("div");
                phoneticEl.className = "translate-dictionary-card__phonetic";
                phoneticEl.textContent = `/${entry.phonetic}/`;
                dictionaryCardHost.appendChild(phoneticEl);
              }
              const metaText = [entry.pos, entry.tags].filter(Boolean).join(" · ");
              if (metaText) {
                const metaEl = document.createElement("div");
                metaEl.className = "translate-dictionary-card__meta";
                metaEl.textContent = metaText;
                dictionaryCardHost.appendChild(metaEl);
              }
              if (entry.translation) {
                const translationEl = document.createElement("div");
                translationEl.className = "translate-dictionary-card__text";
                translationEl.textContent = entry.translation;
                dictionaryCardHost.appendChild(translationEl);
              }
            }
          }
        }
      }

      const result = await launcher.translateToolTranslateText({
        text,
        appId: String(formData.get("baiduAppId") ?? "").trim() || undefined,
        secret: String(formData.get("baiduSecret") ?? "").trim() || undefined,
        apiKey: String(formData.get("baiduApiKey") ?? "").trim() || undefined,
        engine:
          formData.get("baiduEngine") === "llm"
            ? "llm"
            : formData.get("baiduEngine") === "standard"
              ? "standard"
              : undefined
      });
      translateToolSourceText = text;
      translateToolResultText = result.ok ? result.translatedText : "";
      if (resultTextarea) {
        resultTextarea.value = translateToolResultText;
        resultTextarea.placeholder = result.ok
          ? ""
          : result.message || "翻译失败，请检查百度翻译配置。";
      }
      setStatus(
        result.ok
          ? translateToolDictionaryEntry
            ? "已显示词典释义，并完成在线翻译。"
            : "翻译完成。"
          : result.message
      );
    } catch (error) {
      console.warn("[webtools-translate] translate failed", error);
      if (resultTextarea) {
        resultTextarea.placeholder = "翻译失败，请检查网络后重试。";
      }
      setStatus("翻译失败，请检查网络后重试。");
    } finally {
      if (translateButton) {
        translateButton.disabled = false;
        translateButton.textContent = previousLabel;
      }
    }
  }

  export async function saveTranslateToolSettings(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.setTranslateToolSettings) {
      setStatus("启动器桥接暂不可用。");
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    if (submitButton?.disabled) {
      return;
    }

    const formData = new FormData(form);
    const patch = {
      baiduAppId: String(formData.get("baiduAppId") ?? "").trim(),
      baiduSecret: String(formData.get("baiduSecret") ?? "").trim(),
      baiduEngine:
        formData.get("baiduEngine") === "llm" ? ("llm" as const) : ("standard" as const),
      baiduApiKey: String(formData.get("baiduApiKey") ?? "").trim()
    };
    const selectionPatch = {
      enabled: formData.get("selectionTranslateEnabled") === "on",
      hotkey: String(formData.get("selectionTranslateHotkey") ?? "").trim() || "F4",
      restoreClipboard: formData.get("selectionTranslateRestoreClipboard") === "on",
      dismissOnOutsideClick:
        formData.get("selectionTranslateDismissOutside") === "on"
    };

    const previousLabel = submitButton?.textContent ?? "保存设置";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "保存中…";
    }

    try {
      const settings = await launcher.setTranslateToolSettings(patch);
      translateToolPanelData = normalizeTranslateToolPanelData({
        ...translateToolPanelData,
        settings
      });
      if (launcher.setSelectionTranslateSettings) {
        selectionTranslateSettingsState =
          await launcher.setSelectionTranslateSettings(selectionPatch);
      }
      setStatus("翻译设置已保存。");
      returnToTranslateToolMainView();
    } catch (error) {
      console.warn("[webtools-translate] save settings failed", error);
      setStatus("保存翻译设置失败，请重试。");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    }
  }

  export function applyDictionaryPanelPayload(panel: ActivePluginPanelState): void {
      const data = normalizeDictionaryPanelData(panel.data);
      dictionaryQueryText = data.query;
      dictionaryPanelStatusMessage = data.statusMessage;
      dictionaryPanelEntry = null;
      dictionaryPanelCandidates = [];
    }

  export function renderDictionaryPanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel dictionary-panel";

      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "离线词典";

      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle ||
        "ECDICT 英汉词典，支持单词与词组离线查询。";

      const form = document.createElement("form");
      form.className = "settings-form dictionary-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        void runDictionaryPanelLookup(form);
      });

      const statusRow = createLiteSnapInfoRow(
        "使用提示",
        dictionaryPanelStatusMessage,
        "约 76 万词条，支持英译中与中译英；连字符词组会自动尝试多种写法"
      );

      const packStatusText = buildDictionaryPackStatusText(dictionaryPackStatus);
      const packStatusRow = createLiteSnapInfoRow(
        "词典词库",
        packStatusText,
        buildDictionaryPackStatusHint(dictionaryPackStatus)
      );

      const packProgressWrap = document.createElement("div");
      packProgressWrap.className = "dictionary-pack-progress";
      packProgressWrap.hidden = true;
      const packProgressBar = document.createElement("progress");
      packProgressBar.className = "dictionary-pack-progress__bar";
      packProgressBar.max = 100;
      packProgressBar.value = 0;
      const packProgressText = document.createElement("span");
      packProgressText.className = "dictionary-pack-progress__text";
      packProgressWrap.append(packProgressBar, packProgressText);

      const ttsField = document.createElement("div");
      ttsField.className = "settings-field";
      const ttsLabel = document.createElement("label");
      ttsLabel.className = "settings-check";
      const ttsInput = document.createElement("input");
      ttsInput.type = "checkbox";
      ttsInput.name = "dictionaryTtsEnabled";
      ttsInput.checked = dictionaryPanelTtsEnabled;
      ttsInput.addEventListener("change", () => {
        void setDictionaryPanelTtsEnabled(ttsInput.checked);
      });
      const ttsText = document.createElement("span");
      ttsText.textContent = "查词成功后朗读（系统 TTS，默认关闭）";
      ttsLabel.append(ttsInput, ttsText);
      ttsField.appendChild(ttsLabel);

      const queryField = document.createElement("div");
      queryField.className = "settings-field";

      const queryLabel = document.createElement("label");
      queryLabel.className = "settings-field-label";
      queryLabel.textContent = "查询词（英文或中文）";
      queryLabel.htmlFor = "dictionary-query";

      const queryInput = document.createElement("input");
      queryInput.id = "dictionary-query";
      queryInput.name = "dictionaryQuery";
      queryInput.type = "text";
      queryInput.className = "settings-value";
      queryInput.spellcheck = false;
      queryInput.autocomplete = "off";
      queryInput.placeholder = "例如：apple、context-path、苹果、上下文";
      queryInput.value = dictionaryQueryText;
      queryInput.addEventListener("input", () => {
        dictionaryQueryText = queryInput.value;
      });
      queryField.append(queryLabel, queryInput);

      const dictionaryCard = document.createElement("div");
      dictionaryCard.id = "dictionary-result-card";
      dictionaryCard.className = "translate-dictionary-card";
      dictionaryCard.hidden = !dictionaryPanelEntry;
      if (dictionaryPanelEntry) {
        populateDictionaryEntryCard(dictionaryCard, dictionaryPanelEntry);
      }

      const favoriteNoteField = document.createElement("div");
      favoriteNoteField.className = "settings-field dictionary-favorite-note-field";
      favoriteNoteField.hidden = !isCurrentDictionaryEntryFavorited();
      const favoriteNoteLabel = document.createElement("label");
      favoriteNoteLabel.className = "settings-field-label";
      favoriteNoteLabel.textContent = "收藏备注";
      favoriteNoteLabel.htmlFor = "dictionary-favorite-note";
      const favoriteNoteInput = document.createElement("input");
      favoriteNoteInput.id = "dictionary-favorite-note";
      favoriteNoteInput.type = "text";
      favoriteNoteInput.className = "settings-value";
      favoriteNoteInput.maxLength = 120;
      favoriteNoteInput.placeholder = "可选，例如：工作常用 / 考试词汇";
      favoriteNoteInput.value =
        dictionaryPanelFavorites.find(
          (item) =>
            dictionaryPanelEntry &&
            item.word.trim().toLowerCase() ===
              dictionaryPanelEntry.word.trim().toLowerCase()
        )?.note ?? "";
      const favoriteNoteActions = document.createElement("div");
      favoriteNoteActions.className = "dictionary-favorite-note-actions";
      const favoriteNoteSave = document.createElement("button");
      favoriteNoteSave.type = "button";
      favoriteNoteSave.className = "settings-btn settings-btn-secondary";
      favoriteNoteSave.textContent = "保存备注";
      favoriteNoteSave.addEventListener("click", () => {
        if (!dictionaryPanelEntry) {
          return;
        }
        void saveDictionaryFavoriteNote(
          form,
          dictionaryPanelEntry.word,
          favoriteNoteInput.value
        );
      });
      favoriteNoteActions.appendChild(favoriteNoteSave);
      favoriteNoteField.append(
        favoriteNoteLabel,
        favoriteNoteInput,
        favoriteNoteActions
      );

      const candidatesSection = document.createElement("section");
      candidatesSection.className = "dictionary-side-section";
      candidatesSection.hidden = dictionaryPanelCandidates.length <= 1;
      const candidatesHead = document.createElement("div");
      candidatesHead.className = "dictionary-side-head";
      const candidatesTitle = document.createElement("h4");
      candidatesTitle.className = "dictionary-side-title";
      candidatesTitle.textContent = "其他释义";
      const candidatesMeta = document.createElement("span");
      candidatesMeta.className = "dictionary-side-meta";
      candidatesMeta.textContent = `${Math.max(0, dictionaryPanelCandidates.length - 1)} 条`;
      candidatesHead.append(candidatesTitle, candidatesMeta);
      const candidatesList = document.createElement("div");
      candidatesList.className = "dictionary-word-list";
      for (const candidate of dictionaryPanelCandidates.slice(1)) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "dictionary-word-row-main";
        const wordEl = document.createElement("div");
        wordEl.className = "dictionary-word-row-word";
        wordEl.textContent = candidate.word;
        const previewEl = document.createElement("div");
        previewEl.className = "dictionary-word-row-preview";
        previewEl.textContent =
          candidate.translation.split("\n")[0]?.trim() ||
          (candidate.phonetic ? `/${candidate.phonetic}/` : "点击切换到该词条");
        row.append(wordEl, previewEl);
        row.addEventListener("click", () => {
          dictionaryPanelEntry = candidate;
          dictionaryPanelCandidates = [
            candidate,
            ...dictionaryPanelCandidates.filter((item) => item.word !== candidate.word)
          ];
          if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
            renderList();
          }
          setStatus(`已切换到「${candidate.word}」。`);
        });
        candidatesList.appendChild(row);
      }
      candidatesSection.append(candidatesHead, candidatesList);

      const favoritesSection = document.createElement("section");
      favoritesSection.className = "dictionary-side-section";
      const favoritesHead = document.createElement("div");
      favoritesHead.className = "dictionary-side-head";
      const favoritesTitle = document.createElement("h4");
      favoritesTitle.className = "dictionary-side-title";
      favoritesTitle.textContent = "收藏";
      const favoritesMeta = document.createElement("span");
      favoritesMeta.className = "dictionary-side-meta";
      favoritesMeta.textContent = `${dictionaryPanelFavorites.length} 条`;
      favoritesHead.append(favoritesTitle, favoritesMeta);
      const favoritesList = document.createElement("div");
      favoritesList.className = "dictionary-word-list";
      renderDictionaryBookmarkList(favoritesList, dictionaryPanelFavorites, {
        emptyText: "还没有收藏词。查询后点「收藏」即可加入。",
        removeLabel: "取消",
        onSelect: (word) => {
          void lookupDictionaryWordFromPanel(form, word);
        },
        onRemove: (word) => {
          void removeDictionaryPanelFavorite(form, word);
        }
      });
      favoritesSection.append(favoritesHead, favoritesList);

      const historySection = document.createElement("section");
      historySection.className = "dictionary-side-section";
      const historyHead = document.createElement("div");
      historyHead.className = "dictionary-side-head";
      const historyTitle = document.createElement("h4");
      historyTitle.className = "dictionary-side-title";
      historyTitle.textContent = "最近查询";
      const historyMeta = document.createElement("span");
      historyMeta.className = "dictionary-side-meta";
      const filteredHistory = dictionaryPanelHistory.filter((item) => {
        if (dictionaryPanelHistoryFilter === "en") {
          return /^[A-Za-z]/.test(item.word);
        }
        if (dictionaryPanelHistoryFilter === "zh") {
          return /[\u3400-\u9fff]/.test(item.word) || /[\u3400-\u9fff]/.test(item.translationPreview);
        }
        return true;
      });
      historyMeta.textContent = `${filteredHistory.length} / ${dictionaryPanelHistory.length}`;
      const clearHistoryButton = document.createElement("button");
      clearHistoryButton.type = "button";
      clearHistoryButton.className = "dictionary-side-action";
      clearHistoryButton.textContent = "清空";
      clearHistoryButton.disabled = dictionaryPanelHistory.length === 0;
      clearHistoryButton.addEventListener("click", () => {
        void clearDictionaryPanelHistory(form);
      });
      historyHead.append(historyTitle, historyMeta, clearHistoryButton);

      const historyFilterRow = document.createElement("div");
      historyFilterRow.className = "dictionary-history-filters";
      (
        [
          ["all", "全部"],
          ["en", "英文"],
          ["zh", "中文"]
        ] as const
      ).forEach(([value, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `dictionary-history-filter${
          dictionaryPanelHistoryFilter === value ? " is-active" : ""
        }`;
        button.textContent = label;
        button.addEventListener("click", () => {
          dictionaryPanelHistoryFilter = value;
          if (activePluginPanel?.pluginId === DICTIONARY_PLUGIN_ID) {
            renderList();
          }
        });
        historyFilterRow.appendChild(button);
      });

      const historyList = document.createElement("div");
      historyList.className = "dictionary-word-list";
      renderDictionaryBookmarkList(historyList, filteredHistory, {
        emptyText:
          dictionaryPanelHistoryFilter === "all"
            ? "还没有查询记录。成功查词后会显示在这里。"
            : "当前筛选下没有记录。",
        removeLabel: "删除",
        onSelect: (word) => {
          void lookupDictionaryWordFromPanel(form, word);
        },
        onRemove: (word) => {
          void removeDictionaryPanelHistoryItem(form, word);
        }
      });
      historySection.append(historyHead, historyFilterRow, historyList);

      const actions = document.createElement("div");
      actions.className = "settings-actions";

      const lookupButton = document.createElement("button");
      lookupButton.type = "submit";
      lookupButton.className = "settings-btn settings-btn-primary";
      lookupButton.textContent = "查询";
      lookupButton.setAttribute("data-action", "dictionary-lookup");

      const favoriteButton = document.createElement("button");
      favoriteButton.type = "button";
      favoriteButton.className = "settings-btn settings-btn-secondary";
      favoriteButton.textContent = isCurrentDictionaryEntryFavorited()
        ? "取消收藏"
        : "收藏";
      favoriteButton.disabled = !dictionaryPanelEntry;
      favoriteButton.addEventListener("click", () => {
        void toggleDictionaryPanelFavorite(form);
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制释义";
      copyButton.addEventListener("click", () => {
        if (!dictionaryPanelEntry) {
          setStatus("没有可复制的释义。");
          return;
        }
        const exchangeText = formatDictionaryExchangeForPanel(
          dictionaryPanelEntry.exchange ?? ""
        );
        const parts = [
          dictionaryPanelEntry.word,
          dictionaryPanelEntry.phonetic ? `/${dictionaryPanelEntry.phonetic}/` : "",
          dictionaryPanelEntry.translation,
          dictionaryPanelEntry.definition,
          exchangeText ? `词形变化：${exchangeText}` : ""
        ].filter(Boolean);
        void navigator.clipboard
          .writeText(parts.join("\n"))
          .then(() => setStatus("已复制释义到剪贴板。"))
          .catch(() => setStatus("复制失败，请手动选择文字复制。"));
      });

      const speakButton = document.createElement("button");
      speakButton.type = "button";
      speakButton.className = "settings-btn settings-btn-secondary";
      speakButton.textContent = "朗读";
      speakButton.disabled = !dictionaryPanelEntry;
      speakButton.setAttribute("data-action", "dictionary-speak");
      speakButton.addEventListener("click", () => {
        if (!dictionaryPanelEntry) {
          setStatus("没有可朗读的词条。");
          return;
        }
        speakDictionaryEntry(dictionaryPanelEntry);
      });

      const exportFavoritesButton = document.createElement("button");
      exportFavoritesButton.type = "button";
      exportFavoritesButton.className = "settings-btn settings-btn-secondary";
      exportFavoritesButton.textContent = "导出收藏 CSV";
      exportFavoritesButton.setAttribute("data-action", "dictionary-export-csv");
      exportFavoritesButton.disabled = dictionaryPanelFavorites.length === 0;
      exportFavoritesButton.addEventListener("click", () => {
        void exportDictionaryFavoritesFromPanel();
      });

      const downloadPackButton = document.createElement("button");
      downloadPackButton.type = "button";
      downloadPackButton.className = "settings-btn settings-btn-secondary";
      downloadPackButton.textContent =
        dictionaryPackStatus?.tier === "full" && dictionaryPackStatus.usingUserPack
          ? "重新下载完整词库"
          : "下载完整词库（约 160MB）";
      downloadPackButton.setAttribute("data-action", "dictionary-download-pack");
      downloadPackButton.hidden = Boolean(
        dictionaryPackStatus?.tier === "full" && !dictionaryPackStatus.usingUserPack
      );
      downloadPackButton.addEventListener("click", () => {
        void downloadDictionaryPackFromPanel(
          downloadPackButton,
          packProgressWrap,
          packProgressBar,
          packProgressText
        );
      });

      const backToSearchButton = document.createElement("button");
      backToSearchButton.type = "button";
      backToSearchButton.className = "settings-btn settings-btn-secondary";
      backToSearchButton.textContent = "返回搜索";
      backToSearchButton.addEventListener("click", () => {
        backToSearch();
      });

      actions.append(
        lookupButton,
        favoriteButton,
        speakButton,
        copyButton,
        exportFavoritesButton,
        downloadPackButton,
        backToSearchButton
      );
      form.append(
        statusRow,
        packStatusRow,
        packProgressWrap,
        ttsField,
        queryField,
        dictionaryCard,
        favoriteNoteField,
        candidatesSection,
        favoritesSection,
        historySection,
        actions
      );
      panel.append(title, description, form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
    }

  export function applyWebtoolsTranslatePanelPayload(panel: ActivePluginPanelState): void {
      translateToolPanelData = normalizeTranslateToolPanelData(panel.data);
      translateToolPanelView = "main";
      translateToolSourceText = "";
      translateToolResultText = "";
      translateToolDictionaryEntry = null;
    }

  export function renderWebtoolsTranslatePanel(): void {
      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel webtools-translate-panel";

      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "文本翻译";

      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle ||
        "粘贴文字在线翻译为中文（百度翻译）。";

      const form = document.createElement("form");
      form.className = "settings-form webtools-translate-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (translateToolPanelView === "settings") {
          void saveTranslateToolSettings(form);
        } else {
          void runTranslateToolPanelTranslate(form);
        }
      });

      if (translateToolPanelView === "settings") {
        const settingsStatusRow = createLiteSnapInfoRow(
          "百度翻译设置",
          "配置后截图翻译与文本翻译共用同一套凭证",
          "通用版用 AppID+密钥；大模型版用 AppID+API Key"
        );

        const settingsRows = [
          createLiteSnapFieldRow(
            "翻译引擎",
            createLiteSnapSelect(
              "webtools-translate-baidu-engine",
              "baiduEngine",
              translateToolPanelData.settings.baiduEngine,
              [
                { value: "standard", label: "通用文本翻译" },
                { value: "llm", label: "大模型文本翻译" }
              ]
            ),
            "两种引擎使用不同的百度翻译 API"
          ),
          createLiteSnapFieldRow(
            "百度翻译 AppID",
            createLiteSnapTextInput(
              "webtools-translate-baidu-appid",
              "baiduAppId",
              translateToolPanelData.settings.baiduAppId,
              "在百度翻译开放平台创建应用后获取"
            ),
            "两种翻译引擎都需要"
          ),
          createLiteSnapFieldRow(
            "百度翻译密钥",
            createLiteSnapTextInput(
              "webtools-translate-baidu-secret",
              "baiduSecret",
              translateToolPanelData.settings.baiduSecret,
              "通用文本翻译使用",
              "password"
            ),
            "仅通用文本翻译需要，保存在本机"
          ),
          createLiteSnapFieldRow(
            "百度翻译 API Key",
            createLiteSnapTextInput(
              "webtools-translate-baidu-apikey",
              "baiduApiKey",
              translateToolPanelData.settings.baiduApiKey,
              "在开放平台「API Key 管理」创建",
              "password"
            ),
            "仅大模型文本翻译需要，保存在本机"
          ),
          createLiteSnapFieldRow(
            "启用划词翻译",
            createLiteSnapCheckbox(
              "webtools-selection-translate-enabled",
              "selectionTranslateEnabled",
              selectionTranslateSettingsState.enabled
            ),
            "选中文字后按快捷键弹出词典/翻译卡片"
          ),
          createLiteSnapFieldRow(
            "划词快捷键",
            createLiteSnapTextInput(
              "webtools-selection-translate-hotkey",
              "selectionTranslateHotkey",
              selectionTranslateSettingsState.hotkey,
              "F4"
            ),
            "默认 F4，可改为 Ctrl+Shift+D 等"
          ),
          createLiteSnapFieldRow(
            "恢复剪贴板",
            createLiteSnapCheckbox(
              "webtools-selection-translate-restore",
              "selectionTranslateRestoreClipboard",
              selectionTranslateSettingsState.restoreClipboard
            ),
            "划词抓取后还原原剪贴板内容，避免污染"
          ),
          createLiteSnapFieldRow(
            "点击空白关闭",
            createLiteSnapCheckbox(
              "webtools-selection-translate-dismiss-outside",
              "selectionTranslateDismissOutside",
              selectionTranslateSettingsState.dismissOnOutsideClick
            ),
            "开启后点击弹窗外空白处或失焦时自动关闭；关闭则需手动点关闭按钮或 Esc"
          )
        ];

        const settingsActions = document.createElement("div");
        settingsActions.className = "settings-actions";

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.className = "settings-btn settings-btn-primary";
        saveButton.textContent = "保存设置";

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "settings-btn settings-btn-secondary";
        backButton.textContent = "返回翻译";
        backButton.addEventListener("click", () => {
          returnToTranslateToolMainView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        settingsActions.append(saveButton, backButton, backToSearchButton);
        form.append(settingsStatusRow, ...settingsRows, settingsActions);
      } else {
        const statusRow = createLiteSnapInfoRow(
          "使用提示",
          translateToolPanelData.statusMessage,
          "英译中；可在设置中配置百度翻译凭证"
        );

        const sourceField = document.createElement("div");
        sourceField.className = "settings-field litesnap-ocr-field";

        const sourceLabel = document.createElement("label");
        sourceLabel.className = "settings-field-label";
        sourceLabel.textContent = "原文";
        sourceLabel.htmlFor = "webtools-translate-source";

        const sourceTextarea = document.createElement("textarea");
        sourceTextarea.id = "webtools-translate-source";
        sourceTextarea.name = "webtoolsTranslateSource";
        sourceTextarea.className = "litesnap-ocr-textarea";
        sourceTextarea.rows = 6;
        sourceTextarea.spellcheck = false;
        sourceTextarea.placeholder = "粘贴或输入要翻译的文字（英译中）";
        sourceTextarea.value = translateToolSourceText;
        sourceTextarea.addEventListener("input", () => {
          translateToolSourceText = sourceTextarea.value;
        });
        sourceField.append(sourceLabel, sourceTextarea);

        const dictionaryCard = document.createElement("div");
        dictionaryCard.id = "webtools-translate-dictionary-card";
        dictionaryCard.className = "translate-dictionary-card";
        dictionaryCard.hidden = !translateToolDictionaryEntry;
        if (translateToolDictionaryEntry) {
          const wordEl = document.createElement("div");
          wordEl.className = "translate-dictionary-card__word";
          wordEl.textContent = translateToolDictionaryEntry.word;
          dictionaryCard.appendChild(wordEl);
          if (translateToolDictionaryEntry.phonetic) {
            const phoneticEl = document.createElement("div");
            phoneticEl.className = "translate-dictionary-card__phonetic";
            phoneticEl.textContent = `/${translateToolDictionaryEntry.phonetic}/`;
            dictionaryCard.appendChild(phoneticEl);
          }
          const metaText = [
            translateToolDictionaryEntry.pos,
            translateToolDictionaryEntry.tags
          ]
            .filter(Boolean)
            .join(" · ");
          if (metaText) {
            const metaEl = document.createElement("div");
            metaEl.className = "translate-dictionary-card__meta";
            metaEl.textContent = metaText;
            dictionaryCard.appendChild(metaEl);
          }
          if (translateToolDictionaryEntry.translation) {
            const translationEl = document.createElement("div");
            translationEl.className = "translate-dictionary-card__text";
            translationEl.textContent = translateToolDictionaryEntry.translation;
            dictionaryCard.appendChild(translationEl);
          }
        }

        const resultField = document.createElement("div");
        resultField.className = "settings-field litesnap-ocr-field";

        const resultLabel = document.createElement("label");
        resultLabel.className = "settings-field-label";
        resultLabel.textContent = "中文译文";
        resultLabel.htmlFor = "webtools-translate-result";

        const resultTextarea = document.createElement("textarea");
        resultTextarea.id = "webtools-translate-result";
        resultTextarea.className = "litesnap-ocr-textarea";
        resultTextarea.rows = 6;
        resultTextarea.spellcheck = false;
        resultTextarea.readOnly = true;
        resultTextarea.value = translateToolResultText;
        resultTextarea.placeholder = "翻译结果将显示在这里";
        resultField.append(resultLabel, resultTextarea);

        const actions = document.createElement("div");
        actions.className = "settings-actions";

        const translateButton = document.createElement("button");
        translateButton.type = "submit";
        translateButton.className = "settings-btn settings-btn-primary";
        translateButton.textContent = "翻译";
        translateButton.setAttribute("data-action", "translate-run");

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-secondary";
        copyButton.textContent = "复制译文";
        copyButton.addEventListener("click", () => {
          const value = resultTextarea.value;
          if (!value.trim()) {
            setStatus("没有可复制的译文。");
            return;
          }
          void navigator.clipboard
            .writeText(value)
            .then(() => setStatus("已复制译文到剪贴板。"))
            .catch(() => setStatus("复制失败，请手动选择文字复制。"));
        });

        const settingsButton = document.createElement("button");
        settingsButton.type = "button";
        settingsButton.className = "settings-btn settings-btn-secondary";
        settingsButton.textContent = "翻译设置";
        settingsButton.addEventListener("click", () => {
          openTranslateToolSettingsView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        actions.append(
          translateButton,
          copyButton,
          settingsButton,
          backToSearchButton
        );
        form.append(statusRow, sourceField, dictionaryCard, resultField, actions);
      }

      panel.append(title, description, form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
    }

}
