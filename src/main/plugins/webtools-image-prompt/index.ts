import { IPC_CHANNELS } from "../../../shared/channels";
import {
  ImagePromptOptionGroupKey,
  ImagePromptState,
  ImagePromptStylePresetId,
  buildImagePrompt,
  createDefaultImagePromptState,
  createImagePromptExampleState
} from "../../../shared/image-prompt-builder";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { LauncherPlugin } from "../types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";

type ImagePromptAction = "open" | "build";

interface ImagePromptCommand {
  action: ImagePromptAction;
  state: ImagePromptState;
}

const PLUGIN_ID = "webtools-image-prompt";
const ACTION_OPEN: ImagePromptAction = "open";
const QUERY_ALIASES = [
  "wt-prompt",
  "image prompt",
  "prompt",
  "提示词",
  "图片提示词",
  "图像提示词"
];
const OPTION_KEYS: ImagePromptOptionGroupKey[] = [
  "subject",
  "style",
  "composition",
  "lighting",
  "materials",
  "environment",
  "mood",
  "constraints"
];

function buildTarget(action: ImagePromptAction, state = createDefaultImagePromptState()): string {
  const params = new URLSearchParams();
  params.set("action", action);
  params.set("state", JSON.stringify(state));
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseState(raw: string | null): ImagePromptState {
  if (!raw) {
    return createDefaultImagePromptState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ImagePromptState>;
    const next = createDefaultImagePromptState();

    if (parsed.productId === "chatgpt-images-2") {
      next.productId = "chatgpt-images-2";
    }
    if (isStylePresetId(parsed.stylePresetId)) {
      next.stylePresetId = parsed.stylePresetId;
    }
    if (typeof parsed.photoDescription === "string") {
      next.photoDescription = parsed.photoDescription;
    }
    if (parsed.selections && typeof parsed.selections === "object") {
      for (const key of OPTION_KEYS) {
        const value = parsed.selections[key];
        if (Array.isArray(value)) {
          next.selections[key] = value.filter((item): item is string => typeof item === "string");
        }
      }
    }
    if (parsed.custom && typeof parsed.custom === "object") {
      for (const key of OPTION_KEYS) {
        if (key === "constraints") {
          continue;
        }
        const value = parsed.custom[key];
        if (typeof value === "string") {
          next.custom[key] = value;
        }
      }
    }
    if (parsed.text && typeof parsed.text === "object") {
      if (typeof parsed.text.exact === "string") {
        next.text.exact = parsed.text.exact;
      }
      if (typeof parsed.text.position === "string") {
        next.text.position = parsed.text.position;
      }
      if (typeof parsed.text.style === "string") {
        next.text.style = parsed.text.style;
      }
      if (typeof parsed.text.designId === "string") {
        next.text.designId = parsed.text.designId;
      }
      if (typeof parsed.text.design === "string") {
        next.text.design = parsed.text.design;
      }
      if (typeof parsed.text.title === "string") {
        next.text.title = parsed.text.title;
      }
      if (typeof parsed.text.subtitle === "string") {
        next.text.subtitle = parsed.text.subtitle;
      }
      if (typeof parsed.text.label === "string") {
        next.text.label = parsed.text.label;
      }
      if (typeof parsed.text.name === "string") {
        next.text.name = parsed.text.name;
      }
      if (typeof parsed.text.age === "string") {
        next.text.age = parsed.text.age;
      }
      if (typeof parsed.text.layout === "string") {
        next.text.layout = parsed.text.layout;
      }
      if (typeof parsed.text.hierarchy === "string") {
        next.text.hierarchy = parsed.text.hierarchy;
      }
      if (typeof parsed.text.color === "string") {
        next.text.color = parsed.text.color;
      }
      if (typeof parsed.text.effect === "string") {
        next.text.effect = parsed.text.effect;
      }
      if (typeof parsed.text.safeArea === "string") {
        next.text.safeArea = parsed.text.safeArea;
      }
      if (Array.isArray(parsed.text.flags)) {
        next.text.flags = parsed.text.flags.filter(
          (item): item is string => typeof item === "string"
        );
      }
    }
    if (Array.isArray(parsed.constraints)) {
      next.constraints = parsed.constraints.filter(
        (item): item is string => typeof item === "string"
      );
    }

    return next;
  } catch {
    return createDefaultImagePromptState();
  }
}

function isStylePresetId(value: unknown): value is ImagePromptStylePresetId {
  return (
    value === "ecommerce-main" ||
    value === "social-cover" ||
    value === "movie-poster" ||
    value === "portrait-photo" ||
    value === "interior-architecture" ||
    value === "illustration-ip" ||
    value === "food-drink" ||
    value === "education-poster" ||
    value === "festival-campaign" ||
    value === "birthday-party" ||
    value === "app-saas" ||
    value === "travel-landscape" ||
    value === "beauty-fashion" ||
    value === "livestream-commerce" ||
    value === "brand-key-visual" ||
    value === "packaging-design" ||
    value === "home-decoration" ||
    value === "automotive-transport" ||
    value === "parent-child" ||
    value === "medical-health" ||
    value === "finance-business" ||
    value === "recruitment-brand" ||
    value === "public-service" ||
    value === "guochao-culture" ||
    value === "minimalist-print" ||
    value === "retro-magazine"
  );
}

function parseCommand(optionsText: string | undefined): ImagePromptCommand {
  if (!optionsText) {
    return { action: ACTION_OPEN, state: createImagePromptExampleState() };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  return {
    action: actionRaw === "build" ? "build" : ACTION_OPEN,
    state: parseState(params.get("state"))
  };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const value = alias.trim().toLowerCase();
    return value ? normalized === value || normalized.startsWith(`${value} `) : false;
  });
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "图片提示词",
    subtitle: "点选模块生成 ChatGPT Images 2.0 商业提示词",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(ACTION_OPEN, createImagePromptExampleState()),
    keywords: ["plugin", "webtools", "prompt", "image", "ai", "提示词", "图片"]
  };
}

function executeBuild(command: ImagePromptCommand): ExecuteResult {
  const prompt = buildImagePrompt(command.state);
  return {
    ok: true,
    keepOpen: true,
    message: "图片提示词已生成",
    data: {
      ...command.state,
      output: prompt
    }
  };
}

export const webtoolsImagePromptPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "图片提示词",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "图片提示词",
        subtitle: "点选模块生成 ChatGPT Images 2.0 商业提示词",
        data: {
          ...command.state,
          output: buildImagePrompt(command.state)
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开图片提示词"
      };
    }

    return executeBuild(command);
  }
};
