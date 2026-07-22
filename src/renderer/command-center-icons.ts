const ICON_SVGS: Record<string, string> = {
  search:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M10.5 3a7.5 7.5 0 015.96 12.04l4.25 4.25-1.06 1.06-4.25-4.25A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 8.25A3.75 3.75 0 1112 15.75 3.75 3.75 0 0112 8.25zM3.75 12h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zm14.25 0h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5z"/></svg>',
  clipboard:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 4.5h8A2.5 2.5 0 0118.5 7v12A2.5 2.5 0 0116 21.5H8A2.5 2.5 0 015.5 19V7A2.5 2.5 0 018 4.5zm0 2A.5.5 0 007.5 7v12a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V7a.5.5 0 00-.5-.5H8zM9 3a1 1 0 011-1h4a1 1 0 011 1v1H9V3z"/></svg>',
  screenshot:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-11zM6.5 6a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11zM12 8.75a3.25 3.25 0 110 6.5 3.25 3.25 0 010-6.5z"/></svg>',
  scan:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M4 7V5.5A1.5 1.5 0 015.5 4H7v2H5.5V7H4zm12-3h1.5A1.5 1.5 0 0119 5.5V7h-2V5.5H16V4zM8 11h8v2H8v-2z"/></svg>',
  translate:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M5 5h8v2H9.8l2.2 6h2.1l.9-2.4h4.3l.9 2.4H22l-3.5-9H5z"/></svg>',
  document:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 3.5h6.8L18 6.7V20.5a1 1 0 01-1 1H8a1 1 0 01-1-1V4.5a1 1 0 011-1z"/></svg>',
  qr:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M4 4h7v7H4V4zm2 2v3h3V6H6zm9-2h5v5h-5V4zm2 2v1h1V6h-1zM4 13h7v7H4v-7zm2 2v3h3v-3H6z"/></svg>',
  link:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M10.59 13.41a1 1 0 010-1.42l2.34-2.34a3 3 0 114.24 4.24l-1.41 1.41-1.42-1.41 1.41-1.42a1 1 0 10-1.41-1.41l-2.34 2.34a1 1 0 01-1.42 0z"/></svg>',
  server:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M5 4.5h14A1.5 1.5 0 0120.5 6v3A1.5 1.5 0 0119 10.5H5A1.5 1.5 0 013.5 9V6A1.5 1.5 0 015 4.5zM7 7.5a1 1 0 100 2 1 1 0 000-2z"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-.75 5.5h1.5v6h-1.5v-6z"/></svg>',
  sync:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 4V1.5l3.5 3.5L12 8.5V6a6 6 0 013.87 10.63l1.06 1.06A7.5 7.5 0 0012 4.5V4z"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-.75 5.5h1.5V11h-1.5V7.5z"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-.75 3.5h1.5V12l3.25 1.95-.75 1.23-3.75-2.25V7.5z"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M14 3l1 3h4l-3 3 1 8-5-3-5 3 1-8-3-3h4l1-3h5z"/></svg>',
  plugin:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 3h3v3H7V3zm7 0h3v3h-3V3zM7 18h3v3H7v-3zm7 0h3v3h-3v-3z"/></svg>',
  flash:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13.3 5.3l5.4 5.25-5.4 5.25-1.05-1.05 3.45-3.45H4v-1.5h11.7l-3.45-3.45 1.05-1.05z"/></svg>',
  open:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8.5 5.5H6A1.5 1.5 0 004.5 7v11A1.5 1.5 0 006 19.5h12a1.5 1.5 0 001.5-1.5v-2.5h-1.5V17H6V7h2.5v-1.5zM14 4h6v6h-1.5V6.56l-7.72 7.72-1.06-1.06L17.44 5.5H14V4z"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7.5 9.5L12 14l4.5-4.5-1.06-1.06L12 11.88 8.56 8.44 7.5 9.5z"/></svg>',
  file:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 3.5h6.8L18 7.7V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1zm6.2 1.5H7.5v15h9V8.3L13.2 5z"/></svg>',
  folder:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3.5 7A1.5 1.5 0 015 5.5h4.2l1.5 1.5H19A1.5 1.5 0 0120.5 8.5v9A1.5 1.5 0 0119 19H5A1.5 1.5 0 013.5 17.5V7zm1.5.5v10h14v-8H10.1L8.6 8H5z"/></svg>',
  manage:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4 6.5h11v1.5H4V6.5zm0 5h16v1.5H4V11.5zm0 5h11v1.5H4V16.5zM18.2 5.2l1.06 1.06-2.47 2.47H19.5V10h-4.5V5.5h1.25v2.71l2.95-2.99z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M9.6 16.2L5.4 12l1.05-1.05 3.15 3.15 7.05-7.05L17.7 8.1 9.6 16.2z"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7.05 6l1.06-1.06L12 8.83l3.89-3.89L17.95 6 14.12 9.83l3.83 3.83-1.06 1.06L12 10.89l-3.89 3.83L7.05 13.66l3.83-3.83L7.05 6z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M9.5 4h5l.5 1.5H19v1.5H5V5.5h4l.5-1.5zM6.5 8h11l-.7 11.2A1.5 1.5 0 0115.3 20.5H8.7a1.5 1.5 0 01-1.5-1.3L6.5 8zm2.2 2.2.5 8.1h1.5l-.5-8.1H8.7zm4.6 0-.5 8.1h1.5l.5-8.1h-1.5z"/></svg>'
};

const PLUGIN_COLORS: Record<string, string> = {
  "clipboard-workbench": "#ff7e2f",
  litesnap: "#4b75ff",
  "webtools-file-hash": "#178bff",
  "webtools-qrcode": "#737b8a",
  "webtools-url-parse": "#5d51e9",
  "webtools-regex": "#ec4770",
  "hardware-inspector": "#3d78ff",
  "webtools-port-helper": "#2eb67d"
};

function createIconElement(name: string, compact = false): HTMLSpanElement {
  const wrapper = document.createElement("span");
  wrapper.className = compact ? "icon-badge icon-badge--compact" : "icon-badge";
  wrapper.innerHTML = ICON_SVGS[name] ?? ICON_SVGS.info ?? "";
  return wrapper;
}

window.__LL_COMMAND_CENTER_ICONS__ = {
  createIconElement,
  pluginColors: PLUGIN_COLORS,
  icons: ICON_SVGS
};
