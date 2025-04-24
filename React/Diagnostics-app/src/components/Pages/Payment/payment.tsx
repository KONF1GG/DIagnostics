import { useEffect, useState } from "react";
import { GetPayment, PaymentResponseModel } from "../../../API/payment";
import { useDataContext } from "../../../DataContext/PaymentContext";
import InfoList from "../InfoList";
import Loader from "../Default/Loading";
import { getQueryParams } from "../Default/getData";
import PaymentList from "./PaymentsList";
import CanceledPaymentList from "./CanceledPaymentList";
import RecurringPayment from "./RecurringPayment";
import NotificationsList from "./NotificationList";

interface DataContextType {
  data: PaymentResponseModel | null;
  setData: (data: PaymentResponseModel | null) => void;
  login: string | null;
  setLogin: (login: string | null) => void;
}

const PaymentPage = () => {
  const { data, setData, login, setLogin } =
    useDataContext() as DataContextType;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const queriedLogin = getQueryParams();

  const fetchData = async (login: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await GetPayment(login);

      if (result && "detail" in result) {
        setError(result.detail);
        setData(null);
      } else if (result) {
        setData(result as PaymentResponseModel);
      } else {
        setError("Ошибка: данные не получены");
        setData(null);
      }
    } catch {
      setError("Ошибка загрузки данных");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDataIfNeeded = async () => {
      if (queriedLogin !== login) {
        setLogin(queriedLogin);
        await fetchData(queriedLogin);
      }
      setIsVisible(!!queriedLogin || !!login);
    };

    fetchDataIfNeeded();
  }, [queriedLogin, login]);

  if (!queriedLogin && !login) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">Логин не указан</p>
        </InfoList>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <InfoList>
          <div>
            <Loader />
          </div>
        </InfoList>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <InfoList>
          <p className="no-services-message fade-in">{error}</p>
        </InfoList>
      </div>
    );
  }

  console.log(data);
  return (
    <div>
      <InfoList>
        <div className={`container fade-in ${isVisible ? "visible" : ""}`}>
          <section>
            <h2 className="title">Платежи</h2>
            {data?.payments && data.payments.length > 0 ? (
              <PaymentList payments={data.payments} />
            ) : (
              <p>Нет платежей</p>
            )}
          </section>

          <section>
            <h2 className="title">Неуспешные попытки</h2>
            {data?.canceled_payments && data.canceled_payments.length > 0 ? (
              <CanceledPaymentList
                login={queriedLogin}
                canceledPayments={data.canceled_payments}
                setData={setData}
              />
            ) : (
              <p>Нет неуспешных попыток</p>
            )}
          </section>

          <section>
            <h2 className="title">Подписка на автоплатеж</h2>
            {data?.recurringPayment?.recurringPayment ? (
              <RecurringPayment recurringPayment={data.recurringPayment} />
            ) : (
              <p className="text-muted">Автоплатеж не подключен</p>
            )}
          </section>

          <section>
            <h2 className="title">Уведомления и СМС</h2>
            {data?.notifications ? (
              <NotificationsList notifications={data?.notifications} />
            ) : (
              <p className="text-muted">Нет уведомлений</p>
            )}
          </section>
        </div>
      </InfoList>
    </div>
  );
};

export default PaymentPage;
