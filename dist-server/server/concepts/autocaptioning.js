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
const doc_1 = __importDefault(require("../framework/doc"));
const errors_1 = require("./errors");
/**
 * Concept: AutoCaptioning [Author]
 */
class AutoCaptioningConcept {
    /**
     * Make an instance of AutoCaptioning.
     */
    constructor(collectionName) {
        this.captions = new doc_1.default(collectionName);
    }
    create(postId, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = yield this.captions.createOne({ postId, caption });
            return { msg: "Auto-caption successfully created!", caption: yield this.captions.readOne({ _id }) };
        });
    }
    getAllCaptions() {
        return __awaiter(this, void 0, void 0, function* () {
            // Returns all captions; pagination can be added for better performance
            return yield this.captions.readMany({}, { sort: { _id: -1 } });
        });
    }
    getByPost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.captions.readMany({ postId }, { sort: { _id: -1 } });
        });
    }
    delete(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.captions.deleteOne({ _id });
            return { msg: "Auto-caption deleted successfully!" };
        });
    }
    assertCaptionExists(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const caption = yield this.captions.readOne({ _id });
            if (!caption) {
                throw new errors_1.NotFoundError(`Auto-caption ${_id} does not exist!`);
            }
        });
    }
    update(_id, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update only the content of the comment
            yield this.captions.partialUpdateOne({ _id }, { caption });
            return { msg: "Auto-caption successfully updated!" };
        });
    }
}
exports.default = AutoCaptioningConcept;
//# sourceMappingURL=autocaptioning.js.map