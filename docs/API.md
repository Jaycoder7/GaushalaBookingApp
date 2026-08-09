# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Exchange the Google credential for an application token:

```http
POST /api/admin/auth/google
Content-Type: application/json

{ "credential": "google_identity_credential" }
```

All other admin routes require the returned application token:
```
Authorization: Bearer {application_token}
```

## Endpoints

### Public

#### Get Available Slots
```
GET /api/slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Response:
{
  "slots": [
    {
      "id": "uuid",
      "date": "2024-07-25",
      "startTime": "09:00",
      "endTime": "10:00",
      "familyCapacity": 6,
      "familyBookingsCount": 3,
      "remainingCapacity": 3,
      "status": "open"
    }
  ]
}
```

#### Create Booking
```
POST /api/bookings

Body:
{
  "slotId": "uuid",
  "familyName": "Smith",
  "phone": "+1234567890",
  "email": "john@example.com",
  "headcount": 4,
  "note": "optional notes",
  "captchaToken": "hcaptcha_token"
}

Response:
{
  "id": "uuid",
  "status": "confirmed",
  "cancellationToken": "uuid",
  "cancellationLink": "https://app.com/cancel/uuid"
}
```

#### Get Booking (via cancellation token)
```
GET /api/bookings/{cancellationToken}

Response:
{
  "id": "uuid",
  "familyName": "Smith",
  "phone": "+1234567890",
  "email": "john@example.com",
  "headcount": 4,
  "slotDate": "2024-07-25",
  "slotTime": "09:00 - 10:00",
  "status": "confirmed"
}
```

#### Cancel Booking
```
DELETE /api/bookings/{cancellationToken}

Response:
{
  "status": "cancelled",
  "cancelledAt": "2024-07-24T10:30:00Z"
}
```

### Admin (Protected)

#### Dashboard summary
```
GET /api/admin/summary
```

#### List Bookings
```
GET /api/admin/bookings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=confirmed

Response:
{
  "bookings": [
    {
      "id": "uuid",
      "familyName": "Smith",
      "phone": "+1234567890",
      "headcount": 4,
      "slotDate": "2024-07-25",
      "slotTime": "09:00 - 10:00",
      "status": "confirmed",
      "createdAt": "2024-07-24T10:00:00Z"
    }
  ]
}
```

#### Create/Update Slot Template
```

#### Manual booking
```
POST /api/admin/bookings

Body:
{
  "slotId": "uuid",
  "familyName": "Smith",
  "phone": "+1234567890",
  "email": "john@example.com",
  "headcount": 4,
  "note": "Phone-in visitor"
}
```

#### Change booking status
```
PATCH /api/admin/bookings/{bookingId}/status

Body: { "status": "confirmed" | "cancelled" | "no_show" }
```
POST /api/admin/slot-templates

Body:
{
  "daysOfWeek": [1, 2, 3, 4, 5, 6],
  "startTime": "09:00",
  "endTime": "17:00",
  "slotLengthMinutes": 60,
  "familyCapacityPerSlot": 6,
  "active": true
}

Response:
{
  "id": "uuid",
  "created": "2024-07-24T10:00:00Z"
}
```

#### Block Slot
```
POST /api/admin/slots/{slotId}/block

Body:
{
  "reason": "Holiday"
}

Response:
{
  "status": "blocked"
}
```

Reopen with:
```
DELETE /api/admin/slots/{slotId}/block
```

#### Export Bookings
```
GET /api/admin/bookings/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=csv

Response: CSV file
```
