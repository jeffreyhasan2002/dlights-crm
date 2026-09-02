"use client";

import * as React from "react";

interface DlightsLoaderProps {
  label?: string;
  subtitle?: string;
  fullscreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DlightsLoader({
  label = "Loading Dlight Studios...",
  subtitle = "Preparing photography workspace",
  fullscreen = false,
  size = "md",
}: DlightsLoaderProps) {
  const sizeMap = {
    sm: { icon: "h-10 w-10", ring: "h-14 w-14", text: "text-xs", sub: "text-[10px]" },
    md: { icon: "h-14 w-14", ring: "h-20 w-20", text: "text-sm", sub: "text-xs" },
    lg: { icon: "h-20 w-20", ring: "h-28 w-28", text: "text-base", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center select-none animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing ambient aura */}
        <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-xl animate-pulse" />

        {/* Minimal rotating gradient ring */}
        <div
          className={`absolute ${currentSize.ring} rounded-full border border-transparent border-t-primary border-r-primary/40 animate-spin-slow`}
        />

        {/* Dlight Studios Branded Icon */}
        <div
          className={`relative ${currentSize.icon} flex items-center justify-center rounded-2xl bg-background/90 shadow-md border border-border/80 backdrop-blur-md p-2.5 animate-dlight-pulse`}
        >
          <img
            src="/logo.svg"
            alt="Dlight Studios"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Typography & Minimal Progress Bar */}
      <div className="flex flex-col items-center space-y-1.5 max-w-xs">
        <h4 className={`font-semibold tracking-tight text-foreground ${currentSize.text}`}>
          {label}
        </h4>
        {subtitle && (
          <p className={`text-muted-foreground font-normal leading-tight ${currentSize.sub}`}>
            {subtitle}
          </p>
        )}

        {/* Sleek ultra-thin shimmering line */}
        <div className="w-28 h-1 rounded-full bg-muted overflow-hidden mt-1 relative">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[300px] w-full flex-1 items-center justify-center p-6">
      {content}
    </div>
  );
}
