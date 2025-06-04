import msal
import configparser

def get_token_from_device_flow():
    # Read config
    config = configparser.ConfigParser()
    config.read("config.cfg")

    client_id = config["azure"]["clientId"]
    tenant_id = config["azure"]["tenantId"]
    scopes = config["azure"]["graphUserScopes"].split()

    authority = f"https://login.microsoftonline.com/{tenant_id}"

    app = msal.PublicClientApplication(client_id=client_id, authority=authority)

    flow = app.initiate_device_flow(scopes=scopes)
    if "user_code" not in flow:
        raise Exception("Failed to create device flow")

    print(f"🔑 Go to {flow['verification_uri']} and enter code: {flow['user_code']}")
    print("🔄 Waiting for authentication...")

    result = app.acquire_token_by_device_flow(flow)

    if "access_token" in result:
        print("✅ Authentication successful.")
        return result["access_token"]
    else:
        raise Exception(f"❌ Failed to acquire token: {result}")
