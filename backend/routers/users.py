from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create User profile
        # Setting username = email to satisfy DB constraint
        new_user = models.User(
            username=user.email, 
            email=user.email,
            phone=user.phone,
            address=user.address
        )
        db.add(new_user)
        db.flush() # Flush to generate user_id

        # Create Credentials
        hashed_password = auth.get_password_hash(user.password)
        new_creds = models.UserCredentials(
            user_id=new_user.user_id,
            password_hash=hashed_password,
            role=user.role
        )
        db.add(new_creds)
        
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=schemas.Token)

def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Find user by email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check credentials
    db_creds = db.query(models.UserCredentials).filter(models.UserCredentials.user_id == db_user.user_id).first()

    # Expect frontend to send role in login payload
    requested_role = getattr(user, 'role', None)

    if not db_creds or not auth.verify_password(user.password, db_creds.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if requested_role and requested_role != db_creds.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Role does not match",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(
        data={"sub": db_user.email, "role": db_creds.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": db_creds.role, "username": db_user.email, "user_id": db_user.user_id}
