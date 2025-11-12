export type ActionResponse = {
  success: boolean;
  message: string;
  runId?: string;
  result?: {
    repoName: string;
    repoUrl: string;
    claudeInstructions: string;
    promptFilename: string;
  };
};

export type DashboardAction = (formData: FormData) => Promise<ActionResponse>;
