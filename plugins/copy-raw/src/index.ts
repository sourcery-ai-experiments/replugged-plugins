import { Injector, Logger, common, settings, webpack } from "replugged";
import { Channel, Message } from "discord-types/general";

import { Icon } from "./CopyIcon";
import createModal from "./Modal";

const _ = Logger.plugin("Copy Raw");
const injector = new Injector();

export interface SettingsType {
  swap?: boolean;
}
export const cfg = await settings.init<SettingsType>("dev.kingfish.CopyRaw");
export { Settings } from "./Settings";

export async function start(): Promise<void> {
  const mod = await webpack.waitForModule(
    webpack.filters.bySource(
      'document.queryCommandEnabled("copy")||document.queryCommandSupported("copy")',
    ),
  ) as Record<string, unknown>;

  const Clipboard: {
    SUPPORTED: boolean;
    copy: (content: string) => unknown;
  } = {
    copy: Object.values(mod).find((e) => typeof e === "function") as (args: string) => void,
    SUPPORTED: Object.values(mod).find((e) => typeof e === "boolean") as unknown as boolean,
  };

  const classes: Record<string, string> = await webpack.waitForModule(
    webpack.filters.byProps("labelRow"),
  );

  function onClick(msg: Message) {
    return () => createModal(msg, Clipboard, classes);
  };

  function onContextMenu(msg: Message) {
    return () => {
      if (Clipboard.SUPPORTED) {
        Clipboard.copy(msg.content);
        common.toast.toast("Copied to clipboard!", common.toast.Kind.SUCCESS);
      } else {
        common.toast.toast(
          "Your browser does not support copying to clipboard",
          common.toast.Kind.FAILURE,
        );
      }
    }
  }

  injector.utils.addPopoverButton((msg: Message, _: Channel) => {
    return {
      key: "copyraw",
      label: cfg.get("swap") ? "Copy Raw(L) View Raw(R)" : "View Raw(L) Copy Raw(R)",
      icon: Icon,
      onClick: cfg.get("swap") ? onContextMenu(msg) : onClick(msg),
      onContextMenu: cfg.get("swap") ? onClick(msg) : onContextMenu(msg),
    };
  });
}

export function stop(): void {
  injector.uninjectAll();
}