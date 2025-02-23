import { Container } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import { CreatingTask, Header } from "./widgets";

function App() {
  return (
    <Container gutters="10">
      <Header />
      <CreatingTask />
      {/* <TranslatorContainer /> */}
    </Container>
  );
}

export default App;
