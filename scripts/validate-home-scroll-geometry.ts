import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import { access, mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const footerBottomThresholdPx = 96;
const footerVisibilityThresholdPx = 48;

type ViewportCase = {
  name: string;
  width: number;
  height: number;
  mobile: boolean;
};

type CdpResponse<T = unknown> = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: T;
  error?: { message: string };
};

class DevToolsWebSocket {
  private buffer = Buffer.alloc(0);
  private readonly messageHandlers: Array<(message: string) => void> = [];

  private constructor(private readonly socket: net.Socket) {
    this.socket.on("data", (chunk) => this.readFrames(chunk));
  }

  static connect(webSocketUrl: string) {
    return new Promise<DevToolsWebSocket>((resolve, reject) => {
      const url = new URL(webSocketUrl);
      const socket = net.createConnection({
        host: url.hostname,
        port: Number(url.port || 80),
      });
      const key = randomBytes(16).toString("base64");
      const pathWithSearch = `${url.pathname}${url.search}`;
      let handshakeBuffer = Buffer.alloc(0);

      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Timed out connecting to Chrome DevTools."));
      }, 10_000);

      const fail = (error: Error) => {
        clearTimeout(timeout);
        socket.destroy();
        reject(error);
      };

      const onData = (chunk: Buffer) => {
        handshakeBuffer = Buffer.concat([handshakeBuffer, chunk]);
        const headerEnd = handshakeBuffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;

        const header = handshakeBuffer.subarray(0, headerEnd).toString("utf8");
        if (!header.startsWith("HTTP/1.1 101")) {
          fail(new Error(`Chrome DevTools websocket upgrade failed: ${header.split("\r\n")[0]}`));
          return;
        }

        clearTimeout(timeout);
        socket.off("data", onData);
        socket.off("error", fail);
        const connection = new DevToolsWebSocket(socket);
        const remaining = handshakeBuffer.subarray(headerEnd + 4);
        if (remaining.length > 0) {
          connection.readFrames(remaining);
        }
        resolve(connection);
      };

      socket.once("connect", () => {
        socket.write(
          [
            `GET ${pathWithSearch} HTTP/1.1`,
            `Host: ${url.host}`,
            "Upgrade: websocket",
            "Connection: Upgrade",
            "Sec-WebSocket-Version: 13",
            `Sec-WebSocket-Key: ${key}`,
            "\r\n",
          ].join("\r\n")
        );
      });
      socket.on("data", onData);
      socket.once("error", fail);
    });
  }

  onMessage(handler: (message: string) => void) {
    this.messageHandlers.push(handler);
  }

  send(message: string) {
    this.writeFrame(1, Buffer.from(message, "utf8"));
  }

  close() {
    this.writeFrame(8, Buffer.alloc(0));
    this.socket.end();
  }

  private writeFrame(opcode: number, payload: Buffer) {
    const payloadLength = payload.length;
    const extendedLength = Buffer.alloc(8);
    extendedLength.writeBigUInt64BE(BigInt(payloadLength));
    const lengthBytes =
      payloadLength < 126
        ? Buffer.from([0x80 | opcode, 0x80 | payloadLength])
        : payloadLength <= 0xffff
          ? Buffer.from([0x80 | opcode, 0x80 | 126, payloadLength >> 8, payloadLength & 0xff])
          : Buffer.concat([Buffer.from([0x80 | opcode, 0x80 | 127]), extendedLength]);
    const mask = randomBytes(4);
    const maskedPayload = Buffer.alloc(payloadLength);
    for (let index = 0; index < payloadLength; index += 1) {
      maskedPayload[index] = payload[index] ^ mask[index % 4];
    }

    this.socket.write(Buffer.concat([lengthBytes, mask, maskedPayload]));
  }

  private readFrames(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];
      const opcode = firstByte & 0x0f;
      const masked = Boolean(secondByte & 0x80);
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < offset + 2) return;
        payloadLength = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (this.buffer.length < offset + 8) return;
        const largeLength = this.buffer.readBigUInt64BE(offset);
        if (largeLength > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Chrome DevTools websocket frame is too large.");
        }
        payloadLength = Number(largeLength);
        offset += 8;
      }

      const maskOffset = offset;
      if (masked) offset += 4;
      if (this.buffer.length < offset + payloadLength) return;

      let payload = this.buffer.subarray(offset, offset + payloadLength);
      if (masked) {
        const mask = this.buffer.subarray(maskOffset, maskOffset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }

      this.buffer = this.buffer.subarray(offset + payloadLength);

      if (opcode === 1) {
        this.messageHandlers.forEach((handler) => handler(payload.toString("utf8")));
      } else if (opcode === 8) {
        this.socket.end();
      } else if (opcode === 9) {
        this.writeFrame(10, payload);
      }
    }
  }
}

