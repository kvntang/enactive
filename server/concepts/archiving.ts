import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface ArchiveDoc extends BaseDoc {
  author: ObjectId;
  image: string;
}

/**
 * concept: Archiving
 */
export default class ArchivingConcept {
  public readonly archives: DocCollection<ArchiveDoc>;

  constructor(collectionName: string) {
    this.archives = new DocCollection<ArchiveDoc>(collectionName);
  }

  async create(author: ObjectId, image: string) {
    const _id = await this.archives.createOne({ author, image });
    return { msg: "Archive successfully created!", archive: await this.archives.readOne({ _id }) };
  }

  // async getArchives(user: ObjectId) {
  //   return await this.archives.readMany({ author: user }, { sort: { timePeriod: -1 } });
  // }
  async getArchives(user: ObjectId) {
    return await this.archives.readMany(
      { author: user },
      { sort: { _id: -1 } }  // Sort by _id descending (newest first)
    );
  }

  async delete(id: ObjectId) {
    const archive = await this.archives.readOne({ _id: id });
    if (!archive) throw new Error("Archive not found");
    await this.archives.deleteOne({ _id: id });
    return { msg: "Archive deleted successfully!" };
  }
  
}

export class ImageAlreadyInArchiveError extends NotAllowedError {
  constructor(imageDoc: ObjectId) {
    super(`ImageDoc ${imageDoc} is already in archive.`);
  }
}
