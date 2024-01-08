from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Register your models here.
# Used only to manage Django admin site

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'score')  # Fields to display in the admin list
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'score')}),  # Include 'score' and 'profile_picture' in admin edit view
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
admin.site.register(CustomUser, CustomUserAdmin)