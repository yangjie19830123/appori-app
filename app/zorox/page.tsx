"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Profile { id: string; display_name: string; role: string; rating: number; completed_tasks: number; verified: boolean; }
interface Task { id: number; task_id: string; client_id: string; title: string; description: string; budget: string; risk_level: string; category: string; deadline: string; status: string; anonymous: boolean; images: string[]; created_at: string; }
interface Application { id: number; app_task_id: number; agent_id: string; message: string; images: string[]; status: string; created_at: string; agent_name?: string; agent_rating?: number; agent_tasks?: number; }
interface Notif { id: number; type: string; reference_id: number; title: string; message: string; read: boolean; created_at: string; }

type AuthState = "loading" | "guest" | "logged_in";

const RISK_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  S: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  A: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  B: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  C: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};
const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending_review: { color: "#D97706", bg: "#FFFBEB", label: "待审核" },
  approved: { color: "#059669", bg: "#ECFDF5", label: "招募中" },
  rejected: { color: "#DC2626", bg: "#FEF2F2", label: "未通过" },
  in_progress: { color: "#2563EB", bg: "#EFF6FF", label: "进行中" },
  completed: { color: "#64748B", bg: "#F1F5F9", label: "已完成" },
};
const CATEGORIES = ["全部", "调查", "翻译", "分析", "营销", "派发", "开发", "设计", "特殊", "其他"];
const RISK_LEVELS = ["C", "B", "A", "S"];
const RISK_DESC: Record<string, string> = { S: "高风险·仅认证用户", A: "需专业技能", B: "一般任务", C: "新手友好" };

const cardS: React.CSSProperties = { background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "18px 16px", marginBottom: 10, transition: "all 0.2s" };
const btnP: React.CSSProperties = { width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" };
const btnO: React.CSSProperties = { padding: "10px 20px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const inpS: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", fontFamily: "inherit", background: "#fff" };
const lblS: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 };

async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("zorox-images").upload(name, file);
    if (!error) {
      const { data } = supabase.storage.from("zorox-images").getPublicUrl(name);
      urls.push(data.publicUrl);
    }
  }
  return urls;
}

function RiskBadge({ level }: { level: string }) {
  const rs = RISK_STYLE[level] || RISK_STYLE.B;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{level}级</span>;
}

