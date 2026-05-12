/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from "@react-three/fiber";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Gauge,
  type LucideIcon,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Waypoints,
  Workflow,
} from "lucide-react";
import { useEffect, type ComponentType, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { AmbientParticles, SceneLights } from "../components/3d/Common";
import {
  DataAnalystScene,
  DataEngineerScene,
  DataScientistScene,
  SoftwareEngineerScene,
} from "../components/3d/ProjectScenes";
import { Footer, Layout } from "../components/Layout";
import { defaultProfileSlug, isProfileSlug, portfolioProfiles, type ProfileSlug } from "../data/portfolioData";
import { getProfileHashPath, getProfileHomePath, getProfileProjectPath } from "../utils/profileRoutes";
import {
  createHomeRestoreState,
  createCaseStudyEntryState,
  getCaseStudyEntryState,
  markPendingHomeRestore,
} from "../utils/homeScrollState";

type DetailTheme = {
  accentHex: string;
  secondaryHex: string;
  ambientHex: string;
  eyebrow: string;
  strapline: string;
  scene: ComponentType;
};

const detailThemes: Record<ProfileSlug, DetailTheme> = {
  dataengineer: {
    accentHex: "#f59e0b",
    secondaryHex: "#34d399",
    ambientHex: "#34d399",
    eyebrow: "Data Platform Case Study",
    strapline: "Pipeline design, warehouse discipline, and delivery reliability built for repeated operational use.",
    scene: DataEngineerScene,
  },
  softwareengineer: {
    accentHex: "#38bdf8",
    secondaryHex: "#22d3ee",
    ambientHex: "#22d3ee",
    eyebrow: "Software Engineering Case Study",
    strapline: "Application architecture, backend execution, and release-ready workflows shaped into dependable systems.",
    scene: SoftwareEngineerScene,
  },
  datascientist: {
    accentHex: "#c084fc",
    secondaryHex: "#f472b6",
    ambientHex: "#d946ef",
    eyebrow: "Data Science Case Study",
    strapline: "Modeling, validation, and monitoring choices surfaced as a system, not just an experiment.",
    scene: DataScientistScene,
  },
  datanalyst: {
    accentHex: "#14b8a6",
    secondaryHex: "#f59e0b",
    ambientHex: "#5eead4",
    eyebrow: "Analytics Case Study",
    strapline: "Analytical framing, KPI clarity, and dashboard delivery built to support real stakeholder decisions.",
    scene: DataAnalystScene,
  },
};

function rgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => `${char}${char}`).join("") : value;
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  accentHex,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  accentHex: string;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400">
        <Icon size={14} style={{ color: accentHex }} />
        <span>{eyebrow}</span>
      </div>
      <div className="max-w-3xl space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
        <p className="text-base leading-relaxed text-gray-400 md:text-lg">{description}</p>
      </div>
    </div>
  );
}

function AccentPanel({
  children,
  accentHex,
  className = "",
}: {
  children: ReactNode;
  accentHex: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.9rem] border bg-zinc-950/72 p-6 backdrop-blur-xl md:p-7 ${className}`}
      style={{
        borderColor: rgba(accentHex, 0.16),
        boxShadow: `0 24px 90px ${rgba(accentHex, 0.08)}`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${rgba(accentHex, 0.75)}, transparent)` }}
      />
      {children}
    </div>
  );
}

