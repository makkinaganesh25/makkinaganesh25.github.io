import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defaultProfileSlug, portfolioProfiles, profileSlugs } from "../src/data/portfolioData";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(scriptDir, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");

function normalizeRoute(route: string) {
  return route.replace(/^\/+|\/+$/g, "");
}

async function ensureRouteEntry(route: string) {
  const normalizedRoute = normalizeRoute(route);

  if (!normalizedRoute) {
    return;
  }

  const routeDir = path.join(distDir, normalizedRoute);
  await mkdir(routeDir, { recursive: true });
  await copyFile(indexHtmlPath, path.join(routeDir, "index.html"));
}

async function main() {
  const routes = new Set<string>();

  for (const profileSlug of profileSlugs) {
    routes.add(profileSlug);

    for (const project of portfolioProfiles[profileSlug].projects) {
      routes.add(`${profileSlug}/project/${project.id}`);
    }
  }

  for (const project of portfolioProfiles[defaultProfileSlug].projects) {
    routes.add(`project/${project.id}`);
  }

  for (const route of routes) {
    await ensureRouteEntry(route);
  }

  await copyFile(indexHtmlPath, path.join(distDir, "404.html"));
  await writeFile(path.join(distDir, ".nojekyll"), "");

  console.log(`Generated ${routes.size} static GitHub Pages route entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
