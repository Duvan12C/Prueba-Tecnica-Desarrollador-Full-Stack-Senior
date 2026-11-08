import { Decoration, Extension } from '@tiptap/react'

export interface DocumentHighlights {
    kind: 'addition' | 'removal'
    blocks: ReadonlySet<number>
}

const highlightClasses = {
    addition: 'rounded-md bg-success-bg text-success-text ring-1 ring-success/25',
    removal: 'rounded-md bg-danger-bg text-danger-text line-through decoration-danger/70',
}

export function createDocumentHighlightExtension({ kind, blocks }: DocumentHighlights) {
    return Extension.create({
        name: 'documentHighlights',
        addDecorations() {
            return {
                create: ({ state }) => {
                    const decorations: Decoration[] = []
                    state.doc.forEach((node, position, index) => {
                        if (blocks.has(index)) {
                            decorations.push(Decoration.Node(position, position + node.nodeSize, {
                                class: highlightClasses[kind],
                                'data-version-change': kind,
                            }))
                        }
                    })
                    return decorations
                },
            }
        },
    })
}
