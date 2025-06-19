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
import { DataProviderPayment } from "./DataContext/PaymentContext.tsx";
import { SchemaProvider } from "./DataContext/SchemaContext.tsx";
import { DataProviderIntercom } from "./DataContext/IntercomContext.tsx";
import { DataProviderFrida } from "./DataContext/FridaContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RedisDataProvider>
      <SchemaProvider>
        <SidebarProvider>
          <DataProviderFrida>
            <SideMenuProvider>
              <BrowserRouter>
                <DataProviderIntercom>
                  <DataProviderPayment>
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
                  </DataProviderPayment>
                </DataProviderIntercom>
              </BrowserRouter>
            </SideMenuProvider>
          </DataProviderFrida>
        </SidebarProvider>
      </SchemaProvider>
    </RedisDataProvider>
  </StrictMode>
);
