/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { ChevronDown, Mail, Linkedin, Github, MapPin, FileText } from "lucide-react";
import { defaultProfileSlug, isProfileSlug, portfolioProfiles, type PortfolioData } from "../data/portfolioData";
import { defaultHomeSceneRanges, type HomeSceneRanges, type SectionRange } from "../data/homeSceneData";
import { SceneLights } from "../components/3d/Common";
import { StoryScene } from "../components/3d/StoryScene";
import { Layout, Footer } from "../components/Layout";
import { SkillsGrid, ExperienceTimeline, ProjectTree, EducationGrid } from "../components/HomeSections";
import { ScrollRevealTile, type ScrollRevealTone } from "../components/HomeMotion";
import { useLocation, useNavigate, useNavigationType, useParams, Navigate } from "react-router-dom";
import { Component, useEffect, useMemo, useState, useRef, type ErrorInfo, type ReactNode, type RefObject } from "react";
import { useIsPresent, useMotionValue } from "motion/react";
import { getEmailComposeUrl } from "../utils/contact";
import { withBasePath } from "../utils/publicAsset";
import { getProfileHomePath, getProfileProjectPath } from "../utils/profileRoutes";
import {
  clearPendingHomeRestore,
  createCaseStudyEntryState,
  getHomeRestoreState,
  markPendingHomeRestore,
  readHomeScrollSnapshot,
  readPendingHomeRestore,
  saveHomeScrollSnapshot,
  type HomeScrollMode,
} from "../utils/homeScrollState";

const HOME_SCROLL_SECTION_ORDER = ["hero", "about", "skills", "projects", "experience", "education", "contact", "footer"] as const;
type HomeScrollSectionName = (typeof HOME_SCROLL_SECTION_ORDER)[number];
const HOME_HASH_SECTION_IDS = ["projects", "experience", "education", "contact"] as const;
type HomeHashSectionId = (typeof HOME_HASH_SECTION_IDS)[number];
const HOME_SCROLL_SECTION_SELECTOR = ":scope > [data-home-scroll-section]";
const HOME_NAV_ANCHOR_BUFFER_PX = 18;
// Let final hash targets clamp to the footer end instead of waiting for impossible overscroll.
const HOME_HASH_END_CLAMP_TOLERANCE_PX = 192;
export const HOME_NAV_SCROLL_REQUEST_EVENT = "portfolio-home-nav-request";

type NavigatorPerformanceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
  };
};

function isHomeHashSectionId(value: string): value is HomeHashSectionId {
  return HOME_HASH_SECTION_IDS.includes(value as HomeHashSectionId);
}

function getHomeHashSectionId(hash: string) {
  const normalizedHash = hash.replace(/^#/, "");
  return isHomeHashSectionId(normalizedHash) ? normalizedHash : null;
}

function getHomeScrollSections(element: HTMLElement) {
  return Array.from(element.querySelectorAll<HTMLElement>(HOME_SCROLL_SECTION_SELECTOR));
}

function getHomeScrollSectionNames(element: HTMLElement) {
  return getHomeScrollSections(element)
    .map((section) => section.dataset.homeScrollSection)
    .filter((section): section is HomeScrollSectionName => HOME_SCROLL_SECTION_ORDER.includes(section as HomeScrollSectionName));
}

function getMeasuredHomeContentHeight(element: HTMLElement) {
  const measuredHeight = getHomeScrollSections(element).reduce((total, section) => {
    if (!(section instanceof HTMLElement)) return total;
    return Math.max(total, section.offsetTop + section.offsetHeight);
  }, 0);

  return measuredHeight > 0 ? measuredHeight : element.scrollHeight;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getCanvasNativeMaxScroll(scrollViewport: HTMLDivElement) {
  return Math.max(1, scrollViewport.scrollHeight - scrollViewport.clientHeight);
}

function getCanvasVisualScrollRange(pages: number, viewportHeight: number) {
  return Math.max(0, (pages - 1) * viewportHeight);
}

function getCanvasNativeScrollTopForVisualTop(visualTop: number, pages: number, scrollViewport: HTMLDivElement) {
  const viewportHeight = scrollViewport.clientHeight || window.innerHeight || 1;
  const nativeMaxScroll = getCanvasNativeMaxScroll(scrollViewport);
  const visualMaxScroll = getCanvasVisualScrollRange(pages, viewportHeight);
  if (visualMaxScroll <= 0) return 1;

  const normalizedTarget = clamp01(visualTop / visualMaxScroll);
  return Math.max(1, Math.min(nativeMaxScroll, normalizedTarget * nativeMaxScroll));
}

function getCanvasVisualTopForNativeScroll(nativeTop: number, pages: number, scrollViewport: HTMLDivElement) {
  const viewportHeight = scrollViewport.clientHeight || window.innerHeight || 1;
  const nativeMaxScroll = getCanvasNativeMaxScroll(scrollViewport);
  const visualMaxScroll = getCanvasVisualScrollRange(pages, viewportHeight);
  if (visualMaxScroll <= 0) return 0;

  return clamp01(nativeTop / nativeMaxScroll) * visualMaxScroll;
}

function getElementOffsetTopWithinContainer(element: HTMLElement, container: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current && current !== container) {
    top += current.offsetTop;
    const parent = current.offsetParent;
    if (!(parent instanceof HTMLElement) || !container.contains(parent)) {
      return element.getBoundingClientRect().top - container.getBoundingClientRect().top;
    }
    current = parent;
  }

  return top;
}

function SectionNavAnchor({ sectionId }: { sectionId: HomeHashSectionId }) {
  return <div aria-hidden data-home-nav-anchor={sectionId} className="pointer-events-none h-0 w-full" />;
}

type ScrollViewportState = {
  el: HTMLDivElement;
  fixed: HTMLDivElement;
  horizontal: boolean | undefined;
  pages: number;
  offset: number;
  delta: number;
  scroll?: { current: number };
};

function getHomeAnchorTopWithinContainer(anchor: HTMLElement, container: HTMLElement) {
  const ownerSection = anchor.closest<HTMLElement>("[data-home-scroll-section]");
  if (ownerSection && container.contains(ownerSection)) {
    const anchorDeltaWithinSection = anchor.getBoundingClientRect().top - ownerSection.getBoundingClientRect().top;
    return ownerSection.offsetTop + anchorDeltaWithinSection;
  }

  if (container.contains(anchor)) {
    return anchor.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }

  return null;
}

function measureSceneSectionRange(
  container: HTMLElement,
  maxVisualScroll: number,
  viewportHeight: number,
  sectionName: "projects" | "experience" | "education" | "contact",
  fallback: SectionRange
) {
  const section = container.querySelector<HTMLElement>(`[data-home-scroll-section="${sectionName}"]`);
  if (!section) return fallback;
  const sceneTarget =
    sectionName === "education"
      ? container.querySelector<HTMLElement>('[data-home-scene-anchor="rutgers-education"]') ?? section
      : sectionName === "contact"
        ? container.querySelector<HTMLElement>('[data-home-scene-anchor="contact-panel"]') ?? section
      : section;

  const maxScroll = Math.max(1, maxVisualScroll);
  const targetTop = sceneTarget === section ? section.offsetTop : getElementOffsetTopWithinContainer(sceneTarget, container);
  const targetHeight = sceneTarget.offsetHeight;
  const startPx =
    sectionName === "education" && sceneTarget !== section
      ? targetTop - viewportHeight * 1.05
      : sectionName === "contact" && sceneTarget !== section
        ? targetTop + viewportHeight * 0.08
      : targetTop;
  const endPx =
    sectionName === "education" && sceneTarget !== section
      ? targetTop + targetHeight * 0.72
      : sectionName === "contact" && sceneTarget !== section
        ? targetTop + targetHeight * 0.9
      : targetTop + targetHeight;
  const start = clamp01(startPx / maxScroll);
  const end = clamp01(endPx / maxScroll);

  if (end <= start) return fallback;
  return { start, end };
}

function measureHomeSceneRanges(container: HTMLElement, scrollViewport: HTMLDivElement, pages: number): HomeSceneRanges {
  const viewportHeight = scrollViewport.clientHeight || window.innerHeight || 1;
  const maxVisualScroll = getCanvasVisualScrollRange(pages, viewportHeight);

  return {
    projects: measureSceneSectionRange(container, maxVisualScroll, viewportHeight, "projects", defaultHomeSceneRanges.projects),
    experience: measureSceneSectionRange(container, maxVisualScroll, viewportHeight, "experience", defaultHomeSceneRanges.experience),
    education: measureSceneSectionRange(container, maxVisualScroll, viewportHeight, "education", defaultHomeSceneRanges.education),
    contact: measureSceneSectionRange(container, maxVisualScroll, viewportHeight, "contact", defaultHomeSceneRanges.contact),
  };
}

function canCreateWebGLContext() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return true;
  }

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
    };

    const context =
      canvas.getContext("webgl2", attributes) ||
      canvas.getContext("webgl", attributes) ||
      canvas.getContext("experimental-webgl", attributes);

    if (!context) {
      return false;
    }

    const glContext = context as WebGL2RenderingContext | WebGLRenderingContext;
    const loseContext = glContext.getExtension?.("WEBGL_lose_context");
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function isWebGLFailureMessage(message: string | undefined) {
  if (!message) return false;
  return /webgl context|webglrenderer|error creating webgl context/i.test(message);
}

