import {
  redirect,
} from "next/navigation";

export default function LegacyNewMessagePage() {
  redirect("/korana/messages/new");
}