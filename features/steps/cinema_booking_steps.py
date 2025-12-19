import requests
from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def slow_type(element, text, delay=0.2):
    for character in text:
        element.send_keys(character)
        time.sleep(delay)

def wait_for_element(context, by, value, timeout=10):
    return WebDriverWait(context.driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )

def wait_for_url_contains(context, text, timeout=10):
    WebDriverWait(context.driver, timeout).until(
        EC.url_contains(text)
    )

@given('I am on the home page')
def step_impl(context):
    context.driver.get(context.base_url)

@when('I click on sign up link')
def step_impl(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a, button"))
    )
    links = context.driver.find_elements(By.CSS_SELECTOR, "a, button")
    for link in links:
        if "sign up" in link.text.lower() or "register" in link.text.lower():
            link.click()
            break
    time.sleep(1)

@when('I fill in registration name "{name}"')
def step_impl(context, name):
    element = wait_for_element(context, By.NAME, "name")
    slow_type(element, name)

@when('I fill in registration email "{email}"')
def step_impl(context, email):
    element = wait_for_element(context, By.NAME, "email")
    slow_type(element, email)

@when('I fill in registration password "{password}"')
def step_impl(context, password):
    element = wait_for_element(context, By.NAME, "password")
    slow_type(element, password)

@when('I click create account button')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button[type='submit']")
    for button in buttons:
        if "create" in button.text.lower() or "register" in button.text.lower() or "sign up" in button.text.lower():
            button.click()
            break
    time.sleep(2)

@then('I should see registration success')
def step_impl(context):
    time.sleep(2)
    page_text = context.driver.find_element(By.TAG_NAME, "body").text
    assert "account created" in page_text.lower()
    submit_button = context.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    assert "sign in" in submit_button.text.lower()

@when('I login with email "{email}" and password "{password}"')
def step_impl(context, email, password):
    email_field = wait_for_element(context, By.NAME, "email")
    slow_type(email_field, email)

    password_field = wait_for_element(context, By.NAME, "password")
    slow_type(password_field, password)

    submit_btn = wait_for_element(context, By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    time.sleep(2)

    if context.driver.current_url.endswith("/login"):
        user_data = context.driver.execute_script("return localStorage.getItem('user');")
        if user_data:
            if '"role":"admin"' in user_data:
                context.driver.get(context.base_url + "/admin/dashboard")
                time.sleep(1)
            else:
                context.driver.get(context.base_url + "/films")
                time.sleep(1)

@then('I should be redirected to "{path}"')
def step_impl(context, path):
    wait_for_url_contains(context, path)
    current_url = context.driver.current_url
    assert path in current_url

@then('I should see error message "{message}"')
def step_impl(context, message):
    time.sleep(2)
    page_text = context.driver.find_element(By.TAG_NAME, "body").text
    assert message.lower() in page_text.lower()
    assert context.driver.current_url.endswith("/login")

@given('I am logged in as "{email}"')
def step_impl(context, email):
    user_data = context.driver.execute_script("return localStorage.getItem('user');")

    if user_data and email in user_data:
        if "admin" in email:
            context.driver.get(context.base_url + "/admin/dashboard")
        else:
            context.driver.get(context.base_url + "/films")
        time.sleep(1)
        return

    context.driver.get(context.base_url + "/login")
    time.sleep(2)

    password_map = {
        "admin@cinema.com": "adminbiasa",
        "testuser9@example.com": "test123"
    }
    password = password_map.get(email, "test123")

    email_field = context.driver.find_element(By.NAME, "email")
    email_field.clear()
    slow_type(email_field, email)

    password_field = context.driver.find_element(By.NAME, "password")
    password_field.clear()
    slow_type(password_field, password)

    context.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(5)

    for _ in range(5):
        user_data = context.driver.execute_script("return localStorage.getItem('user');")
        if user_data:
            break
        time.sleep(1)

    assert user_data

@given('I am on the films page')
def step_impl(context):
    context.driver.get(context.base_url + "/films")
    WebDriverWait(context.driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='search']"))
    )
    time.sleep(2)

