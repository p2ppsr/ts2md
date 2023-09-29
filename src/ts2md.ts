#!/usr/bin/env node
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
    /**
     * The heading level for the first generated heading.
     */
    firstHeadingLevel: 1 | 2 | 3
    /**
     * Set to true if generated markdown will be merged into
     * a file that already includes a containing header.
     */
    noTitle: boolean
    /**
     * If valid, a copy of the generated markdown documentation will be
     * saved to this file.
     */
    outputFilename?: string
    /**
     * Set to true to attempt to delete an existing output file before
     * writing new output.
     */
    outputReplace: boolean
    /**
     * Set to true if the generated output should be merged into README.md
     * 
     * Currently README.md must exist at `./README.md`
     * 
     * and must contain the following merge start and merge end anchors:
     * 
     *    `<!--#region ts2md-api-merged-here-->`
     *
     *    `<!--#endregion ts2md-api-merged-here-->`
     *    
     * The anchors must not be indented.
     */
    readmeMerge: boolean
    /**
     * If true, overrides private typescript keywords and jsdoc tags.
     * 
     * CAUTION: This setting is inappropriate for published documentation ;-)
     */
    nothingPrivate?: boolean
}

/**
 * Parsed JSDoc info associated with a documentation item
 */
interface JSDocInfo {
    /**
     * true if has '@private' tag
     */
    isPrivate: boolean
    /**
     * true if has '@publicbody' tag
     */
    publicBody: boolean
    /**
     * true if has '@privateinitializer' tag
     */
    privateInitializer: boolean
    /**
     * JSDoc nodes with ['comment'] strings not otherwise tagged with a recognized tag.
     */
    comments: string[]
    /**
     * The @param tag comments.
     */
    params: ts.JSDocParameterTag[]
    /**
     * JSDoc nodes tagged with '@returns'
     */
    returns: ts.JSDocReturnTag[]
    /**
     * JSDoc nodes tagged with '@throws'
     */
    throws: ts.JSDocThrowsTag[]
    /**
     * The @example tag comments. Comments without code blocks are assumed to be typescript codeblocks
     */
    examples: string[]
    /**
     * The @property tag identifiers and comments. These are forwarded to the relevant member property documentation.
     */
    properties: Record<string, string>
    /**
     * JSDoc tags not parsed into other properties
     */
    tags: ts.Node[]
    /**
     * JSDoc nodes not parsed into other properties
     */
    other: ts.Node[]    
}

/**
 * Parse available JSDoc information on this node.
 */
function getJsDocInfo(node: ts.Node, name: string, parent?: DocItem<ts.Node>) : JSDocInfo {
    const r: JSDocInfo = {
        isPrivate: false,
        comments: [],
        params: [],
        returns: [],
        throws: [],
        examples: [],
        tags: [],
        other: [],
        publicBody: false,
        privateInitializer: false,
        properties: {}
    }

    if (name !== 'constructor' && parent && parent.jsDoc.properties[name])
        // Forward @property tags on the parent to this node by name
        r.comments.push(parent.jsDoc.properties[name])

    const jsDoc: ts.Node[] = (node['jsDoc']) ? node['jsDoc'] as ts.Node[] : []

    for (const doc of jsDoc) {

        const comment = doc['comment']
        if (comment && typeof comment === 'string')
            r.comments.push(comment)

        for (const t of (doc['tags'] ? doc['tags'] as ts.Node[] : [])) {
            const comment = typeof t['comment'] === 'string' ? t['comment'] : undefined
            if (t.kind === ts.SyntaxKind.JSDocParameterTag) {
                if (comment)
                    r.params.push(t as ts.JSDocParameterTag)
            } else if (t.kind === ts.SyntaxKind.JSDocReturnTag) {
                if (comment)
                    r.returns.push(t as ts.JSDocReturnTag)
            } else if (t.kind === ts.SyntaxKind.JSDocThrowsTag) {
                if (comment)
                    r.throws.push(t as ts.JSDocThrowsTag)
            } else {
                const tag = t.kind === ts.SyntaxKind.JSDocTag ? (t as ts.JSDocTag).tagName.escapedText : ''
                if (tag === 'publicbody') {
                    r.publicBody = true
                }
                else if (tag === 'privateinitializer') {
                    r.privateInitializer = true
                }
                else if (tag === 'property') {
                    if (comment) {
                        const re = /(?<identifier>[^ \t\-:]+)[ \t\-:]+(?<comment>.*)/
                        const m = comment.match(re)
                        if (m && m.index === 0 && m.groups) {
                            r.properties[m.groups.identifier] = m.groups.comment
                        }
                    }
                }
                else if (tag === 'example') {
                    if (comment) {
                        let example: string = comment
                        if (example.indexOf('```') === -1)
                            example = '```ts\n' + example + '\n```\n'
                        r.examples.push(example)
                    }
                }
                else
                    r.tags.push(t)
            }
        }
    }
    return r
}

