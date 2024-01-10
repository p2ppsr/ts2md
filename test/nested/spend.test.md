# API

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

## Interfaces

| |
| --- |
| [BigNumber](#interface-bignumber) |
| [LockingScript](#interface-lockingscript) |
| [UnlockingScript](#interface-unlockingscript) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

---

### Interface: BigNumber

```ts
export interface BigNumber {
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

---
### Interface: LockingScript

```ts
export interface LockingScript {
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

---
### Interface: UnlockingScript

```ts
export interface UnlockingScript {
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

---
## Classes

### Class: Spend

The Spend class represents a spend action within a Bitcoin SV transaction.
It encapsulates all the necessary data required for spending a UTXO (Unspent Transaction Output)
and includes details about the source transaction, output, and the spending transaction itself.

```ts
export default class Spend {
    sourceTXID: string;
    sourceOutputIndex: number;
    sourceSatoshis: BigNumber;
    lockingScript: LockingScript;
    transactionVersion: number;
    otherInputs: Array<{
        txid: string;
        outputIndex: number;
        sequence: number;
    }>;
    outputs: Array<{
        satoshis: BigNumber;
        script: LockingScript;
    }>;
    inputIndex: number;
    unlockingScript: UnlockingScript;
    inputSequence: number;
    constructor(params: {
        sourceTXID: string;
        sourceOutputIndex: number;
        sourceSatoshis: BigNumber;
        lockingScript: LockingScript;
        transactionVersion: number;
        otherInputs: Array<{
            txid: string;
            outputIndex: number;
            sequence: number;
        }>;
        outputs: Array<{
            satoshis: BigNumber;
            script: LockingScript;
        }>;
        inputIndex: number;
        unlockingScript: UnlockingScript;
        inputSequence: number;
    }) 
    validate(): boolean 
}
```

<details>

<summary>Class Spend Details</summary>

#### Constructor

```ts
constructor(params: {
    sourceTXID: string;
    sourceOutputIndex: number;
    sourceSatoshis: BigNumber;
    lockingScript: LockingScript;
    transactionVersion: number;
    otherInputs: Array<{
        txid: string;
        outputIndex: number;
        sequence: number;
    }>;
    outputs: Array<{
        satoshis: BigNumber;
        script: LockingScript;
    }>;
    inputIndex: number;
    unlockingScript: UnlockingScript;
    inputSequence: number;
}) 
```

Argument Details

+ **sourceTXID**
  + The transaction ID of the source UTXO.
+ **sourceOutputIndex**
  + The index of the output in the source transaction.
+ **sourceSatoshis**
  + The amount of satoshis in the source UTXO.
+ **lockingScript**
  + The locking script associated with the UTXO.
+ **transactionVersion**
  + The version of the current transaction.
+ **otherInputs**
  + -
An array of other inputs in the transaction.
+ **outputs**
  + -
The outputs of the current transaction.
+ **inputIndex**
  + The index of this input in the current transaction.
+ **unlockingScript**
  + The unlocking script for this spend.
+ **inputSequence**
  + The sequence number of this input.

Example

```ts
const spend = new Spend(
  "abcd1234", // sourceTXID
  0, // sourceOutputIndex
  new BigNumber(1000), // sourceSatoshis
  LockingScript.fromASM("OP_DUP OP_HASH160 abcd1234... OP_EQUALVERIFY OP_CHECKSIG"),
  2, // transactionVersion
  [{ txid: "abcd1234", outputIndex: 1, sequence: 0xffffffff }], // otherInputs
  [{ satoshis: new BigNumber(500), script: LockingScript.fromASM("OP_DUP...") }], // outputs
  0, // inputIndex
  UnlockingScript.fromASM("3045... 02ab..."),
  0xffffffff // inputSequence
);
```

#### Method validate

```ts
validate(): boolean 
```

Returns

Returns true if the scripts are valid and the spend is legitimate, otherwise false.

Example

```ts
if (spend.validate()) {
  console.log("Spend is valid!");
} else {
  console.log("Invalid spend!");
}
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes)

---