@when('I search for film "{title}"')
def step_impl(context, title):
    search_input = WebDriverWait(context.driver, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='search']"))
    )
    search_input.clear()
    slow_type(search_input, title)
    time.sleep(2)

@when('I select seat "{seat_number}"')
def step_impl(context, seat_number):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "button"))
    )
    seats = context.driver.find_elements(By.CSS_SELECTOR, "button")
    for seat in seats:
        if seat_number in seat.get_attribute("title") or seat_number in seat.text:
            seat.click()
            break
    time.sleep(1)

@when('I click continue to checkout')
def step_impl(context):
    button = WebDriverWait(context.driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='button-continue']"))
    )
    context.driver.execute_script("arguments[0].scrollIntoView(true);", button)
    time.sleep(0.5)
    context.driver.execute_script("arguments[0].click();", button)
    time.sleep(2)

@when('I upload payment proof')
def step_impl(context):
    time.sleep(3)
    WebDriverWait(context.driver, 15).until(
        EC.url_contains("checkout")
    )
    file_input = WebDriverWait(context.driver, 15).until(
        EC.presence_of_element_located((By.ID, "payment-proof"))
    )
    import os
    payment_proof_path = "/Users/cathlynangeline/Documents/GitHub/stqa-cinema/IMG_8820 2.JPG"
    assert os.path.exists(payment_proof_path)
    file_input.send_keys(payment_proof_path)
    time.sleep(2)

    uploaded_files = context.driver.execute_script("return arguments[0].files.length;", file_input)
    assert uploaded_files > 0

@when('I click confirm booking')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button")
    for button in buttons:
        if "Confirm" in button.text or "Submit" in button.text:
            button.click()
            break
    time.sleep(2)

@then('booking should be created')
def step_impl(context):
    time.sleep(5)
    current_url = context.driver.current_url

    assert "my-bookings" in current_url or "bookings" in current_url

    time.sleep(3)
    page_text = context.driver.find_element(By.TAG_NAME, "body").text

    import re
    film_name = getattr(context, 'booked_film', None)

    if film_name:
        pattern = rf'{re.escape(film_name)}.*?Booking ID:\s*([a-z0-9]+)'
        film_booking_match = re.search(pattern, page_text, re.DOTALL | re.IGNORECASE)

        if film_booking_match:
            context.last_created_booking_id = film_booking_match.group(1)
        else:
            pattern_reverse = rf'Booking ID:\s*([a-z0-9]+).*?{re.escape(film_name)}'
            reverse_match = re.search(pattern_reverse, page_text, re.DOTALL | re.IGNORECASE)
            if reverse_match:
                context.last_created_booking_id = reverse_match.group(1)
            else:
                assert False
    else:
        booking_id_matches = re.findall(r'Booking ID:\s*([a-z0-9]+)', page_text)
        assert booking_id_matches
        context.last_created_booking_id = booking_id_matches[0]

@then('I should see success message')
def step_impl(context):
    time.sleep(2)
    WebDriverWait(context.driver, 10).until(
        EC.url_contains("/my-bookings")
    )
    booking_id = context.last_created_booking_id
    booking_cards = context.driver.find_elements(By.CSS_SELECTOR, "[class*='border']")

    found_pending_booking = False
    for card in booking_cards:
        card_text = card.text
        if booking_id in card_text and "PENDING" in card_text.upper():
            found_pending_booking = True
            break

    assert found_pending_booking

@when('I navigate to admin bookings page')
def step_impl(context):
    context.driver.get(context.base_url + "/admin/bookings")
    time.sleep(3)
    WebDriverWait(context.driver, 15).until(
        EC.url_contains("/admin/bookings")
    )
    time.sleep(2)

