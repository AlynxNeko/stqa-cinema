from locust import HttpUser, task, between, events
import os
import random
import json

BASE_FILMS_PATH = os.getenv("LOCUST_FILMS_PATH", "/api/films")
BASE_FILM_DETAIL_PATH = os.getenv("LOCUST_FILM_DETAIL_PATH", "/api/films/{id}")
BASE_SHOWTIMES_PATH = os.getenv("LOCUST_SHOWTIMES_PATH", "/api/showtimes")
BASE_SEAT_STATUSES_PATH = os.getenv("LOCUST_SEAT_STATUSES_PATH", "/api/seat-statuses")
BASE_BOOKINGS_PATH = os.getenv("LOCUST_BOOKINGS_PATH", "/api/bookings")
BASE_LOGIN_PATH = os.getenv("LOCUST_LOGIN_PATH", "/api/auth/login")
USERNAME = os.getenv("LOCUST_USER", "")
PASSWORD = os.getenv("LOCUST_PASS", "")
USER_ID = os.getenv("LOCUST_USER_ID", "locust-user")

class CinemaUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Optional login to obtain auth token (if your API requires it)
        if USERNAME and PASSWORD:
            with self.client.post(BASE_LOGIN_PATH, json={"email": USERNAME, "password": PASSWORD}, catch_response=True) as r:
                if r.status_code == 200:
                    try:
                        # Your backend returns user info, not a token; API doesn't require auth.
                        # Keep compatibility if a token is ever returned.
                        token = r.json().get("accessToken") or r.json().get("token") or r.json().get("access_token")
                        if token:
                            self.client.headers.update({"Authorization": f"Bearer {token}"})
                    except Exception:
                        pass

    @task(3)
    def list_and_maybe_get_film(self):
        # GET list of films
        with self.client.get(BASE_FILMS_PATH, name="GET /api/films", catch_response=True) as r:
            if r.status_code == 200:
                try:
                    data = r.json()
                    # If JSON array, pick a random film id to request detail
                    if isinstance(data, list) and data:
                        film = random.choice(data)
                        film_id = film.get("id") or film.get("_id") or film.get("filmId")
                        if film_id:
                            detail_path = BASE_FILM_DETAIL_PATH.format(id=film_id)
                            self.client.get(detail_path, name="GET /api/films/:id")
                except Exception:
                    # ignore parse errors
                    pass

    @task(1)
    def create_booking(self):
        # Create a booking aligned with backend `/api/bookings` expectations.
        # Flow: pick a film -> pick a showtime -> pick available seats -> book.
        # 1) Pick a random film
        film_id = None
        with self.client.get(BASE_FILMS_PATH, name="GET /api/films (for booking)", catch_response=True) as r_films:
            if r_films.status_code == 200:
                try:
                    films = r_films.json()
                    if isinstance(films, list) and films:
                        film_id = (random.choice(films) or {}).get("id")
                except Exception:
                    pass

        if not film_id:
            return

        # 2) Pick a showtime for the film
        showtime_id = None
        with self.client.get(f"{BASE_SHOWTIMES_PATH}?film_id={film_id}", name="GET /api/showtimes?film_id", catch_response=True) as r_shows:
            if r_shows.status_code == 200:
                try:
                    showtimes = r_shows.json()
                    if isinstance(showtimes, list) and showtimes:
                        showtime_id = (random.choice(showtimes) or {}).get("id")
                except Exception:
                    pass

        if not showtime_id:
            return

        # 3) Fetch seat statuses and choose two available seats
        seat_ids = []
        with self.client.get(f"{BASE_SEAT_STATUSES_PATH}?showtime_id={showtime_id}", name="GET /api/seat-statuses", catch_response=True) as r_seats:
            if r_seats.status_code == 200:
                try:
                    seats = r_seats.json()
                    available = [s for s in seats if s.get("status") == "Available"]
                    random.shuffle(available)
                    for s in available[:2]:
                        sid = s.get("seat_id") or s.get("id")
                        if sid:
                            seat_ids.append(sid)
                except Exception:
                    pass

        if len(seat_ids) < 1:
            return

        # 4) Post booking
        payload = {
            "user_id": USER_ID,
            "showtime_id": showtime_id,
            "status": "Pending",
            "seat_ids": seat_ids,
        }
        self.client.post(BASE_BOOKINGS_PATH, json=payload, name="POST /api/bookings", catch_response=True)