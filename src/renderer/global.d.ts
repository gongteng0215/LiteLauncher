import {
  ClipItem,
  DebugKeyEvent,
  ExecuteResult,
  LaunchItem
} from "../shared/types";

declare global {
  interface Window {
    launcher: {
      isDebugKeysEnabled(): boolean;
      getInitialItems(): Promise<LaunchItem[]>;
      getRecommendedItems(): Promise<LaunchItem[]>;
      getPluginItems(): Promise<LaunchItem[]>;
      search(query: string): Promise<LaunchItem[]>;
      execute(item: LaunchItem): Promise<ExecuteResult>;
      hide(): Promise<boolean>;
      getClipItems(query: string): Promise<ClipItem[]>;
      copyClipItem(itemId: string): Promise<boolean>;
      deleteClipItem(itemId: string): Promise<boolean>;
      clearClipItems(): Promise<number>;
      onFocusInput(handler: () => void): () => void;
      onOpenPanel(handler: (panel: string) => void): () => void;
      onDebugKey(handler: (event: DebugKeyEvent) => void): () => void;
    };
  }
}

export {};
