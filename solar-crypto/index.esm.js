import { RIPEMD160, Keccak256, Keccak384, Keccak512, SHA256, SHA384, SHA512, SHA3_256, SHA3_384, SHA3_512, Hash256, secp256k1, schnorr } from 'bcrypto';
import { fromSeed, fromPrivateKey } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import deepmerge from 'deepmerge';
import get from 'lodash.get';
import set from 'lodash.set';
import { base58 } from 'bstring';
import moize from 'fast-memoize';
import * as ipAddr from 'ipaddr.js';
import os from 'os';
import wif$2 from 'wif';
import dayjs from 'dayjs';
import assert from 'assert';

class HashAlgorithms {
    static ripemd160(buff) {
        return RIPEMD160.digest(this.bufferise(buff));
    }
    static keccak256(buff) {
        return HashAlgorithms.hash(buff, Keccak256);
    }
    static keccak384(buff) {
        return HashAlgorithms.hash(buff, Keccak384);
    }
    static keccak512(buff) {
        return HashAlgorithms.hash(buff, Keccak512);
    }
    static sha256(buff) {
        return HashAlgorithms.hash(buff, SHA256);
    }
    static sha384(buff) {
        return HashAlgorithms.hash(buff, SHA384);
    }
    static sha512(buff) {
        return HashAlgorithms.hash(buff, SHA512);
    }
    static sha3256(buff) {
        return HashAlgorithms.hash(buff, SHA3_256);
    }
    static sha3384(buff) {
        return HashAlgorithms.hash(buff, SHA3_384);
    }
    static sha3512(buff) {
        return HashAlgorithms.hash(buff, SHA3_512);
    }
    static hash256(buff) {
        return Hash256.digest(this.bufferise(buff));
    }
    static bufferise(buff) {
        return buff instanceof Buffer ? buff : Buffer.from(buff);
    }
    static hash(buff, hasher) {
        if (Array.isArray(buff)) {
            let hasherCtx = hasher.ctx;
            hasherCtx.init();
            for (const element of buff) {
                hasherCtx = hasherCtx.update(element);
            }
            return hasherCtx.final();
        }
        return hasher.digest(this.bufferise(buff));
    }
}

class Hash {
    static signSchnorr(hash, keys, bip340, aux) {
        if (!bip340) {
            return Hash.signSchnorrLegacy(hash, keys);
        }
        return Hash.signSchnorrBip340(hash, keys, aux);
    }
    static verifySchnorr(hash, signature, publicKey, bip340) {
        if (!bip340) {
            return Hash.verifySchnorrLegacy(hash, signature, publicKey);
        }
        return Hash.verifySchnorrBip340(hash, signature, publicKey);
    }
    static signSchnorrLegacy(hash, keys) {
        return secp256k1.schnorrSign(hash, Buffer.from(keys.privateKey, "hex")).toString("hex");
    }
    static verifySchnorrLegacy(hash, signature, publicKey) {
        return secp256k1.schnorrVerify(hash, signature instanceof Buffer ? signature : Buffer.from(signature, "hex"), publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"));
    }
    static signSchnorrBip340(hash, keys, aux) {
        const digest = hash.length !== 32 ? HashAlgorithms.sha256(hash) : hash;
        return schnorr.sign(digest, Buffer.from(keys.privateKey, "hex"), aux).toString("hex");
    }
    static verifySchnorrBip340(hash, signature, publicKey) {
        const digest = hash.length !== 32 ? HashAlgorithms.sha256(hash) : hash;
        let key = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex");
        if (key.length === 33) {
            key = key.slice(1);
        }
        return schnorr.verify(digest, signature instanceof Buffer ? signature : Buffer.from(signature, "hex"), key);
    }
}

class CryptoError extends Error {
    constructor(message) {
        super(message);
        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message,
        });
        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });
        Error.captureStackTrace(this, this.constructor);
    }
}
class NetworkVersionError extends CryptoError {
    constructor(expected, given) {
        super(`Expected version to be ${expected}, but got ${given}`);
    }
}
class NotImplemented extends CryptoError {
    constructor() {
        super(`Feature is not available`);
    }
}
class PrivateKeyLengthError extends CryptoError {
    constructor(expected, given) {
        super(`Expected length to be ${expected}, but got ${given}`);
    }
}
class PublicKeyError extends CryptoError {
    constructor(given) {
        super(`Expected ${given} to be a valid public key`);
    }
}
class AddressNetworkError extends CryptoError {
    constructor(what) {
        super(what);
    }
}
class TransactionTypeError extends CryptoError {
    constructor(given) {
        super(`Type ${given} not supported`);
    }
}
class InvalidTransactionBytesError extends CryptoError {
    constructor(message) {
        super(`Failed to deserialise transaction, encountered invalid bytes: ${message}`);
    }
}
class TransactionSchemaError extends CryptoError {
    constructor(what) {
        super(what);
    }
}
class TransactionVersionError extends CryptoError {
    constructor(given) {
        super(`Version ${given} not supported`);
    }
}
class UnknownTransactionError extends CryptoError {
    constructor(given) {
        super(`Unknown transaction type: ${given}`);
    }
}
class TransactionAlreadyRegisteredError extends CryptoError {
    constructor(name) {
        super(`Transaction type ${name} is already registered`);
    }
}
class TransactionKeyAlreadyRegisteredError extends CryptoError {
    constructor(name) {
        super(`Transaction key ${name} is already registered`);
    }
}
class CoreTransactionTypeGroupImmutableError extends CryptoError {
    constructor() {
        super(`The Core transaction type group is immutable`);
    }
}
class MissingMilestoneFeeError extends CryptoError {
    constructor(name) {
        super(`Missing milestone fee for '${name}'`);
    }
}
class MaximumTransferCountExceededError extends CryptoError {
    constructor(limit) {
        super(`Number of transfers exceeded the allowed maximum of ${limit}`);
    }
}
class MemoLengthExceededError extends CryptoError {
    constructor(limit) {
        super(`Length of memo exceeded the allowed maximum ${limit}`);
    }
}
class MissingTransactionSignatureError extends CryptoError {
    constructor() {
        super(`Expected the transaction to be signed`);
    }
}
class BlockSchemaError extends CryptoError {
    constructor(height, what) {
        super(`Height (${height}): ${what}`);
    }
}
class InvalidMilestoneConfigurationError extends CryptoError {
    constructor(message) {
        super(message);
    }
}
class InvalidMultiSignatureAssetError extends CryptoError {
    constructor() {
        super(`The multisignature asset is invalid`);
    }
}
class DuplicateParticipantInMultiSignatureError extends CryptoError {
    constructor() {
        super(`Invalid multisignature, because duplicate participant found`);
    }
}

var errors = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CryptoError: CryptoError,
    NetworkVersionError: NetworkVersionError,
    NotImplemented: NotImplemented,
    PrivateKeyLengthError: PrivateKeyLengthError,
    PublicKeyError: PublicKeyError,
    AddressNetworkError: AddressNetworkError,
    TransactionTypeError: TransactionTypeError,
    InvalidTransactionBytesError: InvalidTransactionBytesError,
    TransactionSchemaError: TransactionSchemaError,
    TransactionVersionError: TransactionVersionError,
    UnknownTransactionError: UnknownTransactionError,
    TransactionAlreadyRegisteredError: TransactionAlreadyRegisteredError,
    TransactionKeyAlreadyRegisteredError: TransactionKeyAlreadyRegisteredError,
    CoreTransactionTypeGroupImmutableError: CoreTransactionTypeGroupImmutableError,
    MissingMilestoneFeeError: MissingMilestoneFeeError,
    MaximumTransferCountExceededError: MaximumTransferCountExceededError,
    MemoLengthExceededError: MemoLengthExceededError,
    MissingTransactionSignatureError: MissingTransactionSignatureError,
    BlockSchemaError: BlockSchemaError,
    InvalidMilestoneConfigurationError: InvalidMilestoneConfigurationError,
    InvalidMultiSignatureAssetError: InvalidMultiSignatureAssetError,
    DuplicateParticipantInMultiSignatureError: DuplicateParticipantInMultiSignatureError
});

var exceptions$1 = {
	
};

