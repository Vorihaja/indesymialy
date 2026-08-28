import { FightEventRepository } from "../repositories/fight-event.repository"



export interface RegisterFightEventInput {

  fightId: string

  eventType: string

  eventCode: string

  roundNumber?: number

  fighterId?: string

  recordedBy?: string

  payload?: Record<string, unknown>

  source?: string

  operationMode?: string

}







export class RegisterFightEventUseCase {



  constructor(

    private readonly fightEventRepository:
      FightEventRepository

  ) {}







  async execute(

    input: RegisterFightEventInput

  ) {



    if (!input.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }





    if (!input.eventType) {

      throw new Error(
        "Type événement obligatoire"
      )

    }





    if (!input.eventCode) {

      throw new Error(
        "Code événement obligatoire"
      )

    }







    return await this.fightEventRepository

      .registerFightEvent({

        fightId:

          input.fightId,


        eventType:

          input.eventType,


        eventCode:

          input.eventCode,


        roundNumber:

          input.roundNumber,


        fighterId:

          input.fighterId,


        recordedBy:

          input.recordedBy,


        payload:

          input.payload,


        source:

          input.source,


        operationMode:

          input.operationMode

      })



  }



}