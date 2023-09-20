/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import { mdMerge } from "./mdMerge";

/**
 * Options for the `Ts2Md` class which generates Typescript documentation.
 */
export interface Ts2MdOptions {
    /**
     * Primary typescript source file, default is `./src/index.ts`
     */
    inputFilename: string
    firstHeadingLevel: 1 | 2 | 3
    noTitle: boolean
    outputFilename?: string
    outputReplace: boolean
    readmeMerge: boolean
}

function getJsDoc(node: ts.Node) : { jsDoc: ts.Node[], tags: ts.Node[] } {
    const jsDoc: ts.Node[] = (node['jsDoc']) ? node['jsDoc'] as ts.Node[] : []
    
    const tags: ts.Node[] = []
    for (const doc of jsDoc) {
        for (const tag of (doc['tags'] ? doc['tags'] as ts.Node[] : [])) {
            tags.push(tag)
        }
    }

    return { jsDoc, tags }
}

class DocItem<T extends ts.Node> {
    isPrivate: boolean
    jsDoc: ts.Node[]    
    jsDocTags: ts.Node[]
    
    constructor(public item: T, public name: string, public sf: ts.SourceFile) {
        const r = getJsDoc(item)
        this.jsDoc = r.jsDoc
        this.jsDocTags = r.tags
        this.isPrivate = r.tags.some(t => t.kind === ts.SyntaxKind.JSDocPrivateTag)
    }
}

abstract class DocBase<T extends ts.Node> {
    docItems: DocItem<T>[] = []
    
    constructor(public ts2Md: Ts2Md, public label: string, public labelPlural: string) {
    }
    
    abstract getName(item: T, sf: ts.SourceFile) : string

    abstract filterItem(s: ts.Statement) : T[]

    tryAddItem(s: ts.Statement, sf: ts.SourceFile) {
        const items = this.filterItem(s)
        
        for (const item of items) {
            const docItem = new DocItem(item, this.getName(item, sf), sf)
            if (!docItem.isPrivate)
                this.docItems.push(docItem)
        }
    }

    toMarkDown(docItem: DocItem<T>) : string {
       let md = `${this.ts2Md.headingLevelMd(3)} ${this.label}: ${docItem.name}\n\n`
       if (docItem.jsDoc.some(d => d.kind === ts.SyntaxKind.JSDoc)) {
            md += `${this.ts2Md.headingLevelMd(4)} Description\n\n`
            for (const d of docItem.jsDoc) {
                if (d['comment'])
                    md += `${d['comment']}\n\n`
            }
       }
       md += '```ts\n'
       md += this.toMarkDownTs(docItem)
       md += '\n```\n\n'
       md += this.toMarkDownDetails(docItem)
       return md
    }

    toMarkDownTs(docItem: DocItem<T>) : string {
        return this.ts2Md.printer.printNode(ts.EmitHint.Unspecified, docItem.item, docItem.sf)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toMarkDownDetails(docItem: DocItem<T>) : string {
        return ''
    }

    toMarkDownRefLink(docItem: DocItem<T>) : string {
       return `[${docItem.name}](#${this.label.toLowerCase()}-${docItem.name.toLowerCase()})`
    }

    isExportedDeclaration(item: ts.Declaration) : boolean {
        const modFlags = ts.getCombinedModifierFlags(item)
        const hasExportFlag = !!(modFlags & ts.ModifierFlags.Export)
        return hasExportFlag
    }
}

class DocVariable extends DocBase<ts.VariableDeclaration> {
    constructor(ts2Md: Ts2Md) { super(ts2Md, 'Variable', 'Variables') }

    override getName(item: ts.VariableDeclaration, sf: ts.SourceFile): string {
        return item.name.getText(sf)
    }

    override filterItem(item: ts.Statement): ts.VariableDeclaration[] {
        const items: ts.VariableDeclaration[] = []
        if (ts.isVariableStatement(item) && item.modifiers && item.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
            for (const v of item.declarationList.declarations) {
                items.push(v)
            }
        }
        return items
    }
}

class DocType extends DocBase<ts.TypeAliasDeclaration> {
    constructor(ts2Md: Ts2Md) { super(ts2Md, 'Type', 'Types') }

    override getName(item: ts.TypeAliasDeclaration): string {
        return item.name.text
    }

    override filterItem(item: ts.Statement): ts.TypeAliasDeclaration[] {
        if (ts.isTypeAliasDeclaration(item) && this.isExportedDeclaration(item))
            return [item]
        return []
    }
}

class DocInterface extends DocBase<ts.InterfaceDeclaration> {
    constructor(ts2Md: Ts2Md) { super(ts2Md, 'Interface', 'Interfaces') }