var blockSignature$1 = "381ab7c1ab2baf6d72284e39943e4f2318f20a58edb9471c97101937b180d9e124067aa341a2d1a2c35fd85ad1bfe4de61e27ac8073a06420691308e38ce741f";
var generatorPublicKey$1 = "03cd1eb4404ddbcc37e0a056841444b2099207647826dca70835fe2f219b48ae9c";
var height$1 = 1;
var id$1 = "e492f9d34df01238fda8bac79be19cb77656f444347d076a55811f909eb24e3a";
var numberOfTransactions$1 = 107;
var payloadHash$1 = "16db20c30c52d53638ca537ad0ed113408da3ae686e2c4bfa7e315d4347196dc";
var payloadLength$1 = 15496;
var previousBlock$1 = "0000000000000000000000000000000000000000000000000000000000000000";
var reward$1 = "0";
var timestamp$1 = 0;
var totalAmount$1 = "52073757600000000";
var totalFee$1 = "0";
var transactions$1 = [
	{
		amount: "52073757600000000",
		expiration: 0,
		fee: "0",
		id: "2b290b5c805517e701d4fcde43ab4cf4a27acfaed6beeb1e3481fa6464287dc7",
		network: 63,
		nonce: "1",
		recipientId: "SP77TpbBYC2nCpaCg3u1BBsYU7zqwqzGo7",
		senderPublicKey: "03cd1eb4404ddbcc37e0a056841444b2099207647826dca70835fe2f219b48ae9c",
		signature: "5fc1cc917f117e5880c190e74b85746ee93ca8b1c23433fd65c274c6f3bbe81e058aa41d4a0cea2cecc5864938f3473bedf00af300cb1bad28cd0ebcaae0edfa",
		type: 0,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "gym"
			}
		},
		fee: "0",
		id: "083f81f2b52d918d1fce0eade7a78cee5a30e493bfa3a188fb582404fe7da589",
		network: 63,
		nonce: "1",
		senderPublicKey: "022bcee076006120b24f145d495686d2afc880079daf2eb20d8be9bf0e434ca3e1",
		signature: "84b3b05934ce04a4096e67dd5c2af8ba74c2a4bbb1c2de3db00002a858df22a2e78055b573a52909b6198e8209a0e82e23d92a403eb4898caf52ccf50c9f9c10",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cactus1549"
			}
		},
		fee: "0",
		id: "2c9173aa0322949aaafe5c0732780958d6c70e4e8f2ece740f8be61015ee29eb",
		network: 63,
		nonce: "1",
		senderPublicKey: "03d39fb4797d0c428bebed6d80203e2273a9fdbcaafe0b29761ef3183c2151e211",
		signature: "52386e83c4073dab403063f6a324a2fa389ef50951c9c1dc03e0c3800b9d49290b807eee6f066c5349283428b028a6a822c4d1a3aeadcb2e245570c086dc980e",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "palestra"
			}
		},
		fee: "0",
		id: "95cedd3bed3d456c5f7c2ab49c51e0723c962e5f407f11385467f87a7913322e",
		network: 63,
		nonce: "1",
		senderPublicKey: "03a1ce3c6ec5a5ce8b05d25b804817a6ef4a202d3ad5ee8aac1ae0ed22c0c64c18",
		signature: "204206aa787f6ad88428032522067a0449a9fe49028fc9c492d6738b2217059f1d32c92d58bcf0c3dfe58764ac20a75f87b98bb4029f1dcda697f9f3e43b6bec",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "solar_it"
			}
		},
		fee: "0",
		id: "925a8d451b85fa02ba148868e639e906d6b26d63926f99010c886f1f442da719",
		network: 63,
		nonce: "1",
		senderPublicKey: "02203c49a67519e8a7443e0f7dda64b0f0fe0828983c51a9277d0778051ed0d2c5",
		signature: "100f313017c63c39cd37261498dd615371f72d147d2f36ee03a157264ad2c84e6af3ff49d1feb7d53a5149b353f9d99d4b8ac2505f3cbee797d52fe2bf3be8a7",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "alessio"
			}
		},
		fee: "0",
		id: "4baede271d54949dac7db7984d16336cb2ebfe2f60fedf2f16b94b61fd4b28bd",
		network: 63,
		nonce: "1",
		senderPublicKey: "0326f90a4ba2c5c78aa3f17d934690b740b52133839560dc05ccf12e8678ffe342",
		signature: "2a059984c50fb4a46fe883d7c05ace32f3b0b8f47beae2b2e922f3a9b50984ba880a682617a732c34a22c33e00593b1a2359181105bdebe82b345e50535bece0",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fun"
			}
		},
		fee: "0",
		id: "88c9d4a255ba705f9d7130c94296ccdc3a374eb4b26e05753701ffffc3938a65",
		network: 63,
		nonce: "1",
		senderPublicKey: "02cdd0f172e9d817598ed604e97c62605721281cbe3aec6fc7f45616f6c154c49d",
		signature: "c845906b7afc1d8140ab090d496694371b7f3f84c33dc95bebd846dd310ee68dd8e26d547db75bff2547283717bb90e9f64ae7e45d674f4b94332ebad4d49f72",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "goat"
			}
		},
		fee: "0",
		id: "75ef9b794dab941aad17b29b4c1c5f6692429b5c7b691b694435ced8c47776df",
		network: 63,
		nonce: "1",
		senderPublicKey: "037add8608b50bacce33964ba82278258c7a882099e096ad72aef5524abf992071",
		signature: "08458a69b4012cfb3d96a3b036901c8956336faa65174de95aeddae5e34dd7a6691fb5700e2811829b40aff135ee30202d00165c5dc7a649c76a0ad1af292f56",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "mtaylan"
			}
		},
		fee: "0",
		id: "ea91b844e3660c0bc87f079a53dc23c7ae72e0270a270f165febcf41e10c64a2",
		network: 63,
		nonce: "1",
		senderPublicKey: "035d389e17388735d7a18b040bf3fe68a6e3e739aa6f1ea46773c17472d3527b61",
		signature: "80c08ecbf74645590281dad6ff3bd6d2f7f7cb4ee3e25560657c54135110d71240f2a4668df62fdd8813edf22abd0f863b1df173c45f4c5cd7f3b800a337e66f",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "yieldwallet.io"
			}
		},
		fee: "0",
		id: "57e25183da6f1f54ba7bb9b2121424f65d27c21cb672804f10312b4f2ef42970",
		network: 63,
		nonce: "1",
		senderPublicKey: "03a6fd51f190ba31cb555e44d8daa090af3dc3118fd810dd98c88f4008b3195257",
		signature: "7f1bbd30551c85c849cb3b49456922881d71c3217903a8437948a2f38229f24c853c844a0a5645f0159426871c18e5c1db32bdff727c565ee149de2bcde25736",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "axel"
			}
		},
		fee: "0",
		id: "5cb9eb029dadb82dd5cf5e6d58307f777d924f3984fb1b5004577643a6ee6f5d",
		network: 63,
		nonce: "1",
		senderPublicKey: "023769d039e27d2123000f70eef4f70d62ff2003d58d6c2bf8e8051dfc22fc9069",
		signature: "6749a93d7be3c2bce1abc8aa23dd9befa33cb37cec3218e883bbfa0adfd9a7e8f541f6e9eb30a3c9007bf710df49eabc4be6933e19e4a68ee5248123632fdbf8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kippers"
			}
		},
		fee: "0",
		id: "6c899073d187bb2a530873c40df66b6738a5320420015144ef4a8119fd67cb7d",
		network: 63,
		nonce: "1",
		senderPublicKey: "029d0ced44ad57c247f5dfa06efde10f34fe5c760f386901fd9d0bd19d4ca6b755",
		signature: "b6cb63bb59e3e0a38096e9265b125627ffd164871426cad35fb60b0c198e90dcaa23dd586ef018fffba4b5befd55ce66201b568ee04a1489eba3127ab890167d",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "dev51"
			}
		},
		fee: "0",
		id: "31ec7543dba5f0cb9f2037e7cf751cbf20cb62af7ed20e1c84b5efc02c937f4c",
		network: 63,
		nonce: "1",
		senderPublicKey: "031e8e9c5342e950bae35e69711d962f82364cc13f6754a3d4a15199df8f4a0b24",
		signature: "728600757a00a2afda5b75ca042988f87983a5ed4a6062d2122aac5a0c86d2c9b53d924c270086956c11be1162958b47466a64781652f00a51c208fb40235b03",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cold"
			}
		},
		fee: "0",
		id: "ac786ed11a40cb723a4aa04566d148d898edeb78920a6a26832114ec3ddaef9b",
		network: 63,
		nonce: "1",
		senderPublicKey: "031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b",
		signature: "aa56befe23c0b4fdb77f6270fb909443da42c7ec0b3687f14a389ad14179b5c2972399987f41641b987623ab899ca2134ab83b4dc25e06d23973ef766ba3f846",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "osrn"
			}
		},
		fee: "0",
		id: "69f3a167c6e9be7f3543b9ad0f52af481d6985605cab27f9810b7ee23c1477a6",
		network: 63,
		nonce: "1",
		senderPublicKey: "030439ec5501d53b09a1dd3ba1c75680fe30b0af29d53fdb9eb9fd27a8686c877f",
		signature: "0e57afce306c6d5219e0d1fdf93d890dd693ab0149ca1ee217fd6d5f64021a7675a88f3b673e7dcdaa15498602ac271bd2ec77b47110fe8728735e681a2b184c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sevi"
			}
		},
		fee: "0",
		id: "0a91772e99a82c54b1e519157ec3e564987efa91701f9e289d4a775d54e3bedf",
		network: 63,
		nonce: "1",
		senderPublicKey: "03e2bf53c75097b7c63ab6eb58cff73489c59a00a383b872cb10275a488a2f01dd",
		signature: "26def93c341680f710701b744c3fee391cc68f5877c4142956b3cc76653e7b13a6e9610214e5a040e9573f92d365589a25094edb3404ac97fa2c51fd0bedecb1",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "solar.tr"
			}
		},
		fee: "0",
		id: "7c0342da5416a7051dd5ca60be9b5b2305856439990c2ee7b200d16a9f73e94b",
		network: 63,
		nonce: "1",
		senderPublicKey: "02dfc947dc543be9bab7e34314866e528e798541028bda0c7b3811e5c0de668e99",
		signature: "c7420a5fc79965280ffe35e38b979a9ee16ed93e808cfe7a7d7fb62c39b46ddd8278c4b5a8b2659d112f4b45ce3a21f18500c3bbaf9e4469afbbc06bd36ddd0c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "motolaji"
			}
		},
		fee: "0",
		id: "b6646af3eeb6e9701a00767afe031f7b07dc1a5fca7ed4f83d696130b3de74fb",
		network: 63,
		nonce: "1",
		senderPublicKey: "039e5a5cc4f3c4c973e34069310d032e9bf39b1d970fe79d9813435a2993bad00b",
		signature: "5d523997695dfb71d424ffb3297a3677da8354051c4818f96e2433eea5a2227340c2df564a504b271906528aef79ccde33efe979357485361d2db8950765a3ae",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "advin"
			}
		},
		fee: "0",
		id: "fd9d211d6c095c24ec8759d2b4c73029539ccdf531976306b54e346492a007ad",
		network: 63,
		nonce: "1",
		senderPublicKey: "025f2008abb74204405cc95d5390b9017c85889653c5baa64935ff00b231fd8a79",
		signature: "e9434cae433c24ac95f1add2a8d4277f1e3bcbf1c4bddcc91fb7e1b40261c47f1b50a479ba17343fadbe555d5fea86e47c141554fa05e8462b8b1fbe74ab74aa",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "aurelion_sol"
			}
		},
		fee: "0",
		id: "f8e01a7988fc8424e7ee521a3f34c2ff2ae9ef0a10d6eedb33b33fc3fef011ef",
		network: 63,
		nonce: "1",
		senderPublicKey: "02bdd811c2701b23bb7a4aee45893d6651fa8c49280c355548b126a3f331272288",
		signature: "fb59da33eaeaa2e53daac0b3fc26a808aee1218df9a7f9b1dbeda029e1989356ba7ddfbb399d02e27142fa7d706f0c5bfb511f7c7581d4fb570f920aa99548b6",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "pnwdrew"
			}
		},
		fee: "0",
		id: "0f6348e4041ef4d913e38291d4163cde5397a4d0267ce10f5d879383704c168c",
		network: 63,
		nonce: "1",
		senderPublicKey: "034d07446aa22b11d6c72d30a5f1225365198298fc0c11500210accea240c139ed",
		signature: "2803b9ef5fbd8881a6e75f2a2e4ddc8788fb41f7d6e543c7cf7d868553b640d6dc6f1fd9398e8c58990efd2b1dd311f5613233c7e6da74445457b8644bd8f704",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "st3v3n"
			}
		},
		fee: "0",
		id: "d8f05d61f9e32a4be671d2a7c36a8565f71c7c8198e05ae24a00fcc1b6300c18",
		network: 63,
		nonce: "1",
		senderPublicKey: "03b65cfe12edb33a740c4270d6e6215b34a559d313cbc9dd7f72127fa1148cb020",
		signature: "e8d06a7116092886cefc0cf9e617ccabe8435049ce28c73c88899adddd17b0c9b7e89bcf41c4eb56828e793cd59e0d7162a10fdfe7c546f0549bfff661a52a1e",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "arktoshi"
			}
		},
		fee: "0",
		id: "5eeb8f6043e15fb9cbb3ac54b840386c53791dd7863f9fc7dd3bb25380477999",
		network: 63,
		nonce: "1",
		senderPublicKey: "0263e91eaa26f310f8ae7ae41bf46cb55ba26a184c1e3208625265d7c3e00e66a8",
		signature: "21eafe6b900d31394970033fb8bbdc049f81416d1e9265be56aea63252fe373443a13a00e4f2cf61062595129bce7129df7777406e8f49fe2c8ddb1e5161068a",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "arbaro"
			}
		},
		fee: "0",
		id: "cf11d4931cc6ad2f783df89ddc650adcdaae2f75387c07c8be2430775c7a1355",
		network: 63,
		nonce: "1",
		senderPublicKey: "03f4c5b152f9b24a719acc05edf7d7aa68ca87a361e69613251f79233e6a392481",
		signature: "7f31ab99f747c878cad4f3bc5e65f74c13e8281af7e744baf61146d19d4928318f63d1875a707c0580a9004abdbfbaadcbe723b252c2b84ff6b06f8e14faf41c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "geops"
			}
		},
		fee: "0",
		id: "bd50e0937d982725223d4f45f7689405ef453d1bb99c5816980f0fd162a2d457",
		network: 63,
		nonce: "1",
		senderPublicKey: "03e09098ab20dd61110265b045ec70ae04f9a32a14d5092cdd03c739ef40fbf633",
		signature: "d7949ba66289638a2deb96a069c818dd66bf2d6fc3d2afec589fc8ceee225bf8a8d7e54f02c099fd88711ffc450ecd93369fb61958932fff5922920bea8bd4af",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "friendsoflittleyus"
			}
		},
		fee: "0",
		id: "36885f1223f9a8a3cea627b3d87cb5667db52ad4a1c1877ed1d166f69378a896",
		network: 63,
		nonce: "1",
		senderPublicKey: "03cdfb11d8a92b1a6cb0df2079775389429c216e91602cef78cd3f4196bc4d2da7",
		signature: "6b0a531a7c6d25d430652f1dfb38756f0d4774f5f8fe189e16e698b4680916877345441ec5e9c4e0efb3be67a6044ddbfa366eb275a6911c74ff2ae376031b87",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "thamar"
			}
		},
		fee: "0",
		id: "88e639bd21aec23e7d988898f38e3d795641ac4c5950f3e9f5957c5c60f1be90",
		network: 63,
		nonce: "1",
		senderPublicKey: "03ef6d6adc55578db67a3c9c9e70bbd3af5d18f455102b5be163a7e0ec8766eb5f",
		signature: "96aca1ba5886f6c60bad430a84f17cb8b97114ca480fcc65ec2d003001f558715dd4b73b854ec757dde78521c5b24b8fb866a07fe4968732e537634c49f18cf5",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kaos"
			}
		},
		fee: "0",
		id: "e80e2648374e3cf2798ac166b1d054289dde52921c4ca6bf2c1daad170f6794f",
		network: 63,
		nonce: "1",
		senderPublicKey: "037ec9a2ed0f68a4e90779b9d54ee9b29d8892b65fc581511d22d504c36d15c255",
		signature: "c3c69bfba2a563a9c00ec9ef1597f5af50dbc53803a51e13495c65e2cc74b56a701ccd8a86ddb50226ba2bb80bb38c23328b78c5bfc095913bacb0f18eadbc89",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "bfx"
			}
		},
		fee: "0",
		id: "b0939a0f5076c764c483953da8e4e54427145b98327b1709178fd96881f96d21",
		network: 63,
		nonce: "1",
		senderPublicKey: "031f56c4933d9efc0aaad30ac48f849eebc099184a527665c05be7dde3abb84a0b",
		signature: "64ec0c4c31e42212b8fbfce05153b336c75f6d638984281afa9029e95118c24bbbf1581104db480c01e9744cfbfbfdc4caf1ddd7f33e95ec826010faa2434c7c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fnoufnou"
			}
		},
		fee: "0",
		id: "f78155341583b61488d39a8bddb2d9f5a0a3b687314de742959ec1d49e84f818",
		network: 63,
		nonce: "1",
		senderPublicKey: "03afb3710e8400e457240bf38623823e9c9fc271a96ca0ba2b808819bcf5f8704f",
		signature: "ca12d59699143964026d4881e0319f0b19df55ca4d1a66512be0dadf85f84e610cec06c477d7235cf643a115a5ad0c5873dc9431afd52b9c91496e941339bde9",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "exolarite"
			}
		},
		fee: "0",
		id: "239185720b98ffbcfdf0eb3f5d517bb71dc0c468a143f4398f14938a33fca284",
		network: 63,
		nonce: "1",
		senderPublicKey: "0265cafa6203ebdcc28b518ba5853ebb4c50fb7862b4184811eba141a539f1e2b0",
		signature: "1ae7e4d7ae12e04a3bf267c3f7c265aebddaf890dfb4137e4091125d47750801a6618f4515a4fdede806f6b8a1f1b232bda82bd2f01bc58732c6e42cb8a093f3",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "hello.world"
			}
		},
		fee: "0",
		id: "a11bd322d0a3b37c02321a2cef8d2b2f67e17be90e77ce7d7b79bd1a632da076",
		network: 63,
		nonce: "1",
		senderPublicKey: "03203ca5073f7c910013fef01941bc15e6872986b7bf6a08dcbac6ca6520d1f8d6",
		signature: "10da2228a47d4507bc8d480e5c73d0d130d9f1653a5476b4f207543ef305064b8a51780bf1ade4875736586a7c10bb58b4a7275d67e9f05fc09388a1ecee64a8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kimchi"
			}
		},
		fee: "0",
		id: "77f8a7ef9b0f12c579e99e5de6ebed5a6f2f2bd462951358731f33ee521f58f3",
		network: 63,
		nonce: "1",
		senderPublicKey: "022f23ea0de755063c9664c3014b1cfd02bcbbaaa453d80cda3fa99acd7c8100d3",
		signature: "4ba84848cb06fc82be54f9fc1a54ccc860999a1e4d97bb85a85a57864dedd78d7c4f05d6969dee03131d916c63efe0c1ff4955207e2023edc0543e78ebb313c8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "wevalidate"
			}
		},
		fee: "0",
		id: "223083ea5175b5d495484433a49541c80264311c168326590f437420a3f58575",
		network: 63,
		nonce: "1",
		senderPublicKey: "030235f90f77a0b464039ed5962a6e2b8422162f49de0e22f9b94f5aa18f6de7d3",
		signature: "7de654c1148c16113018dc01794ade795ddcd9d04709c83501f8470f02a1e1ea509c218ba875414a56fa2f22cb5d44d738ca4ef7068e4633c5373135d4dd900f",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "nft"
			}
		},
		fee: "0",
		id: "7cdcbc2e68059ccd8ffd8479059e495b2631288f02ca872353952744c3a871e1",
		network: 63,
		nonce: "1",
		senderPublicKey: "02653f0a245594f08d5e891c0847b9ceb7a0c1473459da004ec92b3d272d3a2c13",
		signature: "3321b29e50a655c2fab0ead95eb28caca69daebbba7a48de0108304bfdb6e87434bb5e9af7e4aacf10f92cfa9e521b9e957cdca0bea2c021ad6c9a277a67102f",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "minnie_m"
			}
		},
		fee: "0",
		id: "66c96632b7d72a8c5658a2cf39563516cba48bae20467f42f56b397d2018ce83",
		network: 63,
		nonce: "1",
		senderPublicKey: "03d89bfc4256e8de85cd1b9220c2583598bdcf11f28dfe5c676ea9f70f12d2e525",
		signature: "20ffa862a578d845ee730c603e9a8a297336c6c66402d6c5cf87b587851f83182d286db2c11981c63209e4bc4a6cd13c703e847e5674d022a87aa201aa0e0bd4",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sircashalot"
			}
		},
		fee: "0",
		id: "33d21afd293b3b4d239ec053474e77aaa8da94bd1166cce90c5205acdcdaf402",
		network: 63,
		nonce: "1",
		senderPublicKey: "0297cb30233a339c82ed52fb28489b01f8b06d6be54419505f072e5300393a3285",
		signature: "96fba547868093fc2546f4a736c1ebf9d5722a8bbcf998d3b1ba7c762a9cdd3ef01844a315e7ce0837c1ac0afe5ca6d6a8b8893ac7eeb85d6b851b45742b3879",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "goose"
			}
		},
		fee: "0",
		id: "044d058310945c41ed21a1ff8f1de2a9da0ba903ac015e03fad249cd43a6168f",
		network: 63,
		nonce: "1",
		senderPublicKey: "0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785",
		signature: "64d384b31601db0d0f3508ed7a9663f9b85ff75410ece06d4525ed55521439b0c272ccb11480430495f0cac6ca9fb972a31fc8506d365dec416180f56889e174",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "lunar"
			}
		},
		fee: "0",
		id: "1c3bbbfa7e040539f113485cc8fd456c0986de9f16a468cc9e99ff1a3aac9d07",
		network: 63,
		nonce: "1",
		senderPublicKey: "026c46df329504f258372b80dc38f86f7a71590a7d20fb6fe1bbc0ad00a463ce6f",
		signature: "945332fa693ea150b6a2d7432fcf079dc354cab99d9f0bc139d6840ecfdc0be5f798c028c72480cb603b7b1936f25dc2519525576d284f78a8a8bac522ddeb4e",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "lucky_delegate"
			}
		},
		fee: "0",
		id: "c7423284fdb2257d1baa6dfa8e6480dd9bfde57ed7103eaf76eb7266df2b0063",
		network: 63,
		nonce: "1",
		senderPublicKey: "0299d60f9cf9dea59ef8077a78d281f0c4fa1a8135752a630f14d1549a5e840cd7",
		signature: "59e31203d2f135f71175cc3ec28c05c2ef8b6f4f57ed8060f044a46f897600c2067b0f52214a1929fea3a431d198ddd28df7d1f6fbde976953029507f9dc0964",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "biz_classic"
			}
		},
		fee: "0",
		id: "0b6e5f6971f1f431942bfed858f5f325eede91aaf5c053513ddd903f3a5d95d4",
		network: 63,
		nonce: "1",
		senderPublicKey: "0276a010f5e6915b5306dc3e474b36aba8dd6e407951da60a896b30ad61fb61e44",
		signature: "d0160288996cd6acde95c5837474b836ecb0f4c9340541ca15462a3ae80afcecb8e5fa82928a987e40eb033fef7224a4bc853cfdd1aa53c5f0580d12ce73070a",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cams_yellow_jacket"
			}
		},
		fee: "0",
		id: "cbd4f17094528616245bf9f6fd9b31fa94a5f406c69cd1bfbc307c13bd5dc77f",
		network: 63,
		nonce: "1",
		senderPublicKey: "020019880bb7726f1cd306ead2783c2ce23598d1e7d12e1ca32cc661cee450de75",
		signature: "1ae7071d16a534e1f093186acb5d1d87782be8985bc317200e2900c5e0e3df44b348515006291c821caba8f50955e3abed605534331f21c768ffe1050aadcf45",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "deadlock"
			}
		},
		fee: "0",
		id: "6214287a9affa15e64adf955e5ecfd249f22dbde6b8e06ff5a19f4944d342d74",
		network: 63,
		nonce: "1",
		senderPublicKey: "03d1bb7f0fe999ed904d6c5af5b69e9b214b7716d0628742f46d615710c0470859",
		signature: "570b6664f6edd3e4b192a21dbe1bca8e83e3791392f78ff831ca4cab70024c382b27b8e8345e1f58928e251aeb22f56ba2f388f723bc14b81bfa86f78e71d518",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "blues_for_alice"
			}
		},
		fee: "0",
		id: "ff68bdc2deb26c1118bb54338d853e601d3a92d9f2134c56ab07a7d552a91709",
		network: 63,
		nonce: "1",
		senderPublicKey: "0396cfd7c8805562603d19dfb0eee55c8ec6a13cd4be9cc3e694490d9372c4fd2f",
		signature: "8b3dd8be460b457f16f4ec4ecbec711dade38ae7fd2dce712d36405ebf2c3223589ec627e2a9cbd72095fbb6eb215737210791307a8173e3b5e4b41ba30a3459",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "xiggo"
			}
		},
		fee: "0",
		id: "9d332f8b012e74563d3877843c35e39fc2c6afd970b2dbd56bedde85c80015db",
		network: 63,
		nonce: "1",
		senderPublicKey: "02d3af99aa7e109dc2fef97d43894714cc5e5bfae809bef017f2e9b42864b4ea4e",
		signature: "0ebb22df06b4bca5f026e2c71f24911bd94316f2e8ca4e22895accf16eb8296ce0bf57b5b6441084f5718b34fb8f706bb45bb8802cd2c2c3d7f61df9fb374e0e",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fonk"
			}
		},
		fee: "0",
		id: "a6e1661bf394ff37cb9d61528ed82f8484e30189236795686d1d9cf9c47cfeaa",
		network: 63,
		nonce: "1",
		senderPublicKey: "03f1cf7c43fcbdef9c27406da3449d867a3204d816fc898be1bd425db075e7b13d",
		signature: "a9d954e481200e40724cc66d947004791e6fa6949f4510b13fcb6132ff488dc99c37d01c898c9d72a8bd5add878ae7619908b8138e062a386bb9ec91ee121a80",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sigma"
			}
		},
		fee: "0",
		id: "4382e3f457aa025df2bb2e9bd6e5c8acb76c6884a956fe7305abd4d9df0b6dcf",
		network: 63,
		nonce: "1",
		senderPublicKey: "03bb00c665f6a426beafb5de3e2d9ef2ff4bf497c2c0e2f6040867c726bd4ee8d6",
		signature: "41b8e051f525968ab72d1e13bd4781c4d20319ef7f31e09fd6436547727b3de35759b0397d61b264bd8c330c5c8ec05aa9c0f7977e627f740148edaa7cc537f7",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "balu"
			}
		},
		fee: "0",
		id: "b1eade66989be7d84b7b71d7229f508abfbc47f33242db204159d0e6785b3251",
		network: 63,
		nonce: "1",
		senderPublicKey: "033630d8448ff8d24a3ba8cc1bf6ddf5fcffc48ca986cb400a98c977751cdc9d2a",
		signature: "ce06b719fea8e76ca6d9cc92821799cb95c621d2f2a800651888eaf932ee31eeed27f68bf01fae7042e59a026c9d9a545b3508d4301c5dd3c2cda2be8bcf4c56",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "beta106"
			}
		},
		fee: "0",
		id: "e669de897e088f609db15fff21caf86470411eb60e06eaee620912969ea3f77b",
		network: 63,
		nonce: "1",
		senderPublicKey: "03994940d61b45321876c3bff533fecda03131cf61529b54bedf55e4d84856dd15",
		signature: "30b30a8f31e8202327ad61a35524f66b4f74ddff72709899c6f9106193902a8c4ea3557a80ccd02abf2757fce318f82431cc489e4147a11831cfdee34be226cf",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "toons"
			}
		},
		fee: "0",
		id: "64b7e6c876945d2cfe1201777f389ecd9ffc9fd2b7c8a10ef503223af4dfa25e",
		network: 63,
		nonce: "1",
		senderPublicKey: "02e28757d5d24523d62f1018bf68396c17857b19fe28bfaa4e81d4a05f2e3ef723",
		signature: "86bda27e78624d53e30c09d30dd197733e747592b73f57a0b625df86bc499c7d39aac8b702e4d05d48b3e6a8bbe26c9fa0e9e01217db9a6fb4b3ec6103b053bb",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "phoenix"
			}
		},
		fee: "0",
		id: "fa1b203fd5d515cd7c42e2182004280697c85b64f1162cc6f4c71a2f7b453819",
		network: 63,
		nonce: "1",
		senderPublicKey: "0315772d05ed0de128ff6657deeb8f8e3d44f689044d9ea67fd5a43a80bf18e839",
		signature: "44fc51678186e547d7606aeac0b8b28478f414c1ba2df018e60be6b293377a122400f3a2bce1bba3f1381a4ba86be0aa6987d17a47b80ae0d914ef1e0f4e0bb4",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "stay_tokens"
			}
		},
		fee: "0",
		id: "7859e78d406672b6b516607bceae0288abd0c16a339f466888eb7ab9b8f1dd9b",
		network: 63,
		nonce: "1",
		senderPublicKey: "024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f",
		signature: "be0dd744ca7f124ba8c5d718b818fbb0a209587893235191eca9a52f387f4afa9e63e426c18e9e9c46a20694b3c2845c52bb50383a48452545e58da9de94c5fc",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "dpos.info"
			}
		},
		fee: "0",
		id: "fabac0f3005269820456cfdc913007457ce22cd6bc830efe4a155af47d8b613f",
		network: 63,
		nonce: "1",
		senderPublicKey: "03f7130b12d4d7829510ad59624758abf10597e8fb3626c964e82400eb06436eb6",
		signature: "129ad44e463d6b5537d922facc4d029ef6ddd74f51a9c18f8818f77129c73e004db6c8bc27dfaf0663f60675bc7b98ee056d0ac81af02954e31b312a7fa9238b",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "leitesv"
			}
		},
		fee: "0",
		id: "f1bb4ae9341befc830099ce2bc28da6fdd310a20fc67c799786f24087bc10bf4",
		network: 63,
		nonce: "1",
		senderPublicKey: "02d4549b1a63ed261c439b1f941211adebfd02184a9f0f5b81a68231c00ef511e1",
		signature: "d277508ddc3e92aba22f3a3a081a3089ff22dfcf227f480032df912a8f17e5c707e7acfaed349eec091a0a117a25735c774c94956e345ce230ea14eb3c271b08",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+022bcee076006120b24f145d495686d2afc880079daf2eb20d8be9bf0e434ca3e1"
			]
		},
		fee: "0",
		id: "8c7e2aae0e34d28c8c68624827131e55c48144456e33d8af8ebca217af624f36",
		network: 63,
		nonce: "2",
		senderPublicKey: "022bcee076006120b24f145d495686d2afc880079daf2eb20d8be9bf0e434ca3e1",
		signature: "05c45445d4cad1f2a9cc7ce6fd287596abf79cba7c86ee047ee79ddb38fcb11f1ca873b8ec2e170e60a9d8b1de31e8ec0e59e9ca77b9c7f3196d9fbcdeabe9b3",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03d39fb4797d0c428bebed6d80203e2273a9fdbcaafe0b29761ef3183c2151e211"
			]
		},
		fee: "0",
		id: "6911a9d7f52b3e9efb6a7b63d4b25c88910d6af03a61cf23ee006929d41fa76f",
		network: 63,
		nonce: "2",
		senderPublicKey: "03d39fb4797d0c428bebed6d80203e2273a9fdbcaafe0b29761ef3183c2151e211",
		signature: "69c43c0ddeff0a3d81757ed0f9eae16db66faf112e082a6f622ad54fc107cc99d1e54f2da362b86a73378cc5a5f6d0962477e520aca6c84acb95f1cbf3f75ad3",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03a1ce3c6ec5a5ce8b05d25b804817a6ef4a202d3ad5ee8aac1ae0ed22c0c64c18"
			]
		},
		fee: "0",
		id: "804a43f30b7baa20e0e3cfbde398f4c54b42fbd7852d55a217f2e261a6219ce9",
		network: 63,
		nonce: "2",
		senderPublicKey: "03a1ce3c6ec5a5ce8b05d25b804817a6ef4a202d3ad5ee8aac1ae0ed22c0c64c18",
		signature: "f164987d508d67ff338504eba97da31acd5e52593dcd9c07daa13f2fb386073f1a16164949cbb4bce9c5dd7e16d26a27a1d571f162d1cadaf207fe21c4584b51",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02203c49a67519e8a7443e0f7dda64b0f0fe0828983c51a9277d0778051ed0d2c5"
			]
		},
		fee: "0",
		id: "e4f626141cbafc914f207ced3a70d4851819830fd7fd3aec1ae3f520a63bc33f",
		network: 63,
		nonce: "2",
		senderPublicKey: "02203c49a67519e8a7443e0f7dda64b0f0fe0828983c51a9277d0778051ed0d2c5",
		signature: "dad29faab1ac73e0b6bf551a08047130c1a57cb3da851661b6392d332d207c60e129b88082f2e6fc5b9cc68bbbcab7e858e7a64a6f6e232b3671b13e9656aa28",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0326f90a4ba2c5c78aa3f17d934690b740b52133839560dc05ccf12e8678ffe342"
			]
		},
		fee: "0",
		id: "ce09958fe9ca86344fbb1670bbbc56d21e27ec088fc1e9e8d0b12082964ada54",
		network: 63,
		nonce: "2",
		senderPublicKey: "0326f90a4ba2c5c78aa3f17d934690b740b52133839560dc05ccf12e8678ffe342",
		signature: "b8a4829a2bf05c97a46909e3b63e1c62588a64e3a31fc302205345dc11d7f29b4fe7c3ab0c8b0e964ff7c3bd7d39428090298c11a13e4ce0881c0392b1dbbeca",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02cdd0f172e9d817598ed604e97c62605721281cbe3aec6fc7f45616f6c154c49d"
			]
		},
		fee: "0",
		id: "a7f398f5faf9bd92ec49cca3d7cb362cf8fa20c6b93160f02fc6983a9af8a2c3",
		network: 63,
		nonce: "2",
		senderPublicKey: "02cdd0f172e9d817598ed604e97c62605721281cbe3aec6fc7f45616f6c154c49d",
		signature: "f687077ed6fc046edf44bc0f9c78c6296c2a1b15f925517decc0c7d41bb6105f230d566885e2362107a150234608b58e08b009489d7ac6bd3d2885e251c83f6b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+037add8608b50bacce33964ba82278258c7a882099e096ad72aef5524abf992071"
			]
		},
		fee: "0",
		id: "4b8810138ea56fbf1100bafe7bee3d436a737d8ba876e1fd762dc4db00e1dc09",
		network: 63,
		nonce: "2",
		senderPublicKey: "037add8608b50bacce33964ba82278258c7a882099e096ad72aef5524abf992071",
		signature: "2a6c38e7e6fb7642afc5b5b75ae81a2421b57ea744ebda032c4f2ce08756cd2582a2125d42652e9e1ab82c1e5c48a221a96cafdfcc36112cb01f482e47485db3",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+035d389e17388735d7a18b040bf3fe68a6e3e739aa6f1ea46773c17472d3527b61"
			]
		},
		fee: "0",
		id: "2ac3e346049e0a78d310d81b363532f7d7f7624447bd7ec1698fdc7b5368152d",
		network: 63,
		nonce: "2",
		senderPublicKey: "035d389e17388735d7a18b040bf3fe68a6e3e739aa6f1ea46773c17472d3527b61",
		signature: "6adcb897f6093cf99aa40a78c774fc5b95acc27dc7f8a6adc7d99297586897abe04c1ce1709ea6e350459cda6fe4a9f0bc1df63ff2f7833cfe5f0de942d6850e",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03a6fd51f190ba31cb555e44d8daa090af3dc3118fd810dd98c88f4008b3195257"
			]
		},
		fee: "0",
		id: "44133b83a932491cfe23a61b6fc0d0e411252d6a09497e38b7eded1675d25edb",
		network: 63,
		nonce: "2",
		senderPublicKey: "03a6fd51f190ba31cb555e44d8daa090af3dc3118fd810dd98c88f4008b3195257",
		signature: "28d8686a7382e40b90c3b2299d9a275067ebf12be0b92a1e88e0c0c3c82111616edc3e83e76a4e221aae6282269ec2307027fba628d9d9e9fbd2ccdd2e3dc0f7",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+023769d039e27d2123000f70eef4f70d62ff2003d58d6c2bf8e8051dfc22fc9069"
			]
		},
		fee: "0",
		id: "62ca24331a02ec647dba5e7646e8ca489d36b9ae94563fdd735173bdb1654398",
		network: 63,
		nonce: "2",
		senderPublicKey: "023769d039e27d2123000f70eef4f70d62ff2003d58d6c2bf8e8051dfc22fc9069",
		signature: "a7152349be32d8e839879f02139823369015a15fd9e6acaf58501d52594e1e53859e93875c860a882df2101ec4281dcbb33bf39f0a63e51c3c6b2725890bc4f8",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+029d0ced44ad57c247f5dfa06efde10f34fe5c760f386901fd9d0bd19d4ca6b755"
			]
		},
		fee: "0",
		id: "9c92f1e026bc0b85cbd20ce6f7b8ed6d58c87e1651f5edbd01635f9ec8c3fc13",
		network: 63,
		nonce: "2",
		senderPublicKey: "029d0ced44ad57c247f5dfa06efde10f34fe5c760f386901fd9d0bd19d4ca6b755",
		signature: "be8c83879c653af60211343d4ef35a01359638cd0d3158d84af372d5b4bc22a490f4cec8343a51ac6a03ecb35ac105ea0f7b4c881f32082f9f475159a9335292",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+031e8e9c5342e950bae35e69711d962f82364cc13f6754a3d4a15199df8f4a0b24"
			]
		},
		fee: "0",
		id: "bdc37e992390b49b979a46dd863db5b5b8d3299638dbb6402be079a62b7be527",
		network: 63,
		nonce: "2",
		senderPublicKey: "031e8e9c5342e950bae35e69711d962f82364cc13f6754a3d4a15199df8f4a0b24",
		signature: "fa334a53999d74412c63b6aea42df89d614fdff31b499f2adf7287634dfe2cd6b282d4990f5c77044d00c10b82a5008d321a47934d76796eed661c66de9e6c8d",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b"
			]
		},
		fee: "0",
		id: "69bbf1cd6f58564756d0f4530029d07b4fd52e5d72030491f55497621a5ede66",
		network: 63,
		nonce: "2",
		senderPublicKey: "031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b",
		signature: "ea57a3e57a0793ac0804d9472f96b825076f245596ca3fc03511097ced87a40987443fe954e981a5bd4d07e27cadfcddeb992c4f2052dba7405388c36530fe7e",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+030439ec5501d53b09a1dd3ba1c75680fe30b0af29d53fdb9eb9fd27a8686c877f"
			]
		},
		fee: "0",
		id: "8e7b765812a1e60319d185f1ecadff8780b505ba97b085cb436e210665424dfc",
		network: 63,
		nonce: "2",
		senderPublicKey: "030439ec5501d53b09a1dd3ba1c75680fe30b0af29d53fdb9eb9fd27a8686c877f",
		signature: "d8d0c83481380aeb1ce1a7c28cc6d6551b70bbe5947bc72e9657a0319bf8804083b13342ddc666df981cb520e8baf3c05fb8e532e72288f31663a2988f648241",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03e2bf53c75097b7c63ab6eb58cff73489c59a00a383b872cb10275a488a2f01dd"
			]
		},
		fee: "0",
		id: "54c4fb875dd6729e920a02fb55f7a16a2ba0b81c0ac8ed84aa8a5073f522e088",
		network: 63,
		nonce: "2",
		senderPublicKey: "03e2bf53c75097b7c63ab6eb58cff73489c59a00a383b872cb10275a488a2f01dd",
		signature: "17033fac1116b0d639e1886cc6434c4b0a75a3d55116dddf25789e9c72f74b185a52578ae8041d833826e31f969810e47ef2792b7093017f05abe17d8a871078",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02dfc947dc543be9bab7e34314866e528e798541028bda0c7b3811e5c0de668e99"
			]
		},
		fee: "0",
		id: "c0d5f355b0368a9fb3e72574636e9c3e33a2645ea1b3531c935c159bfe0a8340",
		network: 63,
		nonce: "2",
		senderPublicKey: "02dfc947dc543be9bab7e34314866e528e798541028bda0c7b3811e5c0de668e99",
		signature: "b768d0d52e47f2ecd8aeeab62fa8fcb4b21f1cc48fe71942a05242883bb0354d87ecda74746b3fb1395c3e3d7ac4e390980787fd66ee4d0f0f0c6d43ad0c6d02",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+039e5a5cc4f3c4c973e34069310d032e9bf39b1d970fe79d9813435a2993bad00b"
			]
		},
		fee: "0",
		id: "7fa7e8131fd210e97dcb7c336a91a130ca09daf0189e750ec9bfe96508204318",
		network: 63,
		nonce: "2",
		senderPublicKey: "039e5a5cc4f3c4c973e34069310d032e9bf39b1d970fe79d9813435a2993bad00b",
		signature: "d96c3944443f4ec1e0d57872f1f9005685ae030557f7f07c2973a0a6034b7d255f03287dc98673446478521d856167b7616b17b1de91bea6592eeeeded98c6ce",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+025f2008abb74204405cc95d5390b9017c85889653c5baa64935ff00b231fd8a79"
			]
		},
		fee: "0",
		id: "8558e5b15eaae6cf545028e498bdf7d2ba167576cae86d8fbe5ae7a9f97418e5",
		network: 63,
		nonce: "2",
		senderPublicKey: "025f2008abb74204405cc95d5390b9017c85889653c5baa64935ff00b231fd8a79",
		signature: "6c3a7f5c3eb477cd07be401857d25773673d7b709394005d8c71239b706e59ed604d1023cd3e3669ebd9f49bc1c1fe0b16f53ec082392fd77d1ae12c494b4ddd",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02bdd811c2701b23bb7a4aee45893d6651fa8c49280c355548b126a3f331272288"
			]
		},
		fee: "0",
		id: "c37fee2aeb8e37efeed54c4a801d25ef182dde9b2586efd5aaa71d6089b36e29",
		network: 63,
		nonce: "2",
		senderPublicKey: "02bdd811c2701b23bb7a4aee45893d6651fa8c49280c355548b126a3f331272288",
		signature: "4c229999b65913a5a96efa47a26d4a5b9625f19e271c73e2489e78370fe94b2d8a7d680f4f4cb3ff89c73a04c4e69c5a0f00213887216499c29c7b20f2932966",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+034d07446aa22b11d6c72d30a5f1225365198298fc0c11500210accea240c139ed"
			]
		},
		fee: "0",
		id: "e00bd1b84d018604bc47b9e1d4f38d9893a18e5d838b89aa3ad02eabae1c6cca",
		network: 63,
		nonce: "2",
		senderPublicKey: "034d07446aa22b11d6c72d30a5f1225365198298fc0c11500210accea240c139ed",
		signature: "6b6dfb4afc1e52e043a10fdd09feaf58e6ceee3147b60746aa120e6a0b603eb1e7a3c6f86f1f80379533b892d9bc538bba4c9fad80173f915dd954bad8dd86e3",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03b65cfe12edb33a740c4270d6e6215b34a559d313cbc9dd7f72127fa1148cb020"
			]
		},
		fee: "0",
		id: "6aff0b53c34f585101e105c135ad2bde9d982e9ae30ce633608795aead5735db",
		network: 63,
		nonce: "2",
		senderPublicKey: "03b65cfe12edb33a740c4270d6e6215b34a559d313cbc9dd7f72127fa1148cb020",
		signature: "6638f469c15ed17f7f646aeca4b1173bd6a1807d1ac5195a8415d4b753cf39d2debf7a2b64e0776684e026fa200cf5cc174088a1c969f3a0714a723c98d49f42",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0263e91eaa26f310f8ae7ae41bf46cb55ba26a184c1e3208625265d7c3e00e66a8"
			]
		},
		fee: "0",
		id: "5f4a57909eeb1ed57aa581ed073f497298eec7eea10c457c570b5f6e28905425",
		network: 63,
		nonce: "2",
		senderPublicKey: "0263e91eaa26f310f8ae7ae41bf46cb55ba26a184c1e3208625265d7c3e00e66a8",
		signature: "7a834bd9fe234e115739814178ad621153c8cc74a8d19b64cd639ae85ab23d2ca79e586f291e8058dfb25755fa7a75fffa29c5f5fc047afc558f9ee1de5b03bc",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03f4c5b152f9b24a719acc05edf7d7aa68ca87a361e69613251f79233e6a392481"
			]
		},
		fee: "0",
		id: "47ce680a82753c74d7c1c0d80c471c660a897f476128381978f3b4e9a717a256",
		network: 63,
		nonce: "2",
		senderPublicKey: "03f4c5b152f9b24a719acc05edf7d7aa68ca87a361e69613251f79233e6a392481",
		signature: "ba57e72461d2a37d006a738a695e124673011cac356ce32cf3889f9ca52e1f6b679d8b3bc9435efd620765208027227c3834154e2e451453bc9a471477d095c8",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03e09098ab20dd61110265b045ec70ae04f9a32a14d5092cdd03c739ef40fbf633"
			]
		},
		fee: "0",
		id: "d09c0ca7ec1abef95a3a167e9a8afdd25819dcfae16b62892d205d97d27b02b5",
		network: 63,
		nonce: "2",
		senderPublicKey: "03e09098ab20dd61110265b045ec70ae04f9a32a14d5092cdd03c739ef40fbf633",
		signature: "ca90cdf345082c70c3c7c040ac8a0971a14f99b45ab5e0e736122d54344882e40612cbe48e4f19723fae8fa4f3bf6f964d6a9769ccbf33b555795a4d80c79fed",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03cdfb11d8a92b1a6cb0df2079775389429c216e91602cef78cd3f4196bc4d2da7"
			]
		},
		fee: "0",
		id: "48b8900af28ca49fdc80653b57a09b5ac56c0b9545a9cd2c4a123c1819dc5333",
		network: 63,
		nonce: "2",
		senderPublicKey: "03cdfb11d8a92b1a6cb0df2079775389429c216e91602cef78cd3f4196bc4d2da7",
		signature: "78e16cf6edebd777e35aeaf9a063459489a7dc62e0a96e5806709503403d711b931dc66612a868849d2d0dde21cc3ae2d942375a4aa0d7f24a3dd06d4c03793b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03ef6d6adc55578db67a3c9c9e70bbd3af5d18f455102b5be163a7e0ec8766eb5f"
			]
		},
		fee: "0",
		id: "1dd0cff388f88c40a47f82b6b516d6680bdafc1eae93e9cc21e7016f1c119adc",
		network: 63,
		nonce: "2",
		senderPublicKey: "03ef6d6adc55578db67a3c9c9e70bbd3af5d18f455102b5be163a7e0ec8766eb5f",
		signature: "47f7391017a0e32d14dc1e22089c960d9757622f3ab73e44475dd78952faf1aabc47ded571f3ad3192d3e99fcf150ffab7f9f7c88a10ac82e1c80ee59d3dd105",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+037ec9a2ed0f68a4e90779b9d54ee9b29d8892b65fc581511d22d504c36d15c255"
			]
		},
		fee: "0",
		id: "0f366af85f623cbaf16a2324018c8350d322e90a3844c2302515eb7c028b86fa",
		network: 63,
		nonce: "2",
		senderPublicKey: "037ec9a2ed0f68a4e90779b9d54ee9b29d8892b65fc581511d22d504c36d15c255",
		signature: "186afb3411e7285f1011203d77c07ced222a710d7bc763781b499d7b78da347f56460c43e2f6592e2827f9a66d453ef2c6921c1c366bac5d422fdd32d135ac39",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+031f56c4933d9efc0aaad30ac48f849eebc099184a527665c05be7dde3abb84a0b"
			]
		},
		fee: "0",
		id: "0b2cc7b75f7732c42ed6b14254fbcc5a0f990fb406133c4b9f336384fd7b1f05",
		network: 63,
		nonce: "2",
		senderPublicKey: "031f56c4933d9efc0aaad30ac48f849eebc099184a527665c05be7dde3abb84a0b",
		signature: "2e252ac59245ebd0e3ed4bd15c72e0f18965442c9732c1c399d886797768c0fddc834ddf7beac21c83d6c51890529e2d69cfe67c54d216c222653563d412d4be",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03afb3710e8400e457240bf38623823e9c9fc271a96ca0ba2b808819bcf5f8704f"
			]
		},
		fee: "0",
		id: "9b077a4dd57be71d27fcaba43684e9a2c435208906a8d10e2915a91c18ab0002",
		network: 63,
		nonce: "2",
		senderPublicKey: "03afb3710e8400e457240bf38623823e9c9fc271a96ca0ba2b808819bcf5f8704f",
		signature: "b074976dd434b9b2b07e5adbba8c5f33d8ea02762246c4c4d772a8cf4fb17ffc83cebdb30c8ec6f61b2a1489c725cb57270139d45915b84c4d72417d9f3c303c",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0265cafa6203ebdcc28b518ba5853ebb4c50fb7862b4184811eba141a539f1e2b0"
			]
		},
		fee: "0",
		id: "ab7469934efa98f575cba33d0f44d3ace20647a8590f77ab0cd299c1e169b70e",
		network: 63,
		nonce: "2",
		senderPublicKey: "0265cafa6203ebdcc28b518ba5853ebb4c50fb7862b4184811eba141a539f1e2b0",
		signature: "a3f07e52ddb4b9d740a1604b536d1630ddb406a876c6ae0a8531e57ed45ca12b0eedbfd0194a9590aa0e4e884caa9a9ca593f785ba85c9fef01b8fdad5462ff9",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03203ca5073f7c910013fef01941bc15e6872986b7bf6a08dcbac6ca6520d1f8d6"
			]
		},
		fee: "0",
		id: "a145bf6ca3ee723c322f90605931b7a28ea1b2fd27b86b1beecbf92683337a88",
		network: 63,
		nonce: "2",
		senderPublicKey: "03203ca5073f7c910013fef01941bc15e6872986b7bf6a08dcbac6ca6520d1f8d6",
		signature: "5bf3d3094ff4e98e0c861696f7982758e9da856f7412f4bf8dbb6365733613ca26f2721cb1e7e2752ea5934c50cd65e9fe280856b34100aa9a3951b866d42c4f",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+022f23ea0de755063c9664c3014b1cfd02bcbbaaa453d80cda3fa99acd7c8100d3"
			]
		},
		fee: "0",
		id: "1fd08d31e5ce475840e5af612ee69a54cc22579240577878bfae60027361af46",
		network: 63,
		nonce: "2",
		senderPublicKey: "022f23ea0de755063c9664c3014b1cfd02bcbbaaa453d80cda3fa99acd7c8100d3",
		signature: "c9cfe392dec0f24a8a24b635a20f0e862620f1b463301149afacf21653ad80370d3a12caf722b0546d768458a682e879b7156c94a8bd997c43bf4575decd7a1c",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+030235f90f77a0b464039ed5962a6e2b8422162f49de0e22f9b94f5aa18f6de7d3"
			]
		},
		fee: "0",
		id: "64589ef6cef38f6f48e783615163b030e3b718f8e0e75345f4e22099b4984bb3",
		network: 63,
		nonce: "2",
		senderPublicKey: "030235f90f77a0b464039ed5962a6e2b8422162f49de0e22f9b94f5aa18f6de7d3",
		signature: "5e9fab0348812b51a4d9788f6d06dd32310df6e7a0e30ae33412a4d277a0903e36d8fc59f7384de77c3de2369fd98bf6d80537d3c857294aae458a0274d2eb07",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02653f0a245594f08d5e891c0847b9ceb7a0c1473459da004ec92b3d272d3a2c13"
			]
		},
		fee: "0",
		id: "1761686065b676e3dd275b506bff4a69cf4998f2a026e60cb706f34aa57656a7",
		network: 63,
		nonce: "2",
		senderPublicKey: "02653f0a245594f08d5e891c0847b9ceb7a0c1473459da004ec92b3d272d3a2c13",
		signature: "f98d181738342d492d57ef716be593e9d1aa5da88c2831d2eb43245555718bef016a5c68579f9676b0d57ba6fb854a1b43319900970ff99486d4b88674d94ba1",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03d89bfc4256e8de85cd1b9220c2583598bdcf11f28dfe5c676ea9f70f12d2e525"
			]
		},
		fee: "0",
		id: "7be7fcc095001312f523367a027c3b39d440a201c58291db8b19a37c33ed484e",
		network: 63,
		nonce: "2",
		senderPublicKey: "03d89bfc4256e8de85cd1b9220c2583598bdcf11f28dfe5c676ea9f70f12d2e525",
		signature: "19acfc1217289dba9fb3b3da46463e2f221b6dae9c7fef79968aa3b7d016e1f6e727316e3797ea75cbc469703da56ea4492c93b4ec66c10a73d17cca242f2fbd",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0297cb30233a339c82ed52fb28489b01f8b06d6be54419505f072e5300393a3285"
			]
		},
		fee: "0",
		id: "276991e51f4890ed5bc249f71e1080580d8154ad53b57e1bd09bd0662a1e0f95",
		network: 63,
		nonce: "2",
		senderPublicKey: "0297cb30233a339c82ed52fb28489b01f8b06d6be54419505f072e5300393a3285",
		signature: "00f9c94b58264c863a9fe0994abdc16435d99db9cb8ae1b99ab770f187acde93e8a23fcfb5266594679b5b23d7c40d345ad34e09fbafe82397ba148ff00eac05",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785"
			]
		},
		fee: "0",
		id: "8ac73ce1d443d7b22d64032b921b5f41f5a44b680e4e8a0e66144a310037ce58",
		network: 63,
		nonce: "2",
		senderPublicKey: "0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785",
		signature: "17cdcb977a7361cc88209fdf5c999258bf57ae5a7f793b8d1b6b8de36144713d7b5ba4721042665ee1e92927b3779068772eac3389915e6bef4c6c2dfe722a36",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+026c46df329504f258372b80dc38f86f7a71590a7d20fb6fe1bbc0ad00a463ce6f"
			]
		},
		fee: "0",
		id: "ba28bd253660522a5373e12576ec05318e9db7b17e28fa9248b6be6567adf0ff",
		network: 63,
		nonce: "2",
		senderPublicKey: "026c46df329504f258372b80dc38f86f7a71590a7d20fb6fe1bbc0ad00a463ce6f",
		signature: "cd54b35ec9778d3fc4a35626ced8e5f15b85c4707396d2d22020f2e8e2df33f8dce66e8e8221aa379ef141beef7be219cc2f321093e7d927d73dd1e96b45f125",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0299d60f9cf9dea59ef8077a78d281f0c4fa1a8135752a630f14d1549a5e840cd7"
			]
		},
		fee: "0",
		id: "c5362832d41d9b31f0b499a88ff51dfe986d0ac716980f0a52a3fda5e4c972a5",
		network: 63,
		nonce: "2",
		senderPublicKey: "0299d60f9cf9dea59ef8077a78d281f0c4fa1a8135752a630f14d1549a5e840cd7",
		signature: "35d37aefa392417a74e80f4ce1253937f42a653a438dc1a18ff31e59aabe30f5edff2703cca8e2d161783a4a9a12895be60ace5eaf152614b1423630c1f01cc9",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0276a010f5e6915b5306dc3e474b36aba8dd6e407951da60a896b30ad61fb61e44"
			]
		},
		fee: "0",
		id: "e3f2e35565eb174dac277df8c97d7313c3328625254d79f1c153bcfe42eaa493",
		network: 63,
		nonce: "2",
		senderPublicKey: "0276a010f5e6915b5306dc3e474b36aba8dd6e407951da60a896b30ad61fb61e44",
		signature: "5fd624063d37315274c7a87f33724aae80a6c528449a05faac93100548fd814773ba1d2cba03e28c2e52dd9107ab53e2f9bd04f8e9f11f6e86a38fde4c5ed19f",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+020019880bb7726f1cd306ead2783c2ce23598d1e7d12e1ca32cc661cee450de75"
			]
		},
		fee: "0",
		id: "ffa695b79616d1511b46eb3d26adfe624a0e70cf3a8a2cb4b8f2f90523073323",
		network: 63,
		nonce: "2",
		senderPublicKey: "020019880bb7726f1cd306ead2783c2ce23598d1e7d12e1ca32cc661cee450de75",
		signature: "07ca200612ff13c5a8811af5f775b3417e39f5385ad3e5db4185013031b2738dfdc7877d55adba293a4fb5c7f90e3d82003cb0a4fff9003f93eb30854182e651",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03d1bb7f0fe999ed904d6c5af5b69e9b214b7716d0628742f46d615710c0470859"
			]
		},
		fee: "0",
		id: "193054bb319f7c7415ce5b53380d21a1916d7dd03e801e27b7f6384f6b3e2fb8",
		network: 63,
		nonce: "2",
		senderPublicKey: "03d1bb7f0fe999ed904d6c5af5b69e9b214b7716d0628742f46d615710c0470859",
		signature: "0aa3c5d77cf5641e7afd18142f21e9f7a2a9e52ae8b71811ef327873242e2a214f08ed16b874990f16717cbf927348b759387fcf40be6b1c4f3e2f485c0f8d30",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0396cfd7c8805562603d19dfb0eee55c8ec6a13cd4be9cc3e694490d9372c4fd2f"
			]
		},
		fee: "0",
		id: "5ac3714ba6ed1b1eed3b0bf37ddc2150c90697857ef584f92990d8c901e381f3",
		network: 63,
		nonce: "2",
		senderPublicKey: "0396cfd7c8805562603d19dfb0eee55c8ec6a13cd4be9cc3e694490d9372c4fd2f",
		signature: "d75bb317896e452f96df982465a6b537e0031ec93f3cafcaac9432d9e5c2ac0b2f1fd76f557eae9892e2a3ab875ce749734c166844b78c6afde7ad503f2d0219",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02d3af99aa7e109dc2fef97d43894714cc5e5bfae809bef017f2e9b42864b4ea4e"
			]
		},
		fee: "0",
		id: "8b43eb5966e79bec80b255164d006befe74a12d1e18791821e6c261726fcbb8c",
		network: 63,
		nonce: "2",
		senderPublicKey: "02d3af99aa7e109dc2fef97d43894714cc5e5bfae809bef017f2e9b42864b4ea4e",
		signature: "83391d19a56a1097b9a820784fe9f2792a50081e4a5ddb1b1d8334fd8a874be5919f6a2d5ecc8685508bbadb7c1f6923b861a610dbefdf688c43a7481c070e49",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03f1cf7c43fcbdef9c27406da3449d867a3204d816fc898be1bd425db075e7b13d"
			]
		},
		fee: "0",
		id: "caacc9f14b540ed8fad1730872f842b0c5cf344fd812d235b7fcc62b087849de",
		network: 63,
		nonce: "2",
		senderPublicKey: "03f1cf7c43fcbdef9c27406da3449d867a3204d816fc898be1bd425db075e7b13d",
		signature: "b14dcba804c7bcefb0d2625456f835e50082d31e8dc2f27077e2f6ea6224eb3c0664aaec36df0639cb016261f88cd7f8826fdb1f8a4816ad3cb5a6057d23bf20",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03bb00c665f6a426beafb5de3e2d9ef2ff4bf497c2c0e2f6040867c726bd4ee8d6"
			]
		},
		fee: "0",
		id: "3f201a4cfd837718d4f95eb89d0e4b868748deddeac7b68aaa186c2f14f9b801",
		network: 63,
		nonce: "2",
		senderPublicKey: "03bb00c665f6a426beafb5de3e2d9ef2ff4bf497c2c0e2f6040867c726bd4ee8d6",
		signature: "11d5d90d5de065dabc1fdb4482db079ddb671eb3f75be1482faaa486d9ff40c3eb9d1104ea3d645bf6e96b74b17e9119c06ef917f74fbf8953bd761d36fc4b6b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+033630d8448ff8d24a3ba8cc1bf6ddf5fcffc48ca986cb400a98c977751cdc9d2a"
			]
		},
		fee: "0",
		id: "d6c648744a0b873085fb8801f545ccaaf00044caf629b101393f7e31f3b17863",
		network: 63,
		nonce: "2",
		senderPublicKey: "033630d8448ff8d24a3ba8cc1bf6ddf5fcffc48ca986cb400a98c977751cdc9d2a",
		signature: "536665127dee122fb55e22ac536f1ddd617f5aed9e37d00983dab9cdf60e6b1fdf27336b1463ebad48276f79c3aebd82ff11039434b345710aafe7f619643c2b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03994940d61b45321876c3bff533fecda03131cf61529b54bedf55e4d84856dd15"
			]
		},
		fee: "0",
		id: "f3528bb365f002d301711bcc6927f233c0fde839244c92774b86254ce8f23687",
		network: 63,
		nonce: "2",
		senderPublicKey: "03994940d61b45321876c3bff533fecda03131cf61529b54bedf55e4d84856dd15",
		signature: "9cfe3796ae673967b33bafbe4cd8edc2a8084505e3a760d9747e6d8101fe8ea8f9d3c255a55ec56b6cdcbac8f9de69f7515f4067db7b51d57177112dd9f66cd3",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02e28757d5d24523d62f1018bf68396c17857b19fe28bfaa4e81d4a05f2e3ef723"
			]
		},
		fee: "0",
		id: "6a657884b5308646985471495c947bb5a22133f1b3bd175886970253aa9dcaac",
		network: 63,
		nonce: "2",
		senderPublicKey: "02e28757d5d24523d62f1018bf68396c17857b19fe28bfaa4e81d4a05f2e3ef723",
		signature: "c32a29753f4766f9133f6625ebf0f6c5a6c940fe7c1fe71acc5a295c8d8a295296dee7d4c866269409523565541e4fb92d13e039de45e374febd51c85bd7bb67",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0315772d05ed0de128ff6657deeb8f8e3d44f689044d9ea67fd5a43a80bf18e839"
			]
		},
		fee: "0",
		id: "0eff2fca6949e82ffe8f5dcfb9b753117e5ff8e63c7a686534af1a7bfcc95bf7",
		network: 63,
		nonce: "2",
		senderPublicKey: "0315772d05ed0de128ff6657deeb8f8e3d44f689044d9ea67fd5a43a80bf18e839",
		signature: "0cafc98044333f14b81ab242550a7b21decd9a80e7d5b7a62f2e42e239cafaad087df9e632f714c6c146742d6cc2a3c0b85b5f9b609b111835acb7a6aa82d135",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f"
			]
		},
		fee: "0",
		id: "8320e5df0c188300545309211a1d493a4cae21b89646094f3973c19096a3904f",
		network: 63,
		nonce: "2",
		senderPublicKey: "024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f",
		signature: "58852cfe190243ed66e23a224bf495cfed6fcd949dda03841dd0501ddc1d10c2fc08414b7222f524903e209ed904be6c4435677bbf0815b522ec1b5b6bcc0c8a",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03f7130b12d4d7829510ad59624758abf10597e8fb3626c964e82400eb06436eb6"
			]
		},
		fee: "0",
		id: "6af9badd421eda35d37347fa247e133d7074d23e4ed003952b07a19a701ccb6d",
		network: 63,
		nonce: "2",
		senderPublicKey: "03f7130b12d4d7829510ad59624758abf10597e8fb3626c964e82400eb06436eb6",
		signature: "94565b1db70779476b0682522dbab1a5f3a1512cc0e1726d051d8d6e14e864c24f6ed085b773de6f4b841456a43328b3b78d2566120e2d0aadcfbf68a66f99ed",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02d4549b1a63ed261c439b1f941211adebfd02184a9f0f5b81a68231c00ef511e1"
			]
		},
		fee: "0",
		id: "32b3e46fd025c001115a74c9b3f18f1244d5399c8b01107e43bb056ed6983029",
		network: 63,
		nonce: "2",
		senderPublicKey: "02d4549b1a63ed261c439b1f941211adebfd02184a9f0f5b81a68231c00ef511e1",
		signature: "7aafba4a23ea14c1ec1934196df4ca94c8df44eb5b6eae32342a5033b034b44cc4aab0222bdc5071b41a0765a8cd782918b136408c0d462d8f4f7108cbc655ef",
		type: 3,
		typeGroup: 1,
		version: 2
	}
];
var version$1 = 0;
var genesisBlock$1 = {
	blockSignature: blockSignature$1,
	generatorPublicKey: generatorPublicKey$1,
	height: height$1,
	id: id$1,
	numberOfTransactions: numberOfTransactions$1,
	payloadHash: payloadHash$1,
	payloadLength: payloadLength$1,
	previousBlock: previousBlock$1,
	reward: reward$1,
	timestamp: timestamp$1,
	totalAmount: totalAmount$1,
	totalFee: totalFee$1,
	transactions: transactions$1,
	version: version$1
};

