from rest_framework import routers
from .views import UserViewset

router = routers.SimpleRouter()
router.register('', UserViewset, basename="users")
urlpatterns = router.urls