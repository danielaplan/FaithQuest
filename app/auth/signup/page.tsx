"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import { User, Mail, Lock, UserPlus, AlertCircle, Church, CheckCircle2, Loader2 } from "lucide-react";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.session) {
      // Immediate session (email confirmation off in dev/prod)
      router.push(next);
      router.refresh();
    } else {
      // Email confirmation sent
      setSuccessMsg("Account created! Check your email to confirm your account or sign in directly.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--canvas-gradient, #f0fdf4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "var(--card-bg, #ffffff)",
        borderRadius: "var(--radius-xl, 28px)",
        padding: "36px 28px",
        boxShadow: "var(--shadow-xl, 0 20px 35px -6px rgba(15, 118, 110, 0.18))",
        border: "1px solid var(--card-border-subtle, rgba(15, 118, 110, 0.12))",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Top Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            background: "var(--hero-bg, linear-gradient(135deg, #042f2e 0%, #0f766e 100%))",
            color: "#ffffff",
            boxShadow: "0 8px 20px var(--primary-glow, rgba(15, 118, 110, 0.35))",
            marginBottom: "14px"
          }}>
            <Church size={32} />
          </div>
          <h1 style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: "2rem",
            fontWeight: 800,
            color: "var(--text-main, #0f172a)",
            margin: "0 0 6px 0",
            lineHeight: 1.2
          }}>
            Join FaithQuest
          </h1>
          <p style={{
            fontSize: "0.95rem",
            color: "var(--text-muted, #64748b)",
            margin: 0
          }}>
            Create your teacher account
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

        {successMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md, 14px)",
            background: "var(--success-surface, #d1fae5)",
            color: "#065f46",
            fontSize: "0.88rem",
            marginBottom: "20px",
            border: "1px solid #6ee7b7"
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "13px 18px",
            borderRadius: "var(--radius-md, 14px)",
            background: "#ffffff",
            border: "1.5px solid var(--card-border, #e2e8f0)",
            color: "var(--text-main, #0f172a)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.04))",
            transition: "all 0.2s ease",
            marginBottom: "22px"
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--primary-light, #14b8a6)")}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--card-border, #e2e8f0)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Sign Up with Google
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          margin: "0 0 22px 0",
          color: "var(--text-muted, #64748b)",
          fontSize: "0.82rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--card-border, #e2e8f0)" }} />
          <span style={{ padding: "0 12px" }}>or with email</span>
          <div style={{ flex: 1, height: "1px", background: "var(--card-border, #e2e8f0)" }} />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-main, #0f172a)",
              marginBottom: "6px"
            }}>
              Your Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, #64748b)"
              }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Teacher Sarah"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "var(--radius-md, 14px)",
                  border: "1.5px solid var(--card-border, #e2e8f0)",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-main, #0f172a)",
              marginBottom: "6px"
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, #64748b)"
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@church.org"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "var(--radius-md, 14px)",
                  border: "1.5px solid var(--card-border, #e2e8f0)",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-main, #0f172a)",
              marginBottom: "6px"
            }}>
              Create Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted, #64748b)"
              }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "var(--radius-md, 14px)",
                  border: "1.5px solid var(--card-border, #e2e8f0)",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "14px 20px",
              borderRadius: "var(--radius-md, 14px)",
              background: "var(--primary, #0f766e)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "var(--clay-btn-shadow, 0 4px 0 #042f2e, 0 8px 15px rgba(15, 118, 110, 0.35))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.1s ease, box-shadow 0.1s ease"
            }}
          >
            {loading ? "Creating Account..." : (
              <>
                <UserPlus size={18} />
                <span>Create Teacher Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "26px",
          textAlign: "center",
          fontSize: "0.9rem",
          color: "var(--text-muted, #64748b)"
        }}>
          Already have an account?{" "}
          <Link
            href={`/auth/signin?next=${encodeURIComponent(next)}`}
            style={{
              color: "var(--primary, #0f766e)",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas-bg, #f0fdf4)" }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary, #0f766e)" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
