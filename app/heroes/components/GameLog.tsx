"use client";

import { useEffect, useRef, useState } from "react";
import type { BattleLogEntry } from "../lib/types";

interface Props {
  log: BattleLogEntry[];
}

export function GameLog({ log }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [open, log.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-30 w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm grid place-items-center text-lg"
        aria-label="战斗日志"
      >
        📜
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-h-[60vh] bg-[var(--hr-ink)] border-t-2 border-[var(--hr-gold)] rounded-t-3xl p-4 overflow-y-auto"
            onClick={e => e.stopPropagation()}
            ref={ref}
            style={{ background: "var(--hr-ink)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="hr-display tracking-wider text-lg">战 斗 记 录</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs opacity-60"
              >
                关闭
              </button>
            </div>
            <ul className="space-y-1.5 text-xs">
              {log.map((l, i) => (
                <li key={i}>
                  <span className="opacity-40 mr-2">
                    {new Date(l.ts).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
