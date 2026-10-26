import {afterEach,expect,it} from "vitest";
import {loadPluginApp,mountPluginContentScripts} from "@get-bb/plugin-sdk/testing/app";
import {bindPane} from "./width-layout";

afterEach(()=>document.body.replaceChildren());
it("registers only the width control and its cleanup-safe script",async()=>{
 const app=await loadPluginApp(()=>import("./app"));
 expect(app.threadHeaderActions).toHaveLength(1);
 expect(app.navPanels).toHaveLength(0);
 const scripts=await mountPluginContentScripts(app,{pluginId:"chat-width"});
 document.body.innerHTML='<div data-split-pane-id="a"><button>Width</button><div data-thread-window><div data-page-scroll-viewport><div class="mx-auto w-full"><div data-timeline-row-list="top-level"></div></div><div class="chat-prompt-box"><div data-app-composer-role="primary"></div></div></div></div></div>';
 const pane=document.querySelector<HTMLElement>("[data-split-pane-id]")!;
 bindPane(document.querySelector("button")!)!.apply(900);
 expect(pane.hasAttribute("data-chat-width-active")).toBe(true);
 await scripts.lifecycle.dispose();
 expect(pane.hasAttribute("data-chat-width-active")).toBe(false);
});
