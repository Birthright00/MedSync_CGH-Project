# detect_route.py

def detect_route(email):
    headers = email.get("internetMessageHeaders", [])
    subject = email.get("subject", "").lower()

    is_reply = subject.startswith("re:") or any("in-reply-to" in h["name"].lower() for h in headers)

    session_id = None
    for h in headers:
        if h["name"].lower() == "x-session-id":
            session_id = h["value"]
            break

    if is_reply and session_id:
        return {"route": "reply", "session_id": session_id}
    else:
        return {"route": "llm", "session_id": None}
