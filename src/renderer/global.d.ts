import {
  ClipItem,
  DebugKeyEvent,
  ExecuteResult,
  LaunchItem,
  SearchDisplayConfig
} from "../shared/types";

declare global {
  interface Window {
    launcher: {
      isDebugKeysEnabled(): boolean;
      getInitialItems(): Promise<LaunchItem[]>;
      getPinnedItems(): Promise<LaunchItem[]>;
      getPluginItems(): Promise<LaunchItem[]>;
      getSearchDisplayConfig(): Promise<SearchDisplayConfig>;
      setSearchDisplayConfig(
        config: Partial<SearchDisplayConfig>
      ): Promise<SearchDisplayConfig>;
      setItemPinned(itemId: string, pinned: boolean): Promise<boolean>;
      search(query: string): Promise<LaunchItem[]>;
      execute(item: LaunchItem): Promise<ExecuteResult>;
      hide(): Promise<boolean>;
      getClipItems(query: string): Promise<ClipItem[]>;
      copyClipItem(itemId: string): Promise<boolean>;
      deleteClipItem(itemId: string): Promise<boolean>;
      clearClipItems(): Promise<number>;
      onFocusInput(handler: () => void): () => void;
      onClearInput(handler: () => void): () => void;
      onOpenPanel(handler: (panelPayload: unknown) => void): () => void;
      onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
    };
  }
}

export {};
