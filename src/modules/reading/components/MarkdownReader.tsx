"use client";

import { Fragment } from "react";

import type { Token, TokenRun, TokenizedBlock } from "@/modules/reading/lib/tokenize";

type MarkdownReaderProps = {
  blocks: TokenizedBlock[];
};

function renderToken(token: Token) {
  if (token.kind === "word") {
    return (
      <span key={token.id} data-token-id={token.id}>
        {token.text}
      </span>
    );
  }

  return (
    <span key={token.id} aria-hidden="true">
      {token.text}
    </span>
  );
}

function renderRun(run: TokenRun, index: number) {
  const content = run.tokens.map(renderToken);

  if (run.style === "bold") {
    return <strong key={`run-${index}`}>{content}</strong>;
  }

  if (run.style === "italic") {
    return <em key={`run-${index}`}>{content}</em>;
  }

  return <Fragment key={`run-${index}`}>{content}</Fragment>;
}

export function MarkdownReader({ blocks }: MarkdownReaderProps) {
  return (
    <article className="text-foreground">
      {blocks.map((block) => {
        if (block.type === "h1") {
          return (
            <h1
              key={block.blockId}
              data-block-id={block.blockId}
              className="mb-8 text-3xl leading-tight font-bold"
            >
              {block.runs.map(renderRun)}
            </h1>
          );
        }

        if (block.type === "h2") {
          return (
            <h2
              key={block.blockId}
              data-block-id={block.blockId}
              className="mt-10 mb-4 text-2xl leading-tight font-semibold"
            >
              {block.runs.map(renderRun)}
            </h2>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p
              key={block.blockId}
              data-block-id={block.blockId}
              className="mb-5 leading-[1.85]"
            >
              {block.runs.map(renderRun)}
            </p>
          );
        }

        return (
          <ul
            key={block.blockId}
            data-block-id={block.blockId}
            className="mb-6 list-disc space-y-2 pl-8 leading-[1.85]"
          >
            {block.items.map((item, itemIndex) => (
              <li key={`${block.blockId}:item:${itemIndex}`}>
                {item.runs.map(renderRun)}
              </li>
            ))}
          </ul>
        );
      })}
    </article>
  );
}
