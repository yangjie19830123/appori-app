import { create } from "zustand";
import { createClient } from "./supabase/client";

export interface Member {
  id: string; user_id: string; name: string; emoji: string; color: string; sort_order: number; created_at: string;
}
export interface CalEvent {
  id: string; user_id: string; member_id: string; title: string; date: string; time: string | null; memo: string | null; created_at: string;
}

export const PRESET_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
export const EMOJI_LIST = ["👩", "👨", "👧", "👦", "👶", "🧒", "👵", "👴", "🐶", "🐱"];

interface State {
  members: Member[];
  events: CalEvent[];
  selectedMember: string;
  toast: string | null;
  loading: boolean;
  showToast: (msg: string) => void;
  setSelectedMember: (id: string) => void;
  fetchAll: () => Promise<void>;
  initDefaultMembers: () => Promise<void>;
  addMember: (m: { name: string; emoji: string; color: string }) => Promise<void>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addEvent: (e: { member_id: string; title: string; date: string; time?: string }) => Promise<CalEvent | null>;
  updateEvent: (id: string, data: Partial<CalEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  members: [], events: [], selectedMember: "all", toast: null, loading: false,
  showToast: (msg) => { set({ toast: msg }); setTimeout(() => set({ toast: null }), 3000); },
  setSelectedMember: (id) => set({ selectedMember: id }),

  fetchAll: async () => {
    set({ loading: true });
    const sb = createClient();
    const [{ data: members }, { data: events }] = await Promise.all([
      sb.from("members").select("*").order("sort_order"),
      sb.from("events").select("*").order("date"),
    ]);
    set({ members: members || [], events: events || [], loading: false });
  },

  initDefaultMembers: async () => {
    const { members } = get();
    if (members.length > 0) return;
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const defaults = [
      { name: "ママ", emoji: "👩", color: "#3B82F6", sort_order: 0 },
      { name: "パパ", emoji: "👨", color: "#22C55E", sort_order: 1 },
      { name: "子ども1", emoji: "👧", color: "#F59E0B", sort_order: 2 },
    ];
    for (const d of defaults) {
      await sb.from("members").insert({ ...d, user_id: user.id });
    }
    await get().fetchAll();
  },

  addMember: async (m) => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const order = get().members.length;
    const { data } = await sb.from("members").insert({ ...m, user_id: user.id, sort_order: order }).select().single();
    if (data) set((s) => ({ members: [...s.members, data] }));
  },

  updateMember: async (id, data) => {
    const sb = createClient();
    await sb.from("members").update(data).eq("id", id);
    set((s) => ({ members: s.members.map((m) => m.id === id ? { ...m, ...data } : m) }));
  },

  deleteMember: async (id) => {
    const sb = createClient();
    await sb.from("events").delete().eq("member_id", id);
    await sb.from("members").delete().eq("id", id);
    set((s) => ({
      members: s.members.filter((m) => m.id !== id),
      events: s.events.filter((e) => e.member_id !== id),
      selectedMember: s.selectedMember === id ? "all" : s.selectedMember,
    }));
  },

  addEvent: async (e) => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data } = await sb.from("events").insert({ ...e, user_id: user.id }).select().single();
    if (data) set((s) => ({ events: [...s.events, data] }));
    return data;
  },

  updateEvent: async (id, data) => {
    const sb = createClient();
    const upd = { ...data } as any;
    delete upd.id; delete upd.user_id; delete upd.created_at;
    await sb.from("events").update(upd).eq("id", id);
    set((s) => ({ events: s.events.map((e) => e.id === id ? { ...e, ...data } : e) }));
  },

  deleteEvent: async (id) => {
    const sb = createClient();
    await sb.from("events").delete().eq("id", id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
