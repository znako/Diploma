import { CircleQuestion } from "@gravity-ui/icons";
import { Flex, Icon, Table, Tooltip } from "@gravity-ui/uikit";
import { getTemplateColumn } from "../../helpers";
import { Sensitivity } from "../../types";
import styles from "./styles.module.css";

type SensitivityTableProps = {
  sensitivity: Sensitivity;
  maximumFractionDigits: number;
};

const ICON_SIZE = 16;

export const SensitivityTable = ({
  sensitivity,
  maximumFractionDigits,
}: SensitivityTableProps) => {
  const columns: Array<{
    id: keyof Sensitivity[0];
    name: string | (() => JSX.Element);
    template?: (
      item: Record<keyof Sensitivity[0], string>,
      index: number
    ) => React.ReactNode;
  }> = [
    { id: "name", name: "Название" },
    {
      id: "value",
      name: () => (
        <Flex alignItems="center" gap={1}>
          Значение
          <Tooltip content="Значение ограничения при оптимальных значениях">
            <Icon
              className={styles.icon}
              data={CircleQuestion}
              size={ICON_SIZE}
            />
          </Tooltip>
        </Flex>
      ),
      template: getTemplateColumn({
        columnName: "value",
        maximumFractionDigits,
      }),
    },
    {
      id: "lslack",
      name: () => (
        <Flex alignItems="center" gap={1}>
          lslack
          <Tooltip content="Если ограничение записано, например, в виде f(x) ≥ L, то lslack показывает, насколько f(x) больше L.">
            <Icon
              className={styles.icon}
              data={CircleQuestion}
              size={ICON_SIZE}
            />
          </Tooltip>
        </Flex>
      ),
      template: getTemplateColumn({
        columnName: "lslack",
        maximumFractionDigits,
      }),
    },
    {
      id: "uslack",
      name: () => (
        <Flex alignItems="center" gap={1}>
          uslack
          <Tooltip content="Если ограничение записано, например, в виде f(x) ≤ L, то uslack показывает, насколько f(x) меньше L.">
            <Icon
              className={styles.icon}
              data={CircleQuestion}
              size={ICON_SIZE}
            />
          </Tooltip>
        </Flex>
      ),
      template: getTemplateColumn({
        columnName: "uslack",
        maximumFractionDigits,
      }),
    },
    {
      id: "dual",
      name: () => (
        <Flex alignItems="center" gap={1}>
          dual
          <Tooltip content="На сколько изменится значение искомой функции, если изменить значение ограничения на единицу">
            <Icon
              className={styles.icon}
              data={CircleQuestion}
              size={ICON_SIZE}
            />
          </Tooltip>
        </Flex>
      ),
      template: getTemplateColumn({
        columnName: "dual",
        maximumFractionDigits,
      }),
    },
  ];

  return <Table data={sensitivity} columns={columns} />;
};
