from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models, database
from uuid import UUID

router = APIRouter()

@router.get("/batch")
def get_bookings_batch(
    event_id: UUID,
    offset: int = 0,
    batch_size: int = 5,
    db: Session = Depends(database.get_db)
):
    # Query bookings with user email and event name
    bookings = (
        db.query(models.Booking, models.User.email, models.Event.event_name)
        .outerjoin(models.User, models.Booking.user_id == models.User.user_id)
        .outerjoin(models.Event, models.Booking.event_id == models.Event.event_id)
        .filter(models.Booking.event_id == event_id)
        .offset(offset)
        .limit(batch_size)
        .all()
    )

    # Format response to match original API
    result = []
    for booking, email, event_name in bookings:
        result.append({
            "booking_id": str(booking.booking_id),
            "event_id": str(booking.event_id),
            "user_id": str(booking.user_id),
            "booking_time": booking.booking_time,
            "status": booking.status,
            "event_name": event_name or "Unknown",
            "user_email": email or "Unknown"
        })
    
    return result
