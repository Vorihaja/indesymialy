import type {
  KoranaMediaUploadInput,
} from "../media.types";

import {
  KoranaMediaRepository,
} from "../repositories/korana-media.repository";


const IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);


const VIDEO_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);


const IMAGE_MAX_BYTES =
  10 * 1024 * 1024;


const VIDEO_MAX_BYTES =
  100 * 1024 * 1024;


export class KoranaMediaService {

  constructor(
    private readonly repository:
      KoranaMediaRepository,
  ) {}


  async uploadMany(
    inputs:
      KoranaMediaUploadInput[],
  ) {

    if (
      inputs.length === 0
    ) {

      return [];
    }


    const videos =
      inputs.filter(
        (input) =>
          VIDEO_TYPES.has(
            input.file.type,
          ),
      );


    const images =
      inputs.filter(
        (input) =>
          IMAGE_TYPES.has(
            input.file.type,
          ),
      );


    if (
      videos.length > 0 &&
      images.length > 0
    ) {

      throw new Error(
        "Une publication ne peut pas mélanger images et vidéo.",
      );
    }


    if (
      videos.length > 1
    ) {

      throw new Error(
        "Une seule vidéo est autorisée par publication.",
      );
    }


    if (
      images.length > 4
    ) {

      throw new Error(
        "Quatre images maximum sont autorisées par publication.",
      );
    }


    for (
      const input
      of inputs
    ) {

      const {
        file,
      } =
        input;


      if (
        IMAGE_TYPES.has(
          file.type,
        )
      ) {

        if (
          file.size >
          IMAGE_MAX_BYTES
        ) {

          throw new Error(
            "Chaque image doit faire 10 Mo maximum.",
          );
        }

        continue;
      }


      if (
        VIDEO_TYPES.has(
          file.type,
        )
      ) {

        if (
          file.size >
          VIDEO_MAX_BYTES
        ) {

          throw new Error(
            "La vidéo doit faire 100 Mo maximum.",
          );
        }

        continue;
      }


      throw new Error(
        "Format média non pris en charge.",
      );
    }


    const results =
      [];


    for (
      const input
      of inputs
    ) {

      results.push(
        await this.repository.uploadAndAttach(
          input,
        ),
      );
    }


    return results;
  }


  detach(
    mediaId: string,
  ) {

    if (
      !mediaId.trim()
    ) {

      throw new Error(
        "Média Korana introuvable.",
      );
    }


    return this.repository.detach(
      mediaId,
    );
  }


  createSignedUrls(
    storagePaths:
      string[],
  ) {

    return this.repository.createSignedUrls(
      storagePaths,
    );
  }
}