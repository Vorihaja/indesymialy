import {
  AdminRepository
} from "../repositories";


import type {
  AdminDashboardData
} from "../types";





export class AdminService {





constructor(
 private readonly repository:AdminRepository
){}







async getDashboard()
:Promise<AdminDashboardData>{





const [

stats,

activities,

alerts

] = await Promise.all([


this.repository.getDashboardStats(),


this.repository.getRecentActivities(),


this.repository.getAlerts()


]);





return {

stats,

activities,

alerts

};





}







}