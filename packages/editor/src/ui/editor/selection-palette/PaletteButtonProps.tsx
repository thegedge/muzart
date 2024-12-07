import type { HTMLAttributes } from "react";
import type { Command } from "../../../state/Application";

export type PaletteButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "command" | "onClick"> & {
  active?: boolean;
  command: Command;
};
