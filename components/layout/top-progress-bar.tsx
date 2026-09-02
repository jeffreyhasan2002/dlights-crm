"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept link clicks to start instant progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank"
      ) {
        return;
      }

      const currentPath = window.location.pathname + window.location.search;
      if (href === currentPath) return;

      setLoading(true);
      setProgress(25);

      const t1 = setTimeout(() => setProgress(65), 100);
      const t2 = setTimeout(() => setProgress(85), 300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all ease-out duration-200"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionDuration: progress === 100 ? "200ms" : "300ms",
        }}
      />
    </div>
  );
}
