import { BrowserWindow } from "electron";

import { ExecuteResult, LaunchItem } from "../../shared/types";

export interface PluginExecuteContext {
  window: BrowserWindow;
  selectedItem: LaunchItem;
}

export interface LauncherPlugin {
  id: string;
  name: string;
  createCatalogItems(): LaunchItem[];
  getQueryItems?(query: string): LaunchItem[];
  execute(
    optionsText: string | undefined,
    context: PluginExecuteContext
  ): ExecuteResult | Promise<ExecuteResult>;
}
