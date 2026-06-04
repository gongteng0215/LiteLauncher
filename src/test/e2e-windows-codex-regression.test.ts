import assert from "node:assert/strict";
import * as childProcess from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import {
  captureE2EFailureArtifacts,
  launchE2ESession
} from "./e2e-test-utils";

const CODEX_APP_ID = "OpenAI.Codex_2p2nqsd0c76g0!App";

function hasInstalledCodexStartApp(): boolean {
  const script = [
    "$entry = Get-StartApps |",
    "  Where-Object { $_.Name -eq 'Codex' -or $_.AppID -eq 'OpenAI.Codex_2p2nqsd0c76g0!App' } |",
    "  Select-Object -First 1",
    "if ($null -eq $entry) { exit 1 }",
    "$entry | ConvertTo-Json -Compress"
  ].join("\n");
  const result = childProcess.spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  return result.status === 0 && String(result.stdout ?? "").trim().length > 0;
}

async function waitForPinnedCodexTile(
  page: Awaited<ReturnType<typeof launchE2ESession>>["page"]
): Promise<void> {
  await page.waitForFunction(
    () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '.section-grid[data-section-id="pinned"] .tile-title'
        )
      ).some((node) => node.textContent?.trim() === "Codex"),
    undefined,
    { timeout: 15000 }
  );
}

test(
  "electron smoke: Windows Store Codex stays searchable and pinned across restart",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("Windows Store Codex regression only runs on Windows");
    }
    if (!hasInstalledCodexStartApp()) {
      t.skip("Microsoft Store Codex is not installed on this machine");
    }

    const userDataDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-codex-e2e-")
    );

    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let pinnedCodexItem: LaunchItem | undefined;
    const testName =
      "electron smoke: Windows Store Codex stays searchable and pinned across restart";

    try {
      session = await launchE2ESession({
        userDataDir,
        cleanupUserDataDir: false
      });

      const { page } = session;
      await page.setViewportSize({ width: 1280, height: 720 });

      const searchInput = page.locator("#search-input");
      await searchInput.click();
      await searchInput.fill("codex");

      await page
        .locator(".result-item.result-tile")
        .filter({
          has: page.locator(".tile-title", { hasText: "Codex" })
        })
        .first()
        .waitFor({ state: "visible", timeout: 15000 });

      pinnedCodexItem = await page.evaluate(async () => {
        const results = await window.launcher.search("codex", {
          scope: "all",
          limit: 20
        });
        return results.find(
          (item) =>
            item.title === "Codex" &&
            item.target.startsWith("command:apps-folder:") &&
            item.target.includes(encodeURIComponent("OpenAI.Codex_2p2nqsd0c76g0!App"))
        );
      });

      assert.ok(pinnedCodexItem, "search should return the Windows Store Codex item");
      assert.equal(pinnedCodexItem?.id, "app:startapp:codex");
      assert.equal(
        pinnedCodexItem?.target,
        `command:apps-folder:${encodeURIComponent(CODEX_APP_ID)}`
      );

      const pinResult = await page.evaluate(
        async (itemId) => window.launcher.setItemPinned(itemId, true),
        pinnedCodexItem.id
      );
      assert.equal(pinResult.ok, true, "pinning Codex should succeed");
      assert.equal(pinResult.pinned, true, "pin result should report pinned=true");

      await searchInput.fill("");
      await waitForPinnedCodexTile(page);

      await session.close();
      session = await launchE2ESession({
        userDataDir,
        cleanupUserDataDir: false
      });

      const persistedPinnedItems = await session.page.evaluate(async () => {
        return window.launcher.getPinnedItems();
      });
      assert.equal(
        persistedPinnedItems.some((item) => item.id === pinnedCodexItem?.id),
        true,
        "pinned Codex item should persist after restart"
      );

      await waitForPinnedCodexTile(session.page);

      const unpinResult = await session.page.evaluate(
        async (itemId) => window.launcher.setItemPinned(itemId, false),
        pinnedCodexItem.id
      );
      assert.equal(unpinResult.ok, true, "unpinning Codex should succeed");
      assert.equal(unpinResult.pinned, false, "unpin result should report pinned=false");

      const remainingPinnedItems = await session.page.evaluate(async () => {
        return window.launcher.getPinnedItems();
      });
      assert.equal(
        remainingPinnedItems.some((item) => item.id === pinnedCodexItem?.id),
        false,
        "Codex pin should be removable after restart validation"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
      await fs.rm(userDataDir, { recursive: true, force: true });
    }
  }
);
