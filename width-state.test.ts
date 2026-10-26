import { describe, it, expect } from "vitest";
import { createWidthStore, parsePreferences } from "./width-state";

const memory = () => {
  const data = new Map<string,string>();
  return { getItem: (k:string) => data.get(k) ?? null, setItem: (k:string,v:string) => { data.set(k,v); } };
};

describe("remembered width choices", () => {
  it("starts native, recalls independent presets and preserves them through native recovery", () => {
    const storage=memory();
    const store=createWidthStore("chat-width",()=>storage);
    expect(store.getSnapshot().preferences.mode).toBe("native");
    store.select("reading"); store.preview(680); store.commit();
    store.select("wide"); store.preview(1120); store.commit();
    store.select("fill"); store.select("native");
    expect(createWidthStore("chat-width",()=>storage).getSnapshot().preferences)
      .toEqual({version:1,mode:"native",reading:680,wide:1120});
  });
  it("rejects damaged, out-of-range and unknown-version records", () => {
    for(const raw of ["oops",JSON.stringify({version:1,mode:["wide"],reading:720,wide:1040}),JSON.stringify({version:2,mode:"fill",reading:720,wide:1040}),
      JSON.stringify({version:1,mode:"reading",reading:0,wide:1040}),
      JSON.stringify({version:1,mode:"reading",reading:720.5,wide:1040})]) {
      expect(parsePreferences(raw).mode).toBe("native");
    }
  });
  it("previews without persistence and can cancel an invalid editing draft", () => {
    const storage=memory(), store=createWidthStore("chat-width",()=>storage);
    store.select("wide"); store.preview(900);
    expect(store.getSnapshot().preferences.wide).toBe(900);
    expect(createWidthStore("chat-width",()=>storage).getSnapshot().preferences.wide).toBe(1040);
    store.cancel();
    expect(store.getSnapshot().preferences.wide).toBe(1040);
    expect(()=>store.preview(2001)).toThrow();
  });
  it("continues in memory and discloses unavailable storage", () => {
    const store=createWidthStore("chat-width",()=>{ throw new Error("blocked"); });
    store.select("reading"); store.preview(680); store.commit();
    expect(store.getSnapshot().preferences.reading).toBe(680);
    expect(store.getSnapshot().persistence).toBe("unavailable");
  });
  it("applies another tab's committed record without echoing a storage write", () => {
    const storage=memory(), events=new EventTarget();
    const store=createWidthStore("chat-width",()=>storage,events);
    let updates=0; const unsubscribe=store.subscribe(()=>updates++);
    events.dispatchEvent(new StorageEvent("storage",{key:store.key,newValue:JSON.stringify({version:1,mode:"wide",reading:700,wide:1200})}));
    expect(store.getSnapshot().preferences.wide).toBe(1200);
    expect(storage.getItem(store.key)).toBeNull();
    unsubscribe(); store.dispose();
    events.dispatchEvent(new StorageEvent("storage",{key:store.key,newValue:null}));
    expect(updates).toBe(1);
  });
});
