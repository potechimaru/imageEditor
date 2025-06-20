# models.py
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from db import Base

class ImageRecord(Base):
    __tablename__ = "generated_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
