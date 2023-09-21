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

###### inputFilename

Primary typescript source file, default is `./src/index.ts`

###### firstHeadingLevel

The heading level for the first generated heading.

###### noTitle

Set to true if generated markdown will be merged into
a file that already includes a containing header.

###### outputFilename

If valid, a copy of the generated markdown documentation will be
saved to this file.

###### outputReplace

Set to true to attempt to delete an existing output file before
writing new output.

###### readmeMerge

Set to true if the generated output should be merged into README.md

Currently README.md must exist at `./README.md`

and must contain the following merge start and merge end anchors:

   `<!--#region ts2md-api-merged-here-->`

   `<!--#endregion ts2md-api-merged-here-->`
   
The anchors must not be indented.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
### Classes

#### Class: Ts2Md

##### Description

Uses the Typescript compiler to parse source tree given a top level source file such as `index.ts`.

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
}
```

<details>

<summary>Class Ts2Md Member Details</summary>

###### constructor

Construct a new instance configured for `run` method to be called next.

###### fileName

The top level inupt Typescript file's filename without path

###### filePath

The top level inupt Typescript file's filename with full path.

###### markDown

The generated documentation as markdown string

###### outputPath

The file path to which `markDown` was written.

###### run

Generates the documentation markdown and write's it to output file
and/or merges it to README.md

</details>

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

##### Description

Quick and dirty README.md merge function.

The anchors must not be indented and must exactly match:

   `<!--#region ts2md-api-merged-here-->`

   `<!--#endregion ts2md-api-merged-here-->`

```ts
export function mdMerge(md: string) 
```

<details>

<summary>Function mdMerge Argument Details</summary>

###### md

The markdown to insert between the start and end anchors.</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
#### Function: ts2md

##### Description

Generate Typescript documentation and merge into README.md

Attempts to validate options, constructs an instance of Ts2Md with those options, and runs the generation method.

1. Function argument is used if provided.

2. Looks for `./ts2md.json`

3. Default options.

Default options are:

```json
{
  "inputFilename": "./src/index.ts",
  "outputFilename": "./apiDoc.md",
  "firstHeadingLevel": 2,
  "noTitle": true,
  "outputReplace": true,
  "readmeMerge": true
}
```

```ts
export function ts2md(options?: Ts2MdOptions): void {
    if (!options) {
        try {
            const configPath = path.resolve("./ts2md.json");
            const json = fs.readFileSync(configPath, { encoding: "utf8" });
            options = <Ts2MdOptions>JSON.parse(json);
        }
        catch { }
    }
    options ||= {
        inputFilename: "./src/index.ts",
        outputFilename: "./apiDoc.md",
        firstHeadingLevel: 2,
        noTitle: true,
        outputReplace: true,
        readmeMerge: true
    };
    new Ts2Md(options).run();
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---

<!--#endregion ts2md-api-merged-here-->

## License

The license for the code in this repository is the Open BSV License.