/**
 * Wrapper for a Typescript `Node` of a specific derived type,
 * which is of interest for documentation generation.
 */
class DocItem<T extends ts.Node> {
    /**
     * Parsed JSDoc information for this item
     */
    jsDoc: JSDocInfo

    /**
     * Subsidiary documentation nodes when the node has members which
     * are themselves represented as documentation nodes.
     */
    memberDocs: DocBase<ts.Node>[] = []

    /**
     * This is really here just for demonstration / testing purposes...
     * @param item The typescript Node for this doc item.
     * @param name The name for this doc item.
     * @param sf The source file which defined this item.
     */
    constructor(public item: T, public name: string, public sf: ts.SourceFile, public parent?: DocItem<ts.Node>) {
        this.jsDoc = getJsDocInfo(item, name, parent)
    }
}

abstract class DocBase<T extends ts.Node> {
    docItems: DocItem<T>[] = []
    
    constructor(public sup: DocGenSupportApi, public label: string, public labelPlural: string, public detailsLabel = 'Details') {
    }
    
    abstract getName(item: T, sf: ts.SourceFile) : string

    abstract filterItem(s: ts.Node) : T[]

    tryAddItem(s: ts.Node, sf: ts.SourceFile, parent?: DocItem<ts.Node>) {
        const items = this.filterItem(s)
        
        for (const item of items) {
            const docItem = new DocItem(item, this.getName(item, sf), sf, parent)
            if (!docItem.jsDoc.isPrivate || this.sup.nothingPrivate) {
                docItem.memberDocs = this.extractMemberDocs(docItem)
                for (const md of docItem.memberDocs) {
                    md.docItems.sort((a, b) => a.name < b.name ? -1 : a.name === b.name ? 0 : 1)
                }
                this.docItems.push(docItem)
            }
        }
    }

    extractMemberDocs(docItem: DocItem<ts.Node>) : DocBase<ts.Node>[] { return [] }
    
    isNotPrivate(item: ts.Node) : boolean {
        // not private if either we don't care if its private
        const notPrivate = (this.sup.nothingPrivate ||
             // Or it isn't private, which is either by having the private keyword
             !((item['modifiers'] && item['modifiers'].some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) ||
               // or by having private jsdoc tag
               item['jsDoc']?.some(t => ts.isJSDocPrivateTag(t))))
        return notPrivate
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
        if (r.pos > -1) {
            fromTs = fromTs.slice(0, r.pos) + fromTs.slice(r.pos + r.len)
            if (fromTs[r.pos] === '\n') {
                let pos2 = r.pos -1
                while (pos2 > 0 && fromTs[pos2] === ' ') pos2--
                if (fromTs[pos2] === '\n') {
                    // and remove blank line left after original removal
                    fromTs = fromTs.slice(0, pos2) + fromTs.slice(r.pos)
                }
            }
        }
        return fromTs
    }

