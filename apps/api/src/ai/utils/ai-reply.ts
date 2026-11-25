import type { z } from 'zod';

/** A reply that could not be used. The text of it is never shown. */
export class UnusableReply extends Error {}

/** The first JSON object in the reply, for models that wrap it in a code fence or a sentence. */
export function jsonIn(reply: string): unknown {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start < 0 || end <= start) throw new UnusableReply();
  try {
    return JSON.parse(reply.slice(start, end + 1));
  } catch {
    throw new UnusableReply();
  }
}

/** The reply as the shape asked for, or `UnusableReply`. Every feature checks its answer with this, whichever service gave it. */
export function parseReply<S extends z.ZodType>(reply: string, schema: S): z.output<S> {
  const parsed = schema.safeParse(jsonIn(reply));
  if (!parsed.success) throw new UnusableReply();
  return parsed.data;
}

/** Text cut to at most `max` characters at the end of a word, with an ellipsis when something was left out. */
export function shorten(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  const head = text.slice(0, max - 1);
  const space = head.lastIndexOf(' ');
  return `${(space > max * 0.6 ? head.slice(0, space) : head).trimEnd()}…`;
}

/** Trimmed text cut to a length. */
export const within = (value: string, max: number): string => value.trim().slice(0, max).trim();
