import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Octokit } from "@octokit/rest";

const startingProjectPath = path.join(process.cwd(), "resources", "starting-project");
const promptsDir = path.join(process.cwd(), "resources", "prompts");

export type DocumentSource =
  | {
      kind: "path";
      filename: string;
      path: string;
    }
  | {
      kind: "buffer";
      filename: string;
      buffer: Buffer;
      originalName?: string;
      blobUrl?: string | null;
    };

export type OrchestrationPayload = {
  mode: "full" | "light";
  projectName: string;
  userEmail: string;
  userAccessToken: string;
  documents: DocumentSource[];
};

export type OrchestrationResult = {
  repoName: string;
  repoUrl: string;
  claudeInstructions: string;
  promptFilename: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function copyStartingProject(targetDir: string) {
  await fs.cp(startingProjectPath, targetDir, {
    recursive: true,
    force: true,
    filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`),
  });
}

async function writeDocument(targetDir: string, doc: DocumentSource) {
  const docsDir = path.join(targetDir, "docs");
  await fs.mkdir(docsDir, { recursive: true });

  const destPath = path.join(docsDir, doc.filename);

  if (doc.kind === "path") {
    await fs.copyFile(doc.path, destPath);
  } else {
    await fs.writeFile(destPath, doc.buffer);
  }
}

async function addPromptFile(targetDir: string, mode: "full" | "light") {
  const promptFilename = mode === "full" ? "orch-full.md" : "orch-light.md";
  const promptSource = path.join(promptsDir, promptFilename);
  const destPath = path.join(targetDir, promptFilename);
  await fs.copyFile(promptSource, destPath);
  return promptFilename;
}

async function listFilesRecursive(baseDir: string, currentDir = baseDir): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(baseDir, fullPath)));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function pushDirectoryToRepo({
  owner,
  repo,
  directory,
  branch,
  octokit,
}: {
  owner: string;
  repo: string;
  directory: string;
  branch: string;
  octokit: Octokit;
}) {
  console.log("[pushDirectoryToRepo] Listing files...");
  const files = await listFilesRecursive(directory);
  console.log(`[pushDirectoryToRepo] Found ${files.length} files to push`);

  // Get the current commit SHA of the branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const currentCommitSha = refData.object.sha;

  // Get the tree SHA of the current commit
  const { data: currentCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: currentCommitSha,
  });
  const baseTreeSha = currentCommit.tree.sha;

  console.log("[pushDirectoryToRepo] Creating blobs...");
  // Create blobs for all files
  const tree = await Promise.all(
    files.map(async (file) => {
      const absolutePath = path.join(directory, file);
      const content = await fs.readFile(absolutePath, { encoding: "base64" });

      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding: "base64",
      });

      return {
        path: file,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  console.log("[pushDirectoryToRepo] Creating tree...");
  // Create a new tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    tree,
    base_tree: baseTreeSha,
  });

  console.log("[pushDirectoryToRepo] Creating commit...");
  // Create a new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "chore: seed project files",
    tree: newTree.sha,
    parents: [currentCommitSha],
    author: {
      name: "bmax-pipe",
      email: "noreply@bmax-pipe",
    },
    committer: {
      name: "bmax-pipe",
      email: "noreply@bmax-pipe",
    },
  });

  console.log("[pushDirectoryToRepo] Updating ref...");
  // Update the branch reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  console.log("[pushDirectoryToRepo] Push complete!");
}

export async function orchestrateRepository({
  mode,
  projectName,
  userEmail,
  userAccessToken,
  documents,
}: OrchestrationPayload): Promise<OrchestrationResult> {
  const repoSlug = slugify(projectName);
  const repoName = `bmax-${repoSlug || "project"}-${Date.now()}`;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bmax-pipe-"));

  try {
    await copyStartingProject(tempDir);

    for (const doc of documents) {
      await writeDocument(tempDir, doc);
    }

    const promptFilename = await addPromptFile(tempDir, mode);

    console.log("[Orchestrator] Starting GitHub repository creation...");
    const octokit = new Octokit({ auth: userAccessToken });

    console.log("[Orchestrator] Fetching authenticated user...");
    const { data: userData } = await octokit.users.getAuthenticated();
    const owner = userData.login;
    console.log("[Orchestrator] Owner:", owner);

    console.log("[Orchestrator] Creating repository:", repoName);
    try {
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        auto_init: true,
        description: `Generated by bmax for ${userEmail}`,
      });
      console.log("[Orchestrator] Repository created successfully");
    } catch (error: any) {
      console.error("[Orchestrator] Failed to create repository:", error);
      throw new Error(
        `Failed to create GitHub repository: ${error?.message || "Unknown error"}. Please ensure you've granted the necessary permissions.`
      );
    }

    const defaultBranch = "main";

    console.log("[Orchestrator] Pushing files to repository...");
    await pushDirectoryToRepo({
      owner,
      repo: repoName,
      directory: tempDir,
      branch: defaultBranch,
      octokit,
    });
    console.log("[Orchestrator] Files pushed successfully");

    const repoUrl = `https://github.com/${owner}/${repoName}`;
    const claudeInstructions = `Visit https://claude.ai/code/.
Select the project ${repoName}, then type: "Load ${promptFilename} into your context and develop to 100% completion."`;

    return {
      repoName,
      repoUrl,
      claudeInstructions,
      promptFilename,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
