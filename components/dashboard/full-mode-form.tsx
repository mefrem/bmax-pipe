"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import type { ActionResponse } from "@/app/(app)/dashboard/types";
import { FileDropzone } from "@/components/dashboard/file-dropzone";
import { SuccessModal } from "@/components/dashboard/success-modal";

type TemplateOption = {
  slug: string;
  name: string;
};

type FormValues = {
  mode: "template" | "custom";
  templateSlug?: string;
  projectName?: string;
};

type FullModeFormProps = {
  templates: TemplateOption[];
  action: (formData: FormData) => Promise<ActionResponse>;
};

export function FullModeForm({ templates, action }: FullModeFormProps) {
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      mode: "template",
      templateSlug: templates[0]?.slug
    }
  });

  const mode = watch("mode");
  const templateSlug = watch("templateSlug");
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [response, setResponse] = useState<ActionResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!templateSlug && templates[0]) {
      setValue("templateSlug", templates[0].slug);
    }
  }, [templateSlug, templates, setValue]);

  useEffect(() => {
    if (mode === "template") {
      setBriefFile(null);
    }
  }, [mode]);

  const submitting = useMemo(() => isSubmitting || isPending, [isSubmitting, isPending]);

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    formData.append("mode", values.mode);

    if (values.mode === "template") {
      if (!values.templateSlug) {
        setResponse({ success: false, message: "Please select a template." });
        return;
      }
      formData.append("templateSlug", values.templateSlug);
    } else {
      if (!values.projectName) {
        setResponse({ success: false, message: "Project name is required." });
        return;
      }

      if (!briefFile) {
        setResponse({ success: false, message: "Upload a project brief." });
        return;
      }

      formData.append("projectName", values.projectName);
      formData.append("brief", briefFile);
    }

    setResponse(null);

    startTransition(async () => {
      const result = await action(formData);
      setResponse(result);
    });
  });

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg peer-hover:opacity-15">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-900">YOLO MODE</h2>
        <p className="mt-2 text-sm text-slate-500">
          Have Claude Code implement your entire idea
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="radio" value="template" {...register("mode")} /> Use template
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="radio" value="custom" {...register("mode")} /> Upload project brief
          </label>
        </div>

        {mode === "template" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Project template</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              {...register("templateSlug")}
            >
              {templates.map((template) => (
                <option key={template.slug} value={template.slug}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="projectName">
                Project name
              </label>
              <input
                id="projectName"
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Zapier Trigger Builder"
                {...register("projectName")}
              />
            </div>
            <FileDropzone
              label="Project brief"
              description="Upload a markdown or PDF brief from the BMAD planning phase."
              file={briefFile}
              required
              onFileSelect={setBriefFile}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Start YOLO Orchestration"}
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
          promptFile="orch-full.md"
          onClose={() => setResponse(null)}
        />
      ) : null}
    </div>
  );
}
