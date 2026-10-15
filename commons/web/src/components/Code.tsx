import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useToast } from './Toast';
import { cx } from './ui';

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch { toast('Clipboard unavailable. Select the text and copy it manually.', 'error'); }
      }}
      className={cx('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-muted ring-1 ring-line transition hover:text-fg', className)}
    >
      {copied ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}{copied ? 'Copied' : label}
    </button>
  );
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-sunken">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="flex items-center gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-[#ff5f57]" /><i className="size-2.5 rounded-full bg-[#febc2e]" /><i className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        {title && <span className="text-[12px] font-medium text-subtle">{title}</span>}
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-fg/90"><code>{code}</code></pre>
    </div>
  );
}
