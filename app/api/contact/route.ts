import { NextResponse } from "next/server";

const TO_EMAIL = "yuuki20240128@gmail.com";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Appori <noreply@appori.app>",
        to: [TO_EMAIL],
        subject: `[Appori] 新しいアイデア${name ? ` from ${name}` : ""}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <h2 style="color:#2563EB;">Appori — 新しいアイデアが届きました</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr>
                <td style="padding:8px 12px;background:#F1F5F9;font-weight:600;width:100px;">名前</td>
                <td style="padding:8px 12px;">${name || "（未記入）"}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F1F5F9;font-weight:600;">メール</td>
                <td style="padding:8px 12px;">${email || "（未記入）"}</td>
              </tr>
            </table>
            <div style="padding:16px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;margin:16px 0;white-space:pre-wrap;">${message}</div>
            <p style="font-size:12px;color:#94A3B8;">Sent from appori.app contact form</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
