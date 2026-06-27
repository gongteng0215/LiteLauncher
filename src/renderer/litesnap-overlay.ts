(() => {
  type OverlayAction = "copy" | "save" | "pin" | "cancel";
  type ResizeHandle = "n" | "s" | "w" | "e" | "nw" | "ne" | "sw" | "se";
  type DragMode =
    | "idle"
    | "selecting"
    | "moving"
    | "resizing"
    | "drawing"
    | "annotation-moving";
  type AnnotationTool =
    | "select"
    | "rect"
    | "ellipse"
    | "line"
    | "arrow"
    | "pen"
    | "highlight"
    | "text"
    | "number"
    | "mosaic"
    | "blur";

  type OverlayState = {
    captureId: string;
    imageDataUrl: string | null;
    sourceImageDataUrl: string | null;
    viewportWidth: number;
    viewportHeight: number;
    selectionMinSize: number;
    annotationColor: string;
    annotationLineWidth: number;
    annotationTextSize: number;
    annotationTool: AnnotationTool;
    annotationFillShapes: boolean;
  };

  type SelectionRect = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  type Point = { x: number; y: number };

  type ShapeAnnotation = {
    type: "rect" | "ellipse" | "line" | "arrow";
    color: string;
    lineWidth: number;
    start: Point;
    end: Point;
    filled?: boolean;
  };

  type PenAnnotation = {
    type: "pen";
    color: string;
    lineWidth: number;
    points: Point[];
  };

  type HighlightAnnotation = {
    type: "highlight";
    color: string;
    lineWidth: number;
    start: Point;
    end: Point;
  };

  type TextAnnotation = {
    type: "text";
    color: string;
    fontSize: number;
    position: Point;
    text: string;
  };

  type NumberAnnotation = {
    type: "number";
    color: string;
    fontSize: number;
    position: Point;
    value: number;
  };

  type RegionEffectAnnotation = {
    type: "mosaic" | "blur";
    points: Point[];
    brushSize: number;
    intensity: number;
  };

  type Annotation =
    | ShapeAnnotation
    | PenAnnotation
    | HighlightAnnotation
    | TextAnnotation
    | NumberAnnotation
    | RegionEffectAnnotation;

  type PointerStartState = {
    pointerId: number;
    x: number;
    y: number;
    selection: SelectionRect | null;
    handle: ResizeHandle | null;
    annotationIndex?: number;
    annotationSnapshot?: Annotation;
  };

  type LiteSnapOverlayWindow = Window & {
    __LL_LITESNAP_PREPARE_CAPTURE__?: () => void;
  };

  const PRESET_COLORS = [
    "#ff3b30",
    "#ff9500",
    "#ffcc00",
    "#34c759",
    "#0a84ff",
    "#ffffff",
    "#1c1c1e"
  ];
  const PRESET_WIDTHS = [2, 4, 7];
  const VALID_TOOLS = new Set<AnnotationTool>([
    "select",
    "rect",
    "ellipse",
    "line",
    "arrow",
    "pen",
    "highlight",
    "text",
    "number",
    "mosaic",
    "blur"
  ]);

  const overlayRoot = document.getElementById("litesnap-overlay");
  const hintNode = document.getElementById("litesnap-hint");
  const canvasNode = document.getElementById("litesnap-canvas") as HTMLCanvasElement | null;
  const loupeNode = document.getElementById("litesnap-loupe");
  const loupeCanvas = document.getElementById("litesnap-loupe-canvas") as HTMLCanvasElement | null;
  const loupeColorNode = document.getElementById("litesnap-loupe-color");
  const brushPreviewNode = document.getElementById("litesnap-brush-preview");
  const windowHintNode = document.getElementById("litesnap-window-hint");
  const selectionNode = document.getElementById("litesnap-selection");
  const sizeNode = document.getElementById("litesnap-size");
  const toolbarNode = document.getElementById("litesnap-toolbar");
  const statusNode = document.getElementById("litesnap-status");
  const colorsNode = document.getElementById("litesnap-colors");
  const widthsNode = document.getElementById("litesnap-widths");
  const textInput = document.getElementById("litesnap-text-input") as HTMLInputElement | null;
  const fillToggleNode = document.getElementById("litesnap-fill-toggle");

  let overlayState: OverlayState | null = null;
  let activeCaptureId = "";
  let selection: SelectionRect | null = null;
  let dragMode: DragMode = "idle";
  let pointerStart: PointerStartState | null = null;
  let committing = false;

  let activeTool: AnnotationTool = "select";
  let activeColor = "#ff3b30";
  let activeLineWidth = 3;
  let textSize = 16;
  let annotations: Annotation[] = [];
  let redoAnnotations: Annotation[] = [];
  let selectedAnnotationIndex: number | null = null;
  let draftAnnotation: Annotation | null = null;
  let compositeImage: HTMLImageElement | null = null;
  let compositeImageSource = "";
  let editingText = false;
  let pendingTextPosition: Point | null = null;
  let toolbarSize = { width: 0, height: 0 };
  let numberSequence = 1;
  let fillShapes = false;
  let persistSettingsTimer: number | null = null;
  let lastSelection: SelectionRect | null = null;
  let hoverWindowRect: SelectionRect | null = null;
  let windowQueryTimer: number | null = null;
  let windowQuerySeq = 0;
  let hoveredColor = "#000000";

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function getViewportWidth(): number {
    return overlayState?.viewportWidth ?? window.innerWidth;
  }

  function getViewportHeight(): number {
    return overlayState?.viewportHeight ?? window.innerHeight;
  }

  function getMinSelectionSize(): number {
    return overlayState?.selectionMinSize ?? 24;
  }

  function isOverlayReady(): boolean {
    return Boolean(overlayState?.imageDataUrl);
  }

  function isValidSelection(rect: SelectionRect | null): rect is SelectionRect {
    if (!rect) {
      return false;
    }

    return rect.width >= getMinSelectionSize() && rect.height >= getMinSelectionSize();
  }

  function containsPoint(rect: SelectionRect, x: number, y: number): boolean {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  function clampPointToSelection(x: number, y: number): Point {
    if (!selection) {
      return { x, y };
    }
    return {
      x: clamp(x, selection.x, selection.x + selection.width),
      y: clamp(y, selection.y, selection.y + selection.height)
    };
  }

  function normalizeRect(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): SelectionRect {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    return {
      x: clamp(x, 0, getViewportWidth()),
      y: clamp(y, 0, getViewportHeight()),
      width: clamp(width, 0, getViewportWidth()),
      height: clamp(height, 0, getViewportHeight())
    };
  }

  function boundsFromPoints(start: Point, end: Point): SelectionRect {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
  }

  function getImageScale(image: HTMLImageElement): { scaleX: number; scaleY: number } {
    return {
      scaleX: image.naturalWidth / Math.max(1, getViewportWidth()),
      scaleY: image.naturalHeight / Math.max(1, getViewportHeight())
    };
  }

  function mosaicBlockSize(intensity: number, scale = 1): number {
    return Math.max(4, Math.round(Math.max(6, intensity * 3) * scale));
  }

  function blurRadius(intensity: number, scale = 1): number {
    return Math.max(3, Math.round(Math.max(4, intensity * 2) * scale));
  }

  function brushSizeForLineWidth(lineWidth: number): number {
    return Math.max(16, lineWidth * 4);
  }

  function applyMosaicPixels(
    ctx: CanvasRenderingContext2D,
    bounds: SelectionRect,
    blockSize: number
  ): void {
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    const x = Math.floor(bounds.x);
    const y = Math.floor(bounds.y);
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const block = Math.max(4, Math.round(blockSize));

    for (let row = 0; row < height; row += block) {
      for (let col = 0; col < width; col += block) {
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;
        for (let dy = 0; dy < block && row + dy < height; dy += 1) {
          for (let dx = 0; dx < block && col + dx < width; dx += 1) {
            const index = ((row + dy) * width + (col + dx)) * 4;
            red += data[index];
            green += data[index + 1];
            blue += data[index + 2];
            count += 1;
          }
        }
        red = Math.round(red / count);
        green = Math.round(green / count);
        blue = Math.round(blue / count);
        for (let dy = 0; dy < block && row + dy < height; dy += 1) {
          for (let dx = 0; dx < block && col + dx < width; dx += 1) {
            const index = ((row + dy) * width + (col + dx)) * 4;
            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = blue;
            data[index + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  function applyBlurPixels(
    ctx: CanvasRenderingContext2D,
    bounds: SelectionRect,
    radius: number
  ): void {
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    const x = Math.floor(bounds.x);
    const y = Math.floor(bounds.y);
    const temp = document.createElement("canvas");
    temp.width = width;
    temp.height = height;
    const tempCtx = temp.getContext("2d");
    if (!tempCtx) {
      return;
    }

    tempCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, width, height);
    const blurred = document.createElement("canvas");
    blurred.width = width;
    blurred.height = height;
    const blurredCtx = blurred.getContext("2d");
    if (!blurredCtx) {
      return;
    }

    blurredCtx.filter = `blur(${radius}px)`;
    blurredCtx.drawImage(temp, 0, 0, width, height);
    blurredCtx.filter = "none";
    ctx.drawImage(blurred, 0, 0, width, height, x, y, width, height);
  }

  function strokeBoundsInDest(
    points: Point[],
    brushDest: number,
    toDestX: (x: number) => number,
    toDestY: (y: number) => number,
    maxWidth: number,
    maxHeight: number
  ): SelectionRect | null {
    if (points.length === 0) {
      return null;
    }
    const xs = points.map((point) => toDestX(point.x));
    const ys = points.map((point) => toDestY(point.y));
    const pad = brushDest / 2 + 2;
    const left = Math.max(0, Math.floor(Math.min(...xs) - pad));
    const top = Math.max(0, Math.floor(Math.min(...ys) - pad));
    const right = Math.min(maxWidth, Math.ceil(Math.max(...xs) + pad));
    const bottom = Math.min(maxHeight, Math.ceil(Math.max(...ys) + pad));
    if (right - left < 1 || bottom - top < 1) {
      return null;
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  // Paints a mosaic/blur brush stroke. The whole stroke bounding box is
  // pixelated/blurred from the source image, then masked by the brush path so
  // only what the user dragged over gets the effect (Snipaste-style brush).
  function paintBrushEffect(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    annotation: RegionEffectAnnotation,
    options: {
      destScaleX: number;
      destScaleY: number;
      destOffsetX: number;
      destOffsetY: number;
      destWidth: number;
      destHeight: number;
    }
  ): void {
    const { destScaleX, destScaleY, destOffsetX, destOffsetY, destWidth, destHeight } =
      options;
    const toDestX = (x: number): number => x * destScaleX + destOffsetX;
    const toDestY = (y: number): number => y * destScaleY + destOffsetY;
    const brushDest = Math.max(2, annotation.brushSize * destScaleX);
    const bbox = strokeBoundsInDest(
      annotation.points,
      brushDest,
      toDestX,
      toDestY,
      destWidth,
      destHeight
    );
    if (!bbox) {
      return;
    }

    const tile = document.createElement("canvas");
    tile.width = Math.max(1, Math.round(bbox.width));
    tile.height = Math.max(1, Math.round(bbox.height));
    const tileCtx = tile.getContext("2d", { willReadFrequently: true });
    if (!tileCtx) {
      return;
    }

    // Draw the full source image into the tile aligned to dest space (offset by
    // the bbox origin), so tile pixels correspond 1:1 with the dest region.
    const fullDestWidth = getViewportWidth() * destScaleX;
    const fullDestHeight = getViewportHeight() * destScaleY;
    tileCtx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      destOffsetX - bbox.x,
      destOffsetY - bbox.y,
      fullDestWidth,
      fullDestHeight
    );

    if (annotation.type === "mosaic") {
      applyMosaicPixels(
        tileCtx,
        { x: 0, y: 0, width: tile.width, height: tile.height },
        mosaicBlockSize(annotation.intensity, destScaleX)
      );
    } else {
      const blurred = document.createElement("canvas");
      blurred.width = tile.width;
      blurred.height = tile.height;
      const blurredCtx = blurred.getContext("2d");
      if (!blurredCtx) {
        return;
      }
      blurredCtx.filter = `blur(${blurRadius(annotation.intensity, destScaleX)}px)`;
      blurredCtx.drawImage(tile, 0, 0);
      blurredCtx.filter = "none";
      tileCtx.clearRect(0, 0, tile.width, tile.height);
      tileCtx.drawImage(blurred, 0, 0);
    }

    // Mask the effect tile down to the brush stroke.
    tileCtx.globalCompositeOperation = "destination-in";
    tileCtx.strokeStyle = "rgba(0, 0, 0, 1)";
    tileCtx.fillStyle = "rgba(0, 0, 0, 1)";
    tileCtx.lineCap = "round";
    tileCtx.lineJoin = "round";
    tileCtx.lineWidth = brushDest;
    const pts = annotation.points;
    if (pts.length === 1) {
      tileCtx.beginPath();
      tileCtx.arc(
        toDestX(pts[0].x) - bbox.x,
        toDestY(pts[0].y) - bbox.y,
        brushDest / 2,
        0,
        Math.PI * 2
      );
      tileCtx.fill();
    } else {
      tileCtx.beginPath();
      tileCtx.moveTo(toDestX(pts[0].x) - bbox.x, toDestY(pts[0].y) - bbox.y);
      for (let index = 1; index < pts.length; index += 1) {
        tileCtx.lineTo(toDestX(pts[index].x) - bbox.x, toDestY(pts[index].y) - bbox.y);
      }
      tileCtx.stroke();
    }
    tileCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(tile, bbox.x, bbox.y);
  }

  function drawRegionEffectFromSource(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    annotation: RegionEffectAnnotation
  ): void {
    paintBrushEffect(ctx, image, annotation, {
      destScaleX: 1,
      destScaleY: 1,
      destOffsetX: 0,
      destOffsetY: 0,
      destWidth: getViewportWidth(),
      destHeight: getViewportHeight()
    });
  }

  function recalculateNumberSequence(): void {
    const values = annotations
      .filter((annotation): annotation is NumberAnnotation => annotation.type === "number")
      .map((annotation) => annotation.value);
    numberSequence = values.length === 0 ? 1 : Math.max(...values) + 1;
  }

  function addAnnotation(annotation: Annotation): void {
    annotations.push(annotation);
    redoAnnotations = [];
    // Mosaic/blur strokes are one-shot and not re-selectable, so leave nothing
    // selected after painting them.
    selectedAnnotationIndex =
      annotation.type === "mosaic" || annotation.type === "blur"
        ? null
        : annotations.length - 1;
    recalculateNumberSequence();
  }

  function cloneAnnotation(annotation: Annotation): Annotation {
    return JSON.parse(JSON.stringify(annotation)) as Annotation;
  }

  function expandRect(rect: SelectionRect, padding: number): SelectionRect {
    const left = Math.max(0, rect.x - padding);
    const top = Math.max(0, rect.y - padding);
    const right = Math.min(getViewportWidth(), rect.x + rect.width + padding);
    const bottom = Math.min(getViewportHeight(), rect.y + rect.height + padding);
    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    };
  }

  function boundsFromPointList(points: Point[]): SelectionRect | null {
    if (points.length === 0) {
      return null;
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  function getAnnotationBounds(annotation: Annotation): SelectionRect | null {
    if (annotation.type === "pen") {
      const bounds = boundsFromPointList(annotation.points);
      return bounds ? expandRect(bounds, Math.max(6, annotation.lineWidth + 4)) : null;
    }
    if (annotation.type === "mosaic" || annotation.type === "blur") {
      const bounds = boundsFromPointList(annotation.points);
      return bounds ? expandRect(bounds, Math.max(6, annotation.brushSize / 2 + 2)) : null;
    }
    if (annotation.type === "text") {
      const lines = annotation.text.split("\n");
      const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
      return expandRect(
        {
          x: annotation.position.x,
          y: annotation.position.y,
          width: Math.max(12, longest * annotation.fontSize * 0.62),
          height: Math.max(annotation.fontSize, lines.length * annotation.fontSize * 1.2)
        },
        6
      );
    }
    if (annotation.type === "number") {
      const radius = Math.max(12, annotation.fontSize * 0.58);
      return {
        x: annotation.position.x - radius,
        y: annotation.position.y - radius,
        width: radius * 2,
        height: radius * 2
      };
    }
    if ("start" in annotation && "end" in annotation) {
      const bounds = boundsFromPoints(annotation.start, annotation.end);
      return expandRect(bounds, Math.max(6, "lineWidth" in annotation ? annotation.lineWidth + 4 : 6));
    }
    return null;
  }

  function hitTestAnnotation(point: Point): number | null {
    for (let index = annotations.length - 1; index >= 0; index -= 1) {
      const annotation = annotations[index];
      // Mosaic/blur brush strokes are one-shot; they cannot be re-selected.
      if (annotation.type === "mosaic" || annotation.type === "blur") {
        continue;
      }
      const bounds = getAnnotationBounds(annotation);
      if (bounds && containsPoint(bounds, point.x, point.y)) {
        return index;
      }
    }
    return null;
  }

  function moveAnnotation(annotation: Annotation, dx: number, dy: number): void {
    if (
      annotation.type === "pen" ||
      annotation.type === "mosaic" ||
      annotation.type === "blur"
    ) {
      annotation.points = annotation.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy
      }));
      return;
    }
    if (annotation.type === "text" || annotation.type === "number") {
      annotation.position = {
        x: annotation.position.x + dx,
        y: annotation.position.y + dy
      };
      return;
    }
    if ("start" in annotation && "end" in annotation) {
      annotation.start = { x: annotation.start.x + dx, y: annotation.start.y + dy };
      annotation.end = { x: annotation.end.x + dx, y: annotation.end.y + dy };
    }
  }

  function schedulePersistAnnotationSettings(): void {
    if (persistSettingsTimer !== null) {
      window.clearTimeout(persistSettingsTimer);
    }
    persistSettingsTimer = window.setTimeout(() => {
      persistSettingsTimer = null;
      void window.launcher.setLiteSnapSettings({
        annotationColor: activeColor,
        annotationLineWidth: activeLineWidth,
        annotationTextSize: textSize,
        annotationTool: activeTool,
        annotationFillShapes: fillShapes
      });
    }, 400);
  }

  function setToolbarDisabled(disabled: boolean): void {
    if (!toolbarNode) {
      return;
    }

    toolbarNode.querySelectorAll("button").forEach((button) => {
      if (button instanceof HTMLButtonElement) {
        button.disabled = disabled;
      }
    });
  }

  function showStatus(message: string, persistent = false): void {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.hidden = false;
    if (persistent) {
      return;
    }

    window.setTimeout(() => {
      if (statusNode.textContent === message) {
        statusNode.hidden = true;
      }
    }, 1800);
  }

  function hideStatus(): void {
    if (!statusNode) {
      return;
    }
    statusNode.hidden = true;
  }

  function hideBrushPreview(): void {
    if (brushPreviewNode) {
      brushPreviewNode.hidden = true;
    }
  }

  function updateBrushPreview(
    x: number,
    y: number,
    eventTarget: EventTarget | null = null
  ): void {
    if (!brushPreviewNode) {
      return;
    }

    const targetElement = eventTarget instanceof Element ? eventTarget : null;
    const isOverToolbar = Boolean(targetElement?.closest(".litesnap-overlay__toolbar"));
    const isBrushTool = activeTool === "mosaic" || activeTool === "blur";
    if (
      !isBrushTool ||
      isOverToolbar ||
      !selection ||
      !isValidSelection(selection) ||
      !containsPoint(selection, x, y)
    ) {
      hideBrushPreview();
      return;
    }

    const size = brushSizeForLineWidth(activeLineWidth);
    brushPreviewNode.style.width = `${size}px`;
    brushPreviewNode.style.height = `${size}px`;
    brushPreviewNode.style.left = `${x}px`;
    brushPreviewNode.style.top = `${y}px`;
    brushPreviewNode.hidden = false;
  }

  function setActiveTool(tool: AnnotationTool, persist = true): void {
    activeTool = tool;
    if (overlayRoot) {
      overlayRoot.dataset.tool = tool;
    }
    toolbarNode?.querySelectorAll<HTMLElement>("[data-tool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tool === tool);
    });
    if (tool !== "text") {
      finishTextInput(true);
    }
    if (tool !== "select") {
      selectedAnnotationIndex = null;
      renderAnnotations();
    }
    if (tool !== "mosaic" && tool !== "blur") {
      hideBrushPreview();
    }
    if (persist) {
      schedulePersistAnnotationSettings();
    }
  }

  function resetSelectionUi(): void {
    selection = null;
    pointerStart = null;
    dragMode = "idle";
    committing = false;
    annotations = [];
    redoAnnotations = [];
    selectedAnnotationIndex = null;
    draftAnnotation = null;
    numberSequence = 1;
    clearWindowHint();
    finishTextInput(true);
    setToolbarDisabled(false);
    setActiveTool("select", false);
    if (selectionNode) {
      selectionNode.hidden = true;
      selectionNode.dataset.moving = "false";
    }
    if (toolbarNode) {
      toolbarNode.hidden = true;
    }
    if (hintNode) {
      hintNode.hidden = false;
    }
    if (loupeNode) {
      loupeNode.hidden = true;
    }
    hideBrushPreview();
    if (canvasNode) {
      canvasNode.hidden = true;
    }
    renderAnnotations();
  }

  function prepareCaptureView(): void {
    resetSelectionUi();
    overlayState = null;
    activeCaptureId = "";
    compositeImage = null;
    compositeImageSource = "";
    if (overlayRoot) {
      overlayRoot.style.backgroundImage = "";
      overlayRoot.dataset.ready = "false";
    }
    showStatus("Preparing screenshot...", true);
  }

  function measureToolbar(): void {
    if (!toolbarNode || toolbarSize.width > 0 || toolbarNode.hidden) {
      return;
    }
    const rect = toolbarNode.getBoundingClientRect();
    if (rect.width > 0) {
      toolbarSize = { width: rect.width, height: rect.height };
    }
  }

  function updateToolbarPosition(): void {
    if (!toolbarNode || !selection || toolbarNode.hidden) {
      return;
    }

    measureToolbar();
    const toolbarWidth = toolbarSize.width || 420;
    const toolbarHeight = toolbarSize.height || 48;
    const viewportWidth = getViewportWidth();
    const viewportHeight = getViewportHeight();
    const desiredLeft = selection.x + selection.width - toolbarWidth;
    const desiredTop = selection.y + selection.height + 12;
    const top =
      desiredTop + toolbarHeight <= viewportHeight
        ? desiredTop
        : Math.max(12, selection.y - toolbarHeight - 12);

    toolbarNode.style.left = `${clamp(
      desiredLeft,
      12,
      Math.max(12, viewportWidth - toolbarWidth - 12)
    )}px`;
    toolbarNode.style.top = `${clamp(
      top,
      12,
      Math.max(12, viewportHeight - toolbarHeight - 12)
    )}px`;
  }

  function shouldShowToolbar(): boolean {
    return isValidSelection(selection) && dragMode === "idle";
  }

  function updateSelectionChrome(): void {
    if (hintNode) {
      hintNode.hidden = shouldShowToolbar();
    }
    if (!toolbarNode) {
      return;
    }
    if (shouldShowToolbar()) {
      toolbarNode.hidden = false;
      updateToolbarPosition();
      return;
    }
    toolbarNode.hidden = true;
  }

  function normalizeWindowRect(rect: SelectionRect | null): SelectionRect | null {
    if (!rect || !isValidSelection(rect)) {
      return null;
    }
    const left = clamp(rect.x, 0, getViewportWidth());
    const top = clamp(rect.y, 0, getViewportHeight());
    const right = clamp(rect.x + rect.width, left + getMinSelectionSize(), getViewportWidth());
    const bottom = clamp(rect.y + rect.height, top + getMinSelectionSize(), getViewportHeight());
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  function clearWindowHint(): void {
    hoverWindowRect = null;
    if (windowHintNode) {
      windowHintNode.hidden = true;
    }
  }

  function renderWindowHint(): void {
    if (!windowHintNode) {
      return;
    }
    // The window highlight is only a hover preview shown before the user has a
    // real selection. Once a valid selection exists or a drag/draw begins, the
    // hint must disappear so it never feels like the whole screen is selected.
    if (
      !hoverWindowRect ||
      dragMode !== "idle" ||
      activeTool !== "select" ||
      isValidSelection(selection)
    ) {
      windowHintNode.hidden = true;
      return;
    }
    windowHintNode.hidden = false;
    windowHintNode.style.left = `${hoverWindowRect.x}px`;
    windowHintNode.style.top = `${hoverWindowRect.y}px`;
    windowHintNode.style.width = `${hoverWindowRect.width}px`;
    windowHintNode.style.height = `${hoverWindowRect.height}px`;
  }

  function scheduleWindowSelectionProbe(x: number, y: number): void {
    if (
      dragMode !== "idle" ||
      activeTool !== "select" ||
      editingText ||
      committing ||
      !isOverlayReady() ||
      isValidSelection(selection)
    ) {
      return;
    }
    if (windowQueryTimer !== null) {
      return;
    }
    const seq = ++windowQuerySeq;
    windowQueryTimer = window.setTimeout(() => {
      windowQueryTimer = null;
      void window.launcher
        .liteSnapGetWindowRectAtPoint(x, y)
        .then((rect) => {
          if (
            seq === windowQuerySeq &&
            dragMode === "idle" &&
            activeTool === "select" &&
            !isValidSelection(selection)
          ) {
            hoverWindowRect = normalizeWindowRect(rect);
            renderWindowHint();
          }
        })
        .catch(() => undefined);
    }, 45);
  }

  function renderSelection(): void {
    if (!selectionNode || !sizeNode) {
      return;
    }

    if (!isValidSelection(selection)) {
      selectionNode.hidden = true;
      if (canvasNode) {
        canvasNode.hidden = true;
      }
      updateSelectionChrome();
      return;
    }

    selectionNode.hidden = false;
    selectionNode.style.left = `${selection.x}px`;
    selectionNode.style.top = `${selection.y}px`;
    selectionNode.style.width = `${selection.width}px`;
    selectionNode.style.height = `${selection.height}px`;
    selectionNode.dataset.moving = dragMode === "moving" ? "true" : "false";
    sizeNode.textContent = `${Math.round(selection.width)} x ${Math.round(selection.height)}`;
    if (dragMode === "idle") {
      lastSelection = { ...selection };
    }

    if (canvasNode) {
      canvasNode.hidden = false;
    }

    updateSelectionChrome();
  }

  function ensureCanvasSize(): CanvasRenderingContext2D | null {
    if (!canvasNode) {
      return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = getViewportWidth();
    const cssHeight = getViewportHeight();
    const pixelWidth = Math.round(cssWidth * dpr);
    const pixelHeight = Math.round(cssHeight * dpr);
    if (canvasNode.width !== pixelWidth || canvasNode.height !== pixelHeight) {
      canvasNode.width = pixelWidth;
      canvasNode.height = pixelHeight;
    }
    canvasNode.style.width = `${cssWidth}px`;
    canvasNode.style.height = `${cssHeight}px`;

    const ctx = canvasNode.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawShape(ctx: CanvasRenderingContext2D, annotation: ShapeAnnotation): void {
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { start, end } = annotation;
    if (annotation.type === "rect") {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      if (annotation.filled) {
        ctx.fillStyle = annotation.color;
        ctx.fillRect(x, y, width, height);
      } else {
        ctx.strokeStyle = annotation.color;
        ctx.strokeRect(x, y, width, height);
      }
      return;
    }

    if (annotation.type === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      return;
    }

    if (annotation.type === "ellipse") {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      if (annotation.filled) {
        ctx.fillStyle = annotation.color;
        ctx.fill();
      } else {
        ctx.strokeStyle = annotation.color;
        ctx.stroke();
      }
      return;
    }

    // arrow
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = Math.max(10, annotation.lineWidth * 3.2);
    const headAngle = Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - headAngle),
      end.y - headLength * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + headAngle),
      end.y - headLength * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();
  }

  function drawPen(ctx: CanvasRenderingContext2D, annotation: PenAnnotation): void {
    if (annotation.points.length === 0) {
      return;
    }
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
    for (let index = 1; index < annotation.points.length; index += 1) {
      ctx.lineTo(annotation.points[index].x, annotation.points[index].y);
    }
    ctx.stroke();
  }

  function drawHighlight(
    ctx: CanvasRenderingContext2D,
    annotation: HighlightAnnotation
  ): void {
    const bounds = boundsFromPoints(annotation.start, annotation.end);
    if (bounds.width < 2 || bounds.height < 2) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = annotation.color;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  function drawText(ctx: CanvasRenderingContext2D, annotation: TextAnnotation): void {
    ctx.fillStyle = annotation.color;
    ctx.textBaseline = "top";
    ctx.font = `600 ${annotation.fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    const lines = annotation.text.split("\n");
    lines.forEach((line, index) => {
      ctx.fillText(line, annotation.position.x, annotation.position.y + index * annotation.fontSize * 1.2);
    });
  }

  function drawNumber(ctx: CanvasRenderingContext2D, annotation: NumberAnnotation): void {
    const radius = Math.max(12, annotation.fontSize * 0.58);
    ctx.beginPath();
    ctx.arc(annotation.position.x, annotation.position.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = annotation.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${annotation.fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    ctx.fillText(String(annotation.value), annotation.position.x, annotation.position.y + 0.5);
  }

  function drawAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    sourceImage: HTMLImageElement | null = null
  ): void {
    if (annotation.type === "pen") {
      drawPen(ctx, annotation);
      return;
    }
    if (annotation.type === "highlight") {
      drawHighlight(ctx, annotation);
      return;
    }
    if (annotation.type === "text") {
      drawText(ctx, annotation);
      return;
    }
    if (annotation.type === "number") {
      drawNumber(ctx, annotation);
      return;
    }
    if (annotation.type === "mosaic" || annotation.type === "blur") {
      if (sourceImage) {
        drawRegionEffectFromSource(ctx, sourceImage, annotation);
      }
      return;
    }
    if (
      annotation.type === "rect" ||
      annotation.type === "ellipse" ||
      annotation.type === "line" ||
      annotation.type === "arrow"
    ) {
      drawShape(ctx, annotation);
    }
  }

  function drawSelectedAnnotationBounds(ctx: CanvasRenderingContext2D): void {
    if (selectedAnnotationIndex === null || selectedAnnotationIndex < 0) {
      return;
    }
    const annotation = annotations[selectedAnnotationIndex];
    if (!annotation) {
      return;
    }
    const bounds = getAnnotationBounds(annotation);
    if (!bounds) {
      return;
    }
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(125, 211, 252, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  function renderAnnotations(): void {
    const ctx = ensureCanvasSize();
    if (!ctx || !canvasNode) {
      return;
    }
    ctx.clearRect(0, 0, getViewportWidth(), getViewportHeight());

    const needsSourcePreview = annotations.some(
      (annotation) => annotation.type === "mosaic" || annotation.type === "blur"
    );
    const draftNeedsSource =
      draftAnnotation?.type === "mosaic" || draftAnnotation?.type === "blur";
    if ((needsSourcePreview || draftNeedsSource) && !compositeImage) {
      void ensureCompositeImage().then(() => renderAnnotations());
      return;
    }

    const items = draftAnnotation ? [...annotations, draftAnnotation] : annotations;
    for (const annotation of items) {
      drawAnnotation(ctx, annotation, compositeImage);
    }
    drawSelectedAnnotationBounds(ctx);
  }

  function applyMove(nextX: number, nextY: number): void {
    if (!selection || !pointerStart?.selection) {
      return;
    }

    const maxX = getViewportWidth() - pointerStart.selection.width;
    const maxY = getViewportHeight() - pointerStart.selection.height;
    selection = {
      x: clamp(pointerStart.selection.x + (nextX - pointerStart.x), 0, maxX),
      y: clamp(pointerStart.selection.y + (nextY - pointerStart.y), 0, maxY),
      width: pointerStart.selection.width,
      height: pointerStart.selection.height
    };
  }

  function applyAnnotationMove(nextX: number, nextY: number): void {
    if (
      !pointerStart ||
      pointerStart.annotationIndex === undefined ||
      !pointerStart.annotationSnapshot
    ) {
      return;
    }
    const annotation = annotations[pointerStart.annotationIndex];
    if (!annotation) {
      return;
    }
    annotations[pointerStart.annotationIndex] = cloneAnnotation(
      pointerStart.annotationSnapshot
    );
    let dx = nextX - pointerStart.x;
    let dy = nextY - pointerStart.y;
    const bounds = getAnnotationBounds(annotations[pointerStart.annotationIndex]);
    if (selection && bounds) {
      dx = clamp(
        dx,
        selection.x - bounds.x,
        selection.x + selection.width - bounds.x - bounds.width
      );
      dy = clamp(
        dy,
        selection.y - bounds.y,
        selection.y + selection.height - bounds.y - bounds.height
      );
    }
    moveAnnotation(
      annotations[pointerStart.annotationIndex],
      dx,
      dy
    );
  }

  function applyResize(nextX: number, nextY: number): void {
    if (!pointerStart?.selection || !pointerStart.handle) {
      return;
    }

    const minSize = getMinSelectionSize();
    const base = pointerStart.selection;
    let left = base.x;
    let top = base.y;
    let right = base.x + base.width;
    let bottom = base.y + base.height;

    if (pointerStart.handle.includes("n")) {
      top = clamp(nextY, 0, bottom - minSize);
    }
    if (pointerStart.handle.includes("s")) {
      bottom = clamp(nextY, top + minSize, getViewportHeight());
    }
    if (pointerStart.handle.includes("w")) {
      left = clamp(nextX, 0, right - minSize);
    }
    if (pointerStart.handle.includes("e")) {
      right = clamp(nextX, left + minSize, getViewportWidth());
    }

    selection = {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  function getHandleFromTarget(target: EventTarget | null): ResizeHandle | null {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const value = target.dataset.handle;
    if (
      value === "n" ||
      value === "s" ||
      value === "w" ||
      value === "e" ||
      value === "nw" ||
      value === "ne" ||
      value === "sw" ||
      value === "se"
    ) {
      return value;
    }
    return null;
  }

  async function ensureCompositeImage(): Promise<HTMLImageElement | null> {
    const source = overlayState?.sourceImageDataUrl ?? overlayState?.imageDataUrl ?? null;
    if (!source) {
      return null;
    }
    if (compositeImage && compositeImageSource === source) {
      return compositeImage;
    }

    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        compositeImage = image;
        compositeImageSource = source;
        resolve(image);
      };
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }

  function rgbToHex(red: number, green: number, blue: number): string {
    return `#${[red, green, blue]
      .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  }

  function positionLoupe(x: number, y: number): void {
    if (!loupeNode) {
      return;
    }
    const left =
      x + 20 + 126 <= getViewportWidth()
        ? x + 20
        : Math.max(12, x - 138);
    const top =
      y + 20 + 132 <= getViewportHeight()
        ? y + 20
        : Math.max(12, y - 144);
    loupeNode.style.left = `${left}px`;
    loupeNode.style.top = `${top}px`;
  }

  function updateLoupe(x: number, y: number): void {
    if (!loupeNode || !loupeCanvas || !loupeColorNode || !isOverlayReady()) {
      return;
    }
    positionLoupe(x, y);
    loupeNode.hidden = false;

    void ensureCompositeImage().then((image) => {
      const ctx = loupeCanvas.getContext("2d", { willReadFrequently: true });
      if (!image || !ctx) {
        return;
      }
      const scale = getImageScale(image);
      const sourceX = clamp(Math.round(x * scale.scaleX), 0, image.naturalWidth - 1);
      const sourceY = clamp(Math.round(y * scale.scaleY), 0, image.naturalHeight - 1);
      const sampleSize = 16;
      const sx = clamp(sourceX - sampleSize / 2, 0, image.naturalWidth - sampleSize);
      const sy = clamp(sourceY - sampleSize / 2, 0, image.naturalHeight - sampleSize);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
      ctx.drawImage(
        image,
        sx,
        sy,
        sampleSize,
        sampleSize,
        0,
        0,
        loupeCanvas.width,
        loupeCanvas.height
      );
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(48, 96);
      ctx.moveTo(0, 48);
      ctx.lineTo(96, 48);
      ctx.stroke();
      const pixel = ctx.getImageData(48, 48, 1, 1).data;
      hoveredColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
      loupeColorNode.textContent = `${hoveredColor}  RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    });
  }

  async function buildCompositeDataUrl(rect: SelectionRect): Promise<string | null> {
    if (annotations.length === 0) {
      return null;
    }

    const image = await ensureCompositeImage();
    if (!image) {
      return null;
    }

    const scaleX = image.naturalWidth / Math.max(1, getViewportWidth());
    const scaleY = image.naturalHeight / Math.max(1, getViewportHeight());
    const outputWidth = Math.max(1, Math.round(rect.width * scaleX));
    const outputHeight = Math.max(1, Math.round(rect.height * scaleY));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(
      image,
      rect.x * scaleX,
      rect.y * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    for (const annotation of annotations) {
      if (annotation.type === "mosaic" || annotation.type === "blur") {
        paintBrushEffect(ctx, image, annotation, {
          destScaleX: scaleX,
          destScaleY: scaleY,
          destOffsetX: -rect.x * scaleX,
          destOffsetY: -rect.y * scaleY,
          destWidth: outputWidth,
          destHeight: outputHeight
        });
        continue;
      }

      ctx.setTransform(scaleX, 0, 0, scaleY, -rect.x * scaleX, -rect.y * scaleY);
      drawAnnotation(ctx, annotation);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    return canvas.toDataURL("image/png");
  }

  async function commitSelection(action: OverlayAction): Promise<void> {
    if (action === "cancel") {
      await window.launcher.liteSnapCancelCapture();
      return;
    }

    if (!selection || !isValidSelection(selection) || committing) {
      return;
    }

    finishTextInput(true);
    committing = true;
    setToolbarDisabled(true);

    let imageDataUrl: string | undefined;
    try {
      imageDataUrl = (await buildCompositeDataUrl(selection)) ?? undefined;
    } catch {
      imageDataUrl = undefined;
    }

    const result = await window.launcher.liteSnapCommitCapture({
      action,
      selection,
      imageDataUrl
    });

    if (result.ok) {
      return;
    }

    committing = false;
    setToolbarDisabled(false);
    showStatus(result.message, true);
  }

  function beginDraftAnnotation(point: Point): void {
    if (activeTool === "pen") {
      draftAnnotation = {
        type: "pen",
        color: activeColor,
        lineWidth: activeLineWidth,
        points: [point]
      };
      return;
    }

    if (activeTool === "highlight") {
      draftAnnotation = {
        type: "highlight",
        color: activeColor,
        lineWidth: activeLineWidth,
        start: point,
        end: point
      };
      return;
    }

    if (
      activeTool === "rect" ||
      activeTool === "ellipse" ||
      activeTool === "line" ||
      activeTool === "arrow"
    ) {
      draftAnnotation = {
        type: activeTool,
        color: activeColor,
        lineWidth: activeLineWidth,
        start: point,
        end: point,
        filled:
          (activeTool === "rect" || activeTool === "ellipse") && fillShapes
      };
      return;
    }

    if (activeTool === "mosaic" || activeTool === "blur") {
      draftAnnotation = {
        type: activeTool,
        points: [point],
        brushSize: brushSizeForLineWidth(activeLineWidth),
        intensity: activeLineWidth
      };
    }
  }

  function extendDraftAnnotation(point: Point): void {
    if (!draftAnnotation) {
      return;
    }
    if (
      draftAnnotation.type === "pen" ||
      draftAnnotation.type === "mosaic" ||
      draftAnnotation.type === "blur"
    ) {
      draftAnnotation.points.push(point);
      return;
    }
    if ("start" in draftAnnotation && "end" in draftAnnotation) {
      draftAnnotation.end = point;
    }
  }

  function finalizeDraftAnnotation(): void {
    if (!draftAnnotation) {
      return;
    }

    let keep = true;
    if (draftAnnotation.type === "pen") {
      keep = draftAnnotation.points.length > 1;
    } else if (
      draftAnnotation.type === "mosaic" ||
      draftAnnotation.type === "blur"
    ) {
      keep = draftAnnotation.points.length >= 1;
    } else if ("start" in draftAnnotation && "end" in draftAnnotation) {
      keep =
        Math.abs(draftAnnotation.end.x - draftAnnotation.start.x) > 2 ||
        Math.abs(draftAnnotation.end.y - draftAnnotation.start.y) > 2;
    }

    if (keep) {
      addAnnotation(draftAnnotation);
    }
    draftAnnotation = null;
    renderAnnotations();
  }

  function openTextInput(point: Point): void {
    if (!textInput) {
      return;
    }
    finishTextInput(true);
    pendingTextPosition = point;
    editingText = true;
    textInput.hidden = false;
    textInput.value = "";
    textInput.style.left = `${point.x}px`;
    textInput.style.top = `${point.y}px`;
    textInput.style.color = activeColor;
    textInput.style.fontSize = `${textSize}px`;
    textInput.style.maxWidth = `${Math.max(
      40,
      (selection ? selection.x + selection.width : getViewportWidth()) - point.x
    )}px`;
    window.setTimeout(() => textInput.focus(), 0);
  }

  function finishTextInput(commit: boolean): void {
    if (!textInput || !editingText) {
      if (textInput) {
        textInput.hidden = true;
      }
      editingText = false;
      pendingTextPosition = null;
      return;
    }

    const value = textInput.value.trim();
    if (commit && value && pendingTextPosition) {
      addAnnotation({
        type: "text",
        color: activeColor,
        fontSize: textSize,
        position: pendingTextPosition,
        text: value
      });
    }

    textInput.hidden = true;
    textInput.value = "";
    editingText = false;
    pendingTextPosition = null;
    renderAnnotations();
  }

  function undoLastAnnotation(): void {
    if (editingText) {
      finishTextInput(false);
      return;
    }
    if (annotations.length === 0) {
      return;
    }
    const removed = annotations.pop();
    if (removed) {
      redoAnnotations.push(removed);
    }
    selectedAnnotationIndex = null;
    recalculateNumberSequence();
    renderAnnotations();
  }

  function redoLastAnnotation(): void {
    if (editingText) {
      finishTextInput(true);
      return;
    }
    const annotation = redoAnnotations.pop();
    if (!annotation) {
      return;
    }
    annotations.push(annotation);
    selectedAnnotationIndex =
      annotation.type === "mosaic" || annotation.type === "blur"
        ? null
        : annotations.length - 1;
    recalculateNumberSequence();
    renderAnnotations();
  }

  function deleteLastAnnotation(): void {
    if (
      selectedAnnotationIndex !== null &&
      selectedAnnotationIndex >= 0 &&
      selectedAnnotationIndex < annotations.length
    ) {
      const removed = annotations.splice(selectedAnnotationIndex, 1)[0];
      redoAnnotations.push(removed);
      selectedAnnotationIndex = null;
      recalculateNumberSequence();
      renderAnnotations();
      return;
    }
    undoLastAnnotation();
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!overlayRoot || committing || !isOverlayReady()) {
      return;
    }

    if (toolbarNode && !toolbarNode.hidden && toolbarNode.contains(event.target as Node)) {
      return;
    }

    const pointX = event.clientX;
    const pointY = event.clientY;
    updateBrushPreview(pointX, pointY, event.target);

    if (activeTool !== "select") {
      if (!isValidSelection(selection) || !containsPoint(selection, pointX, pointY)) {
        hideBrushPreview();
        return;
      }

      const point = clampPointToSelection(pointX, pointY);
      if (activeTool === "text") {
        openTextInput(point);
        return;
      }
      if (activeTool === "number") {
        addAnnotation({
          type: "number",
          color: activeColor,
          fontSize: Math.max(14, textSize),
          position: point,
          value: numberSequence
        });
        renderAnnotations();
        return;
      }

      dragMode = "drawing";
      pointerStart = {
        pointerId: event.pointerId,
        x: pointX,
        y: pointY,
        selection: null,
        handle: null
      };
      beginDraftAnnotation(point);
      updateBrushPreview(point.x, point.y, event.target);
      renderAnnotations();
      return;
    }

    const handle = getHandleFromTarget(event.target);
    if (handle && selection) {
      hideBrushPreview();
      dragMode = "resizing";
      selectedAnnotationIndex = null;
      pointerStart = {
        pointerId: event.pointerId,
        x: pointX,
        y: pointY,
        selection: { ...selection },
        handle
      };
      if (toolbarNode) {
        toolbarNode.hidden = true;
      }
    } else if (selection && containsPoint(selection, pointX, pointY)) {
      hideBrushPreview();
      const annotationIndex = hitTestAnnotation({ x: pointX, y: pointY });
      if (annotationIndex !== null) {
        selectedAnnotationIndex = annotationIndex;
        dragMode = "annotation-moving";
        pointerStart = {
          pointerId: event.pointerId,
          x: pointX,
          y: pointY,
          selection: null,
          handle: null,
          annotationIndex,
          annotationSnapshot: cloneAnnotation(annotations[annotationIndex])
        };
        renderAnnotations();
        return;
      }
      selectedAnnotationIndex = null;
      dragMode = "moving";
      pointerStart = {
        pointerId: event.pointerId,
        x: pointX,
        y: pointY,
        selection: { ...selection },
        handle: null
      };
      if (toolbarNode) {
        toolbarNode.hidden = true;
      }
    } else {
      hideBrushPreview();
      // Remember an existing valid selection so an accidental click outside it
      // (with no real drag) restores it instead of wiping/grabbing a window.
      const priorSelection =
        selection && isValidSelection(selection) ? { ...selection } : null;
      dragMode = "selecting";
      selectedAnnotationIndex = null;
      selection = normalizeRect(pointX, pointY, pointX, pointY);
      pointerStart = {
        pointerId: event.pointerId,
        x: pointX,
        y: pointY,
        selection: priorSelection,
        handle: null
      };
      if (toolbarNode) {
        toolbarNode.hidden = true;
      }
      if (hintNode) {
        hintNode.hidden = false;
      }
      if (windowHintNode) {
        windowHintNode.hidden = true;
      }
    }

    renderSelection();
  }

  function handlePointerMove(event: PointerEvent): void {
    updateLoupe(event.clientX, event.clientY);
    updateBrushPreview(event.clientX, event.clientY, event.target);
    if (!pointerStart || event.pointerId !== pointerStart.pointerId) {
      scheduleWindowSelectionProbe(event.clientX, event.clientY);
      return;
    }

    if (dragMode === "drawing") {
      const point = clampPointToSelection(event.clientX, event.clientY);
      extendDraftAnnotation(point);
      updateBrushPreview(point.x, point.y, event.target);
      renderAnnotations();
      return;
    }

    if (dragMode === "selecting") {
      selection = normalizeRect(
        pointerStart.x,
        pointerStart.y,
        event.clientX,
        event.clientY
      );
    } else if (dragMode === "moving") {
      applyMove(event.clientX, event.clientY);
    } else if (dragMode === "resizing") {
      applyResize(event.clientX, event.clientY);
    } else if (dragMode === "annotation-moving") {
      applyAnnotationMove(event.clientX, event.clientY);
      renderAnnotations();
      return;
    }

    renderSelection();
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!overlayRoot || !pointerStart || event.pointerId !== pointerStart.pointerId) {
      return;
    }

    const wasDrawing = dragMode === "drawing";
    const wasSelecting = dragMode === "selecting";
    const wasMovingAnnotation = dragMode === "annotation-moving";
    const priorSelection = pointerStart.selection;
    pointerStart = null;
    dragMode = "idle";

    if (wasDrawing) {
      finalizeDraftAnnotation();
      updateSelectionChrome();
      return;
    }

    if (wasMovingAnnotation) {
      renderAnnotations();
      return;
    }

    if (wasSelecting && !isValidSelection(selection)) {
      // A stray click that did not produce a real drag: keep the previous
      // selection if there was one, instead of discarding it.
      if (priorSelection) {
        selection = priorSelection;
        clearWindowHint();
        updateSelectionChrome();
        renderSelection();
        return;
      }
      // Otherwise (no prior selection yet) a plain click over a detected window
      // adopts that window, matching Snipaste's click-to-grab-window flow.
      if (hoverWindowRect) {
        selection = { ...hoverWindowRect };
        clearWindowHint();
        renderSelection();
        return;
      }
    }

    renderSelection();
  }

  function handlePointerLeave(): void {
    hideBrushPreview();
    if (loupeNode) {
      loupeNode.hidden = true;
    }
  }

  function handleDoubleClick(event: MouseEvent): void {
    if (committing || !selection || !isValidSelection(selection) || activeTool !== "select") {
      return;
    }

    if (toolbarNode && !toolbarNode.hidden && toolbarNode.contains(event.target as Node)) {
      return;
    }

    if (!containsPoint(selection, event.clientX, event.clientY)) {
      return;
    }

    event.preventDefault();
    void commitSelection("copy");
  }

  function buildColorControls(): void {
    if (!colorsNode) {
      return;
    }
    colorsNode.innerHTML = "";
    for (const color of PRESET_COLORS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "litesnap-overlay__color";
      button.dataset.color = color;
      button.style.background = color;
      button.title = color;
      button.setAttribute("aria-label", `颜色 ${color}`);
      button.addEventListener("click", () => setActiveColor(color));
      colorsNode.appendChild(button);
    }
  }

  function buildWidthControls(): void {
    if (!widthsNode) {
      return;
    }
    widthsNode.innerHTML = "";
    for (const width of PRESET_WIDTHS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "litesnap-overlay__width";
      button.dataset.width = String(width);
      button.title = `粗细/强度 ${width}`;
      button.setAttribute("aria-label", `粗细或马赛克模糊强度 ${width}`);
      const dot = document.createElement("span");
      dot.className = "litesnap-overlay__width-dot";
      const dotSize = Math.min(16, 4 + width * 1.4);
      dot.style.width = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      button.appendChild(dot);
      button.addEventListener("click", () => setActiveLineWidth(width));
      widthsNode.appendChild(button);
    }
  }

  function setActiveColor(color: string, persist = true): void {
    activeColor = color;
    colorsNode?.querySelectorAll<HTMLElement>("[data-color]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.color === color);
    });
    if (editingText && textInput) {
      textInput.style.color = color;
    }
    if (persist) {
      schedulePersistAnnotationSettings();
    }
  }

  function setActiveLineWidth(width: number, persist = true): void {
    activeLineWidth = width;
    widthsNode?.querySelectorAll<HTMLElement>("[data-width]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.width) === width);
    });
    if (persist) {
      schedulePersistAnnotationSettings();
    }
  }

  function setFillShapes(enabled: boolean, persist = true): void {
    fillShapes = enabled;
    if (fillToggleNode) {
      fillToggleNode.classList.toggle("is-active", enabled);
      fillToggleNode.setAttribute("aria-pressed", String(enabled));
    }
    if (persist) {
      schedulePersistAnnotationSettings();
    }
  }

  function bindToolbar(): void {
    if (!toolbarNode) {
      return;
    }

    toolbarNode.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        const tool = button.dataset.tool as AnnotationTool | undefined;
        if (tool && VALID_TOOLS.has(tool)) {
          setActiveTool(tool);
        }
      });
    });

    toolbarNode.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.command === "undo") {
          undoLastAnnotation();
        } else if (button.dataset.command === "redo") {
          redoLastAnnotation();
        } else if (button.dataset.command === "delete") {
          deleteLastAnnotation();
        } else if (button.dataset.command === "toggle-fill") {
          setFillShapes(!fillShapes);
        }
      });
    });

    toolbarNode.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-action") as OverlayAction | null;
        if (action) {
          void commitSelection(action);
        }
      });
    });
  }

  function bindTextInput(): void {
    if (!textInput) {
      return;
    }
    textInput.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        finishTextInput(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finishTextInput(false);
      }
    });
    textInput.addEventListener("blur", () => finishTextInput(true));
  }

  function bindKeyboard(): void {
    window.addEventListener("keydown", (event) => {
      if (editingText) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        void commitSelection("cancel");
        return;
      }

      if (
        (event.key === "z" || event.key === "Z") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        undoLastAnnotation();
        return;
      }

      if (
        (event.key === "y" || event.key === "Y") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        redoLastAnnotation();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteLastAnnotation();
        return;
      }

      if ((event.key === "r" || event.key === "R") && lastSelection) {
        event.preventDefault();
        selection = { ...lastSelection };
        dragMode = "idle";
        renderSelection();
        return;
      }

      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        void navigator.clipboard?.writeText(hoveredColor).catch(() => undefined);
        showStatus(`已复制颜色 ${hoveredColor}`);
        return;
      }

      if (event.key === "Enter" && isValidSelection(selection)) {
        event.preventDefault();
        void commitSelection("copy");
      }
    });
  }

  function applyAnnotationDefaults(state: OverlayState): void {
    activeColor = state.annotationColor || activeColor;
    activeLineWidth = state.annotationLineWidth || activeLineWidth;
    textSize = state.annotationTextSize || textSize;
    setActiveColor(activeColor, false);
    setActiveLineWidth(activeLineWidth, false);
    setFillShapes(Boolean(state.annotationFillShapes), false);
    // Intentionally do NOT restore the last annotation tool here. Every capture
    // must start in "select" mode so the user can immediately drag a region or
    // click a detected window. Restoring e.g. the rectangle tool would force the
    // user to click the select button before they could choose an area again.
  }

  function applyOverlayState(state: OverlayState): void {
    const captureChanged = state.captureId !== activeCaptureId;
    if (captureChanged) {
      activeCaptureId = state.captureId;
      resetSelectionUi();
      overlayState = null;
      compositeImage = null;
      compositeImageSource = "";
      if (overlayRoot) {
        overlayRoot.style.backgroundImage = "";
        overlayRoot.dataset.ready = "false";
      }
    }

    overlayState = state;
    applyAnnotationDefaults(state);

    if (!overlayRoot) {
      return;
    }

    if (!state.imageDataUrl) {
      showStatus("Preparing screenshot...", true);
      return;
    }

    const root = overlayRoot;
    const pendingState = state;
    const dataUrl = state.imageDataUrl;
    const backgroundSize = `${state.viewportWidth}px ${state.viewportHeight}px`;
    // Decode the screenshot before painting it as the overlay background so the
    // window is only revealed once the image is actually ready. This prevents
    // the first capture (no warmed cache) from flashing the overlay's flat fill
    // color, which looked like the whole screen turning grey.
    void (async () => {
      try {
        const image = new Image();
        image.src = dataUrl;
        if (typeof image.decode === "function") {
          await image.decode();
        }
      } catch {
        // Ignore decode failures and fall back to direct assignment below.
      }
      if (overlayState !== pendingState) {
        return;
      }
      root.style.backgroundImage = `url("${dataUrl}")`;
      root.style.backgroundSize = backgroundSize;
      root.dataset.ready = "true";
    })();
    void ensureCompositeImage();
    hideStatus();
  }

  function bindOverlayStateSubscription(): void {
    window.launcher.onLiteSnapOverlayStateChanged((nextState) => {
      if (!nextState) {
        prepareCaptureView();
        return;
      }

      applyOverlayState(nextState);
    });
  }

  function bootstrapOverlay(): void {
    if (!overlayRoot) {
      return;
    }

    (window as LiteSnapOverlayWindow).__LL_LITESNAP_PREPARE_CAPTURE__ = prepareCaptureView;
    buildColorControls();
    buildWidthControls();
    setActiveTool("select");
    setActiveColor(activeColor);
    setActiveLineWidth(activeLineWidth);
    setFillShapes(fillShapes);
    prepareCaptureView();
    overlayRoot.addEventListener("pointerdown", handlePointerDown);
    overlayRoot.addEventListener("pointermove", handlePointerMove);
    overlayRoot.addEventListener("pointerup", handlePointerUp);
    overlayRoot.addEventListener("pointercancel", handlePointerUp);
    overlayRoot.addEventListener("pointerleave", handlePointerLeave);
    overlayRoot.addEventListener("dblclick", handleDoubleClick);
    bindToolbar();
    bindTextInput();
    bindKeyboard();
    bindOverlayStateSubscription();
  }

  bootstrapOverlay();
})();
