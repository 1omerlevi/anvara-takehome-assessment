'use client';

import { useEffect, useState } from 'react';

const prompts = [
  'premium audiences, major moments, and brand-safe sponsorship inventory',
  'sports fans in destination markets before championship weekend',
  'food and lifestyle audiences around high-intent cultural events',
  'cause-driven communities through premium nonprofit partnerships',
];

export function PromptAnimation() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPrompt = prompts[promptIndex];
    const nextText = isDeleting
      ? currentPrompt.slice(0, Math.max(typedText.length - 1, 0))
      : currentPrompt.slice(0, typedText.length + 1);

    const delay = isDeleting ? 32 : 55;
    const timeoutId = window.setTimeout(() => {
      setTypedText(nextText);

      if (!isDeleting && nextText === currentPrompt) {
        window.setTimeout(() => setIsDeleting(true), 1200);
        return;
      }

      if (isDeleting && nextText.length === 0) {
        setIsDeleting(false);
        setPromptIndex((current) => (current + 1) % prompts.length);
      }
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [isDeleting, promptIndex, typedText]);

  return (
    <div className="flex items-center rounded-[1.5rem] border border-white/12 bg-white/6 px-5 py-4 text-left text-base text-white sm:text-lg">
      <span className="min-h-[1.75rem] text-slate-200">
        {typedText}
        <span className="prompt-caret ml-0.5 inline-block h-[1.1em] w-[1px] translate-y-[0.18em] bg-white/90 align-top" />
      </span>
    </div>
  );
}
