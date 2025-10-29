from django.contrib import admin
from django.urls import path , include

from users.views import perfil

urlpatterns = [
    path('admin/', admin.site.urls),

    
    path('perfil/',perfil,name='perfil'),

    path('api/', include('api.urls')),

    path('',include('users.urls')),
    path('',include('core.urls')),
]