var milestones$1 = [
	{
		height: 1,
		activeDelegates: 53,
		block: {
			version: 0,
			maxTransactions: 150,
			maxPayload: 2097152
		},
		blockTime: 8,
		burn: {
			feePercent: 90,
			txAmount: 2000000
		},
		dynamicFees: {
			enabled: true,
			addonBytes: {
				burn: 0,
				delegateRegistration: 663703,
				delegateResignation: 0,
				htlcClaim: 0,
				htlcLock: 82,
				htlcRefund: 0,
				ipfs: 98,
				legacyTransfer: 99,
				legacyVote: 98,
				multiSignature: 16,
				secondSignature: 99,
				transfer: 85,
				vote: 98
			},
			minFee: 11299
		},
		epoch: "2022-03-28T18:00:00.000Z",
		fees: {
			staticFees: {
				burn: 0,
				delegateRegistration: 7500000000,
				delegateResignation: 0,
				htlcClaim: 0,
				htlcLock: 5000000,
				htlcRefund: 0,
				ipfs: 5000000,
				legacyTransfer: 5000000,
				legacyVote: 5000000,
				multiSignature: 5000000,
				secondSignature: 5000000,
				transfer: 50000000,
				vote: 9000000
			}
		},
		legacyTransfer: true,
		legacyVote: true,
		p2p: {
			minimumVersions: [
				">=4.0.0"
			]
		},
		transfer: {
			maximum: 256,
			minimum: 1
		},
		reward: 0
	},
	{
		height: 75632,
		reward: 1000000000
	},
	{
		height: 151210,
		dynamicReward: {
			enabled: true,
			ranks: {
				"1": 675000000,
				"2": 687500000,
				"3": 700000000,
				"4": 712500000,
				"5": 725000000,
				"6": 737500000,
				"7": 750000000,
				"8": 762500000,
				"9": 775000000,
				"10": 787500000,
				"11": 800000000,
				"12": 812500000,
				"13": 825000000,
				"14": 837500000,
				"15": 850000000,
				"16": 862500000,
				"17": 875000000,
				"18": 887500000,
				"19": 900000000,
				"20": 912500000,
				"21": 925000000,
				"22": 937500000,
				"23": 950000000,
				"24": 962500000,
				"25": 975000000,
				"26": 987500000,
				"27": 1000000000,
				"28": 1012500000,
				"29": 1025000000,
				"30": 1037500000,
				"31": 1050000000,
				"32": 1062500000,
				"33": 1075000000,
				"34": 1087500000,
				"35": 1100000000,
				"36": 1112500000,
				"37": 1125000000,
				"38": 1137500000,
				"39": 1150000000,
				"40": 1162500000,
				"41": 1175000000,
				"42": 1187500000,
				"43": 1200000000,
				"44": 1212500000,
				"45": 1225000000,
				"46": 1237500000,
				"47": 1250000000,
				"48": 1262500000,
				"49": 1275000000,
				"50": 1287500000,
				"51": 1300000000,
				"52": 1312500000,
				"53": 1325000000
			},
			secondaryReward: 675000000
		}
	},
	{
		height: 671988,
		acceptLegacySchnorrTransactions: true,
		bip340: true,
		devFund: {
			Sgymbo4rg9aBeJJ2YmV12xdRY2xo6b94U9: 5
		}
	},
	{
		height: 1175000,
		acceptLegacySchnorrTransactions: false,
		blocksToRevokeDelegateResignation: 106,
		delegateResignationTypeAsset: true,
		legacyVote: false
	}
];

var name$1 = "mainnet";
var messagePrefix$1 = "Solar message:\n";
var bip32$1 = {
	"public": 70617039,
	"private": 70615956
};
var pubKeyHash$1 = 63;
var nethash$1 = "16db20c30c52d53638ca537ad0ed113408da3ae686e2c4bfa7e315d4347196dc";
var wif$1 = 252;
var slip44$1 = 3333;
var aip20$1 = 0;
var client$1 = {
	token: "SXP",
	symbol: "SXP",
	explorer: "https://explorer.solar.org"
};
var network$1 = {
	name: name$1,
	messagePrefix: messagePrefix$1,
	bip32: bip32$1,
	pubKeyHash: pubKeyHash$1,
	nethash: nethash$1,
	wif: wif$1,
	slip44: slip44$1,
	aip20: aip20$1,
	client: client$1
};

const mainnet = { exceptions: exceptions$1, genesisBlock: genesisBlock$1, milestones: milestones$1, network: network$1 };

var exceptions = {
	
};

