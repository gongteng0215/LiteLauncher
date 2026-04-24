const handlerConstants = window.__LL_PLUGIN_CONSTANTS__;
if (!handlerConstants) {
  throw new Error("plugin constants unavailable for handler config");
}

window.__LL_PLUGIN_HANDLER_CONFIGS__ = [
  {
    pluginId: handlerConstants.HARDWARE_INSPECTOR_PLUGIN_ID,
    formSelector: "form.hardware-inspector-form",
    enterActionKey: "hardware-inspector-refresh"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_PASSWORD_PLUGIN_ID,
    formSelector: "form.webtools-password-form",
    enterActionKey: "password-generate"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_JSON_PLUGIN_ID,
    formSelector: "form.webtools-json-form",
    enterActionKey: "json-convert"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_URL_PLUGIN_ID,
    formSelector: "form.webtools-url-form",
    enterActionKey: "url-parse"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_DIFF_PLUGIN_ID,
    formSelector: "form.webtools-diff-form",
    enterActionKey: "diff-compare"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_TIMESTAMP_PLUGIN_ID,
    formSelector: "form.webtools-timestamp-form",
    enterActionKey: "timestamp-to-date"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_REGEX_PLUGIN_ID,
    formSelector: "form.webtools-regex-form",
    enterActionKey: "regex-refresh"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_CRON_PLUGIN_ID,
    formSelector: "form.webtools-cron-form",
    enterActionKey: "cron-parse"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_CRYPTO_PLUGIN_ID,
    formSelector: "form.webtools-crypto-form",
    enterActionKey: "crypto-process"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_JWT_PLUGIN_ID,
    formSelector: "form.webtools-jwt-form",
    enterActionKey: "jwt-parse"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_STRINGS_PLUGIN_ID,
    formSelector: "form.webtools-strings-form",
    enterActionKey: "strings-convert"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_COLORS_PLUGIN_ID,
    formSelector: "form.webtools-colors-form",
    enterActionKey: "colors-convert"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_IMAGE_BASE64_PLUGIN_ID,
    formSelector: "form.webtools-image-base64-form",
    enterActionKey: "image-base64-normalize"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_CONFIG_PLUGIN_ID,
    formSelector: "form.webtools-config-form",
    enterActionKey: "config-convert"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_SQL_PLUGIN_ID,
    formSelector: "form.webtools-sql-form",
    enterActionKey: "sql-format"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_UNIT_PLUGIN_ID,
    formSelector: "form.webtools-unit-form",
    enterActionKey: "unit-convert"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_FILE_HASH_PLUGIN_ID,
    formSelector: "form.webtools-file-hash-form",
    enterActionKey: "file-hash-calculate"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_PORT_HELPER_PLUGIN_ID,
    formSelector: "form.webtools-port-helper-form",
    enterActionKey: "port-helper-query"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_QRCODE_PLUGIN_ID,
    formSelector: "form.webtools-qrcode-form",
    enterActionKey: "qrcode-generate"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_MARKDOWN_PLUGIN_ID,
    formSelector: "form.webtools-markdown-form",
    enterActionKey: "markdown-render"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_UA_PLUGIN_ID,
    formSelector: "form.webtools-ua-form",
    enterActionKey: "ua-parse"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_API_PLUGIN_ID,
    formSelector: "form.webtools-api-form",
    enterActionKey: "api-request"
  },
  {
    pluginId: handlerConstants.WEBTOOLS_HTTP_MOCK_PLUGIN_ID,
    formSelector: "form.webtools-http-mock-form",
    enterActionKey: "http-mock-start"
  }
];
