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
            if should_process_email(email):
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
                    
                    # Robustly derive available_slots_timings from original_session + new_session
                    if (structured_data.get("type") or "").strip().lower() == "availability":
                        original = (structured_data.get("original_session") or "").strip()
                        new_time = (structured_data.get("new_session") or "").strip()

                        print("📅 original_session:", original)
                        print("⏰ new_session:", new_time)

                        if original and new_time:
                            import re
                            # Normalize common unicode dashes to simple hyphen
                            original_cleaned = original.replace("\u2013", "-").replace("\u2014", "-").replace("\u2015", "-").strip()

                            # Extract everything before the first opening parenthesis
                            match = re.match(r"^(.*?)\s*\(", original_cleaned)
                            extracted_date = match.group(1).strip() if match else None

                            if extracted_date:
                                structured_data["available_slots_timings"] = [f"{extracted_date} ({new_time})"]
                                print("✅ Overwrote available_slots_timings:", structured_data["available_slots_timings"])
                            else:
                                print("❌ Could not extract date from cleaned original_session:", original_cleaned)
                        else:
                            print("⚠️ original_session or new_session missing")


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