function readLitePerformanceMode() {
  if (typeof window === "undefined") return false;

  const nav = navigator as NavigatorPerformanceHints;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const saveData = Boolean(nav.connection?.saveData);

  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 1100px)").matches ||
    lowMemory ||
    lowCpu ||
    saveData
  );
}

function useLitePerformanceMode() {
  const [isLitePerformanceMode, setIsLitePerformanceMode] = useState(readLitePerformanceMode);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactViewportQuery = window.matchMedia("(max-width: 1100px)");

    const syncPerformanceMode = () => {
      setIsLitePerformanceMode(readLitePerformanceMode());
    };

    syncPerformanceMode();
    reducedMotionQuery.addEventListener("change", syncPerformanceMode);
    compactViewportQuery.addEventListener("change", syncPerformanceMode);

    return () => {
      reducedMotionQuery.removeEventListener("change", syncPerformanceMode);
      compactViewportQuery.removeEventListener("change", syncPerformanceMode);
    };
  }, []);

  return isLitePerformanceMode;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function AnimatedSectionIntro({
  children,
  className,
  motionViewportRoot,
  tone = "emerald",
}: {
  children: ReactNode;
  className: string;
  motionViewportRoot?: RefObject<Element | null>;
  tone?: ScrollRevealTone;
}) {
  return (
    <ScrollRevealTile
      variant="panel"
      tone={tone}
      viewportRoot={motionViewportRoot}
      className={className}
    >
      {children}
    </ScrollRevealTile>
  );
}

function getHeroProofItems(portfolioData: PortfolioData) {
  const currentCompany = portfolioData.experience[0]?.company.replace(" Ratings", "") ?? "S&P Global";
  const hasShiftelixIos = portfolioData.projects.some(
    (project) => project.id === "shiftelix-workforce-os" && project.impactMetrics.some((metric) => metric.value === "iOS")
  );
  const hasRutgers = portfolioData.education.some((entry) => entry.school.includes("Rutgers"));
  const hasArmyInstitute = portfolioData.education.some((entry) => entry.school.includes("Army Institute"));
  const location = portfolioData.personal.location.includes("New York City")
    ? "NYC Metro Area"
    : portfolioData.personal.location;

  return [
    { label: "Current", value: currentCompany },
    { label: "Shipped", value: hasShiftelixIos ? "Shiftelix iOS" : "Shiftelix" },
    { label: "Graduate", value: hasRutgers ? "Rutgers MS" : "Rutgers" },
    { label: "CS", value: hasArmyInstitute ? "AIT CS" : "Computer Science" },
    { label: "Base", value: location },
  ];
}