var blockSignature = "965530aaccce780e325e9644cfb22dc7cb1af12a571610089a964062344ae0c71d76c07e7b66d39f4508f0493568df67db34ff94db534af2b1455a16eb852f8e";
var generatorPublicKey = "02894ff000fc33762e3e44128d0e335bc00eaa4c9685a56f129fc6fe0e225591f2";
var height = 1;
var id = "67f1670217183cddcbb1e656abb99205afc77db632be56a6d01f509b69948f7c";
var numberOfTransactions = 107;
var payloadHash = "72db1365ae549683980a8e29ff744c6d4d9920c3cd215e462f40a58da3f13dce";
var payloadLength = 15494;
var previousBlock = "0000000000000000000000000000000000000000000000000000000000000000";
var reward = "0";
var timestamp = 0;
var totalAmount = "52073757600000000";
var totalFee = "0";
var transactions = [
	{
		amount: "52073757600000000",
		expiration: 0,
		fee: "0",
		id: "baf0a184399f329f2fd463d75434926727d26a6ae3f9d606da18e808608ceba4",
		network: 30,
		nonce: "1",
		recipientId: "DRcxJdooHZTFQENNyhoc3MMYPd8pMVQ6Aw",
		senderPublicKey: "02894ff000fc33762e3e44128d0e335bc00eaa4c9685a56f129fc6fe0e225591f2",
		signature: "f29820f6f9a85607818ed6feb85265ca8b00da1860fa76d40d8823698fbec227e605c3fd08a160518dbe885f0f5bdd71902aaf01084e4f4c9bb5691735ead228",
		type: 0,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "gym"
			}
		},
		fee: "0",
		id: "0bc7759aaaee9806903b8bbeef8331955f8ce489b5584aa7348815f2e9b64cae",
		network: 30,
		nonce: "1",
		senderPublicKey: "03ebcafb1cc44c848851352476c84d38c4fbc1b8661e13771cf4ee04324d8d170f",
		signature: "57a54b87f92c39c82f684add512fd26f0f67036456914803dd90a4a66f449764e4232c409f6f6607221b72b3e42b33438ec2f9664ac3b630dde1d64936a13abf",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cactus1549"
			}
		},
		fee: "0",
		id: "4d7a184862ae29d495b173873fbc6423c0374c733a11e3ce064f8fc256f79308",
		network: 30,
		nonce: "1",
		senderPublicKey: "0379ab6557b48f283dfcbebde9ee7c98c7249c5d946a5fe67d6f39199c39f5ac85",
		signature: "61c2e60aec69a376126f1a7a9048c2d90cb6f84be2c659f7467bdef39857f007edb7183c83de44480bac0c32c42e40c690fd0b8fcca2ddbe92b7ef48d30847ef",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "palestra"
			}
		},
		fee: "0",
		id: "925acd8d61326cde1dcac9363a33a1b660ac78315a9540014553d71f993e5d24",
		network: 30,
		nonce: "1",
		senderPublicKey: "025a633259eb8689fa166f00a6c8fdacbac87a0897eaa5860c17a683c30be3782f",
		signature: "90dfd13ea99280cdd1d31ea01d572db3818c7d36f731ce2501caf663bb0120e9c0171f54dccfc851eed6ce43dc18e22117f66572fa60d1d9a49c0b7ed3df9a4a",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "genesis_0"
			}
		},
		fee: "0",
		id: "63c51d3b57b5503b0adfa6a47132f6f423778f96fd94896be4d2293540458d35",
		network: 30,
		nonce: "1",
		senderPublicKey: "026fe7646141739cbd9043884ba42d5a8d564b4d2a18bb13c58d3bf49220976f60",
		signature: "3096d077f571b257ccd5e941a19048762995427683c25448324dd8a8f71337132fd11af4a60a686eb85a9afef95381d48e53262bb6235b75c97c2eec289b2116",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "alessio"
			}
		},
		fee: "0",
		id: "ffd2cd616a83bafdf5aa1076319ba2f52e286c1ca8c68bc5a9fd89a3dcd8e0f8",
		network: 30,
		nonce: "1",
		senderPublicKey: "025e69ed84f036d8e54ab0b95458b9e13f1bc1a79607d798621561b755d7798433",
		signature: "9ef830e539a9bcbcb85b16262ac6cd7b636bbf53bb3de520fa23b7ba8bea0d86f30d691eb354d10160b53dc434aff5cd8b61ef8604340732c88ac8ced9db9815",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fun"
			}
		},
		fee: "0",
		id: "2feeb5b591f466e509d3fe44ba23f0dcbc65d729e8a2f62762a9cc4334f1f2b9",
		network: 30,
		nonce: "1",
		senderPublicKey: "027e5738ca38791606e9004982cc7113c97dfe8df495182a99b5fd6000e755877c",
		signature: "5c644354857b8e678fd1b6417040c5df3938ed42c23867f0866e3e47ed2d2f16e4b3fd42736c9b1263bbec3017ee95d5a171f0ae3a0d773beba5cb82831c3ffd",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "biz_classic"
			}
		},
		fee: "0",
		id: "af83d26417380a3233de7f4f109e2d1c69aa8f0cd53f09798e17c26888e86b5d",
		network: 30,
		nonce: "1",
		senderPublicKey: "03b8051f4bbf3400b2bfe44b6869e39af7910665273aa3d984b6825f5f584ddaec",
		signature: "fb23c7f50dc8367b843c042c1b8fbb4e6401d15b73c0fb0741c4cf38687bcefb45316078a85b99bfd79056ee0ce7355a3b742ed346e79989ccde12dbbbc511a0",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cold"
			}
		},
		fee: "0",
		id: "7099d86d160d8fa52e3ab9e62272cd3ca6e144c05205236838ea92f1783509e5",
		network: 30,
		nonce: "1",
		senderPublicKey: "031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b",
		signature: "02f3d4fd6b2fd4e9826417d048177ab1da9630da0a52dec55ded7d26acce1690123ebcfc926bf0859387e4ac006e087a8a626bd9f3884ea11bda3f5a7d4d0e25",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "mtaylan"
			}
		},
		fee: "0",
		id: "6fe4c77016b21d573d5292e8e7bb8aba042dad55b7775fce3a44a6177703034b",
		network: 30,
		nonce: "1",
		senderPublicKey: "02b15d3505081f930d7c7d4f02005c0561d2da4bf1b5af71b05a5b67742ed1d134",
		signature: "53fdf95d5a3b61fd11d7f42500de323704d514f8f414d368a28aaff1f50da1848725ba00c825c7f4d5f12998be136a228008805248492ca67e23d2098eb2a18a",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kippers"
			}
		},
		fee: "0",
		id: "ec88794f94b484867b8b1f70836f004e839dfe97aaf4760d8405685ee5f6a491",
		network: 30,
		nonce: "1",
		senderPublicKey: "033a3257673d0d5b13563b0d9efe00b211a7a9ed3680b8f9fead773f6fcdcce416",
		signature: "40a894546d9635578e63e854ccb8fd1a15acdcf1eb4c3a585ab4de8bd8fbe756132749e7a8b02fbb624880a0a40c7ddd08f2976db2ffb8fc29a1ccc4538a6ae1",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "arbaro"
			}
		},
		fee: "0",
		id: "e7fdcd88d2c49ecf0665ea078fd50589e02fad3274914974e5622c51b0b2fa58",
		network: 30,
		nonce: "1",
		senderPublicKey: "0359448011474cf2c25c29385bc7883ecddcf6ed14a5759151b5ad8d8c05121987",
		signature: "a288e9c95f27f0a9852a8d15f97a15519afb3e09e541b9cc69cd424b2c10537c08255fac559d21ea464f73553f20a2930612cf953e5e62f8842364eac088e4c3",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "bfx"
			}
		},
		fee: "0",
		id: "118d7f8b1395c1a7b13a3885fbe13ef17629b7b7c26522846f21805f1577e560",
		network: 30,
		nonce: "1",
		senderPublicKey: "027125dab94e1c104e0e117d296fcffc93a8b15524c17924e9da742b116f83f514",
		signature: "d07843624b6b2e13a15cbf2b4595d1b88eade56467008e439d27f7610cb2e4f8e80c61cc63f6ec033b30c4837aa2a8eb0536331bdb253b5a718cc245dd3195be",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sircashalot"
			}
		},
		fee: "0",
		id: "d9e84f57332e7695aabc1e441009f9f88529210324749bbca08024d24262aaca",
		network: 30,
		nonce: "1",
		senderPublicKey: "022937626547cbc91ff64702c33332380d73c146528e0090b85d62fdec77cfb8da",
		signature: "9e6996c5f6d5073188c4870fecc14420dbb1a57f3e5cc84874b6ca785756e0e5bced3eeed7cb7068b4b029e0f2b0d7747655271fed87582eef9d29469d94c174",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "hello.world"
			}
		},
		fee: "0",
		id: "663fe48f0b4cc8afc7b12d7e6b35ae1ab166b03afb8d1976a77915429368bd59",
		network: 30,
		nonce: "1",
		senderPublicKey: "028a945e9f8bd9f9dacbb9714c59432461cc5cced6d4bcd0f0fdd595b3d66bc4c2",
		signature: "19d233d3846a90d79860a392e4f52a8d7b605421d158cdb9c9e776dac050e2dbc0064a8aadde4364f8f8160a6450563bb2bd8e9bf6f2ea40540a5a67143db06c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "solar.tr"
			}
		},
		fee: "0",
		id: "71dc9d1eac081ea865395aca7a860cb70dabb7dd616a0db108552b417ecea18e",
		network: 30,
		nonce: "1",
		senderPublicKey: "0232a2017507f61e369bccb324246092fd3952abec1c98766169b05b8d022f2915",
		signature: "ddfd7b97e1d2818709a4df021386506d307c9425dcc63228ab889eb6b83e61dbca6613a0c311fdb65d0c2a337cbca7e5ad2761e05a4878aea2e1a48380c6e2ec",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "osrn"
			}
		},
		fee: "0",
		id: "d413de321cff6f95ae6e670a5e7eded1e82ad8364b9ef487a668eb04ee792c53",
		network: 30,
		nonce: "1",
		senderPublicKey: "03808a5c40f630d79065487b2855af909a7d1215d2afe4376e0295e55e7ede4758",
		signature: "6c9047d58a37d97b832e999708d6bb592e4cdd0c1e99131b7e550c7f673fd558061627fec8a18c05e17031f81818c0163476a4ef6b8ae0e2c6c44c41f6706772",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "exolarite"
			}
		},
		fee: "0",
		id: "fb676f45ad6b0f36769a8616f40f9fa8e74bd2e708536084cd07625fdcfee170",
		network: 30,
		nonce: "1",
		senderPublicKey: "030134fd6bf65b0e42a2fab31bc2dff75656e802c397f57d3cf214686fbfa94086",
		signature: "06ab134a0d3718fee2a7869f6220f074852b394b5c8068bc03dbb20b988a7c1067cf043367f27daa6c5a8096860e42bff3c40eb56894247b431a84042d3b1a9e",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "thamar"
			}
		},
		fee: "0",
		id: "8387a8df876100a1f1cb5aa21cfcb7d46619e7084bf3650667250b7473f57cef",
		network: 30,
		nonce: "1",
		senderPublicKey: "03113e018838e922011e8449ecce533a21b38557ac033c03292540305fc2609f6d",
		signature: "30f6ddf00d9944d59562d6ae96b9fef5191843db5f0208269a1bcba12e14e17e7bcd8da1ac3264174ba66a16ca965d2916b2469f34916c76620f06c1f11f0ac8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "aurelion_sol"
			}
		},
		fee: "0",
		id: "defaddbcc7686848d517e53ab66600c4146ef4860a2770f25916076d9e1f4954",
		network: 30,
		nonce: "1",
		senderPublicKey: "0307bb25b64d31a14928659034e25d81557116355b7685ce2c5ee9fab84ba2c116",
		signature: "12c87ea3f4b7d1b0a6b4068bfcb1f9663c682681204fb8477ac2b1698a138ccd6c2b1ace5d21be63b172129bd4ff4e4991bd1e704decf57bc0d961be6797f15b",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "lunar"
			}
		},
		fee: "0",
		id: "94cad942afe61e124fea26e5b9fa57439b0512f427677970fb8a117440034e91",
		network: 30,
		nonce: "1",
		senderPublicKey: "03cd846b3b97a3ead6ad7bf9119a8ff2eeabd77f30de62bae95b8f6bee0c05bfd9",
		signature: "9694538e6123d5bb71f907925132b00bff9109b2ef75ec80f7c4655a769fc2ac963c2c6602f245888d0c0f5ba71832157707825ff2b0c389470685598e2ad098",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "friendsoflittleyus"
			}
		},
		fee: "0",
		id: "ce625654c0b273c14c92f6d1cdd9597b2e334e0916cde533339e8ba49367ddba",
		network: 30,
		nonce: "1",
		senderPublicKey: "03aebd4e0ea4b0eb3ad5ce7870af32e709fcf4d65ed9c9cb383aea83c687e1e1fb",
		signature: "4a567dbb99be8be5d24b766d4b6a567fdbd757d8ea0b27ff305e2ce7cea9e67972aa0706fb2b2e0d08033a8e213fe80895959d1c8d15fb69b9bd1ea53f059d93",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "arktoshi"
			}
		},
		fee: "0",
		id: "3efb1458db8c153ba4cb5bde0b43e33f4b6412d9537e4530af5c068a1079b2c0",
		network: 30,
		nonce: "1",
		senderPublicKey: "0279c945a624b227e6ed5d41fd990b9753e5df730ad476b263f5036da22586c405",
		signature: "e17ba19cb8474328b0270c3f1d071741e63bf2ecdd173913ef252a601a13edf57192680a2b729c0334b9fe4597e8b99e4f73efd9da7b16192c2a36f624bc5014",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "goat"
			}
		},
		fee: "0",
		id: "c7d2cadc4953d8d0e4cc41e6cd1123b1b37b7b908151fe1c4d5dbd4c424038ca",
		network: 30,
		nonce: "1",
		senderPublicKey: "031477d80e830014615ad7f32f252da80559c7b94592f4d71530931b8c6ce9bd22",
		signature: "6aa8bf4060acd263c15464d2546b706bec39cc5f7c31f3a92d6997e1f19515cd6c78a6188e6d3dce539ab81d724b575949fe6ec3334ca78434ef353dfd94ac41",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "toons"
			}
		},
		fee: "0",
		id: "bdb5a4ba2b3ead049f198d6d97c5c647645df2a14578c9c2ef6ca30175b559a4",
		network: 30,
		nonce: "1",
		senderPublicKey: "02fd789914166415c70f77f3a3de08eeba810be4958bb0107b8a396e1655080c05",
		signature: "6a2c6398948411c965f8c71162db441c7ce9b044d3a2669719247242e95f4b5b2297d6aae18ee83bdfd09f0f4c181bcc8d2d034c2c220b112998da72f8c35a3d",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "phoenix"
			}
		},
		fee: "0",
		id: "8ecc38a831499185508150dd7d7cbdf71ffe024d2de21ecbbb72e201acd63058",
		network: 30,
		nonce: "1",
		senderPublicKey: "036abe1469f7d1569d0954a73f165970b7c92aeb3f537b6816509da0a74eed0039",
		signature: "bae3482e9d64e6139b99f2cfb36ff03cae11997d88ddd88f6699860184831d86b301bb25080a88d793d8f542107b8d6169b5ec5474eb079713b563a60ea151ff",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fonk"
			}
		},
		fee: "0",
		id: "2412abab4651d255a83f7df604b5991bb470dd5cd653887a90351be0fa447db0",
		network: 30,
		nonce: "1",
		senderPublicKey: "03a69af136f6a861b9f7d3412582a1a24df27b372e8933065109cedf9fd3c60a6d",
		signature: "be6b3c5d924ca46322b8ae16e3416410917881b5a0175d2e49764368469f6681e6a65ed3c2d0660a88a4c78f86b550af8d56770da8b47ebd6781e3de48d9d3be",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "blues_for_alice"
			}
		},
		fee: "0",
		id: "36ba25b15699832058d59349ef153272bb8aad985727c6a11c31075acd960fd3",
		network: 30,
		nonce: "1",
		senderPublicKey: "02531414232c9ff0c3199c536a904be27d9ea671c0079100f2ebad8047d43557d9",
		signature: "e3a875c099ee25af0816ee178856e5a24d609dbe8a0154211fc075ea66f027403df5bca54105930b6c8a63a44db3d4d9bc9c3d9dcd551a49c2aa65dd2804a4e1",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "lucky_delegate"
			}
		},
		fee: "0",
		id: "90e115f077565f51bbf3a9a1f36132bdbedfb79a74b6c7fa5550fa34304970b7",
		network: 30,
		nonce: "1",
		senderPublicKey: "03e79c16da8c917d95b49466e2d8414d0ab55f3d23e2e6e531aa1a98674925f889",
		signature: "8b12cb1bf35e15a86f4036a11dc99e2c05e3eb97ee67d1c43a7ebe2229541904a38482f5015eb65439052a23ef3c66b1da7b81f4662cc9548bb35f5e240e4c69",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "xiggo"
			}
		},
		fee: "0",
		id: "5979c9db8a677d0fe338e83752854ce7034071916c23b54e59b1b1d99529a907",
		network: 30,
		nonce: "1",
		senderPublicKey: "0367b945a0e4fc3cea3f45a4167ad8064c1b5bffd1958290524066e39ee2617e7b",
		signature: "df436e9541a6db417d714151fc192a6e609f512f7c8f50779ae14dfe4bf65dcb8316eb0fff0b664affe1dc3dcd9e056a4716e56e86e207c5306a4d6138bc93c2",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "wevalidate"
			}
		},
		fee: "0",
		id: "7414cd5334d0ce33f1e588d2e9bc68ecbe6dc67ebb64935958c1d9ed72708236",
		network: 30,
		nonce: "1",
		senderPublicKey: "02b4fb83825cd86f2d2ff42f81084b18f0828822902e853069f8fe295d61cbe5ad",
		signature: "51c597000dc15cf58be392a4b0b873636b8761291dec7d23c62a37bee6606b100d4e0ce5cb8f26f38790db4e48ca59c1aa5c97fb8d2cbd08e2c98effffed41d0",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sigma"
			}
		},
		fee: "0",
		id: "fdea5c2c7be993638f3755f998db3e4f859995411e5c649afeaae1f38e9c939e",
		network: 30,
		nonce: "1",
		senderPublicKey: "0320ef5adaa1d8ef888d357591d6508685c3e2caa43eff86714eb01367f2fab9c6",
		signature: "e452c21a4ce58f55f2848f9e5ae35157d6fe83dd8c25712cde8aa61ce248f086d7b95fc5b1ee97ce4ff27fd96d3026ae71acf2b865e0627cc6b788e766c77552",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "st3v3n"
			}
		},
		fee: "0",
		id: "73f04b58b34e64bba6004afe06b3e4b6abbcfbeb1e7bb15239767d7a6109ba28",
		network: 30,
		nonce: "1",
		senderPublicKey: "02104c30143291ddfaa35caf1b26f1199994590abb89b62a3b31fb27d3fcc28100",
		signature: "e932658994d6d12454450573572e26439af44750f04ba2a6327e22a1e6fb3174af1dd1b9c841124fd596f6c9088419bc92d0673b6c9ab2fe2b6db70d312703b8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "advin"
			}
		},
		fee: "0",
		id: "c3e9e1336896ce5364fc51fa3732acb518e4916c7ee6a608717189c2a6f527f8",
		network: 30,
		nonce: "1",
		senderPublicKey: "0261ed68b8a750d1bf0b2974d87e1175e577f149410a1689292dcaa4f516fc86a0",
		signature: "641d797ec54e6a6bb22412ec85ea321871c238d9e11abd3d777d2621e7988f804d88d484504b0866725864babe3412c11541a4843556fa0b96f9c1cd4b5ede2a",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "motolaji"
			}
		},
		fee: "0",
		id: "8ffa6178ec636d27b21d12231d94170c97ec84d7a2933919349c878dd6c6dd10",
		network: 30,
		nonce: "1",
		senderPublicKey: "02defd853ec34a2c3bffe04ced8e880f6391ce7be9f8a077fa35ef968ef28bc019",
		signature: "f79fcf5f2da24054017b49207af4116faf14293a874eb4dc679e1438deaccb4962b111c54ca2acd9a0b783a1eeace3a92a4772b7a960001af67de1eb385b069b",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "deadlock"
			}
		},
		fee: "0",
		id: "45a7b5aaad441768dafff2bb9386ab5cdbad9d11764efd9dbd4cec4685df5434",
		network: 30,
		nonce: "1",
		senderPublicKey: "03dc8fe7e4d51c983f03eba20677140d981f6f07c5acab1fdba5cdaeaf373363dd",
		signature: "c45da0e83989b3370580efd7e9bfe3f163710ae5346fbee3ae7165b0eca3468bfc889ae0df537047e1a827fde4fb656ad68e12c2ab981223b03be6ea2f27a9d6",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "nft"
			}
		},
		fee: "0",
		id: "dea35ca367f2a11df638ead5cad7864f980f892013715df0889346ea0f670591",
		network: 30,
		nonce: "1",
		senderPublicKey: "038f65762af6387845f4388a5c8f7585a05cd70f49256ae5ea95f3aa8cdb468c70",
		signature: "d7fd95f0b060ada1cdad3550d159b3e4ead04b478d1dccbbcda419a8d16dec2a01f5d9ec75fef0eeeea0a583cfc328f7e4749e0b7a17ff1149e791e088f60b94",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "minnie_m"
			}
		},
		fee: "0",
		id: "0edcdeebc4c1a8ed785ab94681f95254d7e64a714a20939740b924f3f629c662",
		network: 30,
		nonce: "1",
		senderPublicKey: "03ea8aad51c3a5befc027c53693841b4d75252230ac12db4fd2cf870c269d5ae13",
		signature: "c1201aa9cbc02d8e68a9b6762f3764a6f6f6498c4823588ebe12bfd9fffc700421e31fe51d42caf292a6584ada9c860015f4ba874497126df94be7cec082c075",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "balu"
			}
		},
		fee: "0",
		id: "2343e098d6ff2034fc2df03d5b27db00ad39658eee0539dcf9d18c68abc1ba14",
		network: 30,
		nonce: "1",
		senderPublicKey: "038f46041c38afd763db9119f07293321ea47d78cdca8bd752a01e7c8e17df5994",
		signature: "b6e23db66619c811382851b8de007379accdf2040742fec5357b40f955c557e345b8c7d05355d37a2d07a3b8baa1018f79944002abbf052f2db30f1e5d4fb92f",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "lemint"
			}
		},
		fee: "0",
		id: "fea92209f1186e332ab685a9eded2d1bda3c5bc61c5d4171e61e8f43ae630997",
		network: 30,
		nonce: "1",
		senderPublicKey: "036fdb49abe519cb3b2dc439ca62954a5ca8d5e20c66bc1818769bd0e9fbaa1ef6",
		signature: "076f1a65c003c54eb1a1025fb0e55590432c6c88ba4772c84f5de8a4cf1b25dccd2e0c5aa14e7b2489184fc5b68c5f05f3c20bcea38495ad7f70344f1a8fb9cc",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "goose"
			}
		},
		fee: "0",
		id: "583fe0142f64d6ffc7599f0bb91347ab32e796ad6c9cd6486723d03579fa9be3",
		network: 30,
		nonce: "1",
		senderPublicKey: "0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785",
		signature: "d68dd4f1aa30170c52ac1f8be62121248be145fb32ec7fb5611a7b18b35b0c83f9fe026b42b5439be89ed98fcefa218313220c88bacbb44137d5708d2bb178f0",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "fnoufnou"
			}
		},
		fee: "0",
		id: "957f6d63a2c482725dd66b6230ee96f611cc9d5024482958754bae3bcf795c6c",
		network: 30,
		nonce: "1",
		senderPublicKey: "035fedad8a5f1d261c5a7e60e55cbe2a6214811c4659b57758a1958025af49337d",
		signature: "56e28e0f8484d41bb62ea03f293d16d0e1a2fba7a266d7f944d5111c0df639d58971cf2035223e817752c75e362cbf0972c134c08994bc54f67ddce2b1f3dd0f",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kimchi"
			}
		},
		fee: "0",
		id: "591ae79166bf0f6ba1b109d169d1bf5f383e38f074600652c690eafef392fbc2",
		network: 30,
		nonce: "1",
		senderPublicKey: "03952408b5468de16dbdb2b5c05b3d3e11c07492a93bcbdd442c85d46b4f58131b",
		signature: "a5cb8a318cd25089e869f8be5aa1c9464d6148669bee610f9fc5631b30ade26a224194918e1ef0595a2e71ab96d478ea6d1dcd268c95764b4752f1e1f19897b3",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "leitesv"
			}
		},
		fee: "0",
		id: "53370837a34885e866c304578937b8a5b9cb99f62f8614c2b748dcf5b953989e",
		network: 30,
		nonce: "1",
		senderPublicKey: "03a7679cc437716eb969f241a55dfab714f08bee7aa8e9203e7982de282a4ffa4a",
		signature: "1bf197f816ba2bb2d5dc1c975935b2731d216a64c4dc1c601cfb2815bb476b85a1e2c0415a5b77687ecc8433e6ebdeae079e9e28db16db6133d2f8a059e65c34",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "beta106"
			}
		},
		fee: "0",
		id: "c1c24e4b41164ed3c404962ef3cef8057d43033c73f0db82e42caf10857e2937",
		network: 30,
		nonce: "1",
		senderPublicKey: "021ea11edbe1d10af043c4bb17506d4ed623ab05eb042d6ba40c8da06e5cbd7405",
		signature: "9f8da100b4db687b5e29666bcc4687d6ae62d53dcb337416520e08f2c8d205c7811847e09a6391f4c4d9266613f624e31449f78c6100628a45335e5b30cdf47c",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "pnwdrew"
			}
		},
		fee: "0",
		id: "3e256f5a227ba435ce43f4a28d721d7b5f3a5809826dc2d3d8ca4ec56b4b4bc1",
		network: 30,
		nonce: "1",
		senderPublicKey: "0222400260bc6f211c269c3ebba2af36c99102c046777193393643fc71502d199c",
		signature: "63b00b162923b6cc952498be40c034b9d3accddf8cb36a2db323400f97cbebd20f321610d45bd3c41ec0acd321d1db54af8b6716332926f7b67f4cf4e29df765",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "geops"
			}
		},
		fee: "0",
		id: "2b4655aa293042e699627e4694668246ecd80174ef7e8527e323f2486b29a28b",
		network: 30,
		nonce: "1",
		senderPublicKey: "03c1543af88bff6f554d0d1cf2e13030a890c2d0ff3ae3a1d8a25eb732cca91c0f",
		signature: "7953f8d1e6626ae9a1194821786bf61a98c2941de69b80ae6e0a235e621401f4c63af6dd4d4a13493549a00c49994f398529681507ea24394fe3993a8af5ec83",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "dev51"
			}
		},
		fee: "0",
		id: "179f1b75a8964fbc3d05d612d91592d12c7ee89478b846c4dcf71f35f526ef2b",
		network: 30,
		nonce: "1",
		senderPublicKey: "02202ccaa704a060030ee111e91c4073f3a5d26291e5ac48a8e80cc91fa22da771",
		signature: "66f8a5d495b8679ec164b48d6ccc0b521d607207e4824d239272cad79a39d75d009a2f9813a4dc7f3f9a17d222c6c21687cb8f50c903a7efe55edf6eeae14ff8",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "sevi"
			}
		},
		fee: "0",
		id: "94082fe1a7f4abf740b896440df8915b3a68230b53c5a06bc422304a8e697c7c",
		network: 30,
		nonce: "1",
		senderPublicKey: "0308ff06ba9c37c43558b12d8800dc57b8937a30c6d31d204158f40001942ddb3a",
		signature: "be3f7c7e6a4cd0d113e4595e76ce461a475ffadce4ed4fcef0c18bdec8b6a7be003c7c27ca639d3028530f36ab3e965b6154b5567d39fe056bea5a4bd38e0051",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "stay_tokens"
			}
		},
		fee: "0",
		id: "0bd9e84d845d5b02b89b30c098ee7b3e7eb21494d836000d7c82da75fee00039",
		network: 30,
		nonce: "1",
		senderPublicKey: "024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f",
		signature: "970cd1af5557572aa995bb7a697778d15c99e893bac59549b74859eff19665bd1d67f556e35e02332ce785a5cb389770b2bbdb8611ebf9f52fda64031fbaa2b0",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "yieldwallet.io"
			}
		},
		fee: "0",
		id: "9692f89b46aebc243667de83455c96af4bcc987a985aa1d60c5203d51849fb07",
		network: 30,
		nonce: "1",
		senderPublicKey: "03bc5a7880073a71639be48c6a2c8371f1d92591aca962cab71862926d9081c99b",
		signature: "4edad92f2acb0fa2a53b30e5124e6e988c35eaa6d598bc97b87b426a71e398aca1da3af341a6e5e42d0c592811fab7dc095bce6dc269b883d1e2312445755818",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "axel"
			}
		},
		fee: "0",
		id: "5f8cab7d75eabfe8f64c5273dec56510de042799dd6882e2cd7c9e99b3aa8c7e",
		network: 30,
		nonce: "1",
		senderPublicKey: "02c813fc7a8fe61346af300d5af32dc83b3def9bf9c7cac7572f4e9a258dabbf07",
		signature: "e71af791497b1d6df030b1e82b6a5c4d453e02f79709ae37c3f35c1d73d2cb67be1180a60518e6c682f91f38aaa91cb2c86585b198e5903ec7d82f23429d5f60",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "kaos"
			}
		},
		fee: "0",
		id: "044f0cf3184a27878e1b821f8205048fe407f05d9d8ecf63c6520a745f85139a",
		network: 30,
		nonce: "1",
		senderPublicKey: "03668fed483d0d37967183a968ea456441b8d85a348c74d80212e6fbb9adabae46",
		signature: "1f1170db3c4335a4e4bc3029ef1e7ac1faf786a9e8f4d1d7cf21a0d64412f07347a99929e137aad1afd66898deb915db663914ef0703f995f31d549015071be3",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			delegate: {
				username: "cams_yellow_jacket"
			}
		},
		fee: "0",
		id: "25b3e700734201dfc6c2b4f44a0c3e78da2e6f8966ea0d6195614c75ccbde0af",
		network: 30,
		nonce: "1",
		senderPublicKey: "036cddb79510f5ff9bfcd1b8f04ed565806e70bc9195b47e7b514e49f642119d62",
		signature: "3102cbf75c546a783e2cb2d7fb33afc513dea57efe267c4e9714e42f735a066c32ecae7a5fca5a89e2de34f40287fd83ca31c6da96b7a3b08f407dd19ebe9e07",
		type: 2,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03ebcafb1cc44c848851352476c84d38c4fbc1b8661e13771cf4ee04324d8d170f"
			]
		},
		fee: "0",
		id: "5cd8f06619cb37f6d90a5d72d56a66d9cc338510fbc8cd20a6846519c4c7779d",
		network: 30,
		nonce: "2",
		senderPublicKey: "03ebcafb1cc44c848851352476c84d38c4fbc1b8661e13771cf4ee04324d8d170f",
		signature: "7fc1469e1e2119ed7207fa92fa7a51fd9efc78b0a4cfdd789e0cb483557478f97ca6126aa7c27ed3d9a87b12b30d666f9cba9e3c4cdfa2843d3a8e78821d23c7",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0379ab6557b48f283dfcbebde9ee7c98c7249c5d946a5fe67d6f39199c39f5ac85"
			]
		},
		fee: "0",
		id: "d18d86f11d7c56bc1b5eb727212428c428d729b62d4533bb3c06832582ffffee",
		network: 30,
		nonce: "2",
		senderPublicKey: "0379ab6557b48f283dfcbebde9ee7c98c7249c5d946a5fe67d6f39199c39f5ac85",
		signature: "8ceb41716caa42c4a0c65b93d816b2df220d9062c22521d49313c8d4803b82116c5a1cc54b18f688deec786b34b8e84705b5093cdd5c3d8154ee52dcbbd7ec3f",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+025a633259eb8689fa166f00a6c8fdacbac87a0897eaa5860c17a683c30be3782f"
			]
		},
		fee: "0",
		id: "99359490a7a3b3a474392d255ddc4ae09fedaeeb3ba101283c117aec653647b5",
		network: 30,
		nonce: "2",
		senderPublicKey: "025a633259eb8689fa166f00a6c8fdacbac87a0897eaa5860c17a683c30be3782f",
		signature: "abcbf58c5fa47f2ea871397740e885b31d56bb7217cd1f87e03b16afafab9ac984c00792dd2970829e4ced039dbcfdd925192c039ef9bd38cd5071a200144f90",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+026fe7646141739cbd9043884ba42d5a8d564b4d2a18bb13c58d3bf49220976f60"
			]
		},
		fee: "0",
		id: "1069e4ad7c11963a17be299fdc11d6be2658593fce1648ebe2c6595a62366968",
		network: 30,
		nonce: "2",
		senderPublicKey: "026fe7646141739cbd9043884ba42d5a8d564b4d2a18bb13c58d3bf49220976f60",
		signature: "9496569b0d803b17cc7fe85292093bc7837039ebead150d7206cbd80339ccd74d180a0ff580c353d4876081d1b37c18793603c11c1687299be3bfcef7f7fe306",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+025e69ed84f036d8e54ab0b95458b9e13f1bc1a79607d798621561b755d7798433"
			]
		},
		fee: "0",
		id: "13268d6ca43ee2db0e1f343a69228bb16e078a84410ab563bff067a8a40ed473",
		network: 30,
		nonce: "2",
		senderPublicKey: "025e69ed84f036d8e54ab0b95458b9e13f1bc1a79607d798621561b755d7798433",
		signature: "716814b623b799770d5df234b67fbf984f564b08acc19eb8130f80de6c9a65c58088d98dd6cb60afe8a3b93e4d98059eb36d1c6c9a1c4effe4d1e9acbf6c9415",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+027e5738ca38791606e9004982cc7113c97dfe8df495182a99b5fd6000e755877c"
			]
		},
		fee: "0",
		id: "f4c449d4e18087c97861764980df2aac41b12416dbae9a12042ec7aae9139986",
		network: 30,
		nonce: "2",
		senderPublicKey: "027e5738ca38791606e9004982cc7113c97dfe8df495182a99b5fd6000e755877c",
		signature: "49ea6ed774618e3d2efb2df9d4894a26cc186154e488a055134028f9ed47250a49947c788672f0e5e855f4800023300bb718fd515a5bae5ef917fb322fcc02f1",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03b8051f4bbf3400b2bfe44b6869e39af7910665273aa3d984b6825f5f584ddaec"
			]
		},
		fee: "0",
		id: "7b16e07513ed41ec3c79ce5c2d9a40618e97d99823d0b879675207607509eb81",
		network: 30,
		nonce: "2",
		senderPublicKey: "03b8051f4bbf3400b2bfe44b6869e39af7910665273aa3d984b6825f5f584ddaec",
		signature: "0a6fd32988872591a0e6433fd401412cb99cb07e8b612b40766c93fec2ade55b7dca88436f394e9c5693bceff6a189c35d8bd759267e9a77daed3e0914e7043a",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b"
			]
		},
		fee: "0",
		id: "68ac5671e981ac7dbc3989631bf63bc18cfaf456a4413902d0904be9c5d59d30",
		network: 30,
		nonce: "2",
		senderPublicKey: "031eadcaba63229e12a41d5c31e498d3ed6f71fa80c31f3adfbffa9c3165334a5b",
		signature: "e84908476941844af3e623c7285eebb690c1e15b577a1e4d5fa66060167b364f6e2161f51fff0302e1b05d3044dc24b0906a1716d8821d46297cbfcddfa35567",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02b15d3505081f930d7c7d4f02005c0561d2da4bf1b5af71b05a5b67742ed1d134"
			]
		},
		fee: "0",
		id: "38b8e1e54cbcc24866f609868f775e2c0a6ebd8cc83df516b503391eeee25a96",
		network: 30,
		nonce: "2",
		senderPublicKey: "02b15d3505081f930d7c7d4f02005c0561d2da4bf1b5af71b05a5b67742ed1d134",
		signature: "5454df2c79fbbef0af406e8a728bca8d2c91b7b0863b36c3589cf9356f02d3a198baa1b7ce30e168e4984460bc0a58d28d9053f93e4c50f1183f1294fa00d9ae",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+033a3257673d0d5b13563b0d9efe00b211a7a9ed3680b8f9fead773f6fcdcce416"
			]
		},
		fee: "0",
		id: "aaf5421f1a3bbfeb7df00e9b4f7bcbf044f2b82173d35f19d6e45c80bb06253e",
		network: 30,
		nonce: "2",
		senderPublicKey: "033a3257673d0d5b13563b0d9efe00b211a7a9ed3680b8f9fead773f6fcdcce416",
		signature: "8e579d7f468813bf957d33aede52c49dc97a960f74bcd937b4df95baa668bd179ff6e2bc2bddd297669e5de1a2da3ad4434f0d4776a14b5c160e3164a112fb73",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0359448011474cf2c25c29385bc7883ecddcf6ed14a5759151b5ad8d8c05121987"
			]
		},
		fee: "0",
		id: "566c54dd6e27d2e78898acf5e08273ab5ddb307f443db9cc2d0578944770a6bc",
		network: 30,
		nonce: "2",
		senderPublicKey: "0359448011474cf2c25c29385bc7883ecddcf6ed14a5759151b5ad8d8c05121987",
		signature: "92d4054f6d9695114e08e788b0a8c23e69b0da79c319813f42b5612dcebc3b32e681db6d1b55d128a6ecd89808470d31dcca8bfa3bb789b95a5d14d2c271adff",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+027125dab94e1c104e0e117d296fcffc93a8b15524c17924e9da742b116f83f514"
			]
		},
		fee: "0",
		id: "643943b5c359f2e096d9ab862dc5b4d2a87b909b339181ef4fc851ce5cd4fe5d",
		network: 30,
		nonce: "2",
		senderPublicKey: "027125dab94e1c104e0e117d296fcffc93a8b15524c17924e9da742b116f83f514",
		signature: "e223fa28960bafeba19e892d046d1e58f530e141cef33b8fd3ca74e81c1d6a1ee1806c664e3616b7679db5233af170388e36b928e06d14b9c461a34a323c4320",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+022937626547cbc91ff64702c33332380d73c146528e0090b85d62fdec77cfb8da"
			]
		},
		fee: "0",
		id: "eaca7207aa2d966a5753da010e4afe619af6bc8b48d2e6cb50a3896123de21e4",
		network: 30,
		nonce: "2",
		senderPublicKey: "022937626547cbc91ff64702c33332380d73c146528e0090b85d62fdec77cfb8da",
		signature: "e81036942903c86d388c750c178e4f7458f4fc869626898c7afb3d98017bc0efc1542a5648a7ab2af900d6838d462518cacc600acfa19a110846cadebc789f90",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+028a945e9f8bd9f9dacbb9714c59432461cc5cced6d4bcd0f0fdd595b3d66bc4c2"
			]
		},
		fee: "0",
		id: "7745692472eed435363b91460671c1b91907fac73a8f3502adb2b54bef0396a6",
		network: 30,
		nonce: "2",
		senderPublicKey: "028a945e9f8bd9f9dacbb9714c59432461cc5cced6d4bcd0f0fdd595b3d66bc4c2",
		signature: "8dfbbbb8ad1e73ad98272644337d33efb2c9e3692fbd21f60bf7658526d424ad41d4535c78a19402d034ab42b8ca90298abe436d35cb67a12c476c5a84170297",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0232a2017507f61e369bccb324246092fd3952abec1c98766169b05b8d022f2915"
			]
		},
		fee: "0",
		id: "f6ab5776ee01e56ba4eafffa617eca7919797113c380eee9ca613d9dd2496247",
		network: 30,
		nonce: "2",
		senderPublicKey: "0232a2017507f61e369bccb324246092fd3952abec1c98766169b05b8d022f2915",
		signature: "7eb2425c8c4f4dc529547f154f63a4b7f70a96e2057c36763434bed8451328b38337e2ad4138c8eb93ae47cfbf737f6d4c623da5723bbfe6f125c6553687e413",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03808a5c40f630d79065487b2855af909a7d1215d2afe4376e0295e55e7ede4758"
			]
		},
		fee: "0",
		id: "07c6d071a136808a26ada568359875e9f5ec778c315e0620d2776603b7430f97",
		network: 30,
		nonce: "2",
		senderPublicKey: "03808a5c40f630d79065487b2855af909a7d1215d2afe4376e0295e55e7ede4758",
		signature: "97db189e280b673762beaa6d3f158ce89dbafa5f707238dda931a5f2f3d421dbe63dcf9b3170f2096281db5813a00855a7849a9359637d20e1f04558633fafde",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+030134fd6bf65b0e42a2fab31bc2dff75656e802c397f57d3cf214686fbfa94086"
			]
		},
		fee: "0",
		id: "51a92b3f43b4cfb05ace6efe4f03a5017af48b9e0a97487e534ed359c9722268",
		network: 30,
		nonce: "2",
		senderPublicKey: "030134fd6bf65b0e42a2fab31bc2dff75656e802c397f57d3cf214686fbfa94086",
		signature: "2a86c2aedbbaca083ad345aef199174a155070f3f9b28812d83c5b4d801df55f397f16454a36bc404970bc3144d023920764f2b6807f447efc0706a8a349cedd",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03113e018838e922011e8449ecce533a21b38557ac033c03292540305fc2609f6d"
			]
		},
		fee: "0",
		id: "6e23ae6bc2eb5518b5670dd355873a18cadedd8444c4e0be93c2d063c99bd0c7",
		network: 30,
		nonce: "2",
		senderPublicKey: "03113e018838e922011e8449ecce533a21b38557ac033c03292540305fc2609f6d",
		signature: "1463e729eafb39bdce0e2f49a27f09f1e429898f797bee71fd2893942dc532bb25ece5c701f4d4957cc9585fdeaabe7398398ed951153e82ee87aa4dcf747cd2",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0307bb25b64d31a14928659034e25d81557116355b7685ce2c5ee9fab84ba2c116"
			]
		},
		fee: "0",
		id: "8bcf8f349fbb7edfed53ad876827f5635350900c7f7b84139c02299727a71272",
		network: 30,
		nonce: "2",
		senderPublicKey: "0307bb25b64d31a14928659034e25d81557116355b7685ce2c5ee9fab84ba2c116",
		signature: "e2dde6f1234c8426542b719f0eb0fe3f4ca2f40796e7c9f5d1f9af3b8339a7dace6a7dc435096a78be5908414d8f53ad43cb75a6e795fc7d73f7b45281578392",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03cd846b3b97a3ead6ad7bf9119a8ff2eeabd77f30de62bae95b8f6bee0c05bfd9"
			]
		},
		fee: "0",
		id: "dbea23d1206f810ed73d2d5dc78f203b0d8e2a1ebc31df35486a350daf8aa5c4",
		network: 30,
		nonce: "2",
		senderPublicKey: "03cd846b3b97a3ead6ad7bf9119a8ff2eeabd77f30de62bae95b8f6bee0c05bfd9",
		signature: "68ba9772dca9b6ca29cf4ea5eefb246a0b73bee8bf846ff0d8ba667ce41c1f9176124aec4419538e777f4cb97de2e38b20fe88ec76064ab86d6ade14c9133881",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03aebd4e0ea4b0eb3ad5ce7870af32e709fcf4d65ed9c9cb383aea83c687e1e1fb"
			]
		},
		fee: "0",
		id: "b44bc5dc7b1127cfcd54d4606a0d7a536a000adb1769845b4b7f08ed57ce1208",
		network: 30,
		nonce: "2",
		senderPublicKey: "03aebd4e0ea4b0eb3ad5ce7870af32e709fcf4d65ed9c9cb383aea83c687e1e1fb",
		signature: "36c15b332a43acc03143f6c65548e2a13a0440eb4e6ec5a4c40798557a375c4e017ec4e85f171522264292accc78166fa711d1080b48bfa2d5f82ad42c69d0c5",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0279c945a624b227e6ed5d41fd990b9753e5df730ad476b263f5036da22586c405"
			]
		},
		fee: "0",
		id: "bee66208cb3df1fa6c448184b09c5153b65dd79638838f5064820cfd079ce717",
		network: 30,
		nonce: "2",
		senderPublicKey: "0279c945a624b227e6ed5d41fd990b9753e5df730ad476b263f5036da22586c405",
		signature: "ac42590a5a4be649274fd5d3d8d74bd50c880f3e6569eadc78c3db7317b4814dca03ee7df58d4ac20ce94c11553bdd878f8c8d32b82d2033ee71605bc4f41530",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+031477d80e830014615ad7f32f252da80559c7b94592f4d71530931b8c6ce9bd22"
			]
		},
		fee: "0",
		id: "6c27382b06cfba5755be5a075d313775fdaf4a3c19a83a705d8a45b64084bbe6",
		network: 30,
		nonce: "2",
		senderPublicKey: "031477d80e830014615ad7f32f252da80559c7b94592f4d71530931b8c6ce9bd22",
		signature: "7380f3cf2a09222db6b4ac8a0d5912bbff639060be6973bc63187c19e9e78c12f8b31df2c9115ba4b3817239f8d597e197da3aba212f9c325b8800f5a3f7b8ee",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02fd789914166415c70f77f3a3de08eeba810be4958bb0107b8a396e1655080c05"
			]
		},
		fee: "0",
		id: "02d291ce0475067422559a9f9e5dd98c00b3b4d640d9d0be46ac7f313bb98cde",
		network: 30,
		nonce: "2",
		senderPublicKey: "02fd789914166415c70f77f3a3de08eeba810be4958bb0107b8a396e1655080c05",
		signature: "14087d5dc6c17028311fa7b14f6e7aac00338064fb45e76719185916b579c0717d47ba2548bcbea902ea4c8dc36d925952b79cd5dc1fb5d21b656689372857dd",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+036abe1469f7d1569d0954a73f165970b7c92aeb3f537b6816509da0a74eed0039"
			]
		},
		fee: "0",
		id: "3e830b96f5f272f2419d54493e46c431bcd06fa6053ad0396a89b8b9cae9b317",
		network: 30,
		nonce: "2",
		senderPublicKey: "036abe1469f7d1569d0954a73f165970b7c92aeb3f537b6816509da0a74eed0039",
		signature: "50895b0a6ee4d6a11fcef625934e76c13aec5650bdf1bba08f7f7bb5ea2be382e813e5b6f6399d2ce112c7e8f35c0b88504895793c56fe85bc90dde821c434e7",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03a69af136f6a861b9f7d3412582a1a24df27b372e8933065109cedf9fd3c60a6d"
			]
		},
		fee: "0",
		id: "3a3207984e996a2904db3985663072ad313a19e273d7b7260f26240f204af644",
		network: 30,
		nonce: "2",
		senderPublicKey: "03a69af136f6a861b9f7d3412582a1a24df27b372e8933065109cedf9fd3c60a6d",
		signature: "2bb5503d5eb69e43204ceed272685dc76935e0ba5986e0b1c4691974fadd042dfd897152ec2ce35008df372d64638b0f924d9fefc81d30511063fcb364a5e332",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02531414232c9ff0c3199c536a904be27d9ea671c0079100f2ebad8047d43557d9"
			]
		},
		fee: "0",
		id: "bab08c637862f5170a37a49753e835b3a42923cb8ecbcda18acb550ddb4ab22b",
		network: 30,
		nonce: "2",
		senderPublicKey: "02531414232c9ff0c3199c536a904be27d9ea671c0079100f2ebad8047d43557d9",
		signature: "b79f9cfca4fe0f928b7d73a59100c1fcea7a3997dc6283a6fe1916191056f3cc4f9c8634a4558671bc2c450a65411d4bb6880d2c334d9d8a767877fa19ead373",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03e79c16da8c917d95b49466e2d8414d0ab55f3d23e2e6e531aa1a98674925f889"
			]
		},
		fee: "0",
		id: "0edb0764c986cd4b76d7bd31e753301847550e644b26a496c5d5b67ec3be7d0f",
		network: 30,
		nonce: "2",
		senderPublicKey: "03e79c16da8c917d95b49466e2d8414d0ab55f3d23e2e6e531aa1a98674925f889",
		signature: "13060b9cc89e939615ee7f9cc6e7edcdc0206f465a03149b57f3b0472a7e63ab673d3e55f56e77415decba3be0752dab1ce8cd9263e560313744d6d748bb3fa0",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0367b945a0e4fc3cea3f45a4167ad8064c1b5bffd1958290524066e39ee2617e7b"
			]
		},
		fee: "0",
		id: "ec0347210bc01ebbbabfaeeb60fafb392f45a85c2ab5565d40d64e1f49ca66d4",
		network: 30,
		nonce: "2",
		senderPublicKey: "0367b945a0e4fc3cea3f45a4167ad8064c1b5bffd1958290524066e39ee2617e7b",
		signature: "c5d8b747b185d926031863ece65d4996cbdd26daf22d889b82d8ce8302dffb9be65d6b1865c20a73e6edb792f91511e3720b08223900f8c9914e707b06320dbc",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02b4fb83825cd86f2d2ff42f81084b18f0828822902e853069f8fe295d61cbe5ad"
			]
		},
		fee: "0",
		id: "5107f1ea80eb534ea3b7fc806d0d02e1201c1a25a650e10ca403263eb11e2dc0",
		network: 30,
		nonce: "2",
		senderPublicKey: "02b4fb83825cd86f2d2ff42f81084b18f0828822902e853069f8fe295d61cbe5ad",
		signature: "42d373e563aca4edfe0bffc7afe5b738c50b77c2a42e28f457b042c6dd5c95abb9733b1383323211d79361f39aa6f38158fbb0de9b419a2b4da6394c919d1289",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0320ef5adaa1d8ef888d357591d6508685c3e2caa43eff86714eb01367f2fab9c6"
			]
		},
		fee: "0",
		id: "4ce1321722c1d470eb345ff74d14b9878aad2928607fabb90a2bf94fe18f4065",
		network: 30,
		nonce: "2",
		senderPublicKey: "0320ef5adaa1d8ef888d357591d6508685c3e2caa43eff86714eb01367f2fab9c6",
		signature: "f9518ab4587c6dbc18586cdb0b87de2892f48c2b487505bb7d0e02105c627dec37768dd9479e403e6c38ebcc1288535be89298c0c111a7cb5be91b3ac3397a8b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02104c30143291ddfaa35caf1b26f1199994590abb89b62a3b31fb27d3fcc28100"
			]
		},
		fee: "0",
		id: "548a8a86f5b1fe8df43b17052a85a93a2ea45ab8ab0e3edce052af2c71ee0c4e",
		network: 30,
		nonce: "2",
		senderPublicKey: "02104c30143291ddfaa35caf1b26f1199994590abb89b62a3b31fb27d3fcc28100",
		signature: "33f9832d9fdebf847b920789e01ef5800aeec822c1df47a7391ac335d2c69f8a273ee6e15660e95ef7242b423ea654f670623d58f8670a51d9cb5562494fc6ec",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0261ed68b8a750d1bf0b2974d87e1175e577f149410a1689292dcaa4f516fc86a0"
			]
		},
		fee: "0",
		id: "36178b8176935e07670a5845da5a226489fbd7f9b920344ca13b1a125c064f81",
		network: 30,
		nonce: "2",
		senderPublicKey: "0261ed68b8a750d1bf0b2974d87e1175e577f149410a1689292dcaa4f516fc86a0",
		signature: "3b8edcac9537684221de4463f436fb1b7ae69c1b8eb80fd69dff4fc9bd4db8f2bb671c9360e3cf5db7e8b10f8d9cdb54c42cf435d33740e55eb924b6e469dbed",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02defd853ec34a2c3bffe04ced8e880f6391ce7be9f8a077fa35ef968ef28bc019"
			]
		},
		fee: "0",
		id: "fe4e3afd7e3055d6846ee60be06ef53f26b411527f7a90044442766ab06cb9d6",
		network: 30,
		nonce: "2",
		senderPublicKey: "02defd853ec34a2c3bffe04ced8e880f6391ce7be9f8a077fa35ef968ef28bc019",
		signature: "bbd16626998b750cbc16a78a197db0a718fee517b42463709faa6af411fd87fee0cfd45e79e2de18e908db16002e56a2033525f6dffd37a1c75b48881266d2e6",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03dc8fe7e4d51c983f03eba20677140d981f6f07c5acab1fdba5cdaeaf373363dd"
			]
		},
		fee: "0",
		id: "a08294886621c309ad52a66a9c686cc4f9ea733c7a88d35fe66691b00a628cf2",
		network: 30,
		nonce: "2",
		senderPublicKey: "03dc8fe7e4d51c983f03eba20677140d981f6f07c5acab1fdba5cdaeaf373363dd",
		signature: "98d89b21e52219b090365f19003ebf70ff2145ad612e6de0bf25cf2b38a1cad9326c1f4ef972a4f2d5603de9b8d2fae2dc8d4665a137e381665765816caf87bc",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+038f65762af6387845f4388a5c8f7585a05cd70f49256ae5ea95f3aa8cdb468c70"
			]
		},
		fee: "0",
		id: "7e5e320ca6f5726500773d72bc0c28d8ec8dfac7f164a6649a97cf8203740e0e",
		network: 30,
		nonce: "2",
		senderPublicKey: "038f65762af6387845f4388a5c8f7585a05cd70f49256ae5ea95f3aa8cdb468c70",
		signature: "52d3d502d5fa0fa94d32c906c67f7e33460e35421f52bd13fb460bac107d8f6a023f6ad7c04d5924158a6000c1eee04208947c2623cdf1ed1e7ae0b13600a667",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03ea8aad51c3a5befc027c53693841b4d75252230ac12db4fd2cf870c269d5ae13"
			]
		},
		fee: "0",
		id: "e89f7738c053c16db42d839ee3e4b10a3031192a67f607f4eae14bf5e98b4118",
		network: 30,
		nonce: "2",
		senderPublicKey: "03ea8aad51c3a5befc027c53693841b4d75252230ac12db4fd2cf870c269d5ae13",
		signature: "e9cac28667f9a853711f0a21bf164b2d48fe4a0192e7ffd9f92b8ab9ca5918748448b896751d7aabe3da17ca48cbc78cb1d62cc550f9e44282b4cf4c3c2db5ea",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+038f46041c38afd763db9119f07293321ea47d78cdca8bd752a01e7c8e17df5994"
			]
		},
		fee: "0",
		id: "9f3901cc42c3c50b847ee740fdd06ceee203b308718916ad92d746cf3673d5aa",
		network: 30,
		nonce: "2",
		senderPublicKey: "038f46041c38afd763db9119f07293321ea47d78cdca8bd752a01e7c8e17df5994",
		signature: "f7b41aa15ffe87c429882e1714e877bcaeea2aa744c07fc20f94ca3cfbdf7c812ca75bd92f34ee2020ce9742649dfc1eec8c4760927c22a456eb35acb72c55f4",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+036fdb49abe519cb3b2dc439ca62954a5ca8d5e20c66bc1818769bd0e9fbaa1ef6"
			]
		},
		fee: "0",
		id: "91c4c80371ff112f9910984410aa858b3230e0bbae666a028879251838ec5352",
		network: 30,
		nonce: "2",
		senderPublicKey: "036fdb49abe519cb3b2dc439ca62954a5ca8d5e20c66bc1818769bd0e9fbaa1ef6",
		signature: "cf5ae732de4b78ada3229efd7140eae97292aaae58654675abd936062da6fa3195410fb02669c70e541f3271755430bdf961fd28351e41df72026940f5cc0bdc",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785"
			]
		},
		fee: "0",
		id: "5cb30cc1932d4af285b423beebfd568d81566254689d38b4eff580f31e701b63",
		network: 30,
		nonce: "2",
		senderPublicKey: "0346e3a4b89d55e5376d1a478e6185c4c97c590609ac354e50276def05500e4785",
		signature: "291d6c1bacc2412f782af2686faa83b963903b4a80c7882252bd99be1b6c8ad1a0397e136c7ed41c8e82545423f75645370e3995a6c482d513302f853e15f8d0",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+035fedad8a5f1d261c5a7e60e55cbe2a6214811c4659b57758a1958025af49337d"
			]
		},
		fee: "0",
		id: "2e12941884d8e6e2767a38ef0c499c0c7da3e4dc213e63cd23e1697c09759ab8",
		network: 30,
		nonce: "2",
		senderPublicKey: "035fedad8a5f1d261c5a7e60e55cbe2a6214811c4659b57758a1958025af49337d",
		signature: "4bc21801e958dc3bcb0215c5e03c92b9fa4ed2605ec3350347ce3efe8881bb3ed6edd4a728330f68b295a123cfff3e020b24ed52c5f26c83fe14c909fbe7050d",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03952408b5468de16dbdb2b5c05b3d3e11c07492a93bcbdd442c85d46b4f58131b"
			]
		},
		fee: "0",
		id: "f5f639bf1183718f6cf58b76f77cd02c886d02e8bfa4ff3a65c8b58bfeff1382",
		network: 30,
		nonce: "2",
		senderPublicKey: "03952408b5468de16dbdb2b5c05b3d3e11c07492a93bcbdd442c85d46b4f58131b",
		signature: "5586572bade315917809bdaeb68860913236721e563348f6f97e7f2ed82e0b756b98a1d7f6aab85c2f61cefc79dde58dfdacf551bb5761964cc691f22077b318",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03a7679cc437716eb969f241a55dfab714f08bee7aa8e9203e7982de282a4ffa4a"
			]
		},
		fee: "0",
		id: "3a909007a6c14901f248489bf36fa6c1cf5c2f9ea14e545e361373befcbe8210",
		network: 30,
		nonce: "2",
		senderPublicKey: "03a7679cc437716eb969f241a55dfab714f08bee7aa8e9203e7982de282a4ffa4a",
		signature: "3649e67d8b8e23ed4ef4c489819ad8ae0824828444f996677469792daa0f1e27b8f66f12713ccfcb5bafeefbd1128cbd271212e7e0b7e36357233d1295255c1b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+021ea11edbe1d10af043c4bb17506d4ed623ab05eb042d6ba40c8da06e5cbd7405"
			]
		},
		fee: "0",
		id: "74830e977987031a0bfbc931f079d7dc460282d80f7b9417c26527086783c86e",
		network: 30,
		nonce: "2",
		senderPublicKey: "021ea11edbe1d10af043c4bb17506d4ed623ab05eb042d6ba40c8da06e5cbd7405",
		signature: "a9b456d8cd4c7959d26fea87b32dd90ddc931a1f52ca96160f2b48b38e491cf3ae44777835703be8b2da86d5f6aca1b6efca36ae9eafe9d333d4dd2b10cd1a2b",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0222400260bc6f211c269c3ebba2af36c99102c046777193393643fc71502d199c"
			]
		},
		fee: "0",
		id: "27cbc8da72f84f919b605613da294c847acc055ed765beb218d45ab6f0582d4e",
		network: 30,
		nonce: "2",
		senderPublicKey: "0222400260bc6f211c269c3ebba2af36c99102c046777193393643fc71502d199c",
		signature: "eb074e7ebd6d21f22bcb5c95becee0a862cb4f681e7b269dd00ecdeb49d8c211c475d6a2d29a062f21c78680c47db4d397988963121438afb619de5f85ec7f35",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03c1543af88bff6f554d0d1cf2e13030a890c2d0ff3ae3a1d8a25eb732cca91c0f"
			]
		},
		fee: "0",
		id: "733207200cc509243ceabee6128b9d611e76acb92a77c3981940698b283f3072",
		network: 30,
		nonce: "2",
		senderPublicKey: "03c1543af88bff6f554d0d1cf2e13030a890c2d0ff3ae3a1d8a25eb732cca91c0f",
		signature: "aad61e67bfc5d7b2b1b3bd2304d26f8f57a1f7be6c57f002a6fc7189b0bee9d1a6b42bb8f63a8728767ef25d62de856515ad002d2bb65df0573008ae85a29919",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02202ccaa704a060030ee111e91c4073f3a5d26291e5ac48a8e80cc91fa22da771"
			]
		},
		fee: "0",
		id: "230e81ae1c7033f3e2a16d7f82ea235019dbfa917bc7ae7e3c68473ff86dc8a2",
		network: 30,
		nonce: "2",
		senderPublicKey: "02202ccaa704a060030ee111e91c4073f3a5d26291e5ac48a8e80cc91fa22da771",
		signature: "ecf0a6ee513723117cb0ab316b859f03f6fa5bd9cfd5eb0fca52edb3572fa75f95fbc2751cd1912c24d42d079b0948bb6908e97b3ab13575d0af4a592ab74c96",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+0308ff06ba9c37c43558b12d8800dc57b8937a30c6d31d204158f40001942ddb3a"
			]
		},
		fee: "0",
		id: "102219e13b5c805b0828ef2da8e71d3c42caa8291d3cbd17a55cc970bcb16ac7",
		network: 30,
		nonce: "2",
		senderPublicKey: "0308ff06ba9c37c43558b12d8800dc57b8937a30c6d31d204158f40001942ddb3a",
		signature: "bb93fb45f5bef0d374dd7bbfe5aed2161fc86d71317ddf747b93a94ed7322cb5982875de6c8279054e11a57a783ffd98162e85ce33187461f52d4bc5fbe8aeb2",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f"
			]
		},
		fee: "0",
		id: "d578cd417068bfe75771ef927843ccfa59ee63b70d498ec296370b7dce247e58",
		network: 30,
		nonce: "2",
		senderPublicKey: "024c90daf06b3d503daf125b3d527e0994f98f16c163b667dbb10fc8cb750f0e6f",
		signature: "9d14d29733bb3df8737f69a952ed3e715c481074d3aa755b3d6aa706fbbd8ab6edee29b8bc79d8a528038815d59295c1b2eeee92e8bd9fe9795b061c178bdbf8",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03bc5a7880073a71639be48c6a2c8371f1d92591aca962cab71862926d9081c99b"
			]
		},
		fee: "0",
		id: "37e0c7c2a1133b8ee466d8b70aa85cf7d2b0a1700daaf605e545739bc05af213",
		network: 30,
		nonce: "2",
		senderPublicKey: "03bc5a7880073a71639be48c6a2c8371f1d92591aca962cab71862926d9081c99b",
		signature: "4744a264130efe4e5043c37e951877d9fa065df4c764efb1890fd5be1a6b6e726232a33759147f4e0bf7966b21b43d4714fb111d1038da090affe7e010f0934e",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+02c813fc7a8fe61346af300d5af32dc83b3def9bf9c7cac7572f4e9a258dabbf07"
			]
		},
		fee: "0",
		id: "5360864e6b0a76121f93e81ca231fb832bf47f851161e6526777242b72af42f9",
		network: 30,
		nonce: "2",
		senderPublicKey: "02c813fc7a8fe61346af300d5af32dc83b3def9bf9c7cac7572f4e9a258dabbf07",
		signature: "e590c4ac5f00d4fe9a24c0196cf5698bdb072638b30b8b12c3cab678d43ddc2c7540afe90de4954745c203fd548b90678253481d5c29f87045d29cd9b3986a8a",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+03668fed483d0d37967183a968ea456441b8d85a348c74d80212e6fbb9adabae46"
			]
		},
		fee: "0",
		id: "9c1844d4566985691d745cc0abdffe895b04d85cf89a86e0d0ab023ce57b071f",
		network: 30,
		nonce: "2",
		senderPublicKey: "03668fed483d0d37967183a968ea456441b8d85a348c74d80212e6fbb9adabae46",
		signature: "7a7ce50d2b599cd0d446686226fd8b89605cb39c51141971d14104769fd8759526f053bd1b5b1a9686afdf413d54af36c7c6d07b2babd8d025f759105e4652bb",
		type: 3,
		typeGroup: 1,
		version: 2
	},
	{
		amount: "0",
		asset: {
			votes: [
				"+036cddb79510f5ff9bfcd1b8f04ed565806e70bc9195b47e7b514e49f642119d62"
			]
		},
		fee: "0",
		id: "f29e2e78160b240dbc337f9052d8f1853fb06343e937fba169aa874a9edaed37",
		network: 30,
		nonce: "2",
		senderPublicKey: "036cddb79510f5ff9bfcd1b8f04ed565806e70bc9195b47e7b514e49f642119d62",
		signature: "434f8e315402ac02f5139dbf3683c89aab0fce7539aed4433ba620c5aa624b0fb9906e9baee4f5cf849696f3e599b7f5fc614cd4bf88437490ef8227112b253a",
		type: 3,
		typeGroup: 1,
		version: 2
	}
];
var version = 0;
var genesisBlock = {
	blockSignature: blockSignature,
	generatorPublicKey: generatorPublicKey,
	height: height,
	id: id,
	numberOfTransactions: numberOfTransactions,
	payloadHash: payloadHash,
	payloadLength: payloadLength,
	previousBlock: previousBlock,
	reward: reward,
	timestamp: timestamp,
	totalAmount: totalAmount,
	totalFee: totalFee,
	transactions: transactions,
	version: version
};

