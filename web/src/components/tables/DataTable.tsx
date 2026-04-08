import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type DataTableProps = {
  wrapClassName: string;
  tableClassName: string;
  headers: string[];
  rows: ReactNode[][];
};

function DataTable({ wrapClassName, tableClassName, headers, rows }: DataTableProps) {
  return (
    <div className={wrapClassName}>
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((cells, rowIndex) => (
            <TableRow key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
