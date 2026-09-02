import * as React from "react";
import Link from "next/link";
import { Camera, LayoutGrid, CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export function LoginLayoutV1() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left 1/3 Studio Brand Column */}
      <div className="hidden lg:flex lg:w-1/3 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 shadow-xs">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Dlight Studios</span>
            <p className="text-xs text-primary-foreground/70">Photography & Wedding CRM</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/60">
              Studio Suite
            </span>
            <h1 className="font-light text-4xl leading-tight">
              Hello again
            </h1>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Login to continue managing your client pipeline, wedding shoots, and quotation proposals.
            </p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-primary-foreground/15 text-xs text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Pipeline & Kanban Board</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Proposals & Invoicing in INR (₹)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Event Schedules & Call Sheets</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-primary-foreground/60 flex items-center justify-between border-t border-primary-foreground/15 pt-4">
          <span>Dlight Studios • Layout V1</span>
          <Link href="/login?layout=v2" className="underline hover:text-primary-foreground">
            Switch to Layout V2
          </Link>
        </div>
      </div>

      {/* Right 2/3 Clean Auth Viewport */}
      <div className="flex flex-1 flex-col justify-between p-6 md:p-12 lg:w-2/3 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Camera className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm">Dlight Studios</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login?layout=v2"
              className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Layout V2</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm py-8 space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Login
            </h2>
            <p className="text-xs text-muted-foreground">
              Welcome back. Enter your email and password to sign in.
            </p>
          </div>

          <LoginForm />
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Dlight Studios. All rights reserved.
        </div>
      </div>
    </div>
  );
}
