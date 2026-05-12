/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import { AnimatePresence, motion } from "motion/react";
import ScrollToTop from "./components/ScrollToTop";
import { defaultProfileSlug, isProfileSlug, portfolioProfiles } from "./data/portfolioData";
import { getProfileHomePath, getProfileProjectPath } from "./utils/profileRoutes";
import { useEffect, useMemo, useRef, type ReactNode } from "react";

const routerBase = import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");

type RouteKind = "home" | "detail" | "other";
type RouteTransitionProfile = {
  veilOpacity: number;
  blurClassName: string;
  glowStart: string;
  glowEnd: string;
  bandOffsetX: number;
  bandOffsetY: number;
  enterDuration: number;
  exitDuration: number;
};

const profileAccentMap = {
  dataengineer: { glowStart: "rgba(245, 158, 11, 0.24)", glowEnd: "rgba(52, 211, 153, 0.16)" },
  softwareengineer: { glowStart: "rgba(56, 189, 248, 0.22)", glowEnd: "rgba(34, 211, 238, 0.14)" },
  datascientist: { glowStart: "rgba(192, 132, 252, 0.24)", glowEnd: "rgba(244, 114, 182, 0.16)" },
  datanalyst: { glowStart: "rgba(20, 184, 166, 0.24)", glowEnd: "rgba(245, 158, 11, 0.12)" },
} as const;

function getRouteKind(pathname: string): RouteKind {
  if (pathname.includes("/project/")) return "detail";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1) return "home";
  if (pathname === "/") return "home";
  return "other";
}

function getProfileAccent(pathname: string) {
  const candidate = pathname.split("/").filter(Boolean)[0];
  return isProfileSlug(candidate) ? profileAccentMap[candidate] : { glowStart: "rgba(16, 185, 129, 0.22)", glowEnd: "rgba(56, 189, 248, 0.12)" };
}

function getRouteTransitionProfile(previousKind: RouteKind, currentKind: RouteKind, pathname: string): RouteTransitionProfile {
  const accent = getProfileAccent(pathname);

  if (previousKind === "home" && currentKind === "detail") {
    return {
      veilOpacity: 0.84,
      blurClassName: "backdrop-blur-[14px]",
      glowStart: accent.glowStart,
      glowEnd: accent.glowEnd,
      bandOffsetX: 120,
      bandOffsetY: -48,
      enterDuration: 0.64,
      exitDuration: 0.42,
    };
  }

  if (previousKind === "detail" && currentKind === "home") {
    return {
      veilOpacity: 0.72,
      blurClassName: "backdrop-blur-[10px]",
      glowStart: accent.glowEnd,
      glowEnd: accent.glowStart,
      bandOffsetX: -96,
      bandOffsetY: 44,
      enterDuration: 0.58,
      exitDuration: 0.4,
    };
  }

  if (previousKind === "detail" && currentKind === "detail") {
    return {
      veilOpacity: 0.66,
      blurClassName: "backdrop-blur-[9px]",
      glowStart: accent.glowStart,
      glowEnd: accent.glowEnd,
      bandOffsetX: 88,
      bandOffsetY: 0,
      enterDuration: 0.48,
      exitDuration: 0.34,
    };
  }

  return {
    veilOpacity: 0.54,
    blurClassName: "backdrop-blur-[7px]",
    glowStart: accent.glowStart,
    glowEnd: accent.glowEnd,
    bandOffsetX: 54,
    bandOffsetY: -24,
    enterDuration: 0.38,
    exitDuration: 0.28,
  };
}

