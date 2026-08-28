import{DeliveryRepository}from"../repositories";export class DeliveryService{constructor(private readonly repository:DeliveryRepository){}list(){return this.repository.list()}}
