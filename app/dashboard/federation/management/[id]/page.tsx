import { redirect } from "next/navigation";

/*
 * INDESY CRUD FALLBACK P0
 *
 * L'ancien CRUD management generique est retire.
 * Cette route historique conduit vers le module canonique.
 */
export default function Page() {
  redirect("/dashboard/federation");
}