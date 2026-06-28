import { DatabaseSync } from "node:sqlite";

export function applySqlitePerformancePragmas(db: DatabaseSync): void {
  db.prepare("PRAGMA journal_mode = WAL").run();
  db.prepare("PRAGMA busy_timeout = 5000").run();
  db.prepare("PRAGMA synchronous = NORMAL").run();
}