    override getName(item: ts.InterfaceDeclaration): string {
        return item.name.text
    }

    override filterItem(item: ts.Statement): ts.InterfaceDeclaration[] {
        if (ts.isInterfaceDeclaration(item) && this.isExportedDeclaration(item))
            return [item]
        return []
    }

    override toMarkDownDetails(docItem: DocItem<ts.InterfaceDeclaration>) : string {
        let md = ''
        let detailsStartAdded = false
        const addDetailsStart = () => {
            if (!detailsStartAdded) {
                detailsStartAdded = true
                md += `<details>\n\n<summary>${this.label} ${docItem.name} Member Details</summary>\n\n`
            }
        }
        const addDetailsEnd = () => {
            if (detailsStartAdded) {
                md += `</details>\n\n`
            }
        }
        
        for (const m of docItem.item.members) {
            const ps = m as ts.PropertySignature
            const propName = (ps.name as ts.Identifier).escapedText
            const r = getJsDoc(m)
            if (r.jsDoc.length > 0) {
                addDetailsStart()
                md += `**${propName}**\n\n`
                for (const d of r.jsDoc) {
                    if (d['comment']) {
                        md += `${d['comment']}\n\n`
                    }
                }
            }
        }
        addDetailsEnd()
        return md
    }
}

class DocFunction extends DocBase<ts.FunctionDeclaration> {
    constructor(ts2Md: Ts2Md) { super(ts2Md, 'Function', 'Functions') }

    override getName(item: ts.FunctionDeclaration): string {
        return item.name?.text || ''
    }

    override filterItem(item: ts.Statement): ts.FunctionDeclaration[] {
        if (ts.isFunctionDeclaration(item) && this.isExportedDeclaration(item))
            return [item]
        return []
    }

    override toMarkDownTs(docItem: DocItem<ts.FunctionDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.ts2Md.printer
        
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)
        if (n.body && !docItem.jsDocTags.some(t => t.kind === ts.SyntaxKind.JSDocTag
            && (t as ts.JSDocTag).tagName.escapedText === 'publicbody')) {
            const bodyts  = printer.printNode(ts.EmitHint.Unspecified, n.body, sf)
            mdts = mdts.slice(0, mdts.length - bodyts.length)
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.FunctionDeclaration>) : string {
        let md = ''
        const returnsTags = docItem.jsDocTags.filter(t => t.kind === ts.SyntaxKind.JSDocReturnTag)
            .map(t => t as ts.JSDocReturnTag)
            .filter(t => !!t.comment)
        if (returnsTags.length > 0) {
            md += `${this.ts2Md.headingLevelMd(4)} Returns\n\n`
            for (const t of returnsTags) {
                const rt = t as ts.JSDocReturnTag
                md += `${rt.comment}\n\n`
            }
        }
        return md
    }
}

class DocClass extends DocBase<ts.ClassDeclaration> {
    constructor(ts2Md: Ts2Md) { super(ts2Md, 'Class', 'Classes') }

    override getName(item: ts.ClassDeclaration): string {
        return item.name?.text || ''
    }

    override filterItem(item: ts.Statement): ts.ClassDeclaration[] {
        if (ts.isClassDeclaration(item) && this.isExportedDeclaration(item))
            return [item]
        return []
    }

    findTs(findInTs: string, targetTs: string) : { pos: number, len: number } {
        let pos = findInTs.indexOf(targetTs)
        if (pos === -1) {
            // Try outdenting once
            targetTs = targetTs.replace(/\n/g, '\n    ',)
            pos = findInTs.indexOf(targetTs)
            if (pos === -1) {
                // set and get accessor bodies sometimes are inlined in full generated class typescript
                // remove all indenting
                targetTs = targetTs.replace(/\n */g, ' ')
                pos = findInTs.indexOf(targetTs)
            }
        }
        return { pos, len: targetTs.length }
    }

    removeTs(fromTs: string, removeTs: string, withSemi?: boolean) : string {
        const r = this.findTs(fromTs, removeTs)
        // See if we would leave a dangling semicolon behind
        if (r.pos > -1 && withSemi && r.pos + r.len + 1 < fromTs.length && fromTs[r.pos + r.len] === ';' && fromTs[r.pos + r.len + 1] === '\n') {
            r.len += 2
            // and remove leading spaces
            while (r.pos > 0 && fromTs[r.pos - 1] === ' ') { r.pos--; r.len++ }
        }
        if (r.pos > -1)
            fromTs = fromTs.slice(0, r.pos) + fromTs.slice(r.pos + r.len)
        return fromTs
    }

