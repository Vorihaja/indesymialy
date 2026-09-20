import type {
  ErpRecord,
  ErpRecordInput,
} from "../types";

/*
 * INDESY CRUD FALLBACK P0
 *
 * L'ancien stockage Map etait volatil, non scope par utilisateur
 * et ne representait aucune autorite metier. Le contrat reste
 * temporairement present pour compatibilite de compilation, mais
 * toutes ses operations sont volontairement desactivees.
 */
export class ErpRepository {
  constructor(
    private readonly namespace: string,
  ) {}

  private disabledError(): Error {
    return new Error(
      `Le registre ERP generique "${this.namespace}" est desactive. Utilisez le module metier canonique.`,
    );
  }

  list(): Promise<ErpRecord[]> {
    return Promise.reject(this.disabledError());
  }

  findById(
    _id: string,
  ): Promise<ErpRecord | null> {
    return Promise.reject(this.disabledError());
  }

  create(
    _input: ErpRecordInput,
  ): Promise<ErpRecord> {
    return Promise.reject(this.disabledError());
  }

  update(
    _id: string,
    _input: ErpRecordInput,
  ): Promise<ErpRecord> {
    return Promise.reject(this.disabledError());
  }

  delete(
    _id: string,
  ): Promise<void> {
    return Promise.reject(this.disabledError());
  }
}