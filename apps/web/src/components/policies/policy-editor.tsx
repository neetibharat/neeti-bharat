'use client';

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
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
import { PROFILE_FIELDS, type PolicyDocument, type ProfileKey } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button } from '@/components/base/button/button';
import { Select } from '@/components/base/select/select';
import { cx } from '@/lib/utils/cx';

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

/** Policy text, editable, with a toolbar. Tiptap does the editing; this only adds the toolbar and the styles. */
export function PolicyEditor(props: {
  content: PolicyDocument;
  onChange: (document: PolicyDocument) => void;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
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
      <InsertAnswer onInsert={(key) => editor.chain().focus().insertContent(`{{${key}}}`).run()} />
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

/** Adds a company answer to the text. It is filled in for readers, and follows the profile when that changes. */
function InsertAnswer({ onInsert }: { onInsert: (key: ProfileKey) => void }) {
  const t = useTranslations('policies.document');
  const tFields = useTranslations('profile.fields');

  return (
    <Select
      aria-label={t('insert')}
      placeholder={t('insert')}
      className="ml-auto w-56"
      options={INSERTABLE.map((key) => ({ id: key, label: tFields(`${key}.label`) }))}
      selectedKey={null}
      onSelectionChange={onInsert}
    />
  );
}
