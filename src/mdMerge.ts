import * as fs from "fs";
import * as path from "path";

export function mdMerge(md: string) {
    const mergePath = path.resolve('./README.md')

    const preMergeMd = fs.readFileSync(mergePath, { encoding: 'utf8' })
    
    const mergeStartAnchor = '<!--#region ts2md-api-merged-here-->'
    const mergeEndAnchor = '<!--#endregion ts2md-api-merged-here-->'
    
    const posStart = preMergeMd.indexOf(mergeStartAnchor)
    const posEnd = preMergeMd.indexOf(mergeEndAnchor)
    
    if (posStart > -1 && posEnd > -1 && posStart < posEnd) {
        const mergedMd = preMergeMd.slice(0, posStart + mergeStartAnchor.length) +
         md +
         preMergeMd.slice(posEnd)
        try { fs.unlinkSync(mergePath) } catch { /* */ }
        fs.writeFileSync(mergePath, mergedMd)
    }

    
    console.log('done')
}