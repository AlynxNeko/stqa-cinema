Feature: Cinema Booking System Testing
    As a cinema booking application user
    I want to manage bookings and films in the application
    So that I can book tickets and manage them effectively

    Background:
        Given I am on the home page

    Scenario: User authentication flow
        When I click on sign up link
        And I fill in registration name "Test User"
        And I fill in registration email "testuser9@example.com"
        And I fill in registration password "test123"
        And I click create account button
        Then I should see registration success
        When I login with email "testuser9@example.com" and password "test123"
        Then I should be redirected to "/films"
        When I click logout
        Then I should be redirected to "/login"

    Scenario: Login with invalid email
        When I login with email "wrong@email.com" and password "anything"
        Then I should see error message "Invalid credentials"

    Scenario: Login with invalid password
        When I login with email "test@example.com" and password "wrongpass"
        Then I should see error message "Invalid credentials"

    Scenario: User successfully books a ticket
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I search for film "Wicked"
        And I click book now on film "Wicked"
        And I select seat "C5"
        And I select seat "C6"
        And I click continue to checkout
        And I upload payment proof
        And I click confirm booking
        Then booking should be created
        And I should see success message

    Scenario: User filters films by genre
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I filter by genre "Action"
        Then I should see only "Action" films

    Scenario: User sorts films by duration
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I sort by "Duration"
        Then films should be ordered by duration ascending

    Scenario: Search for non-existent film
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I search for film "lalala"
        Then I should see no results

    Scenario: Admin approves a booking
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I search for film "Sampai Titik Terakhirmu"
        And I click book now on film "Sampai Titik Terakhirmu"
        And I select seat "A3"
        And I click continue to checkout
        And I upload payment proof
        And I click confirm booking
        Then booking should be created
        And I should see success message

        Given I am logged in as "admin@cinema.com"
        When I navigate to admin bookings page
        And I approve the booking
        Then I should see booking status "Confirmed"

    Scenario: Admin rejects a booking
        Given I am logged in as "testuser9@example.com"
        And I am on the films page
        When I search for film "Pengin Hijrah"
        And I click book now on film "Pengin Hijrah"
        And I select seat "B5"
        And I click continue to checkout
        And I upload payment proof
        And I click confirm booking
        Then booking should be created
        And I should see success message

        Given I am logged in as "admin@cinema.com"
        When I navigate to admin bookings page
        And I reject the booking
        Then I should see booking status "Rejected"

    Scenario: Admin creates a new film
        Given I am logged in as "admin@cinema.com"
        And I am on the films management page
        When I click add film button
        And I fill in film title "Test Movie"
        And I fill in film genre "Action"
        And I fill in film duration "120"
        And I fill in film rating "8.5"
        And I fill in film poster url "https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
        And I fill in film description "A test movie for UAT"
        And I submit the film form
        Then I should see the new film in the list

    Scenario: Admin edits a film
        Given I am logged in as "admin@cinema.com"
        And I am on the films management page
        When I click edit on the film "Test Movie"
        And I update film title to "Test Movie Updated"
        And I submit the film form
        Then I should see "Test Movie Updated" in the films list

    Scenario: Admin deletes a film
        Given I am logged in as "admin@cinema.com"
        And I am on the films management page
        When I click delete on the film "Test Movie Updated"
        And I confirm deletion
        Then the film should be removed from the list

    Scenario: Admin adds a new showtime
        Given I am logged in as "admin@cinema.com"
        And I am on the showtimes management page
        When I click add showtime button
        And I select film "Wicked"
        And I select studio "Studio 1"
        And I set date to "2025-12-25"
        And I set time to "14:00"
        And I set price to "50000"
        And I submit the showtime form
        Then I should see the new showtime in the list

    Scenario: Admin deletes a showtime
        Given I am logged in as "admin@cinema.com"
        And I am on the showtimes management page
        And a showtime exists for film "Wicked"
        When I click delete on the showtime
        And I confirm deletion
        Then the showtime should be removed from the list

    Scenario: Unauthenticated access protection
        When I navigate to "/films" directly
        Then I should be redirected to "/login"
        When I navigate to "/admin/dashboard" directly
        Then I should be redirected to "/login"
