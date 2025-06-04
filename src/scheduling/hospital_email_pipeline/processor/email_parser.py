from utils.clean_html import strip_html

def should_process_email(email):
    return "tutorial" in email.get("subject", "").lower() or "tutorial" in email.get("bodyPreview", "").lower()

def extract_relevant_fields(email):
    return {
        "from_name": email["from"]["emailAddress"]["name"],
        "from_email": email["from"]["emailAddress"]["address"],
        "to_name": email["toRecipients"][0]["emailAddress"]["name"] if email["toRecipients"] else None,
        "to_email": email["toRecipients"][0]["emailAddress"]["address"] if email["toRecipients"] else None,
        "body_text": strip_html(email.get("body", {}).get("content", "")),
        "subject": email.get("subject", "")
    }
