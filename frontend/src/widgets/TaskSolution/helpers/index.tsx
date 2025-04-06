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

export const getFormattedSolveDuration = (solveDuration: number) => {
  console.log(solveDuration);
  const date = new Date(solveDuration);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};
