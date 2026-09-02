import * as React from "react";
import { Globe, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Separator } from "@/components/ui/separator";

export function LoginLayoutV2() {
  return (
    <main className="h-screen min-h-dvh w-full overflow-hidden bg-background">
      <div className="grid h-full justify-center p-2 lg:grid-cols-2">
        {/* Left Full-Height Photography Brand Column */}
        <div className="relative order-2 hidden h-full flex-col justify-between rounded-3xl bg-zinc-950 p-10 text-white lg:flex overflow-hidden">
          {/* Photography Hero Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />

          {/* Top Brand Info with PNG Logo */}
          <div className="relative z-10 flex items-center gap-3 px-4 pt-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-md">
              <img
                src="/favicon/android-chrome-192x192.png"
                alt="Dlight Studios Logo"
                className="h-full w-full object-contain rounded-xl"
              />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">Dlight Studios</h1>
              <p className="text-xs text-zinc-400">Photography & Wedding Client Management</p>
            </div>
          </div>

          {/* Center Quote */}
          <div className="relative z-10 max-w-lg px-4 my-auto space-y-4">
            <blockquote className="text-2xl font-light leading-relaxed tracking-tight text-zinc-100">
              “To photograph is to hold one's breath, when all faculties converge to face a fleeting reality.”
            </blockquote>
            <p className="text-xs text-zinc-400 font-medium">
              — Henri Cartier-Bresson
            </p>
          </div>

          {/* Bottom Information */}
          <div className="relative z-10 flex w-full justify-between px-4 text-xs text-zinc-400">
            <div className="flex-1 space-y-1">
              <h2 className="font-medium text-white">Studio Platform</h2>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Streamlined enquiry workflows, quotations, and shoot schedules for wedding cinematographers.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-4 h-auto bg-white/20" />
            <div className="flex-1 space-y-1">
              <h2 className="font-medium text-white">Studio Security</h2>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Secured by PostgreSQL Row Level Security (RLS) & Supabase Authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Right Full-Height Form Column */}
        <div className="relative order-1 flex h-full flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 p-1 border border-primary/20 shadow-2xs">
                <img
                  src="/favicon/android-chrome-192x192.png"
                  alt="Dlight Studios Logo"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none text-foreground">Dlight Studios</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Photography CRM</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Secure Portal</span>
            </div>
          </div>

          {/* Centered Sign In Card */}
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[360px]">
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Login to your account
              </h1>
              <p className="text-xs text-muted-foreground">
                Please enter your studio credentials to sign in.
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Bottom Copyright */}
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} Dlight Studios</div>
            <div className="flex items-center gap-1 text-xs">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span>ENG</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
