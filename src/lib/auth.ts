import { SignJWT, jwtVerify } from "jose";
import type { Usuario } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || "planonutri-secret-change-in-production"
);

const TOKEN_EXPIRY = "24h";
const REFRESH_EXPIRY = "7d";

export interface TokenPayload {
  sub: string;
  email: string;
  nome: string;
}

export async function signAccessToken(user: Usuario): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    nome: user.nome,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(user: Usuario): Promise<string> {
  return new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      nome: payload.nome as string,
    };
  } catch {
    return null;
  }
}
