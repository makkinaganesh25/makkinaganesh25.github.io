import { isProfileSlug, type ProfileSlug } from "../data/portfolioData";

const HOME_SCROLL_SNAPSHOT_KEY_PREFIX = "portfolio-home-scroll-snapshot:";
const PENDING_HOME_RESTORE_KEY_PREFIX = "portfolio-home-restore-pending:";

export type HomeScrollMode = "canvas" | "dom";
export type DetailEntryRouteKind = "home" | "detail";
export type HomeRestoreReason = "detail-back" | "detail-home-nav" | "detail-projects-nav" | "pop";

export interface HomeScrollSnapshot {
  profileSlug: ProfileSlug;
  mode: HomeScrollMode;
  scrollTop: number;
  sourceProjectId: string;
  timestamp: number;
}

export interface PendingHomeRestore {
  profileSlug: ProfileSlug;
  sourceProjectId?: string;
  reason: HomeRestoreReason | "case-study-entry";
  requestedAt: number;
}

export interface CaseStudyEntryStatePayload {
  profileSlug: ProfileSlug;
  sourceProjectId: string;
  previousRouteKind: DetailEntryRouteKind;
  enteredAt: number;
}

export interface HomeRestoreStatePayload {
  profileSlug: ProfileSlug;
  sourceProjectId?: string;
  reason: HomeRestoreReason;
  requestedAt: number;
}

export interface PortfolioRouteState {
  portfolioCaseStudyEntry?: CaseStudyEntryStatePayload;
  portfolioHomeRestore?: HomeRestoreStatePayload;
}

function readSessionStorageValue(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorageValue(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and fall back to default navigation behavior.
  }
}

function removeSessionStorageValue(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures and fall back to default navigation behavior.
  }
}

function getSnapshotStorageKey(profileSlug: ProfileSlug) {
  return `${HOME_SCROLL_SNAPSHOT_KEY_PREFIX}${profileSlug}`;
}

function getPendingRestoreStorageKey(profileSlug: ProfileSlug) {
  return `${PENDING_HOME_RESTORE_KEY_PREFIX}${profileSlug}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getProfileSlugFromHomePath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return null;

  const candidate = parts[0];
  return isProfileSlug(candidate) ? candidate : null;
}

export function isProfileHomePath(pathname: string) {
  return getProfileSlugFromHomePath(pathname) !== null;
}

export function createCaseStudyEntryState(payload: Omit<CaseStudyEntryStatePayload, "enteredAt">): PortfolioRouteState {
  return {
    portfolioCaseStudyEntry: {
      ...payload,
      enteredAt: Date.now(),
    },
  };
}

export function getCaseStudyEntryState(value: unknown) {
  if (!isObject(value)) return null;

  const entry = value.portfolioCaseStudyEntry;
  if (!isObject(entry)) return null;
  const profileSlug = typeof entry.profileSlug === "string" ? entry.profileSlug : undefined;
  const sourceProjectId = entry.sourceProjectId;
  const previousRouteKind = entry.previousRouteKind;
  const enteredAt = entry.enteredAt;

  if (!isProfileSlug(profileSlug)) return null;
  if (typeof sourceProjectId !== "string") return null;
  if (previousRouteKind !== "home" && previousRouteKind !== "detail") return null;
  if (typeof enteredAt !== "number") return null;

  return {
    profileSlug,
    sourceProjectId,
    previousRouteKind,
    enteredAt,
  } satisfies CaseStudyEntryStatePayload;
}

export function createHomeRestoreState(payload: Omit<HomeRestoreStatePayload, "requestedAt">): PortfolioRouteState {
  return {
    portfolioHomeRestore: {
      ...payload,
      requestedAt: Date.now(),
    },
  };
}

export function getHomeRestoreState(value: unknown) {
  if (!isObject(value)) return null;

  const restoreState = value.portfolioHomeRestore;
  if (!isObject(restoreState)) return null;
  const profileSlug = typeof restoreState.profileSlug === "string" ? restoreState.profileSlug : undefined;
  const sourceProjectId = typeof restoreState.sourceProjectId === "string" ? restoreState.sourceProjectId : undefined;
  const reason = restoreState.reason;
  const requestedAt = restoreState.requestedAt;

  if (!isProfileSlug(profileSlug)) return null;
  if (restoreState.sourceProjectId !== undefined && typeof restoreState.sourceProjectId !== "string") return null;
  if (
    reason !== "detail-back" &&
    reason !== "detail-home-nav" &&
    reason !== "detail-projects-nav" &&
    reason !== "pop"
  ) {
    return null;
  }
  if (typeof requestedAt !== "number") return null;

  return {
    profileSlug,
    sourceProjectId,
    reason,
    requestedAt,
  } satisfies HomeRestoreStatePayload;
}

export function saveHomeScrollSnapshot(snapshot: HomeScrollSnapshot) {
  writeSessionStorageValue(getSnapshotStorageKey(snapshot.profileSlug), JSON.stringify(snapshot));
}

export function readHomeScrollSnapshot(profileSlug: ProfileSlug) {
  const rawValue = readSessionStorageValue(getSnapshotStorageKey(profileSlug));
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isObject(parsed)) return null;
    const profileSlug = typeof parsed.profileSlug === "string" ? parsed.profileSlug : undefined;
    const mode = parsed.mode;
    const scrollTop = parsed.scrollTop;
    const sourceProjectId = parsed.sourceProjectId;
    const timestamp = parsed.timestamp;

    if (!isProfileSlug(profileSlug)) return null;
    if (mode !== "canvas" && mode !== "dom") return null;
    if (typeof scrollTop !== "number") return null;
    if (typeof sourceProjectId !== "string") return null;
    if (typeof timestamp !== "number") return null;

    return {
      profileSlug,
      mode,
      scrollTop,
      sourceProjectId,
      timestamp,
    } satisfies HomeScrollSnapshot;
  } catch {
    return null;
  }
}

export function hasHomeScrollSnapshot(profileSlug: ProfileSlug) {
  return readHomeScrollSnapshot(profileSlug) !== null;
}

export function markPendingHomeRestore(restoreRequest: PendingHomeRestore) {
  writeSessionStorageValue(getPendingRestoreStorageKey(restoreRequest.profileSlug), JSON.stringify(restoreRequest));
}

export function readPendingHomeRestore(profileSlug: ProfileSlug) {
  const rawValue = readSessionStorageValue(getPendingRestoreStorageKey(profileSlug));
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isObject(parsed)) return null;
    const profileSlug = typeof parsed.profileSlug === "string" ? parsed.profileSlug : undefined;
    const sourceProjectId = typeof parsed.sourceProjectId === "string" ? parsed.sourceProjectId : undefined;
    const reason = parsed.reason;
    const requestedAt = parsed.requestedAt;

    if (!isProfileSlug(profileSlug)) return null;
    if (parsed.sourceProjectId !== undefined && typeof parsed.sourceProjectId !== "string") return null;
    if (
      reason !== "detail-back" &&
      reason !== "detail-home-nav" &&
      reason !== "detail-projects-nav" &&
      reason !== "case-study-entry" &&
      reason !== "pop"
    ) {
      return null;
    }
    if (typeof requestedAt !== "number") return null;

    return {
      profileSlug,
      sourceProjectId,
      reason,
      requestedAt,
    } satisfies PendingHomeRestore;
  } catch {
    return null;
  }
}

export function clearPendingHomeRestore(profileSlug: ProfileSlug) {
  removeSessionStorageValue(getPendingRestoreStorageKey(profileSlug));
}
