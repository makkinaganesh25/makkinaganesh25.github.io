/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Github, Linkedin, Mail, FileText, Menu, X } from "lucide-react";
import { useState, useEffect, type MouseEvent, type ReactNode } from "react";
import type { PortfolioData, ProfileSlug } from "../data/portfolioData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getEmailComposeUrl } from "../utils/contact";
import { getProfileHashPath, getProfileHomePath } from "../utils/profileRoutes";
import { createHomeRestoreState, hasHomeScrollSnapshot, type PortfolioRouteState } from "../utils/homeScrollState";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const HOME_NAV_SCROLL_REQUEST_EVENT = "portfolio-home-nav-request";

function useProfileNavLinks(profileSlug: ProfileSlug) {
  return [
    { name: "Home", path: getProfileHomePath(profileSlug) },
    { name: "Projects", path: getProfileHashPath(profileSlug, "projects"), hash: "#projects" },
    { name: "Experience", path: getProfileHashPath(profileSlug, "experience"), hash: "#experience" },
    { name: "Education", path: getProfileHashPath(profileSlug, "education"), hash: "#education" },
    { name: "Get in Touch", path: getProfileHashPath(profileSlug, "contact"), hash: "#contact" },
  ];
}

export function Navbar({
  profileSlug,
  portfolioData,
}: {
  profileSlug: ProfileSlug;
  portfolioData: PortfolioData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navLinks = useProfileNavLinks(profileSlug);
  const homePath = getProfileHomePath(profileSlug);
  const canRestoreHomeScroll = location.pathname !== homePath && hasHomeScrollSnapshot(profileSlug);

  useEffect(() => {
    if (location.pathname === homePath) {
      setScrolled(false);
      return;
    }

    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [homePath, location.pathname]);

  const isActiveLink = (hash?: string) => {
    if (location.pathname !== homePath) {
      return false;
    }

    if (!hash) {
      return !location.hash;
    }

    return location.hash === hash;
  };

  const homeRestoreState: PortfolioRouteState | undefined = canRestoreHomeScroll
    ? createHomeRestoreState({ profileSlug, reason: "detail-home-nav" })
    : undefined;
  const projectsRestoreState: PortfolioRouteState | undefined = canRestoreHomeScroll
    ? createHomeRestoreState({ profileSlug, reason: "detail-projects-nav" })
    : undefined;

  const getNavDestination = (link: { name: string; path: string; hash?: string }) => {
    if (!canRestoreHomeScroll) {
      return { to: link.path, state: undefined as PortfolioRouteState | undefined };
    }

    if (link.name === "Home") {
      return { to: homePath, state: homeRestoreState };
    }

    if (link.name === "Projects") {
      return { to: homePath, state: projectsRestoreState };
    }

    return { to: link.path, state: undefined as PortfolioRouteState | undefined };
  };

  const handleNavLinkClick = (
    link: { name: string; path: string; hash?: string },
    destination: { to: string; state: PortfolioRouteState | undefined },
    onAfterClick?: () => void
  ) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      onAfterClick?.();

      if (location.pathname !== homePath || !link.hash) {
        return;
      }

      event.preventDefault();
      const sectionId = link.hash.replace(/^#/, "");

      if (location.hash === link.hash) {
        window.dispatchEvent(new CustomEvent(HOME_NAV_SCROLL_REQUEST_EVENT, { detail: { sectionId } }));
        return;
      }

      navigate(destination.to, { state: destination.state });
    };

  return (
    <nav
      data-site-navbar
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-black border-b border-white/10",
        scrolled ? "py-4" : "py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link
          to={homePath}
          state={homeRestoreState}
          className="text-xl font-bold tracking-tighter text-white"
        >
          {portfolioData.personal.name.split(" ")[0]}
          <span className="text-emerald-500">.</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            (() => {
              const destination = getNavDestination(link);

              return (
                <Link
                  key={link.name}
                  to={destination.to}
                  state={destination.state}
                  onClick={handleNavLinkClick(link, destination)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-emerald-400",
                    isActiveLink(link.hash) ? "text-emerald-400" : "text-gray-400"
                  )}
                >
                  {link.name}
                </Link>
              );
            })()
          ))}
          <a
            href={portfolioData.personal.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-emerald-500 hover:text-white transition-all"
          >
            Resume
          </a>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button className="text-white" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-black border-b border-white/10 py-8 px-6 flex flex-col space-y-6 md:hidden"
          >
            {navLinks.map((link) => (
              (() => {
                const destination = getNavDestination(link);

                return (
                  <Link
                    key={link.name}
                    to={destination.to}
                    state={destination.state}
                    className="text-lg font-medium text-gray-300"
                    onClick={handleNavLinkClick(link, destination, () => setIsOpen(false))}
                  >
                    {link.name}
                  </Link>
                );
              })()
            ))}
            <a
              href={portfolioData.personal.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-emerald-400"
              onClick={() => setIsOpen(false)}
            >
              Resume
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function Footer({ portfolioData }: { portfolioData: PortfolioData }) {
  return (
    <footer className="w-full border-t border-white/8 bg-black px-6 py-6 md:py-5">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold tracking-tight text-white">{portfolioData.personal.name}</h3>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">{portfolioData.footer.tagline}</p>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-2 text-gray-400">
          <a
            href={portfolioData.personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 transition-colors hover:text-white"
          >
            <Github size={16} />
          </a>
          <a
            href={portfolioData.personal.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 transition-colors hover:text-white"
          >
            <Linkedin size={16} />
          </a>
          <a
            href={getEmailComposeUrl(portfolioData.personal.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 transition-colors hover:text-white"
          >
            <Mail size={16} />
          </a>
          <a
            href={portfolioData.personal.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 transition-colors hover:text-white"
          >
            <FileText size={16} />
          </a>
        </div>

        <div className="text-center text-[11px] font-medium tracking-[0.08em] text-gray-600 md:text-right">
          © {new Date().getFullYear()} {portfolioData.personal.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Layout({
  children,
  profileSlug,
  portfolioData,
}: {
  children: ReactNode;
  profileSlug: ProfileSlug;
  portfolioData: PortfolioData;
}) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-white font-sans">
      <Navbar profileSlug={profileSlug} portfolioData={portfolioData} />
      <main>{children}</main>
    </div>
  );
}
