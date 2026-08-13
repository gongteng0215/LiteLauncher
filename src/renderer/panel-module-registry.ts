(() => {
  const modulesById = new Map<string, RendererPanelModule>();
  const modulesByPluginId = new Map<string, RendererPanelModule>();
  let configuredHost: RendererPanelHost | null = null;

  function normalizeId(value: string): string {
    return String(value ?? "").trim();
  }

  function sanitizeDetail(value: unknown): string {
    return String(value instanceof Error ? value.message : value ?? "")
      .replace(/[A-Za-z]:\\[^\r\n\t]*/g, "<path>")
      .replace(/(?:token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=<redacted>")
      .slice(0, 800);
  }

  function detectDevelopmentMode(): boolean {
    try {
      return window.launcher?.isDebugKeysEnabled?.() === true;
    } catch {
      return false;
    }
  }

  function renderFallbackRecovery(pluginId: string, message: string): void {
    const list = document.getElementById("result-list");
    if (!(list instanceof HTMLUListElement)) {
      return;
    }

    const item = document.createElement("li");
    item.className = "settings-panel-item";
    const panel = document.createElement("section");
    panel.className = "settings-panel panel-module-recovery";
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = "面板暂时无法打开";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "settings-btn settings-btn-primary";
    retry.textContent = "重试";
    retry.addEventListener("click", () => {
      registry.render(pluginId, configuredHost?.getActivePanel() ?? {
        pluginId,
        title: pluginId,
        subtitle: "插件面板"
      });
    });
    panel.append(title, description, retry);
    item.appendChild(panel);
    list.replaceChildren(item);
  }

  function handleFailure(pluginId: string, message: string, error?: unknown): false {
    const detail = sanitizeDetail(error);
    const host = configuredHost;
    const isDevelopment = host?.isDevelopment ?? detectDevelopmentMode();
    if (isDevelopment) {
      throw error instanceof Error ? error : new Error(detail ? `${message}: ${detail}` : message);
    }

    if (host) {
      host.reportError(pluginId, message, detail || undefined);
      host.showRecovery(pluginId, message);
    } else {
      void window.launcher?.reportErrorLog?.({
        scope: "renderer",
        level: "error",
        message: message.slice(0, 240),
        context: `panel-module:${pluginId.slice(0, 100)}`,
        detail: detail || undefined
      });
      renderFallbackRecovery(pluginId, message);
    }
    return false;
  }

  function getHost(pluginId: string): RendererPanelHost | null {
    if (configuredHost) {
      return configuredHost;
    }
    handleFailure(pluginId, "面板 Host 尚未初始化，请重试");
    return null;
  }

  function invoke(
    pluginId: string,
    callback: (module: RendererPanelModule, host: RendererPanelHost) => void
  ): boolean {
    const normalizedPluginId = normalizeId(pluginId);
    const module = modulesByPluginId.get(normalizedPluginId);
    if (!module) {
      return handleFailure(normalizedPluginId, `插件面板实现缺失：${normalizedPluginId || "unknown"}`);
    }
    const host = getHost(normalizedPluginId);
    if (!host) {
      return false;
    }
    try {
      callback(module, host);
      return true;
    } catch (error) {
      return handleFailure(normalizedPluginId, "插件面板执行失败，请重试", error);
    }
  }

  const registry: RendererPanelModuleRegistry = {
    configureHost(host): void {
      if (!host || !(host.list instanceof HTMLUListElement)) {
        handleFailure("host", "面板 Host 配置无效");
        return;
      }
      configuredHost = host;
    },

    clearHost(): void {
      configuredHost = null;
    },

    register(module): void {
      const moduleId = normalizeId(module?.id);
      const pluginIds = Array.from(new Set(module?.pluginIds?.map(normalizeId).filter(Boolean) ?? []));
      if (!moduleId || typeof module?.render !== "function" || pluginIds.length === 0) {
        handleFailure(moduleId || "unknown", "面板模块定义不完整");
        return;
      }
      if (modulesById.has(moduleId)) {
        handleFailure(moduleId, `面板模块 ID 重复：${moduleId}`);
        return;
      }
      const duplicatePluginId = pluginIds.find((pluginId) => modulesByPluginId.has(pluginId));
      if (duplicatePluginId) {
        handleFailure(duplicatePluginId, `插件 ID 重复注册：${duplicatePluginId}`);
        return;
      }
      modulesById.set(moduleId, module);
      pluginIds.forEach((pluginId) => modulesByPluginId.set(pluginId, module));
    },

    unregister(moduleId): void {
      const module = modulesById.get(normalizeId(moduleId));
      if (!module) {
        return;
      }
      modulesById.delete(module.id);
      for (const [pluginId, registered] of modulesByPluginId) {
        if (registered === module) {
          modulesByPluginId.delete(pluginId);
        }
      }
    },

    get(pluginId): RendererPanelModule | null {
      return modulesByPluginId.get(normalizeId(pluginId)) ?? null;
    },

    require(pluginId): RendererPanelModule {
      const normalizedPluginId = normalizeId(pluginId);
      const module = modulesByPluginId.get(normalizedPluginId);
      if (!module) {
        throw new Error(`renderer panel module missing: ${normalizedPluginId}`);
      }
      return module;
    },

    listPluginIds(): string[] {
      return Array.from(modulesByPluginId.keys()).sort();
    },

    listModuleIds(): string[] {
      return Array.from(modulesById.keys()).sort();
    },

    render(pluginId, panel): boolean {
      return invoke(pluginId, (module, host) => module.render(host, panel));
    },

    onOpen(pluginId, panel): boolean {
      return invoke(pluginId, (module, host) => module.onOpen?.(host, panel));
    },

    onEnter(pluginId, panel): boolean {
      return invoke(pluginId, (module, host) => module.onEnter?.(host, panel));
    },

    onEscape(pluginId, panel): boolean {
      let handled = false;
      const invoked = invoke(pluginId, (module, host) => {
        handled = module.onEscape?.(host, panel) === true;
      });
      return invoked && handled;
    },

    cleanup(activePluginId): void {
      const host = getHost(activePluginId ?? "cleanup");
      if (!host) {
        return;
      }
      const visited = new Set<RendererPanelModule>();
      for (const module of modulesById.values()) {
        if (visited.has(module)) {
          continue;
        }
        visited.add(module);
        try {
          module.cleanup?.(host, activePluginId);
        } catch (error) {
          handleFailure(module.id, "插件面板清理失败", error);
        }
      }
    }
  };

  window.__LL_PANEL_MODULES__ = registry;
})();
