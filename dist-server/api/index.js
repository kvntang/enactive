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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const morgan_1 = __importDefault(require("morgan"));
const path = __importStar(require("path"));
// The following line sets up the environment variables before everything else.
dotenv_1.default.config();
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const db_1 = require("../server/db");
const routes_1 = require("../server/routes");
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use((0, cors_1.default)()); // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
// app.use(express.json()); // Enable parsing JSON in requests and responses.
// app.use(express.urlencoded({ extended: false })); // Also enable URL encoded request and responses.
// Increase the size limits for JSON and URL-encoded payloads
exports.app.use(express_1.default.json({ limit: "50mb" })); // Increase JSON body size limit to 50MB
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" })); // Increase URL-encoded body size limit to 50MB
// Session allows us to store a cookie 🍪.
exports.app.use((0, express_session_1.default)({
    secret: process.env.SECRET || "Hello 6.1040",
    resave: true,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGO_SRV,
        dbName: "mongo-sessions",
    }),
}));
exports.app.use(express_1.default.static(path.join(__dirname, "../public")));
exports.app.use("/api/", routes_1.appRouter);
// For all unrecognized requests, return a not found message.
exports.app.all("*", (req, res) => {
    res.status(404).json({
        msg: "Page not found",
    });
});
void (0, db_1.connectDb)().then(() => {
    exports.app.listen(PORT, () => {
        console.log("Started listening on port", PORT);
    });
});
exports.default = exports.app;
//# sourceMappingURL=index.js.map