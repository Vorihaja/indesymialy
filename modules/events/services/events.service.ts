import{createEventPlatformUseCase}from"@/modules/event-core/factories/event-platform.factory";
import type{Event}from"../types/event.types";
export async function getFeaturedEvent():Promise<Event|null>{const snapshot=await createEventPlatformUseCase().execute();const event=snapshot.events.filter(item=>item.status==="published"&&item.visibility==="public").sort((a,b)=>a.startsAt.localeCompare(b.startsAt))[0];return event?{id:event.id,title:event.title,event_date:event.startsAt,location:event.venue,status:event.status}:null;}
