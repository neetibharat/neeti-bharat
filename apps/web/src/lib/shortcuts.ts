/** Sent on the window to open the shortcuts list from somewhere other than the keyboard. */
export const OPEN_SHORTCUTS_EVENT = 'dpdp:open-shortcuts';

export type ShortcutId = 'search' | 'help' | 'move' | 'open' | 'close';

/** The shortcuts, in the order they are listed. `keys` are shown as they are; "mod" is Ctrl, or Cmd on a Mac. */
export const SHORTCUTS: { id: ShortcutId; keys: string[] }[] = [
  { id: 'search', keys: ['mod', 'K'] },
  { id: 'help', keys: ['?'] },
  { id: 'move', keys: ['↑', '↓'] },
  { id: 'open', keys: ['Enter'] },
  { id: 'close', keys: ['Esc'] },
];

interface Target {
  tagName?: string;
  isContentEditable?: boolean;
}

/** True where typing a letter should go into the field, not trigger a shortcut. */
export function isTypingTarget(target: Target | null): boolean {
  if (!target) return false;
  const tag = target.tagName?.toUpperCase();
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
  );
}

/** True when the key press asks for the shortcuts list: "?" outside a field, with no Ctrl or Cmd. */
export function isHelpShortcut(
  event: { key: string; ctrlKey: boolean; metaKey: boolean },
  target: Target | null,
): boolean {
  return event.key === '?' && !event.ctrlKey && !event.metaKey && !isTypingTarget(target);
}
