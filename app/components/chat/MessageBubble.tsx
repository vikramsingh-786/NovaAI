import React from "react";
import { User, Bot, Copy, Check } from "lucide-react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "react-toastify";
import { Message } from "@/types";
import { motion } from "framer-motion";
import LoadingMessage from "./LoadingMessage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("markdown", markdown);

interface MessageBubbleProps {
  message: Message;
}

const codeBlockBaseStyle = "my-3 rounded-lg shadow-md overflow-hidden border";
const codeBlockHeaderBaseStyle =
  "flex justify-between items-center px-3.5 py-2 text-xs border-b";
const codeBlockContentBaseStyle = "overflow-x-auto text-sm";

const CompleteCodeBlock: React.FC<{
  language: string | undefined;
  code: string;
}> = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        toast.error("Failed to copy code.");
        console.error("Failed to copy code: ", err);
      });
  };
  const lang = language?.toLowerCase() || "text";
  return (
    <div
      className={`${codeBlockBaseStyle} bg-[var(--code-block-bg)] border-[var(--code-block-border)]`}
    >
      <div
        className={`${codeBlockHeaderBaseStyle} bg-[var(--code-block-header-bg)] border-[var(--code-block-border)] text-[var(--code-block-header-text)]`}
      >
        <span className="font-semibold capitalize">{lang}</span>
        <motion.button
          onClick={handleCopy}
          className="flex items-center p-1.5 rounded hover:bg-[var(--code-block-copy-hover-bg)] theme-transition"
          aria-label="Copy code"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} />
          )}
          <span className="ml-1.5 text-xs">{copied ? "Copied!" : "Copy"}</span>
        </motion.button>
      </div>
      <div className={`${codeBlockContentBaseStyle}`}>
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            lineHeight: "1.65",
            backgroundColor: "transparent",
            fontSize: "0.875rem",
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-geist-mono), "Fira Code", monospace',
            },
          }}
          showLineNumbers={code.split("\n").length > 2}
          lineNumberStyle={{
            color: "var(--code-line-number-color)",
            fontSize: "0.8em",
            paddingRight: "1.5em",
            userSelect: "none",
          }}
        >
          {code.trimEnd()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const StreamingCodeBlockPlaceholder: React.FC<{
  language: string | undefined;
  code: string;
}> = ({ language, code }) => {
  return (
    <div
      className={`${codeBlockBaseStyle} bg-[var(--code-block-bg)] border-[var(--code-block-border)]`}
    >
      <div
        className={`${codeBlockHeaderBaseStyle} bg-[var(--code-block-header-bg)] border-[var(--code-block-border)] text-[var(--code-block-header-text)]`}
      >
        <span className="font-semibold capitalize">{language || "code"}</span>
        <span className="text-[var(--code-block-streaming-text)]">
          Streaming...
        </span>
      </div>
      <div className={`${codeBlockContentBaseStyle}`}>
        <pre
          className="text-[var(--code-block-text)] whitespace-pre-wrap break-all font-mono p-4 sm:p-5 leading-relaxed text-sm"
          style={{
            fontFamily: 'var(--font-geist-mono), "Fira Code", monospace',
          }}
        >
          {code}
          <span className="inline-block w-0.5 h-4 bg-[var(--accent-purple)] animate-pulse ml-0.5 align-text-bottom"></span>
        </pre>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === "user";

  const parts = React.useMemo(() => {
    const newParts: (
      | string
      | {
          type: "complete_code" | "streaming_code";
          language: string | undefined;
          code: string;
        }
    )[] = [];
    let lastIndex = 0;
    let contentToParse = message.content;
    let activeStreamingBlock: {
      language: string | undefined;
      code: string;
    } | null = null;

    const completeCodeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
    const streamingCodeBlockStartRegex = /```(\w+)?\s*\n([\s\S]*)$/;

    if (message.isStreaming) {
      let tempContent = contentToParse;
      let lastTripleTickIndex = tempContent.lastIndexOf("```");

      if (lastTripleTickIndex !== -1) {
        const contentBeforeLastTicks = tempContent.substring(
          0,
          lastTripleTickIndex
        );
        const openTicksInContentBefore = (
          contentBeforeLastTicks.match(/```/g) || []
        ).length;

        if (openTicksInContentBefore % 2 === 0) {
          const potentialStreamingBlockContent =
            tempContent.substring(lastTripleTickIndex);
          const matchStreaming = potentialStreamingBlockContent.match(
            streamingCodeBlockStartRegex
          );
          if (matchStreaming) {
            activeStreamingBlock = {
              language: matchStreaming[1],
              code: matchStreaming[2],
            };
            contentToParse = tempContent.substring(0, lastTripleTickIndex);
          }
        }
      }
    }

    let matchComplete;
    while (
      (matchComplete = completeCodeBlockRegex.exec(contentToParse)) !== null
    ) {
      if (matchComplete.index > lastIndex) {
        newParts.push(contentToParse.substring(lastIndex, matchComplete.index));
      }
      newParts.push({
        type: "complete_code",
        language: matchComplete[1],
        code: matchComplete[2].trimEnd(),
      });
      lastIndex = matchComplete.index + matchComplete[0].length;
    }

    if (lastIndex < contentToParse.length) {
      newParts.push(contentToParse.substring(lastIndex));
    }

    if (activeStreamingBlock) {
      newParts.push({ type: "streaming_code", ...activeStreamingBlock });
    }

    if (newParts.length === 0 && contentToParse && !activeStreamingBlock) {
      newParts.push(contentToParse);
    }

    return newParts;
  }, [message.content, message.isStreaming]);

  const userBubbleClasses =
    "bg-gradient-to-br from-[var(--user-bubble-gradient-from)] to-[var(--user-bubble-gradient-to)] text-[var(--user-bubble-text)]";
  const assistantBubbleClasses =
    "bg-[var(--assistant-bubble-bg)] dark:bg-[var(--assistant-bubble-bg-dark)] border border-[var(--assistant-bubble-border)] dark:border-[var(--assistant-bubble-border-dark)] text-[var(--assistant-bubble-text)] dark:text-[var(--assistant-bubble-text-dark)]";

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end pl-6 sm:pl-10" : "justify-start pr-6 sm:pr-10"
      }`}
    >
      <div
        className={`flex max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-3xl ${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-start space-x-2 sm:space-x-3 ${
          isUser ? "space-x-reverse" : ""
        }`}
      >
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 self-start mt-1 shadow-md ${
            isUser
              ? "bg-gradient-to-br from-sky-500 to-indigo-500"
              : "bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]"
          } `}
        >
          {isUser ? (
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          ) : (
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          )}
        </div>

        <div
          className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl min-w-[60px] shadow-md ${
            isUser ? userBubbleClasses : assistantBubbleClasses
          }`}
        >
          {message.type === "assistant" &&
            message.isStreaming &&
            message.content === "" && <LoadingMessage />}

          {(message.type === "user" ||
            (message.type === "assistant" &&
              (message.content !== "" || !message.isStreaming))) &&
            parts.map((part, index) => {
              const partKey = `${message.id}-${
                typeof part === "string" ? "text" : part.type
              }-${index}-${message.timestamp}`;
              if (typeof part === "string") {
                return (
                  <div
                    key={partKey}
                    className="prose prose-sm dark:prose-invert max-w-none 
                                 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                                 prose-headings:my-2 prose-strong:font-semibold prose-strong:text-[var(--text-primary)]
                                 prose-a:text-[var(--accent-purple)] hover:prose-a:underline
                                 prose-code:bg-[var(--code-block-bg)] prose-code:text-[var(--code-block-text)] 
                                 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:font-mono prose-code:text-xs
                                 prose-pre:bg-transparent prose-pre:p-0"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                      }}
                    >
                      {part}
                    </ReactMarkdown>
                  </div>
                );
              } else if (part.type === "complete_code") {
                return (
                  <CompleteCodeBlock
                    key={partKey}
                    language={part.language}
                    code={part.code}
                  />
                );
              } else if (part.type === "streaming_code") {
                return (
                  <StreamingCodeBlockPlaceholder
                    key={partKey}
                    language={part.language}
                    code={part.code}
                  />
                );
              }
              return null;
            })}

          {!(
            message.type === "assistant" &&
            message.isStreaming &&
            message.content === ""
          ) && (
            <div className="text-[10px] sm:text-xs mt-2 opacity-80 text-right">
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
