import { TamaguiProvider } from "tamagui"
import { createRoot } from "react-dom/client"
import tamaguiConfig from "../tamagui.config"
import App from "./App"
import "./tamagui.css"

createRoot(document.getElementById("root")!).render(
  <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
    <App />
  </TamaguiProvider>,
)
