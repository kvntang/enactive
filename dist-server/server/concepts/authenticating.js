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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const doc_1 = __importDefault(require("../framework/doc"));
const errors_1 = require("./errors");
/**
 * concept: Authenticating
 */
class AuthenticatingConcept {
    /**
     * Make an instance of Authenticating.
     */
    constructor(collectionName) {
        this.users = new doc_1.default(collectionName);
        // Create index on username to make search queries for it performant
        void this.users.collection.createIndex({ username: 1 });
    }
    create(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertGoodCredentials(username, password);
            const stepSize = "1"; // Default stepSize
            const _id = yield this.users.createOne({ username, password, stepSize });
            return { msg: "User created successfully!", user: yield this.users.readOne({ _id }) };
        });
    }
    redactPassword(user) {
        // eslint-disable-next-line
        const { password } = user, rest = __rest(user, ["password"]);
        return rest;
    }
    getUserById(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.users.readOne({ _id });
            if (user === null) {
                throw new errors_1.NotFoundError(`User not found!`);
            }
            return this.redactPassword(user);
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.users.readOne({ username });
            if (user === null) {
                throw new errors_1.NotFoundError(`User not found!`);
            }
            return this.redactPassword(user);
        });
    }
    idsToUsernames(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.users.readMany({ _id: { $in: ids } });
            // Store strings in Map because ObjectId comparison by reference is wrong
            const idToUser = new Map(users.map((user) => [user._id.toString(), user]));
            return ids.map((id) => { var _a, _b; return (_b = (_a = idToUser.get(id.toString())) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : "DELETED_USER"; });
        });
    }
    getUsers(username) {
        return __awaiter(this, void 0, void 0, function* () {
            // If username is undefined, return all users by applying empty filter
            const filter = username ? { username } : {};
            const users = (yield this.users.readMany(filter)).map(this.redactPassword);
            return users;
        });
    }
    authenticate(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.users.readOne({ username, password });
            if (!user) {
                throw new errors_1.NotAllowedError("Username or password is incorrect.");
            }
            return { msg: "Successfully authenticated.", _id: user._id };
        });
    }
    updateUsername(_id, username) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertUsernameUnique(username);
            yield this.users.partialUpdateOne({ _id }, { username });
            return { msg: "Username updated successfully!" };
        });
    }
    updatePassword(_id, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.users.readOne({ _id });
            if (!user) {
                throw new errors_1.NotFoundError("User not found");
            }
            if (user.password !== currentPassword) {
                throw new errors_1.NotAllowedError("The given current password is wrong!");
            }
            yield this.users.partialUpdateOne({ _id }, { password: newPassword });
            return { msg: "Password updated successfully!" };
        });
    }
    delete(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.users.deleteOne({ _id });
            return { msg: "User deleted!" };
        });
    }
    assertUserExists(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const maybeUser = yield this.users.readOne({ _id });
            if (maybeUser === null) {
                throw new errors_1.NotFoundError(`User not found!`);
            }
        });
    }
    assertGoodCredentials(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!username || !password) {
                throw new errors_1.BadValuesError("Username and password must be non-empty!");
            }
            yield this.assertUsernameUnique(username);
        });
    }
    //
    //
    //
    // New method to update stepSize
    updateStepSize(_id, stepSize) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.users.partialUpdateOne({ _id }, { stepSize });
            return { msg: "Step size updated successfully!", stepSize };
        });
    }
    // Helper method to validate stepSize
    // private async assertStepSizeValid(stepSize: number) {
    //   if (!Number.isInteger(stepSize) || stepSize < 1 || stepSize > 5) {
    //     throw new BadValuesError("Step size must be an integer between 1 and 5.");
    //   }
    // }
    //
    //
    //
    assertUsernameUnique(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.users.readOne({ username })) {
                throw new errors_1.NotAllowedError(`User with username ${username} already exists!`);
            }
        });
    }
}
exports.default = AuthenticatingConcept;
//# sourceMappingURL=authenticating.js.map