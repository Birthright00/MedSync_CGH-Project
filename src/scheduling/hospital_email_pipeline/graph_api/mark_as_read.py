import requests

def mark_email_as_read(email_id, access_token):
    url = f"https://graph.microsoft.com/v1.0/me/messages/{email_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    data = {"isRead": True}
    response = requests.patch(url, headers=headers, json=data)

    if response.status_code != 200:
        print(f"❌ Failed to mark as read: {response.status_code} - {response.text}")
