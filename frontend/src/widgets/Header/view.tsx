import { Text } from "@gravity-ui/uikit";
import styles from "./styles.module.css";

export const Header = () => {
  return (
    <div className={styles.header}>
      <Text variant="display-2">Решатель MILP</Text>
    </div>
  );
};
