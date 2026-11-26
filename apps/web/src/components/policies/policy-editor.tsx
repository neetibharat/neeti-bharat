'use client';

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconBraces,
  IconH2,
  IconH3,
  IconItalic,
  IconList,
  IconListNumbers,
  type Icon,
} from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { PROFILE_FIELDS, type PolicyDocument } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/base/button/button';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { cx } from '@/lib/utils/cx';
import { VariableSuggestion, offerAnswers, type VariableItem } from './variable-suggestion';

const EXTENSIONS = [StarterKit.configure({ heading: { levels: [2, 3] } }), Highlight];

/** The answers about the company a policy can quote. The set-up questions are not text, so they are left out. */
const INSERTABLE = PROFILE_FIELDS.filter((field) => field.group !== 'setup').map((f) => f.key);

/** Policy text, read-only. Used for the current text and for old versions. */
export function PolicyReader({
  document,
  className,
}: {
  document: PolicyDocument;
  className?: string;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: document,
    editable: false,
    immediatelyRender: false,
  });
  useEffect(() => {
    editor?.commands.setContent(document);
  }, [editor, document]);

  return <EditorContent editor={editor} className={cx('policy-prose', className)} />;
}

/** Every answer a policy can quote: the built-in ones, then any the company added in Company profile. */
function useAnswers(): VariableItem[] {
  const tFields = useTranslations('profile.fields');
  const { data } = useGetProfileQuery();

  return useMemo(() => {
    const own = (data?.entries ?? [])
      .filter((entry) => entry.isCustom)
      .map((entry) => ({ key: entry.key, label: entry.label ?? entry.key }));
    return [...INSERTABLE.map((key) => ({ key, label: tFields(`${key}.label`) })), ...own];
  }, [data, tFields]);
}

/** Policy text, editable, with a toolbar. Tiptap does the editing; this only adds the toolbar and the styles. */
export function PolicyEditor(props: {
  content: PolicyDocument;
  onChange: (document: PolicyDocument) => void;
}) {
  const answers = useAnswers();
  const editor = useEditor({
    extensions: [...EXTENSIONS, VariableSuggestion],
    content: props.content,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => props.onChange(current.getJSON() as PolicyDocument),
    editorProps: {
      attributes: {
        class:
          'policy-prose min-h-64 rounded-b-control bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-accent',
      },
    },
  });

  // The answers can change while the editor is open, so the editor is handed the current list each time.
  useEffect(() => {
    if (editor) offerAnswers(editor, answers);
  }, [editor, answers]);

  return (
    <div className="rounded-control border border-line-strong">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

type Chain = ReturnType<Editor['chain']>;

interface ToolDef {
  label: 'bold' | 'italic' | 'heading' | 'subheading' | 'bullets' | 'numbers' | 'undo' | 'redo';
  icon: Icon;
  run: (chain: Chain) => Chain;
  /** What makes the tool look pressed. Undo and redo have none. */
  isOn?: (editor: Editor) => boolean;
}

const TOOLS: ToolDef[] = [
  { label: 'bold', icon: IconBold, run: (c) => c.toggleBold(), isOn: (e) => e.isActive('bold') },
  {
    label: 'italic',
    icon: IconItalic,
    run: (c) => c.toggleItalic(),
    isOn: (e) => e.isActive('italic'),
  },
  {
    label: 'heading',
    icon: IconH2,
    run: (c) => c.toggleHeading({ level: 2 }),
    isOn: (e) => e.isActive('heading', { level: 2 }),
  },
  {
    label: 'subheading',
    icon: IconH3,
    run: (c) => c.toggleHeading({ level: 3 }),
    isOn: (e) => e.isActive('heading', { level: 3 }),
  },
  {
    label: 'bullets',
    icon: IconList,
    run: (c) => c.toggleBulletList(),
    isOn: (e) => e.isActive('bulletList'),
  },
  {
    label: 'numbers',
    icon: IconListNumbers,
    run: (c) => c.toggleOrderedList(),
    isOn: (e) => e.isActive('orderedList'),
  },
  { label: 'undo', icon: IconArrowBackUp, run: (c) => c.undo() },
  { label: 'redo', icon: IconArrowForwardUp, run: (c) => c.redo() },
];

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations('policies.document.toolbar');
  // The toolbar redraws when the editor's state changes, so a tool shows as pressed or not.
  const pressed = useEditorState({
    editor,
    selector: ({ editor: current }) => TOOLS.map((tool) => tool.isOn?.(current) ?? false),
  });

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-control border-b border-line bg-surface-sunken p-1.5">
      {TOOLS.map((tool, index) => (
        <Tool
          key={tool.label}
          label={t(tool.label)}
          icon={tool.icon}
          on={pressed[index]}
          onPress={() => void tool.run(editor.chain().focus()).run()}
        />
      ))}
      <InsertAnswer onOpen={() => editor.chain().focus().insertContent('{{').run()} />
    </div>
  );
}

function Tool(props: { label: string; icon: Icon; on?: boolean; onPress: () => void }) {
  return (
    <Button
      color={props.on ? 'soft' : 'tertiary'}
      size="sm"
      isIconOnly
      iconLeading={props.icon}
      aria-label={props.label}
      onPress={props.onPress}
    />
  );
}

/**
 * Opens the same list as typing `{{` does: short, narrowed as you type, and kept on screen. A long menu of every answer
 * ran off the page, and grew with each new one.
 */
function InsertAnswer({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('policies.document');

  return (
    <Button
      className="ml-auto"
      color="secondary"
      size="sm"
      iconLeading={IconBraces}
      onPress={onOpen}
    >
      {t('insert')}
    </Button>
  );
}
