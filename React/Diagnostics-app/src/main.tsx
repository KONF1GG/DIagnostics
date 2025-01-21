import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { DataProviderCameras } from "./DataContext/CamerasContext.tsx";
import { DataProviderNet } from "./DataContext/NetworkContext.tsx";
import { DataProviderTV } from "./DataContext/TVContext.tsx";
import { DataProviderFailure } from "./DataContext/FailureContext.tsx";
import { DataProviderApp } from "./DataContext/AppContext.tsx";
import { SidebarProvider } from "./DataContext/SidebarContext.tsx";
import { SideMenuProvider } from "./DataContext/SideMenuContext.tsx";
import { RedisDataProvider } from "./DataContext/RedisLoginDataContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RedisDataProvider>
      <SidebarProvider>
        <SideMenuProvider>
          <BrowserRouter>
            <DataProviderCameras>
              <DataProviderNet>
                <DataProviderFailure>
                  <DataProviderTV>
                    <DataProviderApp>
                      <App />
                    </DataProviderApp>
                  </DataProviderTV>
                </DataProviderFailure>
              </DataProviderNet>
            </DataProviderCameras>
          </BrowserRouter>
        </SideMenuProvider>
      </SidebarProvider>
    </RedisDataProvider>
  </StrictMode>
);
