"use client";

import Link from "next/link";
import { useRef } from "react";

type Props = {
  href?: string;
  children?: React.ReactNode;
};

export function CtaSubmitButton({ href = "/submit", children = "Submit a tool" }: Props) {
  const btnRef = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spotlight-x", `${x}%`);
    el.style.setProperty("--spotlight-y", `${y}%`);
  }

  function handleMouseLeave() {
    const el = btnRef.current;
    if (!el) return;
    el.style.setProperty("--spotlight-x", "50%");
    el.style.setProperty("--spotlight-y", "50%");
  }

  return (
    <Link
      ref={btnRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="cta-spotlight mt-3 inline-flex w-full items-center justify-center rounded-lg border border-accent/60 bg-gradient-to-b from-[#00ff9f] to-[#00d986] px-4 py-2 text-sm font-semibold text-on-accent shadow-[0_0_0_1px_rgba(0,255,159,0.35),0_10px_28px_-10px_rgba(0,255,159,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition duration-[120ms] hover:-translate-y-px active:translate-y-0"
    >
      {children}
    </Link>
  );
}
