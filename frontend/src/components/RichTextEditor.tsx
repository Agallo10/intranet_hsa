import type { ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
} from 'lucide-react'
import { cn } from 'cn'

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground',
        active && 'bg-muted text-primary',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  initialValue,
  onChange,
}: {
  initialValue: string
  onChange: (html: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] px-4 py-3 focus:outline-none [&_p]:min-h-[1em]',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1">
        <ToolbarButton
          label="Negrita"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Subrayado"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Tachado"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Alinear a la izquierda"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Centrar"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Alinear a la derecha"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justificar"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Lista con viñetas"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export function isEmptyHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return text.length === 0
}