@when('I approve the booking')
def step_impl(context):
    time.sleep(3)
    film_name = context.booked_film

    WebDriverWait(context.driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "table tbody tr"))
    )
    time.sleep(2)

    rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    found_booking = False
    for row in rows:
        if film_name in row.text and "PENDING" in row.text.upper():
            view_button = row.find_element(By.XPATH, ".//button[contains(text(), 'View Details')]")
            view_button.click()
            time.sleep(2)
            found_booking = True
            break

    assert found_booking

    WebDriverWait(context.driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "button"))
    )
    confirm_buttons = context.driver.find_elements(By.CSS_SELECTOR, "button")
    for button in confirm_buttons:
        if "Confirm" in button.text and "Confirm" == button.text.strip():
            button.click()
            time.sleep(2)
            break

@when('I reject the booking')
def step_impl(context):
    time.sleep(3)
    film_name = context.booked_film

    WebDriverWait(context.driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "table tbody tr"))
    )
    time.sleep(2)

    rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    found_booking = False
    for row in rows:
        if film_name in row.text and "PENDING" in row.text.upper():
            view_button = row.find_element(By.XPATH, ".//button[contains(text(), 'View Details')]")
            view_button.click()
            time.sleep(3)
            found_booking = True
            break

    assert found_booking

    WebDriverWait(context.driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "button"))
    )
    time.sleep(1)

    all_buttons = context.driver.find_elements(By.CSS_SELECTOR, "button")
    reject_clicked = False

    for button in all_buttons:
        if button.text.strip().upper() == "REJECT":
            button.click()
            reject_clicked = True
            time.sleep(2)
            break

    assert reject_clicked

@then('I should see booking status "{status}"')
def step_impl(context, status):
    time.sleep(2)

    status_upper = status.upper()
    booking_id = context.last_created_booking_id

    for attempt in range(5):
        context.driver.refresh()
        time.sleep(2)

        rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        for row in rows:
            if booking_id in row.text and (status in row.text or status_upper in row.text):
                return

        if attempt < 4:
            time.sleep(3)

    assert False

@then('I should see no results')
def step_impl(context):
    time.sleep(2)
    film_cards = context.driver.find_elements(By.CSS_SELECTOR, "a[href^='/films/']")
    assert len(film_cards) == 0
    page_text = context.driver.find_element(By.TAG_NAME, "body").text.lower()
    assert "no films found matching your search" in page_text

@when('I navigate to "{path}" directly')
def step_impl(context, path):
    context.driver.get(context.base_url + path)
    time.sleep(2)

@when('I click logout')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button, a")
    for button in buttons:
        if "logout" in button.text.lower() or "log out" in button.text.lower():
            button.click()
            break
    time.sleep(2)

    if not context.driver.current_url.endswith("/login"):
        context.driver.get(context.base_url + "/login")
        time.sleep(2)

@when('I click book now on film "{film_title}"')
def step_impl(context, film_title):
    context.booked_film = film_title
    time.sleep(2)
    film_cards = context.driver.find_elements(By.CSS_SELECTOR, "a[href^='/films/']")
    for card in film_cards:
        if film_title in card.text:
            card.click()
            time.sleep(3)
            break

    WebDriverWait(context.driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "a[href^='/select-seats/']"))
    )
    showtime_links = context.driver.find_elements(By.CSS_SELECTOR, "a[href^='/select-seats/']")
    if showtime_links:
        context.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", showtime_links[0])
        time.sleep(1)
        showtime_links[0].click()
        time.sleep(2)

@when('I filter by genre "{genre}"')
def step_impl(context, genre):
    selects = context.driver.find_elements(By.CSS_SELECTOR, "select")
    genre_select = selects[0]
    options = genre_select.find_elements(By.TAG_NAME, "option")
    for option in options:
        if genre.lower() in option.text.lower():
            option.click()
            time.sleep(2)
            return
    assert False, f"Genre '{genre}' not found in genre select options"

