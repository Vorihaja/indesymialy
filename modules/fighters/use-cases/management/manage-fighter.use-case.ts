import { FighterService } from "@/modules/fighters/services/fighters.service";
import type { Fighter } from "@/modules/fighters/types";


export type FighterManagementAction =
  | "activate"
  | "suspend"
  | "deactivate";



export interface ManageFighterInput {

  fighterId: string;

  action: FighterManagementAction;

}



export class ManageFighterUseCase {


  constructor(
    private readonly service: FighterService
  ) {}



  async execute(
    input: ManageFighterInput
  ): Promise<Fighter | null> {


    const statusMap: Record<
      FighterManagementAction,
      Fighter["status"]
    > = {


      activate: "active",


      suspend: "suspended",


      deactivate: "inactive",


    };



    return this.service.updateProfile(
      input.fighterId,
      {
        status:
          statusMap[input.action],
      }
    );


  }


}