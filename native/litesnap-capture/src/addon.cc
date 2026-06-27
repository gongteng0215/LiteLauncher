#include <node_api.h>
#include <windows.h>
#include <dwmapi.h>

#include <cstdint>
#include <vector>

namespace {

struct CaptureRequest {
  int32_t x;
  int32_t y;
  int32_t capture_width;
  int32_t capture_height;
  int32_t output_width;
  int32_t output_height;
};

struct RectResult {
  int32_t x;
  int32_t y;
  int32_t width;
  int32_t height;
};

struct WindowSearchContext {
  POINT point;
  HWND result;
  DWORD current_process_id;
};

bool ReadInt32Property(
    napi_env env,
    napi_value object,
    const char* key,
    int32_t* value) {
  napi_value property;
  if (napi_get_named_property(env, object, key, &property) != napi_ok) {
    return false;
  }

  return napi_get_value_int32(env, property, value) == napi_ok;
}

bool ParseCaptureRequest(
    napi_env env,
    napi_value input,
    CaptureRequest* request) {
  return ReadInt32Property(env, input, "x", &request->x) &&
         ReadInt32Property(env, input, "y", &request->y) &&
         ReadInt32Property(env, input, "captureWidth", &request->capture_width) &&
         ReadInt32Property(env, input, "captureHeight", &request->capture_height) &&
         ReadInt32Property(env, input, "outputWidth", &request->output_width) &&
         ReadInt32Property(env, input, "outputHeight", &request->output_height);
}

void CleanupCaptureObjects(
    HDC screen_dc,
    HDC memory_dc,
    HBITMAP bitmap,
    HGDIOBJ old_bitmap) {
  if (memory_dc != nullptr && old_bitmap != nullptr) {
    SelectObject(memory_dc, old_bitmap);
  }
  if (bitmap != nullptr) {
    DeleteObject(bitmap);
  }
  if (memory_dc != nullptr) {
    DeleteDC(memory_dc);
  }
  if (screen_dc != nullptr) {
    ReleaseDC(nullptr, screen_dc);
  }
}

struct FramesRequest {
  int32_t x;
  int32_t y;
  int32_t capture_width;
  int32_t capture_height;
  int32_t preview_width;
  int32_t preview_height;
};

bool ReadBitmapPixels(
    HDC dc,
    HBITMAP bitmap,
    int32_t width,
    int32_t height,
    std::vector<uint8_t>* pixels) {
  if (pixels == nullptr || width <= 0 || height <= 0) {
    return false;
  }

  BITMAPINFO bitmap_info{};
  bitmap_info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  bitmap_info.bmiHeader.biWidth = width;
  bitmap_info.bmiHeader.biHeight = -height;
  bitmap_info.bmiHeader.biPlanes = 1;
  bitmap_info.bmiHeader.biBitCount = 32;
  bitmap_info.bmiHeader.biCompression = BI_RGB;

  const size_t bitmap_bytes =
      static_cast<size_t>(width) * static_cast<size_t>(height) * 4U;
  pixels->assign(bitmap_bytes, 0);

  const int copied_scanlines = GetDIBits(
      dc,
      bitmap,
      0,
      static_cast<UINT>(height),
      pixels->data(),
      &bitmap_info,
      DIB_RGB_COLORS);
  if (copied_scanlines == 0) {
    pixels->clear();
    return false;
  }

  for (size_t offset = 3; offset < pixels->size(); offset += 4) {
    (*pixels)[offset] = 0xFF;
  }

  return true;
}

napi_value BuildBitmapResult(
    napi_env env,
    const char* width_key,
    const char* height_key,
    const char* data_key,
    int32_t width,
    int32_t height,
    const std::vector<uint8_t>& pixels) {
  napi_value data_buffer;
  if (napi_create_buffer_copy(
          env,
          pixels.size(),
          pixels.data(),
          nullptr,
          &data_buffer) != napi_ok) {
    return nullptr;
  }

  napi_value result;
  if (napi_create_object(env, &result) != napi_ok) {
    return nullptr;
  }

  napi_value width_value;
  napi_create_int32(env, width, &width_value);
  napi_set_named_property(env, result, width_key, width_value);

  napi_value height_value;
  napi_create_int32(env, height, &height_value);
  napi_set_named_property(env, result, height_key, height_value);

  napi_set_named_property(env, result, data_key, data_buffer);
  return result;
}

bool ParseFramesRequest(
    napi_env env,
    napi_value input,
    FramesRequest* request) {
  return ReadInt32Property(env, input, "x", &request->x) &&
         ReadInt32Property(env, input, "y", &request->y) &&
         ReadInt32Property(env, input, "captureWidth", &request->capture_width) &&
         ReadInt32Property(env, input, "captureHeight", &request->capture_height) &&
         ReadInt32Property(env, input, "previewWidth", &request->preview_width) &&
         ReadInt32Property(env, input, "previewHeight", &request->preview_height);
}

napi_value CreateNull(napi_env env) {
  napi_value result;
  napi_get_null(env, &result);
  return result;
}

napi_value CaptureDisplayRect(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  if (napi_get_cb_info(env, info, &argc, args, nullptr, nullptr) != napi_ok ||
      argc < 1) {
    return CreateNull(env);
  }

  CaptureRequest request{};
  if (!ParseCaptureRequest(env, args[0], &request)) {
    return CreateNull(env);
  }

  if (request.capture_width <= 0 || request.capture_height <= 0 ||
      request.output_width <= 0 || request.output_height <= 0) {
    return CreateNull(env);
  }

  HDC screen_dc = GetDC(nullptr);
  if (screen_dc == nullptr) {
    return CreateNull(env);
  }

  HDC memory_dc = CreateCompatibleDC(screen_dc);
  if (memory_dc == nullptr) {
    CleanupCaptureObjects(screen_dc, nullptr, nullptr, nullptr);
    return CreateNull(env);
  }

  HBITMAP bitmap =
      CreateCompatibleBitmap(screen_dc, request.output_width, request.output_height);
  if (bitmap == nullptr) {
    CleanupCaptureObjects(screen_dc, memory_dc, nullptr, nullptr);
    return CreateNull(env);
  }

  HGDIOBJ old_bitmap = SelectObject(memory_dc, bitmap);
  if (old_bitmap == nullptr || old_bitmap == HGDI_ERROR) {
    CleanupCaptureObjects(screen_dc, memory_dc, bitmap, nullptr);
    return CreateNull(env);
  }

  SetStretchBltMode(memory_dc, COLORONCOLOR);

  const BOOL copied =
      request.capture_width == request.output_width &&
              request.capture_height == request.output_height
          ? BitBlt(
                memory_dc,
                0,
                0,
                request.output_width,
                request.output_height,
                screen_dc,
                request.x,
                request.y,
                SRCCOPY | CAPTUREBLT)
          : StretchBlt(
                memory_dc,
                0,
                0,
                request.output_width,
                request.output_height,
                screen_dc,
                request.x,
                request.y,
                request.capture_width,
                request.capture_height,
                SRCCOPY | CAPTUREBLT);

  if (!copied) {
    CleanupCaptureObjects(screen_dc, memory_dc, bitmap, old_bitmap);
    return CreateNull(env);
  }

  BITMAPINFO bitmap_info{};
  bitmap_info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  bitmap_info.bmiHeader.biWidth = request.output_width;
  bitmap_info.bmiHeader.biHeight = -request.output_height;
  bitmap_info.bmiHeader.biPlanes = 1;
  bitmap_info.bmiHeader.biBitCount = 32;
  bitmap_info.bmiHeader.biCompression = BI_RGB;

  std::vector<uint8_t> pixels;
  if (!ReadBitmapPixels(
          memory_dc,
          bitmap,
          request.output_width,
          request.output_height,
          &pixels)) {
    CleanupCaptureObjects(screen_dc, memory_dc, bitmap, old_bitmap);
    return CreateNull(env);
  }

  CleanupCaptureObjects(screen_dc, memory_dc, bitmap, old_bitmap);

  napi_value result = BuildBitmapResult(
      env,
      "width",
      "height",
      "data",
      request.output_width,
      request.output_height,
      pixels);
  return result == nullptr ? CreateNull(env) : result;
}

napi_value CaptureDisplayFrames(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  if (napi_get_cb_info(env, info, &argc, args, nullptr, nullptr) != napi_ok ||
      argc < 1) {
    return CreateNull(env);
  }

  FramesRequest request{};
  if (!ParseFramesRequest(env, args[0], &request)) {
    return CreateNull(env);
  }

  if (request.capture_width <= 0 || request.capture_height <= 0 ||
      request.preview_width <= 0 || request.preview_height <= 0) {
    return CreateNull(env);
  }

  HDC screen_dc = GetDC(nullptr);
  if (screen_dc == nullptr) {
    return CreateNull(env);
  }

  HDC source_dc = CreateCompatibleDC(screen_dc);
  if (source_dc == nullptr) {
    CleanupCaptureObjects(screen_dc, nullptr, nullptr, nullptr);
    return CreateNull(env);
  }

  HBITMAP source_bitmap = CreateCompatibleBitmap(
      screen_dc,
      request.capture_width,
      request.capture_height);
  if (source_bitmap == nullptr) {
    CleanupCaptureObjects(screen_dc, source_dc, nullptr, nullptr);
    return CreateNull(env);
  }

  HGDIOBJ old_source_bitmap = SelectObject(source_dc, source_bitmap);
  if (old_source_bitmap == nullptr || old_source_bitmap == HGDI_ERROR) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, nullptr);
    return CreateNull(env);
  }

  const BOOL source_copied = BitBlt(
      source_dc,
      0,
      0,
      request.capture_width,
      request.capture_height,
      screen_dc,
      request.x,
      request.y,
      SRCCOPY | CAPTUREBLT);
  if (!source_copied) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    return CreateNull(env);
  }

  std::vector<uint8_t> source_pixels;
  if (!ReadBitmapPixels(
          source_dc,
          source_bitmap,
          request.capture_width,
          request.capture_height,
          &source_pixels)) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    return CreateNull(env);
  }

  HDC preview_dc = CreateCompatibleDC(screen_dc);
  if (preview_dc == nullptr) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    return CreateNull(env);
  }

  HBITMAP preview_bitmap = CreateCompatibleBitmap(
      screen_dc,
      request.preview_width,
      request.preview_height);
  if (preview_bitmap == nullptr) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    DeleteDC(preview_dc);
    return CreateNull(env);
  }

  HGDIOBJ old_preview_bitmap = SelectObject(preview_dc, preview_bitmap);
  if (old_preview_bitmap == nullptr || old_preview_bitmap == HGDI_ERROR) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    DeleteObject(preview_bitmap);
    DeleteDC(preview_dc);
    return CreateNull(env);
  }

  SetStretchBltMode(preview_dc, COLORONCOLOR);
  const BOOL preview_copied = StretchBlt(
      preview_dc,
      0,
      0,
      request.preview_width,
      request.preview_height,
      source_dc,
      0,
      0,
      request.capture_width,
      request.capture_height,
      SRCCOPY);
  if (!preview_copied) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    SelectObject(preview_dc, old_preview_bitmap);
    DeleteObject(preview_bitmap);
    DeleteDC(preview_dc);
    return CreateNull(env);
  }

  std::vector<uint8_t> preview_pixels;
  if (!ReadBitmapPixels(
          preview_dc,
          preview_bitmap,
          request.preview_width,
          request.preview_height,
          &preview_pixels)) {
    CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);
    SelectObject(preview_dc, old_preview_bitmap);
    DeleteObject(preview_bitmap);
    DeleteDC(preview_dc);
    return CreateNull(env);
  }

  SelectObject(preview_dc, old_preview_bitmap);
  DeleteObject(preview_bitmap);
  DeleteDC(preview_dc);
  CleanupCaptureObjects(screen_dc, source_dc, source_bitmap, old_source_bitmap);

  napi_value result;
  napi_create_object(env, &result);

  napi_value source_result = BuildBitmapResult(
      env,
      "width",
      "height",
      "data",
      request.capture_width,
      request.capture_height,
      source_pixels);
  if (source_result == nullptr) {
    return CreateNull(env);
  }
  napi_set_named_property(env, result, "source", source_result);

  napi_value preview_result = BuildBitmapResult(
      env,
      "width",
      "height",
      "data",
      request.preview_width,
      request.preview_height,
      preview_pixels);
  if (preview_result == nullptr) {
    return CreateNull(env);
  }
  napi_set_named_property(env, result, "preview", preview_result);
  return result;
}

