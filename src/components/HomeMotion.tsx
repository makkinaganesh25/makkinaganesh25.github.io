import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { type CSSProperties, type ReactNode, type RefObject, useRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ScrollRevealVariant = "panel" | "card" | "chip" | "timeline" | "metric" | "contactRow";
export type ScrollRevealTone = "emerald" | "blue" | "amber" | "violet" | "scarlet" | "neutral";

type ScrollRevealElement = "div" | "article" | "section" | "aside" | "span" | "li";

type VariantConfig = {
  amount: number;
  entryY: number;
  entryScale: number;
  blur: number;
  parallax: number;
  rotate: number;
};

const variantConfig: Record<ScrollRevealVariant, VariantConfig> = {
  panel: { amount: 0.22, entryY: 18, entryScale: 0.99, blur: 0, parallax: 0, rotate: 0 },
  card: { amount: 0.24, entryY: 20, entryScale: 0.988, blur: 0, parallax: 0, rotate: 0 },
  chip: { amount: 0.35, entryY: 8, entryScale: 0.992, blur: 0, parallax: 0, rotate: 0 },
  timeline: { amount: 0.25, entryY: 22, entryScale: 0.988, blur: 0, parallax: 0, rotate: 0 },
  metric: { amount: 0.3, entryY: 14, entryScale: 0.99, blur: 0, parallax: 0, rotate: 0 },
  contactRow: { amount: 0.34, entryY: 10, entryScale: 0.994, blur: 0, parallax: 0, rotate: 0 },
};

const motionElements: Record<ScrollRevealElement, typeof motion.div> = {
  div: motion.div,
  article: motion.article as unknown as typeof motion.div,
  section: motion.section as unknown as typeof motion.div,
  aside: motion.aside as unknown as typeof motion.div,
  span: motion.span as unknown as typeof motion.div,
  li: motion.li as unknown as typeof motion.div,
};

const springConfig = { stiffness: 75, damping: 28, mass: 0.85 };
const ENABLE_SCROLL_PARALLAX = false;

function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(clsx(classes));
}

export type ScrollRevealTileProps = {
  as?: ScrollRevealElement;
  index?: number;
  variant?: ScrollRevealVariant;
  tone?: ScrollRevealTone;
  viewportRoot?: RefObject<Element | null>;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  delay?: number;
  sceneAnchor?: string;
  style?: CSSProperties;
};

function ScrollRevealParallax({
  as,
  children,
  config,
  root,
  targetRef,
  contentClassName,
}: {
  as: ScrollRevealElement;
  children: ReactNode;
  config: VariantConfig;
  root?: RefObject<Element | null>;
  targetRef: RefObject<HTMLElement | null>;
  contentClassName?: string;
}) {
  const InnerElement = as === "span" ? motion.span : motion.div;
  const { scrollYProgress } = useScroll({
    target: targetRef as RefObject<HTMLElement>,
    container: root as RefObject<HTMLElement> | undefined,
    offset: ["start end", "end start"],
  });

  const parallaxY = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [config.parallax, 0, -config.parallax]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [config.rotate, 0, -config.rotate]), springConfig);
  const rotateY = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [-config.rotate * 0.55, 0, config.rotate * 0.55]), springConfig);
  const depthScale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.998, 1.003, 0.999]), springConfig);

  return (
    <InnerElement
      className={cn(as === "span" ? "inline-flex h-full w-full" : "h-full", contentClassName)}
      style={{
        y: parallaxY,
        rotateX: config.rotate > 0 ? rotateX : 0,
        rotateY: config.rotate > 0 ? rotateY : 0,
        scale: depthScale,
        transformPerspective: config.rotate > 0 ? 1200 : undefined,
      }}
    >
      {children}
    </InnerElement>
  );
}

export function ScrollRevealTile({
  as = "div",
  index = 0,
  variant = "card",
  tone = "emerald",
  viewportRoot,
  className,
  contentClassName,
  children,
  delay,
  sceneAnchor,
  style,
}: ScrollRevealTileProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const config = variantConfig[variant];
  const MotionElement = motionElements[as];
  const root = viewportRoot ?? undefined;
  const isInView = useInView(ref, { root, once: true, amount: config.amount });
  const parallaxEnabled = ENABLE_SCROLL_PARALLAX && !prefersReducedMotion && config.parallax > 0;
  const InnerFallbackElement = as === "span" ? "span" : "div";

  const revealDelay = delay ?? Math.min(index * 0.045, 0.32);
  const visible = Boolean(isInView);
  const reducedReveal = prefersReducedMotion
    ? {
        opacity: visible ? 1 : 0,
        filter: "none",
        scale: 1,
        y: 0,
      }
    : undefined;

  const revealState = reducedReveal ?? {
    opacity: visible ? 1 : 0,
    y: visible ? 0 : config.entryY,
    scale: visible ? 1 : config.entryScale,
    ...(config.blur > 0 ? { filter: visible ? "none" : `blur(${config.blur}px)` } : {}),
  };

  return (
    <MotionElement
      ref={ref as unknown as RefObject<HTMLDivElement>}
      data-home-reveal-tile={variant}
      data-home-reveal-tone={tone}
      data-home-scene-anchor={sceneAnchor}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: config.entryY, scale: config.entryScale, ...(config.blur > 0 ? { filter: `blur(${config.blur}px)` } : {}) }}
      animate={revealState}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 0.36,
        ease: [0.16, 1, 0.3, 1],
        delay: visible ? revealDelay : 0,
      }}
      className={cn("home-reveal-tile", className)}
      style={{ willChange: visible ? "auto" : "opacity, transform", ...style }}
    >
      {parallaxEnabled ? (
        <ScrollRevealParallax
          as={as}
          config={config}
          root={root}
          targetRef={ref}
          contentClassName={contentClassName}
        >
          {children}
        </ScrollRevealParallax>
      ) : (
        <InnerFallbackElement className={cn(as === "span" ? "inline-flex h-full w-full" : "h-full", contentClassName)}>
          {children}
        </InnerFallbackElement>
      )}
    </MotionElement>
  );
}
