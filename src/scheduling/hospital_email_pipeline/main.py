import json
import os
import time
from dotenv import load_dotenv
from llm.llama_model import LlamaModel
from llm.llm_reply import LlamaReplyModel
from processor.email_parser import should_process_email, extract_relevant_fields
from api.send_to_backend import post_structured_data
from graph_api.fetch_emails import get_emails
from graph_api.mark_as_read import mark_email_as_read
from auth_helper import get_token_from_device_flow
from utils.detect_route import detect_route


# Load environment variables and get access token
load_dotenv()
access_token = get_token_from_device_flow()

# Load both models at once
llama = LlamaModel()
llama_reply = LlamaReplyModel()

print("🔁 Monitoring unread tutorial-related emails every 5s...")

while True:
    try:
        emails = get_emails(access_token)
        for email in emails:
            route_info = detect_route(email)
            if route_info["route"] == "reply":
                print(f"📨 Reply with session ID {route_info['session_id']} detected.")
    
                # ✅ You can now fetch from DB based on session_id and parse the body to determine "yes/no"
                from_name = email["from"]["emailAddress"]["name"]
                from_email = email["from"]["emailAddress"]["address"]
                body = email.get("body", {}).get("content", "")

                # You can simplify/clean the body if needed
                # Analyze for yes/no/maybe keywords (you can improve this later)
                lowered = body.lower()
                if "yes" in lowered or "available" in lowered:
                    status = "available"
                elif "no" in lowered or "not available" in lowered:
                    status = "not_available"
                else:
                    status = "unknown"

                structured_data = {
                    "type": "reply",
                    "session_id": route_info["session_id"],
                    "from_name": from_name,
                    "from_email": from_email,
                    "status": status,
                    "raw_text": body,
                }

                print("📦 Final reply-based structured data:")
                print(json.dumps(structured_data, indent=2))

                code, response = post_structured_data(structured_data)
                print(f"✅ Sent to backend: {code} - {response}")
                mark_email_as_read(email['id'], access_token)

            # ✅ NORMAL (non-reply) EMAIL FLOW
            elif should_process_email(email):
                fields = extract_relevant_fields(email)
                print("📬 Extracted Fields:")
                for k, v in fields.items():
                    print(f"{k}: {v}")

                user_message = fields["raw_text"]
                print("🧠 Prompt to LLM:")
                print(user_message)

                structured_json = llama.generate(user_message).strip()
                if structured_json.lower().startswith("assistant"):
                    structured_json = structured_json[len("assistant"):].strip()

                try:
                    structured_data = json.loads(structured_json)
                    structured_data["from_name"] = fields["from_name"]
                    structured_data["from_email"] = fields["from_email"]
                    structured_data["to_email"] = fields["to_email"]

                    print("📦 Final structured data to send to backend:")
                    print(json.dumps(structured_data, indent=2))

                    code, response = post_structured_data(structured_data)
                    print(f"✅ Sent to backend: {code} - {response}")
                    mark_email_as_read(email['id'], access_token)
                except json.JSONDecodeError:
                    print("❌ Failed to parse model output:", structured_json)

        time.sleep(5)

    except Exception as e:
        print("⚠️ Error during polling:", e)
        break