BOOL CALLBACK FindWindowAtPointProc(HWND hwnd, LPARAM lparam) {
  auto* context = reinterpret_cast<WindowSearchContext*>(lparam);
  if (hwnd == nullptr || !IsWindowVisible(hwnd) || IsIconic(hwnd)) {
    return TRUE;
  }

  DWORD process_id = 0;
  GetWindowThreadProcessId(hwnd, &process_id);
  if (process_id == context->current_process_id) {
    return TRUE;
  }

  RECT rect{};
  HRESULT dwm_result = DwmGetWindowAttribute(
      hwnd,
      DWMWA_EXTENDED_FRAME_BOUNDS,
      &rect,
      sizeof(rect));
  if (FAILED(dwm_result) && !GetWindowRect(hwnd, &rect)) {
    return TRUE;
  }

  if (rect.right - rect.left <= 8 || rect.bottom - rect.top <= 8) {
    return TRUE;
  }

  if (PtInRect(&rect, context->point)) {
    context->result = hwnd;
    return FALSE;
  }

  return TRUE;
}

napi_value GetWindowRectAtPoint(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  if (napi_get_cb_info(env, info, &argc, args, nullptr, nullptr) != napi_ok ||
      argc < 2) {
    return CreateNull(env);
  }

  int32_t x = 0;
  int32_t y = 0;
  if (napi_get_value_int32(env, args[0], &x) != napi_ok ||
      napi_get_value_int32(env, args[1], &y) != napi_ok) {
    return CreateNull(env);
  }

  WindowSearchContext context{};
  context.point = POINT{ x, y };
  context.result = nullptr;
  context.current_process_id = GetCurrentProcessId();
  EnumWindows(FindWindowAtPointProc, reinterpret_cast<LPARAM>(&context));

  HWND hwnd = context.result;
  if (hwnd == nullptr) {
    return CreateNull(env);
  }

  RECT rect{};
  HRESULT dwm_result = DwmGetWindowAttribute(
      hwnd,
      DWMWA_EXTENDED_FRAME_BOUNDS,
      &rect,
      sizeof(rect));
  if (FAILED(dwm_result) && !GetWindowRect(hwnd, &rect)) {
    return CreateNull(env);
  }

  const int32_t width = static_cast<int32_t>(rect.right - rect.left);
  const int32_t height = static_cast<int32_t>(rect.bottom - rect.top);
  if (width <= 8 || height <= 8) {
    return CreateNull(env);
  }

  napi_value result;
  napi_create_object(env, &result);

  napi_value value;
  napi_create_int32(env, static_cast<int32_t>(rect.left), &value);
  napi_set_named_property(env, result, "x", value);
  napi_create_int32(env, static_cast<int32_t>(rect.top), &value);
  napi_set_named_property(env, result, "y", value);
  napi_create_int32(env, width, &value);
  napi_set_named_property(env, result, "width", value);
  napi_create_int32(env, height, &value);
  napi_set_named_property(env, result, "height", value);
  return result;
}

}  // namespace

napi_value Init(napi_env env, napi_value exports) {
  napi_value capture_fn;
  napi_create_function(
      env,
      "captureDisplayRect",
      NAPI_AUTO_LENGTH,
      CaptureDisplayRect,
      nullptr,
      &capture_fn);
  napi_set_named_property(env, exports, "captureDisplayRect", capture_fn);

  napi_value capture_frames_fn;
  napi_create_function(
      env,
      "captureDisplayFrames",
      NAPI_AUTO_LENGTH,
      CaptureDisplayFrames,
      nullptr,
      &capture_frames_fn);
  napi_set_named_property(env, exports, "captureDisplayFrames", capture_frames_fn);

  napi_value window_rect_fn;
  napi_create_function(
      env,
      "getWindowRectAtPoint",
      NAPI_AUTO_LENGTH,
      GetWindowRectAtPoint,
      nullptr,
      &window_rect_fn);
  napi_set_named_property(env, exports, "getWindowRectAtPoint", window_rect_fn);
  return exports;
}

NAPI_MODULE_INIT() { return Init(env, exports); }
