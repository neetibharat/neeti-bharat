'use client';

import { PluginKey } from '@tiptap/pm/state';
import { Extension, ReactRenderer, type Editor } from '@tiptap/react';
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion';
import { forwardRef, useImperativeHandle, useState, type ForwardedRef } from 'react';
import { matchingAnswers, restOfVariable } from '@/lib/variable-items';
import { cx } from '@/lib/utils/cx';

export interface VariableItem {
  /** A built-in answer's key, or `custom:` and a name for one the company added. */
  key: string;
  label: string;
}

type ListProps = SuggestionProps<VariableItem, VariableItem>;

export interface ListHandle {
  /** Returns true when the key was for the list, so the editor leaves it alone. */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

function SuggestionRow(props: {
  item: VariableItem;
  isActive: boolean;
  onChoose: () => void;
  onHover: () => void;
}) {
  return (
    <li
      role="option"
      aria-selected={props.isActive}
      // The editor must keep focus, so the press is not allowed to move it.
      onMouseDown={(event) => event.preventDefault()}
      onClick={props.onChoose}
      onMouseEnter={props.onHover}
      className={cx(
        'flex cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-body text-fg',
        props.isActive && 'bg-brand-soft',
      )}
    >
      <span className="truncate">{props.item.label}</span>
      <span className="shrink-0 font-mono text-caption text-fg-subtle">{props.item.key}</span>
    </li>
  );
}

/** The matches, as a list to move through with the arrow keys and choose from with Enter or Tab. */
const SuggestionList = forwardRef(function SuggestionList(
  { items, command }: ListProps,
  ref: ForwardedRef<ListHandle>,
) {
  // The choice belongs to one set of matches: when the matches change, it goes back to the first.
  const [chosen, setChosen] = useState({ items, index: 0 });
  const active = chosen.items === items ? chosen.index : 0;
  const setActive = (index: number) => setChosen({ items, index });

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      // With nothing to choose from the keys belong to the editor, so Enter still starts a new line.
      if (items.length === 0) return false;
      if (event.key === 'ArrowDown') setActive((active + 1) % items.length);
      else if (event.key === 'ArrowUp') setActive((active - 1 + items.length) % items.length);
      else if (event.key === 'Enter' || event.key === 'Tab') {
        const chosen = items[active];
        if (chosen) command(chosen);
      } else return false;
      return true;
    },
  }));

  if (items.length === 0) return null;

  return (
    <ul
      role="listbox"
      className="max-h-64 w-96 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-popover entering:animate-pop-in"
    >
      {items.map((item, index) => (
        <SuggestionRow
          key={item.key}
          item={item}
          isActive={index === active}
          onChoose={() => command(item)}
          onHover={() => setActive(index)}
        />
      ))}
    </ul>
  );
});

/** Puts the popup under the cursor, or above it when there is no room below. */
function place(element: HTMLElement, props: ListProps): void {
  const rect = props.clientRect?.();
  if (!rect) return;
  const roomBelow = window.innerHeight - rect.bottom;
  element.style.position = 'fixed';
  element.style.zIndex = '60';
  element.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 400))}px`;
  const above = roomBelow < 280 && rect.top > roomBelow;
  element.style.top = above ? 'auto' : `${rect.bottom + 6}px`;
  element.style.bottom = above ? `${window.innerHeight - rect.top + 6}px` : 'auto';
}

/**
 * Shows the list while a `{{` is open, and keeps it beside the cursor: it moves with the page when that scrolls, and
 * with the window when that is resized.
 */
function renderList() {
  let list: ReactRenderer<ListHandle, ListProps> | null = null;
  let latest: ListProps | null = null;
  const follow = () => {
    if (list && latest) place(list.element, latest);
  };

  return {
    onStart: (props: ListProps) => {
      latest = props;
      list = new ReactRenderer(SuggestionList, { props, editor: props.editor });
      document.body.appendChild(list.element);
      follow();
      // Scrolling inside any box, not only the window, moves the cursor, so the listener catches it on the way down.
      window.addEventListener('scroll', follow, true);
      window.addEventListener('resize', follow);
    },
    onUpdate: (props: ListProps) => {
      latest = props;
      list?.updateProps(props);
      follow();
    },
    onKeyDown: ({ event }: { event: KeyboardEvent }) => list?.ref?.onKeyDown(event) ?? false,
    onExit: () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
      list?.element.remove();
      list?.destroy();
      list = null;
      latest = null;
    },
  };
}

interface AnswerStorage {
  answers: VariableItem[];
}

/** Gives the editor the answers it may offer. They can change after it opens, for instance when one is added. */
export function offerAnswers(editor: Editor, answers: VariableItem[]): void {
  (editor.storage as unknown as Record<string, AnswerStorage>).variableSuggestion!.answers =
    answers;
}

/**
 * Typing `{{` in a policy opens a list of the company answers it can quote, narrowed as more is typed. Choosing one
 * writes it as `{{key}}`, the same as the list in the toolbar does. The answers come from `offerAnswers`.
 */
export const VariableSuggestion = Extension.create<unknown, AnswerStorage>({
  name: 'variableSuggestion',
  addStorage: () => ({ answers: [] }),
  addProseMirrorPlugins() {
    const storage = this.storage;
    return [
      Suggestion<VariableItem, VariableItem>({
        editor: this.editor,
        pluginKey: new PluginKey('variableSuggestion'),
        char: '{{',
        // Allowed after any character, not only after a space: `Access is reviewed: {{` is the usual case.
        allowedPrefixes: null,
        items: ({ query }) => matchingAnswers(storage.answers, query),
        command: ({ editor, range, props }) => {
          // Inside an existing variable, the rest of it goes too, so the choice replaces the whole variable.
          const $to = editor.state.doc.resolve(range.to);
          const after = $to.parent.textBetween($to.parentOffset, $to.parent.content.size);
          const to = range.to + restOfVariable(after);
          editor
            .chain()
            .focus()
            .insertContentAt({ from: range.from, to }, `{{${props.key}}}`)
            .run();
        },
        render: renderList,
      }),
    ];
  },
});
