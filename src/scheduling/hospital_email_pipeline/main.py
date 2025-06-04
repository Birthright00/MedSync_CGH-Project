import json
import os
import time
from dotenv import load_dotenv
from llm.llama_model import LlamaModel
from processor.email_parser import should_process_email, extract_relevant_fields
from api.send_to_backend import post_structured_data
from graph_api.fetch_emails import get_emails
from graph_api.mark_as_read import mark_email_as_read
from auth_helper import get_token_from_device_flow

# Load environment variables and get access token
load_dotenv()
access_token = get_token_from_device_flow()

# Load the model once
llama = LlamaModel()

print("🔁 Monitoring unread tutorial-related emails every 5s...")

while True:
    try:
        emails = get_emails(access_token)
        for email in emails:
            if should_process_email(email):
                fields = extract_relevant_fields(email)

                # 🔧 Use raw message formatting only (system prompt is already in the config)
                user_message = (
                    f"From: {fields['from_name']} <{fields['from_email']}>\n"
                    f"To: {fields['to_name']} <{fields['to_email']}>\n\n"
                    f"Subject: {fields['subject']}\n\n"
                    f"{fields['body_text']}"
                )

                structured_json = llama.generate(user_message).strip()
                
                if structured_json.lower().startswith("assistant"):
                    structured_json = structured_json[len("assistant"):].strip()

                try:
                    structured_data = json.loads(structured_json)
                    code, response = post_structured_data(structured_data)
                    print(f"✅ Sent to backend: {code} - {response}")
                    mark_email_as_read(email['id'], access_token)
                except json.JSONDecodeError:
                    print("❌ Failed to parse model output:", structured_json)

        time.sleep(5)

    except Exception as e:
        print("⚠️ Error during polling:", e)
        break