    override toMarkDownTs(docItem: DocItem<ts.ClassDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.ts2Md.printer

        // class definition typescript including all members and function bodies...
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)
        for (const ce of n.members) {
            const r = getJsDoc(ce)
            if ((ce['modifiers'] && ce['modifiers'].some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) ||
                r.tags.some(t => ts.isJSDocPrivateTag(t))) {
                // Remove entire member
                const memberts = printer.printNode(ts.EmitHint.Unspecified, ce, sf)
                mdts = this.removeTs(mdts, memberts, true)
            } else if (ce['body'] && !r.tags.some(t => (t as ts.JSDocTag).tagName.escapedText === 'publicbody')) {
                // Remove the body from documentation typescript
                const bodyts  = printer.printNode(ts.EmitHint.Unspecified, ce['body'], sf)
                mdts = this.removeTs(mdts, bodyts)
            }
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.ClassDeclaration>) : string {
        const n = docItem.item

        let md = ''
        let detailsStartAdded = false
        const addDetailsStart = () => {
            if (!detailsStartAdded) {
                detailsStartAdded = true
                md += `<details>\n\n<summary>${this.label} ${docItem.name} Member Details</summary>\n\n`
            }
        }
        const addDetailsEnd = () => {
            if (detailsStartAdded) {
                md += `</details>\n\n`
            }
        }
        
        for (const m of n.members) {
            switch (m.kind) {
                case ts.SyntaxKind.Constructor: {
                    const n = m as ts.ConstructorDeclaration
                } break;
                case ts.SyntaxKind.GetAccessor: {
                    const n = m as ts.GetAccessorDeclaration
                } break;
                case ts.SyntaxKind.SetAccessor: {
                    const n = m as ts.SetAccessorDeclaration
                } break;
                case ts.SyntaxKind.MethodDeclaration: {
                    const n = m as ts.MethodDeclaration
                } break;
                default:
                    break
            }
            /*
            const ps = m as ts.PropertySignature
            const propName = (ps.name as ts.Identifier).escapedText
            const r = getJsDoc(m)
            if (r.jsDoc.length > 0) {
                addDetailsStart()
                md += `**${propName}**\n\n`
                for (const d of r.jsDoc) {
                    if (d['comment']) {
                        md += `${d['comment']}\n\n`
                    }
                }
            }
            */
        }
        addDetailsEnd()
        return md
    }
}

/**
 * Use the Typescript compiler to parse source tree given a top level source file such as `index.ts`.
 * 
 * Extract the exported API interfaces, classes, types, functions and variables.
 * 
 * Generate GitHub friendly MarkDown documentation for the extracted API leveraging TypeScript type information
 * and merging JSDoc style documentation comments.
 * 
 * The following JSDoc tags are supported:
 * 
 *    `@publicbody` Applied to a class method or function. Adds the function body to the documentation with embedded comments removed.
 * 
 *    `@private` Applied to an exported or publicly accessible member keeps it out of documentation.
 */
export class Ts2Md {
    private program: ts.Program
    /**
     * @private
     */
    printer: ts.Printer
    private sourceFiles: ts.SourceFile[] = []
    private docs: DocBase<ts.Node>[] = []

    /**
     * The top level inupt Typescript file's filename with full path.
     */
    filePath: string
    /**
     * The top level inupt Typescript file's filename without path
     */
    fileName: string
    /**
     * The generated documentation as markdown string
     */
    markDown?: string
    /**
     * The file path to which `markDown` was written.
     */
    outputPath?: string

    constructor(public options: Ts2MdOptions) {
        this.filePath = path.resolve(options.inputFilename)
        this.fileName = path.parse(this.filePath).name

        const compOpts: ts.CompilerOptions = {
            allowJs: false,
            target: ts.ScriptTarget.Latest
        }
        const progOpts: ts.CreateProgramOptions = {
            rootNames: [ this.filePath ],
            options: compOpts
        }

        this.program = ts.createProgram(progOpts)

        const printOpts: ts.PrinterOptions = {
            newLine: ts.NewLineKind.LineFeed,
            removeComments: true,
            omitTrailingSemicolon: true
        }

        const printHandlers: ts.PrintHandlers = { }

        this.printer = ts.createPrinter(printOpts, printHandlers)
        
    }
    
