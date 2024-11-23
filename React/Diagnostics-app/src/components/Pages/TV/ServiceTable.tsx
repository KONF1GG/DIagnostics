import React from "react";

interface Service {
  id: string;
  name: string;
  status: string;
}

interface ServiceTableProps {
  title: string;
  services: Service[] | null; // Учитываем возможность отсутствия данных
  emptyMessage: string;
  highlight?: boolean; // Новое поле для выделения таблицы
}

const ServiceTable: React.FC<ServiceTableProps> = ({
  title,
  services,
  emptyMessage,
  highlight = false, 
}) => {
  return (
    <div
      className={`services-section`}
    >
      <h3 className="mb-3">{title}</h3>
      {services && services.length > 0 ? (
        <table className="table table-bordered table-striped">
          <thead className={highlight? 'table-danger' : 'table-primary'}>
            <tr>
              <th>Название</th>
              <th>ID</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.id}</td>
                <td>
                  <span
                    className={`badge ${
                      service.status === "Активный"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >
                    {service.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  );
};

export default ServiceTable;
