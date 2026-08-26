"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import { Sparkles, Mail, Lock, LogIn, ArrowRight, AlertCircle, Church, Loader2 } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const authError = searchParams.get("error");

  const [loginMode, setLoginMode] = useState<"teacher" | "admin">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(authError === "auth_failed" ? "Authentication failed. Please try again." : "");

  const supabase = createClient();

  const ensureUserProfile = async (user: any) => {
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) return profile;
    if (error && error.code !== "PGRST116") throw error;

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

    if (insertError) throw insertError;
    return { role: "teacher" };
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        const profile = await ensureUserProfile(data.user);

        if (profile?.role === "admin") {
          router.push("/admin");
        } else if (loginMode === "admin") {
          await supabase.auth.signOut();
          setErrorMsg("This account does not have admin access.");
          setLoading(false);
          return;
        } else {
          router.push(next);
        }
        router.refresh();
      } catch (profileError: any) {
        setErrorMsg(profileError?.message || "Unable to load your profile. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const isAdmin = loginMode === "admin";


  return (
    <div style={{
      minHeight: "100vh",
      background: isAdmin
        ? "linear-gradient(135deg, #0f0c29 0%, #1a1040 100%)"
        : "var(--canvas-gradient, #f0fdf4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: "background 0.3s ease"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: isAdmin ? "rgba(255,255,255,0.06)" : "var(--card-bg, #ffffff)",
        backdropFilter: isAdmin ? "blur(20px)" : "none",
        borderRadius: "var(--radius-xl, 28px)",
        padding: "36px 28px",
        boxShadow: isAdmin
          ? "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "var(--shadow-xl, 0 20px 35px -6px rgba(15, 118, 110, 0.18))",
        border: isAdmin
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease"
      }}>

        {/* Tab Toggle */}
        <div style={{
          display: "flex", background: isAdmin ? "rgba(255,255,255,0.06)" : "#f1f5f9",
          borderRadius: "14px", padding: "4px", marginBottom: "28px", gap: "4px"
        }}>
          {(["teacher", "admin"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setLoginMode(mode); setErrorMsg(""); setEmail(""); setPassword(""); }}
              style={{
                flex: 1, padding: "9px", borderRadius: "10px", border: "none",
                fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                transition: "all 0.2s ease",
                background: loginMode === mode
                  ? (mode === "admin" ? "linear-gradient(135deg, #4338ca, #7c3aed)" : "#ffffff")
                  : "transparent",
                color: loginMode === mode
                  ? (mode === "admin" ? "#ffffff" : "#0f172a")
                  : (isAdmin ? "rgba(255,255,255,0.4)" : "#64748b"),
                boxShadow: loginMode === mode ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                fontFamily: "inherit"
              }}
            >
              {mode === "teacher" ? "👩‍🏫 Teacher" : "🛡️ Admin"}
            </button>
          ))}
        </div>

        {/* Top Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "60px", height: "60px", borderRadius: "20px",
            background: isAdmin
              ? "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)"
              : "var(--hero-bg, linear-gradient(135deg, #042f2e 0%, #0f766e 100%))",
            color: "#ffffff",
            boxShadow: isAdmin
              ? "0 8px 20px rgba(99,102,241,0.4)"
              : "0 8px 20px var(--primary-glow, rgba(15, 118, 110, 0.35))",
            marginBottom: "14px"
          }}>
            <Church size={32} />
          </div>
          <h1 style={{
            fontFamily: "'Baloo 2', cursive", fontSize: "2rem", fontWeight: 800,
            color: isAdmin ? "#ffffff" : "var(--text-main, #0f172a)",
            margin: "0 0 6px 0", lineHeight: 1.2
          }}>
            FaithQuest
          </h1>
          <p style={{ fontSize: "0.95rem", color: isAdmin ? "rgba(255,255,255,0.5)" : "var(--text-muted, #64748b)", margin: 0 }}>
            {isAdmin ? "Administrator Portal" : "Teacher & Ministry Classroom Portal"}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md, 14px)",
            background: "var(--danger-surface, #fee2e2)",
            color: "#b91c1c",
            fontSize: "0.88rem",
            marginBottom: "20px",
            border: "1px solid #fca5a5"
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth — only show for teachers */}
        {!isAdmin && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: "12px", padding: "13px 18px", borderRadius: "var(--radius-md, 14px)",
                background: "#ffffff", border: "1.5px solid var(--card-border, #e2e8f0)",
                color: "var(--text-main, #0f172a)", fontWeight: 600, fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "var(--shadow-sm, 0 2px 4px rgba(15,23,42,0.04))",
                transition: "all 0.2s ease", marginBottom: "22px"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
            <div style={{ display: "flex", alignItems: "center", margin: "0 0 22px 0", color: "var(--text-muted,#64748b)", fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--card-border,#e2e8f0)" }} />
              <span style={{ padding: "0 12px" }}>or sign in with email</span>
              <div style={{ flex: 1, height: "1px", background: "var(--card-border,#e2e8f0)" }} />
            </div>
          </>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: isAdmin ? "rgba(255,255,255,0.6)" : "var(--text-main,#0f172a)", marginBottom: "6px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: isAdmin ? "rgba(255,255,255,0.3)" : "var(--text-muted,#64748b)" }} />
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdmin ? "admin@faithquest.com" : "teacher@church.org"}
                style={{
                  width: "100%", padding: "12px 14px 12px 42px",
                  borderRadius: "var(--radius-md,14px)",
                  border: `1.5px solid ${isAdmin ? "rgba(255,255,255,0.12)" : "var(--card-border,#e2e8f0)"}`,
                  fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: isAdmin ? "rgba(255,255,255,0.06)" : "#fff",
                  color: isAdmin ? "#fff" : "var(--text-main,#0f172a)"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: isAdmin ? "rgba(255,255,255,0.6)" : "var(--text-main,#0f172a)", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: isAdmin ? "rgba(255,255,255,0.3)" : "var(--text-muted,#64748b)" }} />
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 14px 12px 42px",
                  borderRadius: "var(--radius-md,14px)",
                  border: `1.5px solid ${isAdmin ? "rgba(255,255,255,0.12)" : "var(--card-border,#e2e8f0)"}`,
                  fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: isAdmin ? "rgba(255,255,255,0.06)" : "#fff",
                  color: isAdmin ? "#fff" : "var(--text-main,#0f172a)"
                }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: "8px", padding: "14px 20px",
              borderRadius: "var(--radius-md,14px)",
              background: isAdmin
                ? "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)"
                : "var(--primary,#0f766e)",
              color: "#ffffff", fontWeight: 700, fontSize: "1rem",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: isAdmin
                ? "0 6px 20px rgba(99,102,241,0.4)"
                : "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15,118,110,0.35))",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "8px", transition: "transform 0.1s ease, box-shadow 0.1s ease",
              fontFamily: "inherit"
            }}
          >
            {loading ? "Signing in..." : (
              <>
                <LogIn size={18} />
                <span>{isAdmin ? "Access Admin Portal" : "Enter Classroom"}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        {!isAdmin && (
          <div style={{ marginTop: "26px", textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted,#64748b)" }}>
            Don&apos;t have a teacher account?{" "}
            <Link href={`/auth/signup?next=${encodeURIComponent(next)}`} style={{ color: "var(--primary,#0f766e)", fontWeight: 700, textDecoration: "none" }}>
              Sign Up
            </Link>
          </div>
        )}
        {isAdmin && (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
            Restricted access · Authorized administrators only
          </p>
        )}
      </div>
    </div>
  );

}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas-bg, #f0fdf4)" }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary, #0f766e)" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
