# Unreleased AI

Unreleased AI is a simple web application that allows you to inspect commits from your favorite
open source repos that have not been released yet, and summarize what's coming. It comes fully
baked with Braintrust setup for logging, evals, and prompt management.

## Getting started

To setup your API keys:

- Create [Braintrust]("https://braintrust.dev") account and [create an API key](https://www.braintrust.dev/app/settings?subroute=api-keys).
- Create a `.env.local` file and add the API key (`BRAINTRUST_API_KEY=...`).
- Plug in your OpenAI API key in the [settings page](https://www.braintrust.dev/app/settings?subroute=secrets).

That's it! Now you can use your Braintrust API key to access OpenAI (and other AI providers), as well as log
completions, run evals, and create prompts.

### Installing JS dependencies

Install [pnpm](https://pnpm.io/installation) or a package manager of your choice. Then, run

```bash
pnpm install
```

This will install the necessary dependencies and setup the project in Braintrust. If you visit Braintrust, you
should see a project named `Unreleased`, containing a single prompt. Feel free to tweak it!

### Running the app

```bash
pnpm dev
```

will start the Next.js app on `localhost:3000`.

### Running evals

```bash
pnpm eval
```

This will run the evals defined in [changelog.ts](./eval/changelog.ts) and log the results to Braintrust.

## Developing

If you are using an unreleased version of the Braintrust SDK, you can link this repo by running

```
pnpm link ../path/to/braintrust-sdk/js
```
