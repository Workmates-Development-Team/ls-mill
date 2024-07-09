import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark, prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
// import { CopyIcon } from "../assets/SVG/Icons"; // Ensure the path is correct

const MarkdownRenderer = ({ text, isDarkMode }) => {
  const handleCopyClick = (content) => {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeContent = String(children).replace(/\n$/, "");
          return !inline && match ? (
            <div className="relative">
              <button
                onClick={() => handleCopyClick(codeContent)}
                className="absolute top-0 right-0 z-10 p-2 text-sm flex items-center gap-1 cursor-pointer bg-gray-700 text-white border-none dark:bg-gray-200 dark:text-black"
              >
                {/* <CopyIcon /> */}
                Copy
              </button>
              <SyntaxHighlighter
                style={isDarkMode ? materialDark : prism}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol {...props} className="pl-10 mt-2 list-decimal dark:text-gray-300">
              {children}
            </ol>
          );
        },
        ul({ children, ...props }) {
          return (
            <ul {...props} className="pl-10 mt-2 list-disc dark:text-gray-300">
              {children}
            </ul>
          );
        },
        li({ children, ...props }) {
          return (
            <li {...props} className="mb-1 dark:text-gray-300">
              {children}
            </li>
          );
        },
        p({ children, ...props }) {
          return (
            <p {...props} className="my-3 dark:text-gray-300">
              {children}
            </p>
          );
        },
        table({ children, ...props }) {
          return (
            <table {...props} className="w-full border-collapse my-5 dark:text-gray-300">
              {children}
            </table>
          );
        },
        thead({ children, ...props }) {
          return (
            <thead {...props} className="bg-gray-200 dark:bg-gray-700">
              {children}
            </thead>
          );
        },
        tbody({ children, ...props }) {
          return <tbody {...props}>{children}</tbody>;
        },
        tr({ children, ...props }) {
          return (
            <tr {...props} className="border-b dark:border-gray-600">
              {children}
            </tr>
          );
        },
        th({ children, ...props }) {
          return (
            <th
              {...props}
              className="p-2 text-left border-b font-medium dark:border-gray-600 dark:bg-gray-700"
            >
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td
              {...props}
              className="p-2 text-left border-b dark:border-gray-600"
            >
              {children}
            </td>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
