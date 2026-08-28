import { FightOfficialRepository } from "../repositories/fight-official.repository"


export class FightOfficialService {

  constructor(
    private readonly officialRepository: FightOfficialRepository
  ) {}



  /**
   * Enregistrer une action officielle
   */
  async recordOfficialAction(params: {
    fightId: string
    roundId: string
    fighterId: string
    actionTypeId: string
    recordedBy?: string
    notes?: string
  }) {

    if (!params.fightId) {
      throw new Error("Fight ID obligatoire")
    }

    if (!params.roundId) {
      throw new Error("Round ID obligatoire")
    }

    if (!params.actionTypeId) {
      throw new Error("Type d'action obligatoire")
    }


    return await this.officialRepository.recordOfficialAction(
      params
    )

  }



  /**
   * Récupérer les officiels d'un combat
   */
  async getOfficials(
    fightId: string
  ) {

    if (!fightId) {
      throw new Error("Fight ID obligatoire")
    }


    return await this.officialRepository.getOfficials(
      fightId
    )

  }

}