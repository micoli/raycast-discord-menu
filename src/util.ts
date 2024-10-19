import fetch from "node-fetch";
import WebSocket from "ws";
import { showToast, Toast } from "@raycast/api";

let websocket: WebSocket | null = null;

export async function debugWebsocketRequest(port: number, expression: string) {
  if (websocket === null) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list?t=123`);
      const windows: { webSocketDebuggerUrl: string }[] = (await response.json()) as { webSocketDebuggerUrl: string }[];
      websocket = new WebSocket(windows[0].webSocketDebuggerUrl);
    } catch (e) {
      try {
        await showToast({
          style: Toast.Style.Failure,
          title: "Connection refused, Is discord launched? is wrapper injected ?",
        });
      } catch (error) {
        console.log(error);
      }
      return;
    }
  }
  return new Promise((resolve) => {
    websocket!.on("error", console.error);
    websocket!.on("close", () => {
      console.log("closed");
      websocket = null;
    });

    websocket!.on("open", () => {
      console.log(expression);
      websocket!.send(inject(expression));
    });

    websocket!.on("message", (data: string) => {
      console.log(data.toString());
      resolve(data.toString());
    });
  });
}

// def is_script_injected(debugger_port: int, class_name: str):
// return evaluate_script(debugger_port, class_name)['result']['className'] != "ReferenceError"
//
//
// def inject_script(debugger_port: int):
// if is_script_injected(debugger_port, 'discordRemoteInjected'):
// logging.error('Script is already injected')
// return
// logging.info('Script will be injected')
// assets_full_path = get_assets_full_path('index.ts')
// if assets_full_path is None:
//   print("assets_full_path is null")
// return
// with open(assets_full_path, "r") as file:
// response = evaluate_script(debugger_port, file.read())
// print(json.dumps(response, indent=2))
//
//
// def discord_command(message):
// json_message = json.dumps(message._asdict())
// command = f'document.discordExecutor.run({json_message})'
// devtools_command(command)

function inject(expression: string) {
  return JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: {
      contextId: 1,
      doNotPauseOnExceptionsAndMuteConsole: false,
      expression: expression,
      generatePreview: false,
      returnByValue: false,
      objectGroup: "inject",
      includeCommandLineAPI: true,
      silent: true,
      userGesture: true,
      awaitPromise: true,
    },
  });
}
