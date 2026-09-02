"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setDemoSessionAction() {
  const cookieStore = await cookies();
  cookieStore.set("crm_demo_session", "authenticated", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function clearDemoSessionAction() {
  const cookieStore = await cookies();
  cookieStore.delete("crm_demo_session");
  revalidatePath("/", "layout");
  return { success: true };
}
