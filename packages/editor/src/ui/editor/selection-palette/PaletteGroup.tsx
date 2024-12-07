import type { FieldsetHTMLAttributes } from "react";

export const PaletteGroup = (props: FieldsetHTMLAttributes<HTMLFieldSetElement>) => {
  const { children, ...fieldsetProps } = props;
  return (
    <fieldset {...fieldsetProps} className="rounded border border-gray-600 bg-white/5 px-2 pb-1">
      {fieldsetProps.name && <legend className="px-1">{fieldsetProps.name}</legend>}
      <div className="flex flex-wrap gap-x-2 gap-y-2 py-2">{children}</div>
    </fieldset>
  );
};
