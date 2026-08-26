import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      let redirectPath = next;

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          if (profile.role === "admin") {
            redirectPath = "/admin";
          }
        } else if (!profileError || profileError.code === "PGRST116") {
          const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Teacher";
          const { error: insertError } = await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email ?? `${user.id}@placeholder.local`,
              name: fallbackName,
              role: "teacher",
            },
            { onConflict: "id" }
          );

          if (insertError) {
            console.error("Failed to create profile during OAuth callback:", insertError);
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
}
