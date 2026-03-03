"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@/src/shared/components/global/ui";
import { DataTableColumnHeader } from "@/src/shared/components/global/datatable/data-table-column-header";

type OrganizationType = "FEDERAL" | "ESTADUAL" | "MUNICIPAL" | "OUTROS";

export type OrgaoTableData = {
  id: string;
  name: string;
  shortName: string;
  type: OrganizationType;
  city: string;
  state: string;
  status: string;
  documentsCount: number;
};

export function getOrgaoColumns(onEdit: (orgao: OrgaoTableData) => void): ColumnDef<OrgaoTableData>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Órgão" className="justify-center flex text-center w-full" />
      ),
      cell: ({ row }) => {
        const orgao = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-center justify-center">
            <span className="font-medium text-sm">{orgao.name}</span>
            <span className="text-xs text-muted-foreground uppercase">
              {orgao.shortName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" className="justify-center flex text-center w-full" />
      ),
      cell: ({ row }) => <span className="text-sm text-center flex justify-center">{row.original.type}</span>,
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Município" className="justify-center flex text-center w-full" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-center flex justify-center">{row.original.city}</span>
      ),
    },
    {
      accessorKey: "state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="UF" className="justify-center flex text-center w-full" />
      ),
      cell: ({ row }) => <span className="text-sm text-center flex justify-center">{row.original.state}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" className="justify-center flex text-center w-full" />
      ),
      cell: ({ row }) => {
        const orgao = row.original;
        const status = orgao.status;
        const isActive = status === "active";
        return (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => onEdit(orgao)}
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























