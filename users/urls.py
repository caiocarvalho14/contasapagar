from django.contrib import admin
from django.urls import path , include

from . import views

urlpatterns = [
    path('perfil/',views.perfil,name='perfil'),
    path('login/', views.login_view, name='login'),
    path('cadastro/', views.cadastrar_usuario, name='cadastro'),
    path('logout',views.logout_view,name='logout')
]