function HomeScrollContent({
  canvasMode,
  portfolioData,
  containerRef,
  heroSectionRef,
  heroPortraitRef,
  onProjectSelect,
  onScrollToSection,
  restoredProjectId,
  sectionIntroClassName,
  motionViewportRoot,
}: {
  canvasMode: boolean;
  portfolioData: PortfolioData;
  containerRef: RefObject<HTMLDivElement | null>;
  heroSectionRef: RefObject<HTMLElement | null>;
  heroPortraitRef: RefObject<HTMLDivElement | null>;
  onProjectSelect: (projectId: string) => void;
  onScrollToSection: (sectionId: string) => void;
  restoredProjectId?: string | null;
  sectionIntroClassName: string;
  motionViewportRoot?: RefObject<Element | null>;
}) {
  const heroProofItems = getHeroProofItems(portfolioData);

  return (
    <div
      ref={containerRef}
      className={canvasMode ? "relative z-10 flex w-full flex-col gap-0 pointer-events-none" : "relative z-10 flex w-full flex-col gap-0"}
    >
      {/* Hero */}
      <section
        ref={heroSectionRef}
        id="hero"
        data-home-scroll-section="hero"
        className="relative px-6 pt-28 pb-12 md:pt-32 md:pb-16"
      >
        <div className="home-hero-content pointer-events-auto mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col items-center justify-center text-center">
          <div className="relative mb-8 flex flex-col items-center">
            <div aria-hidden className="absolute inset-x-[-20%] top-10 h-28 rounded-full bg-emerald-500/10 blur-3xl" />
            <div ref={heroPortraitRef} className="relative">
              <div aria-hidden className="absolute inset-[-16px] rounded-full border border-emerald-400/15" />
              <div aria-hidden className="absolute inset-[-26px] rounded-full border border-emerald-300/10" />
              <div aria-hidden className="absolute inset-[-42px] rounded-full bg-emerald-500/10 blur-3xl" />
              <div aria-hidden className="absolute inset-[-56px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.14),transparent_70%)] blur-[72px]" />
              <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(52,211,153,0.15)] md:h-52 md:w-52">
                <img
                  src={withBasePath("profile.jpg")}
                  alt={portfolioData.personal.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop";
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
              </div>
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl">
            {portfolioData.personal.name}
          </h1>
          <p className="mx-auto mb-6 max-w-3xl text-lg leading-relaxed text-gray-400 md:mb-7 md:text-xl">
            {portfolioData.personal.headline}
          </p>

          <div className="mb-5 flex max-w-5xl flex-wrap items-center justify-center gap-2">
            {heroProofItems.map((item, index) => (
              <ScrollRevealTile
                as="span"
                key={`${item.label}-${item.value}`}
                variant="chip"
                tone="emerald"
                viewportRoot={motionViewportRoot}
                index={index}
                className="inline-flex"
              >
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 py-2 text-left shadow-[0_12px_35px_rgba(0,0,0,0.22)] backdrop-blur-md">
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">{item.label}</span>
                  <span className="text-xs font-semibold text-white md:text-[13px]">{item.value}</span>
                </span>
              </ScrollRevealTile>
            ))}
          </div>

          <div className="mb-7 flex flex-wrap items-center justify-center gap-2.5 md:mb-8 md:gap-3">
            {portfolioData.personal.focusAreas.map((area, index) => (
              <ScrollRevealTile
                as="span"
                key={area}
                variant="chip"
                tone="emerald"
                viewportRoot={motionViewportRoot}
                index={index + heroProofItems.length}
                className="inline-flex"
              >
                <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-300 backdrop-blur-sm">
                  {area}
                </span>
              </ScrollRevealTile>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ScrollRevealTile
              as="span"
              variant="chip"
              tone="emerald"
              viewportRoot={motionViewportRoot}
              index={0}
              className="inline-flex"
            >
              <button
                type="button"
                onClick={() => onScrollToSection("projects")}
                className="rounded-full bg-white px-6 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-black transition-all hover:bg-emerald-500 hover:text-white md:px-7 md:py-3.5 md:text-sm md:tracking-widest"
              >
                View Selected Work
              </button>
            </ScrollRevealTile>
            <ScrollRevealTile
              as="span"
              variant="chip"
              tone="emerald"
              viewportRoot={motionViewportRoot}
              index={1}
              className="inline-flex"
            >
              <button
                type="button"
                onClick={() => onScrollToSection("contact")}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:border-emerald-400/40 hover:bg-white/10 md:px-7 md:py-3.5 md:text-sm md:tracking-widest"
              >
                <Mail size={16} className="mr-2" /> Let&apos;s Talk
              </button>
            </ScrollRevealTile>
          </div>

          <div className="mt-6 inline-flex items-center text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500 md:mt-7 md:text-[11px]">
            Scroll to Explore <ChevronDown size={16} className="ml-2 animate-bounce text-emerald-400" />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" data-home-scroll-section="about" className="px-6 py-14 md:py-20">
        <div className="pointer-events-auto mx-auto max-w-7xl">
          <ScrollRevealTile
            variant="panel"
            tone="emerald"
            viewportRoot={motionViewportRoot}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/[0.5] shadow-[0_0_70px_rgba(0,0,0,0.34)] backdrop-blur-xl"
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_34%)]" />

            <div className="relative grid gap-8 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.9fr)] lg:gap-8 lg:px-10">
              <ScrollRevealTile
                variant="panel"
                tone="emerald"
                viewportRoot={motionViewportRoot}
                className="lg:pr-8"
              >
                <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {portfolioData.sectionCopy.about.eyebrow}
                </span>
                <h2 className="mb-6 max-w-4xl text-4xl font-bold tracking-tighter text-white md:text-5xl xl:text-[4.25rem] xl:leading-[0.94]">
                  {portfolioData.sectionCopy.about.title}
                </h2>
                <div className="max-w-3xl space-y-4 text-base leading-relaxed text-gray-400 md:text-lg">
                  {portfolioData.personal.about.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </ScrollRevealTile>

              <ScrollRevealTile
                as="aside"
                variant="panel"
                tone="blue"
                viewportRoot={motionViewportRoot}
                index={1}
                className="lg:border-l lg:border-white/8 lg:pl-8"
              >
                <div className="flex h-full flex-col gap-6 lg:justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.26em] text-gray-500">
                      {portfolioData.sectionCopy.about.impactLabel}
                    </span>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {portfolioData.metrics.map((metric, idx) => (
                        <ScrollRevealTile
                          key={metric.label}
                          variant="metric"
                          tone={idx % 2 === 0 ? "emerald" : "blue"}
                          viewportRoot={motionViewportRoot}
                          index={idx}
                          className="min-h-[118px] rounded-[1.5rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md md:min-h-[128px] md:p-5"
                          contentClassName="flex h-full flex-col justify-between"
                        >
                          <div className="text-3xl font-bold tracking-tight text-white md:text-4xl">{metric.value}</div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">{metric.label}</div>
                        </ScrollRevealTile>
                      ))}
                    </div>
                  </div>

                  <ScrollRevealTile
                    variant="panel"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={2}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-md md:p-6"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-gray-500">
                      {portfolioData.sectionCopy.about.focusLabel}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {portfolioData.personal.focusAreas.map((area, index) => (
                        <ScrollRevealTile
                          as="span"
                          key={area}
                          variant="chip"
                          tone="emerald"
                          viewportRoot={motionViewportRoot}
                          index={index}
                          delay={index * 0.02}
                          className="inline-flex"
                        >
                          <span className="rounded-full border border-white/10 bg-black/25 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-300">
                            {area}
                          </span>
                        </ScrollRevealTile>
                      ))}
                    </div>
                  </ScrollRevealTile>
                </div>
              </ScrollRevealTile>
            </div>
          </ScrollRevealTile>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" data-home-scroll-section="skills" className="px-6 py-16 md:py-20">
        <div className="pointer-events-auto max-w-7xl mx-auto">
          <AnimatedSectionIntro
            className={`mb-10 max-w-5xl ${sectionIntroClassName}`}
            motionViewportRoot={motionViewportRoot}
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_58%)]" />
            <div className="relative text-center">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 block">
                {portfolioData.sectionCopy.skills.eyebrow}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-4">{portfolioData.sectionCopy.skills.title}</h2>
              <p className="max-w-3xl mx-auto text-gray-300 text-base leading-relaxed md:text-lg">
                {portfolioData.sectionCopy.skills.description}
              </p>
            </div>
          </AnimatedSectionIntro>
          <ScrollRevealTile
            variant="panel"
            tone="emerald"
            viewportRoot={motionViewportRoot}
            className="rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-[0_0_60px_rgba(0,0,0,0.22)] backdrop-blur-md md:p-10"
          >
            <SkillsGrid skills={portfolioData.skills} viewportRoot={motionViewportRoot} />
          </ScrollRevealTile>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" data-home-scroll-section="projects" className="px-6 py-20 md:py-24">
        <div className="pointer-events-auto max-w-7xl mx-auto">
          <SectionNavAnchor sectionId="projects" />
          <AnimatedSectionIntro
            className={`mb-14 max-w-5xl ${sectionIntroClassName}`}
            motionViewportRoot={motionViewportRoot}
            tone="blue"
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_56%)]" />
            <div className="relative text-center">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 block">{portfolioData.sectionCopy.projects.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-5">{portfolioData.sectionCopy.projects.title}</h2>
              <p className="max-w-4xl mx-auto text-gray-300 text-base leading-relaxed md:text-lg">
                {portfolioData.sectionCopy.projects.description}
              </p>
            </div>
          </AnimatedSectionIntro>
          <ProjectTree
            projects={portfolioData.projects}
            onProjectSelect={onProjectSelect}
            restoredProjectId={restoredProjectId}
            viewportRoot={motionViewportRoot}
          />
        </div>
      </section>

      {/* Experience */}
      <section id="experience" data-home-scroll-section="experience" className="px-6 py-16 md:py-20">
        <div className="pointer-events-auto w-full max-w-7xl mx-auto">
          <SectionNavAnchor sectionId="experience" />
          <AnimatedSectionIntro
            className={`mb-12 max-w-4xl ${sectionIntroClassName}`}
            motionViewportRoot={motionViewportRoot}
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_58%)]" />
            <div className="relative text-center">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 block">{portfolioData.sectionCopy.experience.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-4">{portfolioData.sectionCopy.experience.title}</h2>
              <p className="max-w-3xl mx-auto text-gray-300 text-base leading-relaxed md:text-lg">
                {portfolioData.sectionCopy.experience.description}
              </p>
            </div>
          </AnimatedSectionIntro>
          <div className="px-2 md:px-4">
            <ExperienceTimeline experiences={portfolioData.experience} viewportRoot={motionViewportRoot} />
          </div>
        </div>
      </section>

      {/* Education */}
      <section id="education" data-home-scroll-section="education" className="px-6 py-16 md:py-20">
        <div className="pointer-events-auto max-w-7xl mx-auto">
          <SectionNavAnchor sectionId="education" />
          <AnimatedSectionIntro
            className={`mb-12 max-w-5xl ${sectionIntroClassName}`}
            motionViewportRoot={motionViewportRoot}
            tone="emerald"
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.14),transparent_58%)]" />
            <div className="relative text-center">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 block">{portfolioData.sectionCopy.education.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-4">{portfolioData.sectionCopy.education.title}</h2>
              <p className="max-w-3xl mx-auto text-gray-300 text-base leading-relaxed md:text-lg">
                {portfolioData.sectionCopy.education.description}
              </p>
            </div>
          </AnimatedSectionIntro>
          <EducationGrid education={portfolioData.education} viewportRoot={motionViewportRoot} />
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        data-home-scroll-section="contact"
        className="relative overflow-hidden px-6 pt-16 pb-0 md:pt-24"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_72%_34%,rgba(16,185,129,0.14),transparent_40%)]" />
        <div className="pointer-events-auto relative z-10 max-w-5xl mx-auto">
          <SectionNavAnchor sectionId="contact" />
          <ScrollRevealTile
            variant="panel"
            tone="emerald"
            viewportRoot={motionViewportRoot}
            sceneAnchor="contact-panel"
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/[0.58] px-6 py-8 shadow-[0_0_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:px-10 md:py-10"
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_56%)]" />
            <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
              <ScrollRevealTile
                variant="panel"
                tone="emerald"
                viewportRoot={motionViewportRoot}
                className="min-w-0 text-center lg:text-left"
              >
                <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {portfolioData.sectionCopy.contact.eyebrow}
                </span>
                <h2 className="mb-4 max-w-full break-words text-[2rem] font-bold leading-[1.04] tracking-tighter text-white sm:text-3xl md:text-5xl">
                  {portfolioData.sectionCopy.contact.title}
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                  {portfolioData.sectionCopy.contact.description}
                </p>

                <div className="mt-6 flex min-w-0 flex-wrap justify-center gap-3 lg:justify-start">
                  {portfolioData.sectionCopy.contact.chips.map((chip, index) => (
                    <ScrollRevealTile
                      as="span"
                      key={chip}
                      variant="chip"
                      tone="emerald"
                      viewportRoot={motionViewportRoot}
                      index={index}
                      className="inline-flex"
                    >
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-300">
                        {chip}
                      </span>
                    </ScrollRevealTile>
                  ))}
                  <ScrollRevealTile
                    as="span"
                    variant="chip"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={portfolioData.sectionCopy.contact.chips.length}
                    className="inline-flex max-w-full"
                  >
                    <span className="max-w-full whitespace-normal break-words rounded-2xl border border-emerald-400/18 bg-emerald-400/[0.04] px-3.5 py-2 text-center text-[10px] font-bold uppercase leading-relaxed tracking-[0.22em] text-emerald-200">
                      {portfolioData.personal.location}
                    </span>
                  </ScrollRevealTile>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <ScrollRevealTile
                    as="span"
                    variant="chip"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={0}
                    className="inline-flex"
                  >
                    <a
                      href={getEmailComposeUrl(portfolioData.personal.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-emerald-500 hover:text-white"
                    >
                      <Mail size={16} className="mr-2" /> Email Me
                    </a>
                  </ScrollRevealTile>
                  <ScrollRevealTile
                    as="span"
                    variant="chip"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={1}
                    className="inline-flex"
                  >
                    <a
                      href={portfolioData.personal.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:border-emerald-400/35 hover:bg-white/[0.08]"
                    >
                      <FileText size={16} className="mr-2" /> View Resume
                    </a>
                  </ScrollRevealTile>
                </div>
              </ScrollRevealTile>

              <ScrollRevealTile
                variant="contactRow"
                tone="emerald"
                viewportRoot={motionViewportRoot}
                index={1}
                className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-md md:p-6"
              >
                <div className="mb-5 border-b border-white/8 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                    {portfolioData.sectionCopy.contact.reachLabel}
                  </p>
                  <a
                    href={getEmailComposeUrl(portfolioData.personal.email)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-base font-semibold text-white transition-colors hover:text-emerald-300 md:text-lg"
                  >
                    <Mail size={17} className="mr-3 text-emerald-400" />
                    {portfolioData.personal.email}
                  </a>
                </div>

                <div className="space-y-3">
                  <ScrollRevealTile
                    variant="contactRow"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={0}
                    className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3"
                    contentClassName="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center text-sm text-gray-300">
                      <MapPin size={16} className="mr-3 text-emerald-400" />
                      Base Location
                    </div>
                    <span className="text-sm font-medium leading-snug text-white sm:text-right">{portfolioData.personal.location}</span>
                  </ScrollRevealTile>

                  <ScrollRevealTile
                    variant="contactRow"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={1}
                    className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3"
                    contentClassName="flex h-full items-center justify-between gap-4"
                  >
                    <div className="flex items-center text-sm text-gray-300">
                      <Linkedin size={16} className="mr-3 text-emerald-400" />
                      LinkedIn
                    </div>
                    <a
                      href={portfolioData.personal.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white transition-colors hover:text-emerald-300"
                    >
                      Connect
                    </a>
                  </ScrollRevealTile>

                  <ScrollRevealTile
                    variant="contactRow"
                    tone="emerald"
                    viewportRoot={motionViewportRoot}
                    index={2}
                    className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3"
                    contentClassName="flex h-full items-center justify-between gap-4"
                  >
                    <div className="flex items-center text-sm text-gray-300">
                      <Github size={16} className="mr-3 text-emerald-400" />
                      GitHub
                    </div>
                    <a
                      href={portfolioData.personal.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white transition-colors hover:text-emerald-300"
                    >
                      Review Work
                    </a>
                  </ScrollRevealTile>
                </div>
              </ScrollRevealTile>
            </div>
          </ScrollRevealTile>
        </div>
      </section>

      <section
        aria-label="Footer"
        data-home-scroll-section="footer"
        className="pointer-events-auto relative z-10 w-full bg-black"
      >
        <Footer portfolioData={portfolioData} />
      </section>
    </div>
  );
}

function ScrollViewportBridge({
  onReady,
}: {
  onReady: (state: ScrollViewportState) => void;
}) {
  const data = useScroll();

  useEffect(() => {
    onReady(data as unknown as ScrollViewportState);
  }, [data, onReady]);

  return null;
}

export default function Home() {
  const location = useLocation();
  const { hash, key: locationKey } = location;
  const navigationType = useNavigationType();
  const { profileSlug: profileSlugParam } = useParams();
  const hasValidProfileSlug = isProfileSlug(profileSlugParam);
  const profileSlug = hasValidProfileSlug ? profileSlugParam : defaultProfileSlug;
  const portfolioData = portfolioProfiles[profileSlug];
  const navigate = useNavigate();
  const isPresent = useIsPresent();
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(() => canCreateWebGLContext());
  const [pages, setPages] = useState(1);
  const [sectionRanges, setSectionRanges] = useState<HomeSceneRanges>(defaultHomeSceneRanges);
  const [scrollViewportVersion, setScrollViewportVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const scrollViewportStateRef = useRef<ScrollViewportState | null>(null);
  const scrollViewportStateChangedAtRef = useRef(0);
  const hasInitializedCanvasViewportRef = useRef(false);
  const enteredHomeWithHashRef = useRef(Boolean(hash));
  const previousHashRef = useRef(hash);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroPortraitRef = useRef<HTMLDivElement>(null);
  const [homeRestoreStatus, setHomeRestoreStatus] = useState<"idle" | "pending" | "restored">("idle");
  const [restoreRetryVersion, setRestoreRetryVersion] = useState(0);
  const [hashRetryVersion, setHashRetryVersion] = useState(0);
  const [pendingHashSection, setPendingHashSection] = useState<{ sectionId: HomeHashSectionId; settledTargetTop: number | null } | null>(() => {
    const hashSectionId = getHomeHashSectionId(hash);
    return hashSectionId ? { sectionId: hashSectionId, settledTargetTop: null } : null;
  });
  const [restoredProjectId, setRestoredProjectId] = useState<string | null>(null);
  const isLitePerformanceMode = useLitePerformanceMode();
  const heroAnchorX = useMotionValue(0);
  const heroAnchorY = useMotionValue(0.18);
  const heroIntroProgress = useMotionValue(0);
  const heroAnchor = useMemo(
    () => ({
      x: heroAnchorX,
      y: heroAnchorY,
    }),
    [heroAnchorX, heroAnchorY]
  );
  const shouldPreserveHomeScroll = homeRestoreStatus !== "idle";

  const resetWindowScrollPosition = () => {
    document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const resetCanvasScrollViewport = () => {
    const scrollViewport = scrollViewportRef.current;
    if (!scrollViewport) return;

    scrollViewport.scrollLeft = 0;
    scrollViewport.scrollTop = 1;
    const maxScroll = getCanvasNativeMaxScroll(scrollViewport);
    syncCanvasScrollViewportState(1, maxScroll);
  };

  const getCurrentHomeScrollSnapshot = (sourceProjectId: string) => {
    const canvasScrollViewport = scrollViewportRef.current;
    const mode: HomeScrollMode = isCanvasEnabled && canvasScrollViewport ? "canvas" : "dom";
    const scrollTop =
      mode === "canvas"
        ? canvasScrollViewport.scrollTop
        : document.scrollingElement?.scrollTop ?? window.scrollY ?? 0;

    return {
      profileSlug,
      mode,
      scrollTop,
      sourceProjectId,
      timestamp: Date.now(),
    };
  };

  const applyWindowScrollRestore = (targetTop: number) => {
    const normalizedTarget = Math.max(0, targetTop);
    document.scrollingElement?.scrollTo({ top: normalizedTarget, left: 0, behavior: "auto" });
    window.scrollTo({ top: normalizedTarget, left: 0, behavior: "auto" });
  };

  const syncCanvasScrollViewportState = (targetTop: number, maxScroll: number) => {
    const scrollViewportState = scrollViewportStateRef.current;
    if (!scrollViewportState || scrollViewportState.horizontal) return;

    const viewportHeight = scrollViewportState.el.clientHeight;
    scrollViewportState.pages = pages;

    const normalizedTarget = maxScroll > 0 ? clamp01(targetTop / maxScroll) : 0;
    scrollViewportState.offset = normalizedTarget;
    scrollViewportState.delta = 1;
    if (scrollViewportState.scroll) {
      scrollViewportState.scroll.current = normalizedTarget;
    }

    const scrollHtmlLayer = scrollViewportState.fixed.firstElementChild;
    if (scrollHtmlLayer instanceof HTMLElement) {
      const visualScrollTop = getCanvasVisualScrollRange(pages, viewportHeight || window.innerHeight || 1) * normalizedTarget;
      scrollHtmlLayer.style.transform = `translate3d(0px,${-visualScrollTop}px,0)`;
    }
  };

  const applyCanvasScrollRestore = (targetTop: number) => {
    const scrollViewport = scrollViewportRef.current;
    if (!scrollViewport) return;

    const maxScroll = getCanvasNativeMaxScroll(scrollViewport);
    const clampedTarget = Math.max(1, Math.min(targetTop, maxScroll));
    scrollViewport.scrollLeft = 0;
    scrollViewport.scrollTo({ top: clampedTarget, behavior: "auto" });
    syncCanvasScrollViewportState(clampedTarget, maxScroll);
  };

  const getHomeNavScrollClearance = () => {
    const navbar = document.querySelector<HTMLElement>("[data-site-navbar]");
    const navbarHeight = navbar?.getBoundingClientRect().height ?? 88;
    return navbarHeight + HOME_NAV_ANCHOR_BUFFER_PX;
  };

  const resolveHomeNavAnchor = (sectionId: HomeHashSectionId) => {
    const container = containerRef.current;
    if (!container) return null;

    return (
      container.querySelector<HTMLElement>(`[data-home-nav-anchor="${sectionId}"]`) ??
      document.getElementById(sectionId)
    );
  };

  const getSectionScrollMetrics = (sectionId: HomeHashSectionId) => {
    const anchor = resolveHomeNavAnchor(sectionId);
    if (!anchor) return null;

    const clearance = getHomeNavScrollClearance();
    const scrollViewport = scrollViewportRef.current;

    if (isCanvasEnabled) {
      if (!scrollViewport) return null;

      const container = containerRef.current;
      if (!container) return null;

      const anchorTopWithinContainer = getHomeAnchorTopWithinContainer(anchor, container);
      if (anchorTopWithinContainer === null) return null;

      const viewportHeight = scrollViewport.clientHeight || window.innerHeight || 1;
      const maxScroll = getCanvasVisualScrollRange(pages, viewportHeight);
      const rawTargetTop = anchorTopWithinContainer - clearance;
      const visualTargetTop = Math.max(0, Math.min(rawTargetTop, maxScroll));
      const targetTop = getCanvasNativeScrollTopForVisualTop(visualTargetTop, pages, scrollViewport);

      return {
        mode: "canvas" as const,
        targetTop,
        rawTargetTop,
        maxScroll,
        nativeMaxScroll: getCanvasNativeMaxScroll(scrollViewport),
        visualTargetTop,
      };
    }

    const scrollingElement = document.scrollingElement;
    const scrollHeight = scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight ?? 0;
    const clientHeight = scrollingElement?.clientHeight ?? window.innerHeight ?? document.documentElement.clientHeight ?? 0;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const rawTargetTop = window.scrollY + anchor.getBoundingClientRect().top - clearance;
    const targetTop = Math.max(0, Math.min(rawTargetTop, maxScroll));

    return {
      mode: "dom" as const,
      targetTop,
      rawTargetTop,
      maxScroll,
    };
  };

  type SectionScrollMetrics = NonNullable<ReturnType<typeof getSectionScrollMetrics>>;
  const canApplySectionScrollMetrics = (
    metrics: ReturnType<typeof getSectionScrollMetrics>
  ): metrics is SectionScrollMetrics => {
    if (!metrics) return false;
    return metrics.maxScroll + HOME_HASH_END_CLAMP_TOLERANCE_PX >= metrics.rawTargetTop;
  };

  const applySectionScroll = (sectionId: HomeHashSectionId, behavior: ScrollBehavior = "smooth") => {
    const metrics = getSectionScrollMetrics(sectionId);
    if (!canApplySectionScrollMetrics(metrics)) {
      return false;
    }

    if (metrics.mode === "canvas") {
      const scrollViewport = scrollViewportRef.current;
      if (!scrollViewport) return false;

      scrollViewport.scrollLeft = 0;
      scrollViewport.scrollTo({ top: metrics.targetTop, behavior });
      syncCanvasScrollViewportState(metrics.targetTop, metrics.nativeMaxScroll);
      return true;
    }

    document.scrollingElement?.scrollTo({ top: metrics.targetTop, left: 0, behavior });
    window.scrollTo({ top: metrics.targetTop, left: 0, behavior });
    return true;
  };

  const requestHashSectionScroll = (sectionId: HomeHashSectionId, behavior: ScrollBehavior = "smooth") => {
    const didApply = applySectionScroll(sectionId, behavior);
    if (!didApply) {
      setPendingHashSection({ sectionId, settledTargetTop: null });
      return;
    }

    setPendingHashSection((current) =>
      current?.sectionId === sectionId
        ? { sectionId, settledTargetTop: current.settledTargetTop }
        : { sectionId, settledTargetTop: null }
    );
  };

  const canReachWindowRestoreTarget = (targetTop: number) => {
    const normalizedTarget = Math.max(0, targetTop);
    const scrollingElement = document.scrollingElement;
    const scrollHeight = scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight ?? 0;
    const clientHeight = scrollingElement?.clientHeight ?? window.innerHeight ?? document.documentElement.clientHeight ?? 0;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    return maxScroll + 1 >= normalizedTarget;
  };

  const canReachCanvasRestoreTarget = (targetTop: number) => {
    const scrollViewport = scrollViewportRef.current;
    if (!scrollViewport) return false;

    const normalizedTarget = Math.max(1, targetTop);
    const maxScroll = getCanvasNativeMaxScroll(scrollViewport);
    return maxScroll + 1 >= normalizedTarget;
  };

  const hasStableCanvasViewportState = () => {
    return Date.now() - scrollViewportStateChangedAtRef.current >= 280;
  };

  const hasSettledCanvasHashTarget = (sectionId: HomeHashSectionId, targetTop: number) => {
    const scrollViewport = scrollViewportRef.current;
    const anchor = resolveHomeNavAnchor(sectionId);
    if (!scrollViewport || !anchor) return false;

    const clearance = getHomeNavScrollClearance();
    const anchorTop = anchor.getBoundingClientRect().top;
    const isAtTarget = Math.abs(scrollViewport.scrollTop - targetTop) <= 2;
    const isDirectAnchorLanding = Math.abs(anchorTop - clearance) <= 24;
    const footer = containerRef.current?.querySelector<HTMLElement>('[data-home-scroll-section="footer"]') ?? null;
    const footerRect = footer?.getBoundingClientRect();
    const isClampedAtFooterEnd =
      Math.abs(targetTop - getCanvasNativeMaxScroll(scrollViewport)) <= 2 &&
      anchorTop >= clearance - 24 &&
      anchorTop <= clearance + HOME_HASH_END_CLAMP_TOLERANCE_PX &&
      Boolean(footerRect && footerRect.top > anchorTop && footerRect.top < scrollViewport.clientHeight);

    return isAtTarget && (isDirectAnchorLanding || isClampedAtFooterEnd);
  };

  const nudgeCanvasHashTarget = (targetTop: number, maxScroll: number) => {
    const scrollViewport = scrollViewportRef.current;
    if (!scrollViewport) return;
    if (Math.abs(scrollViewport.scrollTop - targetTop) > 1) return;

    const nudgedTargetTop =
      targetTop <= 3 ? Math.min(maxScroll, targetTop + 3) : Math.max(1, targetTop - 3);

    if (Math.abs(nudgedTargetTop - targetTop) <= 0.5) return;

    scrollViewport.scrollLeft = 0;
    scrollViewport.scrollTo({ top: nudgedTargetTop, behavior: "auto" });
  };

  const setScrollViewport = (state: ScrollViewportState) => {
    const previousState = scrollViewportStateRef.current;
    scrollViewportStateRef.current = state;

    if (scrollViewportRef.current !== state.el) {
      scrollViewportRef.current = state.el;
    }

    if (previousState !== state) {
      scrollViewportStateChangedAtRef.current = Date.now();
      setScrollViewportVersion((value) => value + 1);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const scrollViewport = scrollViewportRef.current;
    if (!isCanvasEnabled || !scrollViewport) return;

    let frame = 0;
    const syncNativeScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        syncCanvasScrollViewportState(scrollViewport.scrollTop, getCanvasNativeMaxScroll(scrollViewport));
      });
    };

    scrollViewport.addEventListener("scroll", syncNativeScroll, { passive: true });
    syncNativeScroll();

    return () => {
      window.cancelAnimationFrame(frame);
      scrollViewport.removeEventListener("scroll", syncNativeScroll);
    };
  }, [isCanvasEnabled, pages, scrollViewportVersion]);

  useEffect(() => {
    enteredHomeWithHashRef.current = Boolean(hash);
    const hashSectionId = getHomeHashSectionId(hash);
    const explicitRestore = getHomeRestoreState(location.state);
    const pendingPopRestore = navigationType === "POP" ? readPendingHomeRestore(profileSlug) : null;
    const shouldRestoreHomeScroll =
      explicitRestore?.profileSlug === profileSlug || pendingPopRestore?.profileSlug === profileSlug;

    if (hash) {
      if (shouldRestoreHomeScroll) {
        setPendingHashSection(null);
        setRestoredProjectId(null);
        setHomeRestoreStatus("pending");
        return;
      }

      clearPendingHomeRestore(profileSlug);
      setRestoredProjectId(null);
      setPendingHashSection(
        shouldPreserveHomeScroll || !hashSectionId
          ? null
          : { sectionId: hashSectionId, settledTargetTop: null }
      );
      setHomeRestoreStatus("idle");
      return;
    }

    setPendingHashSection(null);
    if (shouldRestoreHomeScroll) {
      setRestoredProjectId(null);
      setHomeRestoreStatus("pending");
      return;
    }

    clearPendingHomeRestore(profileSlug);
    setRestoredProjectId(null);
    setHomeRestoreStatus("idle");
  }, [hash, location.state, navigationType, profileSlug, locationKey, shouldPreserveHomeScroll]);

  const disableCanvas = () => {
    scrollViewportStateRef.current = null;
    scrollViewportRef.current = null;
    setIsCanvasEnabled(false);
  };

  const handleCanvasError = (error: Error) => {
    const isProductionBuild = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD ?? false;
    if (!isProductionBuild) {
      console.warn("[Home] Canvas render failed. Falling back to DOM homepage.", error);
    }

    disableCanvas();
  };

  useEffect(() => {
    const handleWebGLError = (message: string | undefined) => {
      if (isWebGLFailureMessage(message)) {
        disableCanvas();
      }
    };

    const onError = (event: ErrorEvent) => {
      handleWebGLError(event.message);
      handleWebGLError(event.error instanceof Error ? event.error.message : undefined);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (typeof reason === "string") {
        handleWebGLError(reason);
        return;
      }

      if (reason instanceof Error) {
        handleWebGLError(reason.message);
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (homeRestoreStatus !== "pending") return;

    const snapshot = readHomeScrollSnapshot(profileSlug);
    if (!snapshot) {
      clearPendingHomeRestore(profileSlug);
      setRestoredProjectId(null);
      setHomeRestoreStatus("idle");
      return;
    }

    if (isCanvasEnabled) {
      if (!canReachCanvasRestoreTarget(snapshot.scrollTop) || !hasStableCanvasViewportState()) {
        const timeout = window.setTimeout(() => {
          setRestoreRetryVersion((current) => current + 1);
        }, 140);

        return () => window.clearTimeout(timeout);
      }

      let frame = 0;
      const timeouts: number[] = [];
      const restore = () => applyCanvasScrollRestore(snapshot.scrollTop);

      restore();
      frame = window.requestAnimationFrame(() => {
        restore();
        timeouts.push(window.setTimeout(restore, 120));
        timeouts.push(window.setTimeout(restore, 320));
      });

      setRestoredProjectId(snapshot.sourceProjectId);
      clearPendingHomeRestore(profileSlug);
      setHomeRestoreStatus("restored");

      return () => {
        window.cancelAnimationFrame(frame);
        timeouts.forEach((timeout) => window.clearTimeout(timeout));
      };
    }

    if (!canReachWindowRestoreTarget(snapshot.scrollTop)) {
      const timeout = window.setTimeout(() => {
        setRestoreRetryVersion((current) => current + 1);
      }, 140);

      return () => window.clearTimeout(timeout);
    }

    let frame = 0;
    const timeouts: number[] = [];
    const restore = () => applyWindowScrollRestore(snapshot.scrollTop);

    restore();
    frame = window.requestAnimationFrame(() => {
      restore();
      timeouts.push(window.setTimeout(restore, 120));
      timeouts.push(window.setTimeout(restore, 320));
    });

    setRestoredProjectId(snapshot.sourceProjectId);
    clearPendingHomeRestore(profileSlug);
    setHomeRestoreStatus("restored");

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [homeRestoreStatus, isCanvasEnabled, profileSlug, restoreRetryVersion, scrollViewportVersion, pages]);

  useEffect(() => {
    if (homeRestoreStatus !== "restored" || !restoredProjectId) return;

    const timeout = window.setTimeout(() => {
      setRestoredProjectId((current) => (current === restoredProjectId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [homeRestoreStatus, restoredProjectId]);

  useEffect(() => {
    const hashSectionId = getHomeHashSectionId(hash);
    if (!hashSectionId || shouldPreserveHomeScroll) return;
    if (isCanvasEnabled && (!scrollViewportRef.current || pages <= 1.01)) return;

    const requestHashScroll = () => requestHashSectionScroll(hashSectionId, "auto");
    const frame = window.requestAnimationFrame(requestHashScroll);
    const timeouts = [120, 360, 720, 1400, 2600].map((delay) => window.setTimeout(requestHashScroll, delay));

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [hash, isCanvasEnabled, pages, profileSlug, scrollViewportVersion, shouldPreserveHomeScroll]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let frame = 0;
    const observedSections = new Set<HTMLElement>();
    let observer: ResizeObserver | null = null;
    const observeSections = () => {
      if (!observer) return;
      getHomeScrollSections(element).forEach((section) => {
        if (observedSections.has(section)) return;
        observedSections.add(section);
        observer?.observe(section);
      });
    };

    const updatePages = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        observeSections();
        const totalHeight = getMeasuredHomeContentHeight(element);
        const vh = scrollViewportRef.current?.clientHeight || window.innerHeight || 1;
        const visualScrollRange = Math.max(0, totalHeight - vh);
        // Drei adds its own sticky viewport to the native scroll area; pages must
        // describe visual content travel only, ending at the footer bottom.
        setPages(Math.max(1, 1 + visualScrollRange / vh));
      });
    };

    updatePages();
    observer = new ResizeObserver(updatePages);
    observer.observe(element);
    observeSections();
    const mutationObserver = new MutationObserver(updatePages);
    mutationObserver.observe(element, { childList: true });
    window.addEventListener("resize", updatePages);
    document.fonts?.ready.then(updatePages).catch(() => {
      // Font readiness is a best-effort layout stabilizer.
    });
    const timeouts = [150, 350, 700, 1200, 2000, 3200, 5000].map((delay) => window.setTimeout(updatePages, delay));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updatePages);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [profileSlug, scrollViewportVersion]);

  useEffect(() => {
    const isProductionBuild = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD ?? false;
    if (isProductionBuild) return;

    const element = containerRef.current;
    if (!element) return;

    const sectionNames = getHomeScrollSectionNames(element);
    const missingSections = HOME_SCROLL_SECTION_ORDER.filter((sectionName) => !sectionNames.includes(sectionName));
    const contactSection = document.getElementById("contact");
    const lastTwoSections = sectionNames.slice(-2);

    const warnings: string[] = [];

    if (!contactSection) {
      warnings.push("Missing #contact section.");
    }

    if (missingSections.length > 0) {
      warnings.push(`Missing home scroll sections: ${missingSections.join(", ")}.`);
    }

    if (lastTwoSections[0] !== "contact" || lastTwoSections[1] !== "footer") {
      warnings.push(`Expected the final home scroll sections to be contact -> footer, found ${lastTwoSections.join(" -> ") || "(none)"}.`);
    }

    if (warnings.length > 0) {
      console.warn("[Home] Homepage scroll section invariant failed.", ...warnings);
    }
  }, [pages, scrollViewportVersion]);

  useEffect(() => {
    const element = containerRef.current;
    const scrollViewport = scrollViewportRef.current;
    if (!element || !scrollViewport) return;

    let frame = 0;
    const updateSectionRanges = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setSectionRanges(measureHomeSceneRanges(element, scrollViewport, pages));
      });
    };

    updateSectionRanges();
    const observer = new ResizeObserver(updateSectionRanges);
    observer.observe(element);
    observer.observe(scrollViewport);
    getHomeScrollSections(element).forEach((section) => {
      observer.observe(section);
    });
    window.addEventListener("resize", updateSectionRanges);
    const timeout = window.setTimeout(updateSectionRanges, 350);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateSectionRanges);
      window.clearTimeout(timeout);
    };
  }, [pages, scrollViewportVersion]);

  const scrollToSection = (sectionId: string, behavior: ScrollBehavior = "smooth") => {
    const hashSectionId = isHomeHashSectionId(sectionId) ? sectionId : null;
    if (hashSectionId) {
      requestHashSectionScroll(hashSectionId, behavior);
      return;
    }

    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior, block: "start" });
  };

  const sectionIntroClassName =
    "relative mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-black/[0.45] px-6 py-8 shadow-[0_0_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-10 md:py-10";

  const openProjectDetail = (projectId: string) => {
    const snapshot = getCurrentHomeScrollSnapshot(projectId);
    saveHomeScrollSnapshot(snapshot);
    markPendingHomeRestore({
      profileSlug,
      sourceProjectId: projectId,
      reason: "case-study-entry",
      requestedAt: Date.now(),
    });

    navigate(getProfileProjectPath(profileSlug, projectId), {
      state: createCaseStudyEntryState({
        profileSlug,
        sourceProjectId: projectId,
        previousRouteKind: "home",
      }),
    });
  };

  useEffect(() => {
    if (isCanvasEnabled || hash || shouldPreserveHomeScroll) return;

    let frame = 0;
    const timeouts: number[] = [];

    frame = window.requestAnimationFrame(() => {
      resetWindowScrollPosition();
      timeouts.push(window.setTimeout(resetWindowScrollPosition, 120));
      timeouts.push(window.setTimeout(resetWindowScrollPosition, 360));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [hash, isCanvasEnabled, locationKey, shouldPreserveHomeScroll]);

  useEffect(() => {
    if (!isCanvasEnabled || hash || shouldPreserveHomeScroll) return;
    if (enteredHomeWithHashRef.current) return;
    if (hasInitializedCanvasViewportRef.current) return;
    if (pages <= 1.01) return;
    if (!scrollViewportRef.current) return;

    hasInitializedCanvasViewportRef.current = true;

    let frame = 0;
    const timeouts: number[] = [];
    const syncViewportToHero = () => resetCanvasScrollViewport();

    syncViewportToHero();
    frame = window.requestAnimationFrame(() => {
      syncViewportToHero();
      timeouts.push(window.setTimeout(syncViewportToHero, 120));
      timeouts.push(window.setTimeout(syncViewportToHero, 320));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [hash, isCanvasEnabled, pages, scrollViewportVersion, shouldPreserveHomeScroll]);

  useEffect(() => {
    if (!pendingHashSection || shouldPreserveHomeScroll) return;

    const metrics = getSectionScrollMetrics(pendingHashSection.sectionId);
    if (!canApplySectionScrollMetrics(metrics)) {
      const timeout = window.setTimeout(() => {
        setHashRetryVersion((current) => current + 1);
      }, 140);

      return () => window.clearTimeout(timeout);
    }

    const hasSettledCanvasTargetBeforeApply =
      metrics.mode === "canvas" ? hasSettledCanvasHashTarget(pendingHashSection.sectionId, metrics.targetTop) : true;

    if (metrics.mode === "canvas" && !hasSettledCanvasTargetBeforeApply) {
      nudgeCanvasHashTarget(metrics.targetTop, metrics.nativeMaxScroll);
    }

    applySectionScroll(pendingHashSection.sectionId, "auto");
    const hasSettledCanvasTarget =
      metrics.mode === "canvas" ? hasSettledCanvasHashTarget(pendingHashSection.sectionId, metrics.targetTop) : true;
    const hasStableCanvasTargetState = metrics.mode === "canvas" ? hasStableCanvasViewportState() : true;

    if (
      pendingHashSection.settledTargetTop !== null &&
      Math.abs(pendingHashSection.settledTargetTop - metrics.targetTop) <= 1 &&
      hasSettledCanvasTarget &&
      hasStableCanvasTargetState
    ) {
      const timeout = window.setTimeout(() => {
        setPendingHashSection((current) =>
          current?.sectionId === pendingHashSection.sectionId ? null : current
        );
      }, 120);

      return () => window.clearTimeout(timeout);
    }

    if (metrics.mode === "canvas" && !hasStableCanvasTargetState) {
      const timeout = window.setTimeout(() => {
        setHashRetryVersion((current) => current + 1);
      }, 140);

      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      setPendingHashSection((current) =>
        current?.sectionId === pendingHashSection.sectionId
          ? { sectionId: current.sectionId, settledTargetTop: metrics.targetTop }
          : current
      );
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [hashRetryVersion, pendingHashSection, pages, scrollViewportVersion, shouldPreserveHomeScroll, isCanvasEnabled]);

  useEffect(() => {
    const handleHomeNavScrollRequest = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as { sectionId?: string } | null) : null;
      const sectionId = detail?.sectionId;
      if (!sectionId || !isHomeHashSectionId(sectionId) || shouldPreserveHomeScroll) {
        return;
      }

      requestHashSectionScroll(sectionId, "smooth");
    };

    window.addEventListener(HOME_NAV_SCROLL_REQUEST_EVENT, handleHomeNavScrollRequest);

    return () => {
      window.removeEventListener(HOME_NAV_SCROLL_REQUEST_EVENT, handleHomeNavScrollRequest);
    };
  }, [shouldPreserveHomeScroll, pages, scrollViewportVersion, isCanvasEnabled]);

  useEffect(() => {
    const previousHash = previousHashRef.current;
    previousHashRef.current = hash;

    if (!isCanvasEnabled || hash || !previousHash || shouldPreserveHomeScroll) return;
    if (!scrollViewportRef.current) return;

    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      resetCanvasScrollViewport();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [hash, isCanvasEnabled, scrollViewportVersion, shouldPreserveHomeScroll]);

  useEffect(() => {
    const scrollViewport = scrollViewportRef.current;
    const heroSection = heroSectionRef.current;
    const portrait = heroPortraitRef.current;
    if (!scrollViewport || !heroSection || !portrait) return;

    let frame = 0;
    const measureHeroState = () => {
      const rect = portrait.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const viewportRect = scrollViewport.getBoundingClientRect();
      const viewportWidth = viewportRect.width || window.innerWidth || 1;
      const viewportHeight = viewportRect.height || window.innerHeight || 1;

      const normalizedX = ((centerX - viewportRect.left) / viewportWidth) * 2 - 1;
      const normalizedY = 1 - ((centerY - viewportRect.top) / viewportHeight) * 2;

      heroAnchorX.set(Math.max(-1, Math.min(1, normalizedX)));
      heroAnchorY.set(Math.max(-1, Math.min(1, normalizedY)));

      const heroTop = heroSection.offsetTop;
      const heroTravel = Math.max(heroSection.offsetHeight, scrollViewport.clientHeight * 0.95);
      const visualScrollTop = getCanvasVisualTopForNativeScroll(scrollViewport.scrollTop, pages, scrollViewport);
      const rawProgress = (visualScrollTop - heroTop) / heroTravel;
      heroIntroProgress.set(Math.max(0, Math.min(1, rawProgress)));
    };

    const scheduleHeroStateMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureHeroState);
    };

    scheduleHeroStateMeasure();
    scrollViewport.addEventListener("scroll", scheduleHeroStateMeasure, { passive: true });
    const observer = new ResizeObserver(scheduleHeroStateMeasure);
    observer.observe(heroSection);
    observer.observe(portrait);
    window.addEventListener("resize", scheduleHeroStateMeasure);
    const timeouts = [120, 360, 900].map((delay) => window.setTimeout(scheduleHeroStateMeasure, delay));

    return () => {
      window.cancelAnimationFrame(frame);
      scrollViewport.removeEventListener("scroll", scheduleHeroStateMeasure);
      observer.disconnect();
      window.removeEventListener("resize", scheduleHeroStateMeasure);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [heroAnchorX, heroAnchorY, heroIntroProgress, pages, scrollViewportVersion]);

  if (!hasValidProfileSlug) {
    return (
      <Navigate
        replace
        to={{
          pathname: getProfileHomePath(defaultProfileSlug),
          search: location.search,
          hash: location.hash,
        }}
      />
    );
  }

  return (
    <Layout profileSlug={profileSlug} portfolioData={portfolioData}>
      {isCanvasEnabled ? (
        <CanvasErrorBoundary onError={handleCanvasError}>
          <div className="fixed inset-0 z-0 bg-black">
            <Canvas
              dpr={isLitePerformanceMode ? 1 : [1, 1.35]}
              camera={{ position: [0, 0, 5], fov: 75 }}
              gl={{
                alpha: true,
                antialias: !isLitePerformanceMode,
                powerPreference: isLitePerformanceMode ? "default" : "high-performance",
              }}
              performance={{ min: 0.45 }}
              style={{ position: "absolute", inset: 0, zIndex: 0 }}
            >
              <SceneLights />
              {isPresent && (
                <ScrollControls pages={pages} damping={isLitePerformanceMode ? 0.08 : 0.14} style={{ zIndex: "1", scrollBehavior: "auto" }}>
                  <ScrollViewportBridge onReady={setScrollViewport} />
                  <StoryScene
                    heroAnchor={heroAnchor}
                    heroIntroProgress={heroIntroProgress}
                    sectionRanges={sectionRanges}
                    liteMode={isLitePerformanceMode}
                  />
                  <Scroll html style={{ width: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
                    <HomeScrollContent
                      canvasMode
                      portfolioData={portfolioData}
                      containerRef={containerRef}
                      heroSectionRef={heroSectionRef}
                      heroPortraitRef={heroPortraitRef}
                      onProjectSelect={openProjectDetail}
                      onScrollToSection={scrollToSection}
                      restoredProjectId={restoredProjectId}
                      sectionIntroClassName={sectionIntroClassName}
                      motionViewportRoot={scrollViewportRef}
                    />
                  </Scroll>
                </ScrollControls>
              )}
            </Canvas>
          </div>
        </CanvasErrorBoundary>
      ) : (
        <div className="relative z-0 bg-black">
          <HomeScrollContent
            canvasMode={false}
            portfolioData={portfolioData}
            containerRef={containerRef}
            heroSectionRef={heroSectionRef}
            heroPortraitRef={heroPortraitRef}
            onProjectSelect={openProjectDetail}
            onScrollToSection={scrollToSection}
            restoredProjectId={restoredProjectId}
            sectionIntroClassName={sectionIntroClassName}
          />
        </div>
      )}
    </Layout>
  );
}
