import requests
import json
import os
import sys
from dotenv import load_dotenv
from email_config import EmailConfig

def send_email(access_token, to_emails, subject, body, session_id=None, from_email=None):
    """Send email using Microsoft Graph API"""
    
    # Format recipients for Graph API
    recipients = [{"emailAddress": {"address": email}} for email in to_emails]
    
    # Prepare email payload
    payload = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": body
            },
            "toRecipients": recipients
        }
    }
    
    # Add custom from email if specified
    if from_email:
        payload["message"]["from"] = {
            "emailAddress": {
                "address": from_email
            }
        }
    
    # Add session ID header if provided
    if session_id:
        payload["message"]["internetMessageHeaders"] = [
            {
                "name": "X-Session-ID",
                "value": session_id
            }
        ]
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 202:  # Success
            print("[OK] Email sent successfully!")
            return True
        else:
            error_data = response.json() if response.content else {}
            print(f"[ERROR] Email send failed: {response.status_code} - {error_data}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Exception occurred while sending email: {e}")
        return False

def send_session_email_from_data(email_data, profile_name="default"):
    """Send email using data from CreateNewSession.js with specified email profile"""
    
    # Load email configuration profile
    email_config = EmailConfig(profile_name)
    
    if not email_config.is_configured():
        print(f"[ERROR] Email profile '{profile_name}' is not configured")
        print("Run: python email_config.py setup <profile_name> <sender_email> <sender_name>")
        return False
    
    # Get access token from profile
    access_token = email_config.get_access_token()
    if not access_token:
        print(f"[ERROR] No access token available for profile '{profile_name}'")
        return False
    
    # Get sender info
    sender_info = email_config.get_sender_info()
    print(f"📧 Sending from: {sender_info['name']} <{sender_info['email']}>")
    
    # Extract data from CreateNewSession.js format
    selected_doctors = email_data.get('selectedDoctors', [])
    doctors = email_data.get('doctors', [])
    subject = email_data.get('subject', '')
    body = email_data.get('body', '')
    session_id = email_data.get('sessionId', '')
    
    # Extract email addresses from selected doctors
    selected_doctor_objs = [doc for doc in doctors if doc.get('mcr_number') in selected_doctors]
    to_emails = [doc.get('email') for doc in selected_doctor_objs if doc.get('email')]
    
    if not to_emails:
        print("[ERROR] No valid doctor email addresses found")
        return False
    
    print(f"📧 Sending email to {len(to_emails)} doctors: {', '.join(to_emails)}")
    
    return send_email(access_token, to_emails, subject, body, session_id, sender_info['email'])

if __name__ == "__main__":
    load_dotenv()
    
    # Parse command line arguments
    profile_name = "default"
    email_data_arg = None
    
    # Check for --profile argument
    if "--profile" in sys.argv:
        profile_index = sys.argv.index("--profile")
        if profile_index + 1 < len(sys.argv):
            profile_name = sys.argv[profile_index + 1]
            # Remove --profile and profile_name from argv
            sys.argv.pop(profile_index)  # Remove --profile
            sys.argv.pop(profile_index)  # Remove profile_name
    
    # Check if email data is provided as command line argument
    if len(sys.argv) > 1:
        try:
            # Load email data from JSON file or string
            email_data_path = sys.argv[1]
            if os.path.exists(email_data_path):
                with open(email_data_path, 'r') as f:
                    email_data = json.load(f)
                success = send_session_email_from_data(email_data, profile_name)
            else:
                # Try to parse as JSON string
                email_data = json.loads(sys.argv[1])
                success = send_session_email_from_data(email_data, profile_name)
                
            if success:
                print("🎉 Email sending completed successfully!")
            else:
                print("[ERROR] Email sending failed!")
                
        except Exception as e:
            print(f"[ERROR] Error processing email data: {e}")
    else:
        # Example/test mode - send a simple test email
        email_config = EmailConfig(profile_name)
        
        if not email_config.is_configured():
            print(f"[ERROR] Email profile '{profile_name}' is not configured")
            print("Available profiles:")
            profiles = EmailConfig.list_profiles()
            for profile in profiles:
                print(f"  • {profile['name']}: {profile['sender_name']} <{profile['sender_email']}>")
            print("\nTo setup a new profile:")
            print("python email_config.py setup <profile_name> <sender_email> <sender_name>")
        else:
            access_token = email_config.get_access_token()
            sender_info = email_config.get_sender_info()
            
            if access_token:
                to_emails = ["recipient@example.com"]  # Replace with actual email
                subject = f"Test Email from {sender_info['name']}"
                body = f"""This is a test email sent from {sender_info['name']} <{sender_info['email']}>.

No LLM processing required.

Thank you!"""
                session_id = "simple-test-123"
                
                print(f"📧 Sending test email from {sender_info['name']} <{sender_info['email']}>...")
                success = send_email(access_token, to_emails, subject, body, session_id, sender_info['email'])
                
                if success:
                    print("🎉 Email sending completed successfully!")
                else:
                    print("[ERROR] Email sending failed!")
            else:
                print("[ERROR] Could not obtain access token")
                
    print("\nUsage:")
    print("  python send_email.py                           # Test mode with default profile")
    print("  python send_email.py --profile <name>          # Test mode with specific profile")
    print("  python send_email.py <data.json>               # Send with JSON file")
    print("  python send_email.py <data.json> --profile <name>  # Send with specific profile")