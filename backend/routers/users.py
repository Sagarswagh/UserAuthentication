from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    
    # Attach role to user object for easy access
    user.role = role
    return user

# Dependency to verify admin role
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

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

# Admin endpoints
@router.get("/users", response_model=list[schemas.UserListResponse])
def get_all_users(db: Session = Depends(database.get_db), admin: models.User = Depends(require_admin)):
    """Get all users - admin only"""
    users = db.query(models.User).all()
    result = []
    for user in users:
        creds = db.query(models.UserCredentials).filter(models.UserCredentials.user_id == user.user_id).first()
        result.append({
            "user_id": user.user_id,
            "email": user.email,
            "phone": user.phone,
            "role": creds.role if creds else "unknown",
            "created_at": user.created_at
        })
    return result

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(database.get_db), admin: models.User = Depends(require_admin)):
    """Delete a user - admin only"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
