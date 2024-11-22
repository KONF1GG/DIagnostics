from dotenv import load_dotenv
import os

load_dotenv()

MYSQL_DB = os.getenv('MYSQL_DB')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASS')
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_PORT = os.getenv('MYSQL_PORT')

RADIUS_MYSQL_PASS = os.getenv('RADIUS_MYSQL_PASS')
RADIUS_MYSQL_USER = os.getenv('RADIUS_MYSQL_USER')
RADIUS_MYSQL_DB = os.getenv('RADIUS_MYSQL_DB')
RADIUS_MYSQL_HOST = os.getenv('RADIUS_MYSQL_HOST')
RADIUS_MYSQL_PORT = os.getenv('RADIUS_MYSQL_PORT')

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_LOGIN = os.getenv("REDIS_LOGIN")

DSN = f'mysql+aiomysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
RADIUS_DSN = f'mysql+aiomysql://{RADIUS_MYSQL_USER}:{RADIUS_MYSQL_PASS}@{RADIUS_MYSQL_HOST}:{RADIUS_MYSQL_PORT}/{RADIUS_MYSQL_DB}'

TOKEN_TTL = os.getenv('TOKEN_TTL', 60*60*24)

host_tokens = {
    "video-krd.freedom1.ru": os.getenv('KRD_TOKEN'),
    "video-mgn.freedom1.ru": os.getenv('MGN_TOKEN'),
    "video-sib.freedom1.ru": os.getenv('SIB_TOKEN'),
    "video2-krd.freedom1.ru": os.getenv('KRD2_TOKEN')
}

CONFIG_TV24 = os.getenv('TOKEN_24TV')
CONFIG_TV24_KRD = os.getenv('TOKEN_24TV_KRD')

PROXY_SMOTRESHKA = os.getenv('PROXY_URL')

TVIP_TOKEN = os.getenv('AUTH_TOKEN_FOR_TVIP')

UPDATE_CAMERA_TOKEN=os.getenv('UPDATE_CAMERA_TOKEN')