import json
import os
import time
import sys
import argparse
from dotenv import load_dotenv
from llm.llama_model import LlamaModel
from llm.llm_reply import LlamaReplyModel
from processor.email_parser import should_process_email, extract_relevant_fields
from api.send_to_backend import post_structured_data
from graph_api.fetch_emails import get_emails
from graph_api.mark_as_read import mark_email_as_read
from auth_helper import get_token_from_device_flow
from utils.detect_route import detect_route
from email_config import EmailConfig


def safe_print(text):
    """Safely print text with Unicode characters by encoding them properly"""
    try:
        # Try to encode and decode to remove problematic Unicode characters
        safe_text = text.encode('ascii', 'ignore').decode('ascii')
        print(safe_text)
    except Exception:
        # If all else fails, print a sanitized version
        print("[INFO] <Email content contains special characters>")


def get_access_token_from_profile(profile_name):
    """Get access token from email profile instead of device flow"""
    try:
        email_config = EmailConfig(profile_name)
        if not email_config.is_configured():
            print(f"[ERROR] Email profile '{profile_name}' is not configured or authenticated")
            return None
        
        access_token = email_config.get_access_token()
        if access_token:
            print(f"[OK] Using access token from profile: {profile_name}")
            return access_token
        else:
            print(f"[ERROR] No access token available for profile: {profile_name}")
            return None
    except Exception as e:
        print(f"[ERROR] Error loading profile '{profile_name}': {e}")
        return None


# Parse command line arguments
parser = argparse.ArgumentParser(description='Email monitoring and LLM processing')
parser.add_argument('--profile', default='default', help='Email profile to use for monitoring')
args = parser.parse_args()

# Load environment variables
load_dotenv()

# Get access token from specified profile
print(f"[INFO] Loading email profile: {args.profile}")
access_token = get_access_token_from_profile(args.profile)

if not access_token:
    print(f"[ERROR] Cannot start monitoring: No valid access token for profile '{args.profile}'")
    print("Available profiles:")
    from email_config import EmailConfig
    profiles = EmailConfig.list_profiles()
    if profiles:
        for profile in profiles:
            print(f"  • {profile['name']}: {profile['sender_name']} <{profile['sender_email']}>")
    else:
        print("  No profiles found")
    print("\nTo setup a profile: python email_config.py setup <profile_name> <email> <name>")
    sys.exit(1)

# Load both models at once
print("[INFO] Loading LLM models...")
try:
    llama = LlamaModel()
    llama_reply = LlamaReplyModel()
    print("[OK] LLM models loaded successfully")
except Exception as e:
    print(f"[ERROR] Failed to load LLM models: {e}")
    print("[ERROR] Check that config files exist: config/llm_config.yaml, config/llm_reply.yaml")
    sys.exit(1)

print(f"[INFO] Monitoring unread tutorial-related emails every 5s for profile: {args.profile}...")
print("[INFO] Listening for emails containing: tutorial, tutor, reschedule, change, available, availability")

while True:
    try:
        emails = get_emails(access_token)
        for email in emails:
            if should_process_email(email):
                fields = extract_relevant_fields(email)
                print("[INFO] Extracted Fields:")
                for k, v in fields.items():
                    print(f"{k}: ", end="")
                    safe_print(str(v))

                user_message = fields["raw_text"]
                print("[INFO] Prompt to LLM:")
                safe_print(user_message)

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

                        print("[INFO] original_session:", original)
                        print("[INFO] new_session:", new_time)

                        if original and new_time:
                            import re
                            # Normalize common unicode dashes to simple hyphen
                            original_cleaned = original.replace("\u2013", "-").replace("\u2014", "-").replace("\u2015", "-").strip()

                            # Extract everything before the first opening parenthesis
                            match = re.match(r"^(.*?)\s*\(", original_cleaned)
                            extracted_date = match.group(1).strip() if match else None

                            if extracted_date:
                                structured_data["available_slots_timings"] = [f"{extracted_date} ({new_time})"]
                                print("[OK] Overwrote available_slots_timings:", structured_data["available_slots_timings"])
                            else:
                                print("[ERROR] Could not extract date from cleaned original_session:", original_cleaned)
                        else:
                            print("[WARNING] original_session or new_session missing")


                    print("[INFO] Final structured data to send to backend:")
                    safe_print(json.dumps(structured_data, indent=2, ensure_ascii=True))

                    code, response = post_structured_data(structured_data)
                    print(f"[OK] Sent to backend: {code} - {response}")
                    mark_email_as_read(email['id'], access_token)
                except json.JSONDecodeError:
                    print("[ERROR] Failed to parse model output:")
                    safe_print(structured_json)

        time.sleep(5)

    except KeyboardInterrupt:
        print("\n[INFO] Monitoring stopped by user")
        break
    except Exception as e:
        print(f"[ERROR] Error during polling: {e}")
        print("[INFO] Retrying in 10 seconds...")
        time.sleep(10)
