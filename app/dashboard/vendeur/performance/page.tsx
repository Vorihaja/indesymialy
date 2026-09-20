import {
  UniversalErpPrototype,
} from "@/modules/universal-erp/components/UniversalErpPrototype";

export default function SellerPerformancePage() {
  return (
    <UniversalErpPrototype
      role="seller"
      initialModule="performance"
    />
  );
}