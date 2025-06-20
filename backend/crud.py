from sqlalchemy.orm import Session
from models.image_record import ImageRecord
from models.user import User
from schemas import ImageRecordCreate, UserCreate

def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_image_record(db: Session, record: ImageRecordCreate) -> ImageRecord:
    db_record = ImageRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def get_images_by_user(db: Session, user_id: int) -> list[ImageRecord]:
    return (
        db.query(ImageRecord)
        .filter(ImageRecord.user_id == user_id)
        .order_by(ImageRecord.created_at.desc())
        .all()
    )

def get_all_records(db: Session) -> list[ImageRecord]:
    return (
        db.query(ImageRecord)
        .order_by(ImageRecord.created_at.desc())
        .all()
    )