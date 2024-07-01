import { NoteSettingsForm } from "./NoteSettingsForm";

export const SelectionPalette = (_props: Record<string, never>) => {
  return (
    <div className="palette flex h-full w-full min-w-24 flex-col gap-4 p-4 text-sm">
      <NoteSettingsForm />
    </div>
  );
};
