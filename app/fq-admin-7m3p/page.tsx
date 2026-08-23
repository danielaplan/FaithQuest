"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertTriangle } from "lucide-react";

export default function SecretAdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid credentials. Access denied.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("This portal is for authorized administrators only.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b2a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background grid lines */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "20%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        filter: "blur(40px)"
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "15%",
        width: "250px", height: "250px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
        filter: "blur(40px)"
      }} />

      {/* Login Card */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "28px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        position: "relative"
      }}>
        {/* Shield icon */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "18px",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px auto",
          boxShadow: "0 8px 24px rgba(99,102,241,0.4)"
        }}>
          <ShieldCheck size={32} color="#ffffff" />
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: "1.9rem", fontWeight: 800,
            color: "#ffffff", margin: "0 0 8px 0", lineHeight: 1.1
          }}>
            Ministry Portal
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", margin: 0 }}>
            Authorized access only
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px", padding: "12px 14px", marginBottom: "20px",
            color: "#fca5a5", fontSize: "0.85rem", fontWeight: 600
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Admin Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@faithquest.com"
                style={{
                  width: "100%", padding: "13px 14px 13px 42px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px", fontSize: "0.9rem",
                  color: "#ffffff", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%", padding: "13px 44px 13px 42px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "12px", fontSize: "0.9rem",
                  color: "#ffffff", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: "4px"
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "14px",
              background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)",
              border: "none", borderRadius: "14px",
              color: "#ffffff", fontWeight: 800, fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.4)",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Verifying..." : "Access Ministry Portal"}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          textAlign: "center", marginTop: "24px",
          color: "rgba(255,255,255,0.2)", fontSize: "0.75rem"
        }}>
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
