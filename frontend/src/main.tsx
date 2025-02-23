import { ThemeProvider } from "@gravity-ui/uikit";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./configs/store/store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <div className="g-root">
    <Provider store={store}>
      <ThemeProvider theme="dark">
        {/* <ToasterProvider> */}
        <App />
        {/* <ToasterComponent /> */}
        {/* </ToasterProvider> */}
      </ThemeProvider>
    </Provider>
  </div>
);
