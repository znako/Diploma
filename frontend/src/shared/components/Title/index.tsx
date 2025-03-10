import { Text } from "@gravity-ui/uikit";
import styles from "./styles.module.css";

export const Title = ({ title }: { title: string }) => {
  return (
    <Text variant="display-1" className={styles.title}>
      {title}
    </Text>
  );
};