var milestones = [
	{
		height: 1,
		activeDelegates: 53,
		block: {
			version: 0,
			maxTransactions: 150,
			maxPayload: 2097152
		},
		blockTime: 8,
		burn: {
			feePercent: 90,
			txAmount: 2000000
		},
		dynamicFees: {
			enabled: true,
			addonBytes: {
				burn: 0,
				delegateRegistration: 663703,
				delegateResignation: 0,
				htlcClaim: 0,
				htlcLock: 82,
				htlcRefund: 0,
				ipfs: 98,
				legacyTransfer: 99,
				legacyVote: 98,
				multiSignature: 16,
				secondSignature: 99,
				transfer: 85,
				vote: 98
			},
			minFee: 11299
		},
		epoch: "2022-03-16T18:00:00.000Z",
		fees: {
			staticFees: {
				burn: 0,
				delegateRegistration: 7500000000,
				delegateResignation: 0,
				htlcClaim: 0,
				htlcLock: 5000000,
				htlcRefund: 0,
				ipfs: 5000000,
				legacyTransfer: 5000000,
				legacyVote: 5000000,
				multiSignature: 5000000,
				secondSignature: 5000000,
				transfer: 50000000,
				vote: 9000000
			}
		},
		legacyTransfer: true,
		legacyVote: true,
		p2p: {
			minimumVersions: [
				">=4.0.2-next.0"
			]
		},
		transfer: {
			maximum: 256,
			minimum: 1
		},
		reward: 0
	},
	{
		height: 478,
		reward: 1000000000
	},
	{
		height: 955,
		dynamicReward: {
			enabled: true,
			ranks: {
				"1": 675000000,
				"2": 687500000,
				"3": 700000000,
				"4": 712500000,
				"5": 725000000,
				"6": 737500000,
				"7": 750000000,
				"8": 762500000,
				"9": 775000000,
				"10": 787500000,
				"11": 800000000,
				"12": 812500000,
				"13": 825000000,
				"14": 837500000,
				"15": 850000000,
				"16": 862500000,
				"17": 875000000,
				"18": 887500000,
				"19": 900000000,
				"20": 912500000,
				"21": 925000000,
				"22": 937500000,
				"23": 950000000,
				"24": 962500000,
				"25": 975000000,
				"26": 987500000,
				"27": 1000000000,
				"28": 1012500000,
				"29": 1025000000,
				"30": 1037500000,
				"31": 1050000000,
				"32": 1062500000,
				"33": 1075000000,
				"34": 1087500000,
				"35": 1100000000,
				"36": 1112500000,
				"37": 1125000000,
				"38": 1137500000,
				"39": 1150000000,
				"40": 1162500000,
				"41": 1175000000,
				"42": 1187500000,
				"43": 1200000000,
				"44": 1212500000,
				"45": 1225000000,
				"46": 1237500000,
				"47": 1250000000,
				"48": 1262500000,
				"49": 1275000000,
				"50": 1287500000,
				"51": 1300000000,
				"52": 1312500000,
				"53": 1325000000
			},
			secondaryReward: 675000000
		}
	},
	{
		height: 500000,
		acceptLegacySchnorrTransactions: true,
		bip340: true,
		htlcEnabled: true
	},
	{
		height: 671352,
		devFund: {
			DSXP3m8MJhqZvybUMCnUkfAP5PQ4aVjozy: 5
		}
	},
	{
		height: 918650,
		acceptLegacySchnorrTransactions: false,
		blocksToRevokeDelegateResignation: 106,
		delegateResignationTypeAsset: true,
		legacyTransfer: false,
		legacyVote: false
	}
];

var name = "testnet";
var messagePrefix = "Solar testnet message:\n";
var bip32 = {
	"public": 70617039,
	"private": 70615956
};
var pubKeyHash = 30;
var nethash = "72db1365ae549683980a8e29ff744c6d4d9920c3cd215e462f40a58da3f13dce";
var wif = 252;
var slip44 = 1;
var aip20 = 0;
var client = {
	token: "tSXP",
	symbol: "tSXP",
	explorer: "https://texplorer.solar.org"
};
var network = {
	name: name,
	messagePrefix: messagePrefix,
	bip32: bip32,
	pubKeyHash: pubKeyHash,
	nethash: nethash,
	wif: wif,
	slip44: slip44,
	aip20: aip20,
	client: client
};

const testnet = { exceptions, genesisBlock, milestones, network };

var networks = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mainnet: mainnet,
    testnet: testnet
});

class ConfigManager {
    constructor() {
        this.setConfig(testnet);
    }
    setConfig(config) {
        this.config = {
            network: config.network,
            exceptions: config.exceptions,
            milestones: config.milestones,
            genesisBlock: config.genesisBlock,
        };
        this.validateMilestones();
        this.buildConstants();
    }
    setFromPreset(network) {
        this.setConfig(this.getPreset(network));
    }
    getPreset(network) {
        return networks[network.toLowerCase()];
    }
    all() {
        return this.config;
    }
    set(key, value) {
        if (!this.config) {
            throw new Error();
        }
        set(this.config, key, value);
    }
    get(key) {
        return get(this.config, key);
    }
    setHeight(value) {
        this.height = value;
    }
    getHeight() {
        return this.height;
    }
    isNewMilestone(height) {
        height = height || this.height;
        if (!this.milestones) {
            throw new Error();
        }
        return this.milestones.some((milestone) => milestone.height === height);
    }
    getMilestone(height) {
        if (!this.milestone || !this.milestones) {
            throw new Error();
        }
        if (!height && this.height) {
            height = this.height;
        }
        if (!height) {
            height = 1;
        }
        while (this.milestone.index < this.milestones.length - 1 &&
            height >= this.milestones[this.milestone.index + 1].height) {
            this.milestone.index++;
            this.milestone.data = this.milestones[this.milestone.index];
        }
        while (height < this.milestones[this.milestone.index].height) {
            this.milestone.index--;
            this.milestone.data = this.milestones[this.milestone.index];
        }
        return this.milestone.data;
    }
    getNextMilestoneWithNewKey(previousMilestone, key) {
        if (!this.milestones || !this.milestones.length) {
            throw new Error(`Attempted to get next milestone but none were set`);
        }
        for (let i = 0; i < this.milestones.length; i++) {
            const milestone = this.milestones[i];
            if (milestone[key] &&
                milestone[key] !== this.getMilestone(previousMilestone)[key] &&
                milestone.height > previousMilestone) {
                return {
                    found: true,
                    height: milestone.height,
                    data: milestone[key],
                };
            }
        }
        return {
            found: false,
            height: previousMilestone,
            data: null,
        };
    }
    getMilestones() {
        return this.milestones;
    }
    buildConstants() {
        if (!this.config) {
            throw new Error();
        }
        this.milestones = this.config.milestones.sort((a, b) => a.height - b.height);
        this.milestone = {
            index: 0,
            data: this.milestones[0],
        };
        let lastMerged = 0;
        const overwriteMerge = (dest, source, options) => source;
        while (lastMerged < this.milestones.length - 1) {
            this.milestones[lastMerged + 1] = deepmerge(this.milestones[lastMerged], this.milestones[lastMerged + 1], {
                arrayMerge: overwriteMerge,
            });
            lastMerged++;
        }
    }
    validateMilestones() {
        if (!this.config) {
            throw new Error();
        }
        const delegateMilestones = this.config.milestones
            .sort((a, b) => a.height - b.height)
            .filter((milestone) => milestone.activeDelegates);
        for (let i = 1; i < delegateMilestones.length; i++) {
            const previous = delegateMilestones[i - 1];
            const current = delegateMilestones[i];
            if (previous.activeDelegates === current.activeDelegates) {
                continue;
            }
            if ((current.height - previous.height) % previous.activeDelegates !== 0) {
                throw new InvalidMilestoneConfigurationError(`Bad milestone at height: ${current.height}. The number of delegates can only be changed at the beginning of a new round`);
            }
        }
    }
}
const configManager = new ConfigManager();

