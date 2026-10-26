import {experimental_scanPublicSdkOnly as scan} from "@get-bb/plugin-sdk/testing";

// Exact public UI packages used by the plugin and its version-matched primitives.
const allow=[/^react(?:-dom)?$/, /^@radix-ui\/react-(?:popover|slot)$/, /^(?:clsx|tailwind-merge)$/, /^vitest\/config$/];
const result=scan(process.cwd(),{allow});
// The scanner otherwise reserves /testing imports for test files. Only this
// validation command may consume that tooling API outside a test file.
result.violations=result.violations.filter(v=>!(v.file==="scripts/check-sdk.mjs"&&v.specifier==="@get-bb/plugin-sdk/testing"&&v.reason==="outside-allowlist"));
console.log(JSON.stringify(result));
if(result.violations.length || result.privateDependencies.length)process.exitCode=1;
