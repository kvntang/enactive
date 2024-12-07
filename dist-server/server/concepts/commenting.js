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
exports.CommentAuthorNotMatchError = void 0;
const doc_1 = __importDefault(require("../framework/doc"));
const errors_1 = require("./errors");
/**
 * concept: Commenting [Author]
 */
class CommentingConcept {
    /**
     * Make an instance of Commenting.
     */
    constructor(collectionName) {
        this.comments = new doc_1.default(collectionName);
    }
    create(author, postId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = yield this.comments.createOne({ author, postId, content });
            return { msg: "Comment successfully created!", comment: yield this.comments.readOne({ _id }) };
        });
    }
    getComments() {
        return __awaiter(this, void 0, void 0, function* () {
            // Returns all comments! You might want to page for better client performance
            return yield this.comments.readMany({}, { sort: { _id: -1 } });
        });
    }
    getByPost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.comments.readMany({ postId }, { sort: { _id: -1 } });
        });
    }
    getByUser(author) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.comments.readMany({ author }, { sort: { _id: -1 } });
        });
    }
    update(_id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            // Update only the content of the comment
            yield this.comments.partialUpdateOne({ _id }, { content });
            return { msg: "Comment successfully updated!" };
        });
    }
    delete(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.comments.deleteOne({ _id });
            return { msg: "Comment deleted successfully!" };
        });
    }
    assertAuthorIsUser(_id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield this.comments.readOne({ _id });
            if (!comment) {
                throw new errors_1.NotFoundError(`Comment ${_id} does not exist!`);
            }
            if (comment.author.toString() !== user.toString()) {
                throw new CommentAuthorNotMatchError(user, _id);
            }
        });
    }
}
exports.default = CommentingConcept;
class CommentAuthorNotMatchError extends errors_1.NotAllowedError {
    constructor(author, _id) {
        super("{0} is not the author of comment {1}!", author, _id);
        this.author = author;
        this._id = _id;
    }
}
exports.CommentAuthorNotMatchError = CommentAuthorNotMatchError;
//# sourceMappingURL=commenting.js.map