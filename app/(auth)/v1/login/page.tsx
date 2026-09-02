import * as React from "react";
import { Suspense } from "react";
import { LoginLayoutV1 } from "@/components/auth/login-layout-v1";

export default function LoginV1Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">Loading studio auth...</div>}>
      <LoginLayoutV1 />
    </Suspense>
  );
}
