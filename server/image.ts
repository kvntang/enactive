import { ObjectId } from "mongodb";

import { generateCaption } from "../../client/utils/huggingFaceService";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";
export interface ImageDoc extends BaseDoc {
  author: ObjectId;
  parent: ObjectId;
  coordinate: string; // "x,y" position
  prompt: string;
  type: string; // "red" or "blue" based on direction
  step: string; // Launch distance as a string
  originalImage: string; // Base64 string placeholder
  steppedImage: string; // Base64 string placeholder
  promptedImage: string; // Base64 string placeholder
  caption?: string; // Generated caption
}

/**
 * concept: ImageManagement [Author]
 */
export default class ImageConcept {
  public readonly images: DocCollection<ImageDoc>;

  /**
   * Create an instance of ImageConcept.
   */
  constructor(collectionName: string) {
    this.images = new DocCollection<ImageDoc>(collectionName);
  }

  /**
   * Create a new ImageDoc.
   */
  async create(author: ObjectId, parent: ObjectId, coordinate: string, type: string, step: string, prompt?: string, originalImage?: string, steppedImage?: string, promptedImage?: string) {
    const caption = originalImage ? await generateCaption(originalImage) : "";
    
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
      caption, // Add this
    });
  
    return { msg: "Image successfully created!", image: await this.images.readOne({ _id }) };
  }

  /**
   * Get all images (optionally sorted).
   */
  async getImages() {
    return await this.images.readMany({}, { sort: { _id: -1 } });
  }

  /**
   * Get images by author ID.
   */
  async getImagesByAuthor(author: ObjectId) {
    return await this.images.readMany({ author });
  }

  /**
   * Get a single image by its ID.
   */
  async getImageById(_id: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image with ID ${_id} does not exist!`);
    }
    return image;
  }

  /**
   * Update an ImageDoc.
   */
  async updateImage(_id: ObjectId, coordinate?: string, type?: string, step?: string, prompt?: string, originalImage?: string, steppedImage?: string, promptedImage?: string) {
    await this.images.partialUpdateOne({ _id }, { coordinate, type, step, prompt, originalImage, steppedImage, promptedImage });
    return { msg: "Image successfully updated!" };
  }

  /**
   * Delete an image by its ID.
   */
  async deleteImageById(_id: ObjectId) {
    await this.images.deleteOne({ _id });
    return { msg: "Image deleted successfully!" };
  }

  /**
   * Delete all images by a specific author.
   */
  async deleteAllByAuthor(author: ObjectId) {
    await this.images.deleteMany({ author });
    return { msg: "All images for this author have been deleted!" };
  }

  /**
   * Ensure the author matches the user for an image.
   */
  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image ${_id} does not exist!`);
    }
    if (image.author.toString() !== user.toString()) {
      throw new ImageAuthorNotMatchError(user, _id);
    }
  }

  /**
   * Assert that an image exists.
   */
  async assertImageExists(_id: ObjectId) {
    const image = await this.images.readOne({ _id });
    if (!image) {
      throw new NotFoundError(`Image with ID ${_id} does not exist!`);
    }
    return image; // Return the image if it exists
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
