"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = exports.app = void 0;
const mongodb_1 = require("mongodb");
const router_1 = require("./framework/router");
const app_1 = require("./app");
const zod_1 = require("zod");
/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
let Routes = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _getSessionUser_decorators;
    let _getUsers_decorators;
    let _getUser_decorators;
    let _createUser_decorators;
    let _updateUsername_decorators;
    let _updatePassword_decorators;
    let _deleteUser_decorators;
    let _logIn_decorators;
    let _logOut_decorators;
    let _createImage_decorators;
    let _getImagesByAuthor_decorators;
    let _deleteImagesByAuthor_decorators;
    let _handleChatGPTRequest_decorators;
    return _a = class Routes {
            // Synchronize the concepts from `app.ts`.
            getSessionUser(session) {
                return __awaiter(this, void 0, void 0, function* () {
                    const user = app_1.Sessioning.getUser(session);
                    return yield app_1.Authing.getUserById(user);
                });
            }
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
            //image API routes
            /**
             * Create a new ImageDoc.
             */
            createImage(session, parent, coordinate, type, step, prompt, originalImage, steppedImage, promptedImage, caption, promptList) {
                return __awaiter(this, void 0, void 0, function* () {
                    const author = app_1.Sessioning.getUser(session);
                    const created = yield app_1.Imaging.create(author, parent, coordinate, type, step, prompt, originalImage, steppedImage, promptedImage, caption, promptList);
                    return { msg: created.msg, image: created.image };
                });
            }
            getImagesByAuthor(author) {
                return __awaiter(this, void 0, void 0, function* () {
                    const id = new mongodb_1.ObjectId(author); // Convert string to ObjectId
                    const images = yield app_1.Imaging.getImagesByAuthor(id); // Fetch images by author ID
                    return { images };
                });
            }
            deleteImagesByAuthor(authorId) {
                return __awaiter(this, void 0, void 0, function* () {
                    const author = new mongodb_1.ObjectId(authorId);
                    yield app_1.Imaging.deleteAllByAuthor(author); // Imaging is your concept class
                    return { msg: "All images deleted successfully!" };
                });
            }
            handleChatGPTRequest(prompt) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!prompt || prompt.trim().length === 0) {
                        throw new Error("Prompt cannot be empty");
                    }
                    const response = yield fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: "gpt-4", // Specify the model
                            messages: [
                                { role: "user", content: `Strictly generate a JSON object with keys 0-35 containing words similar to this scene: ${prompt}. Ensure 0 is most similar. Make sure you only give one word response for each. Format exactly like:
                {{
                  "0": "most similar word",
                  "1": "second similar word",
                  ...
                  "35": "least similar word"
                }},` }
                            ],
                        }),
                    });
                    if (!response.ok) {
                        throw new Error(`OpenAI API Error: ${response.statusText}`);
                    }
                    const data = yield response.json();
                    return { response: data.choices[0].message.content };
                });
            }
            constructor() {
                __runInitializers(this, _instanceExtraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getSessionUser_decorators = [router_1.Router.get("/session")];
            _getUsers_decorators = [router_1.Router.get("/users")];
            _getUser_decorators = [router_1.Router.get("/users/:username"), router_1.Router.validate(zod_1.z.object({ username: zod_1.z.string().min(1) }))];
            _createUser_decorators = [router_1.Router.post("/users")];
            _updateUsername_decorators = [router_1.Router.patch("/users/username")];
            _updatePassword_decorators = [router_1.Router.patch("/users/password")];
            _deleteUser_decorators = [router_1.Router.delete("/users")];
            _logIn_decorators = [router_1.Router.post("/login")];
            _logOut_decorators = [router_1.Router.post("/logout")];
            _createImage_decorators = [router_1.Router.post("/images")];
            _getImagesByAuthor_decorators = [router_1.Router.get("/images/author/:author")];
            _deleteImagesByAuthor_decorators = [router_1.Router.delete("/images/author/:authorId")];
            _handleChatGPTRequest_decorators = [router_1.Router.post("/chatgpt")];
            __esDecorate(_a, null, _getSessionUser_decorators, { kind: "method", name: "getSessionUser", static: false, private: false, access: { has: obj => "getSessionUser" in obj, get: obj => obj.getSessionUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getUsers_decorators, { kind: "method", name: "getUsers", static: false, private: false, access: { has: obj => "getUsers" in obj, get: obj => obj.getUsers }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getUser_decorators, { kind: "method", name: "getUser", static: false, private: false, access: { has: obj => "getUser" in obj, get: obj => obj.getUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createUser_decorators, { kind: "method", name: "createUser", static: false, private: false, access: { has: obj => "createUser" in obj, get: obj => obj.createUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateUsername_decorators, { kind: "method", name: "updateUsername", static: false, private: false, access: { has: obj => "updateUsername" in obj, get: obj => obj.updateUsername }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updatePassword_decorators, { kind: "method", name: "updatePassword", static: false, private: false, access: { has: obj => "updatePassword" in obj, get: obj => obj.updatePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _deleteUser_decorators, { kind: "method", name: "deleteUser", static: false, private: false, access: { has: obj => "deleteUser" in obj, get: obj => obj.deleteUser }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _logIn_decorators, { kind: "method", name: "logIn", static: false, private: false, access: { has: obj => "logIn" in obj, get: obj => obj.logIn }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _logOut_decorators, { kind: "method", name: "logOut", static: false, private: false, access: { has: obj => "logOut" in obj, get: obj => obj.logOut }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createImage_decorators, { kind: "method", name: "createImage", static: false, private: false, access: { has: obj => "createImage" in obj, get: obj => obj.createImage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getImagesByAuthor_decorators, { kind: "method", name: "getImagesByAuthor", static: false, private: false, access: { has: obj => "getImagesByAuthor" in obj, get: obj => obj.getImagesByAuthor }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _deleteImagesByAuthor_decorators, { kind: "method", name: "deleteImagesByAuthor", static: false, private: false, access: { has: obj => "deleteImagesByAuthor" in obj, get: obj => obj.deleteImagesByAuthor }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _handleChatGPTRequest_decorators, { kind: "method", name: "handleChatGPTRequest", static: false, private: false, access: { has: obj => "handleChatGPTRequest" in obj, get: obj => obj.handleChatGPTRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
/** The web app. */
exports.app = new Routes();
/** The Express router. */
exports.appRouter = (0, router_1.getExpressRouter)(exports.app);
//# sourceMappingURL=routes.js.map