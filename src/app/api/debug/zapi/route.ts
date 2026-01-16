import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasZapiToken: !!process.env.ZAPI_TOKEN,
    hasZapiInstance: !!process.env.ZAPI_INSTANCE,
    tokenPreview: process.env.ZAPI_TOKEN?.substring(0, 8) + "...",
    instancePreview: process.env.ZAPI_INSTANCE?.substring(0, 8) + "...",
    timestamp: new Date().toISOString()
  });
}