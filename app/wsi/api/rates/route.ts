import { FALLBACK_RATES, type FXRates } from "../../lib/rates";

// 1 小时一缓存
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    if (data.result !== "success" || !data.rates) throw new Error("bad payload");

    const rates: FXRates = {
      base: "USD",
      CNY: data.rates.CNY,
      JPY: data.rates.JPY,
      GBP: data.rates.GBP,
      SGD: data.rates.SGD,
      AUD: data.rates.AUD,
      KRW: data.rates.KRW,
      updatedAt: (data.time_last_update_unix || Math.floor(Date.now() / 1000)) * 1000,
      fallback: false,
    };
    return Response.json(rates, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("rates api error:", err);
    return Response.json(FALLBACK_RATES, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
