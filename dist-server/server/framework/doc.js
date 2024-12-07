"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
/**
 * MongoDB collection with operations that maintain created and updated timestamps.
 *
 * Note that you may wish to add more methods, e.g. using other MongoDB operations!
 */
class DocCollection {
    constructor(name) {
        this.name = name;
        if (DocCollection.collectionNames.has(name)) {
            throw new Error(`Collection '${name}' already exists!`);
        }
        this.collection = db_1.default.collection(name);
    }
    /**
     * Remove internal fields from an item so that the client does not alter them.
     */
    withoutInternal(item) {
        const safe = Object.assign({}, item);
        delete safe._id;
        delete safe.dateCreated;
        delete safe.dateUpdated;
        return safe;
    }
    /**
     * Add `item` to the collection.
     * @returns the object ID of the inserted document
     */
    createOne(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const safe = this.withoutInternal(item);
            safe.dateCreated = new Date();
            safe.dateUpdated = new Date();
            return (yield this.collection.insertOne(safe)).insertedId;
        });
    }
    /**
     * Add `items` to the collection.
     * @returns a record object of the form `{ <index>: <object ID> }` for inserted documents
     */
    createMany(items, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const safe = items.map((item) => {
                const safe = this.withoutInternal(item);
                safe.dateCreated = new Date();
                safe.dateUpdated = new Date();
                return safe;
            });
            return (yield this.collection.insertMany(safe, options)).insertedIds;
        });
    }
    /**
     * Read the document that matches `filter`
     * @returns the document, or `null` if no document matches
     */
    readOne(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne(filter, options);
        });
    }
    /**
     * Read all documents that match `filter`
     * @returns all matching documents
     */
    readMany(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.find(filter, options).toArray();
        });
    }
    /**
     * Replace the document that matches `filter` with `item`.
     * @returns an object describing what was updated
     */
    replaceOne(filter, item, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const safe = this.withoutInternal(item);
            safe.dateUpdated = new Date();
            return yield this.collection.replaceOne(filter, safe, options);
        });
    }
    /**
     * Update the document that matches `filter` with fields in `update`; only fields in `update` are updated.
     * @returns an object describing what was updated
     */
    partialUpdateOne(filter, update, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const safe = this.withoutInternal(update);
            safe.dateUpdated = new Date();
            return yield this.collection.updateOne(filter, { $set: safe }, options);
        });
    }
    /**
     * Delete the document that matches `filter`.
     * @returns an object describing what was deleted
     */
    deleteOne(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.deleteOne(filter, options);
        });
    }
    /**
     * Delete all documents that match `filter`.
     * @returns an object describing what was deleted
     */
    deleteMany(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.deleteMany(filter, options);
        });
    }
    /**
     * Count all documents that match `filter`.
     * @returns the count
     */
    count(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.countDocuments(filter, options);
        });
    }
    /**
     * Pop one document that matches `filter`, equivalent to calling `readOne` and `deleteOne`.
     * @returns the document, or `null` if no document matches
     */
    popOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const one = yield this.readOne(filter);
            if (one === null) {
                return null;
            }
            yield this.deleteOne({ _id: one._id });
            return one;
        });
    }
}
DocCollection.collectionNames = new Set();
exports.default = DocCollection;
//# sourceMappingURL=doc.js.map