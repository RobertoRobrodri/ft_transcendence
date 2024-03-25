from rest_framework import permissions

class IsLoggedInUser(permissions.BasePermission):
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.id == request.user.id

class Verify2FAPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return '2FA' not in request.auth.payload