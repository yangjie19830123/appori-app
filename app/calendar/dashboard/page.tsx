"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useStore, PRESET_COLORS, EMOJI_LIST, type CalEvent } from "@/lib/store";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const TODAY = new Date();
const todayStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;
const dayLabel = (d: Date) => WEEKDAYS[d.getDay()];

export default function DashboardPage() {
  const router = useRouter();
  const store = useStore();
  const { members, events, selectedMember, toast } = store;

  const [viewMonth, setViewMonth] = useState({ y: TODAY.getFullYear(), m: TODAY.getMonth() });
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null);
  const [addForm, setAddForm] = useState({ date: todayStr, title: "", member_id: "", time: "" });

  // Member management
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("👧");
  const [newColor, setNewColor] = useState("#F59E0B");
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", emoji: "", color: "" });

  useEffect(() => {
    store.fetchAll().then(() => {
      const s = useStore.getState();
      if (s.members.length === 0) s.initDefaultMembers();
    });
  }, []);

  useEffect(() => {
    if (members.length > 0 && !addForm.member_id) setAddForm((f) => ({ ...f, member_id: members[0].id }));
  }, [members]);

  const getMember = (id: string) => members.find((m) => m.id === id);

  // Calendar grid
  const dim = new Date(viewMonth.y, viewMonth.m + 1, 0).getDate();
  const fd = new Date(viewMonth.y, viewMonth.m, 1).getDay();
  const cells: (number | null)[] = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const filtered = useMemo(() =>
    events.filter((e) => selectedMember === "all" || e.member_id === selectedMember),
    [events, selectedMember]);

  const todayEvents = useMemo(() =>
    events.filter((e) => e.date === todayStr).sort((a, b) => (a.time || "99").localeCompare(b.time || "99")),
    [events]);

  const dayEvents = (day: number) => {
    const ds = `${viewMonth.y}-${String(viewMonth.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter((e) => e.date === ds);
  };

  const upcoming = useMemo(() =>
    filtered.filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99").localeCompare(b.time || "99"))
      .slice(0, 15),
    [filtered]);

  // Handlers
  const handleAddEvent = async () => {
    if (!addForm.title.trim() || !addForm.member_id) return;
    await store.addEvent({ ...addForm, time: addForm.time || undefined });
    store.showToast("✅ 追加しました");
    setAddForm({ date: todayStr, title: "", member_id: members[0]?.id || "", time: "" });
    setShowAdd(false);
  };

  const handleSaveEdit = async () => {
    if (!editEvent) return;
    await store.updateEvent(editEvent.id, editEvent);
    store.showToast("✅ 更新しました");
    setEditEvent(null);
  };

  const handleAddMember = async () => {
    if (!newName.trim()) return;
    await store.addMember({ name: newName, emoji: newEmoji, color: newColor });
    store.showToast("✅ メンバー追加");
    setNewName("");
    setNewEmoji("👧");
    setNewColor(PRESET_COLORS[(members.length + 1) % PRESET_COLORS.length]);
  };

  const handleSaveMember = async () => {
    if (!editMemberId || !editForm.name.trim()) return;
    await store.updateMember(editMemberId, editForm);
    store.showToast("✅ 更新");
    setEditMemberId(null);
  };

  const prevMonth = () => setViewMonth((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 });
  const nextMonth = () => setViewMonth((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 });

  const inp = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Appori" width={32} height={32} className="rounded-lg" />
            <div>
              <h1 className="text-base font-extrabold leading-tight">家族カレンダー</h1>
              <div className="text-[9px] text-slate-400 tracking-wider">by Appori</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition text-sm">⚙️</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm">＋ 予定追加</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        {/* Today summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white mb-5 shadow-lg shadow-blue-600/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs opacity-80">{TODAY.getFullYear()}年{TODAY.getMonth()+1}月{TODAY.getDate()}日（{dayLabel(TODAY)}）</div>
              <div className="text-lg font-extrabold">今日の予定まとめ</div>
            </div>
            <div className="text-4xl font-black opacity-20">{TODAY.getDate()}</div>
          </div>
          {todayEvents.length === 0 ? (
            <div className="text-sm opacity-80 py-2">今日の予定はありません 🎉</div>
          ) : todayEvents.map((ev) => {
            const m = getMember(ev.member_id);
            return (
              <div key={ev.id} className="flex items-center gap-3 bg-white/15 rounded-xl px-3 py-2.5 mb-1.5 cursor-pointer hover:bg-white/25 transition" onClick={() => setEditEvent(ev)}>
                <div className="w-10 text-xs font-bold opacity-90 text-right flex-shrink-0">{ev.time || "終日"}</div>
                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: m?.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{ev.title}</div>
                  <div className="text-[11px] opacity-70">{m?.emoji} {m?.name}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Member filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => store.setSelectedMember("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${selectedMember === "all" ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}>
            👨‍👩‍👧‍👦 全員
          </button>
          {members.map((m) => (
            <button key={m.id} onClick={() => store.setSelectedMember(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1.5 ${selectedMember === m.id ? "text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}
              style={selectedMember === m.id ? { background: m.color } : undefined}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color, opacity: selectedMember === m.id ? 0.4 : 1 }} />
              {m.name}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-slate-400">◀</button>
            <span className="text-sm font-bold">{viewMonth.y}年{viewMonth.m+1}月</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-slate-400">▶</button>
          </div>
          <div className="p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`text-center text-[11px] font-bold py-1.5 ${i===0?"text-red-400":i===6?"text-blue-400":"text-slate-400"}`}>{d}</div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const ds = `${viewMonth.y}-${String(viewMonth.m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isToday = ds === todayStr;
                const de = dayEvents(day);
                return (
                  <div key={day} onClick={() => { setAddForm(f => ({...f, date: ds})); setShowAdd(true); }}
                    className={`min-h-[52px] sm:min-h-[64px] p-1 rounded-lg text-center transition cursor-pointer ${isToday ? "bg-blue-600 text-white" : de.length ? "bg-slate-50 hover:bg-slate-100" : "hover:bg-slate-50"}`}>
                    <div className="text-xs font-bold mb-0.5">{day}</div>
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {de.slice(0,4).map((ev) => (
                        <div key={ev.id} className="w-[6px] h-[6px] rounded-full" style={{ background: isToday ? "rgba(255,255,255,0.7)" : getMember(ev.member_id)?.color || "#999" }} />
                      ))}
                    </div>
                    {de.length > 0 && <div className="hidden sm:block text-[9px] mt-0.5 truncate" style={{ color: isToday ? "rgba(255,255,255,0.8)" : getMember(de[0].member_id)?.color }}>{de[0].title}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-500">📋 今後の予定</h2>
            <button onClick={() => setShowSync(true)} className="text-[11px] text-slate-400 hover:text-blue-600 transition">📅 Google連携</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-sm">予定はまだありません</div>
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-blue-600 font-bold">＋ 追加</button>
            </div>
          ) : upcoming.map((ev) => {
            const m = getMember(ev.member_id);
            const d = new Date(ev.date+"T00:00:00");
            return (
              <div key={ev.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition cursor-pointer mb-2" onClick={() => setEditEvent(ev)}>
                <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold ${ev.date===todayStr?"bg-blue-600 text-white":"bg-slate-100 text-slate-600"}`}>
                  <div className="text-[10px] leading-none">{d.getMonth()+1}月</div>
                  <div className="text-base leading-none font-black">{d.getDate()}</div>
                </div>
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{background:m?.color}} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{ev.title}</div>
                  <div className="text-[11px] text-slate-400">{m?.emoji} {m?.name}{ev.time ? ` ⏰ ${ev.time}` : ""}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); store.deleteEvent(ev.id); store.showToast("🗑️ 削除"); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition text-xs flex-shrink-0">✕</button>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── Add Event ─── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 animate-slide-down shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold">予定を追加</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-2">だれの予定？</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {members.map((m) => (
                <button key={m.id} onClick={() => setAddForm({...addForm, member_id: m.id})}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${addForm.member_id===m.id?"text-white":"bg-slate-100 text-slate-600"}`}
                  style={addForm.member_id===m.id?{background:m.color}:undefined}>{m.emoji} {m.name}</button>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
            <input type="date" value={addForm.date} onChange={(e) => setAddForm({...addForm, date: e.target.value})} className={inp+" mb-3"} />
            <label className="block text-xs font-bold text-slate-500 mb-1">タイトル</label>
            <input value={addForm.title} onChange={(e) => setAddForm({...addForm, title: e.target.value})} placeholder="例：小児科、PTA、ピアノ" className={inp+" mb-3"} autoFocus onKeyDown={(e) => e.key==="Enter" && handleAddEvent()} />
            <label className="block text-xs font-bold text-slate-500 mb-1">時間（任意）</label>
            <input type="time" value={addForm.time} onChange={(e) => setAddForm({...addForm, time: e.target.value})} className={inp+" mb-5"} />
            <button onClick={handleAddEvent} disabled={!addForm.title.trim()} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-40">追加する</button>
          </div>
        </div>
      )}

      {/* ─── Edit Event ─── */}
      {editEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setEditEvent(null)}>
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 animate-slide-down shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold">予定を編集</h3>
              <button onClick={() => setEditEvent(null)} className="text-slate-400 text-lg">✕</button>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-2">メンバー</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {members.map((m) => (
                <button key={m.id} onClick={() => setEditEvent({...editEvent, member_id: m.id})}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${editEvent.member_id===m.id?"text-white":"bg-slate-100 text-slate-600"}`}
                  style={editEvent.member_id===m.id?{background:m.color}:undefined}>{m.emoji} {m.name}</button>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
            <input type="date" value={editEvent.date} onChange={(e) => setEditEvent({...editEvent, date: e.target.value})} className={inp+" mb-3"} />
            <label className="block text-xs font-bold text-slate-500 mb-1">タイトル</label>
            <input value={editEvent.title} onChange={(e) => setEditEvent({...editEvent, title: e.target.value})} className={inp+" mb-3"} />
            <label className="block text-xs font-bold text-slate-500 mb-1">時間</label>
            <input type="time" value={editEvent.time||""} onChange={(e) => setEditEvent({...editEvent, time: e.target.value||null})} className={inp+" mb-5"} />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition">保存</button>
              <button onClick={() => { store.deleteEvent(editEvent.id); setEditEvent(null); store.showToast("🗑️ 削除"); }}
                className="py-3 px-5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition">削除</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings (Member Management) ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowSettings(false); setEditMemberId(null); }}>
          <div className="bg-white w-full sm:w-[440px] max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 animate-slide-down shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold">👨‍👩‍👧‍👦 メンバー管理</h3>
              <button onClick={() => { setShowSettings(false); setEditMemberId(null); }} className="text-slate-400 text-lg">✕</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">家族のメンバーを自由に追加・編集できます。お子様が複数いる場合も、それぞれ追加してください。</p>

            {/* Existing members */}
            {members.map((m) => (
              <div key={m.id}>
                {editMemberId === m.id ? (
                  <div className="p-3 border border-blue-200 rounded-xl bg-blue-50/50 mb-2">
                    <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={inp+" mb-2"} placeholder="名前" />
                    <div className="text-xs text-slate-500 mb-1 font-bold">絵文字</div>
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {EMOJI_LIST.map((em) => (
                        <button key={em} onClick={() => setEditForm({...editForm, emoji: em})}
                          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${editForm.emoji===em?"bg-blue-600 shadow":"bg-white border border-slate-200"}`}>{em}</button>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mb-1 font-bold">色</div>
                    <div className="flex gap-1 mb-3">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setEditForm({...editForm, color: c})}
                          className={`w-7 h-7 rounded-full transition ${editForm.color===c?"ring-2 ring-offset-2 ring-blue-400":""}`} style={{background:c}} />
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditMemberId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 border border-slate-200">キャンセル</button>
                      <button onClick={handleSaveMember} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white">保存</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{background:m.color+"20"}}>{m.emoji}</div>
                      <div>
                        <div className="text-sm font-bold">{m.name}</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{background:m.color}} /><span className="text-[10px] text-slate-400">{m.color}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditMemberId(m.id); setEditForm({name:m.name, emoji:m.emoji, color:m.color}); }}
                        className="px-3 py-1 rounded-lg text-[11px] border border-slate-200 text-slate-500 hover:bg-slate-50">編集</button>
                      <button onClick={async () => { if(confirm(`${m.name}を削除しますか？\n関連する予定も削除されます。`)) { await store.deleteMember(m.id); store.showToast("🗑️ 削除"); }}}
                        className="px-3 py-1 rounded-lg text-[11px] border border-red-200 text-red-400 hover:bg-red-50">削除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new member */}
            <div className="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              <div className="text-xs font-bold text-slate-600 mb-3">＋ メンバーを追加（お子様、おじいちゃん等）</div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="名前（例：太郎、花子、おばあちゃん）" className={inp+" mb-2"} />
              <div className="text-xs text-slate-500 mb-1 font-bold">絵文字</div>
              <div className="flex gap-1 mb-2 flex-wrap">
                {EMOJI_LIST.map((em) => (
                  <button key={em} onClick={() => setNewEmoji(em)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${newEmoji===em?"bg-blue-600 shadow":"bg-white border border-slate-200"}`}>{em}</button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mb-1 font-bold">色</div>
              <div className="flex gap-1 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition ${newColor===c?"ring-2 ring-offset-2 ring-blue-400":""}`} style={{background:c}} />
                ))}
              </div>
              <button onClick={handleAddMember} disabled={!newName.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-40">追加する</button>
            </div>

            {/* Logout */}
            <button onClick={async () => { await createClient().auth.signOut(); router.push("/calendar/login"); }}
              className="w-full mt-5 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition">ログアウト</button>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {showSync && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowSync(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center animate-slide-down shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="text-base font-extrabold mb-2">Googleカレンダー同期</h3>
            <p className="text-sm text-slate-500 mb-5">この機能は近日公開予定です。</p>
            <button onClick={() => setShowSync(false)} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition">閉じる</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Appori" width={24} height={24} className="rounded-md" />
            <span className="text-xs font-bold text-slate-700">Appori</span>
          </div>
          <span className="text-[10px] text-slate-400">© 2026 Appori</span>
        </div>
      </footer>

      {/* Toast */}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-xl z-[2000] animate-toast">{toast}</div>}
    </div>
  );
}
