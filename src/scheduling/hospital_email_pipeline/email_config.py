import os
import json
import configparser
from auth_helper import get_token_from_device_flow

class EmailConfig:
    """
    Modular email configuration to support multiple sender accounts
    """
    
    def __init__(self, config_name="default"):
        self.config_name = config_name
        self.config_dir = os.path.dirname(os.path.abspath(__file__))
        self.profiles_dir = os.path.join(self.config_dir, "email_profiles")
        
        # Ensure profiles directory exists
        os.makedirs(self.profiles_dir, exist_ok=True)
        
        self.profile_path = os.path.join(self.profiles_dir, f"{config_name}.json")
        self.load_profile()
    
    def load_profile(self):
        """Load email profile configuration"""
        if os.path.exists(self.profile_path):
            with open(self.profile_path, 'r') as f:
                self.profile = json.load(f)
        else:
            # Create default profile
            self.profile = {
                "name": self.config_name,
                "description": "Default email profile",
                "sender_email": "",
                "sender_name": "",
                "access_token": "",
                "created_at": "",
                "last_used": ""
            }
            self.save_profile()
    
    def save_profile(self):
        """Save email profile configuration"""
        with open(self.profile_path, 'w') as f:
            json.dump(self.profile, indent=2, fp=f)
    
    def setup_new_profile(self, sender_email, sender_name, description=""):
        """Setup a new email profile with authentication"""
        print(f"🔧 Setting up new email profile: {self.config_name}")
        print(f"📧 Sender Email: {sender_email}")
        print(f"👤 Sender Name: {sender_name}")
        
        # Get access token for this profile
        print("🔑 Authenticating for this email profile...")
        access_token = get_token_from_device_flow()
        
        if access_token:
            # Update profile
            self.profile.update({
                "sender_email": sender_email,
                "sender_name": sender_name,
                "description": description,
                "access_token": access_token,
                "created_at": self.profile.get("created_at") or self._get_timestamp(),
                "last_used": self._get_timestamp()
            })
            self.save_profile()
            print("[OK] Email profile setup completed!")
            return True
        else:
            print("[ERROR] Failed to authenticate email profile")
            return False
    
    def get_access_token(self):
        """Get access token for this profile"""
        token = self.profile.get("access_token")
        if token:
            # Update last used timestamp
            self.profile["last_used"] = self._get_timestamp()
            self.save_profile()
            return token
        else:
            print(f"[ERROR] No access token found for profile '{self.config_name}'")
            print("Run: python email_config.py setup <profile_name> <email> <name>")
        return None
    
    def is_configured(self):
        """Check if profile is properly configured"""
        return bool(self.profile.get("access_token") and 
                   self.profile.get("sender_email"))
    
    def get_sender_info(self):
        """Get sender email and name"""
        return {
            "email": self.profile.get("sender_email", ""),
            "name": self.profile.get("sender_name", "")
        }
    
    def _get_timestamp(self):
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    @classmethod
    def list_profiles(cls):
        """List all available email profiles"""
        config_dir = os.path.dirname(os.path.abspath(__file__))
        profiles_dir = os.path.join(config_dir, "email_profiles")
        
        if not os.path.exists(profiles_dir):
            return []
        
        profiles = []
        for file in os.listdir(profiles_dir):
            if file.endswith('.json'):
                profile_name = file[:-5]  # Remove .json extension
                try:
                    with open(os.path.join(profiles_dir, file), 'r') as f:
                        profile_data = json.load(f)
                        profiles.append({
                            "name": profile_name,
                            "sender_email": profile_data.get("sender_email", ""),
                            "sender_name": profile_data.get("sender_name", ""),
                            "description": profile_data.get("description", ""),
                            "last_used": profile_data.get("last_used", "")
                        })
                except:
                    continue
        
        return profiles
    
    def delete_profile(self):
        """Delete this email profile"""
        if os.path.exists(self.profile_path):
            os.remove(self.profile_path)
            print(f"🗑️ Deleted email profile: {self.config_name}")
            return True
        return False


if __name__ == "__main__":
    # Example usage for setting up email profiles
    import sys
    
    if len(sys.argv) < 2:
        print("📋 Available email profiles:")
        profiles = EmailConfig.list_profiles()
        if profiles:
            for profile in profiles:
                print(f"  • {profile['name']}: {profile['sender_name']} <{profile['sender_email']}>")
        else:
            print("  No profiles configured yet")
        
        print("\nUsage:")
        print("  python email_config.py setup <profile_name> <sender_email> <sender_name>")
        print("  python email_config.py list")
        print("  python email_config.py delete <profile_name>")
        
    elif sys.argv[1] == "setup" and len(sys.argv) >= 5:
        profile_name = sys.argv[2]
        sender_email = sys.argv[3]
        sender_name = " ".join(sys.argv[4:])
        
        config = EmailConfig(profile_name)
        config.setup_new_profile(sender_email, sender_name)
        
    elif sys.argv[1] == "list":
        profiles = EmailConfig.list_profiles()
        print("📋 Available email profiles:")
        for profile in profiles:
            print(f"  • {profile['name']}: {profile['sender_name']} <{profile['sender_email']}>")
    
    elif sys.argv[1] == "delete" and len(sys.argv) >= 3:
        profile_name = sys.argv[2]
        config = EmailConfig(profile_name)
        config.delete_profile()
    
    else:
        print("[ERROR] Invalid arguments")