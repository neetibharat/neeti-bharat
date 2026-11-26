/** What an email says. Both the HTML and the plain text are made from this, so the two cannot disagree. */
export interface EmailContent {
  /** The line some mail apps show beside the subject. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  /** Small print under the button, such as what to do if the email was not asked for. */
  note?: string;
  footer: string;
}

// The colours of the app (styles/theme.css), written out because email has no stylesheet to share.
const COLOR = {
  page: '#eff1f4',
  surface: '#ffffff',
  line: '#e4e7ec',
  text: '#0f172a',
  muted: '#475569',
  subtle: '#64748b',
  brand: '#1e3a5f',
  accent: '#d97706',
};

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Anything that came from a person, or from the database, is escaped before it goes into the page. */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

/** The logo mark, as a table: a navy tile with a saffron dot, which mail apps draw without images. */
function brandRow(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="28" height="28" align="right" valign="bottom" style="width:28px;height:28px;background:${COLOR.brand};border-radius:8px;"><div style="width:8px;height:8px;margin:0 4px 4px 0;border-radius:4px;background:${COLOR.accent};font-size:0;line-height:0;">&nbsp;</div></td>
<td style="padding-left:10px;font:600 16px ${FONT};color:${COLOR.text};">Neeti Bharat</td>
</tr></table>`;
}

function buttonHtml({ label, url }: { label: string; url: string }): string {
  const href = escapeHtml(url);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr>
<td style="background:${COLOR.brand};border-radius:999px;"><a href="${href}" style="display:inline-block;padding:13px 28px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a></td>
</tr></table>
<p style="margin:16px 0 0;font:13px/20px ${FONT};color:${COLOR.subtle};">Or paste this link into your browser:<br><a href="${href}" style="color:${COLOR.brand};word-break:break-all;">${href}</a></p>`;
}

function bodyHtml(content: EmailContent): string {
  const paragraphs = content.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 14px;font:15px/24px ${FONT};color:${COLOR.muted};">${escapeHtml(text)}</p>`,
    )
    .join('\n');
  const note = content.note
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${COLOR.line};font:13px/20px ${FONT};color:${COLOR.subtle};">${escapeHtml(content.note)}</p>`
    : '';
  return `<h1 style="margin:0 0 16px;font:600 22px/30px ${FONT};color:${COLOR.text};">${escapeHtml(content.heading)}</h1>
${paragraphs}
${content.button ? buttonHtml(content.button) : ''}
${note}`;
}

/** A small card on the page colour, with the logo above it and the reason for the email below. Tables and inline styles only, which every mail app understands. */
export function renderHtml(content: EmailContent): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLOR.page};">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.page};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;">
<tr><td style="padding:0 0 18px 4px;">${brandRow()}</td></tr>
<tr><td style="background:${COLOR.surface};border:1px solid ${COLOR.line};border-radius:16px;padding:32px;">
${bodyHtml(content)}
</td></tr>
<tr><td style="padding:18px 4px 0;font:12px/18px ${FONT};color:${COLOR.subtle};">${escapeHtml(content.footer)}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** The same email as plain text, for mail apps that show no HTML and as the fallback inside it. */
export function renderText(content: EmailContent): string {
  return [
    content.heading,
    ...content.paragraphs,
    content.button ? `${content.button.label}: ${content.button.url}` : '',
    content.note ?? '',
    `-- ${content.footer}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
