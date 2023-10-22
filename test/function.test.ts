class CwiError {
    constructor(public code: string, public description: string, public stack: string) {}
}

interface DojoSyncErrorApi { code: string, description: string, stack: string }

export function toDojoSyncError(e: CwiError): DojoSyncErrorApi { return { code: e.code, description: e.description, stack: e.stack ?? '' } }