    /**
     * Base class implementation of markdown generation for a top level typescript AST node (`DocItem`).
     * 
     * Adds relative level 3 heading with `label` and `docItem.name`
     * 
     * Adds the nodes simple (no `@` tag) JSDoc nodes under relative level 4 'Description` heading
     * 
     * Calls the `toMarkDownTs` override to add the typescript syntax code block for this node.
     * 
     * Calls the `toMarkDownDtails` override to add any details markdown for this node.
     * 
     * @returns the generated markdown for this `DocItem`
     */
    toMarkDown(docItem: DocItem<T>) : string {
       let md = `${this.sup.headingLevelMd(3)} ${this.label}: ${docItem.name}\n\n`

       md += this.commentsDetails(docItem)
       
       md += this.examplesDetails(docItem)
       
       const mdts = this.toMarkDownTs(docItem)
       if (mdts) {
            md += '```ts\n' + mdts + '\n```\n\n'
       }

       const details = this.toMarkDownDetails(docItem) 
       if (details) {
            md += `<details>\n\n<summary>${this.label} ${docItem.name} ${this.detailsLabel}</summary>\n\n`
            md += details
            md += `</details>\n\n`
       }
       return md
    }

    /**
     * Generate the typescript syntax for this node to be inserted in a typescript syntax code block
     * in generated markdown.
     * 
     * Base class implementation uses the typescript compiler printer on `DocItem` AST node `item`.
     * 
     * CAUTION: This adds ALL the source code for this item to the generated markdown. Override SHOULD
     * implement appropriate ommission control policies.
     * 
     * @returns typescript syntax to be added within a typescript syntax code block for this `DocItem`
     */
    toMarkDownTs(docItem: DocItem<T>) : string {
        let item = docItem.item
        if (item['initializer'] && docItem.jsDoc.privateInitializer) {
            item = { ...item }
            item['initializer'] = undefined
        }
        const mdts = this.sup.printer.printNode(ts.EmitHint.Unspecified, item, docItem.sf)
        return mdts
    }

    /**
     * Generate the 'Details' markdown (including ) for this node.
     * 
     * Base class implementation returns an empty string.
     */
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

    argumentsDetails(docItem: DocItem<T>) : string {
        let md = ''
        if (docItem.jsDoc.params.length > 0) {
            md += `Argument Details\n\n`
            for (const tag of docItem.jsDoc.params) {
                const name = tag.name.getText(docItem.sf)
                let comment = tag.comment
                if (typeof comment === 'string') {
                    if (comment?.indexOf('- ') === 0)
                        // remove leading '- ' if present
                        comment = comment.slice(2)
                    md += `+ **${name}**\n  + ${comment}\n`
                }
            }
            md += '\n'
        }
        return md
    }

    returnsDetails(docItem: DocItem<T>) : string {
        let md = ''
        if (docItem.jsDoc.returns.length > 0) {
            md += `Returns\n\n`
            for (const t of docItem.jsDoc.returns) {
                md += `${t.comment}\n\n`
            }
        }
        return md
    }

    throwsDetails(docItem: DocItem<T>) : string {
        let md = ''
        if (docItem.jsDoc.throws.length > 0) {
            md += `Throws\n\n`
            for (const tag of docItem.jsDoc.throws) {
                md += `${tag.comment}\n\n`
            }
        }
        return md
    }

    examplesDetails(docItem: DocItem<T>) : string {
        let md = ''
        if (docItem.jsDoc.examples.length > 0) {
            md += `Example${docItem.jsDoc.examples.length > 1 ? 's' : ''}\n\n`
            for (const e of docItem.jsDoc.examples) {
                md += `${e}\n`
            }
        }
        return md
    }

    commentsDetails(docItem: DocItem<T>) : string {
        let md = ''
        for (const comment of docItem.jsDoc.comments) {
            md += `${comment}\n\n`
        }
        return md
    }
}

