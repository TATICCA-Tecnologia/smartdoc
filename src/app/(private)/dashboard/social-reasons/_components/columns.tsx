"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@/src/shared/components/global/ui";
import { DataTableColumnHeader } from "@/src/shared/components/global/datatable/data-table-column-header";

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
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => onEdit(reason)}
              title="Abrir para edição"
            >
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={
                  isActive
                    ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
                    : "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                }
              >
                {isActive ? "Ativo" : "Inativo"}
              </Badge>
            </Button>
          </div>
        );
      },
    },
  ];
}























