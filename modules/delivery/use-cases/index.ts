import{DeliveryService}from"../services";export class ListDeliveriesUseCase{constructor(private readonly service:DeliveryService){}execute(){return this.service.list()}}
