"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { EnvioEnriquecido } from "@/lib/envios";

const TIPO_LABEL: Record<string, string> = {
  relativo: "Prazo relativo",
  data_fixa: "Data fixa",
};

const CANAL_LABEL: Record<string, string> = {
  email: "E-mail",
  whatsapp_manual: "WhatsApp (manual)",
  whatsapp_api: "WhatsApp (API)",
  qrcode: "QR Code",
  sms: "SMS",
};

interface Props {
  envios: EnvioEnriquecido[];
  showPaciente?: boolean;
  onCancel: (envio: EnvioEnriquecido) => void;
}

export function EnvioList({ envios, showPaciente = true, onCancel }: Props) {
  if (envios.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nenhum agendamento encontrado.</p>;
  }

  return (
    <div className="space-y-2">
      {envios.map((e) => {
        const atrasado = e.status === "agendado" && new Date(e.dataEnvioPrevista) < new Date();
        return (
          <div key={e.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3 text-sm">
            <div className="space-y-0.5">
              {showPaciente && <div className="font-medium">{e.pacienteNome}</div>}
              <div className="text-muted-foreground">
                {e.questionarioTitulo} • {TIPO_LABEL[e.tipoAgendamento]} • {CANAL_LABEL[e.canal]}
              </div>
              <div className="text-xs text-muted-foreground">
                Previsto: {formatDate(e.dataEnvioPrevista)}
                {" — "}
                {e.status === "cancelado" ? (
                  <span className="text-destructive">Cancelado</span>
                ) : atrasado ? (
                  <span className="text-destructive">Atrasado</span>
                ) : (
                  <span>Agendado</span>
                )}
              </div>
            </div>
            {e.status === "agendado" && (
              <Button variant="outline" size="sm" onClick={() => onCancel(e)} className="shrink-0 self-start sm:self-center">
                Cancelar
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
