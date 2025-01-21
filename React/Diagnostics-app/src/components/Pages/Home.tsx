import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Импортируем useNavigate
import check_token from "../../API/check_token";
import InfoList from "./InfoList";
import Loader from "./Default/Loading";

const Home = () => {
  const navigate = useNavigate(); // Получаем navigate
  const [loading, setLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const validateToken = async () => {
        const result = await check_token(token);

        if (typeof result === "string" && result.includes("Invalid token")) {
          console.log(result);
          navigate("/login");
        }
        setLoading(false);
      };

      validateToken();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ marginTop: "80px" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <InfoList></InfoList>
    </div>
  );
};

export default Home;
