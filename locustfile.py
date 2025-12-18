from locust import HttpUser, task, between, events
import os
import random
import json

BASE_FILMS_PATH = os.getenv("LOCUST_FILMS_PATH", "/films")
BASE_FILM_DETAIL_PATH = os.getenv("LOCUST_FILM_DETAIL_PATH", "/films/{id}")
BASE_BOOKINGS_PATH = os.getenv("LOCUST_BOOKINGS_PATH", "/bookings")
BASE_LOGIN_PATH = os.getenv("LOCUST_LOGIN_PATH", "/auth/login")
USERNAME = os.getenv("LOCUST_USER", "")
PASSWORD = os.getenv("LOCUST_PASS", "")

class CinemaUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Optional login to obtain auth token (if your API requires it)
        if USERNAME and PASSWORD:
            with self.client.post(BASE_LOGIN_PATH, json={"email": USERNAME, "password": PASSWORD}, catch_response=True) as r:
                if r.status_code == 200:
                    try:
                        token = r.json().get("accessToken") or r.json().get("token") or r.json().get("access_token")
                        if token:
                            self.client.headers.update({"Authorization": f"Bearer {token}"})
                    except Exception:
                        pass

    @task(3)
    def list_and_maybe_get_film(self):
        # GET list of films
        with self.client.get(BASE_FILMS_PATH, name="GET /films", catch_response=True) as r:
            if r.status_code == 200:
                try:
                    data = r.json()
                    # If JSON array, pick a random film id to request detail
                    if isinstance(data, list) and data:
                        film = random.choice(data)
                        film_id = film.get("id") or film.get("_id") or film.get("filmId")
                        if film_id:
                            detail_path = BASE_FILM_DETAIL_PATH.format(id=film_id)
                            self.client.get(detail_path, name="GET /films/:id")
                except Exception:
                    # ignore parse errors
                    pass

    @task(1)
    def create_booking(self):
        # Create a booking. Adjust payload to match your API.
        payload = {
            "filmId": os.getenv("LOCUST_SAMPLE_FILM_ID", "sample-film-id"),
            "showtimeId": os.getenv("LOCUST_SAMPLE_SHOWTIME_ID", "sample-showtime-id"),
            "seats": ["A1", "A2"],
            "customer": {
                "name": "Locust Test",
                "email": os.getenv("LOCUST_BOOKING_EMAIL", "locust@example.com")
            }
        }
        headers = {"Content-Type": "application/json"}
        # If Authorization header exists, client already includes it.
        self.client.post(BASE_BOOKINGS_PATH, data=json.dumps(payload), headers=headers, name="POST /bookings", catch_response=True)