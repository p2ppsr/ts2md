/**
 * Code blocks are great for examples
 *
 * ```ts
 * /**
 *  * Here's an example of a documentation code block with its own comment.
 *  *\/
 * const instance = new MyClass();
 * ```
 */
export class MyClass {
    /** 
     * You can escape jsdoc tags:  \@param foo This is not a real param.
     * 
     * But this is real: @param bar a pretend real param.
     * 
     * @throws ERR_INTERNAL When it feels like it.
     */
    constructor () { /* */ }
    
    foo(a: number) : string {
        return a + 'fred'
    }
}