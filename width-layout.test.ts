import { afterEach,describe,it,expect,vi } from "vitest";
import { bindPane, disposeLayouts, watchPane } from "./width-layout";

const fixture=()=>{
  const pane=document.createElement("div"); pane.setAttribute("data-split-pane-id","test");
  pane.innerHTML='<header><button>Width</button></header><div data-thread-window><div data-page-scroll-viewport><div class="mx-auto w-full" data-scroll-attached><div data-timeline-row-list="top-level"></div></div><div class="chat-prompt-box"><div data-app-composer-role="primary"></div></div></div></div>';
  document.body.append(pane); return {pane,trigger:pane.querySelector("button")!};
};
afterEach(()=>{disposeLayouts();document.body.replaceChildren();vi.unstubAllGlobals();});
describe("scoped width override",()=>{
 it("binds only a verified conversation pane and removes its own override on native/dispose",()=>{
  const a=fixture(),b=fixture();
  const binding=bindPane(a.trigger);
  expect(binding).not.toBeNull();
  binding!.apply(1100);
  expect(a.pane.style.getPropertyValue("--chat-width-max")).toBe("1100px");
  expect(b.pane.hasAttribute("data-chat-width-active")).toBe(false);
  binding!.apply(null);
  expect(a.pane.hasAttribute("data-chat-width-active")).toBe(false);
  binding!.apply("fill");
  binding!.dispose(); binding!.dispose();
  expect(a.pane.style.getPropertyValue("--chat-width-max")).toBe("");
 });
 it("does not guess when host markup is missing or ambiguous",()=>{
  const {pane,trigger}=fixture();
  pane.querySelector("[data-timeline-row-list]")!.remove();
  expect(bindPane(trigger)).toBeNull();
  const other=fixture();
  const duplicate=other.pane.querySelector(".chat-prompt-box")!.cloneNode(true);
  other.pane.querySelector("[data-thread-window]")!.append(duplicate);
  expect(bindPane(other.trigger)).toBeNull();
 });
 it("cleans every pane on content-script disposal and preserves preexisting owned-property values",()=>{
  const {pane,trigger}=fixture();
  pane.style.setProperty("--chat-width-max","900px");
  const binding=bindPane(trigger)!;
  binding.apply(1200);disposeLayouts();
  expect(pane.style.getPropertyValue("--chat-width-max")).toBe("900px");
  expect(pane.hasAttribute("data-chat-width-active")).toBe(false);
 });
 it("detects the same column while the reader is detached from the streaming tail",()=>{
  const {pane,trigger}=fixture();
  const column=pane.querySelector("[data-scroll-attached]")!;
  column.removeAttribute("data-scroll-attached");
  const binding=bindPane(trigger);
  expect(binding).not.toBeNull();
  binding!.apply(680);
  expect(column.hasAttribute("data-chat-width-column")).toBe(true);
 });
 it("clears a prior supported binding when the next conversation is unsupported",()=>{
  const a=fixture(),b=fixture();
  let current=bindPane(a.trigger);
  b.pane.querySelector("[data-timeline-row-list]")!.remove();
  watchPane(b.trigger,next=>{current=next;});
  expect(current).toBeNull();
 });
});
