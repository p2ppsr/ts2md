# ts2md

Simple Typescript Documentation in README.md Generator

## API

<!--#region ts2md-api-merged-here-->
Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

### Interfaces

#### Interface: Ts2MdOptions

##### Description

Options for the `Ts2Md` class which generates Typescript documentation.

```ts
export interface Ts2MdOptions {
    inputFilename: string;
    firstHeadingLevel: 1 | 2 | 3;
    noTitle: boolean;
    outputFilename?: string;
    outputReplace: boolean;
    readmeMerge: boolean;
}
```

<details>

<summary>Interface Ts2MdOptions Member Details</summary>

**inputFilename**

Primary typescript source file, default is `./src/index.ts`

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
### Classes

#### Class: Ts2Md

##### Description

Use the Typescript compiler to parse source tree given a top level source file such as `index.ts`.

Extract the exported API interfaces, classes, types, functions and variables.

Generate GitHub friendly MarkDown documentation for the extracted API leveraging TypeScript type information
and merging JSDoc style documentation comments.

The following JSDoc tags are supported:

   `@publicbody` Applied to a class method or function. Adds the function body to the documentation with embedded comments removed.

   `@private` Applied to an exported or publicly accessible member keeps it out of documentation.

```ts
export class Ts2Md {
    filePath: string;
    fileName: string;
    markDown?: string;
    outputPath?: string;
    constructor(public options: Ts2MdOptions) 
    run(): void 
    headingLevelMd(relativeLevel: number): string 
    parseSourceFiles(program: ts.Program): ts.SourceFile[] 
    extractDocs(sourceFiles: ts.SourceFile[]): DocBase<ts.Node>[] 
    generateMarkDown(docs: DocBase<ts.Node>[]): string 
    generateDocItemLinksTable(doc: DocBase<ts.Node>): string 
    writeMarkDownToOuput(markDown: string, outputFilename: string): string 
    readmeMerge(markDown: string) 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
### Functions

| |
| --- |
| [mdMerge](#function-mdmerge) |
| [ts2md](#function-ts2md) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---

#### Function: mdMerge

```ts
export function mdMerge(md: string) 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
#### Function: ts2md

```ts
export function ts2md(options?: Ts2MdOptions): void 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
<!--#endregion ts2md-api-merged-here-->

## License

The license for the code in this repository is the Open BSV License.
