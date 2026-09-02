import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { data: leads, error: dbError } = await supabase
      .from("leads")
      .select("id, event_type, lead_status")
      .limit(5);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      authenticatedUser: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message || null,
      dbQuerySuccess: !dbError,
      dbSampleData: leads || [],
      dbError: dbError?.message || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err?.message || "Connection test failed",
      },
      { status: 500 }
    );
  }
}
