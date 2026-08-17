from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    
    Returns:
        dict: The health status and version.
    """
    return {"status": "healthy", "version": "0.1.0"}
