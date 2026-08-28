import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
    response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
