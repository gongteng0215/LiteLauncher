(() => {
  const api = (window as unknown as {
    selectionBackdrop?: { close(point?: { x: number; y: number }): Promise<boolean> };
  }).selectionBackdrop;
  let dismissing = false;
  window.addEventListener("pointerdown", (event: PointerEvent) => {
    if (!api || dismissing) return;
    dismissing = true;
    void api.close({ x: event.screenX, y: event.screenY }).catch(() => { dismissing = false; });
  }, true);
})();
