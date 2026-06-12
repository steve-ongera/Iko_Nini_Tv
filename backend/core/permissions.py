from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow users to edit only their own objects."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if obj has user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For cart items, check through cart
        if hasattr(obj, 'cart'):
            if obj.cart.user:
                return obj.cart.user == request.user
        
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow only admin users to write."""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff