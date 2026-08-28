import { createClient } from "@supabase/supabase-js";

const url = process.env.SIM_SUPABASE_URL;
const anonKey = process.env.SIM_SUPABASE_ANON_KEY;
const serviceKey = process.env.SIM_SUPABASE_SERVICE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error("Variables de simulation Supabase manquantes.");

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
const password = "Erp-Simulation-" + stamp + "!";
const roles = ["federation", "league", "club", "coach", "fighter", "organizer", "referee", "judge", "sponsor", "seller", "fan"];
const users = roles.map((role) => ({
  email: "erp-" + role + "-" + stamp + "@example.com",
  role,
  name: "Simulation " + role,
}));
const createdUserIds = [];
const createdFighterIds = [];
let createdEventId = null;
let createdRefundId = null;

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const must = (result, label) => {
  if (result.error) throw new Error(label + ": " + result.error.message);
  return result.data;
};

try {
  const location = must(await admin.from("cities").select("id,region_id").not("region_id", "is", null).limit(1).single(), "localité de simulation");
  for (const user of users) {
    const data = must(await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: user.name,
        primary_role: user.role,
        region_id: location.region_id,
        city_id: location.id,
        profile_setup_pending: "false",
      },
    }), "création " + user.role);
    createdUserIds.push(data.user.id);
    user.id = data.user.id;
  }

  const clients = [];
  for (const user of users) {
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    must(await client.auth.signInWithPassword({ email: user.email, password }), "connexion " + user.role);
    clients.push(client);
    const authContext = must(await client.rpc("get_my_auth_context"), "contexte " + user.role);
    expect(authContext?.primaryRole === user.role, "Le rôle principal " + user.role + " n'a pas été conservé.");
  }

  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const client = clients[index];
    const inserted = must(await client.from("erp_workspace_records").insert({
      owner_profile_id: user.id,
      role_slug: user.role,
      module_id: "simulation",
      tab_id: "Parcours complet",
      title: "Simulation " + user.role,
      status: "todo",
      priority: "high",
    }).select("id,title,status").single(), "création registre " + user.role);

    const otherClient = clients[(index + 1) % clients.length];
    const invisible = must(await otherClient.from("erp_workspace_records").select("id").eq("id", inserted.id), "isolation registre " + user.role);
    expect(invisible.length === 0, "La règle RLS laisse un autre utilisateur lire le registre " + user.role + ".");

    const updated = must(await client.from("erp_workspace_records").update({ status: "completed", title: "Simulation terminée" }).eq("id", inserted.id).select("status,title").single(), "modification registre " + user.role);
    expect(updated.status === "completed", "La modification du registre " + user.role + " n'a pas été conservée.");

    must(await client.from("erp_workspace_records").delete().eq("id", inserted.id), "suppression registre " + user.role);
    const deleted = must(await client.from("erp_workspace_records").select("id").eq("id", inserted.id), "contrôle suppression " + user.role);
    expect(deleted.length === 0, "Le registre de simulation " + user.role + " existe encore après suppression.");
  }

  const organizerClient = clients[roles.indexOf("organizer")];
  const organizerUser = users[roles.indexOf("organizer")];
  const organizationId = must(await organizerClient.rpc("create_my_organization", {
    p_name: "Organisation simulation " + stamp,
    p_type: "organizer",
    p_description: "Organisation temporaire de simulation ERP",
    p_email: organizerUser.email,
    p_region_id: location.region_id,
    p_city_id: location.id,
  }), "création organisation organisateur");
  const event = must(await organizerClient.from("events").insert({
    organizer_id: organizationId,
    title: "Fight Center simulation " + stamp,
    status: "draft",
    visibility: "private",
  }).select("id").single(), "création événement Fight Center");
  createdEventId = event.id;

  const discipline = must(await admin.from("disciplines").select("id").eq("is_active", true).limit(1).single(), "discipline Fight Center");
  const fighterProfiles = [users[roles.indexOf("fighter")], users[roles.indexOf("coach")], users[roles.indexOf("club")]];
  for (let index = 0; index < fighterProfiles.length; index += 1) {
    const fighter = must(await admin.from("fighters").insert({
      profile_id: fighterProfiles[index].id,
      full_name: "Combattant simulation " + (index + 1),
      weight_class: "Lightweight",
      current_weight_kg: 70 + index,
      status: "active",
    }).select("id").single(), "création combattant " + (index + 1));
    createdFighterIds.push(fighter.id);
  }

  const card = must(await organizerClient.from("event_fight_cards").insert({
    event_id: event.id,
    position: 1,
    segment: "main_event",
    discipline_id: discipline.id,
    fighter_red_id: createdFighterIds[0],
    fighter_blue_id: createdFighterIds[1],
    status: "confirmed",
  }).select("id").single(), "création Fight Card");

  const fight = must(await organizerClient.from("fights").insert({
    event_id: event.id,
    discipline_id: discipline.id,
    fight_order: 1,
    fighter_red_id: createdFighterIds[0],
    fighter_blue_id: createdFighterIds[1],
    weight_category: "Lightweight",
    scheduled_rounds: 3,
    status: "scheduled",
  }).select("id").single(), "création combat");

  const weighIn = must(await organizerClient.from("weigh_ins").insert({
    event_id: event.id,
    fight_id: fight.id,
    fighter_id: createdFighterIds[0],
    measured_weight_kg: 70,
    compliance_status: "pending",
  }).select("id").single(), "création pesée");
  must(await organizerClient.from("weigh_ins").update({ compliance_status: "compliant", validated_by: organizerUser.id, validated_at: new Date().toISOString() }).eq("id", weighIn.id), "validation pesée");
  must(await organizerClient.from("weigh_in_history").insert({ weigh_in_id: weighIn.id, from_status: "pending", to_status: "compliant", measured_weight_kg: 70, changed_by: organizerUser.id }), "historique pesée");

  const replacement = must(await organizerClient.from("fight_replacements").insert({
    event_id: event.id,
    fight_id: fight.id,
    corner: "blue",
    previous_fighter_id: createdFighterIds[1],
    replacement_fighter_id: createdFighterIds[2],
    reason: "Simulation remplacement",
    status: "proposed",
    replaced_by: organizerUser.id,
  }).select("id").single(), "création remplacement");
  must(await organizerClient.from("fights").update({ fighter_blue_id: createdFighterIds[2], status: "ready" }).eq("id", fight.id), "application remplacement");
  must(await organizerClient.from("fight_replacements").update({ status: "confirmed" }).eq("id", replacement.id), "validation remplacement");

  must(await organizerClient.from("fights").update({ status: "completed", winner_id: createdFighterIds[0], method: "Decision", ending_round: 3 }).eq("id", fight.id), "résultat combat");
  const completedFight = must(await organizerClient.from("fights").select("status,winner_id,fighter_blue_id").eq("id", fight.id).single(), "contrôle résultat");
  expect(completedFight.status === "completed" && completedFight.winner_id === createdFighterIds[0] && completedFight.fighter_blue_id === createdFighterIds[2], "Le cycle Fight Center n'a pas été conservé.");
  expect(Boolean(card.id), "La Fight Card n'a pas été créée.");

  const ticketType = must(await organizerClient.from("ticket_types").insert({
    event_id: event.id,
    name: "Billet simulation",
    code: "SIM",
    category: "Standard",
    price: 10000,
    total_quantity: 5,
    max_per_order: 2,
    status: "active",
  }).select("id").single(), "création type de billet");
  const saleId = must(await organizerClient.rpc("record_event_ticket_sale", {
    p_ticket_type_id: ticketType.id,
    p_buyer_name: "Acheteur simulation",
    p_buyer_email: "buyer-" + stamp + "@example.com",
    p_buyer_phone: "",
    p_quantity: 2,
    p_payment_status: "paid",
  }), "vente de billets");
  const soldType = must(await organizerClient.from("ticket_types").select("sold_quantity").eq("id", ticketType.id).single(), "quota après vente");
  expect(soldType.sold_quantity === 2, "La quantité vendue n'a pas été mise à jour.");
  const issuedTickets = must(await organizerClient.from("tickets").select("id").eq("event_id", event.id), "billets émis");
  expect(issuedTickets.length === 2, "La vente n'a pas émis les deux billets individuels.");
  const firstAccess = must(await organizerClient.rpc("record_event_ticket_access", { p_ticket_id: issuedTickets[0].id, p_result: "accepted", p_manual: false }), "premier contrôle d'accès");
  const duplicateAccess = must(await organizerClient.rpc("record_event_ticket_access", { p_ticket_id: issuedTickets[0].id, p_result: "accepted", p_manual: false }), "second contrôle d'accès");
  expect(firstAccess === "accepted" && duplicateAccess === "duplicate", "Le contrôle d'accès ne détecte pas le doublon.");

  const invitation = must(await organizerClient.from("event_invitations").insert({
    event_id: event.id,
    invitation_type: "vip",
    mention: "Invité simulation",
    role: "guest",
    status: "sent",
    sent_by: organizerUser.id,
  }).select("id").single(), "création invitation");
  must(await organizerClient.from("event_invitations").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", invitation.id), "acceptation invitation");

  const refund = must(await organizerClient.from("ticket_refunds").insert({
    ticket_sale_id: saleId,
    amount: 20000,
    reason: "Simulation remboursement",
    status: "requested",
    requested_by: organizerUser.id,
  }).select("id").single(), "demande remboursement");
  createdRefundId = refund.id;
  must(await organizerClient.rpc("review_event_ticket_refund", {
    p_refund_id: refund.id,
    p_status: "processed",
    p_processed_amount: 20000,
    p_external_reference: "SIM-" + stamp,
  }), "traitement remboursement");
  const refundedSale = must(await organizerClient.from("ticket_sales").select("payment_status").eq("id", saleId).single(), "vente remboursée");
  const refundedType = must(await organizerClient.from("ticket_types").select("sold_quantity").eq("id", ticketType.id).single(), "quota après remboursement");
  expect(refundedSale.payment_status === "refunded" && refundedType.sold_quantity === 0, "Le remboursement n'a pas restauré le quota.");

  const refereeUser = users[roles.indexOf("referee")];
  const judgeUser = users[roles.indexOf("judge")];
  must(await organizerClient.from("official_availability").insert([
    { event_id: event.id, official_profile_id: refereeUser.id, availability_status: "available", responded_at: new Date().toISOString() },
    { event_id: event.id, official_profile_id: judgeUser.id, availability_status: "unavailable", responded_at: new Date().toISOString() },
  ]), "disponibilités officielles");
  const eventOfficial = must(await organizerClient.from("event_official_assignments").insert({
    event_id: event.id,
    profile_id: refereeUser.id,
    role: "referee",
    status: "confirmed",
  }).select("id").single(), "officiel événement");
  const fightOfficialId = must(await organizerClient.rpc("assign_event_official_to_fight", {
    p_fight_id: fight.id,
    p_user_id: refereeUser.id,
    p_role: "referee",
    p_position: 1,
  }), "affectation arbitre disponible");
  const refusedAssignment = await organizerClient.rpc("assign_event_official_to_fight", {
    p_fight_id: fight.id,
    p_user_id: judgeUser.id,
    p_role: "judge",
    p_position: 1,
  });
  expect(Boolean(refusedAssignment.error), "Un officiel indisponible a été affecté au combat.");

  const staff = must(await organizerClient.from("staff_assignments").insert({
    event_id: event.id,
    profile_id: users[roles.indexOf("fan")].id,
    staff_name: "Bénévole simulation",
    role: "volunteer",
    zone: "Entrée A",
    status: "confirmed",
    availability_status: "available",
    confirmed_at: new Date().toISOString(),
  }).select("id").single(), "affectation bénévole");
  must(await organizerClient.from("staff_checkins").insert({
    staff_assignment_id: staff.id,
    action: "check_in",
    zone: "Entrée A",
    recorded_by: organizerUser.id,
  }), "pointage bénévole");

  const accreditation = must(await organizerClient.from("event_accreditations").insert({
    event_id: event.id,
    profile_id: refereeUser.id,
    official_assignment_id: eventOfficial.id,
    holder_name: "Arbitre simulation",
    badge_code: "ACC-" + stamp,
    accreditation_type: "official",
    access_zones: ["ring", "officials"],
    status: "issued",
    issued_by: organizerUser.id,
    issued_at: new Date().toISOString(),
  }).select("id").single(), "émission accréditation");
  must(await organizerClient.from("event_accreditations").update({ status: "active" }).eq("id", accreditation.id), "activation accréditation");
  const activeAccreditation = must(await organizerClient.from("event_accreditations").select("status,access_zones").eq("id", accreditation.id).single(), "contrôle accréditation");
  expect(activeAccreditation.status === "active" && activeAccreditation.access_zones.includes("ring") && Boolean(fightOfficialId), "Le workflow Équipe & Officiels n'a pas été conservé.");

  const logistics = must(await organizerClient.from("event_operation_records").insert({
    event_id: event.id,
    domain: "logistics",
    title: "Installation du matériel",
    category: "equipment",
    severity: "high",
    status: "draft",
    owner_profile_id: organizerUser.id,
    due_at: new Date(Date.now() + 86400000).toISOString(),
    visibility: "team",
    created_by: organizerUser.id,
  }).select("id").single(), "création opération logistique");
  must(await organizerClient.rpc("transition_event_operation", { p_operation_id: logistics.id, p_status: "planned", p_note: "Plan validé" }), "planification opération");
  must(await organizerClient.rpc("transition_event_operation", { p_operation_id: logistics.id, p_status: "in_progress", p_note: "Installation démarrée" }), "démarrage opération");
  const missingResolution = await organizerClient.rpc("transition_event_operation", { p_operation_id: logistics.id, p_status: "resolved", p_note: "" });
  expect(Boolean(missingResolution.error), "Une opération a été résolue sans compte rendu.");
  must(await organizerClient.rpc("transition_event_operation", { p_operation_id: logistics.id, p_status: "resolved", p_note: "Matériel installé et contrôlé" }), "résolution opération");
  must(await organizerClient.rpc("transition_event_operation", { p_operation_id: logistics.id, p_status: "closed", p_note: "Validation finale" }), "clôture opération");

  const incident = must(await organizerClient.from("event_operation_records").insert({
    event_id: event.id,
    domain: "incident",
    title: "Incident de simulation",
    category: "security",
    severity: "critical",
    status: "draft",
    visibility: "internal",
    created_by: organizerUser.id,
  }).select("id").single(), "signalement incident");
  must(await organizerClient.rpc("transition_event_operation", { p_operation_id: incident.id, p_status: "planned", p_note: "Incident qualifié" }), "qualification incident");
  const invalidTransition = await organizerClient.rpc("transition_event_operation", { p_operation_id: incident.id, p_status: "closed", p_note: "Clôture prématurée" });
  expect(Boolean(invalidTransition.error), "Une transition opérationnelle interdite a été acceptée.");

  const fanClient = clients[roles.indexOf("fan")];
  const hiddenOperations = must(await fanClient.from("event_operation_records").select("id").in("id", [logistics.id, incident.id]), "isolation RLS opérations");
  expect(hiddenOperations.length === 0, "Un utilisateur non autorisé peut lire les opérations internes.");
  const operationHistory = must(await organizerClient.from("event_operation_history").select("to_status").eq("operation_id", logistics.id).order("created_at"), "historique opération");
  expect(operationHistory.map((item) => item.to_status).join(",") === "planned,in_progress,resolved,closed", "L'historique du workflow Opérations est incomplet.");

  const sponsor = must(await organizerClient.from("sponsors").insert({
    name: "Sponsor simulation " + stamp,
    contact_name: "Contact sponsor",
    contact_email: "sponsor-contact-" + stamp + "@example.com",
    tier: "gold",
    is_active: true,
    managing_organization_id: organizationId,
    created_by: organizerUser.id,
  }).select("id").single(), "création partenaire");
  const pipeline = must(await organizerClient.from("sponsor_pipeline").insert({
    organization_id: organizationId,
    event_id: event.id,
    sponsor_id: sponsor.id,
    stage: "lead",
    estimated_value: 5000000,
    probability_percent: 10,
    owner_profile_id: organizerUser.id,
    created_by: organizerUser.id,
  }).select("id").single(), "création opportunité sponsor");
  for (const stage of ["contacted", "qualified", "proposal", "negotiation", "won"]) {
    must(await organizerClient.rpc("transition_sponsor_pipeline", {
      p_pipeline_id: pipeline.id,
      p_stage: stage,
      p_note: "Transition " + stage,
    }), "transition pipeline " + stage);
  }
  const eventSponsor = must(await organizerClient.from("event_sponsors").select("id,status,amount").eq("event_id", event.id).eq("sponsor_id", sponsor.id).single(), "conversion sponsor événement");
  expect(eventSponsor.status === "contracted" && Number(eventSponsor.amount) === 5000000, "L'opportunité gagnée n'a pas été convertie en sponsor d'événement.");

  const sponsorPackage = must(await organizerClient.from("sponsor_packages").insert({
    organization_id: organizationId,
    event_id: event.id,
    name: "Package Gold simulation",
    price: 5000000,
    capacity: 1,
    benefits: "Ring, digital et hospitalité",
    status: "published",
    created_by: organizerUser.id,
  }).select("id").single(), "création package sponsor");
  const sponsorContract = must(await organizerClient.from("sponsor_contracts").insert({
    event_sponsor_id: eventSponsor.id,
    package_id: sponsorPackage.id,
    reference: "CTR-" + stamp,
    title: "Partenariat Gold",
    amount: 5000000,
    starts_on: new Date().toISOString().slice(0, 10),
    ends_on: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: "draft",
    payment_status: "pending",
    document_path: "contracts/" + stamp + ".pdf",
    created_by: organizerUser.id,
  }).select("id").single(), "création contrat sponsor");
  must(await organizerClient.rpc("transition_sponsor_contract", { p_contract_id: sponsorContract.id, p_status: "sent", p_note: "Contrat envoyé" }), "envoi contrat");
  must(await organizerClient.rpc("transition_sponsor_contract", { p_contract_id: sponsorContract.id, p_status: "signed", p_note: "Contrat signé" }), "signature contrat");
  must(await organizerClient.rpc("transition_sponsor_contract", { p_contract_id: sponsorContract.id, p_status: "active", p_note: "Activation du partenariat" }), "activation contrat");
  const allocatedPackage = must(await organizerClient.from("sponsor_packages").select("allocated_count").eq("id", sponsorPackage.id).single(), "capacité package");
  expect(allocatedPackage.allocated_count === 1, "La signature n'a pas réservé la capacité du package.");

  must(await organizerClient.from("sponsor_visibility_items").insert({
    event_sponsor_id: eventSponsor.id,
    channel: "ring",
    placement: "Bâche principale",
    target_impressions: 10000,
    actual_impressions: 12500,
    status: "completed",
    evidence_path: "visibility/" + stamp + ".jpg",
    created_by: organizerUser.id,
  }), "mesure visibilité sponsor");
  must(await organizerClient.from("sponsor_activations").insert({
    event_sponsor_id: eventSponsor.id,
    title: "Stand sponsor",
    activation_type: "booth",
    target_contacts: 500,
    actual_contacts: 620,
    status: "completed",
    evidence_path: "activations/" + stamp + ".jpg",
    owner_profile_id: organizerUser.id,
    created_by: organizerUser.id,
  }), "activation sponsor");
  const deliverable = must(await organizerClient.from("event_sponsor_deliverables").insert({
    event_sponsor_id: eventSponsor.id,
    title: "Logo sur le ring",
    due_at: new Date(Date.now() + 86400000).toISOString(),
    status: "todo",
    evidence_path: "deliverables/" + stamp + ".jpg",
  }).select("id").single(), "création livrable sponsor");
  must(await organizerClient.rpc("transition_sponsor_deliverable", { p_deliverable_id: deliverable.id, p_status: "in_progress", p_note: "Pose en cours" }), "démarrage livrable");
  must(await organizerClient.rpc("transition_sponsor_deliverable", { p_deliverable_id: deliverable.id, p_status: "delivered", p_note: "Pose terminée" }), "livraison livrable");
  must(await organizerClient.rpc("transition_sponsor_deliverable", { p_deliverable_id: deliverable.id, p_status: "validated", p_note: "Livrable validé" }), "validation livrable");

  const pipelineHistory = must(await organizerClient.from("sponsor_pipeline_history").select("to_stage").eq("pipeline_id", pipeline.id), "historique pipeline sponsor");
  const contractHistory = must(await organizerClient.from("sponsor_contract_history").select("to_status").eq("contract_id", sponsorContract.id), "historique contrat sponsor");
  expect(pipelineHistory.length === 5 && contractHistory.length === 3, "Les historiques du partenariat sont incomplets.");
  const hiddenSponsorContract = must(await fanClient.from("sponsor_contracts").select("id").eq("id", sponsorContract.id), "isolation contrat sponsor");
  expect(hiddenSponsorContract.length === 0, "Un fan peut lire un contrat sponsor confidentiel.");

  console.log(JSON.stringify({
    roles,
    authentication: "ok",
    primaryRoles: "ok",
    create: "ok",
    update: "ok",
    delete: "ok",
    rlsIsolation: "ok",
    fightCenter: "ok",
    ticketing: "ok",
    teamAndOfficials: "ok",
    operations: "ok",
    partnersAndSponsors: "ok",
  }));
} finally {
  if (createdRefundId) await admin.from("ticket_refunds").delete().eq("id", createdRefundId);
  if (createdEventId) await admin.from("events").delete().eq("id", createdEventId);
  if (createdFighterIds.length) await admin.from("fighters").delete().in("id", createdFighterIds);
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id);
  }
}
