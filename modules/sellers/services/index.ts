import { ErpService } from "@/modules/erp-core"; import { SellerRepository } from "../repositories"; export class SellerService extends ErpService { constructor() { super(new SellerRepository()); } }
