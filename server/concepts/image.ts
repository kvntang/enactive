import { HfInference } from "@huggingface/inference";
import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

const inference = new HfInference("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");

export interface ImageDoc extends BaseDoc {
  author: ObjectId;
  parent: ObjectId;
  coordinate: string;
  prompt: string;
  type: string;
  step: string;
  originalImage: string;
  steppedImage: string;
  promptedImage: string;
  caption?: string;
}

export default class ImageConcept {
  public readonly images: DocCollection<ImageDoc>;

  constructor(collectionName: string) {
    this.images = new DocCollection<ImageDoc>(collectionName);
  }

  private async generateCaption(imageBase64: string): Promise<string> {
    try {
      const base64Data = imageBase64.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const result = await inference.imageToText({
        data: blob,
        model: "nlpconnect/vit-gpt2-image-captioning",
      });

      return result.generated_text;
    } catch (error) {
      console.error("Error generating caption:", error);
      return "Failed to generate caption";
    }
  }

  async create(author: ObjectId, parent: ObjectId, coordinate: string, type: string, step: string, prompt?: string, originalImage?: string, steppedImage?: string, promptedImage?: string) {
    const caption = originalImage ? await this.generateCaption(originalImage) : "";
    
    const _id = await this.images.createOne({
      author,
      parent,
      coordinate,
      type,
      step,
      prompt: prompt || "",
      originalImage: originalImage || "",
      steppedImage: steppedImage || "",
      promptedImage: promptedImage || "",
      caption, 
    });
  
    return { msg: "Image successfully created!", image: await this.images.readOne({ _id }) };
  }

  async getImages() {
    return await this.images.readMany({}, { sort: { _id: -1 } });
  }

  async getImagesByAuthor(author: ObjectId) {
    return await this.images.readMany({ author });
  }

  async getImageById(_id: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image with ID ${_id} does not exist!`);
    }
    return image;
  }

  async updateImage(_id: ObjectId, coordinate?: string, type?: string, step?: string, prompt?: string, originalImage?: string, steppedImage?: string, promptedImage?: string) {
    await this.images.partialUpdateOne({ _id }, { coordinate, type, step, prompt, originalImage, steppedImage, promptedImage });
    return { msg: "Image successfully updated!" };
  }

  async deleteImageById(_id: ObjectId) {
    await this.images.deleteOne({ _id });
    return { msg: "Image deleted successfully!" };
  }

  async deleteAllByAuthor(author: ObjectId) {
    await this.images.deleteMany({ author });
    return { msg: "All images for this author have been deleted!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image ${_id} does not exist!`);
    }
    if (image.author.toString() !== user.toString()) {
      throw new ImageAuthorNotMatchError(user, _id);
    }
  }

  async assertImageExists(_id: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image with ID ${_id} does not exist!`);
    }
    return image;
  }
}

export class ImageAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of image {1}!", author, _id);
  }
}