import * as React from "react";
import { getProfile } from "@/lib/crm-service";
import { SettingsForm } from "@/components/forms/settings-form";

export const revalidate = 0;

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Studio & Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure studio brand details, admin profile, and CRM localization preferences.
        </p>
      </div>

      <SettingsForm initialProfile={profile} />
    </div>
  );
}
