import { ReactNode } from "react";

type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type SimpleListPageProps<T> = {
  title: string;
  description: string;
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
};

export function SimpleListPage<T>({ title, description, columns, rows, getKey }: SimpleListPageProps<T>) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="table">
        <div className="table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}>
          {columns.map((column) => (
            <span key={column.header}>{column.header}</span>
          ))}
        </div>
        {rows.length ? (
          rows.map((row) => (
            <div
              className="table-row"
              key={getKey(row)}
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))` }}
            >
              {columns.map((column) => (
                <span key={column.header}>{column.render(row)}</span>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada data.</div>
        )}
      </div>
    </section>
  );
}
