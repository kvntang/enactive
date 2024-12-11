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

  async getArchives(user: ObjectId) {
    return await this.archives.readMany({ creator: user }, { sort: { timePeriod: -1 } });
  }
}

export class ImageAlreadyInArchiveError extends NotAllowedError {
  constructor(imageDoc: ObjectId) {
    super(`ImageDoc ${imageDoc} is already in archive.`);
  }
}
