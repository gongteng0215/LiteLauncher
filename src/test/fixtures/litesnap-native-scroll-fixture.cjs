const fs = require("node:fs");
const { app, BrowserWindow, screen } = require("electron");

const statusPath = process.env.LITELAUNCHER_E2E_SCROLL_FIXTURE_STATUS;
const controlPath = process.env.LITELAUNCHER_E2E_SCROLL_FIXTURE_CONTROL;

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu-compositing");

function writeStatus(target, extra = {}) {
  if (!statusPath || !target || target.isDestroyed()) {
    return;
  }
  const temporaryPath = `${statusPath}.${process.pid}.tmp`;
  const bounds = target.getBounds();
  const payload = {
    ready: true,
    pid: process.pid,
    bounds,
    ...extra
  };
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(payload), "utf8");
    fs.renameSync(temporaryPath, statusPath);
  } catch {
    // The parent test may be shutting down while a final scroll event arrives.
  }
}

app.whenReady().then(async () => {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const rows = Array.from({ length: 18 }, (_, index) => {
    const hue = (index * 47) % 360;
    return `<section style="--h:${hue}"><b>ROW-${String(index).padStart(2, "0")}</b><span>LiteSnap native scroll fixture ${index}</span></section>`;
  }).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;font:20px Segoe UI,sans-serif;background:#f8fafc;color:#111827}
    main{position:relative;min-height:1620px;overflow:hidden}
    section{height:90px;padding:22px 48px;display:flex;gap:40px;align-items:center;border-bottom:2px solid hsl(var(--h) 70% 30%);background:repeating-linear-gradient(90deg,hsl(var(--h) 75% 88%) 0 18px,hsl(var(--h) 70% 72%) 18px 36px)}
    section span{padding:4px 12px;background:rgba(255,255,255,.78)}
    .marker{position:absolute;z-index:3;left:0;right:0;height:10px}
    #top-marker{top:35vh;background:#ff00ff}
    #bottom-marker{bottom:65vh;background:#ffff00}
  </style><main><div class="marker" id="top-marker"></div>${rows}<div class="marker" id="bottom-marker"></div></main>`;
  const target = new BrowserWindow({
    ...display.workArea,
    show: false,
    frame: false,
    backgroundColor: "#f8fafc",
    webPreferences: {
      contextIsolation: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });
  global.__litesnapNativeScrollFixture = target;
  await target.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const initial = await target.webContents.executeJavaScript(
    "({ y: window.scrollY, innerHeight: window.innerHeight, scrollHeight: document.documentElement.scrollHeight })",
    true
  );
  target.show();
  target.focus();
  writeStatus(target, initial);
  setInterval(async () => {
    if (target.isDestroyed()) {
      return;
    }
    if (controlPath && fs.existsSync(controlPath)) {
      let command = {};
      try {
        command = JSON.parse(fs.readFileSync(controlPath, "utf8"));
        fs.unlinkSync(controlPath);
      } catch {
        // The next interval can retry after an antivirus/file watcher releases it.
        command = {};
      }
      if (command.focus === true) {
        target.show();
        target.focus();
      }
      if (Number.isFinite(command.scrollBy) && command.scrollBy !== 0) {
        await target.webContents.executeJavaScript(
          `window.scrollBy(0, ${Math.round(command.scrollBy)})`,
          true
        ).catch(() => undefined);
      }
    }
    const state = await target.webContents.executeJavaScript(
      "({ y: window.scrollY, innerHeight: window.innerHeight, scrollHeight: document.documentElement.scrollHeight })",
      true
    ).catch(() => null);
    if (state) {
      writeStatus(target, state);
    }
  }, 100);
});

app.on("window-all-closed", () => app.quit());
