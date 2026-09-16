import { Worker } from "node:worker_threads";

// Native GDI calls must never block Electron's input/cancellation event loop.
export class NativeCaptureWorker {
  private worker: Worker | null = null;
  private nextId = 0;
  private failed = false;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();

  constructor(private readonly addonPath: string, private readonly timeoutMs = 5000) {}

  public call<T>(method: string, ...args: unknown[]): Promise<T> {
    if (this.failed) return Promise.reject(new Error("Native capture worker unavailable; restart LiteLauncher."));
    if (!this.worker) {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const addon = require(workerData);
        parentPort.on('message', ({ id, method, args }) => {
          try { parentPort.postMessage({ id, value: addon[method](...args) }); }
          catch (error) { parentPort.postMessage({ id, error: String(error) }); }
        });
      `, { eval: true, workerData: this.addonPath });
      this.worker = worker;
      worker.on("message", ({ id, value, error }) => {
        const request = this.pending.get(id);
        if (!request) return;
        clearTimeout(request.timer);
        this.pending.delete(id);
        if (error) request.reject(new Error(error));
        else request.resolve(value);
        if (!this.pending.size) worker.unref();
      });
      worker.on("error", (error) => this.fail(error instanceof Error ? error : new Error(String(error))));
      worker.on("exit", () => this.fail(new Error("Native capture worker exited.")));
    }
    const worker = this.worker;
    worker.ref();
    return new Promise<T>((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => this.fail(new Error("Native capture timed out.")), this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, method, args });
    });
  }

  private fail(error: Error): void {
    this.failed = true;
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
    const worker = this.worker;
    this.worker = null;
    // Do not await termination: a stuck OS call may not return immediately.
    worker?.unref();
    void worker?.terminate();
  }
}
