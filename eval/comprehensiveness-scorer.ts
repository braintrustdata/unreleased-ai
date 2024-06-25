import { LLMClassifierFromTemplate, Scorer } from "autoevals";

// Although we upload the main prompt to Braintrust, it's okay to hardcode prompts
// too. For example, this scoring logic will now be √ersion controlled alongside
// the project.
//
// However, if you want, you can upload this into Braintrust and call it as a
// function too!
const promptTemplate = `You are an expert technical writer who helps assess how effectively an open source product team generates a changelog based on git commits since the last release. Analyze commit messages and determine if the changelog is comprehensive, accurate, and informative.

Input:
{{input}}

Changelog:
{{output}}

Assess the comprehensiveness of the changelog and select one of the following options. List out which commits are missing from the changelog if it is not comprehensive.

a) The changelog is comprehensive and includes all relevant commits
b) The changelog is mostly comprehensive but is missing a few commits
c) The changelog includes changes that are not in commit messages
d) The changelog is incomplete and not informative`;

export const comprehensiveness: Scorer<string, { input: string }> =
  LLMClassifierFromTemplate<{
    input: string;
  }>({
    name: "Comprehensiveness",
    promptTemplate,
    choiceScores: { a: 1, b: 0.5, c: 0.25, d: 0 },
    useCoT: true,
    model: "gpt-4o",
  });
