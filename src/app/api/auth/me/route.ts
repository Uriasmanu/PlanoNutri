import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
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

    return NextResponse.json({
      user: { id: user.id, email: user.email, nome: user.nome },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