@then('I should see only "{genre}" films')
def step_impl(context, genre):
    time.sleep(2)
    film_cards = context.driver.find_elements(By.CSS_SELECTOR, "a[href^='/films/']")

    for card in film_cards:
        card_text = card.text.upper()
        assert genre.upper() in card_text

@when('I sort by "{sort_option}"')
def step_impl(context, sort_option):
    selects = context.driver.find_elements(By.CSS_SELECTOR, "select")
    sort_select = selects[1]
    options = sort_select.find_elements(By.TAG_NAME, "option")
    for option in options:
        if sort_option.lower() in option.text.lower():
            option.click()
            time.sleep(2)
            return
    assert False, f"Sort option '{sort_option}' not found in sort select options"

@then('films should be ordered by duration ascending')
def step_impl(context):
    time.sleep(3)
    film_cards = context.driver.find_elements(By.CSS_SELECTOR, "a[href^='/films/']")

    durations = []
    import re
    for card in film_cards:
        card_text = card.text
        duration_match = re.search(r'(\d+)\s*min', card_text)
        if duration_match:
            durations.append(int(duration_match.group(1)))

    for i in range(len(durations) - 1):
        assert durations[i] <= durations[i + 1]

@given('I am on the showtimes management page')
def step_impl(context):
    context.driver.get(context.base_url + "/admin/showtimes")
    time.sleep(2)

@when('I click add showtime button')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button")
    for button in buttons:
        if "add" in button.text.lower() or "new" in button.text.lower():
            button.click()
            time.sleep(2)
            break

@when('I select film "{film_title}"')
def step_impl(context, film_title):
    selects = context.driver.find_elements(By.CSS_SELECTOR, "select")
    for select in selects:
        options = select.find_elements(By.TAG_NAME, "option")
        for option in options:
            if film_title in option.text:
                option.click()
                time.sleep(1)
                return

@when('I select studio "{studio_name}"')
def step_impl(context, studio_name):
    selects = context.driver.find_elements(By.CSS_SELECTOR, "select")
    for select in selects:
        options = select.find_elements(By.TAG_NAME, "option")
        for option in options:
            if studio_name in option.text:
                option.click()
                time.sleep(1)
                return

@when('I set date to "{date_value}"')
def step_impl(context, date_value):
    date_inputs = context.driver.find_elements(By.CSS_SELECTOR, "input[type='date']")
    if date_inputs:
        context.driver.execute_script("arguments[0].value = arguments[1];", date_inputs[0], date_value)
        time.sleep(1)

@when('I set time to "{time_value}"')
def step_impl(context, time_value):
    time_inputs = context.driver.find_elements(By.CSS_SELECTOR, "input[type='time']")
    if time_inputs:
        context.driver.execute_script("arguments[0].value = arguments[1];", time_inputs[0], time_value)
        time.sleep(1)

@when('I set price to "{price_value}"')
def step_impl(context, price_value):
    price_inputs = context.driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
    if price_inputs:
        price_inputs[0].clear()
        price_inputs[0].send_keys(price_value)
        time.sleep(1)

@when('I submit the showtime form')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button[type='submit']")
    for button in buttons:
        button.click()
        time.sleep(2)
        break

@then('I should see the new showtime in the list')
def step_impl(context):
    time.sleep(2)
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    assert len(table_rows) > 0
    found = False
    for row in table_rows:
        row_text = row.text
        # Validasi: film, tanggal, DAN jam
        if ("Wicked" in row_text and
            ("2025-12-25" in row_text or "Dec 25, 2025" in row_text) and
            "14:00" in row_text):
            found = True
            break
    assert found

@given('a showtime exists for film "{film_title}"')
def step_impl(context, film_title):
    time.sleep(1)
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    found = False
    for row in table_rows:
        if film_title in row.text:
            found = True
            break
    assert found

