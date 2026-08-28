import{SupportFeature}from"@/modules/support";export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <SupportFeature view="detail" detailId={id}/>;}
