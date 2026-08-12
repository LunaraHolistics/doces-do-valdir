import { supabase, hasSupabase } from "./supabase";

export type Role = "manager" | "operator" | null;

export async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (userId: string | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.id || null);
  });
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getRole(userId?: string | null): Promise<Role> {
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as Role) || null;
}

// Cria/vincula a linha do cliente logado (para histórico real)
export async function ensureCustomer(name?: string, phone?: string) {
  if (!hasSupabase) return null;
  const session = await currentSession();
  if (!session?.user) return null;
  const uid = session.user.id;
  let { data } = await supabase.from("customers").select("*").eq("auth_uid", uid).maybeSingle();
  if (!data) {
    const fallbackName =
      name ||
      session.user.user_metadata?.full_name ||
      session.user.email ||
      "Cliente";
    const { data: created, error } = await supabase
      .from("customers")
      .insert({ auth_uid: uid, name: fallbackName, phone: phone || "" })
      .select()
      .single();
    if (error) return null;
    data = created;
  }
  return data;
}