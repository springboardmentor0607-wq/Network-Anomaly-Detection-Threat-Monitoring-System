"""
Role-Based Access Control (RBAC) module
Provides decorators and utilities for role-based endpoint protection
"""
from typing import List, Callable, Any
from functools import wraps
from fastapi import HTTPException, status, Depends
from app.models.user import User
from app.models.role import RoleEnum
from app.core.permissions import get_current_user


def check_role(required_roles: List[RoleEnum]) -> Callable:
    """
    Decorator to check if user has one of the required roles
    
    Usage:
        @router.get("/admin-only")
        @check_role([RoleEnum.ADMIN])
        def admin_endpoint(current_user: User = Depends(get_current_user)):
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get('current_user')
            if not current_user or current_user.role.name not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User role '{current_user.role.name if current_user else 'UNKNOWN'}' does not have permission to access this resource"
                )
            return await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
        return wrapper
    return decorator


class RoleChecker:
    """
    Utility class for role-based access checks
    """
    
    @staticmethod
    def has_role(user: User, required_role: RoleEnum) -> bool:
        """Check if user has specific role"""
        return user.role.name == required_role
    
    @staticmethod
    def has_any_role(user: User, required_roles: List[RoleEnum]) -> bool:
        """Check if user has any of the required roles"""
        return user.role.name in required_roles
    
    @staticmethod
    def is_admin(user: User) -> bool:
        """Check if user is admin"""
        return user.role.name == RoleEnum.ADMIN
    
    @staticmethod
    def is_soc_manager(user: User) -> bool:
        """Check if user is SOC manager"""
        return user.role.name == RoleEnum.SOC_MANAGER
    
    @staticmethod
    def is_analyst(user: User) -> bool:
        """Check if user is security analyst"""
        return user.role.name == RoleEnum.SECURITY_ANALYST
    
    @staticmethod
    def is_viewer(user: User) -> bool:
        """Check if user is viewer"""
        return user.role.name == RoleEnum.VIEWER
    
    @staticmethod
    def can_edit(user: User) -> bool:
        """Check if user can edit resources"""
        return user.role.name in [RoleEnum.ADMIN, RoleEnum.SOC_MANAGER]
    
    @staticmethod
    def can_manage_users(user: User) -> bool:
        """Check if user can manage other users"""
        return user.role.name == RoleEnum.ADMIN
    
    @staticmethod
    def can_view_reports(user: User) -> bool:
        """Check if user can view reports"""
        return user.role.name in [RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST, RoleEnum.VIEWER]
    
    @staticmethod
    def can_create_incidents(user: User) -> bool:
        """Check if user can create incidents"""
        return user.role.name in [RoleEnum.ADMIN, RoleEnum.SOC_MANAGER, RoleEnum.SECURITY_ANALYST]


# Role permission matrix
ROLE_PERMISSIONS = {
    'ADMIN': {
        'users': ['read', 'create', 'update', 'delete'],
        'alerts': ['read', 'create', 'update', 'delete'],
        'incidents': ['read', 'create', 'update', 'delete'],
        'anomalies': ['read'],
        'predictions': ['read'],
        'reports': ['read', 'create', 'delete'],
        'settings': ['read', 'update'],
        'audit_logs': ['read'],
        'models': ['read', 'update'],
        'datasets': ['read', 'update'],
    },
    'SOC_MANAGER': {
        'users': ['read'],
        'alerts': ['read', 'update'],
        'incidents': ['read', 'create', 'update'],
        'anomalies': ['read'],
        'predictions': ['read'],
        'reports': ['read', 'create'],
        'settings': ['read'],
        'audit_logs': ['read'],
        'models': ['read'],
        'datasets': ['read'],
    },
    'SECURITY_ANALYST': {
        'users': [],
        'alerts': ['read', 'update'],
        'incidents': ['read', 'create', 'update'],
        'anomalies': ['read'],
        'predictions': ['read'],
        'reports': ['read'],
        'settings': [],
        'audit_logs': [],
        'models': [],
        'datasets': [],
    },
    'VIEWER': {
        'users': [],
        'alerts': ['read'],
        'incidents': ['read'],
        'anomalies': ['read'],
        'predictions': ['read'],
        'reports': ['read'],
        'settings': [],
        'audit_logs': [],
        'models': [],
        'datasets': [],
    },
}


def check_resource_permission(resource: str, action: str) -> Callable:
    """
    Check if user has permission to perform action on resource
    
    Usage:
        @router.delete("/alerts/{id}")
        def delete_alert(
            id: uuid.UUID,
            db: Session = Depends(get_db),
            current_user: User = Depends(check_resource_permission("alerts", "delete"))
        ):
            pass
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.name
        if user_role not in ROLE_PERMISSIONS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unknown user role"
            )
        
        permissions = ROLE_PERMISSIONS[user_role].get(resource, [])
        if action not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user_role}' does not have '{action}' permission on '{resource}'"
            )
        return current_user
    
    return role_checker
