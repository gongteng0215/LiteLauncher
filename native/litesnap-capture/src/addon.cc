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

  SetStretchBltMode(memory_dc, HALFTONE);
  SetBrushOrgEx(memory_dc, 0, 0, nullptr);

  const BOOL stretched = StretchBlt(
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

  if (!stretched) {
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

  const size_t bitmap_bytes =
      static_cast<size_t>(request.output_width) *
      static_cast<size_t>(request.output_height) * 4U;
  std::vector<uint8_t> pixels(bitmap_bytes);

  const int copied_scanlines = GetDIBits(
      memory_dc,
      bitmap,
      0,
      static_cast<UINT>(request.output_height),
      pixels.data(),
      &bitmap_info,
      DIB_RGB_COLORS);

  CleanupCaptureObjects(screen_dc, memory_dc, bitmap, old_bitmap);

  if (copied_scanlines == 0) {
    return CreateNull(env);
  }

  // GDI BitBlt/StretchBlt never writes the alpha byte for 32bpp BI_RGB
  // bitmaps, so every pixel ends up fully transparent (alpha = 0). Electron's
  // nativeImage.createFromBitmap interprets that as a transparent image, which
  // renders as solid black. Force every pixel opaque before handing the buffer
  // back to JavaScript.
  for (size_t offset = 3; offset < pixels.size(); offset += 4) {
    pixels[offset] = 0xFF;
  }

  napi_value data_buffer;
  if (napi_create_buffer_copy(
          env,
          bitmap_bytes,
          pixels.data(),
          nullptr,
          &data_buffer) != napi_ok) {
    return CreateNull(env);
  }

  napi_value result;
  napi_create_object(env, &result);

  napi_value width_value;
  napi_create_int32(env, request.output_width, &width_value);
  napi_set_named_property(env, result, "width", width_value);

  napi_value height_value;
  napi_create_int32(env, request.output_height, &height_value);
  napi_set_named_property(env, result, "height", height_value);

  napi_set_named_property(env, result, "data", data_buffer);
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
