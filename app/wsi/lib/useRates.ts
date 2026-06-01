"use client";

import { useEffect, useState } from "react";
import { FALLBACK_RATES, type FXRates } from "./rates";

export function useRates(): FXRates {
  const [rates, setRates] = useState<FXRates>(FALLBACK_RATES);

  useEffect(() => {
    let cancelled = false;
    fetch("/wsi/api/rates")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.CNY === "number") setRates(data as FXRates);
      })
      .catch(() => {
        // 保持兜底
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return rates;
}
