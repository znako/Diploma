import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import { Container } from "@gravity-ui/uikit";
import { Header, DataEntry } from "./components";

function App() {
  return (
    <Container gutters="10">
      <Header />
      <DataEntry />
      {/* <TranslatorContainer /> */}
    </Container>
  );
}

export default App;
