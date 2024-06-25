import Braintrust from "@braintrust/api";
import { config } from "dotenv";
import { ArgumentParser } from "argparse";
import { PROJECT_NAME, PROMPT_SLUG } from "@/lib/constants";

config({ path: ".env.local" });

const parser = new ArgumentParser({
  description: "Setup the Unreleased changelog prompt",
});

parser.add_argument("--force", {
  help: "Overwrite the prompt if it already exists.",
  action: "store_true",
});
parser.add_argument("--api-key", {
  help: "The API key to use to create the prompt.",
  type: "str",
  default: process.env.BRAINTRUST_API_KEY,
});
parser.add_argument("--api-url", {
  help: "The API URL (api.braintrustdata.com or your custom endpoint).",
  type: "str",
  default: process.env.BRAINTRUST_API_URL ?? "https://api.braintrustdata.com",
});
parser.add_argument("--project-name", {
  help: "The name of the project to create the prompt for.",
  type: "str",
  default: PROJECT_NAME,
});
parser.add_argument("--prompt-slug", {
  help: "The slug of the prompt to create.",
  type: "str",
  default: PROMPT_SLUG,
});

interface ParsedArgs {
  force: boolean;
  project_name: string;
  prompt_slug: string;
  api_key: string;
  api_url: string;
}

// This setup script uses the Braintrust REST API to create a prompt in the Unreleased
// project if it does not already exist. Check out the full REST API docs for prompts
// at https://www.braintrust.dev/docs/reference/api#list-prompts
async function setup() {
  const args: ParsedArgs = parser.parse_args();

  const braintrust = new Braintrust({
    apiKey: args.api_key,
    baseURL: args.api_url,
  });

  const project = await braintrust.project.create({
    name: args.project_name,
  });
  const projectId = project.id;

  if (!projectId) {
    console.error("Project not found");
    return;
  }

  // Check if the prompt already exists
  const searchParams = new URLSearchParams();
  searchParams.set("project_name", args.project_name);
  searchParams.set("slug", args.prompt_slug);

  if (!args.force) {
    const existingPrompt = await braintrust.prompt.list({
      project_name: args.project_name,
      slug: args.prompt_slug,
    });
    if (existingPrompt.objects.length > 0) {
      console.log(
        "Prompt already exists. Skipping creating it. To force create it, run with `--force`",
      );
      return;
    }
  }

  // Feel free to tweak the prompt to whatever you'd like. But keep in mind, this is just
  // setting up the initial prompt. Once you create it, you can edit it in the UI.
  await braintrust.prompt.create({
    project_id: projectId,
    name: "Generate changelog",
    description: "Generate a changelog from a list of unreleased commits",
    slug: args.prompt_slug,
    prompt_data: {
      prompt: {
        type: "chat",
        messages: [
          {
            role: "user",
            content:
              "Summarize the following commits from {{url}} since {{since}} in changelog form. Include a summary of changes at the top since the provided date, followed by individual pull requests (be concise).\n\n{{commits}}",
          },
        ],
      },
      options: {
        model: "gpt-4o",
      },
    },
  });
}

setup();
