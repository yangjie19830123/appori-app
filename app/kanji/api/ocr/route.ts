import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image, media_type } = await request.json();
    if (!image || !media_type) {
      return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
    }

    const apiKey = process.env.OCR_SPACE_API_KEY || "K85772088288957";

    const formData = new FormData();
    formData.append("base64Image", `data:${media_type};base64,${image}`);
    formData.append("language", "jpn");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: formData,
    });

    const data = await response.json();

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      return NextResponse.json({ error: "テキストを認識できませんでした" }, { status: 400 });
    }

    const text = data.ParsedResults.map((r: any) => r.ParsedText).join("\n").trim();

    if (!text) {
      return NextResponse.json({ error: "画像からテキストが見つかりませんでした" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[OCR]", err);
    return NextResponse.json({ error: err.message || "OCR失敗" }, { status: 500 });
  }
}
