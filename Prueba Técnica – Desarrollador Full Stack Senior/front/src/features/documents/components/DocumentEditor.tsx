import { Icon } from '@iconify/react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function DocumentEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<h2>Mi primer documento</h2><p>Escribe aquí el contenido del documento.</p>',
    editorProps: {
      attributes: {
        class: 'min-h-52 p-5 text-slate-700 outline-none [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-7',
      },
    },
  })

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 p-3">
        <button
          type="button"
          aria-label="Negrita"
          aria-pressed={editor?.isActive('bold') ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Icon icon="tabler:bold" className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Lista con viñetas"
          aria-pressed={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Icon icon="ph:list-bullets" className="size-5" />
        </button>
        <span className="ml-auto text-xs text-slate-400">Tiptap</span>
      </div>
      <EditorContent editor={editor} />
    </section>
  )
}

export default DocumentEditor
