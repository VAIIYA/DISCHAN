'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
    return (
        <div className={`prose prose-sm max-w-none break-words ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Ensure images are responsive and styled
                    img: ({ node, ...props }) => (
                        <img
                            {...props}
                            className="max-w-full h-auto rounded-lg my-4 shadow-sm"
                            loading="lazy"
                        />
                    ),
                    // Ensure links open in a new tab and are styled
                    a: ({ node, ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 underline transition-colors"
                        />
                    ),
                    // Style other elements for Dischan aesthetics
                    p: ({ node, ...props }) => (
                        <p {...props} className="mb-4 text-gray-800 leading-relaxed" />
                    ),
                    h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-xl font-bold text-orange-600 mb-4 mt-6 first:mt-0" />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-lg font-bold text-orange-500 mb-3 mt-5 first:mt-0" />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 {...props} className="text-base font-bold text-gray-800 mb-2 mt-4 first:mt-0" />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc pl-5 mb-4 space-y-1 text-gray-700" />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal pl-5 mb-4 space-y-1 text-gray-700" />
                    ),
                    li: ({ node, ...props }) => (
                        <li {...props} className="mb-1" />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            {...props}
                            className="border-l-4 border-orange-200 pl-4 py-1 my-4 italic text-gray-600 bg-orange-50/50 rounded-r"
                        />
                    ),
                    code: ({ node, inline, ...props }: any) => (
                        inline ? (
                            <code {...props} className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono" />
                        ) : (
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono">
                                <code {...props} />
                            </pre>
                        )
                    ),
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                            <table {...props} className="min-w-full border-collapse border border-gray-200 text-sm" />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th {...props} className="border border-gray-200 bg-gray-50 px-4 py-2 font-semibold text-left" />
                    ),
                    td: ({ node, ...props }) => (
                        <td {...props} className="border border-gray-200 px-4 py-2" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
