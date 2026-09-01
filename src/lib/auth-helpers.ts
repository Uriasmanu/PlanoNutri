import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function getAuth(request: NextRequest): Promise<{ nutricionistaId: string; email: string; nome: string } | null> {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { nutricionistaId: payload.sub, email: payload.email, nome: payload.nome };
}
