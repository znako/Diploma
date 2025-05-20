import { Container, Flex } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import { Header } from "./widgets/Header";
import { TaskCreator } from "./widgets/TaskCreator";
import { TaskSolution } from "./widgets/TaskSolution";

function App() {
  return (
    <Container gutters="10">
      <Header />
      <Flex gap={6}>
        <TaskCreator />
        <TaskSolution />
      </Flex>
    </Container>
  );
}

export default App;
