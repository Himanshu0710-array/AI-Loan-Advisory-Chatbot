import subprocess
import sys
import os
from dotenv import load_dotenv

# Ensure google-genai is installed
try:
    from google import genai
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai"])
    from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing key: {api_key[:10]}...")

try:
    client = genai.Client(api_key=api_key)
    resp = client.models.embed_content(model="text-embedding-004", contents="test")
    print("[+] Embedding works with google-genai!")
except Exception as e:
    print(f"[!] Error: {e}")
