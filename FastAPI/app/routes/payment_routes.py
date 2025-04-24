
from ast import Not
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from schemas import NotificationSMS, PaymentResponseModel, Payment, FailurePay, RecPaymnent
from depencies import TokenDependency
import asyncio
import aiohttp
import crud

router = APIRouter()

@router.get('/v1/payment', response_model=PaymentResponseModel)
async def get_payment_data(  
    token: TokenDependency, 
    login: Optional[str] = Query(None),
):
    if not login:
        raise HTTPException(
            status_code=400,
            detail="Login parameter is required"
        )

    async with aiohttp.ClientSession() as session:
        try:
            tasks = [
                crud.fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=allPayments3&login={login}', Payment),
                crud.fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=canceledPayments&login={login}', FailurePay),
                crud.fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=recurringPayment&login={login}', RecPaymnent),
                crud.fetch_data(session, f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/getNotifications?login={login}', NotificationSMS),
            ]
            
            last_payments_models, canceled_payments_models, recurring_payment_model, notification_model = await asyncio.gather(*tasks)
            
            return PaymentResponseModel(payments=last_payments_models, 
                                        canceled_payments=canceled_payments_models, 
                                        recurringPayment=recurring_payment_model,
                                        notifications=notification_model if notification_model else None,)
            
        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to connect to 1C server: {str(e)}"
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail="Request to 1C server timed out"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error occurred: {str(e)}"
            )