import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import {
  ClipboardWorkbenchListScope,
  ClipboardWorkbenchMergeMode,
  ClipboardWorkbenchPasteMode
} from "../../../shared/clipboard-workbench";
import { LauncherPlugin } from "../types";
import {
  ClipboardWorkbenchActionInput,
  ClipboardWorkbenchActionResult,
  ClipboardWorkbenchService
} from "./service";

type ClipboardWorkbenchActionName = ClipboardWorkbenchActionInput["type"];

export interface ClipboardWorkbenchServiceLike {
  perform(
    action: ClipboardWorkbenchActionInput
  ): Promise<ClipboardWorkbenchActionResult>;
}

const PLUGIN_ID = "clipboard-workbench";
const TITLE = "Clipboard Workbench";
const SUBTITLE =
  "Capture, organize, and replay text, images, screenshots, and file lists";
const QUERY_ALIASES = ["clipx", "clipboard", "cb", "workbench", "cbw"];
const VALID_ACTIONS = new Set<ClipboardWorkbenchActionName>([
  "open",
  "refresh",
  "save-current",
  "save-manual-text",
  "toggle-collect",
  "toggle-sensitive",
  "restore-item",
  "paste-batch",
  "set-favorite",
  "set-pinned",
  "assign-group",
  "save-item-meta",
  "create-group",
  "delete-items",
  "clear-all",
  "import-image-files",
  "import-file-list",
  "export-item"
]);

let clipboardWorkbenchService: ClipboardWorkbenchServiceLike | null = null;

function getIconDataUrl(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
    '<stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>' +
    '<rect width="24" height="24" rx="6" fill="url(#g)"/>' +
    '<rect x="6.5" y="6.5" width="8" height="10" rx="1.5" fill="#fff" opacity="0.95"/>' +
    '<rect x="10.5" y="9.5" width="7" height="8" rx="1.5" fill="#fff" opacity="0.7"/>' +
    '<path d="M8.5 9.5h4M8.5 12h4" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"/>' +
    "</svg>";
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function buildTarget(action: ClipboardWorkbenchActionName = "open"): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const next = alias.trim().toLowerCase();
    return normalized === next || normalized.startsWith(`${next} `);
  });
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: TITLE,
    subtitle: "Clipboard history for text, images, screenshots, and file paths",
    iconPath: getIconDataUrl(),
    target: buildTarget("open"),
    keywords: [
      "plugin",
      "clipboard",
      "workbench",
      "clipx",
      "paste",
      "batch",
      "image",
      "screenshot",
      "files"
    ]
  };
}

function parseScope(value: string | null): ClipboardWorkbenchListScope | undefined {
  switch ((value ?? "").trim().toLowerCase()) {
    case "":
      return undefined;
    case "all":
    case "recent":
    case "favorites":
    case "pinned":
    case "text":
    case "image":
    case "files":
    case "screenshots":
      return (value ?? "").trim().toLowerCase() as ClipboardWorkbenchListScope;
    default:
      return undefined;
  }
}

function parsePasteMode(
  value: string | null
): ClipboardWorkbenchPasteMode | undefined {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "sequential" || normalized === "merge-once") {
    return normalized;
  }
  return undefined;
}

function parseMergeMode(
  value: string | null
): ClipboardWorkbenchMergeMode | undefined {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "direct" ||
    normalized === "newline" ||
    normalized === "blank-line" ||
    normalized === "custom"
  ) {
    return normalized;
  }
  return undefined;
}

function parseCommand(
  optionsText: string | undefined
): { ok: true; action: ClipboardWorkbenchActionInput } | { ok: false; message: string } {
  if (!optionsText) {
    return { ok: true, action: { type: "open" } };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? "open").trim().toLowerCase();
  if (!VALID_ACTIONS.has(actionRaw as ClipboardWorkbenchActionName)) {
    return {
      ok: false,
      message: `Unsupported Clipboard Workbench action: ${actionRaw || "(empty)"}`
    };
  }

  const itemIds = [
    ...params.getAll("itemIds"),
    ...params.getAll("itemId")
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    ok: true,
    action: {
      type: actionRaw as ClipboardWorkbenchActionName,
      search: params.get("search") ?? undefined,
      scope: parseScope(params.get("scope")),
      groupId: params.get("groupId") ?? undefined,
      itemIds: itemIds.length > 0 ? itemIds : undefined,
      manualText: params.get("manualText") ?? undefined,
      pasteMode: parsePasteMode(params.get("pasteMode")),
      mergeSeparatorMode: parseMergeMode(params.get("mergeSeparatorMode")),
      mergeCustomSeparator: params.get("mergeCustomSeparator") ?? undefined
    }
  };
}

function toExecuteResult(
  result: ClipboardWorkbenchActionResult
): ExecuteResult {
  return {
    ok: true,
    keepOpen: true,
    message: result.message,
    data: result.payload as unknown as Record<string, unknown>
  };
}

export function setClipboardWorkbenchService(
  next: ClipboardWorkbenchServiceLike | null
): void {
  clipboardWorkbenchService = next;
}

export function setClipboardWorkbenchServiceForTest(
  next: ClipboardWorkbenchServiceLike | null
): void {
  setClipboardWorkbenchService(next);
}

export const clipboardWorkbenchPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: TITLE,
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    return matchesAlias(query) ? [createCatalogItem()] : [];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const parsed = parseCommand(optionsText);
    if (!parsed.ok) {
      return {
        ok: false,
        keepOpen: true,
        message: parsed.message
      };
    }

    const service = clipboardWorkbenchService;
    if (!service) {
      return {
        ok: false,
        keepOpen: true,
        message: "Clipboard Workbench service is unavailable."
      };
    }

    const result = await service.perform(parsed.action);
    if (parsed.action.type === "open") {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: TITLE,
        subtitle: SUBTITLE,
        data: result.payload
      });
    }

    return toExecuteResult(result);
  }
};

export { ClipboardWorkbenchService };
export type {
  ClipboardWorkbenchActionInput,
  ClipboardWorkbenchActionResult
} from "./service";
