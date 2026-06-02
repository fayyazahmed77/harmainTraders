import urllib.request
import re

url = "https://aishtycoons.agency/"
try:
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print("--- LINK TAGS ---")
    links = re.findall(r'<link[^>]*>', html)
    for link in links:
        print(link)
        
    print("\n--- SCRIPT TAGS ---")
    scripts = re.findall(r'<script[^>]*>.*?</script>', html, re.DOTALL)
    for script in scripts:
        if 'src' in script or len(script) < 200:
            print(script)
            
except Exception as e:
    print(f"Error: {e}")
