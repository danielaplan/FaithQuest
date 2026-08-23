"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import {
  LayoutDashboard,
  Church,
  Users,
  GraduationCap,
  LogOut,
  ExternalLink,
  Loader2,
  ShieldCheck,
  BarChart2,
  CalendarDays,
  Sparkles,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const NAV = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    label: "Analytics",
    items: [
      { label: "All Students", href: "/admin/analytics/students", icon: Users },
      { label: "Attendance", href: "/admin/analytics/attendance", icon: CalendarDays },
      { label: "Points & Leaderboard", href: "/admin/analytics/points", icon: Sparkles },
      { label: "Quiz Results", href: "/admin/analytics/quizzes", icon: BookOpen },
      { label: "Badges & Faith Tree", href: "/admin/analytics/badges", icon: Award },
    ]
  },
  {
    label: "Management",
    items: [
      { label: "Churches", href: "/admin/churches", icon: Church },
      { label: "Teachers & Staff", href: "/admin/teachers", icon: ShieldCheck },
      { label: "All Classes", href: "/admin/classes", icon: GraduationCap },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/fq-admin-7m3p"); return; }

      const { data: prof } = await supabase
        .from("profiles").select("name, email, role").eq("id", user.id).single();

      if (!prof || prof.role !== "admin") {
        router.push("/fq-admin-7m3p"); return;
      }
      setProfile(prof);
      setLoading(false);
    }
    checkAdmin();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/fq-admin-7m3p");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 100%)",
        gap: "12px", color: "#a5b4fc"
      }}>
        <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Verifying administrator access...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--canvas-gradient, #f0fdf4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: "240px", background: "#0f0e1a",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "20px 12px", boxSizing: "border-box",
        position: "sticky", top: 0, height: "100vh", zIndex: 40,
        borderRight: "1px solid rgba(255,255,255,0.06)"
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px 20px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)"
            }}>
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: "1.15rem", color: "#ffffff" }}>
                  FaithQuest
                </span>
                <span style={{
                  background: "#7c3aed", color: "#ffffff",
                  fontSize: "0.58rem", fontWeight: 800, padding: "1px 5px",
                  borderRadius: "999px", textTransform: "uppercase"
                }}>
                  Admin
                </span>
              </div>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Ministry Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "16px" }}>
            {NAV.map((group) => (
              <div key={group.label} style={{ marginBottom: "8px" }}>
                <p style={{
                  fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)",
                  padding: "0 10px", margin: "8px 0 4px 0"
                }}>
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 10px", borderRadius: "10px",
                      textDecoration: "none", fontWeight: 600, fontSize: "0.85rem",
                      transition: "all 0.12s ease",
                      background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                      color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                      borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent"
                    }}>
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User + Actions */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
          <div style={{ padding: "0 8px 12px 8px" }}>
            <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#e2e8f0" }}>
              {profile?.name}
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.email}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={handleSignOut} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "6px", padding: "8px", borderRadius: "8px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(252,165,165,0.7)", fontWeight: 600, fontSize: "0.78rem",
              cursor: "pointer"
            }}>
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", minHeight: "100vh", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}