class DocVariable extends DocBase<ts.VariableDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Variable', 'Variables') }

    override getName(item: ts.VariableDeclaration, sf: ts.SourceFile): string {
        return item.name.getText(sf)
    }

    override filterItem(item: ts.Node): ts.VariableDeclaration[] {
        const items: ts.VariableDeclaration[] = []
        if (ts.isVariableStatement(item) && item.modifiers &&
            (this.sup.nothingPrivate || item.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword))) {
            for (const v of item.declarationList.declarations) {
                items.push(v)
            }
        }
        return items
    }
}

class DocType extends DocBase<ts.TypeAliasDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Type', 'Types') }

    override getName(item: ts.TypeAliasDeclaration): string {
        return item.name.text
    }

    override filterItem(item: ts.Node): ts.TypeAliasDeclaration[] {
        if (ts.isTypeAliasDeclaration(item) &&
            (this.sup.nothingPrivate || this.isExportedDeclaration(item)))
            return [item]
        return []
    }
}

class DocFunction extends DocBase<ts.FunctionDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Function', 'Functions', 'Details') }

    override getName(item: ts.FunctionDeclaration): string {
        return item.name?.text || ''
    }

    override filterItem(item: ts.Node): ts.FunctionDeclaration[] {
        if (ts.isFunctionDeclaration(item) && 
            (this.sup.nothingPrivate || this.isExportedDeclaration(item)))
            return [item]
        return []
    }

    override toMarkDownTs(docItem: DocItem<ts.FunctionDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.sup.printer
        
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)
        if (n.body && !docItem.jsDoc.publicBody) {
            // Remove the function body
            const bodyts  = printer.printNode(ts.EmitHint.Unspecified, n.body, sf)
            mdts = mdts.slice(0, mdts.length - bodyts.length)
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.FunctionDeclaration>) : string {
        let md = ''

        md += this.returnsDetails(docItem)
        
        md += this.argumentsDetails(docItem)

        md += this.throwsDetails(docItem)

        return md
    }
}

class DocProperty extends DocBase<ts.PropertyDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Property', 'Properties') }

    override getName(item: ts.PropertyDeclaration): string {
        if (ts.isIdentifier(item.name))
            return item.name.text
        return ''
    }

    override filterItem(item: ts.Node): ts.PropertyDeclaration[] {
        if (ts.isPropertyDeclaration(item) && this.isNotPrivate(item))
            return [item]
        return []
    }

    override toMarkDownDetails(docItem: DocItem<ts.PropertyDeclaration>) : string {
        let md = ''

        md += this.examplesDetails(docItem)

        const comments = this.commentsDetails(docItem)

        if (md || comments) {
            const mdts = '```ts\n' + this.toMarkDownTs(docItem) + '\n```\n'
            let intro = `${this.sup.headingLevelMd(4)} Property ${docItem.name}\n\n`
            if (comments) intro += comments
            md = `${intro}${mdts}\n${md}`
        }

        return md
    }
}

class DocConstructor extends DocBase<ts.ConstructorDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Constructor', 'Constructors', 'Arguments') }

    override getName(item: ts.ConstructorDeclaration): string {
        return 'constructor'
    }

    override filterItem(item: ts.Node): ts.ConstructorDeclaration[] {
        if (ts.isConstructorDeclaration(item) && this.isNotPrivate(item))
            return [item]
        return []
    }

    override toMarkDownTs(docItem: DocItem<ts.ConstructorDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.sup.printer
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)

        if (n['body'] && !(this.sup.nothingPrivate || docItem.jsDoc.publicBody)) {
            // Remove the body from documentation typescript
            const bodyts  = printer.printNode(ts.EmitHint.Unspecified, n['body'], sf)
            mdts = this.removeTs(mdts, bodyts)
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.ConstructorDeclaration>) : string {
        let md = ''

        md += this.argumentsDetails(docItem)

        md += this.throwsDetails(docItem)

        md += this.examplesDetails(docItem)

        const comments = this.commentsDetails(docItem)

        if (md || comments) {
            const mdts = '```ts\n' + this.toMarkDownTs(docItem) + '\n```\n'
            let intro = `${this.sup.headingLevelMd(4)} Constructor\n\n`
            if (comments) intro += comments
            md = `${intro}${mdts}\n${md}`
        }

        return md
    }
}