type GeometryResult = {
  mode: "canvas" | "dom";
  url: string;
  viewportHeight: number;
  nativeScrollTop: number;
  nativeMaxScroll: number;
  contentBottom: number;
  footerVisiblePx: number;
  footerBottomGap: number;
  contactFooterGap: number | null;
  previousSiteVisible: boolean;
  scrollHtmlTransform?: string;
  fillHeight?: number;
  footerRect: {
    top: number;
    bottom: number;
    height: number;
  };
};

type HashLandingResult = {
  mode: "canvas" | "dom";
  url: string;
  viewportHeight: number;
  hash: string;
  nativeScrollTop: number;
  nativeMaxScroll: number;
  contentBottom: number;
  contactAnchorTop: number;
  footerTop: number;
  clearance: number;
  previousSiteVisible: boolean;
};

const routes = ["/softwareengineer#contact", "/dataengineer#contact"];
const profiles = ["softwareengineer", "dataengineer"];
const viewports: ViewportCase[] = [
  { name: "desktop", width: 1280, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFreePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not allocate a local port.")));
        return;
      }

      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url: string, processToCheck: ChildProcessWithoutNullStreams, label: string) {
  const startedAt = Date.now();
  let lastError: unknown = null;

  while (Date.now() - startedAt < 20_000) {
    if (processToCheck.exitCode !== null) {
      throw new Error(`${label} exited before becoming ready.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await wait(150);
  }

  throw new Error(`${label} did not become ready at ${url}. Last error: ${String(lastError)}`);
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known browser path.
    }
  }

  throw new Error("Could not find Chrome/Chromium. Set CHROME_BIN to run the rendered homepage scroll regression.");
}

function startVite(port: number) {
  const viteBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
  return spawn(viteBin, ["--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: rootDir,
    env: { ...process.env, DISABLE_HMR: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function stopProcess(processToStop: ChildProcessWithoutNullStreams) {
  if (processToStop.exitCode !== null) return;

  processToStop.kill();
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2_000);
    processToStop.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function removeDirectoryWithRetry(directory: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      await wait(150 * (attempt + 1));
    }
  }

  throw lastError;
}

async function startChrome(debugPort: number, userDataDir: string) {
  const chrome = await findChromeExecutable();
  return spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--no-sandbox",
      "--use-angle=swiftshader",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
}

class CdpClient {
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private eventWaiters = new Map<string, Array<(params: unknown) => void>>();

  private constructor(private readonly socket: DevToolsWebSocket) {
    this.socket.onMessage((data) => {
      const message = JSON.parse(data) as CdpResponse;
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (!pending) return;
        if (message.error) {
          pending.reject(new Error(message.error.message));
          return;
        }

        pending.resolve(message.result);
        return;
      }

      if (message.method) {
        const waiters = this.eventWaiters.get(message.method);
        if (!waiters || waiters.length === 0) return;
        this.eventWaiters.delete(message.method);
        waiters.forEach((resolve) => resolve(message.params));
      }
    });
  }

  static connect(webSocketUrl: string) {
    return DevToolsWebSocket.connect(webSocketUrl).then((socket) => new CdpClient(socket));
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method: string, timeoutMs: number) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}.`)), timeoutMs);
      const waiters = this.eventWaiters.get(method) ?? [];
      waiters.push((params) => {
        clearTimeout(timeout);
        resolve(params);
      });
      this.eventWaiters.set(method, waiters);
    });
  }

  close() {
    this.socket.close();
  }
}

async function createPageClient(debugPort: number) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" });
  assert(response.ok, `Could not create a Chrome DevTools page: ${response.status}`);
  const target = (await response.json()) as { webSocketDebuggerUrl?: string };
  assert(target.webSocketDebuggerUrl, "Chrome DevTools target did not expose a websocket URL.");
  return CdpClient.connect(target.webSocketDebuggerUrl);
}

async function evaluate<T>(client: CdpClient, expression: string) {
  const result = await client.send<{
    result?: { value?: T };
    exceptionDetails?: { text?: string; exception?: { description?: string } };
  }>("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "Runtime evaluation failed.");
  }

  return result.result?.value as T;
}

