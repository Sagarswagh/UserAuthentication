import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="User Authentication Service")

# Allow ALL origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Allow ANY domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "User Authentication Service is running"}

# Worker placeholder
# @app.on_event("startup")
# async def start_worker():
#     asyncio.create_task(worker())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )