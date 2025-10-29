from django.contrib import admin
from django.urls import path , include
from . import views

urlpatterns = [
    path('',views.inicio,name='inicio'),
    path('painel',views.painel,name='painel'),
    path('fornecedores',views.fornecedor,name='fornecedor'),
]