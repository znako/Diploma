import { Text, TEXT_VARIANTS } from "@gravity-ui/uikit";
import styles from "./styles.module.css";

type TitleProps = {
  title: string;
  variant?: (typeof TEXT_VARIANTS)[number];
};

export const Title = ({ title, variant = "display-1" }: TitleProps) => {
  return (
    <Text variant={variant} className={styles.title}>
      {title}
    </Text>
  );
};
