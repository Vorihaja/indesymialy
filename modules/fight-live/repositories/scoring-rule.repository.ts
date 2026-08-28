import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"

type ScoringSystemRow = { id: string; code: string; name: string; config?: Record<string, unknown> }
type RuleRow = { id: string; rule_type: string; value: unknown; description?: string }
type ActionRow = { id: string; code: string; name: string; points?: number; metadata?: Record<string, unknown> }
type PenaltyRow = { id: string; code: string; name: string; value?: number }
type WinMethodRow = { id: string; code: string; name: string }

export class ScoringRuleRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getDisciplineRules(disciplineId: string): Promise<RuleRow[]> {
    const { data, error } = await this.supabase.from("discipline_action_rules").select("id, action_id, points_value, description").eq("discipline_id", disciplineId).eq("is_allowed", true)
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((rule) => ({ id: rule.id, rule_type: rule.action_id, value: rule.points_value, description: rule.description ?? undefined }))
  }

  async getScoringSystem(disciplineId: string): Promise<ScoringSystemRow | null> {
    void disciplineId
    return null
  }

  async getScoringActions(disciplineId: string): Promise<ActionRow[]> {
    const { data: links, error: linkError } = await this.supabase.from("discipline_action_types").select("action_type_id").eq("discipline_id", disciplineId)
    if (linkError) throw normalizeBackendError(linkError)
    const ids = (links ?? []).map((link) => link.action_type_id)
    if (ids.length === 0) return []
    const { data, error } = await this.supabase.from("fight_action_types").select("id, code, name").in("id", ids).eq("is_active", true).order("sort_order")
    if (error) throw normalizeBackendError(error)
    return data ?? []
  }

  async getPenalties(disciplineId: string): Promise<PenaltyRow[]> {
    const { data, error } = await this.supabase.from("discipline_action_rules").select("id, action_id, points_value").eq("discipline_id", disciplineId).eq("penalty_if_used", true)
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((penalty) => ({ id: penalty.id, code: penalty.action_id, name: penalty.action_id, value: penalty.points_value ?? undefined }))
  }

  async getWinMethods(disciplineId: string): Promise<WinMethodRow[]> {
    const { data: links, error: linkError } = await this.supabase.from("discipline_fight_methods").select("method_id").eq("discipline_id", disciplineId).eq("is_active", true)
    if (linkError) throw normalizeBackendError(linkError)
    const ids = (links ?? []).map((link) => link.method_id)
    if (ids.length === 0) return []
    const { data, error } = await this.supabase.from("fight_methods").select("id, code, label").in("id", ids).eq("is_active", true)
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((method) => ({ id: method.id, code: method.code, name: method.label }))
  }

  async getCompleteRules(disciplineId: string) {
    const [scoringSystem, rules, actions, penalties, winMethods] = await Promise.all([this.getScoringSystem(disciplineId), this.getDisciplineRules(disciplineId), this.getScoringActions(disciplineId), this.getPenalties(disciplineId), this.getWinMethods(disciplineId)])
    return { scoringSystem, rules, actions, penalties, winMethods }
  }
}