function RouteStage({
  transitionProfile,
  children,
}: {
  transitionProfile: RouteTransitionProfile;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="relative min-h-screen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 1 },
        animate: { opacity: 1, transition: { duration: transitionProfile.enterDuration } },
        exit: { opacity: 1, transition: { duration: transitionProfile.exitDuration } },
      }}
    >
      <motion.div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[140] overflow-hidden ${transitionProfile.blurClassName}`}
        variants={{
          initial: { opacity: transitionProfile.veilOpacity },
          animate: { opacity: 0, transition: { duration: transitionProfile.enterDuration, ease: [0.22, 1, 0.36, 1] } },
          exit: { opacity: 1, transition: { duration: transitionProfile.exitDuration, ease: [0.4, 0, 0.2, 1] } },
        }}
      >
        <motion.div
          className="absolute inset-0 bg-black/90"
          variants={{
            initial: { opacity: 1 },
            animate: { opacity: 0 },
            exit: { opacity: 1 },
          }}
        />
        <motion.div
          className="absolute inset-[-12%]"
          style={{
            background: `radial-gradient(circle at 18% 20%, ${transitionProfile.glowStart}, transparent 36%), radial-gradient(circle at 82% 70%, ${transitionProfile.glowEnd}, transparent 34%)`,
          }}
          variants={{
            initial: { x: transitionProfile.bandOffsetX, y: transitionProfile.bandOffsetY, scale: 1.06, opacity: 1 },
            animate: { x: 0, y: 0, scale: 1, opacity: 0, transition: { duration: transitionProfile.enterDuration, ease: [0.22, 1, 0.36, 1] } },
            exit: {
              x: transitionProfile.bandOffsetX * -0.45,
              y: transitionProfile.bandOffsetY * -0.45,
              scale: 0.98,
              opacity: 1,
              transition: { duration: transitionProfile.exitDuration, ease: [0.4, 0, 0.2, 1] },
            },
          }}
        />
        <motion.div
          className="absolute inset-y-[-10%] left-[-24%] w-[58%] rotate-[12deg]"
          style={{
            background: `linear-gradient(180deg, transparent, ${transitionProfile.glowStart}, transparent)`,
            filter: "blur(72px)",
          }}
          variants={{
            initial: { x: transitionProfile.bandOffsetX, opacity: 0.78 },
            animate: { x: 0, opacity: 0, transition: { duration: transitionProfile.enterDuration * 0.92 } },
            exit: { x: transitionProfile.bandOffsetX * -0.55, opacity: 0.86, transition: { duration: transitionProfile.exitDuration } },
          }}
        />
      </motion.div>

      <motion.div
        className="relative z-0 min-h-screen"
        variants={{
          initial: { opacity: 0.08 },
          animate: { opacity: 1, transition: { duration: transitionProfile.enterDuration, ease: [0.22, 1, 0.36, 1] } },
          exit: { opacity: 0.04, transition: { duration: transitionProfile.exitDuration, ease: [0.4, 0, 0.2, 1] } },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function RootRedirect() {
  const location = useLocation();

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

function LegacyProjectRedirect() {
  const location = useLocation();
  const { id } = useParams();
  const hasProject = Boolean(id && portfolioProfiles[defaultProfileSlug].projects.some((project) => project.id === id));

  return (
    <Navigate
      replace
      to={{
        pathname: hasProject && id ? getProfileProjectPath(defaultProfileSlug, id) : getProfileHomePath(defaultProfileSlug),
        search: location.search,
        hash: location.hash,
      }}
    />
  );
}

function AppRoutes() {
  const location = useLocation();
  const currentRouteKind = useMemo(() => getRouteKind(location.pathname), [location.pathname]);
  const previousRouteKindRef = useRef<RouteKind>(currentRouteKind);
  const transitionProfile = useMemo(
    () => getRouteTransitionProfile(previousRouteKindRef.current, currentRouteKind, location.pathname),
    [currentRouteKind, location.pathname]
  );

  useEffect(() => {
    previousRouteKindRef.current = currentRouteKind;
  }, [currentRouteKind, location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <RouteStage key={location.pathname} transitionProfile={transitionProfile}>
        <Routes location={location}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/project/:id" element={<LegacyProjectRedirect />} />
          <Route path="/:profileSlug" element={<Home />} />
          <Route path="/:profileSlug/project/:id" element={<ProjectDetail />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </RouteStage>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router basename={routerBase}>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
