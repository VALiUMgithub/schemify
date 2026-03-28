import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useWizardStore } from "../store/wizard.store";
import { useUploadImport } from "../hooks/useUploadImport";
import { ArrowRight, FileText } from "lucide-react";

export const UploadStep = () => {
  const { selectedFile, setFile, setImportId, setStep, projectId } =
    useWizardStore();
  const { mutate: uploadImport, isPending, error } = useUploadImport();
  const [projectName, setProjectName] = useState("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    [setFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    if (!projectId) {
      alert(
        "No project selected! Please start the import flow from a specific project.",
      );
      return;
    }

    uploadImport(
      { file: selectedFile, projectId },
      {
        onSuccess: (data) => {
          setImportId(data.id);
          setStep(1); // Move to Preview Step
        },
      },
    );
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="flex flex-col rounded-2xl">
      <div className="mb-5 rounded-2xl border border-border bg-surface p-5">
        <label className="block text-content-primary font-semibold mb-2">
          Project name{" "}
          <span className="text-content-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface-subtle border border-brand-500/70 focus:border-brand-500 text-content-primary"
          placeholder="e.g. Project Hail Mary"
        />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer text-center min-h-[240px] ${
          isDragActive
            ? "border-brand-500 bg-brand-600/10"
            : selectedFile
              ? "border-brand-500 bg-brand-600/10"
              : "border-border-strong hover:border-brand-500/70 bg-surface"
        }`}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="mb-4 w-16 h-16 rounded-2xl bg-brand-500/15 text-brand-500 flex items-center justify-center">
                <FileText className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-3xl font-semibold text-content-primary">
                {selectedFile.name}
              </p>
              <p className="text-lg text-content-secondary mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB - click to change
              </p>
            </div>
            <button
              onClick={removeFile}
              className="text-sm text-content-muted hover:text-content-primary font-medium"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-content-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-semibold text-content-primary">
                Drop your file here
              </p>
              <p className="text-lg text-content-muted mt-1">
                Supports .csv, .xlsx, .xls
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 text-sm text-status-error-text bg-status-error-bg rounded-xl border border-status-error-text/20">
          Upload failed:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isPending}
          className="w-full px-6 py-3 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isPending ? (
            "Uploading..."
          ) : (
            <>
              <ArrowRight className="w-4 h-4" /> Upload & Prepare Preview
            </>
          )}
        </button>
      </div>
    </div>
  );
};
