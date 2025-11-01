from django.contrib import admin
from django.urls import path , include

from . import views

urlpatterns = [
    path('',views.index,name='api'),
    path('painel/',views.painel,name='painel'),
    path('dashboard/',views.dashboard,name='dashboard'),
    path('fornecedores/',views.fornecedores,name='fornecedores'),
    path('getUsername/',views.getUsername,name='getUsername'),
]