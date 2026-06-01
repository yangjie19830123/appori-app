import { redirect } from "next/navigation";

export default function WSIRoot() {
  // Default to Japanese; users can switch to /en via the toggle in TopNav
  // /wsi/cn route is still accessible via direct URL but hidden from UI switcher
  redirect("/wsi/ja");
}
