import { createClient } from "@/lib/client"



export class Container {


private static instance: Container



private constructor(){}



static getInstance(){


if(!Container.instance){

Container.instance = new Container()

}


return Container.instance


}



supabase(){


return createClient()


}


}