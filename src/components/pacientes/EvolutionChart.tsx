"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { EvolucaoFisica } from "@/types";
import { formatDate } from "@/lib/formatters";

interface Props {
  evolucoes: EvolucaoFisica[];
}

export function EvolutionChart({ evolucoes }: Props) {
  if (evolucoes.length < 2) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Adicione pelo menos 2 medições para visualizar o gráfico de evolução.
      </div>
    );
  }

  const data = evolucoes.map((e) => ({
    data: formatDate(e.dataAvaliacao),
    peso: e.peso,
    raw: e,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="data" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={["dataMin - 2", "dataMax + 2"]} unit="kg" />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
            formatter={(value: number) => [`${value} kg`, "Peso"]}
          />
          <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
