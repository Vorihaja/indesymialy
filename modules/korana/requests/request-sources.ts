type KoranaProposalRequestSource = {
  id: "fight-proposals" | "sponsor-offers";
  authority: "fight_proposals" | "sponsor_offers";
  category: string;
  title: string;
  description: string;
  actionModel: "accept-refuse-counter";
  renderStrategy: "proposal";
  kind: "fight" | "sponsor";
};

type KoranaOfficialAssignmentRequestSource = {
  id: "official-assignments";
  authority: "event_official_assignments+fight_official_assignments";
  category: string;
  title: string;
  description: string;
  actionModel: "confirm-decline";
  renderStrategy: "official-assignments";
};

type KoranaEventCoorganizationRequestSource = {
  id: "event-coorganization";
  authority: "event_coorganizers";
  category: string;
  title: string;
  description: string;
  actionModel: "accept-decline";
  renderStrategy: "event-coorganization";
};
export type KoranaRequestSource =
  | KoranaProposalRequestSource
  | KoranaOfficialAssignmentRequestSource
  | KoranaEventCoorganizationRequestSource;

export const KORANA_REQUEST_SOURCES:
  readonly KoranaRequestSource[] = [
    {
      id: "fight-proposals",
      authority: "fight_proposals",
      category: "Combat",
      title: "Propositions de combat",
      description:
        "Examiner, accepter, refuser ou contre-proposer.",
      actionModel: "accept-refuse-counter",
      renderStrategy: "proposal",
      kind: "fight",
    },
    {
      id: "sponsor-offers",
      authority: "sponsor_offers",
      category: "Partenariat",
      title: "Offres de sponsoring",
      description:
        "Examiner les propositions de partenariat qui vous concernent.",
      actionModel: "accept-refuse-counter",
      renderStrategy: "proposal",
      kind: "sponsor",
    },
    {
      id: "official-assignments",
      authority: "event_official_assignments+fight_official_assignments",
      category: "Officiel",
      title: "Désignations officielles",
      description:
        "Confirmer ou refuser les désignations qui vous sont adressées.",
      actionModel: "confirm-decline",
      renderStrategy: "official-assignments",
    },
    {
      id: "event-coorganization",
      authority: "event_coorganizers",
      category: "Événement",
      title: "Coorganisations",
      description:
        "Accepter ou refuser les invitations à coorganiser un événement.",
      actionModel: "accept-decline",
      renderStrategy: "event-coorganization",
    },
  ];