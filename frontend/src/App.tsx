import { Container } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import { Header, Task } from "./widgets";

function App() {
  return (
    <Container gutters="10">
      <Header />
      <Task />
    </Container>
  );
}

export default App;
