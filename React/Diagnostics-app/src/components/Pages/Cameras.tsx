import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import InfoList from "./InfoList";
import { GetNetwork } from "../../API/Cameras";
import "../CSS/cameras.css";
import { useDataContext } from "../../DataContext/CamerasContext";
import Modal from "../Modals/CameraModal";
import { getQueryParams } from "./Default/getData";

const Cameras = () => {
  const { data, setData, login, setLogin } = useDataContext();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const [error, setError] = useState<string | null>(null);

  const queriedLogin = getQueryParams();

  useEffect(() => {
    if (queriedLogin !== login || data == null) {
      setLogin(queriedLogin);
      fetchData(queriedLogin);
    } else if (data) {
      setIsVisible(true);
    }
  }, [location.search]);

  const fetchData = async (login: string) => {
    if (!login) {
      setData(null);
      return;
    }

    setData(null);
    setIsVisible(false);

    try {
      const result = await GetNetwork(login);
      if ("error" in result) {
        setData(null);
        setIsVisible(false);
        setError(result.message || "Неизвестная ошибка");
      } else {
        setData(result);
        setIsVisible(true);
      }
    } catch (fetchError) {
      setError("Неизвестная ошибка");
      setData(null);
    }
  };

  const openModal = (
    cameraData1C: any,
    cameraDataRedis: any,
    cameraDataFlusic: any
  ) => {
    setSelectedCamera({ cameraData1C, cameraDataRedis, cameraDataFlusic });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCamera(null);
  };

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (error) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">{error}</p>
        </InfoList>
      </div>
    );
  }

  return (
    <div>
      <InfoList>
        {!queriedLogin && !login ? (
          <p className="no-services-message fade-in">Логин не указан</p>
        ) : !data ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка...</p>
          </div>
        ) : (
          <div className={`container ${isVisible ? "fade-in" : "fade-out"}`}>
            {/* Услуги */}
            {data.services && data.services.length > 0 ? (
              <div className="fade-in">
                <h2 className="title fade-in">Услуги</h2>
                {isMobile ? (
                  <div className="card-container">
                    {data.services.map((service) => (
                      <div className="service-card" key={service.name}>
                        <h3>{service.name}</h3>
                        <p>
                          <strong>Статус:</strong> {service.status}
                        </p>
                        <p>
                          <strong>Количество:</strong> {service.count}
                        </p>
                        <p>
                          <strong>Цена:</strong> {service.price}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="table">
                    <thead className="table-primary">
                      <tr>
                        <th>Название</th>
                        <th>Статус</th>
                        <th>Количество</th>
                        <th>Цена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.map((service) => (
                        <tr key={service.name}>
                          <td>{service.name}</td>
                          <td>{service.status}</td>
                          <td>{service.count}</td>
                          <td>{service.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <p className="no-services-message" style={{ marginTop: "-20px" }}>
                Услуги отсутствуют
              </p>
            )}

            {/* Камеры из 1C */}
            {data.cameras_from_1c?.cameras?.length > 0 && (
              <div className="fade-in">
                <h2 className="title fade-in">Камеры (1C)</h2>
                {isMobile ? (
                  <div className="card-container">
                    {data.cameras_from_1c.cameras
                      .sort((a, b) => Number(a.deleted) - Number(b.deleted))
                      .map((camera) => (
                        <div className="camera-card" key={camera.macaddress}>
                          <h3>{camera.name}</h3>
                          <p>
                            <strong>ID:</strong> {camera.id}
                          </p>
                          <p>
                            <strong>IP-адрес:</strong> {camera.ipaddress}
                          </p>
                          <p>
                            <strong>MAC-адрес:</strong> {camera.macaddress}
                          </p>
                          <p>
                            <strong>Хост:</strong> {camera.host}
                          </p>
                          <p>
                            <strong>Услуга:</strong> {camera.service || "-"}
                          </p>
                          <p>
                            <strong>Тип:</strong> {camera.type}
                          </p>
                          <p>
                            <strong>Доступно:</strong>{" "}
                            {camera.available ? "Да" : "Нет"}
                          </p>
                          <p>
                            <strong>Удалена:</strong>{" "}
                            {camera.deleted ? "Да" : "Нет"}
                          </p>
                          <button
                            className={`btn ${
                              camera.deleted
                                ? "btn-secondary"
                                : camera.available
                                ? "btn-success"
                                : "btn-warning"
                            }`}
                            onClick={() =>
                              openModal(
                                data.cameras_from_1c.cameras.find(
                                  (cam) => cam.id === camera.id
                                ),
                                data.cameras_from_redis.find(
                                  (cam) => cam.id === camera.id
                                ),
                                data.cameras_from_flussonic.find(
                                  (cam) => cam.title === camera.name
                                )
                              )
                            }
                          >
                            Подробнее
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <table className="table">
                    <thead className="table-primary">
                      <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>IP-адрес</th>
                        <th>MAC-адрес</th>
                        <th>Хост</th>
                        <th>Услуга</th>
                        <th>Тип</th>
                        <th>Доступно</th>
                        <th>Удалена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cameras_from_1c.cameras
                        .sort((a, b) => Number(a.deleted) - Number(b.deleted))
                        .map((camera) => (
                          <tr key={camera.macaddress}>
                            <td>{camera.id}</td>
                            <td>
                              <button
                                className={`btn mb-3 ${
                                  camera.deleted
                                    ? "btn-secondary"
                                    : camera.available
                                    ? "btn-success"
                                    : "btn-warning"
                                }`}
                                onClick={() =>
                                  openModal(
                                    data.cameras_from_1c.cameras.find(
                                      (cam) => cam.id === camera.id
                                    ),
                                    data.cameras_from_redis.find(
                                      (cam) => cam.id === camera.id
                                    ),
                                    data.cameras_from_flussonic.find(
                                      (cam) => cam.title === camera.name
                                    )
                                  )
                                }
                              >
                                {camera.name}
                              </button>
                            </td>
                            <td>{camera.ipaddress}</td>
                            <td>{camera.macaddress}</td>
                            <td>{camera.host}</td>
                            <td>{camera.service || "-"}</td>
                            <td>{camera.type}</td>
                            <td>{camera.available ? "Да" : "Нет"}</td>
                            <td>{camera.deleted ? "Да" : "Нет"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Камеры из Redis (только если нет камер из 1С) */}
            {data.cameras_from_redis?.length > 0 &&
            !data.cameras_from_1c?.cameras?.length ? (
              <div className="fade-in">
                <h2 className="title fade-in">Камеры (Redis)</h2>
                {isMobile ? (
                  <div className="card-container">
                    {data.cameras_from_redis
                      .sort((a, b) => Number(a.available) - Number(b.available))
                      .map((camera) => (
                        <div className="camera-card" key={camera.id}>
                          <h3>{camera.name}</h3>
                          <p>
                            <strong>ID:</strong> {camera.id}
                          </p>
                          <p>
                            <strong>IP-адрес:</strong> {camera.ipaddress}
                          </p>
                          <p>
                            <strong>Хост:</strong> {camera.host}
                          </p>
                          <p>
                            <strong>Доступно:</strong>{" "}
                            {camera.available ? "Да" : "Нет"}
                          </p>
                          <p>
                            <strong>Модель:</strong> {camera.model}
                          </p>
                          <button
                            className={`btn ${
                              camera.available ? "btn-success" : "btn-warning"
                            }`}
                            onClick={() =>
                              openModal(
                                data.cameras_from_1c.cameras.find(
                                  (cam) => cam.id === camera.id
                                ),
                                data.cameras_from_redis.find(
                                  (cam) => cam.id === camera.id
                                ),
                                data.cameras_from_flussonic.find(
                                  (cam) => cam.title === camera.name
                                )
                              )
                            }
                          >
                            Посмотреть
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>IP-адрес</th>
                        <th>Хост</th>
                        <th>Доступно</th>
                        <th>Модель</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cameras_from_redis
                        .sort(
                          (a, b) => Number(a.available) - Number(b.available)
                        )
                        .map((camera) => (
                          <tr key={camera.id}>
                            <td>{camera.id}</td>
                            <td>
                              <button
                                className={`btn mb-3 ${
                                  camera.available
                                    ? "btn-success"
                                    : "btn-warning"
                                }`}
                                onClick={() =>
                                  openModal(
                                    data.cameras_from_1c.cameras.find(
                                      (cam) => cam.id === camera.id
                                    ),
                                    data.cameras_from_redis.find(
                                      (cam) => cam.id === camera.id
                                    ),
                                    data.cameras_from_flussonic.find(
                                      (cam) => cam.title === camera.name
                                    )
                                  )
                                }
                              >
                                {camera.name}
                              </button>
                            </td>
                            <td>{camera.ipaddress}</td>
                            <td>{camera.host}</td>
                            <td>{camera.available ? "Да" : "Нет"}</td>
                            <td>{camera.model}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}

            {/* Различия */}
            {data.cameras_difference?.length > 0 && (
              <div className="fade-in differences-container">
                <h2 className="title-red text-danger fade-in">Различия</h2>
                {(() => {
                  const missingCameras: string[] = [];
                  const cameraDifferences: JSX.Element[] = [];

                  data.cameras_difference.forEach((diff) => {
                    const redisId = diff.Redis
                      ? Object.keys(diff.Redis)[0]
                      : null;
                    const redisCamera = redisId ? diff.Redis[redisId] : null;

                    const db1CId = diff.DB_1C
                      ? Object.keys(diff.DB_1C)[0]
                      : null;
                    const cameraFrom1C = db1CId ? diff.DB_1C[db1CId] : null;

                    if (redisCamera && cameraFrom1C) {
                      cameraDifferences.push(
                        <div key={redisId || db1CId}>
                          <h3>Различия для камеры {redisId || db1CId}</h3>
                          <table className="table">
                            <thead className="table-danger">
                              <tr>
                                <th>Параметр</th>
                                <th>1C</th>
                                <th>Redis</th>
                              </tr>
                            </thead>
                            <tbody>
                              {redisCamera.available !== undefined && (
                                <tr>
                                  <td>Доступно</td>
                                  <td>
                                    {cameraFrom1C.available ? "Да" : "Нет"}
                                  </td>
                                  <td>
                                    {redisCamera.available ? "Да" : "Нет"}
                                  </td>
                                </tr>
                              )}
                              {redisCamera.ipaddress !== undefined && (
                                <tr>
                                  <td>IP-адрес</td>
                                  <td>{cameraFrom1C.ipaddress || "-"}</td>
                                  <td>{redisCamera.ipaddress || "-"}</td>
                                </tr>
                              )}
                              {redisCamera.name !== undefined && (
                                <tr>
                                  <td>Название</td>
                                  <td>{cameraFrom1C.name || "-"}</td>
                                  <td>{redisCamera.name || "-"}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    } else {
                      if (!redisCamera) {
                        missingCameras.push(
                          `Камера ${cameraFrom1C.name} отсутствует в Redis`
                        );
                      } else {
                        missingCameras.push(
                          `Камера ${redisCamera.name} отсутствует в 1C`
                        );
                      }
                    }
                  });

                  return (
                    <>
                      {missingCameras.length > 0 && (
                        <div>
                          <h3>Отсутствующие камеры</h3>
                          <ul>
                            {missingCameras.map((msg, index) => (
                              <li key={index}>{msg}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cameraDifferences}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Flussonic Errors Section */}
            {data.flus_diffs &&
              Object.entries(data.flus_diffs).some(
                ([, errors]) => errors.length > 0
              ) && (
                <div className="fade-in difference-card fade-in">
                  <h3>Ошибки Flussonic</h3>
                  <ul>
                    {Object.values(data.flus_diffs)
                      .flat()
                      .map(
                        (error, index) =>
                          error.length > 0 && <li key={index}>{error}</li>
                      )}
                  </ul>
                </div>
              )}

            {/* Service Differences Section */}
            {data.service_diffs &&
              typeof data.service_diffs === "object" &&
              Object.entries(data.service_diffs).some(
                ([_, diff]) => Array.isArray(diff) && diff.length > 0
              ) && (
                <div className="fade-in difference-card">
                  <h3>Услуги</h3>
                  <ul>
                    {Object.entries(data.service_diffs)
                      .filter(
                        ([_, diff]) => Array.isArray(diff) && diff.length > 0
                      )
                      .map(([, diff], index) => (
                        <li key={index}>{diff.join(", ")}</li>
                      ))}
                  </ul>
                </div>
              )}
          </div>
        )}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            cameraData1C={selectedCamera?.cameraData1C} // данные из 1С
            cameraDataRedis={selectedCamera?.cameraDataRedis} // данные из Redis
            cameraFlusicData={selectedCamera?.cameraDataFlusic}
          />
        )}
      </InfoList>
    </div>
  );
};

export default Cameras;
