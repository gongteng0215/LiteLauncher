(() => {
  type OverlayAction = "copy" | "save" | "pin" | "cancel" | "ocr" | "translate" | "long";
  type ResizeHandle = "n" | "s" | "w" | "e" | "nw" | "ne" | "sw" | "se";
  type DragMode =
    | "idle"
    | "selecting"
    | "moving"
    | "resizing"
    | "drawing"
    | "annotation-moving"
    | "annotation-resizing"
    | "editor-panning";
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
    mode?: "capture" | "color" | "edit";
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
    recentColors?: string[];
    editorMode?: boolean;
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
    maxWidth?: number;
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
    annotationBoundsSnapshot?: SelectionRect;
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
  const MIN_ANNOTATION_LINE_WIDTH = 1;
  const MAX_ANNOTATION_LINE_WIDTH = 60;
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
  const dimNode = document.getElementById("litesnap-dim");
  const dimTopNode = document.getElementById("litesnap-dim-top");
  const dimRightNode = document.getElementById("litesnap-dim-right");
  const dimBottomNode = document.getElementById("litesnap-dim-bottom");
  const dimLeftNode = document.getElementById("litesnap-dim-left");
  const selectionNode = document.getElementById("litesnap-selection");
  const annotationFrameNode = document.getElementById("litesnap-annotation-frame");
  const sizeNode = document.getElementById("litesnap-size");
  const toolbarNode = document.getElementById("litesnap-toolbar");
  const toolbarStyleNode = document.getElementById("litesnap-toolbar-style");
  const statusNode = document.getElementById("litesnap-status");
  const colorsNode = document.getElementById("litesnap-colors");
  const widthsNode = document.getElementById("litesnap-widths");
  const textInput = document.getElementById(
    "litesnap-text-input"
  ) as HTMLTextAreaElement | null;
  const fillToggleNode = document.getElementById("litesnap-fill-toggle");
  const fillGroupNode = document.getElementById("litesnap-fill-group");
  const fillDividerNode = document.getElementById("litesnap-fill-divider");

  let overlayState: OverlayState | null = null;
  let activeCaptureId = "";
  let overlayMode: "capture" | "color" = "capture";
  let recentColors: string[] = [];
  let selection: SelectionRect | null = null;
  let dragMode: DragMode = "idle";
  let pointerStart: PointerStartState | null = null;
  let committing = false;

  let activeTool: AnnotationTool = "select";
  // "select" is needed to create a new region, so keep the last drawing tool
  // separately and restore it only after a valid region has been chosen.
  let lastAnnotationTool: AnnotationTool = "select";
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
  let selectionCommitted = false;
  let toolbarAnchorPoint: Point | null = null;
  let allowWindowHintAfterReady = false;
  let hoverWindowRect: SelectionRect | null = null;
  let windowQueryTimer: number | null = null;
  let windowQuerySeq = 0;
  let lastWindowProbePoint: { x: number; y: number } | null = null;
  let hoveredColor = "#000000";
  let loupeCtx: CanvasRenderingContext2D | null = null;
  let loupeSampleImage: HTMLImageElement | null = null;
  let loupeSampleImageSource = "";
  let loupeFrame: number | null = null;
  let pendingLoupePoint: { x: number; y: number } | null = null;
  let lastLoupeSampleCell: { x: number; y: number } | null = null;
  let widthSliderNode: HTMLInputElement | null = null;
  let widthValueNode: HTMLElement | null = null;
  let overlayRenderFrame: number | null = null;
  let overlayRenderMode: "selection" | "annotations" | null = null;
  let annotationCanvasCtx: CanvasRenderingContext2D | null = null;
  let annotationCanvasPixelWidth = 0;
  let annotationCanvasPixelHeight = 0;
  let effectLayerCanvas: HTMLCanvasElement | null = null;
  let effectLayerCtx: CanvasRenderingContext2D | null = null;
  let vectorLayerCanvas: HTMLCanvasElement | null = null;
  let vectorLayerCtx: CanvasRenderingContext2D | null = null;
  let pooledTileCanvas: HTMLCanvasElement | null = null;
  let pooledTileCtx: CanvasRenderingContext2D | null = null;
  let pooledBlurCanvas: HTMLCanvasElement | null = null;
  let pooledBlurCtx: CanvasRenderingContext2D | null = null;
  let editorZoom = 1;
  let editorPan = { x: 0, y: 0 };

  const WINDOW_PROBE_DEBOUNCE_MS = 80;
  const WINDOW_PROBE_MIN_MOVE_PX = 8;
  const PEN_POINT_MIN_DISTANCE_PX = 1.5;
  const REGION_EFFECT_POINT_MIN_DISTANCE_PX = 4;

  function scheduleOverlayRender(mode: "selection" | "annotations"): void {
    overlayRenderMode = mode;
    if (overlayRenderFrame !== null) {
      return;
    }
    overlayRenderFrame = window.requestAnimationFrame(() => {
      overlayRenderFrame = null;
      const pendingMode = overlayRenderMode;
      overlayRenderMode = null;
      if (pendingMode === "annotations") {
        renderAnnotations();
        return;
      }
      renderSelection();
    });
  }

  function cancelScheduledOverlayRender(): void {
    if (overlayRenderFrame !== null) {
      window.cancelAnimationFrame(overlayRenderFrame);
      overlayRenderFrame = null;
      overlayRenderMode = null;
    }
  }

  function regionEffectDestOptions(
    overrides: Partial<{
      destScaleX: number;
      destScaleY: number;
      destOffsetX: number;
      destOffsetY: number;
      destWidth: number;
      destHeight: number;
    }> = {}
  ) {
    return {
      destScaleX: 1,
      destScaleY: 1,
      destOffsetX: 0,
      destOffsetY: 0,
      destWidth: getViewportWidth(),
      destHeight: getViewportHeight(),
      ...overrides
    };
  }

  function hasBakedRegionEffects(): boolean {
    return annotations.some(
      (annotation) => annotation.type === "mosaic" || annotation.type === "blur"
    );
  }

  function hasRegionEffectWork(): boolean {
    return (
      hasBakedRegionEffects() ||
      draftAnnotation?.type === "mosaic" ||
      draftAnnotation?.type === "blur"
    );
  }

  function isRegionEffectAnnotation(annotation: Annotation): annotation is RegionEffectAnnotation {
    return annotation.type === "mosaic" || annotation.type === "blur";
  }

  function canUseVectorLayer(): boolean {
    return selectedAnnotationIndex === null && dragMode !== "annotation-moving";
  }

  function clearEffectLayer(): void {
    if (!effectLayerCtx || !effectLayerCanvas) {
      return;
    }
    effectLayerCtx.clearRect(0, 0, getViewportWidth(), getViewportHeight());
  }

  function syncEffectLayerCtx(): CanvasRenderingContext2D | null {
    const baseCtx = ensureCanvasSize();
    if (!baseCtx || !canvasNode) {
      return null;
    }

    if (!effectLayerCanvas) {
      effectLayerCanvas = document.createElement("canvas");
      effectLayerCtx = effectLayerCanvas.getContext("2d");
    }
    if (!effectLayerCtx) {
      return null;
    }

    if (
      effectLayerCanvas.width !== canvasNode.width ||
      effectLayerCanvas.height !== canvasNode.height
    ) {
      effectLayerCanvas.width = canvasNode.width;
      effectLayerCanvas.height = canvasNode.height;
    }

    const dpr = window.devicePixelRatio || 1;
    effectLayerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return effectLayerCtx;
  }

  function clearVectorLayer(): void {
    if (!vectorLayerCtx || !vectorLayerCanvas) {
      return;
    }
    vectorLayerCtx.clearRect(0, 0, getViewportWidth(), getViewportHeight());
  }

  function syncVectorLayerCtx(): CanvasRenderingContext2D | null {
    const baseCtx = ensureCanvasSize();
    if (!baseCtx || !canvasNode) {
      return null;
    }

    if (!vectorLayerCanvas) {
      vectorLayerCanvas = document.createElement("canvas");
      vectorLayerCtx = vectorLayerCanvas.getContext("2d");
    }
    if (!vectorLayerCtx) {
      return null;
    }

    if (
      vectorLayerCanvas.width !== canvasNode.width ||
      vectorLayerCanvas.height !== canvasNode.height
    ) {
      vectorLayerCanvas.width = canvasNode.width;
      vectorLayerCanvas.height = canvasNode.height;
    }

    const dpr = window.devicePixelRatio || 1;
    vectorLayerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return vectorLayerCtx;
  }

  function bakeRegionEffectOntoLayer(annotation: RegionEffectAnnotation): void {
    if (!compositeImage) {
      return;
    }
    const layerCtx = syncEffectLayerCtx();
    if (!layerCtx) {
      return;
    }
    paintBrushEffect(layerCtx, compositeImage, annotation, regionEffectDestOptions());
  }

  function rebuildEffectLayer(): void {
    clearEffectLayer();
    if (!compositeImage) {
      return;
    }
    for (const annotation of annotations) {
      if (annotation.type === "mosaic" || annotation.type === "blur") {
        bakeRegionEffectOntoLayer(annotation);
      }
    }
  }

  function bakeVectorAnnotationOntoLayer(annotation: Annotation): void {
    if (isRegionEffectAnnotation(annotation)) {
      return;
    }
    const layerCtx = syncVectorLayerCtx();
    if (!layerCtx) {
      return;
    }
    drawAnnotation(layerCtx, annotation, compositeImage);
  }

  function rebuildVectorLayer(): void {
    clearVectorLayer();
    for (const annotation of annotations) {
      bakeVectorAnnotationOntoLayer(annotation);
    }
  }

  function resizePooledCanvas(
    existing: HTMLCanvasElement | null,
    existingCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    willReadFrequently = false
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
    const canvas = existing ?? document.createElement("canvas");
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
    const ctx = existingCtx ?? canvas.getContext("2d", { willReadFrequently });
    return { canvas, ctx };
  }

  function preloadSourceImageForRegionTools(): void {
    void window.launcher.liteSnapEnsureSourceImage().then((sourceUrl) => {
      if (!sourceUrl || !overlayState) {
        return;
      }
      overlayState = {
        ...overlayState,
        sourceImageDataUrl: sourceUrl
      };
    });
  }

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

  function shouldAppendPoint(
    points: Point[],
    point: Point,
    minDistance: number
  ): boolean {
    const previous = points[points.length - 1];
    if (!previous) {
      return true;
    }
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    return dx * dx + dy * dy >= minDistance * minDistance;
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

    const tileWidth = Math.max(1, Math.round(bbox.width));
    const tileHeight = Math.max(1, Math.round(bbox.height));
    const tilePool = resizePooledCanvas(
      pooledTileCanvas,
      pooledTileCtx,
      tileWidth,
      tileHeight,
      true
    );
    pooledTileCanvas = tilePool.canvas;
    pooledTileCtx = tilePool.ctx;
    const tile = pooledTileCanvas;
    const tileCtx = pooledTileCtx;
    if (!tileCtx) {
      return;
    }
    tileCtx.setTransform(1, 0, 0, 1, 0, 0);
    tileCtx.globalCompositeOperation = "source-over";
    tileCtx.clearRect(0, 0, tileWidth, tileHeight);

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
      const blurPool = resizePooledCanvas(
        pooledBlurCanvas,
        pooledBlurCtx,
        tileWidth,
        tileHeight
      );
      pooledBlurCanvas = blurPool.canvas;
      pooledBlurCtx = blurPool.ctx;
      const blurred = pooledBlurCanvas;
      const blurredCtx = pooledBlurCtx;
      if (!blurredCtx) {
        return;
      }
      blurredCtx.setTransform(1, 0, 0, 1, 0, 0);
      blurredCtx.globalCompositeOperation = "source-over";
      blurredCtx.clearRect(0, 0, tileWidth, tileHeight);
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
    if (!isRegionEffectAnnotation(annotation)) {
      bakeVectorAnnotationOntoLayer(annotation);
    }
  }

  function cloneAnnotation(annotation: Annotation): Annotation {
    return JSON.parse(JSON.stringify(annotation)) as Annotation;
  }

  function scaleAnnotationToBounds(
    annotation: Annotation,
    oldBounds: SelectionRect,
    newBounds: SelectionRect
  ): Annotation {
    const scaleX = newBounds.width / Math.max(1, oldBounds.width);
    const scaleY = newBounds.height / Math.max(1, oldBounds.height);
    const strokeScale = Math.min(scaleX, scaleY);
    const result = cloneAnnotation(annotation);

    if (result.type === "pen" && annotation.type === "pen") {
      result.points = annotation.points.map((point: Point) => ({
        x: newBounds.x + (point.x - oldBounds.x) * scaleX,
        y: newBounds.y + (point.y - oldBounds.y) * scaleY
      }));
      result.lineWidth = clamp(
        annotation.lineWidth * strokeScale,
        MIN_ANNOTATION_LINE_WIDTH,
        MAX_ANNOTATION_LINE_WIDTH
      );
      return result;
    }

    if (result.type === "text" && annotation.type === "text") {
      result.position = {
        x: newBounds.x + (annotation.position.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.position.y - oldBounds.y) * scaleY
      };
      result.fontSize = Math.max(10, annotation.fontSize * strokeScale);
      if (annotation.maxWidth) {
        result.maxWidth = Math.max(20, annotation.maxWidth * scaleX);
      }
      return result;
    }

    if (result.type === "number" && annotation.type === "number") {
      result.position = {
        x: newBounds.x + (annotation.position.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.position.y - oldBounds.y) * scaleY
      };
      result.fontSize = Math.max(10, annotation.fontSize * strokeScale);
      return result;
    }

    if (
      (result.type === "rect" ||
        result.type === "ellipse" ||
        result.type === "line" ||
        result.type === "arrow") &&
      (annotation.type === "rect" ||
        annotation.type === "ellipse" ||
        annotation.type === "line" ||
        annotation.type === "arrow")
    ) {
      result.start = {
        x: newBounds.x + (annotation.start.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.start.y - oldBounds.y) * scaleY
      };
      result.end = {
        x: newBounds.x + (annotation.end.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.end.y - oldBounds.y) * scaleY
      };
      result.lineWidth = clamp(
        annotation.lineWidth * strokeScale,
        MIN_ANNOTATION_LINE_WIDTH,
        MAX_ANNOTATION_LINE_WIDTH
      );
      return result;
    }

    if (result.type === "highlight" && annotation.type === "highlight") {
      result.start = {
        x: newBounds.x + (annotation.start.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.start.y - oldBounds.y) * scaleY
      };
      result.end = {
        x: newBounds.x + (annotation.end.x - oldBounds.x) * scaleX,
        y: newBounds.y + (annotation.end.y - oldBounds.y) * scaleY
      };
      result.lineWidth = clamp(
        annotation.lineWidth * strokeScale,
        MIN_ANNOTATION_LINE_WIDTH,
        MAX_ANNOTATION_LINE_WIDTH
      );
      return result;
    }

    return result;
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
      const probe = document.createElement("canvas").getContext("2d");
      if (probe) {
        probe.font = `600 ${annotation.fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
        const maxWidth = resolveTextMaxWidth(annotation);
        const lines = wrapCanvasText(probe, annotation.text, maxWidth);
        const width = lines.reduce(
          (max, line) => Math.max(max, probe.measureText(line).width),
          0
        );
        return expandRect(
          {
            x: annotation.position.x,
            y: annotation.position.y,
            width: Math.max(12, width),
            height: Math.max(
              annotation.fontSize,
              lines.length * annotation.fontSize * 1.25
            )
          },
          6
        );
      }
      const lines = annotation.text.split("\n");
      const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
      return expandRect(
        {
          x: annotation.position.x,
          y: annotation.position.y,
          width: Math.max(12, longest * annotation.fontSize * 0.62),
          height: Math.max(annotation.fontSize, lines.length * annotation.fontSize * 1.25)
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
      if (!bounds) {
        return null;
      }
      const pad =
        annotation.type === "arrow"
          ? Math.max(14, annotation.lineWidth * 3)
          : Math.max(6, "lineWidth" in annotation ? annotation.lineWidth + 4 : 6);
      return expandRect(bounds, pad);
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

  function isColorMode(): boolean {
    return overlayMode === "color";
  }

  function isEditorMode(): boolean {
    return Boolean(overlayState?.editorMode || overlayState?.mode === "edit");
  }

  function screenToEditorPoint(x: number, y: number): Point {
    if (!isEditorMode()) {
      return { x, y };
    }
    return {
      x: (x - editorPan.x) / editorZoom,
      y: (y - editorPan.y) / editorZoom
    };
  }

  function applyEditorViewTransform(): void {
    if (!overlayRoot || !overlayState) {
      return;
    }
    const baseWidth = overlayState.viewportWidth;
    const baseHeight = overlayState.viewportHeight;
    if (!isEditorMode()) {
      overlayRoot.style.backgroundPosition = "0 0";
      overlayRoot.style.backgroundSize = `${baseWidth}px ${baseHeight}px`;
      for (const element of [canvasNode, annotationFrameNode, textInput]) {
        if (element) {
          element.style.transform = "";
          element.style.transformOrigin = "";
        }
      }
      return;
    }
    const transform = `translate(${editorPan.x}px, ${editorPan.y}px) scale(${editorZoom})`;
    overlayRoot.style.backgroundPosition = `${editorPan.x}px ${editorPan.y}px`;
    overlayRoot.style.backgroundSize = `${baseWidth * editorZoom}px ${baseHeight * editorZoom}px`;
    overlayRoot.style.backgroundRepeat = "no-repeat";
    for (const element of [canvasNode, annotationFrameNode, textInput]) {
      if (element) {
        element.style.transformOrigin = "0 0";
        element.style.transform = transform;
      }
    }
  }

  function setEditorZoom(nextZoom: number, anchor?: Point): void {
    if (!isEditorMode()) {
      return;
    }
    const boundedZoom = clamp(nextZoom, 0.35, 4);
    if (boundedZoom === editorZoom) {
      return;
    }
    const focus = anchor ?? {
      x: getViewportWidth() / 2,
      y: getViewportHeight() / 2
    };
    const world = screenToEditorPoint(focus.x, focus.y);
    editorZoom = boundedZoom;
    editorPan = {
      x: focus.x - world.x * editorZoom,
      y: focus.y - world.y * editorZoom
    };
    applyEditorViewTransform();
  }

  async function copyHoveredColor(options?: { exitAfter?: boolean }): Promise<void> {
    const color = hoveredColor;
    void navigator.clipboard?.writeText(color).catch(() => undefined);
    showStatus(`已复制颜色 ${color}`);
    try {
      if (window.launcher?.liteSnapRecordRecentColor) {
        recentColors = await window.launcher.liteSnapRecordRecentColor(color);
        if (!isColorMode()) {
          buildColorControls();
        }
      }
    } catch {
      // Ignore persistence failures; clipboard write already succeeded.
    }
    if (options?.exitAfter || isColorMode()) {
      void commitSelection("cancel");
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
        annotationTool: lastAnnotationTool,
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

    if (isEditorMode()) {
      hideBrushPreview();
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
    if (tool !== "select") {
      lastAnnotationTool = tool;
    }
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
    } else {
      preloadSourceImageForRegionTools();
    }
    syncToolbarStyleRow();
    if (persist) {
      schedulePersistAnnotationSettings();
    }
  }

  function restoreLastAnnotationToolAfterSelection(): void {
    if (activeTool !== "select" || lastAnnotationTool === "select") {
      return;
    }
    setActiveTool(lastAnnotationTool, false);
  }

  function syncToolbarStyleRow(): void {
    const showStyle = activeTool !== "select";
    if (toolbarStyleNode) {
      toolbarStyleNode.hidden = !showStyle;
    }
    const showFill = activeTool === "rect" || activeTool === "ellipse";
    if (fillGroupNode) {
      fillGroupNode.hidden = !showFill;
    }
    if (fillDividerNode) {
      fillDividerNode.hidden = !showFill;
    }
    toolbarSize = { width: 0, height: 0 };
    if (toolbarNode && !toolbarNode.hidden && selection) {
      updateToolbarPosition();
    }
  }

  function isOverlayBackgroundReady(): boolean {
    return (
      Boolean(overlayRoot && overlayRoot.dataset.ready === "true") &&
      Boolean(overlayState?.imageDataUrl)
    );
  }

  function resetSelectionUi(): void {
    selection = null;
    lastSelection = null;
    selectionCommitted = false;
    toolbarAnchorPoint = null;
    allowWindowHintAfterReady = false;
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
    cancelScheduledOverlayRender();
    if (loupeFrame !== null) {
      window.cancelAnimationFrame(loupeFrame);
      loupeFrame = null;
      pendingLoupePoint = null;
    }
    lastLoupeSampleCell = null;
    lastWindowProbePoint = null;
    loupeSampleImage = null;
    loupeSampleImageSource = "";
    clearEffectLayer();
    effectLayerCanvas = null;
    effectLayerCtx = null;
    clearVectorLayer();
    vectorLayerCanvas = null;
    vectorLayerCtx = null;
    annotationCanvasCtx = null;
    annotationCanvasPixelWidth = 0;
    annotationCanvasPixelHeight = 0;
    if (dimNode) {
      dimNode.hidden = true;
    }
    if (selectionNode) {
      selectionNode.hidden = true;
      selectionNode.dataset.moving = "false";
    }
    hideAnnotationFrame();
    if (toolbarNode) {
      toolbarNode.hidden = true;
      toolbarNode.style.left = "";
      toolbarNode.style.top = "";
    }
    toolbarSize = { width: 0, height: 0 };
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
    syncDisplayFollowLock();
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

  function measureToolbar(force = false): void {
    if (!toolbarNode || toolbarNode.hidden) {
      return;
    }
    if (!force && toolbarSize.width > 0) {
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

    // WeChat-style: prefer below the selection, flip above when space is tight.
    measureToolbar(true);
    const toolbarWidth = toolbarSize.width || 520;
    const toolbarHeight = toolbarSize.height || 48;
    const viewportWidth = getViewportWidth();
    const viewportHeight = getViewportHeight();
    const margin = 12;
    const gap = 8;
    const s = selection;
    const need = toolbarHeight + gap;
    const spaceBelow = viewportHeight - (s.y + s.height) - margin;
    const spaceAbove = s.y - margin;

    let preferredLeft = s.x;
    if (toolbarAnchorPoint && toolbarAnchorPoint.x >= s.x + s.width / 2) {
      preferredLeft = s.x + s.width - toolbarWidth;
    }
    const left = clamp(
      preferredLeft,
      margin,
      Math.max(margin, viewportWidth - toolbarWidth - margin)
    );

    let top: number;
    let placement: string;
    if (spaceBelow >= need) {
      top = s.y + s.height + gap;
      placement = "below";
    } else if (spaceAbove >= need) {
      top = s.y - toolbarHeight - gap;
      placement = "above";
    } else if (spaceBelow >= spaceAbove) {
      top = clamp(
        s.y + s.height + gap,
        margin,
        Math.max(margin, viewportHeight - toolbarHeight - margin)
      );
      placement = "below-clamped";
    } else {
      top = clamp(
        s.y - toolbarHeight - gap,
        margin,
        Math.max(margin, viewportHeight - toolbarHeight - margin)
      );
      placement = "above-clamped";
    }

    toolbarNode.dataset.placement = placement;
    toolbarNode.style.left = `${left}px`;
    toolbarNode.style.top = `${top}px`;
  }

  function shouldShowToolbar(): boolean {
    return (
      selectionCommitted &&
      isValidSelection(selection) &&
      dragMode === "idle" &&
      isOverlayBackgroundReady()
    );
  }

  function isNearFullscreenWindowRect(rect: SelectionRect): boolean {
    const viewportWidth = getViewportWidth();
    const viewportHeight = getViewportHeight();
    const viewportArea = Math.max(1, viewportWidth * viewportHeight);
    const rectArea = Math.max(0, rect.width) * Math.max(0, rect.height);
    return rectArea >= viewportArea * 0.88;
  }

  function noteCapturePointerActivity(): void {
    if (isOverlayBackgroundReady()) {
      allowWindowHintAfterReady = true;
    }
  }

  function syncDisplayFollowLock(): void {
    const locked =
      isValidSelection(selection) ||
      dragMode === "selecting" ||
      dragMode === "moving" ||
      dragMode === "resizing" ||
      dragMode === "drawing" ||
      dragMode === "annotation-moving" ||
      dragMode === "annotation-resizing" ||
      Boolean(draftAnnotation) ||
      annotations.length > 0;
    void window.launcher.liteSnapSetDisplayFollowLocked?.(locked);
  }

  function markSelectionCommittedIfValid(): void {
    if (isValidSelection(selection)) {
      selectionCommitted = true;
    }
    syncDisplayFollowLock();
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
      syncToolbarStyleRow();
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
      !allowWindowHintAfterReady ||
      !hoverWindowRect ||
      isNearFullscreenWindowRect(hoverWindowRect) ||
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
      !allowWindowHintAfterReady ||
      !isOverlayReady() ||
      isValidSelection(selection)
    ) {
      return;
    }
    if (windowQueryTimer !== null) {
      return;
    }
    if (lastWindowProbePoint) {
      const dx = x - lastWindowProbePoint.x;
      const dy = y - lastWindowProbePoint.y;
      if (dx * dx + dy * dy < WINDOW_PROBE_MIN_MOVE_PX * WINDOW_PROBE_MIN_MOVE_PX) {
        return;
      }
    }
    const seq = ++windowQuerySeq;
    windowQueryTimer = window.setTimeout(() => {
      windowQueryTimer = null;
      lastWindowProbePoint = { x, y };
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
            if (
              hoverWindowRect &&
              !isNearFullscreenWindowRect(hoverWindowRect)
            ) {
              renderWindowHint();
            } else {
              hoverWindowRect = null;
              clearWindowHint();
            }
          }
        })
        .catch(() => undefined);
    }, WINDOW_PROBE_DEBOUNCE_MS);
  }

  function renderSelectionDim(): void {
    if (
      !dimNode ||
      !dimTopNode ||
      !dimRightNode ||
      !dimBottomNode ||
      !dimLeftNode ||
      !selection ||
      !isValidSelection(selection) ||
      !isOverlayBackgroundReady()
    ) {
      if (dimNode) {
        dimNode.hidden = true;
      }
      return;
    }

    const viewportWidth = getViewportWidth();
    const viewportHeight = getViewportHeight();
    const { x, y, width, height } = selection;
    dimNode.hidden = false;
    dimTopNode.style.height = `${y}px`;
    dimLeftNode.style.top = `${y}px`;
    dimLeftNode.style.width = `${x}px`;
    dimLeftNode.style.height = `${height}px`;
    dimRightNode.style.left = `${x + width}px`;
    dimRightNode.style.top = `${y}px`;
    dimRightNode.style.width = `${Math.max(0, viewportWidth - x - width)}px`;
    dimRightNode.style.height = `${height}px`;
    dimBottomNode.style.top = `${y + height}px`;
    dimBottomNode.style.height = `${Math.max(0, viewportHeight - y - height)}px`;
  }

  function renderSelection(): void {
    if (!selectionNode || !sizeNode) {
      return;
    }

    if (!isValidSelection(selection) || !isOverlayBackgroundReady()) {
      selectionNode.hidden = true;
      if (canvasNode) {
        canvasNode.hidden = true;
      }
      if (dimNode) {
        dimNode.hidden = true;
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

    renderSelectionDim();
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
    if (
      canvasNode.width !== pixelWidth ||
      canvasNode.height !== pixelHeight ||
      annotationCanvasPixelWidth !== pixelWidth ||
      annotationCanvasPixelHeight !== pixelHeight
    ) {
      canvasNode.width = pixelWidth;
      canvasNode.height = pixelHeight;
      annotationCanvasCtx = canvasNode.getContext("2d");
      annotationCanvasPixelWidth = pixelWidth;
      annotationCanvasPixelHeight = pixelHeight;
      effectLayerCanvas = null;
      effectLayerCtx = null;
      vectorLayerCanvas = null;
      vectorLayerCtx = null;
    }
    canvasNode.style.width = `${cssWidth}px`;
    canvasNode.style.height = `${cssHeight}px`;

    if (!annotationCanvasCtx) {
      annotationCanvasCtx = canvasNode.getContext("2d");
    }
    if (!annotationCanvasCtx) {
      return null;
    }
    annotationCanvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return annotationCanvasCtx;
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

    // Radiating WeChat arrow: the whole body is a wedge that starts as a point
    // at `start`, widens toward the tip, then flares into a triangular head.
    // `lineWidth` is the user-picked size (细/中/粗) and scales the whole shape.
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const shaftLen = Math.hypot(dx, dy);
    if (shaftLen < 1) {
      return;
    }

    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const px = -sin;
    const py = cos;
    const size = Math.max(2, annotation.lineWidth);

    let headLength = Math.min(size * 3.4, shaftLen * 0.42);
    let headHalf = size * 2.35;
    let neckHalf = size * 0.78;
    if (shaftLen < headLength + size * 1.5) {
      headLength = Math.max(shaftLen * 0.5, size * 2);
      headHalf = size * 2.1;
      neckHalf = size * 0.7;
    }

    const tipX = end.x;
    const tipY = end.y;
    const baseX = tipX - cos * headLength;
    const baseY = tipY - sin * headLength;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    // Left wing of the radiating head.
    ctx.lineTo(baseX + px * headHalf, baseY + py * headHalf);
    // Step in to the wedge neck, then taper all the way to a point at start.
    ctx.lineTo(baseX + px * neckHalf, baseY + py * neckHalf);
    ctx.lineTo(start.x, start.y);
    ctx.lineTo(baseX - px * neckHalf, baseY - py * neckHalf);
    ctx.lineTo(baseX - px * headHalf, baseY - py * headHalf);
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

  function wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const paragraphs = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const lines: string[] = [];
    const widthLimit = Math.max(12, maxWidth);

    for (const paragraph of paragraphs) {
      if (!paragraph) {
        lines.push("");
        continue;
      }

      let current = "";
      for (const char of paragraph) {
        const next = current + char;
        if (current && ctx.measureText(next).width > widthLimit) {
          lines.push(current);
          current = char;
        } else {
          current = next;
        }
      }
      if (current) {
        lines.push(current);
      }
    }

    return lines.length > 0 ? lines : [""];
  }

  function resolveTextMaxWidth(annotation: TextAnnotation): number {
    if (typeof annotation.maxWidth === "number" && annotation.maxWidth > 0) {
      return annotation.maxWidth;
    }
    const rightEdge = selection
      ? selection.x + selection.width
      : getViewportWidth();
    return Math.max(40, rightEdge - annotation.position.x - 8);
  }

  function drawText(ctx: CanvasRenderingContext2D, annotation: TextAnnotation): void {
    ctx.fillStyle = annotation.color;
    ctx.textBaseline = "top";
    ctx.font = `600 ${annotation.fontSize}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    const maxWidth = resolveTextMaxWidth(annotation);
    const lines = wrapCanvasText(ctx, annotation.text, maxWidth);
    const lineHeight = annotation.fontSize * 1.25;
    lines.forEach((line, index) => {
      ctx.fillText(line, annotation.position.x, annotation.position.y + index * lineHeight);
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

    if (hasRegionEffectWork() && !compositeImage) {
      void ensureCompositeImage().then(() => renderAnnotations());
      return;
    }

    if (hasBakedRegionEffects() && effectLayerCanvas) {
      ctx.drawImage(
        effectLayerCanvas,
        0,
        0,
        canvasNode.width,
        canvasNode.height,
        0,
        0,
        getViewportWidth(),
        getViewportHeight()
      );
    }

    if (canUseVectorLayer() && vectorLayerCanvas) {
      ctx.drawImage(
        vectorLayerCanvas,
        0,
        0,
        canvasNode.width,
        canvasNode.height,
        0,
        0,
        getViewportWidth(),
        getViewportHeight()
      );
    } else {
      for (const annotation of annotations) {
        if (isRegionEffectAnnotation(annotation)) {
          continue;
        }
        drawAnnotation(ctx, annotation, compositeImage);
      }
    }

    if (draftAnnotation) {
      drawAnnotation(ctx, draftAnnotation, compositeImage);
    }

    drawSelectedAnnotationBounds(ctx);
    updateAnnotationFrame();
  }

  function updateAnnotationFrame(): void {
    if (!annotationFrameNode) {
      return;
    }
    if (selectedAnnotationIndex === null || activeTool !== "select") {
      annotationFrameNode.hidden = true;
      return;
    }
    const annotation = annotations[selectedAnnotationIndex];
    if (!annotation || annotation.type === "mosaic" || annotation.type === "blur") {
      annotationFrameNode.hidden = true;
      return;
    }
    const bounds = getAnnotationBounds(annotation);
    if (!bounds || bounds.width < 1 || bounds.height < 1) {
      annotationFrameNode.hidden = true;
      return;
    }
    annotationFrameNode.hidden = false;
    annotationFrameNode.style.left = `${bounds.x}px`;
    annotationFrameNode.style.top = `${bounds.y}px`;
    annotationFrameNode.style.width = `${bounds.width}px`;
    annotationFrameNode.style.height = `${bounds.height}px`;
  }

  function hideAnnotationFrame(): void {
    if (annotationFrameNode) {
      annotationFrameNode.hidden = true;
    }
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
    updateAnnotationFrame();
  }

  function applyAnnotationResize(nextX: number, nextY: number): void {
    if (
      !pointerStart ||
      pointerStart.annotationIndex === undefined ||
      !pointerStart.annotationSnapshot ||
      !pointerStart.annotationBoundsSnapshot ||
      !pointerStart.handle
    ) {
      return;
    }

    const minSize = 12;
    const base = pointerStart.annotationBoundsSnapshot;
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

    const newBounds: SelectionRect = {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };

    annotations[pointerStart.annotationIndex] = scaleAnnotationToBounds(
      pointerStart.annotationSnapshot,
      base,
      newBounds
    );
    updateAnnotationFrame();
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

    const value = target.dataset.handle ?? target.dataset.annotationHandle;
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

  function getEdgeHandleAtPoint(
    x: number,
    y: number,
    rect: SelectionRect
  ): ResizeHandle | null {
    const slop = 10;
    const left = rect.x;
    const top = rect.y;
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    const nearLeft = Math.abs(x - left) <= slop;
    const nearRight = Math.abs(x - right) <= slop;
    const nearTop = Math.abs(y - top) <= slop;
    const nearBottom = Math.abs(y - bottom) <= slop;
    const insideX = x >= left - slop && x <= right + slop;
    const insideY = y >= top - slop && y <= bottom + slop;

    if (!insideX || !insideY) {
      return null;
    }
    if (nearTop && nearLeft) {
      return "nw";
    }
    if (nearTop && nearRight) {
      return "ne";
    }
    if (nearBottom && nearLeft) {
      return "sw";
    }
    if (nearBottom && nearRight) {
      return "se";
    }
    if (nearTop) {
      return "n";
    }
    if (nearBottom) {
      return "s";
    }
    if (nearLeft) {
      return "w";
    }
    if (nearRight) {
      return "e";
    }
    return null;
  }

  function getSelectionEdgeHandleAtPoint(x: number, y: number): ResizeHandle | null {
    if (!selection || !isValidSelection(selection)) {
      return null;
    }
    return getEdgeHandleAtPoint(x, y, selection);
  }

  function getAnnotationEdgeHandleAtPoint(x: number, y: number): ResizeHandle | null {
    if (selectedAnnotationIndex === null || activeTool !== "select") {
      return null;
    }
    const annotation = annotations[selectedAnnotationIndex];
    if (!annotation || annotation.type === "mosaic" || annotation.type === "blur") {
      return null;
    }
    const bounds = getAnnotationBounds(annotation);
    if (!bounds) {
      return null;
    }
    return getEdgeHandleAtPoint(x, y, bounds);
  }

  function beginAnnotationResize(
    handle: ResizeHandle,
    pointerId: number,
    x: number,
    y: number,
    annotationIndex: number
  ): void {
    const annotation = annotations[annotationIndex];
    const bounds = annotation ? getAnnotationBounds(annotation) : null;
    if (!annotation || !bounds) {
      return;
    }
    dragMode = "annotation-resizing";
    pointerStart = {
      pointerId,
      x,
      y,
      selection: null,
      handle,
      annotationIndex,
      annotationSnapshot: cloneAnnotation(annotation),
      annotationBoundsSnapshot: bounds
    };
  }

  function beginSelectionResize(handle: ResizeHandle, pointerId: number, x: number, y: number): void {
    hideBrushPreview();
    dragMode = "resizing";
    selectedAnnotationIndex = null;
    pointerStart = {
      pointerId,
      x,
      y,
      selection: selection ? { ...selection } : null,
      handle
    };
    if (toolbarNode) {
      toolbarNode.hidden = true;
    }
  }

  async function ensureCompositeImage(fullResolution = false): Promise<HTMLImageElement | null> {
    if (fullResolution) {
      const sourceUrl = await window.launcher.liteSnapEnsureSourceImage();
      if (sourceUrl && overlayState) {
        overlayState = {
          ...overlayState,
          sourceImageDataUrl: sourceUrl
        };
      }
    }

    const source = fullResolution
      ? overlayState?.sourceImageDataUrl ?? overlayState?.imageDataUrl ?? null
      : overlayState?.imageDataUrl ?? overlayState?.sourceImageDataUrl ?? null;
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

  async function ensureLoupeSampleImage(): Promise<HTMLImageElement | null> {
    const source = overlayState?.imageDataUrl ?? null;
    if (!source) {
      return null;
    }
    if (loupeSampleImage && loupeSampleImageSource === source) {
      return loupeSampleImage;
    }

    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        loupeSampleImage = image;
        loupeSampleImageSource = source;
        resolve(image);
      };
      image.onerror = () => resolve(null);
      image.src = source;
    });
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

  function scheduleLoupeUpdate(x: number, y: number): void {
    if (
      dragMode !== "idle" ||
      editingText ||
      committing ||
      !isOverlayReady() ||
      !loupeNode ||
      !loupeCanvas ||
      !loupeColorNode
    ) {
      if (loupeFrame !== null) {
        window.cancelAnimationFrame(loupeFrame);
        loupeFrame = null;
        pendingLoupePoint = null;
      }
      if (loupeNode) {
        loupeNode.hidden = true;
      }
      return;
    }

    pendingLoupePoint = { x, y };
    if (loupeFrame !== null) {
      return;
    }

    loupeFrame = window.requestAnimationFrame(() => {
      loupeFrame = null;
      const point = pendingLoupePoint;
      pendingLoupePoint = null;
      if (!point) {
        return;
      }
      void updateLoupe(point.x, point.y);
    });
  }

  async function updateLoupe(x: number, y: number): Promise<void> {
    if (!loupeNode || !loupeCanvas || !loupeColorNode || !isOverlayReady()) {
      return;
    }

    positionLoupe(x, y);
    loupeNode.hidden = false;

    if (!loupeCtx) {
      loupeCtx = loupeCanvas.getContext("2d", { willReadFrequently: true });
    }
    const ctx = loupeCtx;
    if (!ctx) {
      return;
    }

    const image = await ensureLoupeSampleImage();
    if (!image) {
      return;
    }

    const scale = getImageScale(image);
    const sourceX = clamp(Math.round(x * scale.scaleX), 0, image.naturalWidth - 1);
    const sourceY = clamp(Math.round(y * scale.scaleY), 0, image.naturalHeight - 1);
    const sampleCell = {
      x: Math.floor(sourceX / 2),
      y: Math.floor(sourceY / 2)
    };
    if (
      lastLoupeSampleCell &&
      lastLoupeSampleCell.x === sampleCell.x &&
      lastLoupeSampleCell.y === sampleCell.y
    ) {
      return;
    }
    lastLoupeSampleCell = sampleCell;

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
  }

  function canvasToPngBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer | null> {
    return new Promise<ArrayBuffer | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        void blob.arrayBuffer().then(resolve).catch(() => resolve(null));
      }, "image/png");
    });
  }

  async function buildCompositePngBuffer(rect: SelectionRect): Promise<ArrayBuffer | null> {
    if (annotations.length === 0) {
      return null;
    }

    const hasRegionEffects = hasBakedRegionEffects();
    // Always composite annotations onto the full-resolution source image so the
    // exported/copied screenshot stays sharp. Using the low-resolution preview
    // here (as an optimization) made annotated captures look blurry.
    const image = await ensureCompositeImage(true);
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

    if (hasRegionEffects && effectLayerCanvas && canvasNode) {
      const dpr = window.devicePixelRatio || 1;
      const sourceX = rect.x * dpr;
      const sourceY = rect.y * dpr;
      const sourceWidth = rect.width * dpr;
      const sourceHeight = rect.height * dpr;
      ctx.drawImage(
        effectLayerCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }

    for (const annotation of annotations) {
      if (annotation.type === "mosaic" || annotation.type === "blur") {
        continue;
      }

      ctx.setTransform(scaleX, 0, 0, scaleY, -rect.x * scaleX, -rect.y * scaleY);
      drawAnnotation(ctx, annotation);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    return canvasToPngBuffer(canvas);
  }

  async function commitSelection(action: OverlayAction): Promise<void> {
    if (action === "cancel") {
      await window.launcher.liteSnapCancelCapture();
      return;
    }

    if (action === "ocr") {
      await recognizeSelectionText();
      return;
    }

    if (action === "translate") {
      await translateSelectionText();
      return;
    }

    if (action === "long") {
      await startLongCapture();
      return;
    }

    if (!selection || !isValidSelection(selection) || committing) {
      return;
    }

    finishTextInput(true);
    committing = true;
    setToolbarDisabled(true);

    let imagePngBuffer: ArrayBuffer | undefined;
    try {
      imagePngBuffer = (await buildCompositePngBuffer(selection)) ?? undefined;
    } catch {
      imagePngBuffer = undefined;
    }

    const result = await window.launcher.liteSnapCommitCapture({
      action,
      selection,
      imagePngBuffer
    });

    if (result.ok) {
      return;
    }

    committing = false;
    setToolbarDisabled(false);
    showStatus(result.message, true);
  }

  async function startLongCapture(): Promise<void> {
    if (!selection || !isValidSelection(selection) || committing || isEditorMode()) {
      return;
    }
    if (!window.launcher.liteSnapStartLongCapture) {
      showStatus("Long capture is unavailable. Restart LiteLauncher and try again.", true);
      return;
    }
    finishTextInput(true);
    committing = true;
    setToolbarDisabled(true);
    try {
      const started = await window.launcher.liteSnapStartLongCapture({ selection });
      if (!started) {
        committing = false;
        setToolbarDisabled(false);
        showStatus("Long capture needs a selectable scrollable Windows window.", true);
      }
    } catch (error) {
      console.warn("[litesnap-overlay] long capture start failed", error);
      committing = false;
      setToolbarDisabled(false);
      showStatus("Starting long capture failed.", true);
    }
  }

  async function recognizeSelectionText(): Promise<void> {
    if (!selection || !isValidSelection(selection)) {
      showStatus("请先框选要识别的区域。", true);
      return;
    }
    if (committing) {
      return;
    }
    if (!window.launcher?.liteSnapRecognizeText) {
      showStatus("识别功能未加载，请重启 LiteLauncher。", true);
      return;
    }

    finishTextInput(true);
    committing = true;
    setToolbarDisabled(true);
    showStatus("正在识别文字…", true);

    try {
      const result = await window.launcher.liteSnapRecognizeText({ selection });
      if (!result.ok) {
        showStatus(result.message, true);
      }
    } catch (error) {
      console.warn("[litesnap-overlay] OCR failed", error);
      showStatus("文字识别失败，请稍后重试。", true);
    } finally {
      committing = false;
      setToolbarDisabled(false);
    }
  }

  async function translateSelectionText(): Promise<void> {
    if (!selection || !isValidSelection(selection)) {
      showStatus("请先框选要翻译的区域。", true);
      return;
    }
    if (committing) {
      return;
    }
    if (!window.launcher?.liteSnapTranslateSelection) {
      showStatus("翻译功能未加载，请重启 LiteLauncher。", true);
      return;
    }

    finishTextInput(true);
    committing = true;
    setToolbarDisabled(true);
    showStatus("正在识别并翻译…", true);

    try {
      const result = await window.launcher.liteSnapTranslateSelection({ selection });
      if (!result.ok) {
        showStatus(result.message, true);
      }
    } catch (error) {
      console.warn("[litesnap-overlay] translate failed", error);
      showStatus("截图翻译失败，请检查网络后重试。", true);
    } finally {
      committing = false;
      setToolbarDisabled(false);
    }
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
      const minDistance =
        draftAnnotation.type === "pen"
          ? PEN_POINT_MIN_DISTANCE_PX
          : REGION_EFFECT_POINT_MIN_DISTANCE_PX;
      if (!shouldAppendPoint(draftAnnotation.points, point, minDistance)) {
        return;
      }
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
      const finalized = draftAnnotation;
      addAnnotation(finalized);
      if (finalized.type === "mosaic" || finalized.type === "blur") {
        if (compositeImage) {
          bakeRegionEffectOntoLayer(finalized);
        } else {
          void ensureCompositeImage().then(() => {
            bakeRegionEffectOntoLayer(finalized);
            renderAnnotations();
          });
        }
      }
    }
    draftAnnotation = null;
    renderAnnotations();
  }

  function syncTextInputLayout(): void {
    if (!textInput || textInput.hidden) {
      return;
    }
    textInput.style.height = "auto";
    textInput.style.height = `${Math.max(textSize * 1.35, textInput.scrollHeight)}px`;
  }

  function openTextInput(point: Point): void {
    if (!textInput) {
      return;
    }
    finishTextInput(true);
    pendingTextPosition = point;
    editingText = true;
    const maxWidth = Math.max(
      80,
      (selection ? selection.x + selection.width : getViewportWidth()) - point.x - 8
    );
    textInput.hidden = false;
    textInput.value = "";
    textInput.style.left = `${point.x}px`;
    textInput.style.top = `${point.y}px`;
    textInput.style.color = activeColor;
    textInput.style.fontSize = `${textSize}px`;
    textInput.style.lineHeight = "1.25";
    textInput.style.width = `${maxWidth}px`;
    textInput.style.maxWidth = `${maxWidth}px`;
    textInput.style.height = `${textSize * 1.35}px`;
    window.setTimeout(() => {
      textInput.focus();
      syncTextInputLayout();
    }, 0);
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

    const value = textInput.value.replace(/\s+$/g, "");
    if (commit && value && pendingTextPosition) {
      const maxWidth = Math.max(
        40,
        Number.parseFloat(textInput.style.maxWidth || "") ||
          (selection
            ? selection.x + selection.width - pendingTextPosition.x - 8
            : getViewportWidth() - pendingTextPosition.x - 8)
      );
      addAnnotation({
        type: "text",
        color: activeColor,
        fontSize: textSize,
        position: pendingTextPosition,
        text: value,
        maxWidth
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
    if (removed?.type === "mosaic" || removed?.type === "blur") {
      rebuildEffectLayer();
    } else {
      rebuildVectorLayer();
    }
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
    if (annotation.type === "mosaic" || annotation.type === "blur") {
      rebuildEffectLayer();
    } else {
      rebuildVectorLayer();
    }
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
      if (removed.type === "mosaic" || removed.type === "blur") {
        rebuildEffectLayer();
      } else {
        rebuildVectorLayer();
      }
      renderAnnotations();
      return;
    }
    undoLastAnnotation();
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!overlayRoot || committing || !isOverlayReady()) {
      return;
    }

    noteCapturePointerActivity();

    if (isColorMode()) {
      if (event.button === 0) {
        event.preventDefault();
        void copyHoveredColor({ exitAfter: true });
      }
      return;
    }

    if (toolbarNode && !toolbarNode.hidden && toolbarNode.contains(event.target as Node)) {
      return;
    }

    if (isEditorMode() && event.button === 1) {
      event.preventDefault();
      dragMode = "editor-panning";
      pointerStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        selection: null,
        handle: null
      };
      return;
    }

    const point = screenToEditorPoint(event.clientX, event.clientY);
    const pointX = point.x;
    const pointY = point.y;
    updateBrushPreview(pointX, pointY, event.target);

    // Allow resizing the crop frame from handles/edges even while an annotation
    // tool is active (WeChat-style).
    const handle = isEditorMode()
      ? null
      : getHandleFromTarget(event.target) ?? getSelectionEdgeHandleAtPoint(pointX, pointY);
    if (handle && selection && isValidSelection(selection)) {
      beginSelectionResize(handle, event.pointerId, pointX, pointY);
      renderSelection();
      syncDisplayFollowLock();
      return;
    }

    if (activeTool === "select") {
      const annotationHandle =
        (event.target instanceof HTMLElement &&
        event.target.closest("#litesnap-annotation-frame")
          ? getHandleFromTarget(event.target)
          : null) ?? getAnnotationEdgeHandleAtPoint(pointX, pointY);
      if (
        annotationHandle &&
        selectedAnnotationIndex !== null &&
        selection &&
        containsPoint(selection, pointX, pointY)
      ) {
        beginAnnotationResize(
          annotationHandle,
          event.pointerId,
          pointX,
          pointY,
          selectedAnnotationIndex
        );
        renderAnnotations();
        syncDisplayFollowLock();
        return;
      }
    }

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
      scheduleOverlayRender("annotations");
      return;
    }

    if (selection && containsPoint(selection, pointX, pointY)) {
      hideBrushPreview();
      const annotationIndex = hitTestAnnotation({ x: pointX, y: pointY });
      if (annotationIndex !== null) {
        selectedAnnotationIndex = annotationIndex;
        const picked = annotations[annotationIndex];
        if (picked && "lineWidth" in picked) {
          setActiveLineWidth(picked.lineWidth, false);
        }
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
      if (isEditorMode()) {
        return;
      }
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
      if (!priorSelection) {
        selectionCommitted = false;
      }
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
    syncDisplayFollowLock();
  }

  function handlePointerMove(event: PointerEvent): void {
    noteCapturePointerActivity();
    if (!isEditorMode()) {
      scheduleLoupeUpdate(event.clientX, event.clientY);
      updateBrushPreview(event.clientX, event.clientY, event.target);
    }
    if (!pointerStart || event.pointerId !== pointerStart.pointerId) {
      if (!isEditorMode()) {
        scheduleWindowSelectionProbe(event.clientX, event.clientY);
      }
      return;
    }

    if (dragMode === "editor-panning") {
      editorPan = {
        x: editorPan.x + event.clientX - pointerStart.x,
        y: editorPan.y + event.clientY - pointerStart.y
      };
      pointerStart.x = event.clientX;
      pointerStart.y = event.clientY;
      applyEditorViewTransform();
      return;
    }

    const point = screenToEditorPoint(event.clientX, event.clientY);
    const pointX = point.x;
    const pointY = point.y;

    if (dragMode === "drawing") {
      const clampedPoint = clampPointToSelection(pointX, pointY);
      extendDraftAnnotation(clampedPoint);
      updateBrushPreview(clampedPoint.x, clampedPoint.y, event.target);
      scheduleOverlayRender("annotations");
      return;
    }

    if (dragMode === "selecting") {
      selection = normalizeRect(
        pointerStart.x,
        pointerStart.y,
        pointX,
        pointY
      );
    } else if (dragMode === "moving") {
      applyMove(pointX, pointY);
    } else if (dragMode === "resizing") {
      applyResize(pointX, pointY);
    } else if (dragMode === "annotation-moving") {
      applyAnnotationMove(pointX, pointY);
      scheduleOverlayRender("annotations");
      return;
    } else if (dragMode === "annotation-resizing") {
      applyAnnotationResize(pointX, pointY);
      scheduleOverlayRender("annotations");
      return;
    }

    scheduleOverlayRender("selection");
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!overlayRoot || !pointerStart || event.pointerId !== pointerStart.pointerId) {
      return;
    }

    const wasDrawing = dragMode === "drawing";
    const wasSelecting = dragMode === "selecting";
    const wasMoving = dragMode === "moving";
    const wasResizing = dragMode === "resizing";
    const wasMovingAnnotation = dragMode === "annotation-moving";
    const wasResizingAnnotation = dragMode === "annotation-resizing";
    const wasEditorPanning = dragMode === "editor-panning";
    const priorSelection = pointerStart.selection;
    const releasePoint = screenToEditorPoint(event.clientX, event.clientY);
    pointerStart = null;
    dragMode = "idle";

    if (wasEditorPanning) {
      return;
    }

    if (wasDrawing) {
      finalizeDraftAnnotation();
      updateSelectionChrome();
      syncDisplayFollowLock();
      return;
    }

    if (wasMovingAnnotation || wasResizingAnnotation) {
      rebuildVectorLayer();
      renderAnnotations();
      syncDisplayFollowLock();
      return;
    }

    if (wasSelecting || wasMoving || wasResizing) {
      toolbarAnchorPoint = releasePoint;
    }

    if (wasSelecting && !isValidSelection(selection)) {
      // A stray click that did not produce a real drag: keep the previous
      // selection if there was one, instead of discarding it.
      if (priorSelection) {
        selection = priorSelection;
        clearWindowHint();
        markSelectionCommittedIfValid();
        updateSelectionChrome();
        renderSelection();
        return;
      }
      // Otherwise (no prior selection yet) a plain click over a detected window
      // adopts that window, matching Snipaste's click-to-grab-window flow.
      if (hoverWindowRect && !isNearFullscreenWindowRect(hoverWindowRect)) {
        selection = { ...hoverWindowRect };
        toolbarAnchorPoint = {
          x: selection.x + selection.width,
          y: selection.y + selection.height
        };
        clearWindowHint();
        markSelectionCommittedIfValid();
        restoreLastAnnotationToolAfterSelection();
        renderSelection();
        return;
      }
    }

    markSelectionCommittedIfValid();
    if (wasSelecting && isValidSelection(selection)) {
      restoreLastAnnotationToolAfterSelection();
    }
    renderSelection();
  }

  function handlePointerLeave(): void {
    hideBrushPreview();
    if (loupeFrame !== null) {
      window.cancelAnimationFrame(loupeFrame);
      loupeFrame = null;
      pendingLoupePoint = null;
    }
    lastLoupeSampleCell = null;
    if (loupeNode) {
      loupeNode.hidden = true;
    }
  }

  function handleDoubleClick(event: MouseEvent): void {
    if (committing || !selection || !isValidSelection(selection)) {
      return;
    }

    if (toolbarNode && !toolbarNode.hidden && toolbarNode.contains(event.target as Node)) {
      return;
    }

    const point = screenToEditorPoint(event.clientX, event.clientY);
    if (!containsPoint(selection, point.x, point.y)) {
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

    const uniqueRecent = recentColors.filter(
      (color, index, all) =>
        /^#[0-9a-f]{6}$/i.test(color) &&
        all.findIndex((entry) => entry.toLowerCase() === color.toLowerCase()) === index
    );

    for (const color of uniqueRecent) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "litesnap-overlay__color litesnap-overlay__color--recent";
      button.dataset.color = color.toLowerCase();
      button.style.background = color;
      button.title = `最近 ${color}`;
      button.setAttribute("aria-label", `最近颜色 ${color}`);
      button.addEventListener("click", () => setActiveColor(color));
      colorsNode.appendChild(button);
    }

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
    const wrap = document.createElement("div");
    wrap.className = "litesnap-overlay__width-slider-wrap";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "litesnap-overlay__width-slider";
    slider.id = "litesnap-width-slider";
    slider.min = String(MIN_ANNOTATION_LINE_WIDTH);
    slider.max = String(MAX_ANNOTATION_LINE_WIDTH);
    slider.step = "1";
    slider.value = String(activeLineWidth);
    slider.title = "拖动调整粗细";
    slider.setAttribute("aria-label", "拖动调整标注粗细");

    const value = document.createElement("span");
    value.className = "litesnap-overlay__width-value";
    value.textContent = String(activeLineWidth);

    slider.addEventListener("input", () => {
      const next = Number(slider.value);
      value.textContent = String(next);
      setActiveLineWidth(next);
    });

    wrap.appendChild(slider);
    wrap.appendChild(value);
    widthsNode.appendChild(wrap);
    widthSliderNode = slider;
    widthValueNode = value;
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
    activeLineWidth = clamp(width, MIN_ANNOTATION_LINE_WIDTH, MAX_ANNOTATION_LINE_WIDTH);
    if (widthSliderNode) {
      widthSliderNode.value = String(activeLineWidth);
    }
    if (widthValueNode) {
      widthValueNode.textContent = String(activeLineWidth);
    }
    const selected =
      selectedAnnotationIndex !== null ? annotations[selectedAnnotationIndex] : null;
    if (selected && "lineWidth" in selected) {
      selected.lineWidth = activeLineWidth;
      rebuildVectorLayer();
      renderAnnotations();
    }
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
        if (action === "ocr") {
          void recognizeSelectionText();
        } else if (action === "translate") {
          void translateSelectionText();
        } else if (action === "long") {
          void startLongCapture();
        } else if (action) {
          void commitSelection(action);
        }
      });
    });
  }

  function bindTextInput(): void {
    if (!textInput) {
      return;
    }
    textInput.addEventListener("input", () => {
      syncTextInputLayout();
    });
    textInput.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        finishTextInput(false);
        return;
      }
      // Enter inserts a newline; Ctrl/Cmd+Enter commits (WeChat-like).
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finishTextInput(true);
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

      if (isColorMode()) {
        if (event.key === "c" || event.key === "C") {
          event.preventDefault();
          void copyHoveredColor({ exitAfter: true });
        }
        return;
      }

      if (isEditorMode() && (event.ctrlKey || event.metaKey)) {
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          setEditorZoom(editorZoom * 1.15);
          return;
        }
        if (event.key === "-") {
          event.preventDefault();
          setEditorZoom(editorZoom / 1.15);
          return;
        }
        if (event.key === "0") {
          event.preventDefault();
          editorZoom = 1;
          editorPan = { x: 0, y: 0 };
          applyEditorViewTransform();
          return;
        }
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
        markSelectionCommittedIfValid();
        renderSelection();
        return;
      }

      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        void copyHoveredColor();
        return;
      }

      if (event.key === "Enter" && isValidSelection(selection)) {
        event.preventDefault();
        void commitSelection("copy");
      }
    });
  }

  function bindEditorViewportControls(): void {
    if (!overlayRoot) {
      return;
    }
    overlayRoot.addEventListener(
      "wheel",
      (event) => {
        if (!isEditorMode() || !(event.ctrlKey || event.metaKey)) {
          return;
        }
        event.preventDefault();
        setEditorZoom(
          editorZoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12),
          { x: event.clientX, y: event.clientY }
        );
      },
      { passive: false }
    );
  }

  function applyAnnotationDefaults(state: OverlayState): void {
    activeColor = state.annotationColor || activeColor;
    activeLineWidth = state.annotationLineWidth || activeLineWidth;
    textSize = state.annotationTextSize || textSize;
    lastAnnotationTool = state.annotationTool;
    setActiveColor(activeColor, false);
    setActiveLineWidth(activeLineWidth, false);
    setFillShapes(Boolean(state.annotationFillShapes), false);
    // Every capture starts in "select" mode so the user can drag a region or
    // grab a window. The saved drawing tool is restored after that selection is
    // valid, preserving both workflows.
  }

  function applyOverlayState(state: OverlayState): void {
    const captureChanged = state.captureId !== activeCaptureId;
    if (captureChanged) {
      activeCaptureId = state.captureId;
      resetSelectionUi();
      overlayState = null;
      compositeImage = null;
      compositeImageSource = "";
      loupeSampleImage = null;
      loupeSampleImageSource = "";
      effectLayerCanvas = null;
      effectLayerCtx = null;
      vectorLayerCanvas = null;
      vectorLayerCtx = null;
      annotationCanvasCtx = null;
      annotationCanvasPixelWidth = 0;
      annotationCanvasPixelHeight = 0;
      editorZoom = 1;
      editorPan = { x: 0, y: 0 };
      lastLoupeSampleCell = null;
      lastWindowProbePoint = null;
      if (overlayRoot) {
        overlayRoot.style.backgroundImage = "";
        overlayRoot.dataset.ready = "false";
      }
    }

    overlayState = state;
    overlayMode = state.mode === "color" ? "color" : "capture";
    recentColors = Array.isArray(state.recentColors) ? [...state.recentColors] : recentColors;
    applyAnnotationDefaults(state);

    if (!overlayRoot) {
      return;
    }

    if (hintNode) {
      hintNode.textContent = isColorMode()
        ? "取色模式：移动鼠标取样，单击或按 C 复制颜色后退出，Esc 取消。"
        : "拖拽选择区域，松开后可标注。Enter 复制，Esc 取消。";
      if (isEditorMode()) {
        hintNode.textContent = "编辑历史截图：Ctrl + 滚轮缩放，中键拖动平移；添加标注后可复制、保存或贴图，原图不会被覆盖。";
      }
    }

    if (isColorMode()) {
      if (toolbarNode) {
        toolbarNode.hidden = true;
      }
      if (selectionNode) {
        selectionNode.hidden = true;
      }
      if (dimNode) {
        dimNode.hidden = true;
      }
      if (windowHintNode) {
        windowHintNode.hidden = true;
      }
    } else {
      buildColorControls();
    }

    const longCaptureButton = toolbarNode?.querySelector<HTMLButtonElement>(
      '[data-action="long"]'
    );
    if (longCaptureButton) {
      longCaptureButton.hidden = isEditorMode();
    }

    if (isEditorMode()) {
      selection = {
        x: 0,
        y: 0,
        width: state.viewportWidth,
        height: state.viewportHeight
      };
      lastSelection = { ...selection };
      selectionCommitted = true;
      dragMode = "idle";
      setActiveTool("select", false);
    }
    applyEditorViewTransform();

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
        if (overlayState !== pendingState) {
          return;
        }
        loupeSampleImage = image;
        loupeSampleImageSource = dataUrl;
        compositeImage = image;
        compositeImageSource = dataUrl;
        root.style.backgroundImage = `url("${dataUrl}")`;
        root.style.backgroundSize = backgroundSize;
        applyEditorViewTransform();
        root.dataset.ready = "true";
        allowWindowHintAfterReady = false;
        if (isEditorMode()) {
          renderSelection();
        }
      } catch {
        if (overlayState !== pendingState) {
          return;
        }
        root.style.backgroundImage = `url("${dataUrl}")`;
        root.style.backgroundSize = backgroundSize;
        applyEditorViewTransform();
        root.dataset.ready = "true";
        allowWindowHintAfterReady = false;
        if (isEditorMode()) {
          renderSelection();
        }
      }
    })();
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
    bindEditorViewportControls();
    bindOverlayStateSubscription();
  }

  bootstrapOverlay();
})();
