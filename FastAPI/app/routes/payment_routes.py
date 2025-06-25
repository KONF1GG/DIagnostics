"""
Маршруты для работы с платежами.

Эндпоинты:
- Получение данных о платежах по логину.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.crud import fetch_data
from app.schemas import (
    NotificationSMS,
    PaymentResponseModel,
    Payment,
    FailurePay,
    RecPaymnent,
)
from app.depencies import TokenDependency
import asyncio
import aiohttp

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get('/v1/payment', response_model=PaymentResponseModel, tags=["Оплата"])
async def get_payment_data(  
    token: TokenDependency, 
    login: Optional[str] = Query(None),
):
    """
    Эндпоинт для получения данных о платежах.
    """
    try:
        if not login:
            raise HTTPException(
                status_code=400,
                detail="Login parameter is required"
            )

        async with aiohttp.ClientSession() as session:
            try:
                tasks = [
                    fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=allPayments3&login={login}', Payment),
                    fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=canceledPayments&login={login}', FailurePay),
                    fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=recurringPayment&login={login}', RecPaymnent),
                    fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/getNotifications?login={login}', NotificationSMS),
                ]
                
                last_payments_models, canceled_payments_models, recurring_payment_model, notification_model = await asyncio.gather(*tasks)
                
                return PaymentResponseModel(
                    payments=last_payments_models, 
                    canceled_payments=canceled_payments_models, 
                    recurringPayment=recurring_payment_model[0] if isinstance(recurring_payment_model, list) and recurring_payment_model else None,
                    notifications=notification_model if notification_model else None,
                )
                
            except aiohttp.ClientError as e:
                logger.error("Failed to connect to 1C server: %s", str(e))
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to connect to 1C server: {str(e)}"
                ) from e
            except asyncio.TimeoutError as e:
                logger.error("Request to 1C server timed out: %s", str(e))
                raise HTTPException(
                    status_code=504,
                    detail="Request to 1C server timed out"
                ) from e
            except Exception as e:
                logger.error("Unexpected error occurred: %s", str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected error occurred: {str(e)}"
                ) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Internal server error in payment endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        ) from e