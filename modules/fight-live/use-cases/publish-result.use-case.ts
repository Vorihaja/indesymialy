import { FightResultService } from "../services/fight-result.service"



export interface PublishResultInput {


  fightId: string


  approvedBy?: string



}







export class PublishResultUseCase {



  constructor(

    private readonly fightResultService:
      FightResultService

  ) {}







  async execute(

    input: PublishResultInput

  ) {



    if (!input.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }







    if (input.approvedBy) {


      return await this.fightResultService

        .approveAndPublish({

          fightId:

            input.fightId,


          approvedBy:

            input.approvedBy

        })


    }







    return await this.fightResultService

      .publishFightResult({

        fightId:

          input.fightId

      })



  }



}