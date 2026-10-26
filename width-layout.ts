// These internal BB selectors are verified in docs/compatibility.md.
const PANE = "[data-split-pane-id]";
const THREAD = "[data-thread-window]";
const VIEWPORT = "[data-page-scroll-viewport]";
const TIMELINE = '[data-timeline-row-list="top-level"]';
const CENTERED_COLUMN = ".mx-auto.w-full";
const COLUMN_MARK = "data-chat-width-column";
const COMPOSER = ".chat-prompt-box";
const PRIMARY = '[data-app-composer-role="primary"]';
const ROW = "[data-timeline-row-id]";
const ACTIVE = "data-chat-width-active";
const PROPERTY = "--chat-width-max";
const bindings = new Set<() => void>();

export function bindPane(trigger: HTMLElement, onMeasure?: (width: number) => void) {
  const pane = trigger.closest<HTMLElement>(PANE);
  if (!pane || pane.querySelectorAll(THREAD).length !== 1) return null;
  const thread = pane.querySelector<HTMLElement>(THREAD)!;
  const timelines = thread.querySelectorAll<HTMLElement>(TIMELINE);
  const column = timelines.length===1 ? timelines[0].closest<HTMLElement>(CENTERED_COLUMN) : null;
  const composers = Array.from(thread.querySelectorAll<HTMLElement>(COMPOSER))
    .filter(el=>el.querySelectorAll(PRIMARY).length===1);
  const viewports = thread.querySelectorAll<HTMLElement>(VIEWPORT);
  if (!column || !thread.contains(column) || composers.length!==1 || viewports.length!==1) return null;
  const viewport=viewports[0];
  if(!viewport.contains(column) || !viewport.contains(composers[0]))return null;
  const columns=[column,composers[0]];
  const marks=columns.map(element=>({element,value:element.getAttribute(COLUMN_MARK)}));
  const original={value:pane.style.getPropertyValue(PROPERTY),priority:pane.style.getPropertyPriority(PROPERTY),active:pane.getAttribute(ACTIVE)};
  let disposed=false, frame=0;
  const cancelFrame=()=>{if(frame){cancelAnimationFrame(frame);frame=0;}};
  const measure=()=>onMeasure?.(viewport.clientWidth);
  const observer=typeof ResizeObserver==="undefined"?null:new ResizeObserver(measure);
  observer?.observe(viewport);
  viewport.addEventListener("wheel",cancelFrame,{passive:true});
  viewport.addEventListener("pointerdown",cancelFrame,{passive:true});
  const restore=()=>{
    for(const {element,value} of marks){
      if(value===null)element.removeAttribute(COLUMN_MARK);
      else element.setAttribute(COLUMN_MARK,value);
    }
    if(original.value)pane.style.setProperty(PROPERTY,original.value,original.priority);
    else pane.style.removeProperty(PROPERTY);
    if(original.active===null)pane.removeAttribute(ACTIVE);
    else pane.setAttribute(ACTIVE,original.active);
  };
  const dispose=()=>{
    if(disposed)return;
    disposed=true;cancelFrame();observer?.disconnect();
    viewport.removeEventListener("wheel",cancelFrame);
    viewport.removeEventListener("pointerdown",cancelFrame);
    restore();bindings.delete(dispose);
  };
  bindings.add(dispose);measure();
  return {
    apply(width: number | "fill" | null) {
      if(disposed)return;
      cancelFrame();
      const top=viewport.getBoundingClientRect().top;
      const atBottom=viewport.scrollHeight-viewport.clientHeight-viewport.scrollTop<=40;
      const anchor=Array.from(thread.querySelectorAll<HTMLElement>(ROW)).find(el=>{
        const r=el.getBoundingClientRect();return r.bottom>top+1 && r.height>0;
      });
      const offset=anchor ? anchor.getBoundingClientRect().top-top : 0;
      if(width===null)restore();
      else {
        for(const element of columns)element.setAttribute(COLUMN_MARK,"");
        pane.style.setProperty(PROPERTY,width==="fill"?"none":width+"px");pane.setAttribute(ACTIVE,"");
      }
      const reconcile=()=>{
        if(disposed)return;
        if(atBottom)viewport.scrollTop=viewport.scrollHeight;
        else if(anchor?.isConnected)viewport.scrollTop+=anchor.getBoundingClientRect().top-viewport.getBoundingClientRect().top-offset;
        measure();
      };
      reconcile();
      frame=requestAnimationFrame(()=>{reconcile();frame=requestAnimationFrame(()=>{frame=0;reconcile();});});
    },
    dispose,
  };
}
export type PaneBinding = NonNullable<ReturnType<typeof bindPane>>;
export function watchPane(trigger:HTMLElement,onBinding:(binding:PaneBinding|null)=>void,onMeasure?:(width:number)=>void) {
  onBinding(null);
  let binding:PaneBinding|null=null;
  let observer:MutationObserver|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const stopWaiting=()=>{observer?.disconnect();observer=null;if(timer)clearTimeout(timer);};
  const attempt=()=>{
    binding=bindPane(trigger,onMeasure);
    if(binding){stopWaiting();onBinding(binding);}
  };
  attempt();
  if(!binding){
    const pane=trigger.closest(PANE);
    if(pane){
      observer=new MutationObserver(attempt);
      observer.observe(pane,{childList:true,subtree:true});
      timer=setTimeout(stopWaiting,5000);
    }
  }
  let disposed=false;
  const dispose=()=>{if(disposed)return;disposed=true;stopWaiting();binding?.dispose();bindings.delete(dispose);};
  bindings.add(dispose);
  return dispose;
}
export function disposeLayouts() {for(const dispose of [...bindings])dispose();}
