"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.appRouter = exports.app = void 0;
const mongodb_1 = require("mongodb");
const router_1 = require("./framework/router");
const app_1 = require("./app");
const responses_1 = __importDefault(require("./responses"));
const zod_1 = require("zod");
//huggingface API stuff
const inference_1 = require("@huggingface/inference");
const dotenv = __importStar(require("dotenv"));
// Initialize dotenv to load environment variables
dotenv.config();
// Create an instance of HfInference with your API token
const inference = new inference_1.HfInference(process.env.HUGGING_FACE_API_TOKEN);
/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
let Routes = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _getSessionUser_decorators;
    let _logIn_decorators;
    let _logOut_decorators;
    let _getUsers_decorators;
    let _getUser_decorators;
    let _createUser_decorators;
    let _updateUsername_decorators;
    let _updatePassword_decorators;
    let _deleteUser_decorators;
    let _updateStep_decorators;
    let _getPosts_decorators;
    let _getPost_decorators;
    let _createPost_decorators;
    let _updatePost_decorators;
    let _deletePost_decorators;
    let _getFriends_decorators;
    let _removeFriend_decorators;
    let _getRequests_decorators;
    let _sendFriendRequest_decorators;
    let _removeFriendRequest_decorators;
    let _acceptFriendRequest_decorators;
    let _rejectFriendRequest_decorators;
    let _getComments_decorators;
    let _createComment_decorators;
    let _updateComment_decorators;
    let _deleteComment_decorators;
    let _createAutoCaption_decorators;
    let _getAutoCaptions_decorators;
    let _updateAutoCaption_decorators;
    let _getSuggestions_decorators;
    return _a = class Routes {
            // Synchronize the concepts from `app.ts`.
            //////////////////// Session ////////////////////////////////////////
            getSessionUser(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return yield app_1.Authing.getUserById(user);
                });
            }
            logIn(session, username, password) {
                return __awaiter(this, void 0, void 0, function* () {
                    const u = yield app_1.Authing.authenticate(username, password);
                    app_1.Sessioning.start(session, u._id);
                    return { msg: "Logged in!" };
                });
            }
            logOut(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    app_1.Sessioning.end(session);
                    return { msg: "Logged out!" };
                });
            }
            //////////////////// Authenticate ////////////////////////////////////////
            getUsers() {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield app_1.Authing.getUsers();
                });
            }
            getUser(username) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield app_1.Authing.getUserByUsername(username);
                });
            }
            createUser(session, username, password) {
                return __awaiter(this, void 0, void 0, function* () {
                    app_1.Sessioning.isLoggedOut(session);
                    return yield app_1.Authing.create(username, password);
                });
            }
            updateUsername(session, username) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return yield app_1.Authing.updateUsername(user, username);
                });
            }
            updatePassword(session, currentPassword, newPassword) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return app_1.Authing.updatePassword(user, currentPassword, newPassword);
                });
            }
            deleteUser(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    app_1.Sessioning.end(session);
                    return yield app_1.Authing.delete(user);
                });
            }
            updateStep(session, stepSize) {
                return __awaiter(this, void 0, void 0, function* () {
                    const userId = app_1.Sessioning.getUser(session);
                    const result = yield app_1.Authing.updateStepSize(userId, stepSize);
                    return result;
                });
            }
            //////////////////// Post ////////////////////////////////////////
            getPosts(username) {
                return __awaiter(this, void 0, void 0, function* () {
                    let posts;
                    if (username) {
                        const id = (yield app_1.Authing.getUserByUsername(username))._id;
                        posts = yield app_1.Posting.getByAuthor(id);
                    }
                    else {
                        posts = yield app_1.Posting.getPosts();
                    }
                    return responses_1.default.posts(posts);
                });
            }
            getPost(id) {
                return __awaiter(this, void 0, void 0, function* () {
                    const postOid = new mongodb_1.ObjectId(id); //convert from String
                    yield app_1.Posting.assertPostExist(postOid);
                    const post = yield app_1.Posting.getByPost(postOid);
                    return responses_1.default.posts(post);
                });
            }
            // @Router.post("/posts")
            // async createPost(session: SessionDoc, content: string, options?: PostOptions) {
            //   const user = Sessioning.getUser(session);
            //   const created = await Posting.create(user, content, options);
            //   return { msg: created.msg, post: await Responses.post(created.post) };
            // }
            createPost(session, content, options, photo) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    // console.log("Received Photo (Base64):", photo); // Log the photo to verify
                    // Pass the photo (Base64 string) along with content and options to the create method
                    const created = yield app_1.Posting.create(user, content, options, photo);
                    return { msg: created.msg, post: yield responses_1.default.post(created.post) };
                });
            }
            updatePost(session, id, content, options) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const oid = new mongodb_1.ObjectId(id);
                    yield app_1.Posting.assertAuthorIsUser(oid, user);
                    return yield app_1.Posting.update(oid, content, options);
                });
            }
            deletePost(session, id) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const oid = new mongodb_1.ObjectId(id);
                    yield app_1.Posting.assertAuthorIsUser(oid, user);
                    return app_1.Posting.delete(oid);
                });
            }
            //////////////////// Friend ////////////////////////////////////////
            getFriends(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return yield app_1.Authing.idsToUsernames(yield app_1.Friending.getFriends(user));
                });
            }
            removeFriend(session, friend) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const friendOid = (yield app_1.Authing.getUserByUsername(friend))._id;
                    return yield app_1.Friending.removeFriend(user, friendOid);
                });
            }
            getRequests(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return yield responses_1.default.friendRequests(yield app_1.Friending.getRequests(user));
                });
            }
            sendFriendRequest(session, to) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const toOid = (yield app_1.Authing.getUserByUsername(to))._id;
                    return yield app_1.Friending.sendRequest(user, toOid);
                });
            }
            removeFriendRequest(session, to) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const toOid = (yield app_1.Authing.getUserByUsername(to))._id;
                    return yield app_1.Friending.removeRequest(user, toOid);
                });
            }
            acceptFriendRequest(session, from) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const fromOid = (yield app_1.Authing.getUserByUsername(from))._id;
                    return yield app_1.Friending.acceptRequest(fromOid, user);
                });
            }
            rejectFriendRequest(session, from) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const fromOid = (yield app_1.Authing.getUserByUsername(from))._id;
                    return yield app_1.Friending.rejectRequest(fromOid, user);
                });
            }
            //////////////////// Comment ////////////////////////////////////////
            getComments(postId) {
                return __awaiter(this, void 0, void 0, function* () {
                    let comments;
                    if (postId) {
                        const postOid = new mongodb_1.ObjectId(postId);
                        comments = yield app_1.Commenting.getByPost(postOid);
                    }
                    else {
                        comments = yield app_1.Commenting.getComments();
                    }
                    return responses_1.default.comments(comments);
                });
            }
            createComment(session, postId, content) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const postOid = new mongodb_1.ObjectId(postId);
                    const created = yield app_1.Commenting.create(user, postOid, content);
                    return { msg: created.msg, comment: yield responses_1.default.comment(created.comment) };
                });
            }
            updateComment(session, id, content) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const oid = new mongodb_1.ObjectId(id);
                    yield app_1.Commenting.assertAuthorIsUser(oid, user);
                    return yield app_1.Commenting.update(oid, content);
                });
            }
            deleteComment(session, id) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    const oid = new mongodb_1.ObjectId(id);
                    yield app_1.Commenting.assertAuthorIsUser(oid, user);
                    return yield app_1.Commenting.delete(oid);
                });
            }
            //////////////////// Auto Caption ////////////////////////////////////////
            createAutoCaption(postId) {
                return __awaiter(this, void 0, void 0, function* () {
                    const postOid = new mongodb_1.ObjectId(postId);
                    yield app_1.Posting.assertPostExist(postOid); // Ensure the post exists
                    //get the photo
                    const post = yield app_1.Posting.getByPost(postOid);
                    let imageData = post[0].photo;
                    imageData = imageData.replace(/^data:image\/[a-z]+;base64,/, ""); // Remove data URL prefix if present
                    const imageBuffer = Buffer.from(imageData, "base64");
                    // Generate caption using the Hugging Face Inference API
                    console.log("generating caption...");
                    const caption = yield generateCaptionFromImageBuffer(imageBuffer);
                    // Store the caption in MongoDB
                    const created = yield app_1.AutoCaptioning.create(postOid, caption);
                    return { msg: created.msg, caption: caption };
                });
            }
            getAutoCaptions(postId) {
                return __awaiter(this, void 0, void 0, function* () {
                    let autoCaptions;
                    if (postId) {
                        // get the one
                        const postOid = new mongodb_1.ObjectId(postId);
                        autoCaptions = yield app_1.AutoCaptioning.getByPost(postOid);
                    }
                    else {
                        //get all
                        autoCaptions = yield app_1.AutoCaptioning.getAllCaptions();
                    }
                    return autoCaptions;
                });
            }
            updateAutoCaption(postid) {
                return __awaiter(this, void 0, void 0, function* () {
                    const postOid = new mongodb_1.ObjectId(postid);
                    yield app_1.Posting.assertPostExist(postOid); // Ensure the post exists
                    //get the photo
                    const post = yield app_1.Posting.getByPost(postOid);
                    let imageData = post[0].photo;
                    imageData = imageData.replace(/^data:image\/[a-z]+;base64,/, ""); // Remove data URL prefix if present
                    const imageBuffer = Buffer.from(imageData, "base64");
                    // Generate caption using the Hugging Face Inference API
                    console.log("regenerating caption...");
                    const caption = yield generateCaptionFromImageBuffer(imageBuffer);
                    // Store the caption in MongoDB
                    const created = yield app_1.AutoCaptioning.update(postOid, caption);
                    return { msg: created.msg, caption: caption };
                });
            }
            //////////////////// Suggestions ////////////////////////////////////////
            getSuggestions(session, postId) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Ensure the user is logged in
                    const userId = app_1.Sessioning.getUser(session);
                    const postOid = new mongodb_1.ObjectId(postId);
                    yield app_1.Posting.assertPostExist(postOid); // Ensure the post exists
                    // Get the target caption
                    const targetCaptionDoc = yield app_1.AutoCaptioning.getByPost(postOid);
                    const targetCaption = targetCaptionDoc[0].caption;
                    //create array of captions from all other post
                    const allCaptionsDocs = yield app_1.AutoCaptioning.getAllCaptions();
                    const otherCaptionsDocs = allCaptionsDocs.filter((doc) => !doc.postId.equals(postOid));
                    if (otherCaptionsDocs.length === 0) {
                        return { suggestions: [] }; // No other captions available
                    }
                    // Prepare the inputs for the similarity API
                    const sentences = otherCaptionsDocs.map((doc) => doc.caption);
                    // Get similarity scores
                    const similarityScores = yield getSimilarityScores(targetCaption, sentences);
                    // Combine posts with their similarity scores
                    const postsWithScores = otherCaptionsDocs.map((doc, idx) => ({
                        postId: doc.postId,
                        caption: doc.caption,
                        score: similarityScores[idx],
                    }));
                    // Sort posts by similarity score in descending order
                    postsWithScores.sort((a, b) => b.score - a.score);
                    // Get user's stepSize
                    const user = yield app_1.Authing.getUserById(userId);
                    let stepSize = parseInt(user.stepSize, 10);
                    if (isNaN(stepSize) || stepSize < 1) {
                        stepSize = 1; // Default to 1 if not set or invalid
                    }
                    // Generate the final suggestion list
                    const suggestions = getSuggestionList(postsWithScores, stepSize); //i think this is just going to be a list of captions
                    // return suggestion list
                    return suggestions;
                });
            }
            constructor() {
                __runInitializers(this, _instanceExtraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getSessionUser_decorators = [router_1.Router.get("/session")];
            _logIn_decorators = [router_1.Router.post("/login")];
            _logOut_decorators = [router_1.Router.post("/logout")];
            _getUsers_decorators = [router_1.Router.get("/users")];
            _getUser_decorators = [router_1.Router.get("/users/:username"), router_1.Router.validate(zod_1.z.object({ username: zod_1.z.string().min(1) }))];
            _createUser_decorators = [router_1.Router.post("/users")];
            _updateUsername_decorators = [router_1.Router.patch("/users/username")];
            _updatePassword_decorators = [router_1.Router.patch("/users/password")];
            _deleteUser_decorators = [router_1.Router.delete("/users")];
            _updateStep_decorators = [router_1.Router.patch("/users/step")];
            _getPosts_decorators = [router_1.Router.get("/posts"), router_1.Router.validate(zod_1.z.object({ username: zod_1.z.string().optional() }))];
            _getPost_decorators = [router_1.Router.get("/posts/single/:id")];
            _createPost_decorators = [router_1.Router.post("/posts")];
            _updatePost_decorators = [router_1.Router.patch("/posts/:id")];
            _deletePost_decorators = [router_1.Router.delete("/posts/:id")];
            _getFriends_decorators = [router_1.Router.get("/friends")];
            _removeFriend_decorators = [router_1.Router.delete("/friends/:friend")];
            _getRequests_decorators = [router_1.Router.get("/friend/requests")];
            _sendFriendRequest_decorators = [router_1.Router.post("/friend/requests/:to")];
            _removeFriendRequest_decorators = [router_1.Router.delete("/friend/requests/:to")];
            _acceptFriendRequest_decorators = [router_1.Router.put("/friend/accept/:from")];
            _rejectFriendRequest_decorators = [router_1.Router.put("/friend/reject/:from")];
            _getComments_decorators = [router_1.Router.get("/comments"), router_1.Router.validate(zod_1.z.object({ postId: zod_1.z.string().optional() }))];
            _createComment_decorators = [router_1.Router.post("/comments")];
            _updateComment_decorators = [router_1.Router.patch("/comments/:id")];
            _deleteComment_decorators = [router_1.Router.delete("/comments/:id")];
            _createAutoCaption_decorators = [router_1.Router.post("/autocaptions")];
            _getAutoCaptions_decorators = [router_1.Router.get("/autocaptions"), router_1.Router.validate(zod_1.z.object({ postId: zod_1.z.string().optional() }))];
            _updateAutoCaption_decorators = [router_1.Router.patch("/autocaptions/update/:postid")];
            _getSuggestions_decorators = [router_1.Router.post("/suggestions")];
            __esDecorate(_a, null, _getSessionUser_decorators, { kind: "method", name: "getSessionUser", static: false, private: false, access: { has: obj => "getSessionUser" in obj, get: obj => obj.getSessionUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _logIn_decorators, { kind: "method", name: "logIn", static: false, private: false, access: { has: obj => "logIn" in obj, get: obj => obj.logIn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _logOut_decorators, { kind: "method", name: "logOut", static: false, private: false, access: { has: obj => "logOut" in obj, get: obj => obj.logOut }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getUsers_decorators, { kind: "method", name: "getUsers", static: false, private: false, access: { has: obj => "getUsers" in obj, get: obj => obj.getUsers }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getUser_decorators, { kind: "method", name: "getUser", static: false, private: false, access: { has: obj => "getUser" in obj, get: obj => obj.getUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createUser_decorators, { kind: "method", name: "createUser", static: false, private: false, access: { has: obj => "createUser" in obj, get: obj => obj.createUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateUsername_decorators, { kind: "method", name: "updateUsername", static: false, private: false, access: { has: obj => "updateUsername" in obj, get: obj => obj.updateUsername }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updatePassword_decorators, { kind: "method", name: "updatePassword", static: false, private: false, access: { has: obj => "updatePassword" in obj, get: obj => obj.updatePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _deleteUser_decorators, { kind: "method", name: "deleteUser", static: false, private: false, access: { has: obj => "deleteUser" in obj, get: obj => obj.deleteUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateStep_decorators, { kind: "method", name: "updateStep", static: false, private: false, access: { has: obj => "updateStep" in obj, get: obj => obj.updateStep }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getPosts_decorators, { kind: "method", name: "getPosts", static: false, private: false, access: { has: obj => "getPosts" in obj, get: obj => obj.getPosts }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getPost_decorators, { kind: "method", name: "getPost", static: false, private: false, access: { has: obj => "getPost" in obj, get: obj => obj.getPost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createPost_decorators, { kind: "method", name: "createPost", static: false, private: false, access: { has: obj => "createPost" in obj, get: obj => obj.createPost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updatePost_decorators, { kind: "method", name: "updatePost", static: false, private: false, access: { has: obj => "updatePost" in obj, get: obj => obj.updatePost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _deletePost_decorators, { kind: "method", name: "deletePost", static: false, private: false, access: { has: obj => "deletePost" in obj, get: obj => obj.deletePost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFriends_decorators, { kind: "method", name: "getFriends", static: false, private: false, access: { has: obj => "getFriends" in obj, get: obj => obj.getFriends }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _removeFriend_decorators, { kind: "method", name: "removeFriend", static: false, private: false, access: { has: obj => "removeFriend" in obj, get: obj => obj.removeFriend }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getRequests_decorators, { kind: "method", name: "getRequests", static: false, private: false, access: { has: obj => "getRequests" in obj, get: obj => obj.getRequests }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _sendFriendRequest_decorators, { kind: "method", name: "sendFriendRequest", static: false, private: false, access: { has: obj => "sendFriendRequest" in obj, get: obj => obj.sendFriendRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _removeFriendRequest_decorators, { kind: "method", name: "removeFriendRequest", static: false, private: false, access: { has: obj => "removeFriendRequest" in obj, get: obj => obj.removeFriendRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _acceptFriendRequest_decorators, { kind: "method", name: "acceptFriendRequest", static: false, private: false, access: { has: obj => "acceptFriendRequest" in obj, get: obj => obj.acceptFriendRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _rejectFriendRequest_decorators, { kind: "method", name: "rejectFriendRequest", static: false, private: false, access: { has: obj => "rejectFriendRequest" in obj, get: obj => obj.rejectFriendRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getComments_decorators, { kind: "method", name: "getComments", static: false, private: false, access: { has: obj => "getComments" in obj, get: obj => obj.getComments }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createComment_decorators, { kind: "method", name: "createComment", static: false, private: false, access: { has: obj => "createComment" in obj, get: obj => obj.createComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateComment_decorators, { kind: "method", name: "updateComment", static: false, private: false, access: { has: obj => "updateComment" in obj, get: obj => obj.updateComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _deleteComment_decorators, { kind: "method", name: "deleteComment", static: false, private: false, access: { has: obj => "deleteComment" in obj, get: obj => obj.deleteComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createAutoCaption_decorators, { kind: "method", name: "createAutoCaption", static: false, private: false, access: { has: obj => "createAutoCaption" in obj, get: obj => obj.createAutoCaption }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getAutoCaptions_decorators, { kind: "method", name: "getAutoCaptions", static: false, private: false, access: { has: obj => "getAutoCaptions" in obj, get: obj => obj.getAutoCaptions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateAutoCaption_decorators, { kind: "method", name: "updateAutoCaption", static: false, private: false, access: { has: obj => "updateAutoCaption" in obj, get: obj => obj.updateAutoCaption }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getSuggestions_decorators, { kind: "method", name: "getSuggestions", static: false, private: false, access: { has: obj => "getSuggestions" in obj, get: obj => obj.getSuggestions }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
function getSimilarityScores(target, sentences) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const model = "sentence-transformers/msmarco-distilbert-base-tas-b";
            const result = yield inference.sentenceSimilarity({
                model,
                inputs: {
                    source_sentence: target,
                    sentences: sentences,
                },
            });
            return result; // This should be an array of similarity scores
        }
        catch (error) {
            console.error("Error computing similarity scores:", error);
            throw error;
        }
    });
}
function getSuggestionList(sortedPosts, stepSize) {
    const suggestions = [];
    const maxSuggestions = 10;
    if (stepSize <= 1) {
        // Take the top N posts
        suggestions.push(...sortedPosts.slice(0, maxSuggestions));
    }
    else {
        // Skip posts according to stepSize
        for (let i = 0; i < sortedPosts.length && suggestions.length < maxSuggestions; i += stepSize) {
            suggestions.push(sortedPosts[i]);
        }
    }
    return suggestions;
}
function generateCaptionFromImageBuffer(imageBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Use the inference API to generate the caption
            const result = yield inference.imageToText({
                data: imageBuffer,
                model: "nlpconnect/vit-gpt2-image-captioning",
            });
            return result.generated_text;
        }
        catch (error) {
            console.error("Error generating caption from image buffer:", error);
            throw error;
        }
    });
}
/** The web app. */
exports.app = new Routes();
/** The Express router. */
exports.appRouter = (0, router_1.getExpressRouter)(exports.app);
//# sourceMappingURL=routes.js.map