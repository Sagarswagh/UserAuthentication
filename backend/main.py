import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="User Authentication Service")

# Allow CORS for React frontend
origins = ["*"]  # Allow all origins for simplicity; adjust in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "User Authentication Service is running"}

# Uncomment when you add a worker module
# @app.on_event("startup")
# async def start_worker():
#     asyncio.create_task(worker())  # run worker in background

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
