import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";


export type ProductMediaAsset = {
  path: string;
  url: string;
  name: string;
};


const BUCKET =
  "marketplace-product-images";

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);


function extensionFor(
  file: File,
) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      throw new Error(
        "Format non accepté. Utilisez JPG, PNG ou WebP.",
      );
  }
}


export class ProductMediaRepository {
  constructor(
    private readonly client:
      SupabaseClient<Database>,
  ) {}


  private async currentUserId() {
    const {
      data,
      error,
    } =
      await this.client.auth.getUser();

    if (
      error ||
      !data.user
    ) {
      throw new Error(
        "Votre session utilisateur est introuvable.",
      );
    }

    return data.user.id;
  }


  async upload(
    files: File[],
  ): Promise<ProductMediaAsset[]> {
    const userId =
      await this.currentUserId();

    const assets:
      ProductMediaAsset[] =
      [];

    for (const file of files) {
      if (
        !ALLOWED_TYPES.has(
          file.type,
        )
      ) {
        throw new Error(
          `${file.name} : format non accepté.`,
        );
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        throw new Error(
          `${file.name} dépasse 8 Mo.`,
        );
      }

      const extension =
        extensionFor(file);

      const path =
        `${userId}/${crypto.randomUUID()}.${extension}`;

      const {
        error,
      } =
        await this.client.storage
          .from(BUCKET)
          .upload(
            path,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            },
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        this.client.storage
          .from(BUCKET)
          .getPublicUrl(
            path,
          );

      assets.push({
        path,
        url:
          data.publicUrl,
        name:
          file.name,
      });
    }

    return assets;
  }


  async list(): Promise<
    ProductMediaAsset[]
  > {
    const userId =
      await this.currentUserId();

    const {
      data,
      error,
    } =
      await this.client.storage
        .from(BUCKET)
        .list(
          userId,
          {
            limit: 200,
            sortBy: {
              column:
                "created_at",
              order:
                "desc",
            },
          },
        );

    if (error) {
      throw error;
    }

    return (
      data ?? []
    )
      .filter(
        (item) =>
          Boolean(
            item.name,
          ),
      )
      .map(
        (item) => {
          const path =
            `${userId}/${item.name}`;

          const {
            data:
              publicData,
          } =
            this.client.storage
              .from(BUCKET)
              .getPublicUrl(
                path,
              );

          return {
            path,
            url:
              publicData.publicUrl,
            name:
              item.name,
          };
        },
      );
  }


  async remove(
    path: string,
  ): Promise<void> {
    const userId =
      await this.currentUserId();

    if (
      !path.startsWith(
        `${userId}/`,
      )
    ) {
      throw new Error(
        "Ce média ne vous appartient pas.",
      );
    }

    const {
      error,
    } =
      await this.client.storage
        .from(BUCKET)
        .remove([
          path,
        ]);

    if (error) {
      throw error;
    }
  }
}