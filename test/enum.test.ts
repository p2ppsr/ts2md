/**
 * Used to specify what to validate during dojo database validation.
 * 
 * @example
 * Test for individual flags with syntax such as the following:
 * ```ts
 * if ((what & DojoValidateWhat.ForeignKeys) === DojoValidateWhat.ForeignKeys) { }
 * ```
 * or using `bitsAreSet` defined in cwi-base:
 * ```ts
 * if (bitsAreSet(what, DojoValidateWhat.ForeignKeys))
 * ```
 */
export enum DojoValidateWhat {
    /**
     * Validate nothing.
     */
    None = 0,
    /**
     * Validate foreign keys in all tables.
     * 
     * Catches errors when databases such as sqlite are misconfigured to not enforce foreign key constraints.
     */
    ForeignKeys = (1 << 0),
    /**
     * If set and `userData` is provided, verifies only that this dojo contains the user data in `userData`.
     *
     * If not set and `userData` is valid, verifies this dojo contains all and only the user data in `userData`.
     */
    ContainsUserData = (1 << 1),
    /**
     * Validate everything.
     */
    All = ~(~0 << 31)
}
