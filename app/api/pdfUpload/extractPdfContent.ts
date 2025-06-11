// api/extractPdfContent.ts
import { NextRequest, NextResponse } from "next/server";
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  const { pdfUrl } = await req.json();
  const res = await fetch(pdfUrl);
  const buffer = await res.arrayBuffer();

  const data = await pdf(Buffer.from(buffer));
  return NextResponse.json({ content: data.text });
}
