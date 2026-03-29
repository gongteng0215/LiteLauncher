window.__LL_PLUGIN_STATIC_DATA__ = {
  WEBTOOLS_SQL_DEFAULT_INPUT:
    "SELECT a,b,c FROM table_test JOIN other_table ON table_test.id = other_table.id WHERE a > 10 AND b LIKE '%test%' ORDER BY c DESC LIMIT 10",
  WEBTOOLS_SQL_DIALECT_OPTIONS: [
    { value: "sql", label: "Standard SQL" },
    { value: "mysql", label: "MySQL" },
    { value: "postgresql", label: "PostgreSQL" },
    { value: "sqlite", label: "SQLite" },
    { value: "tsql", label: "T-SQL" }
  ],
  WEBTOOLS_SQL_INDENT_OPTIONS: [
    { value: 2, label: "2 空格" },
    { value: 4, label: "4 空格" },
    { value: 1, label: "1 空格" }
  ],
  WEBTOOLS_CONFIG_DEFAULT_INPUT: `server:
  port: 8080
  servlet:
    context-path: /api
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db`,
  WEBTOOLS_CONFIG_FORMAT_OPTIONS: [
    { value: "yaml", label: "YAML" },
    { value: "json", label: "JSON" },
    { value: "properties", label: "Properties" }
  ],
  WEBTOOLS_COLORS_PRESETS: [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#9e9e9e",
    "#607d8b",
    "#2d3436",
    "#6c5ce7",
    "#00b894",
    "#0984e3",
    "#fd79a8"
  ],
  WEBTOOLS_REGEX_DEFAULT_PATTERN: "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})",
  WEBTOOLS_REGEX_DEFAULT_INPUT:
    "My emails are test@example.com and dev.ops-123@google.co.uk. Please feel free to match them!",
  WEBTOOLS_REGEX_SAFE_FLAGS: "gimsuyd",
  WEBTOOLS_REGEX_TEMPLATES: [
    {
      label: "邮箱地址",
      pattern: "([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z.]{2,6})",
      flags: "g"
    },
    {
      label: "手机号",
      pattern: "1[3-9]\\d{9}",
      flags: "g"
    },
    {
      label: "IP 地址",
      pattern:
        "((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){3}",
      flags: "g"
    },
    {
      label: "网址 URL",
      pattern: "https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-_~:/?#[\\]@!$&'()*+,;=.]+",
      flags: "g"
    }
  ],
  WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS: "!@#$%^&*",
  WEBTOOLS_JWT_DEFAULT_SECRET: "your-256-bit-secret",
  WEBTOOLS_JWT_SAMPLE_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
    "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  WEBTOOLS_JWT_SAMPLE_HEADER: `{
  "alg": "HS256",
  "typ": "JWT"
}`,
  WEBTOOLS_JWT_SAMPLE_PAYLOAD: `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}`,
  SEARCH_SCOPE_PREFIX_RULES: [
    {
      scope: "application",
      label: "应用",
      prefixes: ["app:", "app：", "应用:", "应用：", "程序:", "程序："]
    },
    {
      scope: "command",
      label: "命令",
      prefixes: ["cmd:", "cmd：", "command:", "command：", "命令:", "命令："]
    },
    {
      scope: "web",
      label: "网页",
      prefixes: ["web:", "web：", "url:", "url：", "网页:", "网页："]
    },
    {
      scope: "plugin",
      label: "插件",
      prefixes: ["plugin:", "plugin：", "插件:", "插件："]
    },
    {
      scope: "file",
      label: "文件",
      prefixes: ["file:", "file：", "文件:", "文件："]
    },
    {
      scope: "folder",
      label: "文件夹",
      prefixes: [
        "folder:",
        "folder：",
        "dir:",
        "dir：",
        "目录:",
        "目录：",
        "文件夹:",
        "文件夹："
      ]
    }
  ]
};
