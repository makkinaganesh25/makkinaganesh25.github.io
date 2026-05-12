import type { ProfileSlug } from "../data/portfolioData";

export function getProfileHomePath(profileSlug: ProfileSlug) {
  return `/${profileSlug}`;
}

export function getProfileProjectPath(profileSlug: ProfileSlug, projectId: string) {
  return `/${profileSlug}/project/${projectId}`;
}

export function getProfileHashPath(profileSlug: ProfileSlug, sectionId: string) {
  const normalizedSectionId = sectionId.startsWith("#") ? sectionId : `#${sectionId}`;
  return `${getProfileHomePath(profileSlug)}${normalizedSectionId}`;
}
