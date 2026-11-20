import { splitLinks, type TextPart } from '@/lib/link-text';

const LINK = 'text-brand underline underline-offset-2 hover:no-underline';

/** A template file is downloaded in place. A web address opens in a new tab. */
function Link({ part }: { part: TextPart }) {
  if (part.isFile) {
    return (
      <a href={part.href} download className={LINK}>
        {part.text}
      </a>
    );
  }
  return (
    <a href={part.href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {part.text}
    </a>
  );
}

/** Text in which web addresses and template files are links. Anything else stays plain text. */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, index) =>
        part.href ? <Link key={index} part={part} /> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}
