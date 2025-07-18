# Analytics

This document outlines the events tracked in the application for analytics purposes.

## Events

### Chat

- **`send_message`**: Fired when a user sends a message in the chat.
  - **Category**: `chat`
  - **Label**: `chat_message`
  - **Value**: `1`

- **`starter_prompt`**: Fired when a user clicks on a starter prompt.
  - **Category**: `chat`
  - **Label**: The text of the prompt that was clicked.
  - **Value**: `1`

### Flights

- **`flight_search`**: Fired when a user initiates a flight search.
  - **Category**: `flights`
  - **Label**: `start_search`
  - **Value**: `1`

- **`view_flight_details`**: Fired when a user expands a flight card to view the details.
  - **Category**: `flights`
  - **Label**: The ID of the flight.
  - **Value**: `1`

### Booking

- **`book_flight`**: Fired when a user clicks the "Book Now" button for a flight.
  - **Category**: `booking`
  - **Label**: The ID of the flight being booked.
  - **Value**: `1` 