from rest_framework import routers
from .views import FriendRequestViewset

router = routers.SimpleRouter()
router.register('', FriendRequestViewset, basename="friend_request")
urlpatterns = router.urls