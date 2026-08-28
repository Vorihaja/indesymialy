import{CmsFeature}from"@/modules/cms";export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <CmsFeature view="admin" detailId={id}/>;}
