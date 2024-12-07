"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Imaging = exports.Friending = exports.Posting = exports.Authing = exports.Sessioning = void 0;
const authenticating_1 = __importDefault(require("./concepts/authenticating"));
const friending_1 = __importDefault(require("./concepts/friending"));
const image_1 = __importDefault(require("concepts/image"));
const posting_1 = __importDefault(require("./concepts/posting"));
const sessioning_1 = __importDefault(require("./concepts/sessioning"));
// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
exports.Sessioning = new sessioning_1.default();
exports.Authing = new authenticating_1.default("users");
exports.Posting = new posting_1.default("posts");
exports.Friending = new friending_1.default("friends");
exports.Imaging = new image_1.default("images");
//# sourceMappingURL=app.js.map