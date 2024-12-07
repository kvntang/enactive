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
    // async create(author: ObjectId, content: string, options?: PostOptions) {
    //   const _id = await this.posts.createOne({ author, content, options });
    //   return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
    // }
    create(author, content, options, photo) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("Document to be created:", { author, content, options, photo }); // Log the document
            // Add the photo (Base64) directly into the document if provided
            const _id = yield this.posts.createOne({ author, content, options, photo });
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
    getByPost(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch a single post and return it as an array with either one element or empty
            const post = yield this.posts.readOne({ _id });
            return post ? [post] : []; // Wrap the post in an array or return an empty array
        });
    }
    // async getByPost(_id: ObjectId): Promise<PostDoc | null> {
    //   // Fetch a single post by its ObjectId
    //   const post = await this.posts.readOne({ _id });
    //   return post; // Returns the PostDoc or null
    // }
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
    assertPostExist(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield this.posts.readOne({ _id });
            if (!post) {
                throw new errors_1.NotFoundError(`Post with ID ${_id} does not exist!`);
            }
            return post; // Return the post if it exists
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