export default function ProjectDetail() {
  const { id, profileSlug: profileSlugParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hasValidProfileSlug = isProfileSlug(profileSlugParam);
  const profileSlug = hasValidProfileSlug ? profileSlugParam : defaultProfileSlug;
  const portfolioData = portfolioProfiles[profileSlug];
  const projectIndex = portfolioData.projects.findIndex((entry) => entry.id === id);
  const project = projectIndex >= 0 ? portfolioData.projects[projectIndex] : null;
  const nextProject = project ? portfolioData.projects[(projectIndex + 1) % portfolioData.projects.length] : null;
  const theme = detailThemes[profileSlug];
  const Scene = theme.scene;
  const flowSteps = project ? project.flow.split(" -> ").map((step) => step.trim()).filter(Boolean) : [];
  const caseStudyEntryState = getCaseStudyEntryState(location.state);
  const enteredFromHome = caseStudyEntryState?.profileSlug === profileSlug && caseStudyEntryState.previousRouteKind === "home";

  const backToProjects = () => {
    if (enteredFromHome) {
      navigate(getProfileHashPath(profileSlug, "projects"), {
        replace: true,
        state: createHomeRestoreState({
          profileSlug,
          sourceProjectId: caseStudyEntryState?.sourceProjectId ?? project?.id,
          reason: "detail-back",
        }),
      });
      return;
    }

    navigate(getProfileHashPath(profileSlug, "projects"));
  };

  const nextProjectState =
    nextProject &&
    createCaseStudyEntryState({
      profileSlug,
      sourceProjectId: caseStudyEntryState?.sourceProjectId ?? project?.id ?? nextProject.id,
      previousRouteKind: "detail",
    });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [profileSlug, id]);

  useEffect(() => {
    if (!project) return;
    if (caseStudyEntryState?.profileSlug !== profileSlug) return;

    markPendingHomeRestore({
      profileSlug,
      sourceProjectId: caseStudyEntryState.sourceProjectId,
      reason: "case-study-entry",
      requestedAt: Date.now(),
    });
  }, [caseStudyEntryState, profileSlug, project]);

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

  if (!project || !nextProject) {
    return <Navigate replace to={getProfileHomePath(profileSlug)} />;
  }

  return (
    <Layout profileSlug={profileSlug} portfolioData={portfolioData}>
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="absolute inset-0">
            <Canvas camera={{ position: [0, 0, 6.4], fov: 52 }}>
              <fog attach="fog" args={["#050505", 7, 16]} />
              <SceneLights />
              <AmbientParticles count={920} color={theme.ambientHex} />
              <Scene />
            </Canvas>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_32%)]" />
            <div
              className="absolute inset-x-0 top-0 h-[42vh]"
              style={{ background: `radial-gradient(circle at top, ${rgba(theme.accentHex, 0.22)}, transparent 68%)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-6 pb-14 pt-32 md:pb-16 xl:pb-18">
            <button
              type="button"
              onClick={backToProjects}
              className="mb-8 inline-flex items-center text-sm font-bold uppercase tracking-[0.24em] text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" /> Back to Projects
            </button>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_360px] xl:items-end">
              <div className="max-w-4xl">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.26em]"
                    style={{
                      color: theme.accentHex,
                      borderColor: rgba(theme.accentHex, 0.24),
                      backgroundColor: rgba(theme.accentHex, 0.1),
                    }}
                  >
                    {theme.eyebrow}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.26em] text-gray-400">
                    {project.typeLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.26em] text-gray-400">
                    {project.domain}
                  </span>
                </div>

                <h1 className="max-w-5xl text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-white md:text-7xl xl:text-[5.6rem]">
                  {project.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">{project.summary}</p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-500 md:text-base">{theme.strapline}</p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <AccentPanel accentHex={theme.accentHex} className="p-5 md:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Role Lens</p>
                    <p className="mt-3 text-lg font-semibold text-white">{project.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">{portfolioData.personal.headline}</p>
                  </AccentPanel>
                  <AccentPanel accentHex={theme.accentHex} className="p-5 md:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Business Stakes</p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300">{project.stakes}</p>
                  </AccentPanel>
                  <AccentPanel accentHex={theme.accentHex} className="p-5 md:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Core Stack</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span key={tech} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </AccentPanel>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {project.impactMetrics.map((metric) => (
                  <AccentPanel key={metric.label} accentHex={theme.secondaryHex} className="min-h-[148px] p-5 md:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">{metric.value}</p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-400">{metric.detail}</p>
                  </AccentPanel>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-20 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-24 h-64 w-64 rounded-full blur-[140px]"
            style={{ backgroundColor: rgba(theme.accentHex, 0.12) }}
          />
          <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1.12fr)_360px]">
            <div className="space-y-10">
              <ScrollReveal className="space-y-6">
                <SectionHeading
                  icon={Target}
                  eyebrow="Problem Framing"
                  title="Problem, stakes, and role fit."
                  description="What the system had to solve, why the work mattered, and where the role-specific engineering judgment shows up."
                  accentHex={theme.accentHex}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                  <AccentPanel accentHex={theme.accentHex}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">The Problem</p>
                    <p className="mt-4 text-base leading-relaxed text-gray-300">{project.problem}</p>
                  </AccentPanel>
                  <AccentPanel accentHex={theme.secondaryHex}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Why It Mattered</p>
                    <p className="mt-4 text-base leading-relaxed text-gray-300">{project.stakes}</p>
                  </AccentPanel>
                </div>
              </ScrollReveal>

              <ScrollReveal className="space-y-6">
                <SectionHeading
                  icon={Radar}
                  eyebrow="Context and Ownership"
                  title="Context and direct ownership."
                  description="Concrete scope, delivery context, and the parts of the system I directly carried."
                  accentHex={theme.accentHex}
                />
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                  <AccentPanel accentHex={theme.accentHex}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Project Context</p>
                    <p className="mt-4 text-base leading-relaxed text-gray-300">{project.context}</p>
                  </AccentPanel>
                  <AccentPanel accentHex={theme.secondaryHex}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Role Ownership</p>
                    <ul className="mt-4 space-y-4">
                      {project.ownership.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-gray-300">
                          <ShieldCheck size={16} className="mt-0.5 shrink-0" style={{ color: theme.secondaryHex }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccentPanel>
                </div>
              </ScrollReveal>

              <ScrollReveal className="space-y-6">
                <SectionHeading
                  icon={Waypoints}
                  eyebrow="Architecture and Flow"
                  title="Architecture and workflow path."
                  description="How data, users, services, and operational decisions move through the system."
                  accentHex={theme.accentHex}
                />
                <AccentPanel accentHex={theme.accentHex}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Architecture Overview</p>
                  <p className="mt-4 text-base leading-relaxed text-gray-300">{project.architecture}</p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {flowSteps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5"
                        style={{ boxShadow: `0 20px 50px ${rgba(theme.accentHex, 0.06)}` }}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold uppercase tracking-[0.16em]"
                            style={{
                              color: theme.accentHex,
                              backgroundColor: rgba(theme.accentHex, 0.12),
                              border: `1px solid ${rgba(theme.accentHex, 0.22)}`,
                            }}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {index < flowSteps.length - 1 ? <ArrowRight size={16} className="text-gray-600" /> : <CheckCircle2 size={16} className="text-gray-500" />}
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-gray-200">{step}</p>
                      </div>
                    ))}
                  </div>
                </AccentPanel>
              </ScrollReveal>

              <ScrollReveal className="space-y-6">
                <SectionHeading
                  icon={Workflow}
                  eyebrow="Implementation"
                  title="Implementation choices."
                  description="The practical engineering moves, data-model choices, and delivery decisions behind the result."
                  accentHex={theme.accentHex}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="grid gap-4">
                    {project.implementation.map((detail, index) => (
                      <AccentPanel key={detail} accentHex={theme.accentHex}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Implementation {index + 1}</p>
                        <p className="mt-4 text-sm leading-relaxed text-gray-300">{detail}</p>
                      </AccentPanel>
                    ))}
                  </div>
                  <div className="grid gap-4">
                    {project.decisions.map((decision) => (
                      <AccentPanel key={decision.title} accentHex={theme.secondaryHex}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">{decision.title}</p>
                        <p className="mt-4 text-sm leading-relaxed text-gray-300">{decision.detail}</p>
                      </AccentPanel>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="space-y-6 xl:pt-1 2xl:sticky 2xl:top-28 2xl:self-start">
              <ScrollReveal>
                <AccentPanel accentHex={theme.accentHex}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Goals</p>
                  <ul className="mt-4 space-y-4">
                    {project.goals.map((goal) => (
                      <li key={goal} className="flex items-start gap-3 text-sm leading-relaxed text-gray-300">
                        <Target size={16} className="mt-0.5 shrink-0" style={{ color: theme.accentHex }} />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </AccentPanel>
              </ScrollReveal>

              <ScrollReveal>
                <AccentPanel accentHex={theme.secondaryHex}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Technical Foundation</p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </AccentPanel>
              </ScrollReveal>

              <ScrollReveal>
                <AccentPanel accentHex={theme.secondaryHex}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Constraints Navigated</p>
                  <ul className="mt-4 space-y-4">
                    {project.challenges.map((challenge) => (
                      <li key={challenge} className="flex items-start gap-3 text-sm leading-relaxed text-gray-300">
                        <Gauge size={16} className="mt-0.5 shrink-0" style={{ color: theme.secondaryHex }} />
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </AccentPanel>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl space-y-6">
            <ScrollReveal className="space-y-6">
              <SectionHeading
                icon={Sparkles}
                eyebrow="Outcomes and Signal"
                title="Outcomes and hiring signal."
                description="Evidence of shipping, scale, or performance, plus the engineering judgment the work demonstrates."
                accentHex={theme.accentHex}
              />
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
                <div className="grid gap-4 md:grid-cols-3">
                  {project.outcomes.map((outcome, index) => (
                    <AccentPanel key={outcome} accentHex={index % 2 === 0 ? theme.accentHex : theme.secondaryHex} className="min-h-[220px]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">Outcome {index + 1}</span>
                        <CheckCircle2 size={18} style={{ color: index % 2 === 0 ? theme.accentHex : theme.secondaryHex }} />
                      </div>
                      <p className="mt-4 text-base leading-relaxed text-white">{outcome}</p>
                    </AccentPanel>
                  ))}
                </div>

                <AccentPanel accentHex={theme.secondaryHex}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500">What This Signals</p>
                  <ul className="mt-4 space-y-4">
                    {project.lessons.map((lesson) => (
                      <li key={lesson} className="flex items-start gap-3 text-sm leading-relaxed text-gray-300">
                        <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: theme.secondaryHex }} />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </AccentPanel>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-t border-white/8 bg-zinc-950/78 px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-500">Next Case Study</p>
              <Link
                to={getProfileProjectPath(profileSlug, nextProject.id)}
                state={nextProjectState}
                className="mt-4 inline-block text-4xl font-bold tracking-[-0.04em] text-white transition-colors hover:text-white/80 md:text-6xl"
              >
                {nextProject.title}
              </Link>
              <p className="mt-4 text-base leading-relaxed text-gray-400">
                Continue through the {theme.eyebrow.toLowerCase()} track without leaving the active profile path.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href={portfolioData.personal.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-black transition-all hover:scale-[1.01] hover:bg-white/90"
              >
                <FileText size={16} className="mr-2" /> Resume
              </a>
              <Link
                to={getProfileHashPath(profileSlug, "contact")}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white transition-all hover:scale-[1.01] hover:bg-white/10"
              >
                Get In Touch <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        <Footer portfolioData={portfolioData} />
    </Layout>
  );
}
