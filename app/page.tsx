"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { useCompletion } from "ai/react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { AxiosError } from 'axios';

export default function Page() {
  const {
    input,
    handleInputChange,
    setInput,
    handleSubmit,
    error,
    completion,
    isLoading,
  } = useCompletion({
    api: "/generate",
    onError: (err: Error | AxiosError) => {
      console.error("An error occurred:", err);
    },
  });

  const [sampleRepoUrl, setSampleRepoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!sampleRepoUrl) return;
    handleSubmit();
    setSampleRepoUrl(null);
  }, [sampleRepoUrl, handleSubmit]);

  const onClickSampleRepo = (url: string) => {
    setInput(url);
    setSampleRepoUrl(url);
  };

  return (
    <div className="flex flex-col gap-8 mb-8">
      <form
        className="flex flex-col sm:flex-row gap-2 relative"
        onSubmit={handleSubmit}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <GitHubLogoIcon className="size-5 text-stone-400" />
        </div>
        <Input
          type="url"
          name="url"
          value={input}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          placeholder="Enter public GitHub repository URL"
          className="text-lg rounded-full px-4 pl-12 h-12 transition-all bg-stone-900"
        />
        <Button
          size="lg"
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-full text-lg font-medium bg-slate-200 transition-colors"
        >
          Submit
        </Button>
      </form>
      {isLoading && completion.trim() === "" ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-[550px]" />
          <Skeleton className="h-12 w-[500px]" />
          <Skeleton className="h-12 w-[520px]" />
          <Skeleton className="h-12 w-[480px]" />
        </div>
      ) : error ? (
        <div className="bg-rose-950 px-4 rounded-md py-2 text-base text-rose-200">
          {error.message}
        </div>
      ) : completion ? (
        <div className="text-base prose prose-stone prose-sm prose-invert">
          <Markdown>{completion}</Markdown>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <SampleRepo slug="microsoft/typescript" onClick={onClickSampleRepo} />
          <SampleRepo slug="facebook/react" onClick={onClickSampleRepo} />
          <SampleRepo slug="vercel/next.js" onClick={onClickSampleRepo} />
        </div>
      )}
    </div>
  );
}

const SampleRepo = ({
  slug,
  onClick,
}: {
  slug: string;
  onClick: (url: string) => void;
}) => (
  <Button
    variant="outline"
    className="text-stone-300 gap-2"
    onClick={() => onClick(`https://github.com/${slug}`)}
  >
    {slug}
    <span className="text-stone-500">{"->"}</span>
  </Button>
);
