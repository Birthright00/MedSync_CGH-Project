import requests

def get_emails(access_token):
    url = "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        print("✅ Email fetch success.")
        all_emails = response.json().get("value", [])
        # Only return emails that contain the word 'tutorial' in subject or preview
        return [
            email for email in all_emails
            if "tutorial" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "tutor" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            ]

    else:
        print(f"❌ Error {response.status_code}: {response.text}")
        raise Exception(f"❌ Failed to fetch emails: {response.status_code} - {response.text}")
