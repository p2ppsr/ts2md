# ts2md

Simple Typescript Documentation in `README.md` Generator

The focus of this generator is single output file, low effort, low maintenance, high accuracy API documentation generation.

Many JSDoc tags are ignored as not relevant to this objective. Some custom tags have been added.

For a full featured, fine grain typescript documentation generator see [TypeDoc](https://typedoc.org/)

## Supported JSDoc Tags

The following JSDoc tags are supported:

| Tag | Description |
|---|---|
| @example | Adds example as code block or comments and embedded code block(s). |
| @param | Adds comment for function or method parameter. |
| @private | Hides an otherwise accessible documentation item. |
| @privateinitializer | Hides property initializer from documentation typescript. |
| @property | Adds comment for class or interface property parameter in parent's JSDoc comment. |
| @publicbody | Overrides the normal hidding of method and function bodies. |
| @returns | Adds comment for function or method return value. |
| @throws | Adds thrown error comment to function or method. |

## Installation

```bash
npm i -D ts2md
```

## Setup

After installation, use the following command to run markdown generation:

```bash
npx ts2md
```

Which will also remind you to add merge anchors in your `README.md` file:

```md
  <!--#region ts2md-api-merged-here-->
  <!--#endregion ts2md-api-merged-here-->
```

The anchors must not be indented where you wish to merge the generated documentation.

You may also want to add a script to `package.json` as a reminder and to support
automatically updating documentation before publishing your package:

```json
  "scripts": {
    "build:readme": "npx ts2md",
    "prepublish": "npm run build && npx ts2md",
  }
```
## API

<!--#region ts2md-api-merged-here-->
Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

### Interfaces

#### Interface: Ts2MdOptions

Options for the `Ts2Md` class which generates Typescript documentation.

```ts
export interface Ts2MdOptions {
    inputFilename: string;
    firstHeadingLevel: 1 | 2 | 3;
    noTitle: boolean;
    outputFilename?: string;
    outputReplace: boolean;
    readmeMerge: boolean;
    nothingPrivate?: boolean;
}
```

<details>

<summary>Interface Ts2MdOptions Details</summary>

##### Property firstHeadingLevel

The heading level for the first generated heading.

```ts
firstHeadingLevel: 1 | 2 | 3
```

##### Property inputFilename

Primary typescript source file, default is `./src/index.ts`

```ts
inputFilename: string
```

##### Property noTitle

Set to true if generated markdown will be merged into
a file that already includes a containing header.

```ts
noTitle: boolean
```

##### Property nothingPrivate

If true, overrides private typescript keywords and jsdoc tags.

CAUTION: This setting is inappropriate for published documentation ;-)

```ts
nothingPrivate?: boolean
```

##### Property outputFilename

If valid, a copy of the generated markdown documentation will be
saved to this file.

```ts
outputFilename?: string
```

##### Property outputReplace

Set to true to attempt to delete an existing output file before
writing new output.

```ts
outputReplace: boolean
```

##### Property readmeMerge

Set to true if the generated output should be merged into README.md

Currently README.md must exist at `./README.md`

and must contain the following merge start and merge end anchors:

   `<!--#region ts2md-api-merged-here-->`

   `<!--#endregion ts2md-api-merged-here-->`
   
The anchors must not be indented.

```ts
readmeMerge: boolean
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
### Classes

#### Class: Ts2Md

Uses the Typescript compiler to parse source tree given a top level source file such as `index.ts`.

Extract the exported API interfaces, classes, types, functions and variables.

Generate GitHub friendly MarkDown documentation for the extracted API leveraging TypeScript type information
and merging JSDoc style documentation comments.

The following JSDoc tags are supported:

   `@publicbody` Applied to a class method or function. Adds the function body to the documentation with embedded comments removed.

   `@private` Applied to an exported or publicly accessible member keeps it out of documentation.

   `@privateinitializer` Applied to a class property with an initializer will prevent the initializer from appearing in the documentation.

```ts
export class Ts2Md implements DocGenSupportApi {
    filePath: string;
    fileName: string;
    markDown?: string;
    outputPath?: string;
    constructor(public options: Ts2MdOptions) 
    run(): void 
}
```

<details>

<summary>Class Ts2Md Details</summary>

##### Constructor

Construct a new instance configured for `run` method to be called next.

```ts
constructor(public options: Ts2MdOptions) 
```

Argument Details

+ **options**
  + Must be provided. inputFilename defaults to `./src/index.ts`

##### Property fileName

The top level input Typescript file's filename without path

```ts
fileName: string
```

##### Property filePath

The top level input Typescript file's filename with full path.

```ts
filePath: string
```

##### Property markDown

The generated documentation as markdown string

```ts
markDown?: string
```

##### Property outputPath

The file path to which `markDown` was written.

```ts
outputPath?: string
```

##### Method run

Generates the documentation markdown and write's it to output file
and/or merges it to README.md

```ts
run(): void 
```

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

Quick and dirty README.md merge function.

The anchors must not be indented and must exactly match:

   `<!--#region ts2md-api-merged-here-->`

   `<!--#endregion ts2md-api-merged-here-->`

```ts
export function mdMerge(md: string) 
```

<details>

<summary>Function mdMerge Details</summary>

Argument Details

+ **md**
  + The markdown to insert between the start and end anchors.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---
#### Function: ts2md

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
        outputFilename: "",
        firstHeadingLevel: 2,
        noTitle: true,
        outputReplace: true,
        readmeMerge: true,
    };
    new Ts2Md(options).run();
}
```

<details>

<summary>Function ts2md Details</summary>

Argument Details

+ **options**
  + Optional options to control markdown generation.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions)

---

<!--#endregion ts2md-api-merged-here-->

## License

The license for the code in this repository is the Open BSV License.
