from fastapi import APIRouter

from app.api.routes import auth, jobs, metrics, projects, queues, workers

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(queues.router, prefix="/queues", tags=["Queues"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(workers.router, prefix="/workers", tags=["Workers"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
