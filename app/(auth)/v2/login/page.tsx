import * as React from "react";
import { Suspense } from "react";
import { LoginLayoutV2 } from "@/components/auth/login-layout-v2";

export default function LoginV2Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">Loading studio auth...</div>}>
      <LoginLayoutV2 />
    </Suspense>
  );
}
