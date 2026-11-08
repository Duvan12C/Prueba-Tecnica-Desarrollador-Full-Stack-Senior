import { getHtmlBlocks, HTML_FORMAT } from '@/features/documents/utils/documentContent'

const lineBreaks = '\r\n\v\f\u001c\u001d\u001e\u0085\u2028\u2029'

function splitLines(source: string): string[] {
    const lines: string[] = []
    let start = 0
    for (let index = 0; index < source.length; index++) {
        if (!lineBreaks.includes(source[index])) continue
        if (source[index] === '\r' && source[index + 1] === '\n') index++
        lines.push(source.slice(start, index + 1))
        start = index + 1
    }
    if (start < source.length) lines.push(source.slice(start))
    return lines
}

function getChangedBlocks(content: string, lines: string[], changed: ReadonlySet<number>): Set<number> {
    const blocks = new Set<number>()
    if (content.startsWith(HTML_FORMAT)) {
        let line = 1
        getHtmlBlocks(content.slice(HTML_FORMAT.length)).forEach((block, index) => {
            const end = line + splitLines(block + '\n').length
            for (; line < end; line++) {
                if (changed.has(line)) blocks.add(index)
            }
        })
    } else {
        let block = 0
        lines.forEach((line, index) => {
            if (changed.has(index)) blocks.add(block)
            if (line.endsWith('\n') || line.endsWith('\r')) block++
        })
    }
    return blocks
}

export function getVersionChanges(diff: string, previousContent: string, currentContent: string) {
    const previousLines = splitLines(previousContent)
    const currentLines = splitLines(currentContent)
    const removed = new Set<number>()
    const added = new Set<number>()
    const hunks = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n/gm

    for (const hunk of diff.matchAll(hunks)) {
        let previous = Number(hunk[1]) - 1
        let current = Number(hunk[3]) - 1
        let remainingPrevious = Number(hunk[2] ?? 1)
        let remainingCurrent = Number(hunk[4] ?? 1)
        let offset = hunk.index + hunk[0].length

        while (remainingPrevious > 0 || remainingCurrent > 0) {
            const operation = diff[offset]
            if (operation !== ' ' && operation !== '-' && operation !== '+') break
            const line = operation === '+' ? currentLines[current] : previousLines[previous]
            if (line === undefined || !diff.startsWith(line, offset + 1)) break

            if (operation === '-') removed.add(previous)
            if (operation === '+') added.add(current)
            if (operation !== '+') {
                previous++
                remainingPrevious--
            }
            if (operation !== '-') {
                current++
                remainingCurrent--
            }
            offset += line.length + 1
        }
    }

    return {
        added: getChangedBlocks(currentContent, currentLines, added),
        removed: getChangedBlocks(previousContent, previousLines, removed),
    }
}
