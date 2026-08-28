import {
  AdminService
} from "../services";


import type {
  AdminDashboardData
} from "../types";





export class GetAdminDashboardUseCase {





constructor(
 private readonly service:AdminService
){}







async execute()
:Promise<AdminDashboardData>{


return this.service.getDashboard();


}



}