class NetworkManager {
    static all() {
        return networks;
    }
    static findByName(name) {
        return networks[name.toLowerCase()];
    }
}

var index$8 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    configManager: configManager,
    NetworkManager: NetworkManager
});

class HDWallet {
    /**
     * Get root node from the given mnemonic with an optional passphrase.
     */
    static fromMnemonic(mnemonic, passphrase) {
        return fromSeed(mnemonicToSeedSync(mnemonic, passphrase), configManager.get("network"));
    }
    /**
     * Get bip32 node from keys.
     */
    static fromKeys(keys, chainCode) {
        if (!keys.compressed) {
            throw new TypeError("BIP32 only allows compressed keys");
        }
        return fromPrivateKey(Buffer.from(keys.privateKey, "hex"), chainCode, configManager.get("network"));
    }
    /**
     * Get key pair from the given node.
     */
    static getKeys(node) {
        if (!node.privateKey) {
            throw new Error();
        }
        return {
            publicKey: node.publicKey.toString("hex"),
            privateKey: node.privateKey.toString("hex"),
            compressed: true,
        };
    }
    /**
     * Derives a node from the coin type as specified by slip44.
     */
    static deriveSlip44(root, hardened = true) {
        return root.derivePath(`m/44'/${this.slip44}${hardened ? "'" : ""}`);
    }
    /**
     * Derives a node from the network as specified by AIP20.
     */
    static deriveNetwork(root) {
        return this.deriveSlip44(root).deriveHardened(configManager.get("network.aip20") || 1);
    }
}
HDWallet.slip44 = 3333;

const SATOSHI = 1e8;
const ARKTOSHI = SATOSHI;

var constants = /*#__PURE__*/Object.freeze({
    __proto__: null,
    SATOSHI: SATOSHI,
    ARKTOSHI: ARKTOSHI
});

class Cache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    has(key) {
        return this.cache.has(key);
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value) {
        this.cache.set(key, value);
        if (this.cache.size > this.maxSize) {
            this.cache.delete(this.firstKey());
        }
    }
    firstKey() {
        return this.cache.keys().next().value;
    }
}

const encodeCheck = (buff) => {
    const checksum = HashAlgorithms.hash256(buff);
    return base58.encode(Buffer.concat([buff, checksum], buff.length + 4));
};
const decodeCheck = (address) => {
    const buff = base58.decode(address);
    const payload = buff.slice(0, -4);
    const checksum = HashAlgorithms.hash256(payload);
    if (checksum.readUInt32LE(0) !== buff.slice(-4).readUInt32LE(0)) {
        throw new Error("Invalid checksum");
    }
    return payload;
};
const Base58 = {
    encodeCheck: moize(encodeCheck, {
        cache: {
            create: () => {
                return new Cache(10000);
            },
        },
    }),
    decodeCheck: moize(decodeCheck, {
        cache: {
            create: () => {
                return new Cache(10000);
            },
        },
    }),
};

class BigNumber {
    constructor(value) {
        this.value = this.toBigNumber(value);
    }
    static make(value) {
        return new BigNumber(value);
    }
    plus(other) {
        return new BigNumber(this.value + this.toBigNumber(other));
    }
    minus(other) {
        return new BigNumber(this.value - this.toBigNumber(other));
    }
    times(other) {
        return new BigNumber(this.value * this.toBigNumber(other));
    }
    dividedBy(other) {
        return new BigNumber(this.value / this.toBigNumber(other));
    }
    div(other) {
        return this.dividedBy(other);
    }
    isZero() {
        return this.value === BigInt(0);
    }
    comparedTo(other) {
        const b = this.toBigNumber(other);
        if (this.value > b) {
            return 1;
        }
        if (this.value < b) {
            return -1;
        }
        return 0;
    }
    isLessThan(other) {
        return this.value < this.toBigNumber(other);
    }
    isLessThanEqual(other) {
        return this.value <= this.toBigNumber(other);
    }
    isGreaterThan(other) {
        return this.value > this.toBigNumber(other);
    }
    isGreaterThanEqual(other) {
        return this.value >= this.toBigNumber(other);
    }
    isEqualTo(other) {
        return this.value === this.toBigNumber(other);
    }
    isNegative() {
        return this.value < 0;
    }
    toFixed() {
        return this.value.toString();
    }
    toString(base = 10) {
        return this.value.toString(base);
    }
    toJSON() {
        return this.toFixed();
    }
    toBigInt() {
        return this.value;
    }
    toBigNumber(value) {
        if (value instanceof BigNumber) {
            value = value.value;
        }
        return BigInt(value);
    }
}
BigNumber.ZERO = new BigNumber(0);
BigNumber.ONE = new BigNumber(1);
BigNumber.SATOSHI = new BigNumber(1e8);

const isNewBlockTime = (height) => {
    if (height === 1)
        return true;
    const milestones = configManager.get("milestones");
    let milestone;
    for (let i = milestones.length - 1; i >= 0; i--) {
        const temp = milestones[i];
        if (temp.height > height) {
            continue;
        }
        if (!milestone || temp.blockTime === milestone.blockTime) {
            if (temp.blockTime) {
                milestone = temp;
            }
        }
        else {
            break;
        }
    }
    if (!milestone)
        return false;
    return height - milestone.height === 0;
};
const calculateBlockTime = (height) => {
    const milestones = configManager.get("milestones");
    for (let i = milestones.length - 1; i >= 0; i--) {
        const milestone = milestones[i];
        if (milestone.height <= height) {
            if (milestone.blockTime) {
                return milestone.blockTime;
            }
        }
    }
    throw new Error(`No milestones specifying any height were found`);
};

class ByteBuffer {
    constructor(buff) {
        this.offset = 0;
        this.buff = buff;
    }
    getBuffer() {
        return this.buff;
    }
    getOffset() {
        return this.offset;
    }
    getRemainder() {
        return this.buff.slice(this.offset);
    }
    getRemainderLength() {
        return this.buff.length - this.offset;
    }
    getResult() {
        return this.buff.slice(0, this.offset);
    }
    getResultLength() {
        return this.offset;
    }
    reset() {
        this.offset = 0;
    }
    goTo(position) {
        if (position < 0 || position > this.buff.length) {
            throw new Error("Jump over buffer boundary: " + position + " vs " + this.buff.length);
        }
        this.offset = position;
    }
    jump(length) {
        if (length < -this.offset || length > this.getRemainderLength()) {
            throw new Error("Jump over buffer boundary");
        }
        this.offset += length;
    }
    writeInt8(value) {
        this.offset = this.buff.writeInt8(value, this.offset);
    }
    writeInt16BE(value) {
        this.offset = this.buff.writeInt16BE(value, this.offset);
    }
    writeInt16LE(value) {
        this.offset = this.buff.writeInt16LE(value, this.offset);
    }
    writeInt32BE(value) {
        this.offset = this.buff.writeInt32BE(value, this.offset);
    }
    writeInt32LE(value) {
        this.offset = this.buff.writeInt32LE(value, this.offset);
    }
    writeBigInt64BE(value) {
        this.offset = this.buff.writeBigInt64BE(value, this.offset);
    }
    writeBigInt64LE(value) {
        this.offset = this.buff.writeBigInt64LE(value, this.offset);
    }
    writeUInt8(value) {
        this.offset = this.buff.writeUInt8(value, this.offset);
    }
    writeUInt16BE(value) {
        this.offset = this.buff.writeUInt16BE(value, this.offset);
    }
    writeUInt16LE(value) {
        this.offset = this.buff.writeUInt16LE(value, this.offset);
    }
    writeUInt32BE(value) {
        this.offset = this.buff.writeUInt32BE(value, this.offset);
    }
    writeUInt32LE(value) {
        this.offset = this.buff.writeUInt32LE(value, this.offset);
    }
    writeBigUInt64BE(value) {
        this.offset = this.buff.writeBigUInt64BE(value, this.offset);
    }
    writeBigUInt64LE(value) {
        this.offset = this.buff.writeBigUInt64LE(value, this.offset);
    }
    writeBuffer(value) {
        if (value.length > this.getRemainderLength()) {
            throw new Error("Write over buffer boundary");
        }
        this.offset += value.copy(this.buff, this.offset);
    }
    readInt8() {
        const value = this.buff.readInt8(this.offset);
        this.offset += 1;
        return value;
    }
    readInt16BE() {
        const value = this.buff.readInt16BE(this.offset);
        this.offset += 2;
        return value;
    }
    readInt16LE() {
        const value = this.buff.readInt16LE(this.offset);
        this.offset += 2;
        return value;
    }
    readInt32BE() {
        const value = this.buff.readInt32BE(this.offset);
        this.offset += 4;
        return value;
    }
    readInt32LE() {
        const value = this.buff.readInt32LE(this.offset);
        this.offset += 4;
        return value;
    }
    readBigInt64BE() {
        const value = this.buff.readBigInt64BE(this.offset);
        this.offset += 8;
        return value;
    }
    readBigInt64LE() {
        const value = this.buff.readBigInt64LE(this.offset);
        this.offset += 8;
        return value;
    }
    readUInt8() {
        const value = this.buff.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }
    readUInt16BE() {
        const value = this.buff.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }
    readUInt16LE() {
        const value = this.buff.readUInt16LE(this.offset);
        this.offset += 2;
        return value;
    }
    readUInt32BE() {
        const value = this.buff.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }
    readUInt32LE() {
        const value = this.buff.readUInt32LE(this.offset);
        this.offset += 4;
        return value;
    }
    readBigUInt64BE() {
        const value = this.buff.readBigUInt64BE(this.offset);
        this.offset += 8;
        return value;
    }
    readBigUInt64LE() {
        const value = this.buff.readBigUInt64LE(this.offset);
        this.offset += 8;
        return value;
    }
    readBuffer(length) {
        if (length > this.getRemainderLength()) {
            throw new Error("Read over buffer boundary");
        }
        const value = this.buff.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }
}

class ByteBufferArray {
    constructor() {
        this.buffers = [];
        this.position = 0;
    }
    getByteBuffer() {
        let buffer;
        if (this.buffers.length > this.position) {
            buffer = this.buffers[this.position];
        }
        else {
            buffer = new ByteBuffer(Buffer.alloc(1 * 1024 * 1024));
            this.buffers.push(buffer);
        }
        this.position++;
        buffer.reset();
        return buffer;
    }
    reset() {
        if (this.buffers.length > 10) {
            this.buffers.splice(10);
        }
        this.position = 0;
    }
}

// todo: review the implementation of all methods
const isLocalHost = (ip, includeNetworkInterfaces = true) => {
    try {
        const parsed = ipAddr.parse(ip);
        if (parsed.range() === "loopback" || ip.startsWith("0") || ["127.0.0.1", "::ffff:127.0.0.1"].includes(ip)) {
            return true;
        }
        if (includeNetworkInterfaces) {
            const interfaces = os.networkInterfaces();
            return Object.keys(interfaces).some((ifname) => interfaces[ifname].some((iface) => iface.address === ip));
        }
        return false;
    }
    catch (error) {
        return false;
    }
};
const sanitiseRemoteAddress = (ip) => {
    try {
        return ipAddr.process(ip).toString();
    }
    catch (error) {
        return undefined;
    }
};
const isValidPeer = (peer, includeNetworkInterfaces = true) => {
    const sanitisedAddress = sanitiseRemoteAddress(peer.ip);
    if (!sanitisedAddress) {
        return false;
    }
    peer.ip = sanitisedAddress;
    if (isLocalHost(peer.ip, includeNetworkInterfaces)) {
        return false;
    }
    return true;
};

const getReward = (height) => {
    const milestones = configManager.get("milestones");
    for (let i = milestones.length - 1; i >= 0; i--) {
        const milestone = milestones[i];
        if (milestone.height <= height) {
            if (milestone.reward) {
                return BigNumber.make(milestone.reward);
            }
        }
    }
    return BigNumber.ZERO;
};
const getDynamicReward = (height) => {
    const milestones = configManager.get("milestones");
    for (let i = milestones.length - 1; i >= 0; i--) {
        const milestone = milestones[i];
        if (milestone.height <= height) {
            if (milestone.dynamicReward) {
                return milestone.dynamicReward;
            }
        }
    }
    return {};
};
const calculateReward = (height, rank) => {
    const dynamicReward = getDynamicReward(height);
    const reward = getReward(height);
    if (dynamicReward.enabled) {
        if (typeof dynamicReward.ranks === "object" && typeof dynamicReward.ranks[rank] !== "undefined") {
            return dynamicReward.ranks[rank];
        }
        throw new Error(`No dynamic reward configured for rank ${rank}`);
    }
    else {
        return reward;
    }
};

const sortVotes = (votes) => {
    return Object.fromEntries(Object.entries(votes).sort((a, b) => {
        if (b[1] > a[1]) {
            return 1;
        }
        else if (b[1] < a[1]) {
            return -1;
        }
        else {
            return a[0].localeCompare(b[0], "en", { numeric: true });
        }
    }));
};

let genesisTransactions;
let whitelistedBlockAndTransactionIds;
let currentNetwork;
/**
 * Get human readable string from satoshis
 */
const formatSatoshi = (amount) => {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });
    return `${localeString} ${configManager.get("network.client.symbol")}`;
};
/**
 * Check if the given block or transaction id is an exception.
 */
const isIdException = (id) => {
    if (!id) {
        return false;
    }
    const network = configManager.get("network.pubKeyHash");
    if (!whitelistedBlockAndTransactionIds || currentNetwork !== network) {
        currentNetwork = network;
        whitelistedBlockAndTransactionIds = [
            ...(configManager.get("exceptions.blocks") || []),
            ...(configManager.get("exceptions.transactions") || []),
        ].reduce((acc, curr) => Object.assign(acc, { [curr]: true }), {});
    }
    return !!whitelistedBlockAndTransactionIds[id];
};
const isException = (blockOrTransaction) => {
    if (typeof blockOrTransaction.id !== "string") {
        return false;
    }
    if (blockOrTransaction.id.length < 64) {
        // old block ids, we check that the transactions inside the block are correct
        const blockExceptionTxIds = (configManager.get("exceptions.blocksTransactions") || {})[blockOrTransaction.id];
        const blockTransactions = blockOrTransaction.transactions || [];
        if (!blockExceptionTxIds || blockExceptionTxIds.length !== blockTransactions.length) {
            return false;
        }
        blockExceptionTxIds.sort();
        const blockToCheckTxIds = blockTransactions.map((tx) => tx.id).sort();
        for (let i = 0; i < blockExceptionTxIds.length; i++) {
            if (blockToCheckTxIds[i] !== blockExceptionTxIds[i]) {
                return false;
            }
        }
    }
    return isIdException(blockOrTransaction.id);
};
const isGenesisTransaction = (id) => {
    const network = configManager.get("network.pubKeyHash");
    if (!genesisTransactions || currentNetwork !== network) {
        currentNetwork = network;
        genesisTransactions = configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.id]: true }), {});
    }
    return genesisTransactions[id];
};
const numberToHex = (num, padding = 2) => {
    const indexHex = Number(num).toString(16);
    return "0".repeat(padding - indexHex.length) + indexHex;
};
const isSupportedTransactionVersion = (version) => {
    const { acceptLegacySchnorrTransactions, bip340 } = configManager.getMilestone();
    return version === 3 || (version === 2 && (acceptLegacySchnorrTransactions || !bip340));
};
const calculateDevFund = (height, reward) => {
    const constants = configManager.getMilestone(height);
    const devFund = {};
    if (!constants.devFund) {
        return {};
    }
    for (const [wallet, percent] of Object.entries(constants.devFund)) {
        devFund[wallet] = reward.times(Math.round(percent * 100)).dividedBy(10000);
    }
    return devFund;
};

var index$7 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    formatSatoshi: formatSatoshi,
    isIdException: isIdException,
    isException: isException,
    isGenesisTransaction: isGenesisTransaction,
    numberToHex: numberToHex,
    isSupportedTransactionVersion: isSupportedTransactionVersion,
    calculateDevFund: calculateDevFund,
    Base58: Base58,
    BigNumber: BigNumber,
    ByteBuffer: ByteBuffer,
    ByteBufferArray: ByteBufferArray,
    isValidPeer: isValidPeer,
    isLocalHost: isLocalHost,
    calculateBlockTime: calculateBlockTime,
    isNewBlockTime: isNewBlockTime,
    calculateReward: calculateReward,
    sortVotes: sortVotes
});

class Keys {
    static fromPassphrase(passphrase, compressed = true) {
        return Keys.fromPrivateKey(HashAlgorithms.sha256(Buffer.from(passphrase, "utf8")), compressed);
    }
    static fromPrivateKey(privateKey, compressed = true) {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");
        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
    static fromWIF(wifKey, network) {
        if (!network) {
            network = configManager.get("network");
        }
        if (!network) {
            throw new Error();
        }
        const { version, compressed, privateKey } = wif$2.decode(wifKey, network.wif);
        if (version !== network.wif) {
            throw new NetworkVersionError(network.wif, version);
        }
        return {
            publicKey: secp256k1.publicKeyCreate(privateKey, compressed).toString("hex"),
            privateKey: privateKey.toString("hex"),
            compressed,
        };
    }
}

class PublicKey {
    static fromPassphrase(passphrase) {
        return Keys.fromPassphrase(passphrase).publicKey;
    }
    static fromWIF(wif, network) {
        return Keys.fromWIF(wif, network).publicKey;
    }
    static fromMultiSignatureAsset(asset) {
        const { min, publicKeys } = asset;
        for (const publicKey of publicKeys) {
            if (!this.verify(publicKey)) {
                throw new PublicKeyError(publicKey);
            }
        }
        if (min < 1 || min > publicKeys.length) {
            throw new InvalidMultiSignatureAssetError();
        }
        const minKey = PublicKey.fromPassphrase(numberToHex(min));
        const keys = [minKey, ...publicKeys];
        return secp256k1
            .publicKeyCombine(keys.map((publicKey) => Buffer.from(publicKey, "hex")))
            .toString("hex");
    }
    static verify(publicKey) {
        return secp256k1.publicKeyVerify(Buffer.from(publicKey, "hex"));
    }
}

class Address {
    static fromPassphrase(passphrase, networkVersion) {
        return Address.fromPublicKey(PublicKey.fromPassphrase(passphrase), networkVersion);
    }
    static fromPublicKey(publicKey, networkVersion) {
        if (!PublicKey.verify(publicKey)) {
            throw new PublicKeyError(publicKey);
        }
        const buffer = HashAlgorithms.ripemd160(Buffer.from(publicKey, "hex"));
        const payload = Buffer.alloc(21);
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }
        if (!networkVersion) {
            throw new Error();
        }
        payload.writeUInt8(networkVersion, 0);
        buffer.copy(payload, 1);
        return this.fromBuffer(payload);
    }
    static fromWIF(wif, network) {
        return Address.fromPublicKey(PublicKey.fromWIF(wif, network));
    }
    static fromMultiSignatureAsset(asset, networkVersion) {
        return this.fromPublicKey(PublicKey.fromMultiSignatureAsset(asset), networkVersion);
    }
    static fromPrivateKey(privateKey, networkVersion) {
        return Address.fromPublicKey(privateKey.publicKey, networkVersion);
    }
    static fromBuffer(buffer) {
        return Base58.encodeCheck(buffer);
    }
    static toBuffer(address) {
        const buffer = Base58.decodeCheck(address);
        const networkVersion = configManager.get("network.pubKeyHash");
        const result = {
            addressBuffer: buffer,
        };
        if (buffer[0] !== networkVersion) {
            result.addressError = `Expected address network byte ${networkVersion}, but got ${buffer[0]}.`;
        }
        return result;
    }
    static validate(address, networkVersion) {
        if (!networkVersion) {
            networkVersion = configManager.get("network.pubKeyHash");
        }
        try {
            return Base58.decodeCheck(address)[0] === networkVersion;
        }
        catch (err) {
            return false;
        }
    }
}

class PrivateKey {
    static fromPassphrase(passphrase) {
        return Keys.fromPassphrase(passphrase).privateKey;
    }
    static fromWIF(wif, network) {
        return Keys.fromWIF(wif, network).privateKey;
    }
}

class WIF {
    static fromPassphrase(passphrase, network) {
        const keys = Keys.fromPassphrase(passphrase);
        if (!network) {
            network = configManager.get("network");
        }
        if (!network) {
            throw new Error();
        }
        return wif$2.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
    static fromKeys(keys, network) {
        if (!network) {
            network = configManager.get("network");
        }
        if (!network) {
            throw new Error();
        }
        return wif$2.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}

var index$6 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Address: Address,
    Keys: Keys,
    PrivateKey: PrivateKey,
    PublicKey: PublicKey,
    WIF: WIF
});

class Message {
    static sign(message, passphrase) {
        const keys = Keys.fromPassphrase(passphrase);
        return {
            publicKey: keys.publicKey,
            signature: Hash.signSchnorr(this.createHash(message), keys, true),
            message,
        };
    }
    static signWithWif(message, wif, network) {
        if (!network) {
            network = configManager.get("network");
        }
        const keys = Keys.fromWIF(wif, network);
        return {
            publicKey: keys.publicKey,
            signature: Hash.signSchnorr(this.createHash(message), keys, true),
            message,
        };
    }
    static verify({ message, publicKey, signature }) {
        return Hash.verifySchnorr(this.createHash(message), signature, publicKey, true);
    }
    static createHash(message) {
        return HashAlgorithms.sha256(message);
    }
}

class Slots {
    static getTime(time) {
        if (time === undefined) {
            time = dayjs().valueOf();
        }
        const start = dayjs(configManager.getMilestone(1).epoch).valueOf();
        return Math.floor((time - start) / 1000);
    }
    static getTimeInMsUntilNextSlot(getTimeStampForBlock) {
        const nextSlotTime = this.getSlotTime(getTimeStampForBlock, this.getNextSlot(getTimeStampForBlock));
        const now = this.getTime();
        return (nextSlotTime - now) * 1000;
    }
    static getSlotNumber(getTimeStampForBlock, timestamp, height) {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }
        const latestHeight = this.getLatestHeight(height);
        return this.getSlotInfo(getTimeStampForBlock, timestamp, latestHeight).slotNumber;
    }
    static getSlotTime(getTimeStampForBlock, slot, height) {
        const latestHeight = this.getLatestHeight(height);
        return this.calculateSlotTime(slot, latestHeight, getTimeStampForBlock);
    }
    static getNextSlot(getTimeStampForBlock) {
        return this.getSlotNumber(getTimeStampForBlock) + 1;
    }
    static isForgingAllowed(getTimeStampForBlock, timestamp, height) {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }
        const latestHeight = this.getLatestHeight(height);
        return this.getSlotInfo(getTimeStampForBlock, timestamp, latestHeight).forgingStatus;
    }
    static getSlotInfo(getTimeStampForBlock, timestamp, height) {
        if (timestamp === undefined) {
            timestamp = this.getTime();
        }
        height = this.getLatestHeight(height);
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let lastSpanEndTime = 0;
        let previousMilestoneHeight = 1;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blockTime");
        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                break;
            }
            const spanStartTimestamp = getTimeStampForBlock(previousMilestoneHeight);
            lastSpanEndTime = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;
            totalSlotsFromLastSpan += Math.floor((lastSpanEndTime - spanStartTimestamp) / blockTime);
            blockTime = nextMilestone.data;
            previousMilestoneHeight = nextMilestone.height;
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blockTime");
        }
        const slotNumberUpUntilThisTimestamp = Math.floor((timestamp - lastSpanEndTime) / blockTime);
        const slotNumber = totalSlotsFromLastSpan + slotNumberUpUntilThisTimestamp;
        const startTime = lastSpanEndTime + slotNumberUpUntilThisTimestamp * blockTime;
        const endTime = startTime + blockTime - 1;
        const forgingStatus = timestamp < startTime + Math.floor(blockTime / 2);
        return {
            blockTime,
            startTime,
            endTime,
            slotNumber,
            forgingStatus,
        };
    }
    static getMilestonesWhichAffectBlockTimes() {
        const milestones = [
            {
                found: true,
                height: 1,
                data: configManager.getMilestone(1).blockTime,
            },
        ];
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blockTime");
        while (nextMilestone.found) {
            milestones.push(nextMilestone);
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blockTime");
        }
        return milestones;
    }
    static calculateSlotTime(slotNumber, height, getTimeStampForBlock) {
        let blockTime = calculateBlockTime(1);
        let totalSlotsFromLastSpan = 0;
        let milestoneHeight = 1;
        let lastSpanEndTime = 0;
        let nextMilestone = configManager.getNextMilestoneWithNewKey(1, "blockTime");
        for (let i = 0; i < this.getMilestonesWhichAffectBlockTimes().length - 1; i++) {
            if (height < nextMilestone.height) {
                break;
            }
            const spanStartTimestamp = getTimeStampForBlock(milestoneHeight);
            lastSpanEndTime = getTimeStampForBlock(nextMilestone.height - 1) + blockTime;
            totalSlotsFromLastSpan += Math.floor((lastSpanEndTime - spanStartTimestamp) / blockTime);
            blockTime = nextMilestone.data;
            milestoneHeight = nextMilestone.height;
            nextMilestone = configManager.getNextMilestoneWithNewKey(nextMilestone.height, "blockTime");
        }
        return lastSpanEndTime + (slotNumber - totalSlotsFromLastSpan) * blockTime;
    }
    static getLatestHeight(height) {
        if (!height) {
            // TODO: is the config manager the best way to retrieve most recent height?
            // Or should this class maintain its own cache?
            const configConfiguredHeight = configManager.getHeight();
            if (configConfiguredHeight) {
                return configConfiguredHeight;
            }
            else {
                return 1;
            }
        }
        return height;
    }
}

var index$5 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Hash: Hash,
    HashAlgorithms: HashAlgorithms,
    HDWallet: HDWallet,
    Message: Message,
    Slots: Slots
});

var CoreTransactionType;
(function (CoreTransactionType) {
    CoreTransactionType[CoreTransactionType["LegacyTransfer"] = 0] = "LegacyTransfer";
    CoreTransactionType[CoreTransactionType["SecondSignature"] = 1] = "SecondSignature";
    CoreTransactionType[CoreTransactionType["DelegateRegistration"] = 2] = "DelegateRegistration";
    CoreTransactionType[CoreTransactionType["Vote"] = 3] = "Vote";
    CoreTransactionType[CoreTransactionType["MultiSignature"] = 4] = "MultiSignature";
    CoreTransactionType[CoreTransactionType["Ipfs"] = 5] = "Ipfs";
    CoreTransactionType[CoreTransactionType["Transfer"] = 6] = "Transfer";
    CoreTransactionType[CoreTransactionType["DelegateResignation"] = 7] = "DelegateResignation";
    CoreTransactionType[CoreTransactionType["HtlcLock"] = 8] = "HtlcLock";
    CoreTransactionType[CoreTransactionType["HtlcClaim"] = 9] = "HtlcClaim";
    CoreTransactionType[CoreTransactionType["HtlcRefund"] = 10] = "HtlcRefund";
})(CoreTransactionType || (CoreTransactionType = {}));
var SolarTransactionType;
(function (SolarTransactionType) {
    SolarTransactionType[SolarTransactionType["Burn"] = 0] = "Burn";
    SolarTransactionType[SolarTransactionType["Vote"] = 2] = "Vote";
})(SolarTransactionType || (SolarTransactionType = {}));
const TransactionType = Object.assign({ Core: CoreTransactionType, Solar: SolarTransactionType }, CoreTransactionType);
var TransactionTypeGroup;
(function (TransactionTypeGroup) {
    TransactionTypeGroup[TransactionTypeGroup["Test"] = 0] = "Test";
    TransactionTypeGroup[TransactionTypeGroup["Core"] = 1] = "Core";
    TransactionTypeGroup[TransactionTypeGroup["Solar"] = 2] = "Solar";
    // Everything above is available to anyone
    TransactionTypeGroup[TransactionTypeGroup["Reserved"] = 1000] = "Reserved";
})(TransactionTypeGroup || (TransactionTypeGroup = {}));
var DelegateStatus;
(function (DelegateStatus) {
    DelegateStatus[DelegateStatus["TemporaryResign"] = 0] = "TemporaryResign";
    DelegateStatus[DelegateStatus["PermanentResign"] = 1] = "PermanentResign";
    DelegateStatus[DelegateStatus["NotResigned"] = 2] = "NotResigned";
})(DelegateStatus || (DelegateStatus = {}));
var HtlcLockExpirationType;
(function (HtlcLockExpirationType) {
    HtlcLockExpirationType[HtlcLockExpirationType["EpochTimestamp"] = 1] = "EpochTimestamp";
    HtlcLockExpirationType[HtlcLockExpirationType["BlockHeight"] = 2] = "BlockHeight";
})(HtlcLockExpirationType || (HtlcLockExpirationType = {}));
var HtlcSecretHashType;
(function (HtlcSecretHashType) {
    HtlcSecretHashType[HtlcSecretHashType["SHA256"] = 0] = "SHA256";
    HtlcSecretHashType[HtlcSecretHashType["SHA384"] = 1] = "SHA384";
    HtlcSecretHashType[HtlcSecretHashType["SHA512"] = 2] = "SHA512";
    HtlcSecretHashType[HtlcSecretHashType["SHA3256"] = 3] = "SHA3256";
    HtlcSecretHashType[HtlcSecretHashType["SHA3384"] = 4] = "SHA3384";
    HtlcSecretHashType[HtlcSecretHashType["SHA3512"] = 5] = "SHA3512";
    HtlcSecretHashType[HtlcSecretHashType["Keccak256"] = 6] = "Keccak256";
    HtlcSecretHashType[HtlcSecretHashType["Keccak384"] = 7] = "Keccak384";
    HtlcSecretHashType[HtlcSecretHashType["Keccak512"] = 8] = "Keccak512";
})(HtlcSecretHashType || (HtlcSecretHashType = {}));

