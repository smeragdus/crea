"use client";

import { Plus } from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";

const EASE_OUT_EXPO = [0.23, 1, 0.32, 1] as const;

export function LandingMotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-[#0b4ac9] via-[#ffc400] to-[#9a3b22] motion-reduce:hidden"
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroPhotoStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3.5, -3.5]), {
    stiffness: 120,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 120,
    damping: 18,
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.1]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handlePointerLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative [perspective:1200px]"
    >
      <motion.figure
        style={{ rotateX, rotateY }}
        initial={{ opacity: 0, clipPath: "inset(8% 0% 8% 0% round 28px)" }}
        animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 28px)" }}
        transition={{ duration: 0.9, delay: 0.12, ease: EASE_OUT_EXPO }}
        className="relative overflow-hidden rounded-[28px] bg-[#1e1512] shadow-[0_36px_80px_-32px_rgba(10,26,60,0.38)]"
      >
        <div className="relative aspect-[4/4.35] w-full overflow-hidden sm:aspect-[4/4.25]">
          <motion.div
            style={{ y: imageY, scale: imageScale }}
            className="relative h-full w-full will-change-transform"
          >
            <Image
              src="/restaurante-cajamarca.webp"
              alt="Emprendedora gastronómica tomando notas en su restaurante tradicional en Cajamarca"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1023px) 100vw, 44vw"
            />
          </motion.div>
        </div>
      </motion.figure>
    </div>
  );
}

export function ClipRevealCajamarca() {
  return (
    <motion.div
      initial={{ clipPath: "inset(10% 0% 10% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="relative min-h-72 overflow-hidden bg-[#d8e4f2] lg:min-h-[24rem]"
    >
      <motion.div
        initial={{ scale: 1.2 }}
        whileInView={{ scale: 1.1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
        className="relative h-full min-h-72 w-full lg:min-h-[24rem]"
      >
        <Image
          src="/cajamarca-plaza.jpg"
          alt="Vista de la Plaza de Armas y la Catedral de Cajamarca"
          fill
          className="object-cover object-[35%_30%]"
          sizes="(max-width: 1023px) 100vw, 46vw"
        />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedFaqList({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3.5">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div
            key={item.question}
            className={`rounded-2xl border transition-all duration-200 ${
              isOpen
                ? "border-[#bfd4f8] bg-white shadow-[0_14px_34px_-18px_rgba(11,74,201,0.2)]"
                : "border-[#e5dfd3] bg-[#faf8f4] hover:border-[#c9d4e8] hover:bg-white"
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex min-h-[4.25rem] w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="landing-display text-lg font-bold leading-snug text-[#0a1a3c] transition-colors group-hover:text-[#0b4ac9] sm:text-xl">
                  {item.question}
                </span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${
                    isOpen
                      ? "bg-[#0b4ac9] text-white"
                      : "bg-[#e8f0fe] text-[#0b4ac9] group-hover:bg-[#d8e6fd]"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0, filter: "blur(2px)" }}
                  animate={{ height: "auto", opacity: 1, filter: "blur(0px)" }}
                  exit={{ height: 0, opacity: 0, filter: "blur(2px)" }}
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-6 pb-6 pt-0.5 text-base leading-[1.7] text-[#3b4b6b]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
