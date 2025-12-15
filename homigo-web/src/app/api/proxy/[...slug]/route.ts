import { NextRequest, NextResponse } from "next/server";

function getBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
}

async function forward(req: NextRequest, params: { slug: string[] }) {
  const base = getBase();
  const url = new URL(req.url);
  const target = `${base}/${(params.slug || []).join("/")}${url.search}`;
  const headers = new Headers();
  const pass = ["authorization", "content-type", "accept"] as const;
  pass.forEach((h) => { const v = req.headers.get(h); if (v) headers.set(h, v); });
  const method = req.method;
  const init: RequestInit = { method, headers, cache: "no-store" };
  if (!["GET", "HEAD"].includes(method)) {
    (init as any).body = req.body;
    (init as any).duplex = "half";
  }
  const resp = await fetch(target, init);
  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-security-policy");
  return new NextResponse(resp.body, { status: resp.status, headers: outHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}
