import { useState, useEffect } from "react";
import { useWizardStore } from "../store/wizard.store";
import { useDetectSchema } from "../hooks/useDetectSchema";
import { useUpdateColumns } from "../hooks/useUpdateColumns";

interface ColumnConfig {
  id: string;
  name: string;
  baseType: string;
  sizeValue: string;
  useMaxSize: boolean;
  nullable: boolean;
}

const STRING_TYPES = new Set(["VARCHAR", "NVARCHAR"]);

const TYPE_COLORS: Record<string, string> = {
  VARCHAR: "bg-teal-500/15 text-teal-600 border-teal-500/30",
  NVARCHAR: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  TEXT: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  INT: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  FLOAT: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  NUMERIC: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  DECIMAL: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  BOOLEAN: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  DATE: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  TIMESTAMP: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

function getTypeSelectClasses(baseType: string): string {
  const color =
    TYPE_COLORS[baseType] ??
    "bg-surface-subtle text-content-primary border-border";
  return [
    "w-full px-3 py-2 border rounded-xl",
    "focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
    "sm:text-sm transition-colors",
    color,
  ].join(" ");
}

function getSizeLimit(databaseType: string, baseType: string): number | null {
  if (databaseType !== "mssql") return null;
  if (baseType === "NVARCHAR") return 4000;
  if (baseType === "VARCHAR") return 8000;
  return null;
}

function parseColumnType(
  type: string,
): Pick<ColumnConfig, "baseType" | "sizeValue" | "useMaxSize"> {
  const normalized = (type || "VARCHAR").trim().toUpperCase();
  const match = normalized.match(/^([A-Z]+)\s*(?:\(\s*(MAX|\d+)\s*\))?$/);

  if (!match) {
    return {
      baseType: "VARCHAR",
      sizeValue: "255",
      useMaxSize: false,
    };
  }

  const baseType = match[1];
  const sizeToken = match[2];
  const hasStringSize = baseType === "VARCHAR" || baseType === "NVARCHAR";

  return {
    baseType,
    sizeValue:
      hasStringSize && sizeToken && sizeToken !== "MAX" ? sizeToken : "255",
    useMaxSize: hasStringSize && sizeToken === "MAX",
  };
}

function buildDetectedType(column: ColumnConfig): string {
  const baseType = column.baseType.toUpperCase();

  if (baseType === "VARCHAR" || baseType === "NVARCHAR") {
    if (column.useMaxSize) return `${baseType}(MAX)`;

    const parsed = Number.parseInt(column.sizeValue, 10);
    const size = Number.isFinite(parsed) && parsed > 0 ? parsed : 255;
    return `${baseType}(${size})`;
  }

  return baseType;
}

export const SchemaStep = () => {
  const { importId, setStep, databaseType, setDatabaseType } = useWizardStore();

  const {
    data: schemaData,
    isLoading: detecting,
    error: detectError,
  } = useDetectSchema(importId);
  const { mutate: updateColumns, isPending: updating } =
    useUpdateColumns(importId);

  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  useEffect(() => {
    if (schemaData?.columns) {
      setColumns(
        schemaData.columns.map((column) => {
          const parsed = parseColumnType(column.type);
          return {
            id: column.id,
            name: column.name,
            nullable: column.nullable,
            ...parsed,
          };
        }),
      );
    }
  }, [schemaData]);

  if (detecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-content-secondary font-medium">
          Detecting data types and building schema...
        </p>
      </div>
    );
  }

  if (detectError) {
    return (
      <div className="p-6 bg-surface rounded-2xl border border-status-error-text/30">
        <h3 className="text-lg font-medium text-status-error-text mb-2">
          Error detecting schema
        </h3>
        <p className="text-status-error-text/90">
          {detectError instanceof Error ? detectError.message : "Unknown error"}
        </p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 border border-border rounded hover:bg-surface-subtle text-sm font-medium text-content-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleUpdate = (
    id: string,
    field: keyof ColumnConfig,
    value: string | boolean,
  ) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, [field]: value } : col)),
    );
  };

  const handleTypeChange = (id: string, newType: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== id) return col;

        const baseType = newType.toUpperCase();
        if (STRING_TYPES.has(baseType)) {
          return {
            ...col,
            baseType,
            sizeValue: col.sizeValue || "255",
            useMaxSize: false,
          };
        }

        return {
          ...col,
          baseType,
          sizeValue: "",
          useMaxSize: false,
        };
      }),
    );
  };

  const getColumnValidationError = (column: ColumnConfig): string | null => {
    if (!STRING_TYPES.has(column.baseType)) return null;
    if (column.useMaxSize) return null;

    const parsed = Number.parseInt(column.sizeValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return "Size must be a positive number";
    }

    const sizeLimit = getSizeLimit(databaseType, column.baseType);
    if (sizeLimit && parsed > sizeLimit) {
      return `${column.baseType} supports up to ${sizeLimit} for SQL Server; use MAX for larger values`;
    }

    return null;
  };

  const validationErrors = columns.reduce<Record<string, string>>(
    (acc, column) => {
      const error = getColumnValidationError(column);
      if (error) acc[column.id] = error;
      return acc;
    },
    {},
  );

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleNext = () => {
    // Save schema modifications
    const updates = columns.map((c) => ({
      columnId: c.id,
      name: c.name,
      detectedType: buildDetectedType(c),
      nullable: c.nullable,
    }));

    updateColumns(
      { updates },
      {
        onSuccess: () => {
          setStep(3); // Go to SQL Preview
        },
        onError: (err) => {
          alert("Failed to save schema changes: " + err.message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <div>
          <p className="text-lg text-content-secondary">
            Review and adjust the detected data types and column properties.
          </p>
        </div>
        <div className="w-60">
          <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
            Target Database
          </label>
          <select
            value={databaseType}
            onChange={(e) => setDatabaseType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm bg-surface-subtle text-content-primary"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mssql">SQL Server</option>
          </select>
          <p className="mt-2 text-xs text-content-muted">
            Size limits are validated for this database.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-subtle sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Data Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Nullable
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border/60">
              {columns.map((col) => (
                <tr
                  key={col.id}
                  className="hover:bg-surface-subtle/60 transition-colors"
                >
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) =>
                        handleUpdate(col.id, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm text-content-primary"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={col.baseType}
                      onChange={(e) => handleTypeChange(col.id, e.target.value)}
                      className={getTypeSelectClasses(col.baseType)}
                    >
                      <option value="VARCHAR">VARCHAR</option>
                      <option value="NVARCHAR">NVARCHAR</option>
                      <option value="TEXT">TEXT</option>
                      <option value="INT">INT</option>
                      <option value="FLOAT">FLOAT</option>
                      <option value="NUMERIC">NUMERIC</option>
                      <option value="DECIMAL">DECIMAL</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="DATE">DATE</option>
                      <option value="TIMESTAMP">TIMESTAMP</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    {STRING_TYPES.has(col.baseType) ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          disabled={col.useMaxSize}
                          value={col.sizeValue}
                          onChange={(e) =>
                            handleUpdate(col.id, "sizeValue", e.target.value)
                          }
                          className={`w-28 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm disabled:bg-surface-muted ${validationErrors[col.id] ? "border-status-error-text" : "border-border"}`}
                          placeholder="255"
                        />
                        <label className="inline-flex items-center gap-1 text-xs text-content-secondary">
                          <input
                            type="checkbox"
                            checked={col.useMaxSize}
                            onChange={(e) =>
                              handleUpdate(
                                col.id,
                                "useMaxSize",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-brand-500 border-border rounded focus:ring-brand-500 cursor-pointer"
                          />
                          MAX
                        </label>
                      </div>
                    ) : (
                      <span className="text-xs text-content-muted">N/A</span>
                    )}
                    {validationErrors[col.id] && (
                      <p className="mt-1 text-xs text-status-error-text">
                        {validationErrors[col.id]}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={col.nullable}
                        aria-label={`Toggle nullable for ${col.name}`}
                        onClick={() =>
                          handleUpdate(col.id, "nullable", !col.nullable)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${col.nullable ? "bg-emerald-500" : "bg-slate-400"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${col.nullable ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                      <span
                        className={`w-8 text-left text-xs font-semibold ${col.nullable ? "text-emerald-600" : "text-content-secondary"}`}
                      >
                        {col.nullable ? "YES" : "NO"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <button
          onClick={() => setStep(1)}
          className="px-2 py-2.5 text-content-secondary font-medium rounded-xl hover:text-content-primary transition-colors disabled:opacity-50"
          disabled={updating}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={updating || columns.length === 0 || hasValidationErrors}
          className="px-6 py-2.5 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updating ? "Saving..." : "Generate SQL →"}
        </button>
      </div>
    </div>
  );
};
