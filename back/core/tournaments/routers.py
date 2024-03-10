from rest_framework import routers
from .views import TournamentsViewset

router = routers.SimpleRouter()
router.register('', TournamentsViewset, basename="tournaments")
urlpatterns = router.urls