import type { JSONContent } from '@tiptap/react'

export const HTML_FORMAT = 'DOCSPACE_HTML_V1\n'

export function getEditorContent(content: string): string | JSONContent {
    if (content.startsWith(HTML_FORMAT)) return content.slice(HTML_FORMAT.length)

    return {
        type: 'doc',
        content: content.split(/\r\n?|\n/).map((line) => ({
            type: 'paragraph',
            ...(line && { content: [{ type: 'text', text: line }] }),
        })),
    }
}

export function getHtmlBlocks(html: string): string[] {
    const template = document.createElement('template')
    template.innerHTML = html
    return Array.from(template.content.children, (element) => element.outerHTML)
}

export function serializeEditorContent(html: string): string {
    return `${HTML_FORMAT}${getHtmlBlocks(html).join('\n')}\n`
}
