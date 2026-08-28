import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/users";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, nome: user.nome },
      accessToken,
      refreshToken,
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7d
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
