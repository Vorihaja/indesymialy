import { FighterRepository } from "@/modules/fighters/repositories/fighter.repository";

import type {
  Fighter,
  FighterDashboardData,
  FighterStats,
  FighterRecord,
} from "@/modules/fighters/types";


export class FighterService {

  constructor(
    private readonly repository: FighterRepository =
      new FighterRepository()
  ) {}



  async getFighters(): Promise<Fighter[]> {

    return this.repository.getAll();

  }



  async getFighterById(
    id: string
  ): Promise<Fighter | null> {

    return this.repository.getById(id);

  }



  async getProfileByUserId(
    userId: string
  ): Promise<Fighter | null> {

    return this.repository.getByUserId(userId);

  }



  async getStats(
    fighterId: string
  ): Promise<FighterStats> {

    return this.repository.getStats(fighterId);

  }



  async getRecords(
    fighterId: string
  ): Promise<FighterRecord[]> {

    return this.repository.getRecords(fighterId);

  }



  async getDashboardData(
    userId: string
  ): Promise<FighterDashboardData | null> {


    const fighter =
      await this.repository.getByUserId(userId);



    if (!fighter) {

      return null;

    }



    const [
      stats,
      nextFight,
    ] = await Promise.all([

      this.repository.getStats(fighter.id),

      this.repository.getNextFight(fighter.id),

    ]);



    const [
      contractsCount,
      sponsorsCount,
      documentsCount,
    ] = await Promise.all([

      this.repository.countContracts(fighter.id),

      this.repository.countSponsors(fighter.id),

      this.repository.countDocuments(fighter.id),

    ]);



    return {

      fighter,

      stats,

      nextFight,

      contractsCount,

      sponsorsCount,

      documentsCount,

    };

  }




  /**
   * Mise à jour ancienne conservée
   */
  async updateProfile(
    fighterId: string,
    updates: Partial<Fighter>
  ): Promise<Fighter | null> {


    return this.repository.updateProfile(

      fighterId,

      updates

    );

  }




  /**
   * Mise à jour standard utilisée par FighterEditor
   */
  async updateFighter(
    fighterId: string,
    updates: Partial<Fighter>
  ): Promise<Fighter | null> {


    return this.repository.updateProfile(

      fighterId,

      updates

    );

  }




  /**
   * Création d'un combattant
   * utilisée par FighterRegistration
   */
  async createFighter(
    data: Partial<Fighter>
  ): Promise<Fighter | null> {


    return this.repository.create(

      data

    );

  }


}



export function makeFighterService() {

  return new FighterService();

}