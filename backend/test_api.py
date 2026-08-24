import requests

print("Sending test packet to NetShield AI...")

# The URL of your local FastAPI server
url = "http://127.0.0.1:8000/predict"

# Creating a dummy network packet with exactly 78 features (all zeros for a basic test)
dummy_packet = {
    "features": [0.0] * 78
}

try:
    # Send the POST request to your endpoint
    response = requests.post(url, json=dummy_packet)
    
    # Print the server's response
    print("Response Status Code:", response.status_code)
    print("AI Prediction Result:", response.json())
except Exception as e:
    print("Failed to connect to the server:", e)