async function waitForAppReady(client: CdpClient) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 20_000) {
    const ready = await evaluate<boolean>(
      client,
      `(() => {
        const canvas = document.querySelector("canvas");
        const footer = document.querySelector('[data-home-scroll-section="footer"]');
        const parent = canvas?.parentElement;
        const scrollViewport = parent
          ? Array.from(parent.children).find((child) => {
              if (!(child instanceof HTMLElement)) return false;
              const style = window.getComputedStyle(child);
              return style.overflowY === "auto" && child.scrollHeight > child.clientHeight;
            })
          : null;
        return Boolean(canvas && footer && scrollViewport);
      })()`
    );

    if (ready) return;
    await wait(200);
  }

  throw new Error("Homepage ScrollControls did not become ready for geometry validation.");
}

async function waitForScrollRangeReady(client: CdpClient) {
  const startedAt = Date.now();
  let lastMetrics: unknown = null;

  while (Date.now() - startedAt < 10_000) {
    const metrics = await evaluate<{
      ready: boolean;
      nativeMaxScroll: number;
      contentBottom: number;
    }>(
      client,
      `(() => {
        const canvas = document.querySelector("canvas");
        const parent = canvas?.parentElement;
        const scrollViewport = parent
          ? Array.from(parent.children).find((child) => {
              if (!(child instanceof HTMLElement)) return false;
              const style = window.getComputedStyle(child);
              return style.overflowY === "auto" && child.scrollHeight > child.clientHeight;
            })
          : null;
        const sections = Array.from(document.querySelectorAll('[data-home-scroll-section]')).filter((section) => section instanceof HTMLElement);
        const contentBottom = sections.reduce((total, section) => Math.max(total, section.offsetTop + section.offsetHeight), 0);
        const nativeMaxScroll = scrollViewport instanceof HTMLElement ? scrollViewport.scrollHeight - scrollViewport.clientHeight : 0;
        return {
          ready: nativeMaxScroll > 0 && contentBottom > 0 && Math.abs(nativeMaxScroll - contentBottom) <= 4,
          nativeMaxScroll,
          contentBottom
        };
      })()`
    );

    lastMetrics = metrics;
    if (metrics.ready) return;
    await wait(250);
  }

  throw new Error(`Homepage ScrollControls range did not settle to the measured footer bottom. ${JSON.stringify(lastMetrics)}`);
}

async function readGeometry(client: CdpClient) {
  return evaluate<GeometryResult>(
    client,
    `(() => {
      const getScrollViewport = () => {
        const canvas = document.querySelector("canvas");
        const parent = canvas?.parentElement;
        if (!parent) return null;

        return Array.from(parent.children).find((child) => {
          if (!(child instanceof HTMLElement)) return false;
          const style = window.getComputedStyle(child);
          return style.overflowY === "auto" && child.scrollHeight > child.clientHeight;
        }) ?? null;
      };

      const scrollViewport = getScrollViewport();
      const scroller = scrollViewport ?? document.scrollingElement;
      const footer = document.querySelector('[data-home-scroll-section="footer"]');
      const contact = document.querySelector('[data-home-scroll-section="contact"]');

      if (!(scroller instanceof HTMLElement) || !(footer instanceof HTMLElement)) {
        return {
          mode: scrollViewport ? "canvas" : "dom",
          url: window.location.href,
          viewportHeight: window.innerHeight,
          nativeScrollTop: 0,
          nativeMaxScroll: 0,
          contentBottom: 0,
          footerVisiblePx: 0,
          footerBottomGap: window.innerHeight,
          contactFooterGap: null,
          previousSiteVisible: document.body.innerText.includes("Previous Site"),
          scrollHtmlTransform: undefined,
          fillHeight: undefined,
          footerRect: { top: 0, bottom: 0, height: 0 }
        };
      }

      const footerRect = footer.getBoundingClientRect();
      const sections = Array.from(document.querySelectorAll('[data-home-scroll-section]')).filter((section) => section instanceof HTMLElement);
      const contentBottom = sections.reduce((total, section) => Math.max(total, section.offsetTop + section.offsetHeight), 0);
      const viewportHeight = window.innerHeight;
      const footerVisiblePx = Math.max(0, Math.min(footerRect.bottom, viewportHeight) - Math.max(footerRect.top, 0));

      return {
        mode: scrollViewport ? "canvas" : "dom",
        url: window.location.href,
        viewportHeight,
        nativeScrollTop: scroller.scrollTop,
        nativeMaxScroll: scroller.scrollHeight - scroller.clientHeight,
        contentBottom,
        footerVisiblePx,
        footerBottomGap: viewportHeight - footerRect.bottom,
        contactFooterGap: contact instanceof HTMLElement ? footer.offsetTop - (contact.offsetTop + contact.offsetHeight) : null,
        previousSiteVisible: document.body.innerText.includes("Previous Site"),
        scrollHtmlTransform: scrollViewport?.firstElementChild?.firstElementChild instanceof HTMLElement
          ? scrollViewport.firstElementChild.firstElementChild.style.transform
          : undefined,
        fillHeight: scrollViewport?.lastElementChild instanceof HTMLElement ? scrollViewport.lastElementChild.getBoundingClientRect().height : undefined,
        footerRect: {
          top: footerRect.top,
          bottom: footerRect.bottom,
          height: footerRect.height
        }
      };
    })()`
  );
}

