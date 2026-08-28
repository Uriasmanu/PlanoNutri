import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/auth";
import { findUserById } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Refresh token inválido ou expirado" },
        { status: 401 }
      );
    }

    const user = findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    const newAccessToken = await signAccessToken(user);

    const response = NextResponse.json({
      accessToken: newAccessToken,
    });

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
