import {
  UniversalErpPrototype,
} from "@/modules/universal-erp/components/UniversalErpPrototype";

export default function SellerPersonnelPage() {
  return (
    <UniversalErpPrototype
      role="seller"
      initialModule="personnel"
    />
  );
}