    /**
     * Genrates the documentation markdown and write's it to output file
     * and/or merges it to README.md
     */
    run() : void {
        this.sourceFiles = this.parseSourceFiles(this.program)
        this.docs = this.extractDocs(this.sourceFiles)
        this.markDown = this.generateMarkDown(this.docs)
        if (this.markDown) {
            if (this.options.outputFilename)
                this.outputPath = this.writeMarkDownToOuput(this.markDown, this.options.outputFilename)
            if (this.options.readmeMerge)
                this.readmeMerge(this.markDown)
        }
    }

    headingLevelMd(relativeLevel: number) : string {
        relativeLevel += this.options.firstHeadingLevel - 1
        if (this.options.noTitle) relativeLevel--
        return '#'.repeat(relativeLevel + this.options.firstHeadingLevel - 1)
    }

    parseSourceFiles(program: ts.Program) : ts.SourceFile[] {
        return program.getSourceFiles().filter(sf => sf.fileName.indexOf('node_modules') === -1)
    }
    
    extractDocs(sourceFiles: ts.SourceFile[]) : DocBase<ts.Node>[] {
        let docs: DocBase<ts.Node>[] = [
            new DocInterface(this),
            new DocClass(this),
            new DocFunction(this),
            new DocType(this),
            new DocVariable(this)
        ]

        for (const sf of sourceFiles) {
            console.log(`SourceFile ${sf.fileName}`)
            ts.forEachChild(sf, node => {
                if (ts.isStatement(node)) {
                    for (const doc of docs) {
                        doc.tryAddItem(node, sf)
                    }
                }
            })
        }
        
        // Eliminate empty doc categories
        docs = docs.filter(d => d.docItems.length > 0)
        return docs
    }
    
    generateMarkDown(docs: DocBase<ts.Node>[]) : string {
        let md = ''

        if (!this.options.noTitle) {
            md += `${this.headingLevelMd(1)} API\n\n`
        } else {
            md += '\n'
        }
        
        let linksMd = `Links: [API](#api)`
        for (const doc of docs) {
            linksMd += `, [${doc.labelPlural}](#${doc.labelPlural.toLowerCase()})`
        }
        linksMd += '\n\n'
        
        md += linksMd

        for (const doc of this.docs) {

            md += `${this.headingLevelMd(2)} ${doc.labelPlural}\n\n`

            if (doc.docItems.length > 1) {
                md += this.generateDocItemLinksTable(doc)
                md += `\n${linksMd}---\n\n`
            }

            for (const docItem of doc.docItems) {
                md += doc.toMarkDown(docItem)
                md += linksMd
                md += '---\n'
            }
        }
        
        return md
    }
    
    generateDocItemLinksTable(doc: DocBase<ts.Node>) : string {
        let md = ''

        const nameLinks = doc.docItems.map(d => ({ name: d.name, linkMd: doc.toMarkDownRefLink(d) }))
        nameLinks.sort((a, b) => a.name < b.name ? -1 : a.name === b.name ? 0 : 1)

        let cols = 1, rows = nameLinks.length
        while (cols < 4 && rows > 12) { cols++; rows = Math.ceil(nameLinks.length / cols) }

        for (let col = 1; col <= cols; col++) { md += '| ' } md += '|\n'

        for (let col = 1; col <= cols; col++) { md += '| --- ' } md += '|\n'

        for (let row = 1; row <= rows; row++) {
            for (let col = 1; col <= cols; col++) {
                const i = (col - 1) * rows + row - 1
                const d = i < nameLinks.length ? nameLinks[i].linkMd : ''
                if (col === 1) md += '|'
                md += ` ${d} |`
            }
            md += '\n'
        }
        return md
    }
    
    writeMarkDownToOuput(markDown: string, outputFilename: string) : string {
        const outputPath = path.resolve(outputFilename)
        if (this.options.outputReplace) {
            try { fs.unlinkSync(outputPath) } catch { /* */ }
        }
        fs.writeFileSync(outputPath, markDown)
        
        return outputPath
    }
    
    readmeMerge(markDown: string) {
        mdMerge(markDown)
    }

}

export function ts2md(options?: Ts2MdOptions) : void {
    if (!options) {
        try {
            const configPath = path.resolve('./ts2md.json')
            const json = fs.readFileSync(configPath, { encoding: 'utf8'})
            options = <Ts2MdOptions>JSON.parse(json)
        } catch {/* */}
    }
    options ||= {
        inputFilename: './src/index.ts',
        outputFilename: './apiDoc.md',
        firstHeadingLevel: 2,
        noTitle: true,
        outputReplace: true,
        readmeMerge: true
    }
    new Ts2Md(options).run()
}

ts2md()
