import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../API/api";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

interface SchemaContextType {
  schema: any | [];
  refreshSchema: () => Promise<void>;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [schema, setSchema] = useState<any>([]);
  const fetchSchema = async () => {
    try {
      const response = await api.get("/v1/schema");
      setSchema(response.data);
    } catch (err) {
      setSchema([]);
      const error = err as AxiosError<{ detail?: string }>;

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const errorMessage =
        error.response?.data?.detail || "Не удалось получить данные схемы";
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <SchemaContext.Provider
      value={{
        schema,
        refreshSchema: fetchSchema,
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error("useSchema must be used within a SchemaProvider");
  }
  return context;
};