async function readHashLanding(client: CdpClient) {
  return evaluate<HashLandingResult>(
    client,
    `(() => {
      const canvas = document.querySelector("canvas");
      const parent = canvas?.parentElement;
      const scrollViewport = parent
        ? Array.from(parent.children).find((child) => {
            if (!(child instanceof HTMLElement)) return false;
            const style = window.getComputedStyle(child);
            return style.overflowY === "auto" && child.scrollHeight > child.clientHeight;
          })
        : null;
      const scroller = scrollViewport ?? document.scrollingElement;
      const contact = document.querySelector('[data-home-scroll-section="contact"]');
      const contactAnchor = document.querySelector('[data-home-nav-anchor="contact"]') ?? contact;
      const footer = document.querySelector('[data-home-scroll-section="footer"]');
      const navbar = document.querySelector('[data-site-navbar]');
      const clearance = navbar instanceof HTMLElement ? navbar.getBoundingClientRect().height + 24 : 112;
      const sections = Array.from(document.querySelectorAll('[data-home-scroll-section]')).filter((section) => section instanceof HTMLElement);
      const contentBottom = sections.reduce((total, section) => Math.max(total, section.offsetTop + section.offsetHeight), 0);

      return {
        mode: scrollViewport ? "canvas" : "dom",
        url: window.location.href,
        viewportHeight: window.innerHeight,
        hash: window.location.hash,
        nativeScrollTop: scroller instanceof HTMLElement ? scroller.scrollTop : 0,
        nativeMaxScroll: scroller instanceof HTMLElement ? scroller.scrollHeight - scroller.clientHeight : 0,
        contentBottom,
        contactAnchorTop: contactAnchor instanceof HTMLElement ? contactAnchor.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
        footerTop: footer instanceof HTMLElement ? footer.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
        clearance,
        previousSiteVisible: document.body.innerText.includes("Previous Site")
      };
    })()`
  );
}

async function waitForHashLanding(client: CdpClient) {
  const startedAt = Date.now();
  let lastResult = await readHashLanding(client);

  while (Date.now() - startedAt < 12_000) {
    if (isHashLandingSettled(lastResult)) {
      return lastResult;
    }

    await wait(250);
    lastResult = await readHashLanding(client);
  }

  return lastResult;
}

function isHashLandingSettled(result: HashLandingResult) {
  const directAnchorLanding = Math.abs(result.contactAnchorTop - result.clearance) <= 48;
  const clampedAtFooterEnd =
    result.nativeMaxScroll - result.nativeScrollTop <= 2 &&
    result.contactAnchorTop >= result.clearance - 24 &&
    result.contactAnchorTop <= Math.min(result.viewportHeight * 0.45, result.clearance + 220) &&
    result.footerTop > result.contactAnchorTop &&
    result.footerTop < result.viewportHeight;

  return directAnchorLanding || clampedAtFooterEnd;
}

async function dispatchScrollViewportEvent(client: CdpClient) {
  await evaluate<boolean>(
    client,
    `(() => {
      const canvas = document.querySelector("canvas");
      const parent = canvas?.parentElement;
      const scrollViewport = parent
        ? Array.from(parent.children).find((child) => {
            if (!(child instanceof HTMLElement)) return false;
            const style = window.getComputedStyle(child);
            return style.overflowY === "auto" && child.scrollHeight > child.clientHeight;
          })
        : null;
      if (!(scrollViewport instanceof HTMLElement)) return false;
      scrollViewport.dispatchEvent(new Event("scroll", { bubbles: true }));
      return true;
    })()`
  );
}

async function navigateAndMeasure(client: CdpClient, url: string, viewport: ViewportCase) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  const load = client.waitForEvent("Page.loadEventFired", 5_000).catch(() => null);
  await client.send("Page.navigate", { url });
  await load;
  await waitForAppReady(client);
  await waitForScrollRangeReady(client);
  await client.send("Page.bringToFront");

  const hashLanding = await waitForHashLanding(client);
  assertHashLanding(hashLanding, url, viewport);

  for (let index = 0; index < 16; index += 1) {
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: Math.round(viewport.width / 2),
      y: Math.round(viewport.height / 2),
      deltaX: 0,
      deltaY: 2200,
    });
    await wait(35);
  }

  await dispatchScrollViewportEvent(client);

  let lastResult = await readGeometry(client);
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    if (
      lastResult.nativeMaxScroll - lastResult.nativeScrollTop <= 2 &&
      lastResult.footerVisiblePx >= footerVisibilityThresholdPx &&
      Math.abs(lastResult.footerBottomGap) <= footerBottomThresholdPx
    ) {
      return lastResult;
    }

    await wait(500);
    lastResult = await readGeometry(client);
  }

  return lastResult;
}