class DocMethod extends DocBase<ts.MethodDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Method', 'Methods') }

    override getName(item: ts.MethodDeclaration): string {
        if (ts.isIdentifier(item.name))
            return item.name.text
        return ''
    }

    override filterItem(item: ts.Node): ts.MethodDeclaration[] {
        if (ts.isMethodDeclaration(item) && this.isNotPrivate(item))
            return [item]
        return []
    }

    override toMarkDownTs(docItem: DocItem<ts.MethodDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.sup.printer
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)

        if (n['body'] && !(this.sup.nothingPrivate || docItem.jsDoc.publicBody)) {
            // Remove the body from documentation typescript
            const bodyts  = printer.printNode(ts.EmitHint.Unspecified, n['body'], sf)
            mdts = this.removeTs(mdts, bodyts)
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.MethodDeclaration>) : string {
        let md = ''

        md += this.returnsDetails(docItem)

        md += this.argumentsDetails(docItem)

        md += this.throwsDetails(docItem)

        md += this.examplesDetails(docItem)

        const comments = this.commentsDetails(docItem)

        if (md || comments) {
            const mdts = '```ts\n' + this.toMarkDownTs(docItem) + '\n```\n'
            let intro = `${this.sup.headingLevelMd(4)} Method ${docItem.name}\n\n`
            if (comments) intro += comments
            md = `${intro}${mdts}\n${md}`
        }

        return md
    }
}

class DocClass extends DocBase<ts.ClassDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Class', 'Classes') }

    override getName(item: ts.ClassDeclaration): string {
        return item.name?.text || ''
    }

    override filterItem(item: ts.Node): ts.ClassDeclaration[] {
        if (ts.isClassDeclaration(item) && 
            (this.sup.nothingPrivate || this.isExportedDeclaration(item)))
            return [item]
        return []
    }

    override extractMemberDocs(docItem: DocItem<ts.ClassDeclaration>) : DocBase<ts.Node>[] {
        const n = docItem.item
        const sf = docItem.sf

        let docs: DocBase<ts.Node>[] = [
            new DocConstructor(this.sup),
            new DocProperty(this.sup),
            new DocMethod(this.sup),
        ]

        for (const ce of n.members) {
            for (const doc of docs) {
                doc.tryAddItem(ce, sf, docItem)
            }
        }
        
        // Eliminate empty doc categories
        docs = docs.filter(d => d.docItems.length > 0)
        return docs
    }
    
    override toMarkDownTs(docItem: DocItem<ts.ClassDeclaration>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.sup.printer

        // class definition typescript including all members and function bodies...
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)
        for (const ce of n.members) {
            const r = getJsDocInfo(ce, docItem.name)
            let isPrivate = false
            if (!this.sup.nothingPrivate &&
                ((ce['modifiers'] && ce['modifiers'].some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) ||
                r.tags.some(t => ts.isJSDocPrivateTag(t)))) {
                isPrivate = true
                // Remove entire member
                const memberts = printer.printNode(ts.EmitHint.Unspecified, ce, sf)
                mdts = this.removeTs(mdts, memberts, true)
            } else if (ce['body'] && !r.publicBody) {
                // Remove the body from documentation typescript
                const bodyts  = printer.printNode(ts.EmitHint.Unspecified, ce['body'], sf)
                mdts = this.removeTs(mdts, bodyts)
            } else if (ce['initializer'] && r.privateInitializer) {
                const initializerts  = printer.printNode(ts.EmitHint.Unspecified, ce['initializer'], sf)
                mdts = this.removeTs(mdts, `= ${initializerts};`)
            }
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.ClassDeclaration>): string {
        let md = ''

        for (const doc of docItem.memberDocs) {
            for (const item of doc.docItems) {
                const details = doc.toMarkDownDetails(item)
                if (details)
                    md += details
            }
        }

        return md
    }
}

