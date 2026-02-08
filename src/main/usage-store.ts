import { UsageRecord } from "../shared/types";

export class UsageStore {
  private readonly records: Map<string, UsageRecord>;

  public constructor(initialRecords?: Map<string, UsageRecord>) {
    this.records = initialRecords ? new Map(initialRecords) : new Map();
  }

  public markUsed(itemId: string): void {
    const now = Date.now();
    const current = this.records.get(itemId);

    if (!current) {
      this.records.set(itemId, { count: 1, lastUsedAt: now });
      return;
    }

    this.records.set(itemId, {
      count: current.count + 1,
      lastUsedAt: now
    });
  }

  public getAll(): Map<string, UsageRecord> {
    return this.records;
  }

  public toObject(): Record<string, UsageRecord> {
    return Object.fromEntries(this.records.entries());
  }
}