async function navigateClickLetsTalkAndAssert(client: CdpClient, baseUrl: string, profile: string, viewport: ViewportCase) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  const url = `${baseUrl}/${profile}`;
  const load = client.waitForEvent("Page.loadEventFired", 5_000).catch(() => null);
  await client.send("Page.navigate", { url });
  await load;
  await waitForAppReady(client);
  await waitForScrollRangeReady(client);

  const clicked = await evaluate<boolean>(
    client,
    `(() => {
      const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
        candidate.textContent?.trim() === "Let's Talk"
      );
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );

  assert(clicked, `${url}: could not find and click the Let's Talk button.`);

  const hashLanding = await waitForHashLanding(client);
  assertHashLanding(hashLanding, `${url} Let's Talk`, viewport, false);
}

function assertGeometry(result: GeometryResult, route: string, viewport: ViewportCase) {
  const label = `${route} (${viewport.name})`;
  const diagnostics = JSON.stringify(result);
  assert(result.mode === "canvas", `${label}: expected canvas ScrollControls mode, got ${result.mode}. ${diagnostics}`);
  assert(!result.previousSiteVisible, `${label}: visible Previous Site label must not return. ${diagnostics}`);
  assert(result.nativeMaxScroll - result.nativeScrollTop <= 2, `${label}: test did not reach max scroll. ${diagnostics}`);
  assert(result.footerVisiblePx >= footerVisibilityThresholdPx, `${label}: footer is not visible at max scroll. ${diagnostics}`);
  assert(
    Math.abs(result.footerBottomGap) <= footerBottomThresholdPx,
    `${label}: footer bottom is ${Math.round(result.footerBottomGap)}px from the viewport bottom. ${diagnostics}`
  );
  assert(
    result.contactFooterGap !== null && Math.abs(result.contactFooterGap) <= 2,
    `${label}: contact must flow directly into footer; measured gap ${result.contactFooterGap}px. ${diagnostics}`
  );
}

function assertHashLanding(result: HashLandingResult, url: string, viewport: ViewportCase, requireHash = true) {
  const label = `${url} (${viewport.name})`;
  const diagnostics = JSON.stringify(result);
  assert(result.mode === "canvas", `${label}: expected canvas ScrollControls mode for hash landing, got ${result.mode}. ${diagnostics}`);
  if (requireHash) {
    assert(result.hash === "#contact", `${label}: expected #contact hash, got ${result.hash}. ${diagnostics}`);
  }
  assert(!result.previousSiteVisible, `${label}: visible Previous Site label must not return during hash landing. ${diagnostics}`);
  assert(isHashLandingSettled(result), `${label}: #contact did not land below the navbar or cleanly clamp at the footer end. ${diagnostics}`);
  assert(
    result.footerTop > result.contactAnchorTop,
    `${label}: footer should remain after the contact section when hash landing. ${diagnostics}`
  );
}

async function main() {
  const appPort = await findFreePort();
  const debugPort = await findFreePort();
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "portfolio-scroll-chrome-"));
  const vite = startVite(appPort);
  const chrome = await startChrome(debugPort, userDataDir);
  let client: CdpClient | null = null;

  try {
    await Promise.all([
      waitForHttp(`http://127.0.0.1:${appPort}/softwareengineer`, vite, "Vite dev server"),
      waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, chrome, "Chrome DevTools"),
    ]);

    client = await createPageClient(debugPort);

    for (const route of routes) {
      for (const viewport of viewports) {
        const result = await navigateAndMeasure(client, `http://127.0.0.1:${appPort}${route}`, viewport);
        assertGeometry(result, route, viewport);
      }
    }

    for (const profile of profiles) {
      await navigateClickLetsTalkAndAssert(client, `http://127.0.0.1:${appPort}`, profile, viewports[0]);
    }

    console.log("Rendered homepage scroll geometry checks passed.");
  } finally {
    client?.close();
    await Promise.all([stopProcess(chrome), stopProcess(vite)]);
    await removeDirectoryWithRetry(userDataDir);
  }
}

await main();
