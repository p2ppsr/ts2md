import * as fs from "fs";
import * as path from "path";

/**
 * Quick and dirty README.md merge function.
 * 
 * The anchors must not be indented and must exactly match:
 * 
 *    `<!--#region ts2md-api-merged-here-->`
 * 
 *    `<!--#endregion ts2md-api-merged-here-->`
 * 
 * @param md The markdown to insert between the start and end anchors.
 */
export function mdMerge(md: string) {
    const mergePath = path.resolve('./README.md')

    const preMergeMd = fs.readFileSync(mergePath, { encoding: 'utf8' })
    
    const mergeStartAnchor = '\n<!--#region ts2md-api-merged-here-->'
    const mergeEndAnchor = '\n<!--#endregion ts2md-api-merged-here-->'
    
    const posStart = preMergeMd.indexOf(mergeStartAnchor)
    const posEnd = preMergeMd.indexOf(mergeEndAnchor)
    
    if (posStart > -1 && posEnd > -1 && posStart < posEnd) {
        const mergedMd = preMergeMd.slice(0, posStart + mergeStartAnchor.length) +
         md +
         preMergeMd.slice(posEnd)
        try { fs.unlinkSync(mergePath) } catch { /* */ }
        fs.writeFileSync(mergePath, mergedMd)
    }
}