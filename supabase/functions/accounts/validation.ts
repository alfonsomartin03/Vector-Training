export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400, "Invalid request.");
  return value as Record<string, unknown>;
}

export function text(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    throw new RequestError(400, `Enter a valid ${label}.`);
  }
  return value.trim();
}

export function uuid(value: unknown): string {
  const id = text(value, "account ID", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new RequestError(400, "Invalid account ID.");
  return id;
}

export function page(value: unknown): number {
  if (value === undefined) return 1;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100000) throw new RequestError(400, "Invalid page.");
  return Number(value);
}

export function email(value: unknown): string {
  const result = text(value, "email address", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new RequestError(400, "Enter a valid email address.");
  return result;
}

const allowed = new Set(["first_name", "last_name", "gender", "birth_date", "weight_kg", "primary_sport", "training_history", "weekly_volume"]);
const choices: Record<string, string[]> = {
  gender: ["male", "female", "prefer_not_to_say"], primary_sport: ["cycling"],
  training_history: ["beginner", "intermediate", "advanced", "pro"], weekly_volume: ["1-5", "6-12", "12+"],
};

export function profilePatch(value: unknown): Record<string, string | number | null> {
  const input = object(value);
  if (!Object.keys(input).length) throw new RequestError(400, "No profile changes supplied.");
  const result: Record<string, string | number | null> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!allowed.has(key)) throw new RequestError(400, `This profile field cannot be edited: ${key}.`);
    if (raw === null || raw === "") { result[key] = null; continue; }
    if (key === "weight_kg") {
      if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0 || raw > 1000) throw new RequestError(400, "Enter a valid body mass in kg.");
      result[key] = raw;
      continue;
    }
    const val = text(raw, key.replaceAll("_", " "), 100);
    if (choices[key] && !choices[key].includes(val)) throw new RequestError(400, `Invalid ${key.replaceAll("_", " ")}.`);
    if (key === "birth_date") {
      const date = new Date(`${val}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== val || date > new Date()) throw new RequestError(400, "Enter a valid birth date (YYYY-MM-DD).");
    }
    result[key] = val;
  }
  return result;
}
