# API

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

## Interfaces

### Interface: ProvenTxFromTxidResultApi

```ts
export interface ProvenTxFromTxidResultApi {
    proven?: ProvenTx;
    req: ProvenTxReq;
    getRawResult?: GetRawTxResultApi;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
## Classes

| | |
| --- | --- |
| [DojoAlias](#class-dojoalias) | [DojoOutputTagMap](#class-dojooutputtagmap) |
| [DojoBasket](#class-dojobasket) | [DojoSyncState](#class-dojosyncstate) |
| [DojoCertificate](#class-dojocertificate) | [DojoTransaction](#class-dojotransaction) |
| [DojoCertificateField](#class-dojocertificatefield) | [DojoTxLabel](#class-dojotxlabel) |
| [DojoCommission](#class-dojocommission) | [DojoTxLabelMap](#class-dojotxlabelmap) |
| [DojoEntityBase](#class-dojoentitybase) | [DojoUser](#class-dojouser) |
| [DojoMapiResponse](#class-dojomapiresponse) | [ProvenTx](#class-proventx) |
| [DojoOutput](#class-dojooutput) | [ProvenTxReq](#class-proventxreq) |
| [DojoOutputTag](#class-dojooutputtag) |  |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---

### Class: DojoEntityBase

```ts
export abstract class DojoEntityBase<T> {
    api: T;
    constructor(api: T) 
    abstract get id(): number;
    abstract get entityName(): string;
    abstract get entityTable(): string;
    abstract updateApi(): void;
    abstract equals(ei: T, syncMap?: DojoSyncMapApi): boolean;
    abstract mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void>;
    abstract mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: T, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean>;
    toApi(): T 
}
```

<details>

<summary>Class DojoEntityBase Details</summary>

#### Method equals

Tests for equality or 'merge' / 'convergent' equality if syncMap is provided.

'convergent' equality must satisfy (A sync B) equals (B sync A)

```ts
abstract equals(ei: T, syncMap?: DojoSyncMapApi): boolean
```

#### Method mergeExisting

Perform a 'merge' / 'convergent' equality migration of state
from external `ei` to this existing local entity.

```ts
abstract mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: T, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean>
```

Returns

true iff entity state changed and was updated to storage

#### Method mergeNew

Perform a 'merge' / 'convergent' equality migration of state
to this new local entity which was constructed
as a copy of the external object.

```ts
abstract mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void>
```

Argument Details

+ **userId**
  + local userId

#### Method toApi

An entity may decode properties of the underlying Api object on construction.

The `toApi` method forces an `updateApi` before returning the underlying,
now updated, Api object.

```ts
toApi(): T 
```

Returns

The underlying Api object with any entity decoded properties updated.

#### Method updateApi

On construction, an entity may decode properties of the `api` object,
such as JSON stringified objects.

The `updateApi` method must re-encode the current state of those decoded properties
into the `api` object.

Used by the `toApi` method to return an updated `api` object.

```ts
abstract updateApi(): void
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: ProvenTx

```ts
export class ProvenTx extends DojoEntityBase<DojoProvenTxApi> {
    constructor(api?: DojoProvenTxApi) 
    override updateApi(): void 
    get nodeStrings() 
    get proofString() 
    get provenTxIdv() 
    get provenTxId() 
    set provenTxId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get txid() 
    set txid(v: string) 
    get height() 
    set height(v: number) 
    get index() 
    set index(v: number) 
    get nodes() 
    set nodes(v: Buffer) 
    get rawTx() 
    set rawTx(v: Buffer) 
    get blockHash() 
    set blockHash(v: Buffer) 
    get merkleRoot() 
    set merkleRoot(v: Buffer) 
    override get id() 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoProvenTxApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoProvenTxApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: ProvenTx;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoProvenTxApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
    toEnvelope(): EnvelopeApi 
    static async fromTxid(txid: string | Buffer, chaintracks: ChaintracksClientApi, services: CwiExternalServices, rawTx?: string | Buffer): Promise<ProvenTxFromTxidResultApi> 
    static getProofAttemptsLimit = 8;
    static getProofMinutes = 60;
    static async fromReq(req: ProvenTxReq, gmpResult: GetMerkleProofResultApi, chaintracks: ChaintracksClientApi): Promise<ProvenTx | undefined> 
    static toEnvelope(api: DojoProvenTxApi): EnvelopeApi 
    static proofObject(api: DojoProvenTxApi): TscMerkleProofApi 
    static proofString(api: DojoProvenTxApi) 
}
```

<details>

<summary>Class ProvenTx Details</summary>

#### Property getProofAttemptsLimit

How high attempts can go before status is forced to invalid