class DocPropertySignature extends DocBase<ts.PropertySignature> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Property', 'Properties') }

    override getName(item: ts.PropertySignature): string {
        if (ts.isIdentifier(item.name))
            return item.name.text
        return ''
    }

    override filterItem(item: ts.Node): ts.PropertySignature[] {
        if (ts.isPropertySignature(item) && this.isNotPrivate(item))
            return [item]
        return []
    }

    override toMarkDownDetails(docItem: DocItem<ts.PropertySignature>) : string {
        let md = ''

        md += this.examplesDetails(docItem)

        const comments = this.commentsDetails(docItem)

        if (md || comments) {
            const mdts = '```ts\n' + this.toMarkDownTs(docItem) + '\n```\n'
            let intro = `${this.sup.headingLevelMd(4)} Property ${docItem.name}\n\n`
            if (comments) intro += comments
            md = `${intro}${mdts}\n${md}`
        }

        return md
    }
}

class DocMethodSignature extends DocBase<ts.MethodSignature> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Method', 'Methods') }

    override getName(item: ts.MethodSignature): string {
        if (ts.isIdentifier(item.name))
            return item.name.text
        return ''
    }

    override filterItem(item: ts.Node): ts.MethodSignature[] {
        if (ts.isMethodSignature(item) && this.isNotPrivate(item))
            return [item]
        return []
    }

    override toMarkDownTs(docItem: DocItem<ts.MethodSignature>) : string {
        const n = docItem.item
        const sf = docItem.sf
        const printer = this.sup.printer
        let mdts = printer.printNode(ts.EmitHint.Unspecified, n, sf)

        if (n['body'] && !(this.sup.nothingPrivate || docItem.jsDoc.publicBody)) {
            // Remove the body from documentation typescript
            const bodyts  = printer.printNode(ts.EmitHint.Unspecified, n['body'], sf)
            mdts = this.removeTs(mdts, bodyts)
        }
        return mdts
    }

    override toMarkDownDetails(docItem: DocItem<ts.MethodSignature>) : string {
        let md = ''

        md += this.returnsDetails(docItem)

        md += this.argumentsDetails(docItem)

        md += this.throwsDetails(docItem)

        md += this.examplesDetails(docItem)

        const comments = this.commentsDetails(docItem)

        if (md || comments) {
            const mdts = '```ts\n' + this.toMarkDownTs(docItem) + '\n```\n'
            let intro = `${this.sup.headingLevelMd(4)} Method ${docItem.name}\n\n`
            if (comments) intro += comments
            md = `${intro}${mdts}\n${md}`
        }

        return md
    }
}

class DocInterface extends DocBase<ts.InterfaceDeclaration> {
    constructor(sup: DocGenSupportApi) { super(sup, 'Interface', 'Interfaces') }

    override getName(item: ts.InterfaceDeclaration): string {
        return item.name.text
    }

    override filterItem(item: ts.Node): ts.InterfaceDeclaration[] {
        if (ts.isInterfaceDeclaration(item) &&
            (this.sup.nothingPrivate || this.isExportedDeclaration(item)))
            return [item]
        return []
    }

    override extractMemberDocs(docItem: DocItem<ts.InterfaceDeclaration>) : DocBase<ts.Node>[] {
        const n = docItem.item
        const sf = docItem.sf

        let docs: DocBase<ts.Node>[] = [
            new DocPropertySignature(this.sup),
            new DocMethodSignature(this.sup),
        ]

        for (const ce of n.members) {
            for (const doc of docs) {
                doc.tryAddItem(ce, sf, docItem)
            }
        }
        
        // Eliminate empty doc categories
        docs = docs.filter(d => d.docItems.length > 0)
        return docs
    }
    
    override toMarkDownDetails(docItem: DocItem<ts.InterfaceDeclaration>) : string {
        let md = ''

        for (const doc of docItem.memberDocs) {
            for (const item of doc.docItems) {
                const details = doc.toMarkDownDetails(item)
                if (details)
                    md += details
            }
        }

        return md
    }
}

