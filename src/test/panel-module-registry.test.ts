import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

class FakeList {
  public children: unknown[] = [];

  replaceChildren(...children: unknown[]): void {
    this.children = children;
  }
}

function createRegistryFixture(options: { development?: boolean } = {}) {
  const reports: unknown[] = [];
  const recoveries: Array<{ pluginId: string; message: string }> = [];
  const list = new FakeList();
  const windowObject: Record<string, unknown> = {
    launcher: {
      isDebugKeysEnabled: () => options.development === true,
      reportErrorLog: async (input: unknown) => {
        reports.push(input);
        return true;
      }
    }
  };
  const documentObject = {
    getElementById: () => null,
    createElement: () => ({
      className: "",
      type: "",
      textContent: "",
      append: () => undefined,
      appendChild: () => undefined,
      addEventListener: () => undefined
    })
  };
  const context = vm.createContext({
    window: windowObject,
    document: documentObject,
    HTMLUListElement: FakeList,
    Error,
    Map,
    Set,
    String,
    Array,
    console
  });
  const registrySource = fs.readFileSync(
    path.join(process.cwd(), "dist", "renderer", "panel-module-registry.js"),
    "utf8"
  );
  vm.runInContext(registrySource, context);
  const registry = windowObject.__LL_PANEL_MODULES__ as RendererPanelModuleRegistry;
  const host = {
    list: list as unknown as HTMLUListElement,
    isDevelopment: options.development === true,
    getActivePanel: () => null,
    setStatus: () => undefined,
    renderList: () => undefined,
    refreshEntries: async () => undefined,
    backToSearch: () => undefined,
    copyText: async () => true,
    getLegacyImpls: () => ({}) as NonNullable<Window["__LL_PANEL_IMPLS__"]>,
    showRecovery: (pluginId: string, message: string) => {
      recoveries.push({ pluginId, message });
    },
    reportError: (pluginId: string, message: string, detail?: string) => {
      reports.push({ pluginId, message, detail });
    }
  } satisfies RendererPanelHost;
  return { registry, host, reports, recoveries };
}

const panelState: ActivePluginPanelState = {
  pluginId: "sample",
  title: "Sample",
  subtitle: "Sample panel"
};

test("panel registry supports module-before-host loading order", () => {
  const fixture = createRegistryFixture();
  let renderCount = 0;
  fixture.registry.register({
    id: "sample-module",
    pluginIds: ["sample"],
    render: () => {
      renderCount += 1;
    }
  });
  fixture.registry.configureHost(fixture.host);

  assert.equal(fixture.registry.render("sample", panelState), true);
  assert.equal(renderCount, 1);
  assert.deepEqual(fixture.registry.listModuleIds(), ["sample-module"]);
  assert.deepEqual(fixture.registry.listPluginIds(), ["sample"]);
});

test("panel registry rejects duplicate module and plugin IDs", () => {
  const fixture = createRegistryFixture();
  fixture.registry.configureHost(fixture.host);
  const first: RendererPanelModule = {
    id: "sample-module",
    pluginIds: ["sample"],
    render: () => undefined
  };
  fixture.registry.register(first);
  fixture.registry.register({ ...first });
  fixture.registry.register({
    id: "second-module",
    pluginIds: ["sample"],
    render: () => undefined
  });

  assert.deepEqual(fixture.registry.listModuleIds(), ["sample-module"]);
  assert.equal(fixture.recoveries.length, 2);
  assert.equal(fixture.reports.length, 2);
});

test("panel registry reports missing implementation and uninitialized Host", () => {
  const fixture = createRegistryFixture();
  fixture.registry.register({
    id: "sample-module",
    pluginIds: ["sample"],
    render: () => undefined
  });

  assert.equal(fixture.registry.render("sample", panelState), false);
  fixture.registry.configureHost(fixture.host);
  assert.equal(fixture.registry.render("missing", panelState), false);
  assert.ok(fixture.reports.length >= 2);
});

test("panel registry throws configuration errors in development", () => {
  const fixture = createRegistryFixture({ development: true });
  fixture.registry.configureHost(fixture.host);
  fixture.registry.register({
    id: "sample-module",
    pluginIds: ["sample"],
    render: () => undefined
  });

  assert.throws(() => {
    fixture.registry.register({
      id: "sample-module",
      pluginIds: ["other"],
      render: () => undefined
    });
  }, /重复/);
});

test("five complex panel modules are loaded after the registry and legacy implementations", () => {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "index.html"),
    "utf8"
  );
  const registryIndex = html.indexOf("panel-module-registry.js");
  const implsIndex = html.indexOf("plugin-panel-impls.js");
  assert.ok(registryIndex >= 0 && registryIndex < implsIndex);

  for (const moduleName of ["cashflow", "codeagent", "hardware", "clipboard", "litesnap"]) {
    const moduleScript = `panel-modules/${moduleName}-panel-module.js`;
    assert.ok(html.includes(moduleScript), `${moduleScript} should be loaded`);
    assert.ok(html.indexOf(moduleScript) > implsIndex, `${moduleScript} should load after impls`);
    assert.ok(
      fs.existsSync(
        path.join(process.cwd(), "src", "renderer", "panel-modules", `${moduleName}-panel-module.ts`)
      )
    );
  }
});

test("all default visible plugins are covered by registered panel modules", () => {
  const contextWindow: Record<string, unknown> = {};
  const registered = new Set<string>();
  const context = vm.createContext({
    window: contextWindow,
    RendererPanelRuntime: {},
    HTMLFormElement: class {},
    console
  });
  const constantsSource = fs.readFileSync(
    path.join(process.cwd(), "dist", "renderer", "plugin-constants.js"),
    "utf8"
  );
  vm.runInContext(constantsSource, context);
  contextWindow.__LL_PANEL_MODULES__ = {
    register: (module: RendererPanelModule) => {
      for (const pluginId of module.pluginIds) {
        assert.equal(registered.has(pluginId), false, `${pluginId} should only register once`);
        registered.add(pluginId);
      }
    }
  };

  const moduleFiles = [
    "cashflow-panel-module.js",
    "codeagent-panel-module.js",
    "hardware-panel-module.js",
    "clipboard-panel-module.js",
    "litesnap-panel-module.js",
    "structured-panel-modules.js",
    "security-panel-modules.js",
    "text-panel-modules.js",
    "media-panel-modules.js",
    "developer-panel-modules.js",
    "dictionary-translate-panel-modules.js"
  ];
  for (const fileName of moduleFiles) {
    vm.runInContext(
      fs.readFileSync(path.join(process.cwd(), "dist", "renderer", "panel-modules", fileName), "utf8"),
      context
    );
  }

  const constants = contextWindow.__LL_PLUGIN_CONSTANTS__ as {
    DEFAULT_VISIBLE_PLUGIN_IDS: string[];
  };
  assert.deepEqual(
    [...registered].sort(),
    [...constants.DEFAULT_VISIBLE_PLUGIN_IDS].sort()
  );
});
