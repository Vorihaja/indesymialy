import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { createMarketplaceRuntimeRepository } from "@/modules/marketplace-core";

export class CatalogRepository {
  private readonly marketplace = createMarketplaceRuntimeRepository();
  private readonly supabase = createSupabaseBrowserClient();
  products(){ return this.marketplace.listProducts(); }
  product(id:string){ return this.marketplace.findProduct(id); }
  async favorites(){
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await this.supabase.from("marketplace_favorites" as "products").select("product_id");
    if (error) throw error;
    return ((data ?? []) as unknown as Array<{product_id:string}>).map(item => item.product_id);
  }
  async toggleFavorite(id:string){
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Connectez-vous pour gérer vos favoris.");
    const current = await this.favorites();
    if (current.includes(id)) {
      const { error } = await (this.supabase.from("marketplace_favorites" as "products") as never as {delete(): {eq(column:string,value:string): {eq(column:string,value:string): Promise<{error:unknown}>}}}).delete().eq("profile_id", userData.user.id).eq("product_id", id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase.from("marketplace_favorites" as "products").insert({ profile_id: userData.user.id, product_id: id } as never);
      if (error) throw error;
    }
    return this.favorites();
  }
}
