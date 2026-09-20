import {
  UniversalErpPrototype,
} from "@/modules/universal-erp/components/UniversalErpPrototype";

export default function SellerCustomersPage() {
  return (
    <UniversalErpPrototype
      role="seller"
      initialModule="customers"
    />
  );
}