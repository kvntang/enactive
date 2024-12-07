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
            const _id = yield this.captions.createOne({ postId });
            return { msg: "Auto-caption successfully created!", caption: yield this.captions.readOne({ _id }) };
        });
    }
}
exports.default = AutoCaptioningConcept;
//# sourceMappingURL=suggesting.js.map