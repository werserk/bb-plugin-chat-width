import {expect,it,vi} from "vitest";
it("does not attach ambient document listeners when the overlay helpers load",async()=>{
 vi.resetModules();
 const add=vi.spyOn(document,"addEventListener");
 try {
  await import("./components/ui/overlay-trigger");
  expect(add.mock.calls.filter(([event])=>event==="keydown"||event==="pointerdown")).toHaveLength(0);
 } finally {add.mockRestore();}
});
