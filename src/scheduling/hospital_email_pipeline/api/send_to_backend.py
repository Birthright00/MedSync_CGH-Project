import os
from dotenv import load_dotenv
import requests

load_dotenv()  # load from .env file
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3001")

def post_structured_data(json_data, endpoint=None):
    if endpoint is None:
        endpoint = f"{API_BASE_URL}/api/scheduling/parsed-email"
    try:
        res = requests.post(endpoint, json=json_data)
        return res.status_code, res.text
    except Exception as e:
        return 500, str(e)
