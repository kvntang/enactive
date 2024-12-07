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
exports.PostAuthorNotMatchError = void 0;
const doc_1 = __importDefault(require("../framework/doc"));
const errors_1 = require("./errors");
/**
 * concept: Posting [Author]
 */
class PostingConcept {
    /**
     * Make an instance of Posting.
     */
    constructor(collectionName) {
        this.posts = new doc_1.default(collectionName);
    }
    create(author, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = yield this.posts.createOne({ author, content, options });
            return { msg: "Post successfully created!", post: yield this.posts.readOne({ _id }) };
        });
    }
    getPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            // Returns all posts! You might want to page for better client performance
            return yield this.posts.readMany({}, { sort: { _id: -1 } });
        });
    }
    getByAuthor(author) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.posts.readMany({ author });
        });
    }
    update(_id, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Note that if content or options is undefined, those fields will *not* be updated
            // since undefined values for partialUpdateOne are ignored.
            yield this.posts.partialUpdateOne({ _id }, { content, options });
            return { msg: "Post successfully updated!" };
        });
    }
    delete(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.posts.deleteOne({ _id });
            return { msg: "Post deleted successfully!" };
        });
    }
    assertAuthorIsUser(_id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield this.posts.readOne({ _id });
            if (!post) {
                throw new errors_1.NotFoundError(`Post ${_id} does not exist!`);
            }
            if (post.author.toString() !== user.toString()) {
                throw new PostAuthorNotMatchError(user, _id);
            }
        });
    }
}
exports.default = PostingConcept;
class PostAuthorNotMatchError extends errors_1.NotAllowedError {
    constructor(author, _id) {
        super("{0} is not the author of post {1}!", author, _id);
        this.author = author;
        this._id = _id;
    }
}
exports.PostAuthorNotMatchError = PostAuthorNotMatchError;
//# sourceMappingURL=posting.js.map