import React from "react";

interface MarkdownTextProps {
  text: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  if (!text) return null;

  // Split by line breaks
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIdx) => {
        // Array to hold parsed React nodes for the current line
        const elements: React.ReactNode[] = [];
        
        // Regex to match: Links [text](url), Bold **text**, Code `text`, Italics *text*
        // We match them in order of precedence
        const regex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(`.*?`)|(\*.*?\*)/g;
        
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(line)) !== null) {
          const matchIndex = match.index;
          const matchText = match[0];

          // Add plain text preceding the match
          if (matchIndex > lastIndex) {
            elements.push(line.substring(lastIndex, matchIndex));
          }

          if (match[1]) {
            // Link match: [text](url)
            const linkRegex = /\[(.*?)\]\((.*?)\)/;
            const linkMatch = linkRegex.exec(matchText);
            if (linkMatch) {
              const linkText = linkMatch[1];
              const linkUrl = linkMatch[2];
              elements.push(
                <a
                  key={`link-${matchIndex}`}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                >
                  {linkText}
                </a>
              );
            }
          } else if (match[2]) {
            // Bold match: **text**
            const boldText = matchText.slice(2, -2);
            elements.push(
              <strong key={`bold-${matchIndex}`} className="font-bold text-white">
                {boldText}
              </strong>
            );
          } else if (match[3]) {
            // Code match: `text`
            const codeText = matchText.slice(1, -1);
            elements.push(
              <code
                key={`code-${matchIndex}`}
                className="bg-black/30 border border-white/5 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-xs"
              >
                {codeText}
              </code>
            );
          } else if (match[4]) {
            // Italic match: *text*
            const italicText = matchText.slice(1, -1);
            elements.push(
              <em key={`italic-${matchIndex}`} className="italic text-zinc-300">
                {italicText}
              </em>
            );
          }

          lastIndex = regex.lastIndex;
        }

        // Add remaining plain text
        if (lastIndex < line.length) {
          elements.push(line.substring(lastIndex));
        }

        return (
          <React.Fragment key={`line-${lineIdx}`}>
            {elements}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
}
