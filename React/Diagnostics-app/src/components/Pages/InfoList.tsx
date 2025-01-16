import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SideMenu from "./SideMenu";
import "../CSS/infoList.css";
interface InfoListProps {
  children?: React.ReactNode;
}

const InfoList: React.FC<InfoListProps> = ({ children }) => {
  const location = useLocation();
  const [login, setLogin] = useState<string>("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setLogin(queryParams.get("login") || "");
  }, [location]);

  return (
    <div className="info-list-layout">
      <SideMenu login={login} />
      <div className="content-wrapper">{children}</div>
    </div>
  );
};

export default InfoList;
