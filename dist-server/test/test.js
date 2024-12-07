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
const assert_1 = require("assert");
const dotenv_1 = __importDefault(require("dotenv"));
const process_1 = __importDefault(require("process"));
// Make sure we are in test mode!
process_1.default.env.TEST = "true";
// Also need to load the .env file
dotenv_1.default.config();
// Test mode must be set before importing the routes
const routes_1 = require("../server/routes");
const db_1 = __importStar(require("../server/db"));
if (db_1.default.databaseName !== "test-db") {
    throw new Error("Not connected to test database");
}
// Actual sessions are created by Express, here we use a mock session
function getEmptySession() {
    return { cookie: {} };
}
// Before each test...
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    // Drop the test database
    yield db_1.default.dropDatabase();
    // Add some default users we can use
    yield routes_1.app.createUser(getEmptySession(), "alice", "alice123");
    yield routes_1.app.createUser(getEmptySession(), "bob", "bob123");
}));
// After all tests are done...
after(() => __awaiter(void 0, void 0, void 0, function* () {
    // Close the database connection so that Node exits
    yield db_1.client.close();
}));
describe("Create a user and log in", () => {
    it("should create a user and log in", () => __awaiter(void 0, void 0, void 0, function* () {
        const session = getEmptySession();
        const created = yield routes_1.app.createUser(session, "barish", "1234");
        (0, assert_1.strict)(created.user);
        yield assert_1.strict.rejects(routes_1.app.logIn(session, "barish", "123"));
        yield routes_1.app.logIn(session, "barish", "1234");
        yield assert_1.strict.rejects(routes_1.app.logIn(session, "barish", "1234"), "Should not be able to login while already logged-in");
    }));
    it("duplicate username should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const session = getEmptySession();
        const created = yield routes_1.app.createUser(session, "barish", "1234");
        (0, assert_1.strict)(created.user);
        yield assert_1.strict.rejects(routes_1.app.createUser(session, "barish", "1234"));
    }));
    it("get invalid username should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        yield assert_1.strict.rejects(routes_1.app.getUser(""), "Username should be at least 1 character long");
        yield routes_1.app.getUser("alice");
    }));
});
/*
 * As you add more tests, remember to put them inside `describe` blocks.
 */
//# sourceMappingURL=test.js.map