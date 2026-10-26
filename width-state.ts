export const MIN_WIDTH = 480;
export const MAX_WIDTH = 2000;
export type WidthMode = "native" | "reading" | "wide" | "fill";
export type Preset = "reading" | "wide";
export type Preferences = { version: 1; mode: WidthMode; reading: number; wide: number };
export type WidthSnapshot = { preferences: Preferences; persistence: "ok" | "unavailable" };
type StorageLike = Pick<Storage,"getItem"|"setItem">;
const defaults: Preferences = { version: 1, mode: "native", reading: 720, wide: 1040 };
export const isWidth = (n: number) => Number.isInteger(n) && n >= MIN_WIDTH && n <= MAX_WIDTH;
export const isPreset = (mode: WidthMode): mode is Preset => mode === "reading" || mode === "wide";

export function parsePreferences(raw: string | null): Preferences {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (value && typeof value === "object") {
      const p = value as Record<string,unknown>;
      if (p.version === 1 && typeof p.mode === "string" && ["native","reading","wide","fill"].includes(p.mode)
        && typeof p.reading === "number" && isWidth(p.reading)
        && typeof p.wide === "number" && isWidth(p.wide)) {
        return {version:1,mode:p.mode as WidthMode,reading:p.reading,wide:p.wide};
      }
    }
  } catch { /* Unknown records stay untouched until the user commits a choice. */ }
  return {...defaults};
}

export function createWidthStore(pluginId: string, storage: () => StorageLike, events?: EventTarget) {
  const key = pluginId + ":width-preferences:v1";
  let snapshot: WidthSnapshot = {preferences:{...defaults},persistence:"ok"};
  try { snapshot = {...snapshot,preferences:parsePreferences(storage().getItem(key))}; }
  catch { snapshot = {...snapshot,persistence:"unavailable"}; }
  let committed = snapshot.preferences;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  const replace = (preferences: Preferences) => {snapshot = {...snapshot,preferences};notify();};
  const commit = () => {
    committed = snapshot.preferences;
    try {storage().setItem(key,JSON.stringify(committed));snapshot={...snapshot,persistence:"ok"};}
    catch {snapshot={...snapshot,persistence:"unavailable"};}
    notify();
  };
  const onStorage = (event: Event) => {
    const change=event as StorageEvent;
    if(change.key!==key && change.key!==null)return;
    committed=parsePreferences(change.newValue);
    snapshot={preferences:committed,persistence:"ok"};notify();
  };
  events?.addEventListener("storage",onStorage);
  return {
    key,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {listeners.add(listener);return () => {listeners.delete(listener);};},
    select(mode: WidthMode) {replace({...snapshot.preferences,mode});commit();},
    preview(width: number) {
      if(!isWidth(width)) throw new RangeError("Width must be a whole number from 480 to 2000.");
      const mode=snapshot.preferences.mode;
      if(isPreset(mode))replace({...snapshot.preferences,[mode]:width});
    },
    commit,
    cancel() {replace({...committed});},
    dispose() {events?.removeEventListener("storage",onStorage);listeners.clear();},
  };
}
export type WidthStore = ReturnType<typeof createWidthStore>;
