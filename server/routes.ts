import { ObjectId } from "mongodb";
import { Router, getExpressRouter } from "./framework/router";

import { Authing, Imaging, Sessioning } from "./app";
import { SessionDoc } from "./concepts/sessioning";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  //image API routes

  /**
   * Create a new ImageDoc.
   */
  @Router.post("/images")
  async createImage(session: SessionDoc, parent: ObjectId, coordinate: string, type: string, step: string, prompt?: string, originalImage?: string, steppedImage?: string, promptedImage?: string) {
    const author = Sessioning.getUser(session);
    const created = await Imaging.create(author, parent, coordinate, type, step, prompt, originalImage, steppedImage, promptedImage);
    return { msg: created.msg, image: created.image };
  }

  @Router.get("/images/author/:author")
  async getImagesByAuthor(author: string) {
    const id = new ObjectId(author); // Convert string to ObjectId
    const images = await Imaging.getImagesByAuthor(id); // Fetch images by author ID
    return { images };
  }

  @Router.delete("/images/author/:authorId")
  async deleteImagesByAuthor(authorId: string) {
    const author = new ObjectId(authorId);
    await Imaging.deleteAllByAuthor(author); // Imaging is your concept class
    return { msg: "All images deleted successfully!" };
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
