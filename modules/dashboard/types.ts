export interface DashboardContextType {
  sidebarOpen:boolean;
  sidebarCollapsed:boolean;
  setSidebarOpen:(open:boolean)=>void;
  toggleSidebar:()=>void;
  setSidebarCollapsed:(collapsed:boolean)=>void;
  toggleCollapsed:()=>void;
}
