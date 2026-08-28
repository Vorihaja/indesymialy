import {
  AccountFeature,
} from "@/modules/identity-core/features/AccountFeature";


type SearchParams = {
  onboarding?:
    string |
    string[];
};


export default async function Page({
  searchParams,
}: {
  searchParams:
    Promise<SearchParams>;
}) {

  const params =
    await searchParams;


  const onboarding =
    Array.isArray(
      params.onboarding,
    )
      ? params.onboarding[0]
      : params.onboarding;


  return (
    <AccountFeature
      section="profile"
      onboardingMode={
        onboarding ===
        "1"
      }
    />
  );
}