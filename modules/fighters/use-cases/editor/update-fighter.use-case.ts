import type { Fighter } from "@/modules/fighters/types";
import { makeFighterService } from "@/modules/fighters/services";



export interface UpdateFighterInput {

  fighterId: string;

  data: Partial<Fighter>;

}



export async function updateFighterUseCase(
  input: UpdateFighterInput,
): Promise<Fighter | null> {


  const service = makeFighterService();


  if (!input.fighterId) {

    throw new Error(
      "Fighter ID is required",
    );

  }


  return await service.updateFighter(

    input.fighterId,

    input.data,

  );

}