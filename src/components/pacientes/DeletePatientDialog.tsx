"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeletePatientDialog({ open, onOpenChange, pacienteNome, onConfirm, loading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir paciente?</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{pacienteNome}</strong>? Esta ação fará soft delete (o paciente não aparecerá nas listagens, mas o histórico será preservado).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
