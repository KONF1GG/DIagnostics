import { useEffect} from "react";
import { useNavigate } from "react-router-dom"; // Импортируем useNavigate
import check_token from "../../API/check_token";
import InfoList from "./InfoList";

const Home = () => {
  const navigate = useNavigate(); // Получаем navigate


  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const validateToken = async () => {
        console.log(token)
        const result = await check_token(token);

        if (typeof result === "string" && result.includes("Invalid token")) {
          console.log(result)

          navigate("/login"); 
        }
      };

      validateToken();
    } else {
      // Если токена нет, перенаправляем на /login
      navigate("/login");
    }
  }, [navigate]); // Добавляем navigate в зависимости

  return (
    <div>
      <InfoList /> 
    </div>
  );
};

export default Home;
