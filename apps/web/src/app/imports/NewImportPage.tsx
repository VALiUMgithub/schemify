import { useSearchParams } from "react-router-dom";
import { WizardLayout } from "@/features/import-wizard/components/WizardLayout";
import { UploadStep } from "@/features/import-wizard/steps/UploadStep";
import { PreviewStep } from "@/features/import-wizard/steps/PreviewStep";
import { SchemaStep } from "@/features/import-wizard/steps/SchemaStep";
import { SqlStep } from "@/features/import-wizard/steps/SqlStep";
import { ExecuteStep } from "@/features/import-wizard/steps/ExecuteStep";
import { useWizardStore } from "@/features/import-wizard/store/wizard.store";
import { useEffect } from "react";

export default function NewImportPage() {
  const { currentStep, setStep, setProjectId } = useWizardStore();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  // Reset wizard on dismount or mount if needed, and set initial project id
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
    return () => {
      setStep(0);
      setProjectId(null);
    };
  }, [setStep, setProjectId, projectId]);

  return (
    <div className="h-full min-h-0">
      <WizardLayout>
        {currentStep === 0 && <UploadStep />}
        {currentStep === 1 && <PreviewStep />}
        {currentStep === 2 && <SchemaStep />}
        {currentStep === 3 && <SqlStep />}
        {currentStep === 4 && <ExecuteStep />}
      </WizardLayout>
    </div>
  );
}
