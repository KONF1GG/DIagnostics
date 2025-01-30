from datetime import datetime, timedelta
from typing import Dict
import json

async def compare_json(radius: Dict, redis: Dict):
    differences = {'radius': {}, 'redis': {}}

    # Получаем значение timeto из Redis
    timeto_value = redis.get('servicecats', {}).get('internet', {}).get('timeto', None)

    for field in ['password', 'GMT', 'ip_addr', 'time_to', 'onu_mac', 'json_data']:
        radius_value = radius.get(field)
        redis_value = redis.get(field)

        if field == 'time_to':
            # Преобразуем timeto из Redis в datetime для сравнения
            if timeto_value is not None:
                time_to_redis = timeto_value
            else:
                time_to_redis = None
            time_to_redis = timeto_value
            if radius_value:
                # radius_value уже в формате datetime
                time_to_radius = radius_value
            else:
                time_to_radius = None

            tolerance = timedelta(hours=2)
            # Сравнение значений
            if abs(time_to_radius - time_to_redis) > tolerance and time_to_radius:
                differences['radius']['time_to'] = time_to_radius
                differences['redis']['time_to'] = time_to_redis

        elif field == 'json_data':
            # Обработка json_data
            mac1, vlan1 = (
                (radius_value.get('mac'), radius_value.get('vlan')) if radius_value else (
                None, None))
            mac2, vlan2 = (redis.get('mac', None), int(redis.get('vlan', 0)))

            if mac1 != mac2:
                differences['radius']['mac'] = mac1
                differences['redis']['mac'] = mac2

            vlan2 = None if vlan2 == 0 else vlan2
            if vlan1 != vlan2:
                differences['radius']['vlan'] = vlan1
                differences['redis']['vlan'] = vlan2

        elif radius_value != redis_value:
            differences['radius'][field] = radius_value
            differences['redis'][field] = redis_value

    return differences

def is_active(data_dict, current_time):
    """Проверяет активность соединения на основе поля 'time_to'."""
    time_to = data_dict.get('time_to')
    if isinstance(time_to, (int, float)):
        return datetime.fromtimestamp(time_to) > current_time
    return bool(time_to)


async def safe_json_parse(json_data):
    """Безопасно парсит JSON."""
    try:
        return json.loads(json_data) if json_data else {}
    except json.JSONDecodeError:
        return {}