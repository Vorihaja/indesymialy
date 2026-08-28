import type { RealErpSupabaseRepository } from "./real-erp-supabase.repository";
import type { RealErpMutation, RealErpQuery } from "./types";

export class RealErpDataService {
  constructor(private readonly repository: RealErpSupabaseRepository) {}
  load(query: RealErpQuery) {
    if (!query.moduleId.trim()) throw new Error("Module ERP invalide.");
    return this.repository.load(query);
  }
  create(mutation: RealErpMutation) {
    this.validate(mutation);
    return this.repository.create(mutation.entity, mutation.values, mutation.scope);
  }
  update(id: string, mutation: RealErpMutation) {
    if (!id) throw new Error("Identifiant manquant.");
    this.validate(mutation);
    return this.repository.update(mutation.entity, id, mutation.values);
  }
  remove(entity: RealErpMutation["entity"], id: string) {
    if (!id) throw new Error("Identifiant manquant.");
    return this.repository.remove(entity, id);
  }
  private validate(mutation: RealErpMutation) {
    if (mutation.entity === "readonly") throw new Error("Ce domaine est disponible en lecture seule.");
    if (mutation.entity === "workspace_records" && !String(mutation.values.title ?? "").trim()) throw new Error("Le titre est requis.");
    if (mutation.entity === "competitions" && !String(mutation.values.name ?? "").trim()) throw new Error("Le nom de la compétition est requis.");
    if (mutation.entity === "competition_categories" && !String(mutation.values.name ?? "").trim()) throw new Error("Le nom de la catégorie est requis.");
    if (mutation.entity === "competition_categories" && mutation.values.min_age !== null && mutation.values.max_age !== null && Number(mutation.values.min_age ?? 0) > Number(mutation.values.max_age ?? 0)) throw new Error("L’âge minimum ne peut pas dépasser l’âge maximum.");
    if (mutation.entity === "competition_categories" && mutation.values.min_weight_kg !== null && mutation.values.max_weight_kg !== null && Number(mutation.values.min_weight_kg ?? 0) > Number(mutation.values.max_weight_kg ?? 0)) throw new Error("Le poids minimum ne peut pas dépasser le poids maximum.");
    if (mutation.entity === "event_fight_cards" && mutation.values.fighter_red_id && mutation.values.fighter_red_id === mutation.values.fighter_blue_id) throw new Error("Les deux coins doivent contenir des combattants différents.");
    if (mutation.entity === "fights" && (!String(mutation.values.discipline_id ?? "").trim() || !String(mutation.values.weight_category ?? "").trim())) throw new Error("La discipline et la catégorie de poids sont requises.");
    if (mutation.entity === "fights" && mutation.values.fighter_red_id && mutation.values.fighter_red_id === mutation.values.fighter_blue_id) throw new Error("Un combattant ne peut pas occuper les deux coins.");
    if (mutation.entity === "fights" && String(mutation.values.status ?? "") === "completed" && !String(mutation.values.winner_id ?? "").trim()) throw new Error("Un vainqueur est requis pour terminer le combat.");
    if (mutation.entity === "weigh_ins" && !String(mutation.values.fighter_id ?? "").trim()) throw new Error("Le combattant est requis pour la pesée.");
    if (mutation.entity === "weigh_ins" && mutation.values.minimum_weight_kg !== null && mutation.values.maximum_weight_kg !== null && Number(mutation.values.minimum_weight_kg ?? 0) > Number(mutation.values.maximum_weight_kg ?? 0)) throw new Error("La limite minimale ne peut pas dépasser la limite maximale.");
    if (mutation.entity === "fight_replacements" && mutation.values.previous_fighter_id === mutation.values.replacement_fighter_id) throw new Error("Le remplaçant doit être différent du combattant remplacé.");
    if (mutation.entity === "ticket_sales" && (!String(mutation.values.ticket_type_id ?? "").trim() || Number(mutation.values.quantity ?? 0) <= 0)) throw new Error("Le type de billet et une quantité positive sont requis.");
    if (mutation.entity === "event_invitations" && (!String(mutation.values.mention ?? "").trim() || !String(mutation.values.role ?? "").trim())) throw new Error("Le nom de l’invité et son rôle sont requis.");
    if (mutation.entity === "event_access_logs" && !String(mutation.values.ticket_id ?? "").trim()) throw new Error("Le billet à contrôler est requis.");
    if (mutation.entity === "ticket_refunds" && (Number(mutation.values.amount ?? 0) <= 0 || !String(mutation.values.reason ?? "").trim())) throw new Error("Un montant positif et un motif sont requis.");
    if (mutation.entity === "ticket_refunds" && mutation.values.processed_amount !== null && Number(mutation.values.processed_amount ?? 0) < 0) throw new Error("Le montant traité ne peut pas être négatif.");
    if (mutation.entity === "staff_assignments" && (!String(mutation.values.staff_name ?? "").trim() || !String(mutation.values.role ?? "").trim())) throw new Error("Le nom et la fonction du membre sont requis.");
    if (mutation.entity === "staff_assignments" && Number(mutation.values.compensation_amount ?? 0) < 0) throw new Error("L’indemnité ne peut pas être négative.");
    if (mutation.entity === "event_official_assignments" && !String(mutation.values.profile_id ?? mutation.values.mention ?? "").trim()) throw new Error("Sélectionnez un profil officiel ou saisissez une mention.");
    if (mutation.entity === "fight_official_assignments" && (!String(mutation.values.fight_id ?? "").trim() || !String(mutation.values.user_id ?? "").trim())) throw new Error("Le combat et l’officiel sont requis.");
    if (mutation.entity === "event_accreditations" && !String(mutation.values.holder_name ?? "").trim()) throw new Error("Le titulaire de l’accréditation est requis.");
    if (mutation.entity === "event_accreditations" && mutation.values.valid_from && mutation.values.valid_until && String(mutation.values.valid_until) <= String(mutation.values.valid_from)) throw new Error("La fin de validité doit être postérieure au début.");
    const amount = mutation.values.amount;
    if (amount !== undefined && amount !== null && Number(amount) < 0) throw new Error("Le montant ne peut pas être négatif.");
    if (["organization_transactions", "fighter_transactions", "event_transactions"].includes(mutation.entity) && Number(mutation.values.amount ?? 0) <= 0) throw new Error("Le montant doit être supérieur à zéro.");
    if (mutation.entity === "ticket_types" && Number(mutation.values.total_quantity ?? 0) <= 0) throw new Error("Le quota de billets doit être supérieur à zéro.");
    if (mutation.entity === "ticket_types" && Number(mutation.values.max_per_order ?? 1) > Number(mutation.values.total_quantity ?? 0)) throw new Error("Le maximum par commande ne peut pas dépasser le quota.");
    if (mutation.entity === "event_schedule_items" && String(mutation.values.ends_at ?? "") <= String(mutation.values.starts_at ?? "")) throw new Error("La fin du planning doit être postérieure au début.");
    if (mutation.entity === "staff_assignments" && mutation.values.ends_at && mutation.values.starts_at && String(mutation.values.ends_at) <= String(mutation.values.starts_at)) throw new Error("La fin de l’affectation doit être postérieure au début.");    if (mutation.entity === "events" && !String(mutation.values.title ?? "").trim()) throw new Error("Le nom de l’événement est requis.");
    if (mutation.entity === "products" && !String(mutation.values.name ?? "").trim()) throw new Error("Le nom du produit est requis.");
    if (mutation.entity === "training_sessions" && !String(mutation.values.title ?? "").trim()) throw new Error("Le titre de la séance est requis.");
    if (mutation.entity === "contracts" && (!String(mutation.values.ref ?? "").trim() || !String(mutation.values.beneficiary ?? "").trim())) throw new Error("La référence et le bénéficiaire sont requis.");
  }
}
