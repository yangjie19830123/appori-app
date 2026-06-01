"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const categoryLabel: Record<string, string> = { equipment: "設備費", cleaning: "清掃費", supplies: "消耗品", lease: "賃貸費", other: "その他" }

export default function FinanceClient({ income, expenses, properties }: { income: any[], expenses: any[], properties: any[] }) {
  const router = useRouter()
  const [incomeModal, setIncomeModal]   = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [iForm, setIForm] = useState({ property_id: "", amount: "", record_date: new Date().toISOString().slice(0,10), platform: "booking", notes: "" })
  const [eForm, setEForm] = useState({ property_id: "", category: "cleaning", amount: "", record_date: new Date().toISOString().slice(0,10), description: "" })

  const totalIncome   = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense  = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const profit        = totalIncome - totalExpense
  const profitRate    = totalIncome > 0 ? Math.round(profit / totalIncome * 100) : 0

  // 物件別集計
  const propMap: Record<string, { name: string; income: number; expense: number }> = {}
  properties.forEach(p => { propMap[p.id] = { name: p.name, income: 0, expense: 0 } })
  income.forEach(r => { if (propMap[r.property_id]) propMap[r.property_id].income += Number(r.amount) })
  expenses.forEach(r => { if (r.property_id && propMap[r.property_id]) propMap[r.property_id].expense += Number(r.amount) })
  const propList = Object.values(propMap).filter(p => p.income > 0 || p.expense > 0)

  const saveIncome = async () => {
    if (!iForm.property_id || !iForm.amount) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_income_records").insert({ ...iForm, amount: Number(iForm.amount) })
    setSaving(false); setIncomeModal(false); router.refresh()
  }

  const saveExpense = async () => {
    if (!eForm.amount) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("stayflow_expense_records").insert({ ...eForm, property_id: eForm.property_id || null, amount: Number(eForm.amount) })
    setSaving(false); setExpenseModal(false); router.refresh()
  }

  const fmt = (n: number) => "¥" + n.toLocaleString()

  return (
    <div>
      {/* Stats */}
      <div className="sf-grid4" style={{ marginBottom: 20 }}>
        {[
          { label: "売上合計",  value: fmt(totalIncome) },
          { label: "支出合計",  value: fmt(totalExpense) },
          { label: "純利益",    value: fmt(profit), color: profit >= 0 ? "var(--sf-green3)" : "var(--sf-red2)" },
          { label: "利益率",    value: `${profitRate}%`, color: profitRate >= 60 ? "var(--sf-green3)" : "var(--sf-amber3)" },
        ].map((s, i) => (
          <div className="sf-stat" key={i}>
            <div className="sf-stat-label">{s.label}</div>
            <div className="sf-stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className="sf-btn sf-btn-primary" onClick={() => setIncomeModal(true)}>＋ 収入を記録</button>
        <button className="sf-btn sf-btn-outline" onClick={() => setExpenseModal(true)}>＋ 支出を記録</button>
      </div>

      <div className="sf-grid2" style={{ marginBottom: 20 }}>
        {/* Income list */}
        <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--sf-ink4)" }}><div className="sf-sec-title">収入明細</div></div>
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead><tr><th>日付</th><th>物件</th><th>プラットフォーム</th><th>金額</th></tr></thead>
              <tbody>
                {income.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--sf-ink3)" }}>収入データなし</td></tr>
                ) : income.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12 }}>{r.record_date}</td>
                    <td style={{ fontSize: 12 }}>{r.stayflow_properties?.name}</td>
                    <td><span className={`sf-tag ${r.platform === "booking" ? "sf-tag-blue" : "sf-tag-green"}`} style={{ fontSize: 10 }}>{r.platform}</span></td>
                    <td style={{ fontWeight: 500, color: "var(--sf-green3)" }}>{fmt(Number(r.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense list */}
        <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--sf-ink4)" }}><div className="sf-sec-title">支出明細</div></div>
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead><tr><th>日付</th><th>カテゴリ</th><th>物件</th><th>金額</th></tr></thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--sf-ink3)" }}>支出データなし</td></tr>
                ) : expenses.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12 }}>{r.record_date}</td>
                    <td><span className="sf-tag sf-tag-gray" style={{ fontSize: 10 }}>{categoryLabel[r.category]}</span></td>
                    <td style={{ fontSize: 12 }}>{r.stayflow_properties?.name ?? "—"}</td>
                    <td style={{ fontWeight: 500, color: "var(--sf-red2)" }}>{fmt(Number(r.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 物件別損益 */}
      {propList.length > 0 && (
        <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--sf-ink4)" }}><div className="sf-sec-title">物件別 損益対比</div></div>
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead><tr><th>物件</th><th>売上</th><th>支出</th><th>純利益</th><th>利益率</th></tr></thead>
              <tbody>
                {propList.map(p => {
                  const pr = p.income - p.expense
                  const rt = p.income > 0 ? Math.round(pr / p.income * 100) : 0
                  return (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{fmt(p.income)}</td>
                      <td>{fmt(p.expense)}</td>
                      <td style={{ color: pr >= 0 ? "var(--sf-green3)" : "var(--sf-red2)", fontWeight: 500 }}>{fmt(pr)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="sf-progress" style={{ flex: 1, marginTop: 0 }}>
                            <div className="sf-progress-fill" style={{ width: `${rt}%` }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{rt}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 収入Modal */}
      {incomeModal && (
        <div className="sf-modal-overlay">
            <div className="sf-modal">
            <div className="sf-modal-head"><div className="sf-modal-title">収入を記録</div><button className="sf-modal-close" onClick={() => setIncomeModal(false)}>✕</button></div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="sf-label">物件 *</label>
                  <select className="sf-select" style={{ width: "100%" }} value={iForm.property_id} onChange={e => setIForm(f => ({ ...f, property_id: e.target.value }))}>
                    <option value="">選択</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="sf-label">金額（円） *</label><input className="sf-input" type="number" value={iForm.amount} onChange={e => setIForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><label className="sf-label">日付</label><input className="sf-input" type="date" value={iForm.record_date} onChange={e => setIForm(f => ({ ...f, record_date: e.target.value }))} /></div>
                <div><label className="sf-label">プラットフォーム</label>
                  <select className="sf-select" style={{ width: "100%" }} value={iForm.platform} onChange={e => setIForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="booking">Booking</option><option value="airbnb">Airbnb</option><option value="direct">直接</option><option value="other">その他</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setIncomeModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={saveIncome} disabled={saving}>{saving ? "保存中..." : "記録する"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 支出Modal */}
      {expenseModal && (
        <div className="sf-modal-overlay" onClick={() => setExpenseModal(false)}>
          <div className="sf-modal" onClick={e => e.stopPropagation()}>
            <div className="sf-modal-head"><div className="sf-modal-title">支出を記録</div><button className="sf-modal-close" onClick={() => setExpenseModal(false)}>✕</button></div>
            <div className="sf-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="sf-label">カテゴリ</label>
                  <select className="sf-select" style={{ width: "100%" }} value={eForm.category} onChange={e => setEForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(categoryLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sf-label">物件</label>
                  <select className="sf-select" style={{ width: "100%" }} value={eForm.property_id} onChange={e => setEForm(f => ({ ...f, property_id: e.target.value }))}>
                    <option value="">未指定</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="sf-label">金額（円） *</label><input className="sf-input" type="number" value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><label className="sf-label">日付</label><input className="sf-input" type="date" value={eForm.record_date} onChange={e => setEForm(f => ({ ...f, record_date: e.target.value }))} /></div>
                <div style={{ gridColumn: "1/-1" }}><label className="sf-label">説明</label><input className="sf-input" value={eForm.description} onChange={e => setEForm(f => ({ ...f, description: e.target.value }))} placeholder="例: 4月清掃費" /></div>
              </div>
            </div>
            <div className="sf-modal-foot">
              <button className="sf-btn sf-btn-outline" onClick={() => setExpenseModal(false)}>キャンセル</button>
              <button className="sf-btn sf-btn-primary" onClick={saveExpense} disabled={saving}>{saving ? "保存中..." : "記録する"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}