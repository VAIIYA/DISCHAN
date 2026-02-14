import React, { useEffect, useState } from 'react';

type Hashtag = {
  id: string;
  name: string;
  slug: string;
  count?: number;
};

type Props = {
  onTagClick?: (tagName: string) => void;
};

export const HashtagCloud: React.FC<Props> = ({ onTagClick }) => {
  const [tags, setTags] = useState<Hashtag[]>([]);

  useEffect(() => {
    // Fetch all hashtags for the cloud
    fetch('/api/hashtags')
      .then(res => res.json())
      .then((data) => {
        if (data?.tags) {
          setTags(data.tags);
        }
      })
      .catch((e) => console.error('HashtagCloud fetch error', e));
  }, []);

  if (!tags.length) return null;

  return (
    <div className="mb-4 max-w-6xl mx-auto px-4">
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (onTagClick) {
                onTagClick(t.name);
              } else {
                window.location.href = `/hashtags/${t.name}`;
              }
            }}
            className="px-2 py-1 rounded-full bg-gray-100 text-sm text-gray-800 hover:bg-gray-200 transition-colors"
            title={`Hashtag #${t.name} (${t.count ?? 0})`}
          >
            #{t.name}
          </button>
        ))}

      </div>
    </div>
  );
};
