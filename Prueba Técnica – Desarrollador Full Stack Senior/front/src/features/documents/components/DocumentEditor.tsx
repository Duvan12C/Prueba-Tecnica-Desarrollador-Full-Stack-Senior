import { Icon } from '@iconify/react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo } from 'react'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import { getEditorContent, serializeEditorContent } from '@/features/documents/utils/documentContent'
import { createDocumentHighlightExtension, type DocumentHighlights } from '@/features/documents/utils/documentHighlights'

interface DocumentEditorProps {
    content: string
    editable?: boolean
    disabled?: boolean
    compact?: boolean
    highlights?: DocumentHighlights
    onChange?: (content: string) => void
}

interface EditorAction {
    label: string
    icon: string
    run: (editor: Editor) => void
    active?: (editor: Editor) => boolean
    enabled?: (editor: Editor) => boolean
}

const extensions = [StarterKit.configure({ link: false })]

const actions: EditorAction[] = [
    { label: 'Deshacer', icon: 'tabler:arrow-back-up', run: (editor) => editor.chain().focus().undo().run(), enabled: (editor) => editor.can().undo() },
    { label: 'Rehacer', icon: 'tabler:arrow-forward-up', run: (editor) => editor.chain().focus().redo().run(), enabled: (editor) => editor.can().redo() },
    { label: 'Texto normal', icon: 'tabler:pilcrow', run: (editor) => editor.chain().focus().setParagraph().run(), active: (editor) => editor.isActive('paragraph') },
    { label: 'Encabezado', icon: 'tabler:h-2', run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: (editor) => editor.isActive('heading', { level: 2 }) },
    { label: 'Negrita', icon: 'tabler:bold', run: (editor) => editor.chain().focus().toggleBold().run(), active: (editor) => editor.isActive('bold') },
    { label: 'Cursiva', icon: 'tabler:italic', run: (editor) => editor.chain().focus().toggleItalic().run(), active: (editor) => editor.isActive('italic') },
    { label: 'Subrayado', icon: 'tabler:underline', run: (editor) => editor.chain().focus().toggleUnderline().run(), active: (editor) => editor.isActive('underline') },
    { label: 'Lista con viñetas', icon: 'tabler:list', run: (editor) => editor.chain().focus().toggleBulletList().run(), active: (editor) => editor.isActive('bulletList') },
    { label: 'Lista numerada', icon: 'tabler:list-numbers', run: (editor) => editor.chain().focus().toggleOrderedList().run(), active: (editor) => editor.isActive('orderedList') },
    { label: 'Cita', icon: 'tabler:quote', run: (editor) => editor.chain().focus().toggleBlockquote().run(), active: (editor) => editor.isActive('blockquote') },
]

export default function DocumentEditor({ content, editable = false, disabled = false, compact = false, highlights, onChange }: DocumentEditorProps) {
    const editorExtensions = useMemo(
        () => highlights ? [...extensions, createDocumentHighlightExtension(highlights)] : extensions,
        [highlights],
    )
    const editor = useEditor({
        extensions: editorExtensions,
        content: getEditorContent(content),
        editable: editable && !disabled,
        onUpdate: ({ editor }) => onChange?.(serializeEditorContent(editor.getHTML())),
        editorProps: {
            attributes: {
                class: 'max-w-none wrap-anywhere leading-7 outline-none [&_h1]:mt-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_p+p]:mt-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-400 [&_blockquote]:pl-4 [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-50 [&_pre]:p-3',
                'aria-label': 'Contenido del documento',
            },
        },
    }, [editorExtensions])

    useEffect(() => {
        editor?.setEditable(editable && !disabled, false)
    }, [editor, editable, disabled])

    useEffect(() => {
        if (!editor || serializeEditorContent(editor.getHTML()) === content) return
        editor.chain().setContent(getEditorContent(content), { emitUpdate: false }).setMeta('addToHistory', false).run()
    }, [editor, content])

    const controls = useEditorState({
        editor,
        selector: ({ editor }) => actions.map(({ active, enabled }) => ({
            pressed: editor && active ? active(editor) : undefined,
            enabled: editor ? enabled?.(editor) ?? true : false,
        })),
    })

    return (
        <Card className={compact ? 'text-secondary-950' : 'overflow-hidden rounded-2xl border border-neutral-100 bg-white text-secondary-950 shadow-sm'}>
            {editable && (
                <div role="group" aria-label="Formato del documento" className="flex flex-wrap gap-1 border-b border-neutral-100 bg-primary-100 p-2 sm:px-4">
                    {actions.map((action, index) => (
                        <Button
                            key={action.label}
                            variant="custom"
                            size="icon"
                            aria-label={action.label}
                            aria-pressed={controls?.[index].pressed}
                            title={action.label}
                            disabled={disabled || !controls?.[index].enabled}
                            className="text-primary-700 hover:bg-white/70 aria-pressed:bg-white"
                            onClick={() => { if (editor) action.run(editor) }}
                        >
                            <Icon icon={action.icon} width="19" aria-hidden="true" />
                        </Button>
                    ))}
                </div>
            )}
            <div className={compact ? 'p-4 text-sm sm:p-5' : 'p-5 sm:p-10'}>
                {compact && !content && <p className="text-sm text-secondary-600">Esta versión está vacía.</p>}
                <EditorContent
                    editor={editor}
                    className={compact ? undefined : '[&_.tiptap]:min-h-80 [&_.tiptap]:sm:min-h-[28rem]'}
                />
            </div>
        </Card>
    )
}
