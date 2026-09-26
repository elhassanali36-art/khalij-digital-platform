import { NextRequest, NextResponse } from "next/server";
import { getSessionSeller, unauthorized } from "@/lib/session";

export async function GET(req: NextRequest) {
  const seller = await getSessionSeller(req);
  if (!seller) return unauthorized();
  const { passwordHash: _passwordHash, ...safe } = seller;
  return NextResponse.json(safe);
}
