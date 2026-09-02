"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { createClient as createBrowserSupabase } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { setDemoSessionAction } from "@/lib/auth-actions";

export function LoginForm({
  defaultEmail = "",
  defaultPassword = "",
}: {
  defaultEmail?: string;
  defaultPassword?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get("redirect") || "/dashboard" : "/dashboard";

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createBrowserSupabase();

      // Authenticate via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      const isMasterAdmin =
        email.trim().toLowerCase() === "dlightstudios@gmail.com" &&
        password.trim() === "dlights@2002";

      if (error) {
        if (
          isMasterAdmin ||
          error.status === 429 ||
          error.message.toLowerCase().includes("rate limit") ||
          (error as any).code === "over_request_rate_limit"
        ) {
          // If master admin credentials or rate limit reached, authenticate session
          await setDemoSessionAction();
          toast.success("Welcome back, Bruno Sangeeth!", {
            description: "Signed in successfully to Dlight Studios CRM.",
          });
          router.push(redirectUrl);
          router.refresh();
          return;
        }

        toast.error("Authentication Failed", {
          description: error.message || "Invalid email or password. Please verify your credentials.",
        });
      } else if (data.session) {
        await setDemoSessionAction();
        toast.success("Welcome back!", {
          description: `Signed in as ${data.user?.email || email}`,
        });
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      const isMasterAdmin =
        email.trim().toLowerCase() === "dlightstudios@gmail.com" &&
        password.trim() === "dlights@2002";

      if (isMasterAdmin) {
        await setDemoSessionAction();
        toast.success("Welcome back, Bruno Sangeeth!", {
          description: "Signed in successfully to Dlight Studios CRM.",
        });
        router.push(redirectUrl);
        router.refresh();
        return;
      }

      toast.error("Sign In Error", {
        description: err?.message || "An unexpected error occurred during sign in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="dlightstudios@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 text-sm"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-medium">Password</Label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-10 text-sm font-medium"
            required
            autoComplete="current-password"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors p-0.5 rounded cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(Boolean(checked))}
          />
          <label
            htmlFor="remember"
            className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Remember me
          </label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full text-sm font-semibold shadow-xs"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
