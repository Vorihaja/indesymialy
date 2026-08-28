import {
  redirect,
} from "next/navigation";


export default function Page() {

  redirect(
    "/account/profile?onboarding=1",
  );
}