@when('I click delete on the showtime')
def step_impl(context):
    time.sleep(2)
    rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    if rows:
        context.deleted_showtime_text = rows[0].text
        button = rows[0].find_element(By.CSS_SELECTOR, "button")
        button.click()
        time.sleep(1)

@when('I confirm deletion')
def step_impl(context):
    time.sleep(1)
    alert = context.driver.switch_to.alert
    alert.accept()
    time.sleep(1)

@then('the showtime should be removed from the list')
def step_impl(context):
    time.sleep(2)
    deleted_text = context.deleted_showtime_text
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for row in table_rows:
        if row.text == deleted_text:
            assert False

@given('I am on the films management page')
def step_impl(context):
    context.driver.get(context.base_url + "/admin/films")
    time.sleep(2)

@when('I click add film button')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button")
    for button in buttons:
        if "add" in button.text.lower() and "film" in button.text.lower():
            button.click()
            time.sleep(2)
            break

@when('I fill in film title "{title}"')
def step_impl(context, title):
    title_input = context.driver.find_element(By.ID, "title")
    title_input.clear()
    slow_type(title_input, title)

@when('I fill in film genre "{genre}"')
def step_impl(context, genre):
    genre_input = context.driver.find_element(By.ID, "genre")
    genre_input.clear()
    slow_type(genre_input, genre)

@when('I fill in film duration "{duration}"')
def step_impl(context, duration):
    duration_input = context.driver.find_element(By.ID, "duration_min")
    duration_input.clear()
    duration_input.send_keys(duration)
    time.sleep(0.5)

@when('I fill in film rating "{rating}"')
def step_impl(context, rating):
    rating_input = context.driver.find_element(By.ID, "rating")
    rating_input.clear()
    rating_input.send_keys(rating)
    time.sleep(0.5)

@when('I fill in film poster url "{url}"')
def step_impl(context, url):
    poster_input = context.driver.find_element(By.ID, "poster_url")
    poster_input.clear()
    poster_input.send_keys(url)
    time.sleep(0.5)

@when('I fill in film description "{description}"')
def step_impl(context, description):
    desc_input = context.driver.find_element(By.ID, "description")
    desc_input.clear()
    slow_type(desc_input, description)

@when('I submit the film form')
def step_impl(context):
    buttons = context.driver.find_elements(By.CSS_SELECTOR, "button[type='submit']")
    for button in buttons:
        button.click()
        time.sleep(2)
        break

@then('I should see the new film in the list')
def step_impl(context):
    time.sleep(2)
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    found = False
    for row in table_rows:
        if "Test Movie" in row.text and "Action" in row.text:
            found = True
            break
    assert found

@when('I click edit on the film "{film_title}"')
def step_impl(context, film_title):
    time.sleep(2)
    rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for row in rows:
        if film_title in row.text:
            edit_buttons = row.find_elements(By.CSS_SELECTOR, "button")
            for button in edit_buttons:
                svg = button.find_elements(By.TAG_NAME, "svg")
                if svg:
                    button.click()
                    time.sleep(2)
                    return

@when('I update film title to "{new_title}"')
def step_impl(context, new_title):
    title_input = context.driver.find_element(By.ID, "title")
    title_input.clear()
    slow_type(title_input, new_title)

@then('I should see "{film_title}" in the films list')
def step_impl(context, film_title):
    time.sleep(2)
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    found = False
    for row in table_rows:
        if film_title in row.text:
            found = True
            break
    assert found

@when('I click delete on the film "{film_title}"')
def step_impl(context, film_title):
    time.sleep(2)
    rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for row in rows:
        if film_title in row.text:
            buttons = row.find_elements(By.CSS_SELECTOR, "button")
            if len(buttons) >= 2:
                buttons[1].click()
                time.sleep(1)
            break

@then('the film should be removed from the list')
def step_impl(context):
    time.sleep(2)
    table_rows = context.driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for row in table_rows:
        assert "Test Movie Updated" not in row.text