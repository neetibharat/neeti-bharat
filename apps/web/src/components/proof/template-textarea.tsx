'use client';

import { PROOF_TEMPLATES, type ProofTemplate } from '@dpdp-kit/shared';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Textarea, type TextareaProps } from '@/components/base/textarea/textarea';
import {
  insertTemplate,
  matchingTemplates,
  templateTrigger,
  type TemplateTrigger,
} from '@/lib/template-suggest';
import { cx } from '@/lib/utils/cx';

type Picker = { trigger: TemplateTrigger; active: number };

/** The matches, to move through with the arrow keys and choose from with Enter or Tab. */
function TemplateList(props: {
  items: ProofTemplate[];
  active: number;
  onChoose: (template: ProofTemplate) => void;
  onHover: (index: number) => void;
}) {
  return (
    <ul
      role="listbox"
      className="absolute top-full left-0 z-30 mt-1 max-h-56 w-full max-w-md overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-popover entering:animate-pop-in"
    >
      {props.items.map((template, index) => (
        <li
          key={template.file}
          role="option"
          aria-selected={index === props.active}
          // The box must keep focus, so the press is not allowed to move it.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => props.onChoose(template)}
          onMouseEnter={() => props.onHover(index)}
          className={cx(
            'flex cursor-pointer flex-col rounded-control px-3 py-2',
            index === props.active && 'bg-brand-soft',
          )}
        >
          <span className="text-body text-fg">{template.title}</span>
          <span className="truncate font-mono text-caption text-fg-subtle">{template.file}</span>
        </li>
      ))}
    </ul>
  );
}

/** The box the person types in, found from the wrapper that holds it. */
const boxIn = (wrapper: HTMLElement | null) => wrapper?.querySelector('textarea') ?? null;

/** Arrow keys move through the matches, Escape closes them, Enter and Tab choose. Any other key is left to the box. */
function navigate(
  event: KeyboardEvent,
  picker: Picker | null,
  items: ProofTemplate[],
  setPicker: (picker: Picker | null) => void,
  choose: (template: ProofTemplate) => void,
): void {
  if (!picker || items.length === 0) return;
  const move = (to: number) => setPicker({ ...picker, active: (to + items.length) % items.length });
  if (event.key === 'ArrowDown') move(picker.active + 1);
  else if (event.key === 'ArrowUp') move(picker.active - 1);
  else if (event.key === 'Escape') setPicker(null);
  else if (event.key === 'Enter' || event.key === 'Tab') choose(items[picker.active]!);
  else return;
  event.preventDefault();
}

type Handlers = {
  onInput: () => void;
  onClick: () => void;
  onKeyDownCapture: (event: KeyboardEvent) => void;
  onBlur: () => void;
};

/** What the picker does: when it opens, how the keys move through it, and what choosing writes. */
function useTemplatePicker(onChange: (value: string) => void) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const items = picker ? matchingTemplates(PROOF_TEMPLATES, picker.trigger.query) : [];
  const open = picker !== null && items.length > 0;

  function refresh() {
    const box = boxIn(wrapper.current);
    const trigger = box ? templateTrigger(box.value, box.selectionStart) : null;
    setPicker(trigger ? { trigger, active: 0 } : null);
  }

  function choose(template: ProofTemplate) {
    const box = boxIn(wrapper.current);
    if (!picker || !box) return;
    const done = insertTemplate(box.value, picker.trigger, template);
    onChange(done.text);
    setPicker(null);
    requestAnimationFrame(() => {
      box.focus();
      box.setSelectionRange(done.cursor, done.cursor);
    });
  }

  const handlers: Handlers = {
    onInput: refresh,
    onClick: refresh,
    onKeyDownCapture: (event) => navigate(event, picker, items, setPicker, choose),
    onBlur: () => setPicker(null),
  };
  const hover = (active: number) => picker && setPicker({ ...picker, active });
  return { wrapper, handlers, items, active: picker?.active ?? 0, open, choose, hover };
}

/**
 * A text box that offers the kit's templates when a `/` is typed at the start of a word, narrowed as more is typed, the
 * way `{{` offers answers in a policy. Choosing one writes its path, which the page then shows as a download. Anything
 * else typed, such as a link to the company's own template, is left alone.
 */
export function TemplateTextarea(
  props: TextareaProps & { value: string; onChange: (value: string) => void },
) {
  const { wrapper, handlers, items, active, open, choose, hover } = useTemplatePicker(
    props.onChange,
  );

  return (
    <div ref={wrapper} className="relative" {...handlers}>
      <Textarea {...props} />
      {open && <TemplateList items={items} active={active} onChoose={choose} onHover={hover} />}
    </div>
  );
}