```ts
static getProofAttemptsLimit = 8
```

#### Property getProofMinutes

How many hours we have to try for a poof

```ts
static getProofMinutes = 60
```

#### Method fromReq

Try to create a new ProvenTx from a ProvenTxReq and GetMerkleProofResultApi

If a valid proof can be confirmed by chaintracks, it succeeds.

Otherwise it returns undefined and updates req.status to either 'unknown', 'invalid', or 'unconfirmed'

```ts
static async fromReq(req: ProvenTxReq, gmpResult: GetMerkleProofResultApi, chaintracks: ChaintracksClientApi): Promise<ProvenTx | undefined> 
```

#### Method fromTxid

Given a txid and optionally its rawTx, create a new ProvenTx object.

rawTx is fetched if not provided.

Only succeeds (proven is not undefined) if a proof is confirmed for rawTx,
and hash of rawTx is confirmed to match txid

The returned ProvenTx and ProvenTxReq objects have not been added to the dojo database,
this is optional and can be done by the caller if appropriate.

```ts
static async fromTxid(txid: string | Buffer, chaintracks: ChaintracksClientApi, services: CwiExternalServices, rawTx?: string | Buffer): Promise<ProvenTxFromTxidResultApi> 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoBasket

```ts
export class DojoBasket extends DojoEntityBase<DojoOutputBasketApi> {
    constructor(api?: DojoOutputBasketApi) 
    get basketIdv() 
    get basketId() 
    set basketId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get userId() 
    set userId(v: number) 
    get name() 
    set name(v: string) 
    get numberOfDesiredUTXOs() 
    set numberOfDesiredUTXOs(v: number) 
    get minimumDesiredUTXOValue() 
    set minimumDesiredUTXOValue(v: number) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    override get id() 
    override get entityName(): string 
    override get entityTable(): string 
    override updateApi(): void 
    override equals(ei: DojoOutputBasketApi, syncMap?: DojoSyncMapApi): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoOutputBasketApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoBasket;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoOutputBasketApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: ProvenTxReq

```ts
export class ProvenTxReq extends DojoEntityBase<DojoProvenTxReqApi> {
    static async fromStorageTxid(storage: DojoStorageApi, txid: string, userId: number, trx?: TrxToken): Promise<ProvenTxReq | undefined> 
    static async fromStorageId(storage: DojoStorageApi, id: number, trx?: TrxToken): Promise<ProvenTxReq> 
    static fromTxid(txid: string | Buffer, rawTx?: string | Buffer): ProvenTxReq 
    static fromTransaction(transaction: DojoTransactionApi): ProvenTxReq 
    history: DojoProvenTxReqHistoryApi;
    notify: DojoProvenTxReqNotifyApi;
    get apiHistory() 
    set apiHistory(v: string) 
    get apiNotify() 
    set apiNotify(v: string) 
    updateApi(): void 
    unpackApi(): void 
    async refreshFromStorage(storage: DojoStorageApi): Promise<void> 
    constructor(api?: DojoProvenTxReqApi) 
    historySince(since: Date): DojoProvenTxReqHistoryApi 
    historyPretty(since?: Date, indent = 0) 
    addNotifyTransactionId(id: number) 
    addHistoryNote<T extends {
        what: string;
    }>(note: string | T, when?: Date) 
    async updateStorage(storage: DojoStorageApi, trx?: TrxToken) 
    get status() 
    set status(v: DojoProvenTxReqStatusApi) 
    get provenTxReqIdv() 
    get provenTxReqId() 
    set provenTxReqId(v: number | undefined) 
    get userId() 
    set userId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get txid() 
    set txid(v: string) 
    get callbackID() 
    set callbackID(v: string | undefined) 
    get rawTx() 
    set rawTx(v: Buffer | undefined) 
    get attempts() 
    set attempts(v: number) 
    get provenTxId() 
    set provenTxId(v: number | undefined) 
    get notified() 
    set notified(v: boolean) 
    override get id() 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoProvenTxReqApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoProvenTxReqApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: ProvenTxReq;
        eiId: number;
    }> 
    mapNotifyTransactionIds(syncMap: DojoSyncMapApi): void 
    mergeNotifyTransactionIds(ei: DojoProvenTxReqApi, syncMap: DojoSyncMapApi): void 
    mergeHistory(ei: DojoProvenTxReqApi, syncMap: DojoSyncMapApi): void 
    static isTerminalStatus(status: DojoProvenTxReqStatusApi): boolean 
    localStatusIsPreferred(ei: DojoProvenTxReqApi): boolean 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoProvenTxReqApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
    async insertUnique(storage: DojoStorageApi, trx?: TrxToken): Promise<void> 
    static async fromPostRawResults(storage: DojoStorageBase, id: number, rs: PostRawTxResultApi[], callback: boolean, insertMapiResponse: (r: PostRawTxResultApi, trx: TrxToken) => Promise<void>): Promise<ProvenTxReq> 
    async processNewProven(dojo: DojoBase, proven: ProvenTx, trx?: TrxToken): Promise<ProvenTx> 
    async processNotifications(dojo: DojoBase, proven?: ProvenTx, trx?: TrxToken, indent = 0): Promise<string> 
}
```

<details>

<summary>Class ProvenTxReq Details</summary>

#### Method equals

'convergent' equality must satisfy (A sync B) equals (B sync A)

```ts
override equals(ei: DojoProvenTxReqApi, syncMap?: DojoSyncMapApi | undefined): boolean 
```

#### Method historySince

Returns history to only what followed since date.

```ts
historySince(since: Date): DojoProvenTxReqHistoryApi 
```

#### Method localStatusIsPreferred

Returns true iff the local `status` is preferred over the incoming
`ei.status`

```ts
localStatusIsPreferred(ei: DojoProvenTxReqApi): boolean 
```

#### Method mergeExisting

When merging `ProvenTxReq`, care is taken to avoid short-cirtuiting notification: `status` must not transition to `completed` without
passing through `notifying`. Thus a full convergent merge passes through these sequence steps:
1. Remote dojo completes before local dojo.
2. The remotely completed req and ProvenTx sync to local dojo.
3. The local dojo transitions to `notifying`, after merging the remote attempts and history.
4. The local dojo notifies, transitioning to `completed`.
5. Having been updated, the local req, but not ProvenTx sync to remote dojo, but do not merge because the earlier `completed` wins.
6. Convergent equality is achieved (completing work - history and attempts are equal)

On terminal failure: `doubleSpend` trumps `invalid` as it contains more data.

```ts
override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoProvenTxReqApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
```

#### Method processNotifications

Once a `ProvenTxReq` reaches a terminal state, notify all interested parties of success or failure.

```ts
async processNotifications(dojo: DojoBase, proven?: ProvenTx, trx?: TrxToken, indent = 0): Promise<string> 
```

#### Method updateStorage

Updates database record with current state of this entity.

```ts
async updateStorage(storage: DojoStorageApi, trx?: TrxToken) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoAlias

```ts
export class DojoAlias extends DojoEntityBase<DojoAliasApi> {
    constructor(api?: DojoAliasApi) 
    override updateApi(): void 
    get aliasIdv() 
    get aliasId() 
    set aliasId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get alias() 
    set alias(v: string) 
    get domain() 
    set domain(v: string) 
    get avatarName() 
    set avatarName(v: string | undefined) 
    get avatarPhotoURL() 
    set avatarPhotoURL(v: string | undefined) 
    get reservationCompleted() 
    set reservationCompleted(v: boolean) 
    get userId() 
    set userId(v: number) 
    get destinationBasketId() 
    set destinationBasketId(v: number) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoAliasApi, syncMap?: DojoSyncMapApi): boolean 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoAliasApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoCertificate

```ts
export class DojoCertificate extends DojoEntityBase<DojoCertificateApi> {
    constructor(api?: DojoCertificateApi) 
    override updateApi(): void 
    get certificateIdv() 
    get certificateId() 
    set certificateId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get userId() 
    set userId(v: number) 
    get type() 
    set type(v: string) 
    get subject() 
    set subject(v: string) 
    get validationKey() 
    set validationKey(v: string) 
    get serialNumber() 
    set serialNumber(v: string) 
    get certifier() 
    set certifier(v: string) 
    get revocationOutpoint() 
    set revocationOutpoint(v: string) 
    get signature() 
    set signature(v: string) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    get fields() 
    set fields(v: Record<string, string> | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoCertificateApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoCertificateApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoCertificate;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoCertificateApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoCertificateField

```ts
export class DojoCertificateField extends DojoEntityBase<DojoCertificateFieldApi> {
    constructor(api?: DojoCertificateFieldApi) 
    override updateApi(): void 
    get userId() 
    set userId(v: number) 
    get certificateId() 
    set certificateId(v: number) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get fieldName() 
    set fieldName(v: string) 
    get fieldValue() 
    set fieldValue(v: string) 
    get masterKey() 
    set masterKey(v: string) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoCertificateFieldApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoCertificateFieldApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoCertificateField;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoCertificateFieldApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoCommission

```ts
export class DojoCommission extends DojoEntityBase<DojoCommissionApi> {
    constructor(api?: DojoCommissionApi) 
    override updateApi(): void 
    get commissionIdv() 
    get commissionId() 
    set commissionId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get transactionId() 
    set transactionId(v: number) 
    get userId() 
    set userId(v: number) 
    get isRedeemed() 
    set isRedeemed(v: boolean) 
    get keyOffset() 
    set keyOffset(v: string) 
    get outputScript() 
    set outputScript(v: Buffer | null) 
    get satoshis() 
    set satoshis(v: number) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoCommissionApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoCommissionApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoCommission;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoCommissionApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoMapiResponse

```ts
export class DojoMapiResponse extends DojoEntityBase<DojoMapiResponseApi> {
    constructor(api?: DojoMapiResponseApi) 
    override updateApi(): void 
    get responseIdv() 
    get responseId() 
    set responseId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get transactionId() 
    set transactionId(v: number) 
    get userId() 
    set userId(v: number) 
    get callbackID() 
    set callbackID(v: string | undefined) 
    get payload() 
    set payload(v: string | undefined) 
    get publicKey() 
    set publicKey(v: string | undefined) 
    get signature() 
    set signature(v: string | undefined) 
    get doubleSpendResponse() 
    set doubleSpendResponse(v: string | undefined | null) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoMapiResponseApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoMapiResponseApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoMapiResponse;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoMapiResponseApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoOutput

```ts
export class DojoOutput extends DojoEntityBase<DojoOutputApi> {
    constructor(api?: DojoOutputApi) 
    override updateApi(): void 
    get outputIdv() 
    get outputId() 
    set outputId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get userId() 
    set userId(v: number) 
    get transactionId() 
    set transactionId(v: number) 
    get basketId() 
    set basketId(v: number | null | undefined) 
    get spentBy() 
    set spentBy(v: number | null) 
    get vout() 
    set vout(v: number | null) 
    get amount() 
    set amount(v: number | null) 
    get spendable() 
    set spendable(v: boolean) 
    get change() 
    set change(v: boolean) 
    get tracked() 
    set tracked(v: boolean | null) 
    get txid() 
    set txid(v: string | null) 
    get type() 
    set type(v: string) 
    get providedBy() 
    set providedBy(v: string | null) 
    get purpose() 
    set purpose(v: string | null) 
    get description() 
    set description(v: string | null) 
    get spendingDescription() 
    set spendingDescription(v: string | null) 
    get derivationPrefix() 
    set derivationPrefix(v: string | null) 
    get derivationSuffix() 
    set derivationSuffix(v: string | null) 
    get paymailHandle() 
    set paymailHandle(v: string | null) 
    get senderIdentityKey() 
    set senderIdentityKey(v: string | null) 
    get customInstructions() 
    set customInstructions(v: string | null) 
    get outputScript() 
    set outputScript(v: Buffer | null) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoOutputApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoOutputApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoOutput;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoOutputApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoOutputTag

```ts
export class DojoOutputTag extends DojoEntityBase<DojoOutputTagApi> {
    constructor(api?: DojoOutputTagApi) 
    override updateApi(): void 
    get outputTagIdv() 
    get outputTagId() 
    set outputTagId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get tag() 
    set tag(v: string) 
    get userId() 
    set userId(v: number) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoOutputTagApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoOutputTagApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoOutputTag;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoOutputTagApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoOutputTagMap

```ts
export class DojoOutputTagMap extends DojoEntityBase<DojoOutputTagMapApi> {
    constructor(api?: DojoOutputTagMapApi) 
    override updateApi(): void 
    get outputTagId() 
    set outputTagId(v: number) 
    get outputId() 
    set outputId(v: number) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoOutputTagMapApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoOutputTagMapApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoOutputTagMap;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoOutputTagMapApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoSyncState

```ts
export class DojoSyncState extends DojoEntityBase<DojoSyncStateApi> {
    constructor(api?: DojoSyncStateApi) 
    async insert(storage: DojoStorageApi, trx?: TrxToken) 
    async update(storage: DojoStorageApi, notSyncMap?: boolean, trx?: TrxToken) 
    override updateApi(notSyncMap?: boolean): void 
    get syncStateIdv() 
    get syncStateId() 
    set syncStateId(v: number | undefined) 
    set created_at(v: Date | null | undefined) 
    get created_at() 
    set updated_at(v: Date | null | undefined) 
    get updated_at() 
    set userId(v: number) 
    get userId() 
    set dojoIdentityKey(v: string) 
    get dojoIdentityKey() 
    set dojoName(v: string | null | undefined) 
    get dojoName() 
    set init(v: boolean) 
    get init() 
    set refNum(v: string) 
    get refNum() 
    set status(v: DojoSyncStatus) 
    get status(): DojoSyncStatus 
    set when(v: Date | null | undefined) 
    get when() 
    set total(v: number | null | undefined) 
    get total() 
    mergeSyncMap(iSyncMap: DojoSyncMapApi) 
    errorLocal: DojoSyncErrorApi | undefined;
    errorOther: DojoSyncErrorApi | undefined;
    syncMap: DojoSyncMapApi;
    get apiErrorLocal() 
    get apiErrorOther() 
    get apiSyncMap() 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoSyncStateApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoSyncStateApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

<details>

<summary>Class DojoSyncState Details</summary>

#### Method mergeSyncMap

Merge additions to the syncMap

```ts
mergeSyncMap(iSyncMap: DojoSyncMapApi) 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoTransaction

```ts
export class DojoTransaction extends DojoEntityBase<DojoTransactionApi> {
    constructor(api?: DojoTransactionApi) 
    override updateApi(): void 
    get transactionIdv() 
    get transactionId() 
    set transactionId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get isOutgoing() 
    set isOutgoing(v: boolean) 
    get status() 
    set status(v: DojoTransactionStatusApi) 
    get userId() 
    set userId(v: number) 
    get provenTxId() 
    set provenTxId(v: number | null | undefined) 
    get amount() 
    set amount(v: number) 
    get unconfirmedInputChainLength() 
    set unconfirmedInputChainLength(v: number) 
    get txid() 
    set txid(v: string) 
    get referenceNumber() 
    set referenceNumber(v: string | null) 
    get proof() 
    set proof(v: string | null) 
    get truncatedExternalInputs() 
    set truncatedExternalInputs(v: string | null) 
    get senderPaymail() 
    set senderPaymail(v: string | null) 
    get recipientPaymail() 
    set recipientPaymail(v: string | null) 
    get note() 
    set note(v: string | null) 
    get rawTransaction() 
    set rawTransaction(v: Buffer | null) 
    get labels() 
    set labels(v: string[] | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoTransactionApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoTransactionApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoTransaction;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoTransactionApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
    async getProvenTx(storage: DojoStorageApi, trx?: TrxToken): Promise<ProvenTx | undefined> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoTxLabel

```ts
export class DojoTxLabel extends DojoEntityBase<DojoTxLabelApi> {
    constructor(api?: DojoTxLabelApi) 
    override updateApi(): void 
    get txLabelIdv() 
    get txLabelId() 
    set txLabelId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get label() 
    set label(v: string) 
    get userId() 
    set userId(v: number) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoTxLabelApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoTxLabelApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoTxLabel;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoTxLabelApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoTxLabelMap

```ts
export class DojoTxLabelMap extends DojoEntityBase<DojoTxLabelMapApi> {
    constructor(api?: DojoTxLabelMapApi) 
    override updateApi(): void 
    get txLabelId() 
    set txLabelId(v: number) 
    get transactionId() 
    set transactionId(v: number) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get isDeleted() 
    set isDeleted(v: boolean | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoTxLabelMapApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    static async mergeFind(storage: DojoStorageApi, userId: number, ei: DojoTxLabelMapApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<{
        found: boolean;
        eo: DojoTxLabelMap;
        eiId: number;
    }> 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoTxLabelMapApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
### Class: DojoUser

```ts
export class DojoUser extends DojoEntityBase<DojoUserApi> {
    constructor(api?: DojoUserApi) 
    override updateApi(): void 
    get userIdv() 
    get userId() 
    set userId(v: number | undefined) 
    get created_at() 
    set created_at(v: Date | null | undefined) 
    get updated_at() 
    set updated_at(v: Date | null | undefined) 
    get identityKey() 
    set identityKey(v: string) 
    get timeSpentProcessingRequests() 
    set timeSpentProcessingRequests(v: number | undefined) 
    get bandwidthUsed() 
    set bandwidthUsed(v: number | undefined) 
    get storageSpaceUsedByHostedData() 
    set storageSpaceUsedByHostedData(v: number | undefined) 
    override get id(): number 
    override get entityName(): string 
    override get entityTable(): string 
    override equals(ei: DojoUserApi, syncMap?: DojoSyncMapApi | undefined): boolean 
    override async mergeNew(storage: DojoStorageApi, userId: number, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<void> 
    override async mergeExisting(storage: DojoStorageApi, since: Date | undefined, ei: DojoUserApi, syncMap: DojoSyncMapApi, trx: TrxToken): Promise<boolean> 
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types), [Enums](#enums)

---
## Functions

## Types

## Enums

