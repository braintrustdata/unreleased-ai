import { invoke, Eval } from "braintrust";
import { sampleData } from "./sampleData";
import { comprehensiveness } from "./comprehensiveness-scorer";
import { z } from "zod";
import { PROJECT_NAME, PROMPT_SLUG } from "@/lib/constants";

interface Input {
  url: string;
  since: string;
  commits: any[];
}

const comprehensivessScorer = ({
  input,
  output,
}: {
  input: Input;
  output: string;
}) => {
  return comprehensiveness({
    input: input.commits.map(({ message }) => message).join("\n"),
    output,
  });
};

Eval(PROJECT_NAME, {
  data: () => [sampleData],
  task: async (input) =>
    await invoke({
      projectName: PROJECT_NAME,
      slug: PROMPT_SLUG,
      input,
      schema: z.string(),
    }),
  scores: [comprehensivessScorer],
});
