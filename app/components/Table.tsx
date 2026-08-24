import type { ReactNode } from "react";

interface TableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
  caption?: string;
}

export default function Table({ headers, rows, caption }: TableProps) {
  return (
    <div className="fq-table-wrap">
      <table className="fq-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>{headers.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
