"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import type { ActionResponse } from "@/app/(app)/dashboard/types";
import { FileDropzone } from "@/components/dashboard/file-dropzone";
import { SuccessModal } from "@/components/dashboard/success-modal";

type FormValues = {
  projectName: string;
};

type LightModeFormProps = {
  action: (formData: FormData) => Promise<ActionResponse>;
};

export function LightModeForm({ action }: LightModeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<FormValues>();
  const [prdFile, setPrdFile] = useState<File | null>(null);
  const [architectureFile, setArchitectureFile] = useState<File | null>(null);
  const [frontendFile, setFrontendFile] = useState<File | null>(null);
  const [response, setResponse] = useState<ActionResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitting = isSubmitting || isPending;

  const onSubmit = handleSubmit((values) => {
    if (!prdFile || !architectureFile) {
      setResponse({ success: false, message: "PRD and Architecture files are required." });
      return;
    }

    const formData = new FormData();
    formData.append("projectName", values.projectName);
    formData.append("prd", prdFile);
    formData.append("architecture", architectureFile);
    if (frontendFile) {
      formData.append("frontend", frontendFile);
    }

    setResponse(null);

    startTransition(async () => {
      const result = await action(formData);
      setResponse(result);
    });
  });

  return (
    <div className="peer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group-hover:opacity-15">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-900">BMAX</h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">prd.md</code> and <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">architecture.md</code> you created with the BMAD @pm and @architect elicitation process and automate implementation
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="lightProjectName">
            Project name
          </label>
          <input
            id="lightProjectName"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Frontier Audio Control Panel"
            {...register("projectName", { required: true })}
          />
        </div>

        <FileDropzone
          label="PRD document"
          description="Markdown, PDF, or DOCX from your PM analyst."
          file={prdFile}
          required
          onFileSelect={setPrdFile}
        />

        <FileDropzone
          label="Architecture document"
          description="Systems architecture describing key services and data contracts."
          file={architectureFile}
          required
          onFileSelect={setArchitectureFile}
        />

        <FileDropzone
          label="Front-end spec (optional)"
          description="Upload if you have UI flows to include."
          file={frontendFile}
          onFileSelect={setFrontendFile}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Start BMAX Orchestration"}
        </button>
      </form>

      {response && !response.success ? (
        <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-medium">{response.message}</p>
        </div>
      ) : null}

      {response?.success && response.result ? (
        <SuccessModal
          repoName={response.result.repoName}
          repoUrl={response.result.repoUrl}
          promptFile="orch-light.md"
          onClose={() => setResponse(null)}
        />
      ) : null}
    </div>
  );
}
