import {
  ThemeProvider,
  ToasterComponent,
  ToasterProvider,
} from "@gravity-ui/uikit";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./configs/store";
import "./index.css";
import { toaster } from "./shared/components/Toaster";

createRoot(document.getElementById("root")!).render(
  <div className="g-root">
    <Provider store={store}>
      <ThemeProvider theme="light">
        <ToasterProvider toaster={toaster}>
          <App />
          <ToasterComponent />
        </ToasterProvider>
      </ThemeProvider>
    </Provider>
  </div>
);
