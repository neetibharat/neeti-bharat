import { splitLinks } from '@/lib/link-text';

/** Text in which web addresses are links that open in a new tab. Anything else stays plain text. */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, index) =>
        part.href ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:no-underline"
          >
            {part.text}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
