from typing import Optional
from fastapi import APIRouter, Depends
from database import fetch_all, fetch_one, execute_query
from auth import get_optional_user

notification_router = APIRouter(tags=['Notifications'])
notification_bp = notification_router

@notification_router.get('/notifications')
async def get_notifications(current_user: Optional[dict] = Depends(get_optional_user)):
    notifs = fetch_all("SELECT id, user_id, alert_id, title, message, severity, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50")
    unread_res = fetch_one("SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE")
    unread_count = unread_res.get('count', 0) if unread_res else 0
    return {
        'notifications': notifs or [],
        'unread_count': unread_count
    }

@notification_router.put('/notifications/mark-all-read')
@notification_router.put('/notifications/read-all')
async def mark_all_read(current_user: Optional[dict] = Depends(get_optional_user)):
    execute_query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE")
    return {'message': 'All notifications marked as read.'}

@notification_router.put('/notifications/{notif_id}/read')
async def mark_notification_read(notif_id: int, current_user: Optional[dict] = Depends(get_optional_user)):
    execute_query("UPDATE notifications SET is_read = TRUE WHERE id = %s", (notif_id,))
    return {'message': f'Notification #{notif_id} marked as read.'}
