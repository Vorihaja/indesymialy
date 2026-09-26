export type KoranaProposalRequestKind =
  | "fight"
  | "sponsor";

export type KoranaRequestSource = {
  id:
    | "fight-proposals"
    | "sponsor-offers";
  authority:
    | "fight_proposals"
    | "sponsor_offers";
  category: string;
  title: string;
  description: string;
  kind: KoranaProposalRequestKind;
};

export const KORANA_REQUEST_SOURCES:
  readonly KoranaRequestSource[] = [
    {
      id: "fight-proposals",
      authority: "fight_proposals",
      category: "Combat",
      title: "Propositions de combat",
      description:
        "Examiner, accepter, refuser ou contre-proposer.",
      kind: "fight",
    },
    {
      id: "sponsor-offers",
      authority: "sponsor_offers",
      category: "Partenariat",
      title: "Offres de sponsoring",
      description:
        "Examiner les propositions de partenariat qui vous concernent.",
      kind: "sponsor",
    },
  ];