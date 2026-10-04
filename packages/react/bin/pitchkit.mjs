#!/usr/bin/env node
// The package's only bin, so `npx @pitchkit/react skills install` resolves to
// it despite the bin name not matching the (scoped) package name.
import { CliError, run } from "./install-skill.mjs";

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error) {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
