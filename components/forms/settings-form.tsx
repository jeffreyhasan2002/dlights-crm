"use client";

import * as React from "react";
import { useState } from "react";
import { User, Building2, Sliders, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Profile } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileServerAction } from "@/lib/crm-actions";

interface SettingsFormProps {
  initialProfile: Profile;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await updateProfileServerAction(profile);
      if (res.success) {
        toast.success("Studio settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("An error occurred while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="business" className="text-xs">Business Profile</TabsTrigger>
          <TabsTrigger value="personal" className="text-xs">Photographer</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs">Preferences</TabsTrigger>
        </TabsList>

        {/* 1. Business Profile Tab */}
        <TabsContent value="business" className="space-y-4 pt-4">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Studio Brand Details</CardTitle>
              <CardDescription className="text-xs">
                Information displayed on client quotations, invoices, and communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bizName">Studio / Business Name</Label>
                <Input
                  id="bizName"
                  value={profile.business_name || ""}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizPhone">Official Phone Number</Label>
                  <Input
                    id="bizPhone"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bizWa">WhatsApp Business Number</Label>
                  <Input
                    id="bizWa"
                    value={profile.whatsapp || ""}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizEmail">Public Studio Email</Label>
                  <Input
                    id="bizEmail"
                    value={profile.email || ""}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bizLoc">Default Base Location / City</Label>
                  <Input
                    id="bizLoc"
                    value={profile.default_location || ""}
                    onChange={(e) => setProfile({ ...profile, default_location: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Personal Profile Tab */}
        <TabsContent value="personal" className="space-y-4 pt-4">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Photographer Profile</CardTitle>
              <CardDescription className="text-xs">
                Your personal administrator credentials and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Lead Photographer / Admin Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                <Input
                  id="avatarUrl"
                  value={profile.avatar_url || ""}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 pt-4">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">CRM Localization & Formatting</CardTitle>
              <CardDescription className="text-xs">
                Currency symbols, calendar date formats, and timezone defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Currency</Label>
                  <Select
                    value={profile.currency || "INR"}
                    onValueChange={(val) => setProfile({ ...profile, currency: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹ INR)</SelectItem>
                      <SelectItem value="USD">US Dollar ($ USD)</SelectItem>
                      <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                      <SelectItem value="EUR">Euro (€ EUR)</SelectItem>
                      <SelectItem value="GBP">British Pound (£ GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Date Format</Label>
                  <Select
                    value={profile.date_format || "dd/MM/yyyy"}
                    onValueChange={(val) => setProfile({ ...profile, date_format: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (Indian standard)</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (US standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select
                    value={profile.timezone || "Asia/Kolkata"}
                    onValueChange={(val) => setProfile({ ...profile, timezone: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">IST - Asia/Kolkata (+05:30)</SelectItem>
                      <SelectItem value="Asia/Dubai">GST - Asia/Dubai (+04:00)</SelectItem>
                      <SelectItem value="Europe/London">GMT - Europe/London (+00:00)</SelectItem>
                      <SelectItem value="America/New_York">EST - America/New_York (-05:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} className="gap-2 min-w-[140px]">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
