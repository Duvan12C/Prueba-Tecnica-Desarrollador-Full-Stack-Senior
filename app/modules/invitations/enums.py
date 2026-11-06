import enum

from sqlalchemy import Enum as SQLAlchemyEnum

class InvitationStatus(enum.Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"