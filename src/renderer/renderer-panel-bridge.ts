const panelImpls = window.__LL_PANEL_IMPLS__;

if (!panelImpls) {
  throw new Error("renderer plugin panel impls not initialized");
}

const panelImplsSafe = panelImpls;
