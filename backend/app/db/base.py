from app.db.base_class import Base

# Import ALL models here so Alembic can detect them properly

from app.models.user import User
from app.models.monitor import Monitor
from app.models.monitor_run import MonitorRun
from app.models.application import Application