interface DocGenSupportApi {
    printer: ts.Printer
    nothingPrivate: boolean
    headingLevelMd(relativeLevel: number) : string
}

/**
 * Uses the Typescript compiler to parse source tree given a top level source file such as `index.ts`.
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
 * 
 *    `@privateinitializer` Applied to a class property with an initializer will prevent the initializer from appearing in the documentation.
 */
export class Ts2Md implements DocGenSupportApi {

    private program: ts.Program
    /**
     * @private
     */
    printer: ts.Printer
    private sourceFiles: ts.SourceFile[] = []
    private docs: DocBase<ts.Node>[] = []
    /**
     * @private
     */
    nothingPrivate: boolean

    /**
     * The top level input Typescript file's filename with full path.
     */
    filePath: string
    /**
     * The top level input Typescript file's filename without path
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

    /**
     * Construct a new instance configured for `run` method to be called next.
     * 
     * @param options Must be provided. inputFilename defaults to `./src/index.ts`
     */
    constructor(public options: Ts2MdOptions) {
        
        options.inputFilename ||= './src/index.ts'
        this.nothingPrivate = options.nothingPrivate || false
        
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
     * Generates the documentation markdown and write's it to output file
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

    /**
     * @private
     */
    headingLevelMd(relativeLevel: number) : string {
        relativeLevel += this.options.firstHeadingLevel - 1
        if (this.options.noTitle) relativeLevel--
        return '#'.repeat(relativeLevel + this.options.firstHeadingLevel - 1)
    }

    private parseSourceFiles(program: ts.Program) : ts.SourceFile[] {
        return program.getSourceFiles().filter(sf => sf.fileName.indexOf('node_modules') === -1)
    }
    
    private extractDocs(sourceFiles: ts.SourceFile[]) : DocBase<ts.Node>[] {
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
    
    private generateMarkDown(docs: DocBase<ts.Node>[]) : string {
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
    
    /**
     * Generates a markdown table of named links to docItem documentation headers.
     * @param doc The category of documentation for which to generate the table.
     * @returns markdown table of named links to docItem documentation headers
     */
    private generateDocItemLinksTable(doc: DocBase<ts.Node>) : string {
        let md = ''

        const nameLinks = doc.docItems.map(d => ({ name: d.name, linkMd: doc.toMarkDownRefLink(d) }))
        nameLinks.sort((a, b) => a.name < b.name ? -1 : a.name === b.name ? 0 : 1)

        let cols = 1, rows = nameLinks.length
        while (cols < 3 && rows > 12) { cols++; rows = Math.ceil(nameLinks.length / cols) }

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
    
    private writeMarkDownToOuput(markDown: string, outputFilename: string) : string {
        const outputPath = path.resolve(outputFilename)
        if (this.options.outputReplace) {
            try { fs.unlinkSync(outputPath) } catch { /* */ }
        }
        fs.writeFileSync(outputPath, markDown)
        
        return outputPath
    }
    
    private readmeMerge(markDown: string) {
        mdMerge(markDown)
    }

}

/**
 * Generate Typescript documentation and merge into README.md
 * 
 * Attempts to validate options, constructs an instance of Ts2Md with those options, and runs the generation method.
 * 
 * 1. Function argument is used if provided.
 * 
 * 2. Looks for `./ts2md.json`
 * 
 * 3. Default options.
 * 
 * Default options are:
 *
 * ```json
 * {
 *   "inputFilename": "./src/index.ts",
 *   "outputFilename": "./apiDoc.md",
 *   "firstHeadingLevel": 2,
 *   "noTitle": true,
 *   "outputReplace": true,
 *   "readmeMerge": true
 * }
 * ```
 * @param options Optional options to control markdown generation.
 * @publicbody
 */
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
        outputFilename: '',
        firstHeadingLevel: 2,
        noTitle: true,
        outputReplace: true,
        readmeMerge: true,
        //nothingPrivate: true
    }
    new Ts2Md(options).run()
}

console.log('running ts2md()')
ts2md()