import { ObjectId } from "mongodb";
import { Router, getExpressRouter } from "./framework/router";

import { Authing, Imaging, Sessioning, Archiving } from "./app";
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

  //Archiving

  @Router.get("/archive")
  async getArchiveByAuthor(author: string) {
    const id = new ObjectId(author); // Convert string to ObjectId
    const archives = await Archiving.getArchives(id); // Fetch images by author ID
    return { archives };
  }

  @Router.post("/archive")
  async createArchive(
    session: SessionDoc,
    image: string,
  ) {
    const author = Sessioning.getUser(session);
    const created = await Archiving.create(author, image);
    return { msg: created.msg};
  }

  //ImageDoc

  @Router.post("/images")
  async createImage(
    session: SessionDoc,
    parent: ObjectId,
    coordinate: string,
    type: string,
    step: string,
    prompt?: string,
    originalImage?: string,
    steppedImage?: string,
    promptedImage?: string,
    caption?: string,
    promptList?: string,
  ) {
    const author = Sessioning.getUser(session);
    const created = await Imaging.create(author, parent, coordinate, type, step, prompt, originalImage, steppedImage, promptedImage, caption, promptList);
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

  //Python Server

  @Router.post("/images/process")
  @Router.validate(z.object({
    type: z.string().refine(val => ['noise', 'denoise'].includes(val), { message: "Invalid type" }),
    steps: z.number().int().positive(),
    prompt_word: z.string().optional(),
    original_image: z.string(),
  }))
  async processImage(type: string, steps: number, prompt_word: string, original_image: string) {
    console.log("Process Image - Type:", type, "Steps:", steps);
    
    const response = await fetch("https://app.unaliu.com/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: type,
        steps: steps,
        prompt_word: prompt_word,
        original_image: original_image,
      }),
    });
  
    if (!response.ok) {
      console.error(`Image processing failed with status: ${response.statusText}`);
      throw new Error(`Image processing failed: ${response.statusText}`);
    }
  
    const jsonResponse = await response.json();
    console.log("Stable Diffusion Response:", jsonResponse);
    return jsonResponse;
  }
  

  //OpenAI

  @Router.post("/chatgpt")
  async handleChatGPTRequest(prompt: string) {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // Specify the model
        messages: [
          {
            role: "user",
            content: `Strictly generate a list of 36 string containing words similar to this scene: ${prompt}. Rank them from most similar to most dissimilar. The list will be indivudal words seperated by comma, thats it, no labeling or indexing of any kind.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { response: data.choices[0].message.content };
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);