"use client";


import {
  useEffect,
  useState
} from "react";


import {
  getFeaturedEvent
} from "../services/events.service";


import type {
  Event
} from "../types/event.types";




export function useFeaturedEvent(){


  const [
    event,
    setEvent
  ] = useState<Event | null>(null);



  const [
    loading,
    setLoading
  ] = useState(true);




  useEffect(()=>{


    async function loadEvent(){


      const data =
        await getFeaturedEvent();



      setEvent(data);

      setLoading(false);


    }



    loadEvent();



  },[]);





  return {

    event,

    loading

  };


}