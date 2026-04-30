"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@/src/shared/components/global/ui";
import { DataTableColumnHeader } from "@/src/shared/components/global/datatable/data-table-column-header";
import { Pencil, FileText } from "lucide-react";

export type SocialReasonTableData = {
  id: string;
  name: string;
  shortName: string;
  status: string;
};

export function getSocialReasonColumns(onEdit: (reason: SocialReasonTableData) => void): ColumnDef<SocialReasonTableData>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Razão social" />
      ),
      cell: ({ row }) => {
        const reason = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-center justify-center">
            <span className="font-medium text-sm text-center flex justify-center">{reason.name}</span>
            <span className="text-xs text-muted-foreground uppercase">
              {reason.shortName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const reason = row.original;
        const status = reason.status;
        const isActive = status === "active";
        return (
          <div className="flex justify-center">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }
            >
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="text-center w-full block">Ações</span>,
      cell: ({ row }) => {
        const reason = row.original;
        return (
          <div className="flex justify-center gap-1">
            <a
              href={`/dashboard/documents?socialReasonId=${reason.id}`}
              title="Ver documentos desta razão social"
            >
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <FileText className="h-4 w-4" />
              </Button>
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(reason)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}























