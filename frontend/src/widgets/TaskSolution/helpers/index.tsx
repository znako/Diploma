import { Sensitivity } from "../types";

type GetTemplateColumnProps = {
  columnName: keyof Sensitivity[0];
  maximumFractionDigits: number;
};

export const getTemplateColumn =
  ({ columnName, maximumFractionDigits }: GetTemplateColumnProps) =>
  (item: Record<keyof Sensitivity[0], string>) =>
    (
      <>
        {parseFloat(item[columnName])
          ? parseFloat(item[columnName]).toLocaleString(undefined, {
              maximumFractionDigits: Number(maximumFractionDigits),
            })
          : item[columnName]}
      </>
    );
