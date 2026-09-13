/* ==========================================================================
   TOSS CLUB — Dev server
   --------------------------------------------------------------------------
   Starts the static server, waits until it is actually answering, and only
   then opens Chrome on it. The wait is the point: launching the browser at
   the same time as the server reliably lands on a connection-refused page
   and makes you refresh by hand.

   No dependencies. http-server is fetched through npx on demand, and the
   browser is launched with the platform's own opener.
   ========================================================================== */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { platform, env } from "node:process";

const PORT = Number(env.PORT) || 8777;
const URL_ = `http://127.0.0.1:${PORT}/`;

/* --------------------------------------------------------------------------
   The server
   -------------------------------------------------------------------------- */

/* npx resolves to npx.cmd on Windows, which is a batch file and so has to be
   run through the shell. */
const server = spawn(
  "npx",
  ["--yes", "http-server", "-p", String(PORT), "-c-1", "."],
  { stdio: "inherit", shell: true }
);

server.on("exit", (code) => process.exit(code ?? 0));

/* Ctrl+C should take the server down with us rather than orphan it. */
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill();
    process.exit(0);
  });
}

/* --------------------------------------------------------------------------
   Wait for it to answer
   -------------------------------------------------------------------------- */

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(URL_, { method: "HEAD" });
      if (res.ok) return true;
    } catch {
      /* Not up yet. npx may still be fetching http-server on a cold cache. */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

/* --------------------------------------------------------------------------
   Chrome
   -------------------------------------------------------------------------- */

function chromePath() {
  if (platform !== "win32") return null;
  const candidates = [
    `${env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
  ];
  return candidates.find((p) => p && existsSync(p)) || null;
}

function openBrowser() {
  const chrome = chromePath();

  if (chrome) {
    spawn(chrome, [URL_], { detached: true, stdio: "ignore" }).unref();
    return "Chrome";
  }

  /* Chrome is not where it usually lives — hand the URL to whatever the
     machine considers its browser rather than failing to open anything. */
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", URL_], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [URL_], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [URL_], { detached: true, stdio: "ignore" }).unref();
  }
  return "the default browser";
}

const up = await waitForServer();

if (up) {
  const which = openBrowser();
  console.log(`\nToss Club is at ${URL_} — opening in ${which}. Ctrl+C to stop.\n`);
} else {
  console.log(`\nThe server did not answer on ${URL_}. It may still be starting; open that address by hand.\n`);
}
