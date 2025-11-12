"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export type FileDropzoneProps = {
  label: string;
  description?: string;
  file: File | null;
  required?: boolean;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  onFileSelect: (file: File | null) => void;
};

export function FileDropzone({
  label,
  description,
  file,
  required,
  accept,
  disabled,
  onFileSelect
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFileSelect(accepted[0] ?? null);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept,
    disabled
  });

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      <div
        {...getRootProps({
          className: `flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed ${
            isDragActive ? "border-slate-900 bg-slate-100" : "border-slate-300 bg-white"
          } ${disabled ? "cursor-not-allowed bg-slate-100 opacity-60" : ""}`
        })}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="text-xs text-slate-600">
            <p className="font-medium">{file.name}</p>
            <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {disabled
              ? "Upload disabled"
              : isDragActive
              ? "Drop the file here"
              : "Drag & drop or click to select"}
          </p>
        )}
      </div>
    </div>
  );
}
