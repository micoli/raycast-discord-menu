import { showHUD } from "@raycast/api";
import { reinjectExecutor } from "./util";

export default async function Command() {
  try {
    await reinjectExecutor();
    await showHUD("Discord wrapper injected");
  } catch (error) {
    await showHUD(`Discord: ${error instanceof Error ? error.message : String(error)}`);
  }
}
