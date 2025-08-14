import requests

def get_emails(access_token):
    url = "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        print("[OK] Email fetch success.")
        all_emails = response.json().get("value", [])
        # Only return emails that contain these words in subject or preview
        return [
            email for email in all_emails
            if "tutorial" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "tutor" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "reschedule" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "change" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "available" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            or "availability" in (email.get("subject", "") + email.get("bodyPreview", "")).lower()
            ]

    else:
        error_msg = f"HTTP {response.status_code}"
        try:
            error_detail = response.json()
            if 'error' in error_detail:
                error_msg += f": {error_detail['error'].get('message', 'Unknown error')}"
        except:
            error_msg += f": {response.text[:200]}"
        
        print(f"[ERROR] Email fetch failed - {error_msg}")
        if response.status_code == 401:
            print("[ERROR] Authentication failed. Access token may be expired.")
        elif response.status_code == 403:
            print("[ERROR] Permission denied. Check Graph API permissions.")
        
        raise Exception(f"[ERROR] Failed to fetch emails: {error_msg}")
