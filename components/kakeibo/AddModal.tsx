"use client";

import { useState } from "react";
import { EXPENSE_CATS, INCOME_CATS, MEMBERS } from "@/lib/kakeibo/constants";
import { EntryType, Category } from "@/lib/kakeibo/types";

interface AddModalProps {
  onAdd: (entry: {
    type: EntryType;
    cat: string;
    amount: number;
    note: string;
    date: string;
    member: string;
  }) => void;
  onClose: () => void;
}

export default function AddModal({ onAdd, onClose }: AddModalProps) {
  const [type, setType] = useState<EntryType>("expense");
  const [cat, setCat] = useState("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [member, setMember] = useState("shared");

  const cats: Category[] = type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  const switchType = (t: EntryType) => {
    setType(t);
    setCat(t === "expense" ? "food" : "salary");
  };

  const handleSubmit = () => {
    if (!amount) return;
    const catObj = cats.find((c) => c.id === cat);
    onAdd({
      type,
      cat,
      amount: parseInt(amount),
      note: note || catObj?.label || "",
      date: new Date().toISOString().slice(0, 10),
      member,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm"
      style={{ background: "rgba(15,23,42,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-t-[22px] bg-slate-50 px-5 pb-7 pt-4 animate-slide-up max-h-[88vh] overflow-y-auto">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-slate-200" />

        {/* Income / Expense Toggle */}
        <div className="mb-4 flex gap-0.5 rounded-xl bg-slate-100 p-1">
          {([
            { id: "expense" as EntryType, label: "支出", activeColor: "text-red-500" },
            { id: "income" as EntryType, label: "収入", activeColor: "text-emerald-500" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => switchType(t.id)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                type === t.id
                  ? `bg-white shadow-sm ${t.activeColor}`
                  : "text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <p className="mb-1.5 text-[11px] font-semibold text-slate-400">カテゴリ</p>
        <div className="mb-4 grid grid-cols-4 gap-1.5">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className="flex flex-col items-center rounded-xl py-2 transition-all"
              style={{
                outline: cat === c.id ? `2px solid ${c.color}` : "2px solid transparent",
                outlineOffset: "-2px",
                background: cat === c.id ? c.color + "10" : "#fff",
              }}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="mt-0.5 text-[9px] font-medium text-slate-700">
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <p className="mb-1.5 text-[11px] font-semibold text-slate-400">金額</p>
        <div className="mb-3 flex items-center rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5">
          <span className="text-lg font-bold text-slate-400">¥</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="flex-1 border-none bg-transparent py-3 px-2 text-[22px] font-bold text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>

        {/* Member */}
        <p className="mb-1.5 text-[11px] font-semibold text-slate-400">メンバー</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MEMBERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMember(m.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                outline: member === m.id ? `2px solid ${m.color}` : "2px solid transparent",
                outlineOffset: "-2px",
                background: member === m.id ? m.color + "10" : "#fff",
              }}
            >
              {m.avatar} {m.name}
            </button>
          ))}
        </div>

        {/* Note */}
        <p className="mb-1.5 text-[11px] font-semibold text-slate-400">メモ</p>
        <input
          type="text"
          placeholder="例：スーパーまとめ買い"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mb-5 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none placeholder:text-slate-300"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!amount}
          className={`w-full rounded-xl py-3.5 text-[15px] font-bold transition-all ${
            amount
              ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/25"
              : "bg-slate-200 text-slate-400"
          }`}
        >
          記録する
        </button>
      </div>
    </div>
  );
}
