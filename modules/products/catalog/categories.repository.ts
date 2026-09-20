import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";


export type SellerCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  active: boolean;
  sortOrder: number;
};


export class SellerCatalogCategoriesRepository {
  async list(): Promise<SellerCatalogCategory[]> {
    const client =
      createSupabaseBrowserClient();

    const {
      data,
      error,
    } =
      await client
        .from("marketplace_categories")
        .select(
          "id,name,slug,description,parent_id,is_active,sort_order",
        )
        .order(
          "sort_order",
          {
            ascending: true,
          },
        )
        .order(
          "name",
          {
            ascending: true,
          },
        );

    if (error) {
      throw error;
    }

    return (
      data ?? []
    ).map(
      (row) => ({
        id:
          row.id,

        name:
          row.name,

        slug:
          row.slug,

        description:
          row.description,

        parentId:
          row.parent_id,

        active:
          row.is_active,

        sortOrder:
          row.sort_order,
      }),
    );
  }
}