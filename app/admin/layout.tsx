import {
  ReactNode
} from "react";


import {
  AdminGuard
} from "@/components/auth";


import {
  AdminShell
} from "@/modules/admin";





export default function AdminLayout({

children

}:{

children:ReactNode;

}){


return (

<AdminGuard>

<AdminShell>

{children}

</AdminShell>

</AdminGuard>

);


}