function StatusBadge({ status }: { status: string }) {
  const ss = STATUS_STYLE[status] || STATUS_STYLE.approved;
  return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: ss.bg, color: ss.color }}>{ss.label}</span>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "18px 16px" }}>
      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function TaskDetailView({ task }: { task: Task }) {
  return (
    <>
      <div style={{ ...cardS, cursor: "default" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <RiskBadge level={task.risk_level} />
          <StatusBadge status={task.status} />
          <span style={{ fontSize: 10, color: "#CBD5E1", fontFamily: "monospace" }}>{task.task_id}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", lineHeight: 1.5 }}>{task.title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 14 }}><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>赏金</div><div style={{ fontSize: 16, fontWeight: 700, color: "#2563EB" }}>{task.budget}</div></div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 14 }}><div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>截止</div><div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{task.deadline || "未设定"}</div></div>
      </div>
      <div style={{ ...cardS, cursor: "default" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>任务详情</div>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "#475569", margin: 0, whiteSpace: "pre-wrap" as const }}>{task.description}</p>
      </div>
      {task.images && task.images.length > 0 && (
        <div style={{ ...cardS, cursor: "default" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>附件图片</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {task.images.map((url: string, i: number) => <img key={i} src={url} alt="" style={{ width: 100, height: 100, borderRadius: 10, objectFit: "cover" as const }} />)}
          </div>
        </div>
      )}
    </>
  );
}

export default function ZoroXPage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState("board");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskApplicants, setTaskApplicants] = useState<Application[]>([]);
  const [selectedCat, setSelectedCat] = useState(0);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regRole, setRegRole] = useState("agent");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tfTitle, setTfTitle] = useState("");
  const [tfDesc, setTfDesc] = useState("");
  const [tfBudget, setTfBudget] = useState("");
  const [tfDeadline, setTfDeadline] = useState("");
  const [tfRisk, setTfRisk] = useState("B");
  const [tfCat, setTfCat] = useState("调查");
  const [tfAnon, setTfAnon] = useState(false);
  const [tfImages, setTfImages] = useState<File[]>([]);
  const [tfSubmitting, setTfSubmitting] = useState(false);
  const [tfSuccess, setTfSuccess] = useState(false);

  const [applyMsg, setApplyMsg] = useState("");
  const [applyImages, setApplyImages] = useState<File[]>([]);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const isGuest = authState === "guest";
  const isAgent = profile?.role === "agent";
  const isClient = profile?.role === "client";
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { loadProfile(session.user.id); } else { setAuthState("guest"); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { loadProfile(session.user.id); } else { setAuthState("guest"); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("zorox_profiles").select("*").eq("id", uid).single();
    if (data) { setProfile(data); setAuthState("logged_in"); setTab(data.role === "admin" ? "dashboard" : "board"); } else { setAuthState("guest"); }
  };

  const loadTasks = useCallback(async () => {
    if (isAdmin) {
      const { data } = await supabase.from("zorox_tasks").select("*").order("created_at", { ascending: false });
      if (data) setTasks(data);
    } else if (isClient && profile) {
      const { data } = await supabase.from("zorox_tasks").select("*").or(`client_id.eq.${profile.id},status.eq.approved,status.eq.in_progress,status.eq.completed`).order("created_at", { ascending: false });
      if (data) setTasks(data);
    } else {
      const { data } = await supabase.from("zorox_tasks").select("*").in("status", ["approved", "in_progress", "completed"]).order("created_at", { ascending: false });
      if (data) setTasks(data);
    }
  }, [profile, isAdmin, isClient]);

  const loadNotifications = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from("zorox_notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data);
  }, [isAdmin]);

  const loadMyApplications = useCallback(async () => {
    if (!isAgent || !profile) return;
    const { data } = await supabase.from("zorox_applications").select("*").eq("agent_id", profile.id).order("created_at", { ascending: false });
    if (data) setMyApplications(data);
  }, [isAgent, profile]);

  useEffect(() => { if (authState !== "loading") { loadTasks(); loadNotifications(); loadMyApplications(); } }, [authState, loadTasks, loadNotifications, loadMyApplications]);

  const handleRegister = async () => {
    setAuthError(""); setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: regEmail, password: regPass });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    if (data.user) {
      const { error: pErr } = await supabase.from("zorox_profiles").insert({ id: data.user.id, display_name: regName || regEmail.split("@")[0], role: regRole });
      if (pErr) { setAuthError(pErr.message); setAuthLoading(false); return; }
      await loadProfile(data.user.id);
      setShowAuth(false);
    }
    setAuthLoading(false);
  };

  const handleLogin = async () => {
    setAuthError(""); setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    if (data.user) { await loadProfile(data.user.id); setShowAuth(false); }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null); setAuthState("guest"); setTab("board"); setSelectedTask(null);
  };

  const handlePostTask = async () => {
    if (!tfTitle.trim() || !tfDesc.trim() || !tfBudget.trim() || !profile) return;
    setTfSubmitting(true);
    let imageUrls: string[] = [];
    if (tfImages.length > 0) imageUrls = await uploadImages(tfImages);
    const { error } = await supabase.from("zorox_tasks").insert({ client_id: profile.id, title: tfTitle, description: tfDesc, budget: tfBudget, risk_level: tfRisk, category: tfCat, deadline: tfDeadline, anonymous: tfAnon, images: imageUrls });
    if (!error) { setTfTitle(""); setTfDesc(""); setTfBudget(""); setTfDeadline(""); setTfImages([]); setTfSuccess(true); loadTasks(); setTimeout(() => setTfSuccess(false), 3000); }
    setTfSubmitting(false);
  };

  const handleApply = async (taskId: number) => {
    if (!applyMsg.trim() || !profile) return;
    setApplySubmitting(true);
    let imageUrls: string[] = [];
    if (applyImages.length > 0) imageUrls = await uploadImages(applyImages);
    const { error } = await supabase.from("zorox_applications").insert({ app_task_id: taskId, agent_id: profile.id, message: applyMsg, images: imageUrls });
    if (!error) { setApplyMsg(""); setApplyImages([]); setShowApplyForm(false); loadTasks(); }
    setApplySubmitting(false);
  };

  const handleReviewTask = async (taskId: number, action: "approved" | "rejected") => {
    await supabase.from("zorox_tasks").update({ status: action }).eq("id", taskId);
    loadTasks(); loadNotifications();
  };

  const handleHireAgent = async (appId: number, taskId: number) => {
    await supabase.from("zorox_applications").update({ status: "accepted" }).eq("id", appId);
    await supabase.from("zorox_tasks").update({ status: "in_progress" }).eq("id", taskId);
    loadTasks();
  };

  const loadApplicants = async (taskId: number) => {
    const { data } = await supabase.from("zorox_applications").select("*, zorox_profiles!agent_id(display_name, rating, completed_tasks)").eq("app_task_id", taskId).order("created_at", { ascending: false });
    if (data) {
      setTaskApplicants(data.map((a: any) => ({ ...a, agent_name: a.zorox_profiles?.display_name || "Unknown", agent_rating: a.zorox_profiles?.rating || 0, agent_tasks: a.zorox_profiles?.completed_tasks || 0 })));
    }
  };

  const GuestGate = ({ children, label }: { children: React.ReactNode; label?: string }) => {
    if (isGuest) return <button onClick={() => { setShowAuth(true); setAuthMode("register"); }} style={{ ...btnP, background: "#E2E8F0", color: "#64748B", boxShadow: "none", fontSize: 13 }}>{label || "请先注册或登录"}</button>;
    return <>{children}</>;
  };

  const visibleTasks = tasks.filter((t) => {
    if (isAdmin && tab === "review") return t.status === "pending_review";
    if (isAdmin && tab === "tasks") return true;
    if (isClient && tab === "board") return t.client_id === profile?.id;
    if (selectedCat > 0 && t.category !== CATEGORIES[selectedCat]) return false;
    return t.status === "approved" || t.status === "in_progress";
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentTabs = isAdmin
    ? [{ id: "dashboard", icon: "📊", label: "仪表盘" }, { id: "review", icon: "🔔", label: `审核${unreadCount > 0 ? `(${unreadCount})` : ""}` }, { id: "tasks", icon: "📋", label: "任务" }, { id: "users", icon: "⚙️", label: "设置" }]
    : isClient
      ? [{ id: "board", icon: "📋", label: "我的任务" }, { id: "post", icon: "✏️", label: "发布" }, { id: "profile", icon: "👤", label: "我的" }]
      : [{ id: "board", icon: "🎯", label: "任务" }, { id: "mytasks", icon: "📋", label: "我的接单" }, { id: "profile", icon: "👤", label: "我的" }];

  if (authState === "loading") return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}><Image src="/zoroX.png" alt="ZoroX" width={56} height={56} /><p style={{ color: "#94A3B8", fontSize: 14, marginTop: 12 }}>加载中...</p></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Noto Sans JP',sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E2E8F0", padding: "0 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/zoroX.png" alt="ZoroX" width={30} height={30} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>ZoroX</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {profile ? (
              <>
                <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: isAgent ? "#EFF6FF" : isClient ? "#F0FDF4" : "#FFF7ED", color: isAgent ? "#2563EB" : isClient ? "#059669" : "#D97706" }}>{profile.display_name}</span>
                <button onClick={handleLogout} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↩</button>
              </>
            ) : (
              <button onClick={() => { setShowAuth(true); setAuthMode("register"); }} style={{ padding: "6px 16px", borderRadius: 20, border: "none", background: "#2563EB", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>注册/登录</button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 90px" }}>

        {(isAgent || isGuest) && tab === "board" && !selectedTask && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>任务大厅</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 14px" }}>{isGuest ? "注册后即可申请任务" : "找到适合你的赏金任务"}</p>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" as const }}>
              {CATEGORIES.map((c, i) => (
                <button key={i} onClick={() => setSelectedCat(i)} style={{ padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap" as const, border: selectedCat === i ? "1.5px solid #2563EB" : "1px solid #E2E8F0", background: selectedCat === i ? "#EFF6FF" : "#fff", color: selectedCat === i ? "#2563EB" : "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>{visibleTasks.length} 个任务</div>
            {visibleTasks.map((task) => (
              <div key={task.id} onClick={() => setSelectedTask(task)} style={{ ...cardS, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <RiskBadge level={task.risk_level} /><StatusBadge status={task.status} />
                  <span style={{ fontSize: 10, color: "#CBD5E1", marginLeft: "auto", fontFamily: "monospace" }}>{task.task_id}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px", lineHeight: 1.5 }}>{task.title}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#2563EB" }}>{task.budget}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{task.category}</span>
                </div>
              </div>
            ))}
            {visibleTasks.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>暂无任务</p>}
          </div>
        )}

        {(isAgent || isGuest) && tab === "board" && selectedTask && (
          <div style={{ padding: 16 }}>
            <button onClick={() => { setSelectedTask(null); setShowApplyForm(false); }} style={{ ...btnO, marginBottom: 16, padding: "8px 14px", fontSize: 13 }}>← 返回</button>
            <TaskDetailView task={selectedTask} />
            {!showApplyForm ? (
              <GuestGate label="注册成为猎人后即可申请"><button onClick={() => setShowApplyForm(true)} style={btnP}>申请此任务</button></GuestGate>
            ) : (
              <div style={{ ...cardS, cursor: "default" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>提交申请</div>
                <label style={lblS}>申请说明 *</label>
                <textarea value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} placeholder="介绍你的经验和优势..." rows={4} style={{ ...inpS, resize: "vertical" as const, marginBottom: 12 }} />
                <label style={lblS}>附加图片（可选）</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setApplyImages(Array.from(e.target.files || []))} style={{ marginBottom: 16, fontSize: 13 }} />
                {applyImages.length > 0 && <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>已选 {applyImages.length} 张图片</p>}
                <button onClick={() => handleApply(selectedTask.id)} disabled={!applyMsg.trim() || applySubmitting} style={{ ...btnP, opacity: !applyMsg.trim() || applySubmitting ? 0.5 : 1 }}>{applySubmitting ? "提交中..." : "提交申请"}</button>
              </div>
            )}
          </div>
        )}

        {isAgent && tab === "mytasks" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>我的接单</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px" }}>你申请过的任务</p>
            {myApplications.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>暂无申请记录</p>}
            {myApplications.map((app) => {
              const task = tasks.find((t) => t.id === app.app_task_id);
              return (
                <div key={app.id} style={{ ...cardS, cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: app.status === "accepted" ? "#ECFDF5" : app.status === "rejected" ? "#FEF2F2" : "#FFFBEB", color: app.status === "accepted" ? "#059669" : app.status === "rejected" ? "#DC2626" : "#D97706" }}>{app.status === "accepted" ? "已录用" : app.status === "rejected" ? "未通过" : "待审核"}</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{task?.title || "任务已删除"}</h3>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{app.message}</p>
                  {app.images.length > 0 && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>{app.images.map((url, i) => <img key={i} src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />)}</div>}
                </div>
              );
            })}
          </div>
        )}

        {isClient && tab === "board" && !selectedTask && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>我的任务</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px" }}>你发布的任务</p>
            {visibleTasks.map((task) => (
              <div key={task.id} onClick={() => { setSelectedTask(task); loadApplicants(task.id); }} style={{ ...cardS, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <RiskBadge level={task.risk_level} /><StatusBadge status={task.status} />
                  <span style={{ fontSize: 10, color: "#CBD5E1", marginLeft: "auto", fontFamily: "monospace" }}>{task.task_id}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>{task.title}</h3>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#2563EB" }}>{task.budget}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>查看申请者 →</span>
                </div>
              </div>
            ))}
            {visibleTasks.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>还没有发布过任务</p>}
          </div>
        )}

        {isClient && tab === "board" && selectedTask && (
          <div style={{ padding: 16 }}>
            <button onClick={() => { setSelectedTask(null); setTaskApplicants([]); }} style={{ ...btnO, marginBottom: 16, padding: "8px 14px", fontSize: 13 }}>← 返回</button>
            <TaskDetailView task={selectedTask} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "16px 0 10px" }}>申请者（{taskApplicants.length}人）</h3>
            {taskApplicants.map((app) => (
              <div key={app.id} style={{ ...cardS, cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: "1px solid #BFDBFE" }}>🎯</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{app.agent_name}</div><div style={{ fontSize: 12, color: "#64748B" }}>⭐{app.agent_rating}　{app.agent_tasks}件完成</div></div>
                  <span style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: app.status === "accepted" ? "#ECFDF5" : "#FFFBEB", color: app.status === "accepted" ? "#059669" : "#D97706" }}>{app.status === "accepted" ? "已录用" : "待审核"}</span>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 8 }}>「{app.message}」</div>
                {app.images.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" as const }}>{app.images.map((url, i) => <img key={i} src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />)}</div>}
                {app.status === "pending" && <button onClick={() => handleHireAgent(app.id, selectedTask.id)} style={{ ...btnP, fontSize: 13, padding: "10px 0" }}>录用此猎人</button>}
              </div>
            ))}
            {taskApplicants.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: 20, fontSize: 13 }}>暂无申请者</p>}
          </div>
        )}

        {isClient && tab === "post" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>发布新任务</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>提交后需管理员审核通过才能展示</p>
            {tfSuccess && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#059669", fontWeight: 600 }}>✓ 任务已提交，等待管理员审核</div>}
            <label style={lblS}>任务标题 *</label>
            <input value={tfTitle} onChange={(e) => setTfTitle(e.target.value)} placeholder="例：新宿地区餐厅调研" style={{ ...inpS, marginBottom: 14 }} />
            <label style={lblS}>任务详情 *</label>
            <textarea value={tfDesc} onChange={(e) => setTfDesc(e.target.value)} placeholder="请详细描述你的需求..." rows={4} style={{ ...inpS, resize: "vertical" as const, marginBottom: 14 }} />
            <label style={lblS}>预算金额 *</label>
            <input value={tfBudget} onChange={(e) => setTfBudget(e.target.value)} placeholder="例：¥15,000～¥20,000" style={{ ...inpS, marginBottom: 14 }} />
            <label style={lblS}>截止日期</label>
            <input type="date" value={tfDeadline} onChange={(e) => setTfDeadline(e.target.value)} style={{ ...inpS, marginBottom: 14 }} />
            <label style={lblS}>风险等级</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {RISK_LEVELS.map((k) => { const rs = RISK_STYLE[k]; return (
                <button key={k} onClick={() => setTfRisk(k)} style={{ padding: 12, borderRadius: 10, textAlign: "left" as const, background: tfRisk === k ? rs.bg : "#fff", border: tfRisk === k ? `1.5px solid ${rs.border}` : "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: rs.color }}>{k}级</span>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{RISK_DESC[k]}</div>
                </button>
              ); })}
            </div>
            <label style={lblS}>分类</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 14 }}>
              {CATEGORIES.slice(1).map((c) => (
                <button key={c} onClick={() => setTfCat(c)} style={{ padding: "7px 14px", borderRadius: 20, background: tfCat === c ? "#EFF6FF" : "#fff", border: tfCat === c ? "1.5px solid #BFDBFE" : "1px solid #E2E8F0", color: tfCat === c ? "#2563EB" : "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
              ))}
            </div>
            <label style={lblS}>附加图片（可选）</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setTfImages(Array.from(e.target.files || []))} style={{ marginBottom: 8, fontSize: 13 }} />
            {tfImages.length > 0 && <p style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>已选 {tfImages.length} 张图片</p>}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>匿名发布</div><div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>你的身份不会被公开</div></div>
              <div onClick={() => setTfAnon(!tfAnon)} style={{ width: 48, height: 28, borderRadius: 14, padding: 2, cursor: "pointer", background: tfAnon ? "linear-gradient(135deg,#3B82F6,#2563EB)" : "#E2E8F0", transition: "background 0.2s" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", marginLeft: tfAnon ? 20 : 0, transition: "margin 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} />
              </div>
            </div>
            <button onClick={handlePostTask} disabled={!tfTitle.trim() || !tfDesc.trim() || !tfBudget.trim() || tfSubmitting} style={{ ...btnP, opacity: !tfTitle.trim() || !tfDesc.trim() || !tfBudget.trim() || tfSubmitting ? 0.5 : 1 }}>{tfSubmitting ? "提交中..." : "发布任务（提交审核）"}</button>
          </div>
        )}

        {isAdmin && tab === "dashboard" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>管理仪表盘</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <StatCard label="总任务" value={String(tasks.length)} color="#2563EB" />
              <StatCard label="待审核" value={String(tasks.filter((t) => t.status === "pending_review").length)} color="#D97706" />
              <StatCard label="进行中" value={String(tasks.filter((t) => t.status === "in_progress").length)} color="#059669" />
              <StatCard label="未读通知" value={String(unreadCount)} color="#DC2626" />
            </div>
            {unreadCount > 0 && (
              <div style={{ ...cardS, cursor: "default" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>最新通知</div>
                {notifications.filter((n) => !n.read).slice(0, 5).map((n) => (
                  <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{n.title}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{n.message}</div></div>
                  </div>
                ))}
                <button onClick={() => setTab("review")} style={{ ...btnP, marginTop: 12, fontSize: 13, padding: "10px 0" }}>去审核</button>
              </div>
            )}
          </div>
        )}

        {isAdmin && tab === "review" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>任务审核</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px" }}>审核通过后任务将在大厅展示</p>
            {visibleTasks.map((task) => (
              <div key={task.id} style={{ ...cardS, cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <RiskBadge level={task.risk_level} /><StatusBadge status={task.status} />
                  <span style={{ fontSize: 10, color: "#CBD5E1", marginLeft: "auto", fontFamily: "monospace" }}>{task.task_id}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>{task.title}</h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, margin: "0 0 8px" }}>{task.description}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginBottom: 4 }}>{task.budget}</p>
                {task.images && task.images.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" as const }}>{task.images.map((url, i) => <img key={i} src={url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover" }} />)}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => handleReviewTask(task.id, "approved")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #A7F3D0", background: "#ECFDF5", color: "#059669", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✓ 通过</button>
                  <button onClick={() => handleReviewTask(task.id, "rejected")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✕ 拒绝</button>
                </div>
              </div>
            ))}
            {visibleTasks.length === 0 && <p style={{ textAlign: "center", color: "#94A3B8", padding: 40, fontSize: 14 }}>暂无待审核任务</p>}
          </div>
        )}

        {isAdmin && tab === "tasks" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>所有任务</h2>
            {tasks.map((task) => (
              <div key={task.id} style={{ ...cardS, cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <RiskBadge level={task.risk_level} /><StatusBadge status={task.status} />
                  <span style={{ fontSize: 10, color: "#CBD5E1", marginLeft: "auto", fontFamily: "monospace" }}>{task.task_id}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{task.title}</h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{task.budget}</span>
              </div>
            ))}
          </div>
        )}

        {(isAgent || isClient) && tab === "profile" && profile && (
          <div style={{ padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "28px 20px", marginBottom: 20, textAlign: "center" as const }}>
              <Image src="/zoroX.png" alt="avatar" width={64} height={64} style={{ margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{profile.display_name}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>{isAgent ? "猎人" : "委托方"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 8px" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{profile.completed_tasks}</div><div style={{ fontSize: 10, color: "#94A3B8" }}>完成任务</div></div>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 8px" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{profile.rating}⭐</div><div style={{ fontSize: 10, color: "#94A3B8" }}>评价</div></div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "rgba(220,38,38,0.04)", border: "1px solid #FECACA", color: "#DC2626", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>退出登录</button>
            <div style={{ textAlign: "center" as const, marginTop: 16 }}>
              <Link href="/" style={{ fontSize: 11, color: "#CBD5E1", display: "inline-flex", alignItems: "center", gap: 4 }}><Image src="/logo.png" alt="Appori" width={14} height={14} style={{ borderRadius: 3 }} /> Powered by Appori</Link>
            </div>
          </div>
        )}

        {isAdmin && tab === "users" && (
          <div style={{ padding: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>平台设置</h2>
            <div style={{ ...cardS, cursor: "default" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>当前管理员</div><div style={{ fontSize: 13, color: "#64748B" }}>{profile?.display_name}</div></div>
            <button onClick={handleLogout} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: "rgba(220,38,38,0.04)", border: "1px solid #FECACA", color: "#DC2626", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>退出登录</button>
          </div>
        )}
      </main>

      {(profile || isGuest) && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-around", padding: "6px 0 env(safe-area-inset-bottom,8px)" }}>
          {currentTabs.map((tb) => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setSelectedTask(null); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "4px 12px", fontFamily: "inherit" }}>
              <span style={{ fontSize: 20 }}>{tb.icon}</span>
              <span style={{ fontSize: 10, fontWeight: tab === tb.id ? 700 : 500, color: tab === tb.id ? "#2563EB" : "#94A3B8" }}>{tb.label}</span>
            </button>
          ))}
        </nav>
      )}

      {showAuth && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowAuth(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" as const, padding: "28px 24px env(safe-area-inset-bottom,24px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Image src="/zoroX.png" alt="ZoroX" width={32} height={32} /><span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>ZoroX</span></div>
              <button onClick={() => setShowAuth(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#F1F5F9", borderRadius: 12, padding: 3 }}>
              {(["register", "login"] as const).map((m) => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: authMode === m ? "#fff" : "transparent", color: authMode === m ? "#0F172A" : "#94A3B8", boxShadow: authMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{m === "register" ? "注册" : "登录"}</button>
              ))}
            </div>
            {authError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626" }}>{authError}</div>}
            {authMode === "register" ? (
              <>
                <label style={lblS}>昵称</label>
                <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="你的显示名称" style={{ ...inpS, marginBottom: 12 }} />
                <label style={lblS}>邮箱 *</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your@email.com" style={{ ...inpS, marginBottom: 12 }} />
                <label style={lblS}>密码 *</label>
                <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="至少6位" style={{ ...inpS, marginBottom: 16 }} />
                <label style={lblS}>身份</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[{ k: "agent", l: "🎯 猎人", d: "接受任务赚赏金" }, { k: "client", l: "📋 委托方", d: "发布任务找人做" }].map((r) => (
                    <button key={r.k} onClick={() => setRegRole(r.k)} style={{ flex: 1, padding: "14px 8px", borderRadius: 12, border: regRole === r.k ? "2px solid #2563EB" : "1px solid #E2E8F0", background: regRole === r.k ? "#EFF6FF" : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: regRole === r.k ? "#2563EB" : "#0F172A" }}>{r.l}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{r.d}</div>
                    </button>
                  ))}
                </div>
                <button onClick={handleRegister} disabled={!regEmail || !regPass || authLoading} style={{ ...btnP, opacity: !regEmail || !regPass || authLoading ? 0.5 : 1 }}>{authLoading ? "注册中..." : "注册"}</button>
              </>
            ) : (
              <>
                <label style={lblS}>邮箱</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@email.com" style={{ ...inpS, marginBottom: 12 }} />
                <label style={lblS}>密码</label>
                <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="密码" style={{ ...inpS, marginBottom: 20 }} />
                <button onClick={handleLogin} disabled={!loginEmail || !loginPass || authLoading} style={{ ...btnP, opacity: !loginEmail || !loginPass || authLoading ? 0.5 : 1 }}>{authLoading ? "登录中..." : "登录"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
