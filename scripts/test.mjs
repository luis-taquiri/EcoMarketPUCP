import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const dir = mkdtempSync(path.join(os.tmpdir(), "ecomarket-tests-"));
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}`,
};
function run(args) {
  const r = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`Falló: ${args.join(" ")}`);
}
try {
  run(["--import", "tsx", "scripts/init-db.ts"]);
  run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  run(["--import", "tsx", "--test", "tests/validation.test.ts", "tests/trades.test.ts"]);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (path.dirname(dir) === os.tmpdir() && path.basename(dir).startsWith("ecomarket-tests-"))
    rmSync(dir, { recursive: true, force: true });
}
