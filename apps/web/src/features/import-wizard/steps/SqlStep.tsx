import { useEffect } from "react";
import { useWizardStore } from "../store/wizard.store";
import { useGenerateSchema } from "../hooks/useGenerateSchema";
import { SqlEditor } from "../../../components/ui/SqlEditor";

export const SqlStep = () => {
  const {
    importId,
    setStep,
    selectedFile,
    databaseType,
    setDatabaseType,
    tableName,
    setTableName,
    generatedSql,
    editedSql,
    setGeneratedSql,
    setEditedSql,
    resetSqlToGenerated,
  } = useWizardStore();

  // Set default table name if not set
  useEffect(() => {
    if (!tableName && selectedFile) {
      setTableName(
        selectedFile.name
          .split(".")[0]
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toLowerCase(),
      );
    }
  }, [tableName, selectedFile, setTableName]);

  const {
    mutate: generate,
    data: scriptData,
    isPending,
    error,
  } = useGenerateSchema(importId);

  // Sync generated SQL to store when received from API
  useEffect(() => {
    if (scriptData?.sqlScript) {
      setGeneratedSql(scriptData.sqlScript);
    }
  }, [scriptData, setGeneratedSql]);

  const handleGenerate = () => {
    generate({ databaseType: databaseType, tableName });
  };

  // Determine if SQL has been modified from original
  const isModified = editedSql !== null && editedSql !== generatedSql;

  // Current SQL to display (edited or generated)
  const currentSql = editedSql ?? generatedSql ?? "";

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex-shrink-0">
        <p className="text-lg text-content-secondary">
          SQL generated from your schema. Review and edit before executing.
        </p>
      </div>

      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            Target Engine
          </label>
          <select
            value={databaseType}
            onChange={(e) => setDatabaseType(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mssql">SQL Server</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            Table Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={handleGenerate}
          disabled={isPending || !tableName}
          className="px-4 py-2 bg-surface-subtle text-content-primary font-medium rounded-xl hover:bg-surface-muted border border-border disabled:opacity-50 transition-colors"
        >
          {isPending ? "Generating..." : "Generate SQL"}
        </button>
      </div>

      {error && (
        <div className="flex-shrink-0 p-4 text-sm text-status-error-text bg-status-error-bg rounded-xl border border-status-error-text/20">
          {error instanceof Error ? error.message : "Error generating script"}
        </div>
      )}

      <SqlEditor
        value={currentSql}
        onChange={setEditedSql}
        dialect={databaseType as "postgres" | "mysql" | "mssql"}
        filename="schema.sql"
        placeholderText="-- Click 'Regenerate SQL' to generate script"
        showReset={true}
        onReset={resetSqlToGenerated}
        isModified={isModified}
        className="flex-1 min-h-0 overflow-hidden"
      />

      <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border">
        <button
          onClick={() => setStep(2)}
          className="px-2 py-2.5 text-content-secondary font-medium rounded-xl hover:text-content-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            setStep(4);
          }}
          disabled={!currentSql}
          className="px-6 py-2.5 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          Execute →
        </button>
      </div>
    </div>
  );
};