var enums = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get CoreTransactionType () { return CoreTransactionType; },
    get SolarTransactionType () { return SolarTransactionType; },
    TransactionType: TransactionType,
    get TransactionTypeGroup () { return TransactionTypeGroup; },
    get DelegateStatus () { return DelegateStatus; },
    get HtlcLockExpirationType () { return HtlcLockExpirationType; },
    get HtlcSecretHashType () { return HtlcSecretHashType; }
});

class Serialiser$1 {
    static getBytes(transaction, options = {}) {
        const version = transaction.version || 1;
        if (options.acceptLegacyVersion || options.disableVersionCheck || isSupportedTransactionVersion(version)) {
            return this.serialise(TransactionTypeFactory.create(transaction), options);
        }
        else {
            throw new TransactionVersionError(version);
        }
    }
    /**
     * Serialises the given transaction
     */
    static serialise(transaction, options = {}) {
        var _a, _b;
        let size = 83886;
        const maxPayload = (_a = configManager.getMilestone(configManager.getHeight()).block) === null || _a === void 0 ? void 0 : _a.maxPayload;
        const maxTransactions = (_b = configManager.getMilestone(configManager.getHeight()).block) === null || _b === void 0 ? void 0 : _b.maxTransactions;
        if (maxPayload && maxTransactions) {
            size = Math.floor(maxPayload / maxTransactions) * 2;
        }
        const buff = new ByteBuffer(Buffer.alloc(size));
        this.serialiseCommon(transaction.data, buff);
        this.serialiseMemo(transaction, buff);
        const serialised = transaction.serialise(options);
        if (!serialised) {
            throw new Error();
        }
        buff.writeBuffer(serialised.getResult());
        this.serialiseSignatures(transaction.data, buff, options);
        const bufferBuffer = buff.getResult();
        transaction.serialised = bufferBuffer;
        return bufferBuffer;
    }
    static serialiseCommon(transaction, buff) {
        transaction.version = transaction.version || 0x03;
        transaction.headerType = transaction.headerType || 0x00;
        if (transaction.typeGroup === undefined) {
            transaction.typeGroup = TransactionTypeGroup.Core;
        }
        buff.writeUInt8(0xff - transaction.headerType);
        buff.writeUInt8(transaction.version);
        buff.writeUInt8(transaction.network || configManager.get("network.pubKeyHash"));
        buff.writeUInt32LE(transaction.typeGroup);
        buff.writeUInt16LE(transaction.type);
        buff.writeBigInt64LE(transaction.nonce.toBigInt());
        buff.writeBuffer(Buffer.from(transaction.senderPublicKey, "hex"));
        buff.writeBigInt64LE(transaction.fee.toBigInt());
    }
    static serialiseMemo(transaction, buff) {
        const { data } = transaction;
        if (data.memo) {
            const memo = Buffer.from(data.memo, "utf8");
            buff.writeUInt8(memo.length);
            buff.writeBuffer(memo);
        }
        else {
            buff.writeUInt8(0x00);
        }
    }
    static serialiseSignatures(transaction, buff, options = {}) {
        if (transaction.signature && !options.excludeSignature) {
            buff.writeBuffer(Buffer.from(transaction.signature, "hex"));
        }
        const secondSignature = transaction.secondSignature || transaction.signSignature;
        if (secondSignature && !options.excludeSecondSignature) {
            buff.writeBuffer(Buffer.from(secondSignature, "hex"));
        }
        if (transaction.signatures) {
            if (!options.excludeMultiSignature) {
                buff.writeBuffer(Buffer.from(transaction.signatures.join(""), "hex"));
            }
        }
    }
}

class InternalTransactionType {
    constructor(type, typeGroup) {
        this.type = type;
        this.typeGroup = typeGroup;
    }
    static from(type, typeGroup) {
        if (typeGroup === undefined) {
            typeGroup = TransactionTypeGroup.Core;
        }
        const compositeType = `${typeGroup}-${type}`;
        if (!this.types.has(compositeType)) {
            this.types.set(compositeType, new InternalTransactionType(type, typeGroup));
        }
        return this.types.get(compositeType);
    }
    toString() {
        switch (this.typeGroup) {
            case TransactionTypeGroup.Core: {
                return `Core/${this.type}`;
            }
            case TransactionTypeGroup.Reserved: {
                return `Reserved/${this.type}`;
            }
            case TransactionTypeGroup.Solar: {
                return `Solar/${this.type}`;
            }
            case TransactionTypeGroup.Test: {
                return `Test/${this.type}`;
            }
        }
        return `${this.typeGroup}/${this.type}`;
    }
}
InternalTransactionType.types = new Map();

class TransactionTypeFactory {
    static initialise(transactionTypes) {
        this.transactionTypes = transactionTypes;
    }
    static create(data) {
        const instance = new (this.get(data.type, data.typeGroup, data.version))();
        instance.data = data;
        instance.data.version = data.version || 3;
        return instance;
    }
    static get(type, typeGroup, version) {
        const internalType = InternalTransactionType.from(type, typeGroup);
        if (!this.transactionTypes.has(internalType)) {
            throw new UnknownTransactionError(internalType.toString());
        }
        return this.transactionTypes.get(internalType);
    }
}

class Utils {
    static toBytes(data) {
        return Serialiser$1.serialise(TransactionTypeFactory.create(data));
    }
    static toHash(transaction, options) {
        return HashAlgorithms.sha256(Serialiser$1.getBytes(transaction, options));
    }
    static getId(transaction, options = {}) {
        const id = Utils.toHash(transaction, options).toString("hex");
        // WORKAROUND:
        // A handful of mainnet transactions have an invalid recipient. Due to a
        // refactor of the Address network byte validation it is no longer
        // trivially possible to handle them. If an invalid address is encountered
        // during transfer serialization, the error is bubbled up to defer the
        // `AddressNetworkByteError` until the actual id is available to call
        // `isException`.
        if (options.addressError && !isException({ id })) {
            throw new AddressNetworkError(options.addressError);
        }
        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");
        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }
        return id;
    }
}

class Verifier {
    static verify(data, options) {
        if (isException(data)) {
            return true;
        }
        return Verifier.verifyHash(data, options === null || options === void 0 ? void 0 : options.disableVersionCheck);
    }
    static verifySecondSignature(transaction, publicKey, options) {
        const secondSignature = transaction.secondSignature || transaction.signSignature;
        if (!secondSignature) {
            return false;
        }
        const hash = Utils.toHash(transaction, {
            disableVersionCheck: options === null || options === void 0 ? void 0 : options.disableVersionCheck,
            excludeSecondSignature: true,
        });
        return this.internalVerifySignature(hash, secondSignature, publicKey, transaction.version > 2);
    }
    static verifySignatures(transaction, multiSignature) {
        if (!multiSignature) {
            throw new InvalidMultiSignatureAssetError();
        }
        const { publicKeys, min } = multiSignature;
        const { signatures } = transaction;
        const hash = Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });
        const publicKeyIndexes = {};
        let verified = false;
        let verifiedSignatures = 0;
        if (signatures) {
            for (let i = 0; i < signatures.length; i++) {
                const signature = signatures[i];
                const publicKeyIndex = parseInt(signature.slice(0, 2), 16);
                if (!publicKeyIndexes[publicKeyIndex]) {
                    publicKeyIndexes[publicKeyIndex] = true;
                }
                else {
                    throw new DuplicateParticipantInMultiSignatureError();
                }
                const partialSignature = signature.slice(2, 130);
                const publicKey = publicKeys[publicKeyIndex];
                if (Hash.verifySchnorr(hash, partialSignature, publicKey, transaction.version > 2)) {
                    verifiedSignatures++;
                }
                if (verifiedSignatures === min) {
                    verified = true;
                    break;
                }
                else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                    break;
                }
            }
        }
        return verified;
    }
    static verifyHash(data, disableVersionCheck = false) {
        const { signature, senderPublicKey } = data;
        if (!signature || !senderPublicKey) {
            return false;
        }
        const hash = Utils.toHash(data, {
            disableVersionCheck,
            excludeSignature: true,
            excludeSecondSignature: true,
        });
        return this.internalVerifySignature(hash, signature, senderPublicKey, data.version > 2);
    }
    static internalVerifySignature(hash, signature, publicKey, bip340) {
        return Hash.verifySchnorr(hash, signature, publicKey, bip340);
    }
}

class Transaction {
    constructor() {
        this.isVerified = false;
    }
    get id() {
        return this.data.id;
    }
    get type() {
        return this.data.type;
    }
    get typeGroup() {
        return this.data.typeGroup;
    }
    get verified() {
        return this.isVerified;
    }
    get key() {
        return this.__proto__.constructor.key;
    }
    get staticFee() {
        return this.__proto__.constructor.staticFee({ data: this.data });
    }
    static staticFee(feeContext = {}) {
        const milestones = configManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees && this.key) {
            const fee = milestones.fees.staticFees[this.key];
            if (fee !== undefined) {
                return BigNumber.make(fee);
            }
        }
        return this.defaultStaticFee;
    }
    setBurnedFee(height) {
        const milestone = configManager.getMilestone(height);
        this.data.burnedFee = BigNumber.ZERO;
        if (typeof milestone.burn === "object" && typeof milestone.burn.feePercent === "number") {
            const feePercent = parseInt(milestone.burn.feePercent);
            if (feePercent >= 0 && feePercent <= 100) {
                this.data.burnedFee = this.data.fee.times(feePercent).dividedBy(100);
            }
        }
    }
    verify(options) {
        return Verifier.verify(this.data, options);
    }
    verifySecondSignature(publicKey) {
        return Verifier.verifySecondSignature(this.data, publicKey);
    }
    toJson() {
        const data = JSON.parse(JSON.stringify(this.data));
        if (data.typeGroup === TransactionTypeGroup.Core) {
            delete data.typeGroup;
        }
        delete data.timestamp;
        return data;
    }
    toString() {
        const parts = [];
        if (this.data.senderPublicKey && this.data.nonce) {
            parts.push(`${Address.fromPublicKey(this.data.senderPublicKey)}#${this.data.nonce}`);
        }
        else if (this.data.senderPublicKey) {
            parts.push(`${Address.fromPublicKey(this.data.senderPublicKey)}`);
        }
        if (this.data.id) {
            parts.push(this.data.id.slice(-8));
        }
        parts.push(`${this.key[0].toUpperCase()}${this.key.slice(1)} v${this.data.version}`);
        return parts.join(" ");
    }
}
Transaction.type = undefined;
Transaction.typeGroup = undefined;
Transaction.key = undefined;
Transaction.defaultStaticFee = BigNumber.ZERO;

class DelegateRegistrationTransaction extends Transaction {
    serialise() {
        const { data } = this;
        if (data.asset && data.asset.delegate) {
            const delegateBytes = Buffer.from(data.asset.delegate.username, "utf8");
            const buff = new ByteBuffer(Buffer.alloc(delegateBytes.length + 1));
            buff.writeUInt8(delegateBytes.length);
            buff.writeBuffer(delegateBytes);
            return buff;
        }
        return undefined;
    }
    deserialise(buf) {
        const { data } = this;
        const usernameLength = buf.readUInt8();
        data.asset = {
            delegate: {
                username: buf.readBuffer(usernameLength).toString("utf8"),
            },
        };
    }
}
DelegateRegistrationTransaction.typeGroup = TransactionTypeGroup.Core;
DelegateRegistrationTransaction.type = TransactionType.Core.DelegateRegistration;
DelegateRegistrationTransaction.key = "delegateRegistration";
DelegateRegistrationTransaction.defaultStaticFee = BigNumber.make("2500000000");

class DelegateResignationTransaction extends Transaction {
    serialise() {
        const { data } = this;
        if (!data.asset || !data.asset.resignationType) {
            return new ByteBuffer(Buffer.alloc(0));
        }
        const buff = new ByteBuffer(Buffer.alloc(1));
        buff.writeUInt8(0xff - data.asset.resignationType);
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const remainderLength = buf.getRemainderLength();
        if ((remainderLength <= 128 && remainderLength % 64 === 0) ||
            (remainderLength >= 130 && remainderLength % 65 === 0)) {
            return;
        }
        const resignationType = buf.readUInt8();
        // make sure this is not a signatures array with only one signature since that can be in the range 00-0F here
        if (resignationType <= 0x0f) {
            buf.jump(-1);
            return;
        }
        data.asset = {
            resignationType: 0xff - resignationType,
        };
    }
}
DelegateResignationTransaction.typeGroup = TransactionTypeGroup.Core;
DelegateResignationTransaction.type = TransactionType.Core.DelegateResignation;
DelegateResignationTransaction.key = "delegateResignation";
DelegateResignationTransaction.defaultStaticFee = BigNumber.make("2500000000");

class HtlcClaimTransaction extends Transaction {
    serialise() {
        const { data } = this;
        if (!data.asset || !data.asset.claim) {
            return new ByteBuffer(Buffer.alloc(0));
        }
        const unlockSecret = Buffer.from(data.asset.claim.unlockSecret, "hex");
        const buff = new ByteBuffer(Buffer.alloc(34 + unlockSecret.length));
        buff.writeUInt8(data.asset.claim.hashType);
        buff.writeBuffer(Buffer.from(data.asset.claim.lockTransactionId, "hex"));
        buff.writeUInt8(unlockSecret.length);
        buff.writeBuffer(unlockSecret);
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const hashType = buf.readUInt8();
        const lockTransactionId = buf.readBuffer(32).toString("hex");
        const unlockSecretLength = buf.readUInt8();
        const unlockSecret = buf.readBuffer(unlockSecretLength).toString("hex");
        data.asset = {
            claim: {
                hashType,
                lockTransactionId,
                unlockSecret,
            },
        };
    }
}
HtlcClaimTransaction.typeGroup = TransactionTypeGroup.Core;
HtlcClaimTransaction.type = TransactionType.Core.HtlcClaim;
HtlcClaimTransaction.key = "htlcClaim";
HtlcClaimTransaction.defaultStaticFee = BigNumber.ZERO;

class HtlcLockTransaction extends Transaction {
    serialise(options) {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(99));
        buff.writeBigUInt64LE(data.amount.toBigInt());
        if (data.asset && data.asset.lock) {
            const secretHash = Buffer.from(data.asset.lock.secretHash, "hex");
            buff.writeUInt8(secretHash.length);
            buff.writeBuffer(secretHash);
            buff.writeUInt8(data.asset.lock.expiration.type);
            buff.writeUInt32LE(data.asset.lock.expiration.value);
        }
        if (data.recipientId) {
            const { addressBuffer, addressError } = Address.toBuffer(data.recipientId);
            if (options) {
                options.addressError = addressError;
            }
            buff.writeBuffer(addressBuffer);
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const amount = BigNumber.make(buf.readBigUInt64LE().toString());
        const secretHashLength = buf.readUInt8();
        const secretHash = buf.readBuffer(secretHashLength).toString("hex");
        const expirationType = buf.readUInt8();
        const expirationValue = buf.readUInt32LE();
        const recipientId = Address.fromBuffer(buf.readBuffer(21));
        data.amount = amount;
        data.recipientId = recipientId;
        data.asset = {
            lock: {
                secretHash,
                expiration: {
                    type: expirationType,
                    value: expirationValue,
                },
            },
        };
    }
}
HtlcLockTransaction.typeGroup = TransactionTypeGroup.Core;
HtlcLockTransaction.type = TransactionType.Core.HtlcLock;
HtlcLockTransaction.key = "htlcLock";
HtlcLockTransaction.defaultStaticFee = BigNumber.make("10000000");

class HtlcRefundTransaction extends Transaction {
    serialise() {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(32));
        if (data.asset && data.asset.refund) {
            buff.writeBuffer(Buffer.from(data.asset.refund.lockTransactionId, "hex"));
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const lockTransactionId = buf.readBuffer(32).toString("hex");
        data.asset = {
            refund: {
                lockTransactionId,
            },
        };
    }
}
HtlcRefundTransaction.typeGroup = TransactionTypeGroup.Core;
HtlcRefundTransaction.type = TransactionType.Core.HtlcRefund;
HtlcRefundTransaction.key = "htlcRefund";
HtlcRefundTransaction.defaultStaticFee = BigNumber.ZERO;

class IpfsTransaction extends Transaction {
    serialise() {
        const { data } = this;
        if (data.asset) {
            const ipfsBuffer = base58.decode(data.asset.ipfs);
            const buff = new ByteBuffer(Buffer.alloc(ipfsBuffer.length));
            buff.writeBuffer(ipfsBuffer);
            return buff;
        }
        return undefined;
    }
    deserialise(buf) {
        const { data } = this;
        const hashFunction = buf.readUInt8();
        const ipfsHashLength = buf.readUInt8();
        const ipfsHash = buf.readBuffer(ipfsHashLength);
        const buff = Buffer.alloc(ipfsHashLength + 2);
        buff.writeUInt8(hashFunction, 0);
        buff.writeUInt8(ipfsHashLength, 1);
        buff.fill(ipfsHash, 2);
        data.asset = {
            ipfs: base58.encode(buff),
        };
    }
}
IpfsTransaction.typeGroup = TransactionTypeGroup.Core;
IpfsTransaction.type = TransactionType.Core.Ipfs;
IpfsTransaction.key = "ipfs";
IpfsTransaction.defaultStaticFee = BigNumber.make("500000000");

class TransferTransaction extends Transaction {
    serialise(options = {}) {
        const { data } = this;
        if (data.asset && data.asset.transfers) {
            const buff = new ByteBuffer(Buffer.alloc(2 + data.asset.transfers.length * 29));
            buff.writeUInt16LE(data.asset.transfers.length);
            for (const transfer of data.asset.transfers) {
                buff.writeBigUInt64LE(transfer.amount.toBigInt());
                const { addressBuffer, addressError } = Address.toBuffer(transfer.recipientId);
                options.addressError = addressError || options.addressError;
                buff.writeBuffer(addressBuffer);
            }
            return buff;
        }
        return undefined;
    }
    deserialise(buf) {
        const { data } = this;
        const transfers = [];
        const total = buf.readUInt16LE();
        for (let j = 0; j < total; j++) {
            transfers.push({
                amount: BigNumber.make(buf.readBigUInt64LE().toString()),
                recipientId: Address.fromBuffer(buf.readBuffer(21)),
            });
        }
        data.asset = { transfers };
    }
}
TransferTransaction.typeGroup = TransactionTypeGroup.Core;
TransferTransaction.type = TransactionType.Core.Transfer;
TransferTransaction.key = "transfer";
TransferTransaction.defaultStaticFee = BigNumber.make("10000000");

class MultiSignatureRegistrationTransaction extends Transaction {
    static staticFee(feeContext = {}) {
        var _a, _b;
        if ((_b = (_a = feeContext.data) === null || _a === void 0 ? void 0 : _a.asset) === null || _b === void 0 ? void 0 : _b.multiSignature) {
            return super.staticFee(feeContext).times(feeContext.data.asset.multiSignature.publicKeys.length + 1);
        }
        return super.staticFee(feeContext);
    }
    serialise() {
        const { data } = this;
        const { min, publicKeys } = data.asset.multiSignature;
        const buff = new ByteBuffer(Buffer.alloc(2 + publicKeys.length * 33));
        buff.writeUInt8(min);
        buff.writeUInt8(publicKeys.length);
        for (const publicKey of publicKeys) {
            buff.writeBuffer(Buffer.from(publicKey, "hex"));
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const multiSignature = { publicKeys: [], min: 0 };
        multiSignature.min = buf.readUInt8();
        const count = buf.readUInt8();
        for (let i = 0; i < count; i++) {
            const publicKey = buf.readBuffer(33).toString("hex");
            multiSignature.publicKeys.push(publicKey);
        }
        data.asset = { multiSignature };
    }
}
MultiSignatureRegistrationTransaction.typeGroup = TransactionTypeGroup.Core;
MultiSignatureRegistrationTransaction.type = TransactionType.Core.MultiSignature;
MultiSignatureRegistrationTransaction.key = "multiSignature";
MultiSignatureRegistrationTransaction.defaultStaticFee = BigNumber.make("500000000");

class SecondSignatureRegistrationTransaction extends Transaction {
    serialise() {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(33));
        if (data.asset && data.asset.signature) {
            buff.writeBuffer(Buffer.from(data.asset.signature.publicKey, "hex"));
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        data.asset = {
            signature: {
                publicKey: buf.readBuffer(33).toString("hex"),
            },
        };
    }
}
SecondSignatureRegistrationTransaction.typeGroup = TransactionTypeGroup.Core;
SecondSignatureRegistrationTransaction.type = TransactionType.Core.SecondSignature;
SecondSignatureRegistrationTransaction.key = "secondSignature";
SecondSignatureRegistrationTransaction.defaultStaticFee = BigNumber.make("500000000");

class LegacyTransferTransaction extends Transaction {
    serialise(options) {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(33));
        buff.writeBigUInt64LE(data.amount.toBigInt());
        buff.writeUInt32LE(data.expiration || 0);
        if (data.recipientId) {
            const { addressBuffer, addressError } = Address.toBuffer(data.recipientId);
            if (options) {
                options.addressError = addressError;
            }
            buff.writeBuffer(addressBuffer);
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        data.amount = BigNumber.make(buf.readBigUInt64LE().toString());
        data.expiration = buf.readUInt32LE();
        data.recipientId = Address.fromBuffer(buf.readBuffer(21));
    }
}
LegacyTransferTransaction.typeGroup = TransactionTypeGroup.Core;
LegacyTransferTransaction.type = TransactionType.Core.LegacyTransfer;
LegacyTransferTransaction.key = "legacyTransfer";
LegacyTransferTransaction.defaultStaticFee = BigNumber.make("10000000");

class LegacyVoteTransaction extends Transaction {
    serialise() {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(69));
        if (data.asset && data.asset.votes) {
            const votes = data.asset.votes;
            const voteBytes = votes
                .map((vote) => {
                const prefix = vote.startsWith("+") ? "01" : "00";
                const sliced = vote.slice(1);
                if (sliced.length === 66) {
                    return prefix + sliced;
                }
                const hex = vote.length.toString(16).padStart(2, "0") + prefix + Buffer.from(sliced).toString("hex");
                if (data.version === 2) {
                    return "ff" + hex;
                }
                return hex;
            })
                .join("");
            buff.writeUInt8(votes.length);
            buff.writeBuffer(Buffer.from(voteBytes, "hex"));
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const voteLength = buf.readUInt8();
        data.asset = { votes: [] };
        for (let i = 0; i < voteLength; i++) {
            let vote;
            if (data.version === 2 && buf.readUInt8() !== 0xff) {
                buf.jump(-1);
                vote = buf.readBuffer(34).toString("hex");
                vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);
            }
            else {
                const length = buf.readUInt8();
                const voteBuffer = buf.readBuffer(length);
                const prefix = voteBuffer.readUInt8();
                vote = (prefix === 1 ? "+" : "-") + voteBuffer.slice(1).toString();
            }
            if (data.asset && data.asset.votes) {
                data.asset.votes.push(vote);
            }
        }
    }
}
LegacyVoteTransaction.typeGroup = TransactionTypeGroup.Core;
LegacyVoteTransaction.type = TransactionType.Core.Vote;
LegacyVoteTransaction.key = "legacyVote";
LegacyVoteTransaction.defaultStaticFee = BigNumber.make("100000000");

var index$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DelegateRegistrationTransaction: DelegateRegistrationTransaction,
    DelegateResignationTransaction: DelegateResignationTransaction,
    HtlcClaimTransaction: HtlcClaimTransaction,
    HtlcLockTransaction: HtlcLockTransaction,
    HtlcRefundTransaction: HtlcRefundTransaction,
    IpfsTransaction: IpfsTransaction,
    TransferTransaction: TransferTransaction,
    MultiSignatureRegistrationTransaction: MultiSignatureRegistrationTransaction,
    SecondSignatureRegistrationTransaction: SecondSignatureRegistrationTransaction,
    LegacyTransferTransaction: LegacyTransferTransaction,
    LegacyVoteTransaction: LegacyVoteTransaction
});

class BurnTransaction extends Transaction {
    serialise() {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(8));
        buff.writeBigUInt64LE(data.amount.toBigInt());
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        data.amount = BigNumber.make(buf.readBigUInt64LE().toString());
    }
}
BurnTransaction.typeGroup = TransactionTypeGroup.Solar;
BurnTransaction.type = TransactionType.Solar.Burn;
BurnTransaction.key = "burn";
BurnTransaction.defaultStaticFee = BigNumber.ZERO;

class VoteTransaction extends Transaction {
    serialise() {
        const { data } = this;
        const buff = new ByteBuffer(Buffer.alloc(1024));
        if (data.asset && data.asset.votes) {
            buff.writeUInt8(Object.keys(data.asset.votes).length);
            for (const [vote, percent] of Object.entries(data.asset.votes)) {
                buff.writeUInt8(vote.length);
                buff.writeBuffer(Buffer.from(vote));
                buff.writeUInt16LE(Math.round(percent * 100));
            }
        }
        return buff;
    }
    deserialise(buf) {
        const { data } = this;
        const numberOfVotes = buf.readUInt8();
        data.asset = { votes: {} };
        for (let i = 0; i < numberOfVotes; i++) {
            const vote = buf.readBuffer(buf.readUInt8()).toString();
            const percent = buf.readUInt16LE() / 100;
            if (data.asset && data.asset.votes) {
                data.asset.votes[vote] = percent;
            }
        }
    }
}
VoteTransaction.typeGroup = TransactionTypeGroup.Solar;
VoteTransaction.type = TransactionType.Solar.Vote;
VoteTransaction.key = "vote";
VoteTransaction.defaultStaticFee = BigNumber.make("100000000");

var index$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BurnTransaction: BurnTransaction,
    VoteTransaction: VoteTransaction
});

class Signer {
    static sign(transaction, keys, options) {
        if (!options || (options.excludeSignature === undefined && options.excludeSecondSignature === undefined)) {
            options = Object.assign({ excludeSignature: true, excludeSecondSignature: true }, options);
        }
        const hash = Utils.toHash(transaction, options);
        const signature = Hash.signSchnorr(hash, keys, transaction.version > 2);
        if (!transaction.signature && !options.excludeMultiSignature) {
            transaction.signature = signature;
        }
        return signature;
    }
    static secondSign(transaction, keys) {
        const hash = Utils.toHash(transaction, { excludeSecondSignature: true });
        const signature = Hash.signSchnorr(hash, keys, transaction.version > 2);
        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }
        return signature;
    }
    static multiSign(transaction, keys, index = -1) {
        if (!transaction.signatures) {
            transaction.signatures = [];
        }
        index = index === -1 ? transaction.signatures.length : index;
        const hash = Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });
        const signature = Hash.signSchnorr(hash, keys, transaction.version > 2);
        const indexedSignature = `${numberToHex(index)}${signature}`;
        transaction.signatures.push(indexedSignature);
        return indexedSignature;
    }
}

class TransactionBuilder {
    constructor() {
        this.disableVersionCheck = true;
        this.data = {
            id: undefined,
            typeGroup: TransactionTypeGroup.Test,
            nonce: BigNumber.ZERO,
            memo: undefined,
            version: 3,
        };
    }
    build(data = {}) {
        return TransactionFactory.fromData(Object.assign(Object.assign({}, this.data), data), false, {
            disableVersionCheck: this.disableVersionCheck,
        });
    }
    version(version) {
        this.data.version = version;
        this.disableVersionCheck = true;
        return this.instance();
    }
    typeGroup(typeGroup) {
        this.data.typeGroup = typeGroup;
        return this.instance();
    }
    nonce(nonce) {
        if (nonce) {
            this.data.nonce = BigNumber.make(nonce);
        }
        return this.instance();
    }
    network(network) {
        this.data.network = network;
        return this.instance();
    }
    fee(fee) {
        if (fee) {
            this.data.fee = BigNumber.make(fee);
        }
        return this.instance();
    }
    senderPublicKey(publicKey) {
        this.data.senderPublicKey = publicKey;
        return this.instance();
    }
    memo(memo) {
        const limit = 255;
        if (memo) {
            if (Buffer.from(memo).length > limit) {
                throw new MemoLengthExceededError(limit);
            }
            this.data.memo = memo;
        }
        return this.instance();
    }
    vendorField(memo) {
        return this.memo(memo);
    }
    sign(passphrase) {
        const keys = Keys.fromPassphrase(passphrase);
        return this.signWithKeyPair(keys);
    }
    signWithWif(wif, networkWif) {
        const keys = Keys.fromWIF(wif, {
            wif: networkWif || configManager.get("network.wif"),
        });
        return this.signWithKeyPair(keys);
    }
    secondSign(secondPassphrase) {
        return this.secondSignWithKeyPair(Keys.fromPassphrase(secondPassphrase));
    }
    secondSignWithWif(wif, networkWif) {
        const keys = Keys.fromWIF(wif, {
            wif: networkWif || configManager.get("network.wif"),
        });
        return this.secondSignWithKeyPair(keys);
    }
    multiSign(passphrase, index) {
        const keys = Keys.fromPassphrase(passphrase);
        return this.multiSignWithKeyPair(index, keys);
    }
    multiSignWithWif(index, wif, networkWif) {
        const keys = Keys.fromWIF(wif, {
            wif: networkWif || configManager.get("network.wif"),
        });
        return this.multiSignWithKeyPair(index, keys);
    }
    verify() {
        return Verifier.verifyHash(this.data, this.disableVersionCheck);
    }
    getStruct() {
        if (!this.data.senderPublicKey || (!this.data.signature && !this.data.signatures)) {
            throw new MissingTransactionSignatureError();
        }
        const struct = {
            id: Utils.getId(this.data, { disableVersionCheck: this.disableVersionCheck }).toString(),
            signature: this.data.signature,
            secondSignature: this.data.secondSignature,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
            memo: this.data.memo,
        };
        struct.typeGroup = this.data.typeGroup;
        struct.nonce = this.data.nonce;
        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }
        return struct;
    }
    signWithKeyPair(keys) {
        this.data.senderPublicKey = keys.publicKey;
        this.data.signature = Signer.sign(this.getSigningObject(), keys, {
            disableVersionCheck: this.disableVersionCheck,
        });
        return this.instance();
    }
    secondSignWithKeyPair(keys) {
        this.data.secondSignature = Signer.secondSign(this.getSigningObject(), keys);
        return this.instance();
    }
    multiSignWithKeyPair(index, keys) {
        if (!this.data.signatures) {
            this.data.signatures = [];
        }
        Signer.multiSign(this.getSigningObject(), keys, index);
        return this.instance();
    }
    getSigningObject() {
        const data = Object.assign({}, this.data);
        for (const key of Object.keys(data)) {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        }
        return data;
    }
}

class DelegateRegistrationBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = DelegateRegistrationTransaction.type;
        this.data.typeGroup = DelegateRegistrationTransaction.typeGroup;
        this.data.fee = DelegateRegistrationTransaction.staticFee();
        this.data.asset = { delegate: {} };
    }
    usernameAsset(username) {
        if (this.data.asset && this.data.asset.delegate) {
            this.data.asset.delegate.username = username;
        }
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class DelegateResignationBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = DelegateResignationTransaction.type;
        this.data.typeGroup = DelegateResignationTransaction.typeGroup;
        this.data.fee = DelegateResignationTransaction.staticFee();
        this.data.asset = {};
    }
    resignationTypeAsset(resignationTypeAsset) {
        this.data.asset = {
            resignationType: resignationTypeAsset,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class HtlcClaimBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = HtlcClaimTransaction.type;
        this.data.typeGroup = HtlcClaimTransaction.typeGroup;
        this.data.fee = HtlcClaimTransaction.staticFee();
        this.data.asset = {};
    }
    claimAsset(claimAsset) {
        this.data.asset = {
            claim: claimAsset,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class HtlcLockBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = HtlcLockTransaction.type;
        this.data.typeGroup = HtlcLockTransaction.typeGroup;
        this.data.recipientId = undefined;
        this.data.amount = BigNumber.ZERO;
        this.data.fee = HtlcLockTransaction.staticFee();
        this.data.memo = undefined;
        this.data.asset = {};
    }
    lockAsset(lockAsset) {
        this.data.asset = {
            lock: lockAsset,
        };
        return this;
    }
    amount(amount) {
        this.data.amount = BigNumber.make(amount);
        return this.instance();
    }
    recipientId(recipientId) {
        this.data.recipientId = recipientId;
        return this.instance();
    }
    getStruct() {
        const struct = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.asset = JSON.parse(JSON.stringify(this.data.asset));
        return struct;
    }
    expiration(expiration) {
        return this;
    }
    instance() {
        return this;
    }
}

class HtlcRefundBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = HtlcRefundTransaction.type;
        this.data.typeGroup = HtlcRefundTransaction.typeGroup;
        this.data.fee = HtlcRefundTransaction.staticFee();
        this.data.asset = {};
    }
    refundAsset(refundAsset) {
        this.data.asset = {
            refund: refundAsset,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class IPFSBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = IpfsTransaction.type;
        this.data.typeGroup = IpfsTransaction.typeGroup;
        this.data.fee = IpfsTransaction.staticFee();
        this.data.memo = undefined;
        this.data.asset = {};
    }
    ipfsAsset(ipfsId) {
        this.data.asset = {
            ipfs: ipfsId,
        };
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class MultiSignatureBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = MultiSignatureRegistrationTransaction.type;
        this.data.typeGroup = MultiSignatureRegistrationTransaction.typeGroup;
        this.data.fee = MultiSignatureRegistrationTransaction.staticFee();
        this.data.asset = { multiSignature: { min: 0, publicKeys: [] } };
    }
    participant(publicKey) {
        if (this.data.asset && this.data.asset.multiSignature) {
            const { publicKeys } = this.data.asset.multiSignature;
            if (publicKeys.length <= 16) {
                publicKeys.push(publicKey);
                this.data.fee = MultiSignatureRegistrationTransaction.staticFee({ data: this.data });
            }
        }
        return this;
    }
    min(min) {
        if (this.data.asset && this.data.asset.multiSignature) {
            this.data.asset.multiSignature.min = min;
        }
        return this;
    }
    multiSignatureAsset(multiSignature) {
        if (this.data.asset && this.data.asset.multiSignature) {
            this.data.asset.multiSignature = multiSignature;
            this.data.fee = MultiSignatureRegistrationTransaction.staticFee({ data: this.data });
        }
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class SecondSignatureBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = SecondSignatureRegistrationTransaction.type;
        this.data.typeGroup = SecondSignatureRegistrationTransaction.typeGroup;
        this.data.fee = SecondSignatureRegistrationTransaction.staticFee();
        this.data.asset = { signature: {} };
    }
    signatureAsset(secondPassphrase) {
        if (this.data.asset && this.data.asset.signature) {
            this.data.asset.signature.publicKey = Keys.fromPassphrase(secondPassphrase).publicKey;
        }
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class TransferBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = TransferTransaction.type;
        this.data.typeGroup = TransferTransaction.typeGroup;
        this.data.fee = TransferTransaction.staticFee();
        this.data.memo = undefined;
        this.data.asset = {
            transfers: [],
        };
    }
    amount(amountString) {
        const amount = BigNumber.make(amountString);
        if (this.data.asset && this.data.asset.transfers && this.data.asset.transfers.length > 0) {
            this.data.asset = { transfers: [{ recipientId: this.data.asset.transfers[0].recipientId, amount }] };
        }
        else {
            this.data.asset = { transfers: [{ recipientId: "", amount }] };
        }
        return this;
    }
    recipientId(recipientId) {
        if (this.data.asset && this.data.asset.transfers && this.data.asset.transfers.length > 0) {
            this.data.asset = { transfers: [{ recipientId, amount: this.data.asset.transfers[0].amount }] };
        }
        else {
            this.data.asset = { transfers: [{ recipientId, amount: BigNumber.ZERO }] };
        }
        return this;
    }
    addPayment(recipientId, amount) {
        return this.addTransfer(recipientId, amount);
    }
    addTransfer(recipientId, amount) {
        if (this.data.asset && this.data.asset.transfers) {
            const limit = configManager.getMilestone().transfer.maximum || 256;
            if (this.data.asset.transfers.length >= limit) {
                throw new MaximumTransferCountExceededError(limit);
            }
            this.data.asset.transfers.push({
                amount: BigNumber.make(amount),
                recipientId,
            });
        }
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class BurnBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.typeGroup = BurnTransaction.typeGroup;
        this.data.type = BurnTransaction.type;
        this.data.fee = BurnTransaction.staticFee();
        this.data.amount = BigNumber.ZERO;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.amount = this.data.amount;
        return struct;
    }
    instance() {
        return this;
    }
}

class VoteBuilder extends TransactionBuilder {
    constructor() {
        super();
        this.data.type = VoteTransaction.type;
        this.data.typeGroup = VoteTransaction.typeGroup;
        this.data.fee = VoteTransaction.staticFee();
        this.data.asset = { votes: {} };
    }
    votesAsset(votes) {
        if (Array.isArray(votes)) {
            const voteArray = votes
                .filter((vote) => !vote.startsWith("-"))
                .map((vote) => (vote.startsWith("+") ? vote.slice(1) : vote));
            const voteObject = {};
            if (voteArray.length > 0) {
                const weight = Math.trunc(10000 / voteArray.length);
                let remainder = 10000;
                for (const vote of voteArray) {
                    voteObject[vote] = weight / 100;
                    remainder -= weight;
                }
                for (let i = 0; i < remainder; i++) {
                    const key = Object.keys(voteObject)[i];
                    voteObject[key] = Math.round((voteObject[key] + 0.01) * 100) / 100;
                }
            }
            votes = voteObject;
        }
        if (votes) {
            const numberOfVotes = Object.keys(votes).length;
            if (numberOfVotes > 0) {
                votes = sortVotes(votes);
            }
        }
        if (this.data.asset && this.data.asset.votes) {
            this.data.asset.votes = votes;
        }
        return this;
    }
    getStruct() {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        return struct;
    }
    instance() {
        return this;
    }
}

class BuilderFactory {
    static transfer() {
        return new TransferBuilder();
    }
    static secondSignature() {
        return new SecondSignatureBuilder();
    }
    static delegateRegistration() {
        return new DelegateRegistrationBuilder();
    }
    static multiSignature() {
        return new MultiSignatureBuilder();
    }
    static ipfs() {
        return new IPFSBuilder();
    }
    static multiPayment() {
        return new TransferBuilder();
    }
    static delegateResignation() {
        return new DelegateResignationBuilder();
    }
    static htlcLock() {
        return new HtlcLockBuilder();
    }
    static htlcClaim() {
        return new HtlcClaimBuilder();
    }
    static htlcRefund() {
        return new HtlcRefundBuilder();
    }
    static burn() {
        return new BurnBuilder();
    }
    static vote() {
        return new VoteBuilder();
    }
}

class Deserialiser$1 {
    static deserialise(serialised, options = {}) {
        const data = {};
        const buff = this.getByteBuffer(serialised);
        this.deserialiseCommon(data, buff);
        const instance = TransactionTypeFactory.create(data);
        this.deserialiseMemo(instance, buff);
        // Deserialise type specific parts
        instance.deserialise(buff);
        this.deserialiseSchnorr(data, buff);
        if (data.version) {
            if (options.acceptLegacyVersion ||
                options.disableVersionCheck ||
                isSupportedTransactionVersion(data.version)) ;
            else {
                throw new TransactionVersionError(data.version);
            }
        }
        instance.serialised = buff.getResult();
        return instance;
    }
    static deserialiseCommon(transaction, buf) {
        transaction.headerType = 0xff - buf.readUInt8();
        transaction.version = buf.readUInt8();
        transaction.network = buf.readUInt8();
        transaction.typeGroup = buf.readUInt32LE();
        transaction.type = buf.readUInt16LE();
        transaction.nonce = BigNumber.make(buf.readBigUInt64LE());
        transaction.senderPublicKey = buf.readBuffer(33).toString("hex");
        transaction.fee = BigNumber.make(buf.readBigUInt64LE().toString());
    }
    static deserialiseMemo(transaction, buf) {
        const memoLength = buf.readUInt8();
        if (memoLength > 0) {
            const memoBuffer = buf.readBuffer(memoLength);
            transaction.data.memo = memoBuffer.toString("utf8");
        }
    }
    static deserialiseSchnorr(transaction, buf) {
        const canReadNonMultiSignature = () => {
            return (buf.getRemainderLength() && (buf.getRemainderLength() % 64 === 0 || buf.getRemainderLength() % 65 !== 0));
        };
        if (canReadNonMultiSignature()) {
            transaction.signature = buf.readBuffer(64).toString("hex");
        }
        if (canReadNonMultiSignature()) {
            transaction.secondSignature = buf.readBuffer(64).toString("hex");
        }
        if (buf.getRemainderLength()) {
            if (buf.getRemainderLength() % 65 === 0) {
                transaction.signatures = [];
                const count = buf.getRemainderLength() / 65;
                const publicKeyIndexes = {};
                for (let i = 0; i < count; i++) {
                    const multiSignaturePart = buf.readBuffer(65).toString("hex");
                    const publicKeyIndex = parseInt(multiSignaturePart.slice(0, 2), 16);
                    if (!publicKeyIndexes[publicKeyIndex]) {
                        publicKeyIndexes[publicKeyIndex] = true;
                    }
                    else {
                        throw new DuplicateParticipantInMultiSignatureError();
                    }
                    transaction.signatures.push(multiSignaturePart);
                }
            }
            else {
                throw new InvalidTransactionBytesError("signature buffer not exhausted");
            }
        }
    }
    static getByteBuffer(serialised) {
        if (!(serialised instanceof Buffer)) {
            serialised = Buffer.from(serialised, "hex");
        }
        return new ByteBuffer(serialised);
    }
}

class TransactionFactory {
    static fromHex(hex) {
        return this.fromSerialised(hex);
    }
    static fromBytes(buff, strict = true, options = {}) {
        return this.fromSerialised(buff.toString("hex"), strict, options);
    }
    /**
     * Deserialises a transaction from `buffer` with the given `id`. It is faster
     * than `fromBytes` at the cost of vital safety checks (validation, verification and id calculation).
     *
     * NOTE: Only use this internally when it is safe to assume the buffer has already been
     * verified.
     */
    static fromBytesUnsafe(buff, id) {
        try {
            const options = { acceptLegacyVersion: true };
            const transaction = Deserialiser$1.deserialise(buff, options);
            transaction.data.id = id || Utils.getId(transaction.data, options);
            transaction.isVerified = true;
            return transaction;
        }
        catch (error) {
            throw new InvalidTransactionBytesError(error.message);
        }
    }
    static fromJson(json) {
        const data = Object.assign({}, json);
        if (data.amount) {
            data.amount = BigNumber.make(data.amount);
        }
        data.fee = BigNumber.make(data.fee);
        return this.fromData(data);
    }
    static fromData(data, strict = true, options = {}) {
        if (data.typeGroup === TransactionTypeGroup.Core && data.type === CoreTransactionType.Transfer) {
            if (data.asset && data.asset.payments && !data.asset.transfers) {
                data.asset.transfers = data.asset.payments;
                delete data.asset.payments;
            }
        }
        if (data.vendorField) {
            data.memo = data.vendorField;
            delete data.vendorField;
        }
        const transaction = TransactionTypeFactory.create(data);
        Serialiser$1.serialise(transaction);
        return this.fromBytes(transaction.serialised, strict, options);
    }
    static fromSerialised(serialised, strict = true, options = {}) {
        try {
            const transaction = Deserialiser$1.deserialise(serialised, options);
            transaction.data.id = Utils.getId(transaction.data, options);
            transaction.isVerified = true;
            return transaction;
        }
        catch (error) {
            if (error instanceof TransactionVersionError ||
                error instanceof TransactionSchemaError ||
                error instanceof DuplicateParticipantInMultiSignatureError) {
                throw error;
            }
            throw new InvalidTransactionBytesError(error.message);
        }
    }
}

class TransactionRegistry {
    constructor() {
        this.transactionTypes = new Map();
        TransactionTypeFactory.initialise(this.transactionTypes);
        // Core transactions
        this.registerTransactionType(LegacyTransferTransaction);
        this.registerTransactionType(SecondSignatureRegistrationTransaction);
        this.registerTransactionType(DelegateRegistrationTransaction);
        this.registerTransactionType(LegacyVoteTransaction);
        this.registerTransactionType(MultiSignatureRegistrationTransaction);
        this.registerTransactionType(IpfsTransaction);
        this.registerTransactionType(TransferTransaction);
        this.registerTransactionType(DelegateResignationTransaction);
        this.registerTransactionType(HtlcLockTransaction);
        this.registerTransactionType(HtlcClaimTransaction);
        this.registerTransactionType(HtlcRefundTransaction);
        // Solar transactions
        this.registerTransactionType(BurnTransaction);
        this.registerTransactionType(VoteTransaction);
    }
    registerTransactionType(constructor) {
        const { typeGroup, type } = constructor;
        if (typeof type === "undefined" || typeof typeGroup === "undefined") {
            throw new Error();
        }
        const internalType = InternalTransactionType.from(type, typeGroup);
        if (this.transactionTypes.has(internalType)) {
            const registeredConstructor = this.transactionTypes.get(internalType);
            if (registeredConstructor === constructor) {
                throw new TransactionAlreadyRegisteredError(constructor.name);
            }
            throw new TransactionKeyAlreadyRegisteredError(registeredConstructor.name);
        }
        this.transactionTypes.set(internalType, constructor);
    }
    deregisterTransactionType(constructor) {
        const { typeGroup, type } = constructor;
        if (typeof type === "undefined" || typeof typeGroup === "undefined") {
            throw new Error();
        }
        const internalType = InternalTransactionType.from(type, typeGroup);
        if (!this.transactionTypes.has(internalType)) {
            throw new UnknownTransactionError(internalType.toString());
        }
        this.transactionTypes.delete(internalType);
    }
}
const transactionRegistry = new TransactionRegistry();

var index$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    TransactionRegistry: transactionRegistry,
    TransactionBuilder: TransactionBuilder,
    BuilderFactory: BuilderFactory,
    Deserialiser: Deserialiser$1,
    TransactionFactory: TransactionFactory,
    Serialiser: Serialiser$1,
    Signer: Signer,
    Core: index$4,
    Solar: index$3,
    Transaction: Transaction,
    TransactionTypeFactory: TransactionTypeFactory,
    InternalTransactionType: InternalTransactionType,
    Utils: Utils,
    Verifier: Verifier
});

class Serialiser {
    static size(block) {
        let size = this.headerSize() + block.data.blockSignature.length / 2;
        for (const transaction of block.transactions) {
            size += 4 + transaction.serialised.length;
        }
        return size;
    }
    static serialiseWithTransactions(block) {
        const transactions = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;
        const serialisedHeader = this.serialise(block);
        const transactionBytes = [];
        let transactionLength = 0;
        for (const transaction of transactions) {
            const serialised = Utils.toBytes(transaction);
            transactionLength += serialised.length + 4;
            transactionBytes.push(serialised);
        }
        const buff = new ByteBuffer(Buffer.alloc(transactionLength + serialisedHeader.length));
        buff.writeBuffer(serialisedHeader);
        buff.jump(transactions.length * 4);
        for (let i = 0; i < transactionBytes.length; i++) {
            const offset = buff.getOffset();
            buff.goTo(serialisedHeader.length + i * 4);
            buff.writeUInt32LE(transactionBytes[i].length);
            buff.goTo(offset);
            buff.writeBuffer(transactionBytes[i]);
        }
        return buff.getResult();
    }
    static serialise(block, includeSignature = true) {
        const buff = new ByteBuffer(Buffer.alloc(this.headerSize() + 64));
        this.serialiseHeader(block, buff);
        if (includeSignature) {
            this.serialiseSignature(block, buff);
        }
        return buff.getResult();
    }
    static headerSize() {
        return 141;
    }
    static serialiseHeader(block, buff) {
        buff.writeUInt32LE(block.version);
        buff.writeUInt32LE(block.timestamp);
        buff.writeUInt32LE(block.height);
        buff.writeBuffer(Buffer.from(block.previousBlock, "hex"));
        buff.writeUInt32LE(block.numberOfTransactions);
        buff.writeBigUInt64LE(BigNumber.make(block.totalAmount).toBigInt());
        buff.writeBigUInt64LE(BigNumber.make(block.totalFee).toBigInt());
        buff.writeBigUInt64LE(BigNumber.make(block.reward).toBigInt());
        buff.writeUInt32LE(block.payloadLength);
        buff.writeBuffer(Buffer.from(block.payloadHash, "hex"));
        buff.writeBuffer(Buffer.from(block.generatorPublicKey, "hex"));
        assert.strictEqual(buff.getOffset(), this.headerSize());
    }
    static serialiseSignature(block, buff) {
        if (block.blockSignature) {
            buff.writeBuffer(Buffer.from(block.blockSignature, "hex"));
        }
    }
}

class Block {
    constructor({ data, transactions, id }) {
        this.data = data;
        this.transactions = transactions.map((transaction, index) => {
            transaction.data.blockId = this.data.id;
            transaction.data.blockHeight = this.data.height;
            transaction.data.sequence = index;
            transaction.timestamp = this.data.timestamp;
            return transaction;
        });
        delete this.data.transactions;
        this.data.burnedFee = this.getBurnedFees();
        this.data.devFund = calculateDevFund(this.data.height, this.data.reward);
        this.verification = this.verify();
    }
    static getId(data) {
        const payloadHash = Serialiser.serialise(data);
        const hash = HashAlgorithms.sha256(payloadHash);
        return hash.toString("hex");
    }
    static toBytesHex(data) {
        const temp = data ? BigNumber.make(data).toString(16) : "";
        return "0".repeat(16 - temp.length) + temp;
    }
    getBurnedFees() {
        let fees = BigNumber.ZERO;
        for (const transaction of this.transactions) {
            transaction.setBurnedFee(this.data.height);
            fees = fees.plus(transaction.data.burnedFee);
        }
        return fees;
    }
    getHeader() {
        return {
            blockSignature: this.data.blockSignature,
            generatorPublicKey: this.data.generatorPublicKey,
            height: this.data.height,
            id: this.data.id,
            numberOfTransactions: this.data.numberOfTransactions,
            payloadHash: this.data.payloadHash,
            payloadLength: this.data.payloadLength,
            previousBlock: this.data.previousBlock,
            reward: this.data.reward,
            timestamp: this.data.timestamp,
            totalAmount: this.data.totalAmount,
            totalFee: this.data.totalFee,
            version: this.data.version,
        };
    }
    verifySignature() {
        const { bip340 } = configManager.getMilestone(this.data.height);
        const bytes = Serialiser.serialise(this.data, false);
        const hash = HashAlgorithms.sha256(bytes);
        if (!this.data.blockSignature) {
            throw new Error();
        }
        return Hash.verifySchnorr(hash, this.data.blockSignature, this.data.generatorPublicKey, bip340);
    }
    toJson() {
        const data = JSON.parse(JSON.stringify(this.data));
        data.reward = this.data.reward.toString();
        data.totalAmount = this.data.totalAmount.toString();
        data.totalFee = this.data.totalFee.toString();
        data.burnedFee = this.data.burnedFee.toString();
        data.transactions = this.transactions.map((transaction) => transaction.toJson());
        return data;
    }
    verify() {
        const block = this.data;
        const result = {
            verified: false,
            containsMultiSignatures: false,
            errors: [],
        };
        try {
            const constants = configManager.getMilestone(block.height);
            if (block.height !== 1) {
                if (!block.previousBlock) {
                    result.errors.push("Invalid previous block");
                }
            }
            const valid = this.verifySignature();
            if (!valid) {
                result.errors.push("Failed to verify block signature");
            }
            if (block.version !== constants.block.version) {
                result.errors.push("Invalid block version");
            }
            if (block.timestamp > Slots.getTime() + configManager.getMilestone(block.height).blockTime) {
                result.errors.push("Invalid block timestamp");
            }
            const size = Serialiser.size(this);
            if (size > constants.block.maxPayload) {
                result.errors.push(`Payload is too large: ${size} > ${constants.block.maxPayload}`);
            }
            const invalidTransactions = this.transactions.filter((tx) => !tx.verified);
            if (invalidTransactions.length > 0) {
                result.errors.push("One or more transactions are not verified:");
                for (const invalidTransaction of invalidTransactions) {
                    result.errors.push(`=> ${invalidTransaction.serialised.toString("hex")}`);
                }
                result.containsMultiSignatures = invalidTransactions.some((tx) => !!tx.data.signatures);
            }
            if (this.transactions.length !== block.numberOfTransactions) {
                result.errors.push("Invalid number of transactions");
            }
            if (this.transactions.length > constants.block.maxTransactions) {
                if (block.height > 1) {
                    result.errors.push("Transactions length is too high");
                }
            }
            // Checking if transactions of the block adds up to block values.
            const appliedTransactions = {};
            let totalAmount = BigNumber.ZERO;
            let totalFee = BigNumber.ZERO;
            const payloadBuffers = [];
            for (const transaction of this.transactions) {
                if (!transaction.data || !transaction.data.id) {
                    throw new Error();
                }
                const bytes = Buffer.from(transaction.data.id, "hex");
                if (appliedTransactions[transaction.data.id]) {
                    result.errors.push(`Encountered duplicate transaction: ${transaction.data.id}`);
                }
                if (transaction.data.expiration &&
                    transaction.data.expiration > 0 &&
                    transaction.data.expiration <= this.data.height) {
                    result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                }
                if (transaction.data.version === 1 && !constants.block.acceptExpiredTransactionTimestamps) {
                    const now = block.timestamp;
                    if (transaction.data.timestamp > now + 3600 + constants.blockTime) {
                        result.errors.push(`Encountered future transaction: ${transaction.data.id}`);
                    }
                    else if (now - transaction.data.timestamp > 21600) {
                        result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                    }
                }
                appliedTransactions[transaction.data.id] = transaction.data;
                totalAmount = totalAmount.plus(transaction.data.amount || BigNumber.ZERO);
                totalFee = totalFee.plus(transaction.data.fee);
                payloadBuffers.push(bytes);
            }
            if (!totalAmount.isEqualTo(block.totalAmount)) {
                result.errors.push("Invalid total amount");
            }
            if (!totalFee.isEqualTo(block.totalFee)) {
                result.errors.push("Invalid total fee");
            }
            if (HashAlgorithms.sha256(payloadBuffers).toString("hex") !== block.payloadHash) {
                result.errors.push("Invalid payload hash");
            }
        }
        catch (error) {
            result.errors.push(error);
        }
        result.verified = result.errors.length === 0;
        return result;
    }
}

class Deserialiser {
    static deserialise(serialised, headerOnly = false, options = {}) {
        const block = {};
        let transactions = [];
        const buf = new ByteBuffer(Buffer.alloc(serialised.length));
        buf.writeBuffer(serialised);
        buf.reset();
        this.deserialiseHeader(block, buf);
        headerOnly = headerOnly || buf.getRemainderLength() === 0;
        if (!headerOnly) {
            transactions = this.deserialiseTransactions(block, buf, options.deserialiseTransactionsUnchecked);
        }
        block.id = Block.getId(block);
        return { data: block, transactions };
    }
    static deserialiseHeader(block, buf) {
        block.version = buf.readUInt32LE();
        block.timestamp = buf.readUInt32LE();
        block.height = buf.readUInt32LE();
        block.previousBlock = buf.readBuffer(32).toString("hex");
        block.numberOfTransactions = buf.readUInt32LE();
        block.totalAmount = BigNumber.make(buf.readBigUInt64LE().toString());
        block.totalFee = BigNumber.make(buf.readBigUInt64LE().toString());
        block.reward = BigNumber.make(buf.readBigUInt64LE().toString());
        block.payloadLength = buf.readUInt32LE();
        block.payloadHash = buf.readBuffer(32).toString("hex");
        block.generatorPublicKey = buf.readBuffer(33).toString("hex");
        block.blockSignature = buf.readBuffer(64).toString("hex");
    }
    static deserialiseTransactions(block, buf, deserialiseTransactionsUnchecked = false) {
        const transactionLengths = [];
        for (let i = 0; i < block.numberOfTransactions; i++) {
            transactionLengths.push(buf.readUInt32LE());
        }
        const transactions = [];
        block.transactions = [];
        for (const length of transactionLengths) {
            const transactionBytes = buf.readBuffer(length);
            const transaction = deserialiseTransactionsUnchecked
                ? TransactionFactory.fromBytesUnsafe(transactionBytes)
                : TransactionFactory.fromBytes(transactionBytes);
            transactions.push(transaction);
            block.transactions.push(transaction.data);
        }
        return transactions;
    }
}

class BlockFactory {
    static make(data, keys, aux) {
        const { bip340 } = configManager.getMilestone(data.height);
        data.generatorPublicKey = keys.publicKey;
        const payloadHash = Serialiser.serialise(data, false);
        const hash = HashAlgorithms.sha256(payloadHash);
        data.blockSignature = Hash.signSchnorr(hash, keys, bip340, aux);
        data.id = Block.getId(data);
        return this.fromData(data);
    }
    static fromHex(hex) {
        return this.fromSerialised(Buffer.from(hex, "hex"));
    }
    static fromBytes(buff) {
        return this.fromSerialised(buff);
    }
    static fromJson(json) {
        const data = Object.assign({}, json);
        data.totalAmount = BigNumber.make(data.totalAmount);
        data.totalFee = BigNumber.make(data.totalFee);
        data.reward = BigNumber.make(data.reward);
        if (data.transactions) {
            for (const transaction of data.transactions) {
                if (transaction.amount) {
                    transaction.amount = BigNumber.make(transaction.amount);
                }
                transaction.fee = BigNumber.make(transaction.fee);
            }
        }
        return this.fromData(data);
    }
    static fromData(data, options = {}) {
        const block = data;
        if (block) {
            const serialised = Serialiser.serialiseWithTransactions(data);
            const block = new Block(Object.assign(Object.assign({}, Deserialiser.deserialise(serialised, false, options)), { id: data.id }));
            block.serialised = serialised.toString("hex");
            return block;
        }
        return undefined;
    }
    static fromSerialised(serialised) {
        const deserialised = Deserialiser.deserialise(serialised);
        const block = new Block(deserialised);
        block.serialised = Serialiser.serialiseWithTransactions(block.data).toString("hex");
        return block;
    }
}

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Block: Block,
    Deserialiser: Deserialiser,
    BlockFactory: BlockFactory,
    Serialiser: Serialiser
});

var index = /*#__PURE__*/Object.freeze({
    __proto__: null
});

var types = /*#__PURE__*/Object.freeze({
    __proto__: null
});

export { index$1 as Blocks, constants as Constants, index$5 as Crypto, enums as Enums, errors as Errors, index$6 as Identities, index as Interfaces, index$8 as Managers, networks as Networks, index$2 as Transactions, types as Types, index$7 as Utils };
