#include <node_api.h>
#include <windows.h>
#include <dwmapi.h>

#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.Globalization.h>
#include <winrt/Windows.Graphics.Imaging.h>
#include <winrt/Windows.Media.Ocr.h>

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstring>
#include <mutex>
#include <optional>
#include <sstream>
#include <string>
#include <vector>

// Raw COM interface for direct access to a SoftwareBitmap's backing buffer.
// This UUID/vtable is the documented contract for IMemoryBufferByteAccess and
// lets us memcpy the captured BGRA pixels into the bitmap without an extra copy
// through WinRT collection types.
struct __declspec(uuid("5b0d3235-4dba-4d44-865e-8f1d0e4fd04d"))
    __declspec(novtable) IMemoryBufferByteAccess : ::IUnknown {
  virtual HRESULT __stdcall GetBuffer(uint8_t** value, uint32_t* capacity) = 0;
};

namespace {

std::mutex g_ocr_mutex;

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

struct OcrWork {
  napi_async_work work = nullptr;
  napi_deferred deferred = nullptr;
  std::vector<uint8_t> pixels;
  int32_t width = 0;
  int32_t height = 0;
  bool prefer_english = false;
  bool ok = false;
  std::string text;
  std::string error;
};

enum class OcrLanguagePreference {
  kChineseFirst,
  kEnglishFirst,
};

winrt::Windows::Media::Ocr::OcrEngine ResolveOcrEngine(
    OcrLanguagePreference preference) {
  using namespace winrt::Windows::Globalization;
  using namespace winrt::Windows::Media::Ocr;

  const auto available = OcrEngine::AvailableRecognizerLanguages();

  const auto find_available = [&](std::wstring_view prefix)
      -> std::optional<Language> {
    for (uint32_t index = 0; index < available.Size(); ++index) {
      const Language candidate = available.GetAt(index);
      const std::wstring tag = candidate.LanguageTag().c_str();
      if (tag.size() >= prefix.size() &&
          tag.compare(0, prefix.size(), prefix) == 0) {
        return candidate;
      }
    }
    return std::nullopt;
  };

  const auto try_language = [&](const Language& language) -> OcrEngine {
    return OcrEngine::TryCreateFromLanguage(language);
  };

  const auto try_prefixes = [&](const wchar_t* const* prefixes, size_t count)
      -> OcrEngine {
    for (size_t index = 0; index < count; ++index) {
      const std::optional<Language> language = find_available(prefixes[index]);
      if (!language.has_value()) {
        continue;
      }
      OcrEngine engine = try_language(language.value());
      if (engine) {
        return engine;
      }
    }
    return nullptr;
  };

  static const wchar_t* kChinesePrefixes[] = {
      L"zh-Hans", L"zh-CN", L"zh-Hant", L"zh-TW", L"zh-HK", L"zh"};
  static const wchar_t* kEnglishPrefixes[] = {L"en-US", L"en-GB", L"en"};

  if (preference == OcrLanguagePreference::kEnglishFirst) {
    if (OcrEngine engine = try_prefixes(
            kEnglishPrefixes,
            sizeof(kEnglishPrefixes) / sizeof(kEnglishPrefixes[0]))) {
      return engine;
    }
  } else {
    if (OcrEngine engine = try_prefixes(
            kChinesePrefixes,
            sizeof(kChinesePrefixes) / sizeof(kChinesePrefixes[0]))) {
      return engine;
    }
  }

  if (OcrEngine engine = OcrEngine::TryCreateFromUserProfileLanguages()) {
    return engine;
  }

  if (available.Size() > 0) {
    OcrEngine engine = try_language(available.GetAt(0));
    if (engine) {
      return engine;
    }
  }

  throw std::runtime_error(
      "No OCR language is installed. Add OCR language packs in Windows "
      "language settings.");
}

winrt::Windows::Foundation::Rect GetLineBoundingRect(
    const winrt::Windows::Media::Ocr::OcrLine& line) {
  using namespace winrt::Windows::Foundation;
  using namespace winrt::Windows::Media::Ocr;

  Rect bounds{};
  bool has_bounds = false;
  for (const OcrWord& word : line.Words()) {
    const Rect word_rect = word.BoundingRect();
    if (!has_bounds) {
      bounds = word_rect;
      has_bounds = true;
      continue;
    }

    const float left = (std::min)(bounds.X, word_rect.X);
    const float top = (std::min)(bounds.Y, word_rect.Y);
    const float right = (std::max)(bounds.X + bounds.Width, word_rect.X + word_rect.Width);
    const float bottom = (std::max)(bounds.Y + bounds.Height, word_rect.Y + word_rect.Height);
    bounds.X = left;
    bounds.Y = top;
    bounds.Width = right - left;
    bounds.Height = bottom - top;
  }

  return bounds;
}

bool IsBlankOcrLine(const std::string& text) {
  for (unsigned char character : text) {
    if (!std::isspace(character)) {
      return false;
    }
  }
  return true;
}

bool NeedsSpaceBetweenOcrLines(
    const std::string& previous,
    const std::string& next) {
  if (previous.empty() || next.empty()) {
    return false;
  }

  const unsigned char previous_char =
      static_cast<unsigned char>(previous.back());
  const unsigned char next_char = static_cast<unsigned char>(next.front());
  const auto is_latin_alnum = [](unsigned char value) {
    return std::isalnum(value) != 0;
  };

  return is_latin_alnum(previous_char) && is_latin_alnum(next_char);
}

std::string FormatOcrResult(const winrt::Windows::Media::Ocr::OcrResult& result) {
  using namespace winrt::Windows::Media::Ocr;

  const std::string fallback_text = winrt::to_string(result.Text());
  const auto lines = result.Lines();
  if (lines.Size() == 0) {
    return IsBlankOcrLine(fallback_text) ? "" : fallback_text;
  }

  struct OcrLineEntry {
    uint32_t line_index;
    std::string text;
  };

  std::vector<OcrLineEntry> entries;
  entries.reserve(lines.Size());
  for (uint32_t index = 0; index < lines.Size(); ++index) {
    const std::string text = winrt::to_string(lines.GetAt(index).Text());
    if (IsBlankOcrLine(text)) {
      continue;
    }
    entries.push_back({ index, text });
  }

  if (entries.empty()) {
    return IsBlankOcrLine(fallback_text) ? "" : fallback_text;
  }
  if (entries.size() == 1) {
    return entries[0].text;
  }

  struct GapMetrics {
    float ratio;
  };

  std::vector<GapMetrics> gaps;
  gaps.reserve(entries.size() - 1);
  for (size_t index = 1; index < entries.size(); ++index) {
    const OcrLine& previous = lines.GetAt(entries[index - 1].line_index);
    const OcrLine& current = lines.GetAt(entries[index].line_index);
    const auto previous_rect = GetLineBoundingRect(previous);
    const auto current_rect = GetLineBoundingRect(current);
    const float previous_bottom = previous_rect.Y + previous_rect.Height;
    const float gap = current_rect.Y - previous_bottom;
    const float reference_height =
        (std::max)(previous_rect.Height, current_rect.Height);
    const float ratio =
        gap / (reference_height > 0.0f ? reference_height : 16.0f);
    gaps.push_back({ ratio });
  }

  // Chat-style layouts usually have one large divider gap near the top. Keep at
  // most one blank line, and only before the first clearly separated block.
  constexpr float kBlankLineRatio = 1.75f;
  constexpr float kWrapMergeRatio = 0.4f;
  size_t blank_gap_index = gaps.size();
  for (size_t index = 0; index < gaps.size(); ++index) {
    if (gaps[index].ratio >= kBlankLineRatio) {
      blank_gap_index = index;
      break;
    }
  }
  const bool use_blank_line = blank_gap_index < gaps.size();

  std::ostringstream formatted;
  formatted << entries[0].text;
  for (size_t index = 1; index < entries.size(); ++index) {
    const GapMetrics& gap = gaps[index - 1];
    const std::string& previous_text = entries[index - 1].text;
    const std::string& current_text = entries[index].text;

    if (use_blank_line && index - 1 == blank_gap_index) {
      formatted << "\n\n" << current_text;
      continue;
    }

    if (gap.ratio <= kWrapMergeRatio) {
      if (NeedsSpaceBetweenOcrLines(previous_text, current_text)) {
        formatted << ' ';
      }
      formatted << current_text;
      continue;
    }

    formatted << '\n' << current_text;
  }

  const std::string output = formatted.str();
  if (IsBlankOcrLine(output) && !IsBlankOcrLine(fallback_text)) {
    return fallback_text;
  }

  return output;
}

std::string RunOcrOnBgraPixels(
    const std::vector<uint8_t>& pixels,
    int32_t width,
    int32_t height,
    OcrLanguagePreference preference) {
  using namespace winrt::Windows::Graphics::Imaging;
  using namespace winrt::Windows::Media::Ocr;

  SoftwareBitmap bitmap(
      BitmapPixelFormat::Bgra8,
      width,
      height,
      BitmapAlphaMode::Premultiplied);

  {
    BitmapBuffer buffer = bitmap.LockBuffer(BitmapBufferAccessMode::Write);
    winrt::Windows::Foundation::IMemoryBufferReference reference =
        buffer.CreateReference();
    auto byte_access = reference.as<IMemoryBufferByteAccess>();

    uint8_t* destination = nullptr;
    uint32_t capacity = 0;
    winrt::check_hresult(byte_access->GetBuffer(&destination, &capacity));

    BitmapPlaneDescription description = buffer.GetPlaneDescription(0);
    const size_t source_stride = static_cast<size_t>(width) * 4U;
    for (int32_t row = 0; row < height; ++row) {
      uint8_t* destination_row =
          destination + description.StartIndex +
          static_cast<size_t>(row) * static_cast<size_t>(description.Stride);
      const uint8_t* source_row =
          pixels.data() + static_cast<size_t>(row) * source_stride;
      std::memcpy(destination_row, source_row, source_stride);
    }
  }

  OcrEngine engine = ResolveOcrEngine(preference);
  if (!engine) {
    throw std::runtime_error(
        "No OCR language is installed. Add Chinese OCR in Windows language "
        "settings.");
  }

  OcrResult result = engine.RecognizeAsync(bitmap).get();
  return FormatOcrResult(result);
}

void ExecuteOcrWork(napi_env /*env*/, void* data) {
  auto* work = static_cast<OcrWork*>(data);
  try {
    try {
      winrt::init_apartment(winrt::apartment_type::multi_threaded);
    } catch (winrt::hresult_error const&) {
      // The libuv worker thread may already have a COM apartment initialized
      // (or in a different mode); reuse it rather than failing the request.
    }

    std::lock_guard<std::mutex> lock(g_ocr_mutex);
    work->text = RunOcrOnBgraPixels(
        work->pixels,
        work->width,
        work->height,
        work->prefer_english ? OcrLanguagePreference::kEnglishFirst
                             : OcrLanguagePreference::kChineseFirst);
    work->ok = true;
  } catch (winrt::hresult_error const& error) {
    work->ok = false;
    work->error = winrt::to_string(error.message());
  } catch (std::exception const& error) {
    work->ok = false;
    work->error = error.what();
  } catch (...) {
    work->ok = false;
    work->error = "Unknown OCR failure.";
  }

  // Release the copied pixels as soon as recognition finishes.
  work->pixels.clear();
  work->pixels.shrink_to_fit();
}

void CompleteOcrWork(napi_env env, napi_status status, void* data) {
  auto* work = static_cast<OcrWork*>(data);

  if (status == napi_ok && work->ok) {
    napi_value text_value;
    if (napi_create_string_utf8(
            env, work->text.c_str(), work->text.size(), &text_value) == napi_ok) {
      napi_resolve_deferred(env, work->deferred, text_value);
    } else {
      napi_value fallback;
      napi_get_undefined(env, &fallback);
      napi_resolve_deferred(env, work->deferred, fallback);
    }
  } else {
    const std::string& message =
        work->error.empty() ? std::string("OCR failed.") : work->error;
    napi_value error_value;
    napi_value error_message;
    napi_create_string_utf8(
        env, message.c_str(), message.size(), &error_message);
    napi_create_error(env, nullptr, error_message, &error_value);
    napi_reject_deferred(env, work->deferred, error_value);
  }

  napi_delete_async_work(env, work->work);
  delete work;
}

napi_value RejectedPromise(napi_env env, const char* message) {
  napi_deferred deferred;
  napi_value promise;
  if (napi_create_promise(env, &deferred, &promise) != napi_ok) {
    return CreateNull(env);
  }

  napi_value error_message;
  napi_value error_value;
  napi_create_string_utf8(env, message, NAPI_AUTO_LENGTH, &error_message);
  napi_create_error(env, nullptr, error_message, &error_value);
  napi_reject_deferred(env, deferred, error_value);
  return promise;
}

bool ReadStringProperty(
    napi_env env,
    napi_value object,
    const char* key,
    std::string* out) {
  napi_value property;
  if (napi_get_named_property(env, object, key, &property) != napi_ok) {
    return false;
  }

  napi_valuetype type;
  if (napi_typeof(env, property, &type) != napi_ok || type != napi_string) {
    return false;
  }

  size_t length = 0;
  if (napi_get_value_string_utf8(env, property, nullptr, 0, &length) != napi_ok) {
    return false;
  }

  std::string value(length, '\0');
  size_t written = 0;
  if (napi_get_value_string_utf8(
          env,
          property,
          value.data(),
          value.size() + 1,
          &written) != napi_ok) {
    return false;
  }

  value.resize(written);
  *out = value;
  return true;
}

napi_value RecognizeText(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  if (napi_get_cb_info(env, info, &argc, args, nullptr, nullptr) != napi_ok ||
      argc < 1) {
    return RejectedPromise(env, "recognizeText requires a request object.");
  }

  int32_t width = 0;
  int32_t height = 0;
  if (!ReadInt32Property(env, args[0], "width", &width) ||
      !ReadInt32Property(env, args[0], "height", &height) ||
      width <= 0 || height <= 0) {
    return RejectedPromise(env, "recognizeText received invalid dimensions.");
  }

  napi_value data_property;
  if (napi_get_named_property(env, args[0], "data", &data_property) != napi_ok) {
    return RejectedPromise(env, "recognizeText requires a data buffer.");
  }

  void* buffer_data = nullptr;
  size_t buffer_length = 0;
  if (napi_get_buffer_info(env, data_property, &buffer_data, &buffer_length) !=
          napi_ok ||
      buffer_data == nullptr) {
    return RejectedPromise(env, "recognizeText requires a valid data buffer.");
  }

  const size_t expected_length =
      static_cast<size_t>(width) * static_cast<size_t>(height) * 4U;
  if (buffer_length < expected_length) {
    return RejectedPromise(env, "recognizeText buffer is smaller than expected.");
  }

  auto* work = new OcrWork();
  work->width = width;
  work->height = height;
  std::string language_preference;
  if (ReadStringProperty(env, args[0], "languagePreference", &language_preference)) {
    work->prefer_english = language_preference == "english";
  }
  work->pixels.assign(
      static_cast<const uint8_t*>(buffer_data),
      static_cast<const uint8_t*>(buffer_data) + expected_length);

  napi_value promise;
  if (napi_create_promise(env, &work->deferred, &promise) != napi_ok) {
    delete work;
    return RejectedPromise(env, "recognizeText could not create a promise.");
  }

  napi_value resource_name;
  napi_create_string_utf8(
      env, "LiteSnapOcr", NAPI_AUTO_LENGTH, &resource_name);
  if (napi_create_async_work(
          env,
          nullptr,
          resource_name,
          ExecuteOcrWork,
          CompleteOcrWork,
          work,
          &work->work) != napi_ok) {
    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_reject_deferred(env, work->deferred, undefined);
    delete work;
    return promise;
  }

  napi_queue_async_work(env, work->work);
  return promise;
}

bool TryResolveOcrEngine(OcrLanguagePreference preference) {
  try {
    winrt::Windows::Media::Ocr::OcrEngine engine = ResolveOcrEngine(preference);
    return static_cast<bool>(engine);
  } catch (...) {
    return false;
  }
}

napi_value ProbeOcr(napi_env env, napi_callback_info /*info*/) {
  napi_value result;
  napi_create_object(env, &result);

  try {
    try {
      winrt::init_apartment(winrt::apartment_type::multi_threaded);
    } catch (winrt::hresult_error const&) {
    }

    using namespace winrt::Windows::Globalization;
    using namespace winrt::Windows::Media::Ocr;

    napi_value languages_array;
    napi_create_array(env, &languages_array);
    uint32_t language_count = 0;

    const auto available = OcrEngine::AvailableRecognizerLanguages();
    for (uint32_t index = 0; index < available.Size(); ++index) {
      const std::string tag =
          winrt::to_string(available.GetAt(index).LanguageTag());
      napi_value language_value;
      napi_create_string_utf8(
          env, tag.c_str(), NAPI_AUTO_LENGTH, &language_value);
      napi_set_element(env, languages_array, language_count++, language_value);
    }
    napi_set_named_property(env, result, "availableLanguages", languages_array);

    napi_value chinese_ready;
    napi_value english_ready;
    napi_get_boolean(
        env,
        TryResolveOcrEngine(OcrLanguagePreference::kChineseFirst),
        &chinese_ready);
    napi_get_boolean(
        env,
        TryResolveOcrEngine(OcrLanguagePreference::kEnglishFirst),
        &english_ready);
    napi_set_named_property(env, result, "chineseReady", chinese_ready);
    napi_set_named_property(env, result, "englishReady", english_ready);
  } catch (winrt::hresult_error const& error) {
    napi_value empty_array;
    napi_create_array(env, &empty_array);
    napi_set_named_property(env, result, "availableLanguages", empty_array);

    napi_value false_value;
    napi_get_boolean(env, false, &false_value);
    napi_set_named_property(env, result, "chineseReady", false_value);
    napi_set_named_property(env, result, "englishReady", false_value);

    napi_value error_message;
    const std::string message = winrt::to_string(error.message());
    napi_create_string_utf8(
        env, message.c_str(), NAPI_AUTO_LENGTH, &error_message);
    napi_set_named_property(env, result, "error", error_message);
  } catch (...) {
    napi_value empty_array;
    napi_create_array(env, &empty_array);
    napi_set_named_property(env, result, "availableLanguages", empty_array);

    napi_value false_value;
    napi_get_boolean(env, false, &false_value);
    napi_set_named_property(env, result, "chineseReady", false_value);
    napi_set_named_property(env, result, "englishReady", false_value);
  }

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

  napi_value recognize_text_fn;
  napi_create_function(
      env,
      "recognizeText",
      NAPI_AUTO_LENGTH,
      RecognizeText,
      nullptr,
      &recognize_text_fn);
  napi_set_named_property(env, exports, "recognizeText", recognize_text_fn);

  napi_value probe_ocr_fn;
  napi_create_function(
      env,
      "probeOcr",
      NAPI_AUTO_LENGTH,
      ProbeOcr,
      nullptr,
      &probe_ocr_fn);
  napi_set_named_property(env, exports, "probeOcr", probe_ocr_fn);
  return exports;
}

NAPI_MODULE_INIT() { return Init(env, exports); }
