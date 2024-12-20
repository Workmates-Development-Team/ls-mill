import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark, prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ({ text, isDarkMode }) => {
  const [tableData, setTableData] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      const rows = Array.from(tableRef.current.querySelectorAll("tr")).map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent.trim())
      );
      setTableData(rows);
    }
  }, [text]);

  const handleCopyClick = (content) => {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  // const handleDownloadCSV = () => {
  //   if (tableData.length === 0) return;

  //   const csvRows = tableData.map(row => row.join(','));
  //   const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
  //   const encodedUri = encodeURI(csvContent);
  //   const link = document.createElement("a");
  //   link.setAttribute("href", encodedUri);
  //   link.setAttribute("download", "table.csv");
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleDownloadCSV = () => {
    if (tableData.length === 0) return;
  
    // Ensure all rows have the same number of columns as the header
    const headers = tableData[0];
    const csvRows = tableData.map(row => {
      const paddedRow = [...row]; // Make a copy of the row
      // Add empty strings for missing columns
      while (paddedRow.length < headers.length) {
        paddedRow.push('');
      }
      return paddedRow.join(',');
    });
  
    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  const handleDownloadJSON = () => {
    if (tableData.length <= 1) return;

    const headers = tableData[0];
    const jsonArray = tableData.slice(1).map(row => {
      const rowObject = {};
      row.forEach((cell, index) => {
        rowObject[headers[index]] = cell;
      });
      return rowObject;
    });

    const jsonString = JSON.stringify(jsonArray, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "table.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        table({ children, ...props }) {
          return (
            <>
              <button
                onClick={handleDownloadCSV}
                className="mb-2 p-2 text-sm cursor-pointer bg-blue-500 text-white border-none dark:bg-blue-700"
              >
                Download CSV
              </button>
              <button
                onClick={handleDownloadJSON}
                className="mb-2 p-2 ml-2 text-sm cursor-pointer bg-green-500 text-white border-none dark:bg-green-700"
              >
                Download JSON
              </button>
              <table ref={tableRef} {...props} className="w-full border-collapse my-5 dark:text-gray-300">
                {children}
              </table>
            </>
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
