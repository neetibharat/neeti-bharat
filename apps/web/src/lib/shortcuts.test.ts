import { describe, expect, it } from 'vitest';
import { SHORTCUTS, isHelpShortcut, isTypingTarget } from './shortcuts';

const press = (key: string, extra = {}) => ({ key, ctrlKey: false, metaKey: false, ...extra });

describe('isHelpShortcut', () => {
  it('is a question mark outside a field', () => {
    expect(isHelpShortcut(press('?'), { tagName: 'BODY' })).toBe(true);
    expect(isHelpShortcut(press('?'), null)).toBe(true);
  });

  it('leaves a question mark typed into a field alone', () => {
    expect(isHelpShortcut(press('?'), { tagName: 'INPUT' })).toBe(false);
    expect(isHelpShortcut(press('?'), { tagName: 'textarea' })).toBe(false);
    expect(isHelpShortcut(press('?'), { tagName: 'DIV', isContentEditable: true })).toBe(false);
  });

  it('ignores other keys and Ctrl or Cmd combinations', () => {
    expect(isHelpShortcut(press('/'), null)).toBe(false);
    expect(isHelpShortcut(press('?', { ctrlKey: true }), null)).toBe(false);
    expect(isHelpShortcut(press('?', { metaKey: true }), null)).toBe(false);
  });
});

describe('isTypingTarget', () => {
  it('is false for nothing and for buttons', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
  });
});

describe('SHORTCUTS', () => {
  it('lists each shortcut once', () => {
    const ids = SHORTCUTS.map((shortcut) => shortcut.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
