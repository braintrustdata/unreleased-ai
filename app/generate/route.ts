import { invoke, initLogger, wrapTraced } from "braintrust";
import { BraintrustAdapter } from "@braintrust/vercel-ai-sdk";
import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "@octokit/rest";
import { PROJECT_NAME, PROMPT_SLUG } from "@/lib/constants";

const logger = initLogger({
  projectName: PROJECT_NAME,
  apiKey: process.env.BRAINTRUST_API_KEY,
  // It is safe to set the "asyncFlush" flag to true in Vercel environments
  // because Braintrust calls waitUntil() automatically behind the scenes to
  // ensure your logs are flushed properly.
  asyncFlush: true,
});

// The GITHUB_ACCESS_TOKEN env var is optional. If you provide one,
// you'll be able to run with higher rate limits.
const octokit: Octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

type CommitsResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.repos.listCommits
>;

export async function POST(req: Request) {
  const { prompt: url } = await req.json();
  const result = await handleRequest(url);
  
  if (result instanceof Response) {
    return result;
  }
  
  return BraintrustAdapter.toAIStreamResponse(result);
}

const handleRequest = wrapTraced(async function handleRequest(url: string) {
  // Parse the URL to get the owner and repo name
  const [owner, repo] = url.split("github.com/")[1].split("/");

  const result = await getCommits(owner, repo);
  const { commits, since } = result;
  const input = {
    url,
    since: since ?? "the beginning",
    commits: commits.map(({ commit }) => `${commit.message}\n\n`),
  };

  return await invoke({
    projectName: PROJECT_NAME,
    slug: PROMPT_SLUG,
    input: {
      url,
      since: since ?? "the beginning",
      commits: commits.map(({ commit }) => `${commit.message}\n\n`),
    },
    stream: true,
  });
});

const getCommits = wrapTraced(async function getCommits(
  owner: string,
  repo: string
): Promise<{ commits: CommitsResponse['data']; since: string | null }> {
  try {
    // Fetch the latest release from the GitHub API
    const releaseResponse = await octokit.rest.repos.getLatestRelease({
      owner,
      repo,
    });

    let since: string | null = null;
    if (releaseResponse && releaseResponse.data) {
      since = releaseResponse.data.published_at;
    }

    // Fetch the latest commits (up to 20)
    const commitResponse: CommitsResponse = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: since ?? undefined,
      per_page: 20,
    });

    const commits = commitResponse.data;

    // If there was no release, set 'since' to the date of the oldest commit
    if (!since && commits.length > 0) {
      since = commits[commits.length - 1].commit.author?.date ?? null;
    }

    return { commits, since };

  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      // If there are no releases, just fetch the latest 20 commits
      const commitResponse: CommitsResponse = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 20,
      });
      const commits = commitResponse.data;
      const since = commits.length > 0 ? commits[commits.length - 1].commit.author?.date ?? null : null;
      return { commits, since };
    }
    // Re-throw other errors
    throw error;
  }
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
