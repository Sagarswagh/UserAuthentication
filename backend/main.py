from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, bookings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow CORS for React frontend
# origins = [
#     "http://localhost:5173", # Default Vite port
#     "http://localhost:5174",
#     "http://localhost:3000",
# ]
origins = ["*"]  # Allow all origins for simplicity; adjust in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def read_root():
    return {"message": "User Authentication Service is running"}
