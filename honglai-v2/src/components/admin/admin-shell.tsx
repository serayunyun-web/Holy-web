"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase-public-api";

type Role = "admin" | "manager" | "staff";
type AdminContext = { session: Session; roles: Role[]; canManage: boolean };
const Context = createContext<AdminContext | null>(null);

export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error("useAdmin must be used inside AdminShell");
  return value;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage("登入失敗，請確認帳號密碼。");
  };
  return <form className="admin-login" onSubmit={submit}>
    <h1>鴻萊後台登入</h1>
    <label htmlFor="admin-email">Email</label><input autoComplete="username" id="admin-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
    <label htmlFor="admin-password">密碼</label><input autoComplete="current-password" id="admin-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
    <button className="button button-primary" disabled={busy} type="submit">{busy ? "登入中…" : "登入"}</button>
    <p aria-live="polite" className="form-message">{message}</p>
  </form>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [roles, setRoles] = useState<Role[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) { const timer = window.setTimeout(() => setSession(null), 0); return () => window.clearTimeout(timer); }
    const client = supabaseBrowser();
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabaseBrowser().from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => setRoles((data ?? []).map((row) => row.role as Role)));
  }, [session]);

  if (!isSupabaseConfigured()) return <main className="admin-page page-container"><p className="admin-empty">網站尚未設定 Supabase 連線（NEXT_PUBLIC_SUPABASE_URL／PUBLISHABLE_KEY），後台無法使用。</p></main>;
  if (session === undefined || (session && roles === null)) return <main className="admin-page page-container"><p className="admin-empty">載入中…</p></main>;
  if (!session) return <main className="admin-page page-container"><LoginForm /></main>;
  if (!roles?.length) return <main className="admin-page page-container"><div className="admin-login"><h1>沒有後台權限</h1><p>此帳號尚未被授予後台角色，請聯絡管理員。</p><button className="button button-secondary" onClick={() => supabaseBrowser().auth.signOut()} type="button">登出</button></div></main>;

  const canManage = roles.includes("admin") || roles.includes("manager");
  return <Context.Provider value={{ session, roles, canManage }}>
    <main className="admin-page page-container">
      <nav className="admin-nav no-print"><Link href={`${ADMIN_BASE}/`}>後台首頁</Link><span>{session.user.email}（{roles.join("、")}）</span><button className="text-button" onClick={() => supabaseBrowser().auth.signOut()} type="button">登出</button></nav>
      {children}
    </main>
  </Context.Provider>;
}
