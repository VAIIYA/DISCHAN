import React, { useState } from 'react';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
};

export const HashtagInput: React.FC<Props> = ({ value, onChange, maxTags = 3 }) => {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    if (value.length >= maxTags) return;
    const t = tag.trim().toLowerCase().replace(/^#+/, '');
    if (!t) return;
    if (value.includes(t)) return; // avoid duplicates
    const next = [...value, t].slice(0, maxTags);
    onChange(next);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Hashtags (Max {maxTags})
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t) => (
          <span key={t} className="px-3 py-1 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 rounded-full text-xs font-semibold flex items-center border border-orange-200 shadow-sm animate-in fade-in zoom-in duration-300">
            #{t}
            <button
              aria-label={`remove-${t}`}
              onClick={(e) => { e.preventDefault(); removeTag(t); }}
              className="ml-2 text-orange-400 hover:text-orange-600 transition-colors focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={value.length >= maxTags ? "Limit reached" : "Add hashtag and press Enter"}
        disabled={value.length >= maxTags}
        className="w-full bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{ fontSize: '16px' }}
      />
    </div>
  );
};
