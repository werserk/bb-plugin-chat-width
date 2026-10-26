import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import {definePluginApp, experimental_usePluginId, experimental_Icon as Icon, type PluginThreadHeaderActionProps} from "@get-bb/plugin-sdk/app";
import {ResponsiveDrawerShell} from "./components/ui/responsive-overlay";
import {usePortalScopeProps} from "./lib/portal-scope";
import {createWidthStore,isPreset,isWidth,MIN_WIDTH,MAX_WIDTH,type WidthStore,type WidthMode} from "./width-state";
import {watchPane,disposeLayouts,type PaneBinding} from "./width-layout";
import "./app.css";

let store: WidthStore | undefined;
function getStore(pluginId:string) {
  return store ??= createWidthStore(pluginId,()=>window.localStorage,window);
}
const names:Record<WidthMode,string>={native:"bb default",reading:"Reading",wide:"Wide",fill:"Fill"};

function WidthControl({threadId,isCompactViewport}:PluginThreadHeaderActionProps) {
  const pluginId=experimental_usePluginId();
  const state=getStore(pluginId);
  const snapshot=React.useSyncExternalStore(state.subscribe,state.getSnapshot,state.getSnapshot);
  const prefs=snapshot.preferences;
  const adjustable=isPreset(prefs.mode);
  const width=adjustable?prefs[prefs.mode as "reading"|"wide"]:null;
  const [open,setOpen]=React.useState(false);
  const [draft,setDraft]=React.useState(String(width??prefs.wide));
  const editing=React.useRef(false);
  const trigger=React.useRef<HTMLButtonElement>(null);
  const [binding,setBinding]=React.useState<PaneBinding|null>(null);
  const [available,setAvailable]=React.useState(0);
  const id=React.useId();
  const scope=usePortalScopeProps();
  React.useEffect(()=>{
    if(!trigger.current)return;
    return watchPane(trigger.current,setBinding,setAvailable);
  },[threadId,state]);
  React.useEffect(()=>{
    binding?.apply(prefs.mode==="native"?null:prefs.mode==="fill"?"fill":prefs[prefs.mode]);
  },[binding,prefs.mode,prefs.reading,prefs.wide]);
  React.useEffect(()=>{if(!editing.current)setDraft(String(width??prefs.wide));},[width,prefs.wide]);

  const number=Number(draft);
  const invalid=draft.trim()===""||!isWidth(number);
  const finish=()=>{
    editing.current=false;
    if(isPreset(state.getSnapshot().preferences.mode)) {
      if(!invalid){state.preview(number);state.commit();}
      else state.cancel();
    }
    const current=state.getSnapshot().preferences;
    setDraft(String(isPreset(current.mode)?current[current.mode]:current.wide));
  };
  const changeOpen=(next:boolean)=>{
    if(!next)finish();
    setOpen(next);
  };
  const label="Chat width · "+names[prefs.mode]+(width===null?"":" · "+width+" px");
  const button=<button type="button" ref={trigger} className="cw-trigger" aria-label={label} title={label} data-custom={prefs.mode!=="native"}>
    <Icon name={pluginId+"/width"} fallback="Maximize2" className="size-4" aria-hidden="true"/>
  </button>;

  const controls=<div className="cw-controls">
    <div className="cw-heading"><h2 id={id+"-title"}>Chat width</h2><button type="button" className="cw-close" aria-label="Close chat width" onClick={()=>changeOpen(false)}>×</button></div>
    <fieldset className="cw-presets" disabled={!binding}>
      <legend className="cw-sr">Width preset</legend>
      {(["reading","wide","fill"] as const).map(mode=><label key={mode} className="cw-choice" data-checked={prefs.mode===mode}>
        <input type="radio" name={id+"-mode"} value={mode} checked={prefs.mode===mode} onChange={()=>{editing.current=false;state.select(mode);}}/>
        <span>{names[mode]}<small>{mode==="fill"?"Auto":prefs[mode]+" px"}</small></span>
      </label>)}
    </fieldset>
    {adjustable&&<div className="cw-adjust">
      <div className="cw-value"><label htmlFor={id+"-number"}>Max width</label><div><input id={id+"-number"} type="number" inputMode="numeric" min={MIN_WIDTH} max={MAX_WIDTH} step={1}
        value={draft} disabled={!binding} aria-invalid={invalid} aria-describedby={id+"-hint"}
        onFocus={()=>{editing.current=true;}}
        onChange={e=>{setDraft(e.target.value);const value=e.target.valueAsNumber;if(isWidth(value))state.preview(value);}}
        onBlur={finish} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();finish();}}}/><span>px</span></div></div>
      <label className="cw-sr" htmlFor={id+"-slider"}>Adjust {names[prefs.mode]} width</label>
      <input id={id+"-slider"} type="range" min={MIN_WIDTH} max={MAX_WIDTH} step={1} value={width??prefs.wide} disabled={!binding}
        onInput={e=>{editing.current=false;setDraft(e.currentTarget.value);state.preview(e.currentTarget.valueAsNumber);}}
        onPointerUp={()=>state.commit()} onKeyUp={()=>state.commit()} onBlur={()=>state.commit()}/>
      <div className="cw-scale"><span>{MIN_WIDTH} px</span><span>{MAX_WIDTH} px</span></div>
    </div>}
    <p className="cw-hint" id={id+"-hint"} aria-live="polite">
      {!binding?"This conversation layout is not supported. bb's layout is unchanged.":
        adjustable&&invalid?"Enter a whole number from "+MIN_WIDTH+" to "+MAX_WIDTH+" px.":
        snapshot.persistence==="unavailable"?"Not saved on this device. Changes work for this session.":
        prefs.mode==="fill"?"Uses the available pane width. Your saved presets are kept.":
        prefs.mode==="native"?"Using bb's layout. Your saved presets are kept.":
        available>0&&width!==null&&width>available?"Fits this pane · "+width+" px stays saved.":
        "Remembered for "+names[prefs.mode]+" on this device."}
    </p>
    <button type="button" className="cw-native" aria-pressed={prefs.mode==="native"} onClick={()=>{editing.current=false;state.cancel();state.select("native");}}>Use bb default</button>
  </div>;

  if(isCompactViewport) return <><span className="cw-root">{React.cloneElement(button,{"aria-expanded":open,"aria-haspopup":"dialog",onClick:()=>changeOpen(!open)})}</span>
    <ResponsiveDrawerShell open={open} onOpenChange={changeOpen} labelledBy={id+"-title"} contentClassName="cw-mobile" onAfterCloseAutoFocus={()=>trigger.current?.focus()}>{controls}</ResponsiveDrawerShell></>;
  return <span className="cw-root"><Popover.Root open={open} onOpenChange={changeOpen}>
    <Popover.Trigger asChild>{button}</Popover.Trigger>
    <Popover.Portal><Popover.Content {...scope} className="cw-popover" align="end" sideOffset={8} collisionPadding={12} aria-labelledby={id+"-title"}>
      {controls}
    </Popover.Content></Popover.Portal>
  </Popover.Root></span>;
}

export default definePluginApp(app=>{
  app.contentScripts.register({id:"width-lifecycle",mount({pluginId}){
    getStore(pluginId);
    return ()=>{disposeLayouts();store?.dispose();store=undefined;};
  }});
  app.slots.experimental_threadHeaderAction({id:"width",title:"Chat width",component:WidthControl});
});
