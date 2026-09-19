"use client";

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeletePatientDialog({ open, onOpenChange, pacienteNome, onConfirm, loading }: Props) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir paciente?"
      description={
        <>
          Tem certeza que deseja excluir <strong>{pacienteNome}</strong>? Esta ação fará soft delete (o paciente não aparecerá nas listagens, mas o histórico será preservado).
        </>
      }
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
