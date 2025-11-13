"use client";

import { useState } from "react";

type SuccessModalProps = {
  repoName: string;
  repoUrl: string;
  promptFile: string;
  onClose: () => void;
};

export function SuccessModal({ repoName, repoUrl, promptFile, onClose }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);
  
  const truncatedRepoName = repoName.length > 20 ? repoName.substring(0, 20) + "..." : repoName;
  const promptText = `Load \`${promptFile}\` into your context and Go!`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-8 py-6">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold text-slate-900">
            Repository Created
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Your project is ready for orchestration
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <div className="mb-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Repository
            </p>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-slate-900 underline decoration-slate-300 hover:decoration-slate-500"
            >
              {repoUrl}
            </a>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Last step:
              </h3>
              
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Visit Claude Code on Web</p>
                    <a
                      href="https://claude.ai/code"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-600 underline decoration-slate-300 hover:decoration-slate-500"
                    >
                      claude.ai/code
                    </a>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Select your repository</p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      {truncatedRepoName}
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="mb-2 font-medium text-slate-900">Paste this prompt</p>
                    <div className="relative">
                      <pre className="overflow-x-auto rounded border border-slate-200 bg-slate-50 p-3 pr-16 text-xs text-slate-900">
{promptText}
                      </pre>
                      <button
                        onClick={handleCopy}
                        className="absolute right-2 top-2 rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 px-8 py-6">
          <a
            href="https://claude.ai/code"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded bg-amber-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-amber-800"
          >
            Open Claude Code →
          </a>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

