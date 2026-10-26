import {defineConfig} from "vitest/config";
export default defineConfig({test:{environment:"jsdom",include:["*.test.ts","*.test.tsx"],testTimeout:5000}});
