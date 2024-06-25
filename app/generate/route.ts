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
  const changelog = await handleRequest(url);
  return BraintrustAdapter.toAIStreamResponse(changelog);
}

const handleRequest = wrapTraced(async function handleRequest(url: string) {
  // Parse the URL to get the owner and repo name
  const [owner, repo] = url.split("github.com/")[1].split("/");

  const { commits, since } = await getCommits(owner, repo);

  return await invoke({
    project_name: PROJECT_NAME,
    slug: PROMPT_SLUG,
    input: {
      url,
      since,
      commits: commits.map(({ commit }) => `${commit.message}\n\n`),
    },
    stream: true,
  });
});

const getCommits = wrapTraced(async function getCommits(
  owner: string,
  repo: string,
) {
  // Fetch the latest release from the GitHub API
  const releaseResponse = await octokit.rest.repos.getLatestRelease({
    owner,
    repo,
  });
  const release = releaseResponse.data;
  const since = release.published_at;

  // Then fetch the corresponding commits
  const commitResponse: CommitsResponse = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since: since ?? undefined,
    per_page: 50,
  });

  const commits = commitResponse.data;
  return { commits, since };
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
