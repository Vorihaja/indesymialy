import {
  supabase
} from "@/lib/supabase";


import type {
  AdminActivity,
  AdminAlert,
  AdminDashboardStats
} from "../types";





export class AdminRepository {





async getDashboardStats()
:Promise<AdminDashboardStats>{





const [
users,
fighters,
clubs,
events,
articles,
products
] = await Promise.all([


supabase
.from("profiles")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("fighters")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("clubs")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("events")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("articles")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("products")
.select(
"id",
{
count:"exact",
head:true
}
)


]);






return {

totalUsers:
users.count ?? 0,


totalFighters:
fighters.count ?? 0,


totalClubs:
clubs.count ?? 0,


totalEvents:
events.count ?? 0,


totalArticles:
articles.count ?? 0,


totalProducts:
products.count ?? 0,


activeUsersToday:0,


pendingRequests:0


};

}





async getRecentActivities()
:Promise<AdminActivity[]>{


return [];

}





async getAlerts()
:Promise<AdminAlert[]>{


return [];

}





}