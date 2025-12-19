from os import getenv
from selenium import webdriver
import json

BASE_URL = getenv('BASE_URL', 'http://127.0.0.1:5000')
WAIT_SECONDS = int(getenv('WAIT_SECONDS', '60'))

def before_all(context):
    context.base_url = BASE_URL
    context.wait_seconds = WAIT_SECONDS

    with open('server/db.json', 'r') as f:
        data = json.load(f)
    data['bookings'] = []
    data['booking_seats'] = []
    data['seat_statuses'] = []
    data['films'] = [f for f in data['films'] if 'test movie' not in f['title'].lower()]
    with open('server/db.json', 'w') as f:
        json.dump(data, f, indent=2)

    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    context.driver = webdriver.Chrome(options=options)

def before_scenario(context, scenario):
    if "authentication flow" in scenario.name.lower():
        with open('server/db.json', 'r') as f:
            data = json.load(f)
        data['users'] = [u for u in data['users'] if u['email'] != 'testuser9@example.com']
        with open('server/db.json', 'w') as f:
            json.dump(data, f, indent=2)

    context.driver.get(context.base_url)
    if any(keyword in scenario.name.lower() for keyword in ['registration', 'login', 'unauthenticated']):
        context.driver.execute_script("localStorage.clear();")
        context.driver.delete_all_cookies()

def after_all(context):
    context.driver.quit()
