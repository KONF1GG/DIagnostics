import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { DataProviderCameras } from "./DataContext/CamerasContext.tsx";
import { DataProviderNet } from "./DataContext/NetworkContext.tsx";
import { DataProviderTV } from "./DataContext/TVContext.tsx";
import { DataProviderFailure } from "./DataContext/FailureContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DataProviderCameras>
      <DataProviderNet>
      <DataProviderFailure> 
      <DataProviderTV> 
        <App />
      </DataProviderTV>
      </DataProviderFailure>
      </DataProviderNet>
      </DataProviderCameras>
    </BrowserRouter>
  </StrictMode>
);
