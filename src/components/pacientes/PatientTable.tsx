"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import type { Paciente } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";

interface Props {
  pacientes: Paciente[];
  onDelete: (p: Paciente) => void;
}

export function PatientTable({ pacientes, onDelete }: Props) {
  if (pacientes.length === 0) return null;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Paciente</th>
              <th className="text-left p-3 font-semibold">Contato</th>
              <th className="text-left p-3 font-semibold">Idade</th>
              <th className="text-left p-3 font-semibold">Objetivo</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(p.nomeCompleto)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/pacientes/${p.id}`} className="font-medium hover:underline">
                        {p.nomeCompleto}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(p.dataNascimento)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <p className="text-sm">{p.telefone}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">{p.email}</p>
                </td>
                <td className="p-3">{calcIdade(p.dataNascimento) ?? "—"} anos</td>
                <td className="p-3 capitalize text-xs">{p.objetivo.replace("_", " ")}</td>
                <td className="p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild title="Ver">
                      <Link href={`/pacientes/${p.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Editar">
                      <Link href={`/pacientes/${p.id}/editar`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(p)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid gap-3">
        {pacientes.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{getInitials(p.nomeCompleto)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link href={`/pacientes/${p.id}`} className="font-medium text-sm hover:underline block truncate">
                      {p.nomeCompleto}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.telefone} • {calcIdade(p.dataNascimento)}a • {p.objetivo.replace("_", " ")}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <DropdownMenuItem asChild className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent">
                      <Link href={`/pacientes/${p.id}`} className="flex w-full gap-2">
                        <Eye className="h-4 w-4" /> Ver
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent">
                      <Link href={`/pacientes/${p.id}/editar`} className="flex w-full gap-2">
                        <Pencil className="h-4 w-4" /> Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(p)} className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
