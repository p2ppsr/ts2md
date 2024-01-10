export namespace fred {
    export interface Params {
        a: string
    }

    export interface Result {
        a: string
    }
}

export function fred(params: fred.Params) : fred.Result {
    return { a: params.a }
}