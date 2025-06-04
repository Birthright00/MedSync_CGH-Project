import requests

def post_structured_data(json_data, endpoint="http://localhost:3001/api/scheduling/parsed-email"):
    try:
        res = requests.post(endpoint, json=json_data)
        return res.status_code, res.text
    except Exception as e:
        return 500, str(e)
