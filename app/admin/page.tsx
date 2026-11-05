"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import {
  Church,
  Users,
  GraduationCap,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Loader2,
  TrendingUp,
  Layers
} from "lucide-react";

interface AdminStats {
  totalChurches: number;
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
  totalPoints: number;
  totalActivities: number;
}

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalChurches: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalPoints: 0,
    totalActivities: 0,
  });

  const loadStats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_dashboard_stats");
    if (!error && data) setStats(data as unknown as AdminStats);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const kpis = [
    { label: "Church Campuses", value: stats.totalChurches, icon: Church, color: "#312e81", bg: "#ede9fe", href: "/admin/churches" },
    { label: "Teaching Staff", value: stats.totalTeachers, icon: Users, color: "#0f766e", bg: "#ccfbf1", href: "/admin/teachers" },
    { label: "Active Classes", value: stats.totalClasses, icon: GraduationCap, color: "#b45309", bg: "#fef3c7", href: "/admin/classes" },
    { label: "Enrolled Students", value: stats.totalStudents, icon: Layers, color: "#0284c7", bg: "#e0f2fe", href: "/admin/classes" },
    { label: "Total Points Awarded", value: stats.totalPoints.toLocaleString(), icon: Sparkles, color: "#7c3aed", bg: "#ede9fe", href: "/admin/classes" },
    { label: "Total Activity Logs", value: stats.totalActivities, icon: TrendingUp, color: "#065f46", bg: "#d1fae5", href: "/admin/classes" },
  ];

  const portals = [
    {
      label: "Churches & Campuses",
      description: "Create and manage church organizations, campuses, and ministry branches.",
      href: "/admin/churches",
      icon: Church,
      color: "#312e81",
      bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)"
    },
    {
      label: "Teachers & Staff",
      description: "Manage teacher accounts, assign to churches, and control admin authority.",
      href: "/admin/teachers",
      icon: Users,
      color: "#0f766e",
      bg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)"
    },
    {
      label: "All Classes",
      description: "Browse every classroom, inspect rosters, points, attendance, and quizzes.",
      href: "/admin/classes",
      icon: GraduationCap,
      color: "#b45309",
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
    },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Welcome header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "'Baloo 2', cursive", fontSize: "2.2rem",
          margin: "0 0 6px 0", color: "var(--text-main, #0f172a)", lineHeight: 1.1
        }}>
          Church Administration
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
          Full system authority — live ministry overview across all campuses and classes.
        </p>
      </div>

      {/* KPI Stats Grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--primary, #0f766e)" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading system statistics...</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "36px"
        }}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--card-bg, #ffffff)",
                  borderRadius: "var(--radius-lg, 20px)",
                  padding: "20px",
                  boxShadow: "var(--shadow-md, 0 6px 16px -2px rgba(15,118,110,0.08))",
                  border: "1px solid var(--card-border-subtle, rgba(15,118,110,0.12))",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  cursor: "pointer"
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 24px -4px rgba(15,118,110,0.16)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                  }}
                >
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: kpi.bg, color: kpi.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "12px"
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{
                    fontFamily: "'Baloo 2', cursive", fontSize: "2rem",
                    fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1
                  }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748b)", fontWeight: 600, marginTop: "4px" }}>
                    {kpi.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Portal Navigation Cards */}
      <h2 style={{
        fontFamily: "'Baloo 2', cursive", fontSize: "1.4rem",
        margin: "0 0 16px 0", color: "var(--text-main, #0f172a)"
      }}>
        Management Portals
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.href} href={p.href} style={{ textDecoration: "none" }}>
              <div style={{
                borderRadius: "var(--radius-xl, 28px)",
                background: p.bg,
                padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "var(--shadow-sm, 0 2px 4px rgba(15,23,42,0.04))",
                transition: "transform 0.15s ease",
                cursor: "pointer"
              }}
                onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.transform = ""}
              >
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.7)", color: p.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{
                  fontFamily: "'Baloo 2', cursive", fontSize: "1.25rem",
                  fontWeight: 800, margin: "0 0 6px 0", color: "var(--text-main, #0f172a)"
                }}>
                  {p.label}
                </h3>
                <p style={{ fontSize: "0.86rem", color: "var(--text-muted, #475569)", margin: "0 0 16px 0" }}>
                  {p.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: p.color, fontWeight: 700, fontSize: "0.85rem" }}>
                  <span>Go to portal</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
