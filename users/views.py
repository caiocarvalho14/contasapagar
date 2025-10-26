from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.models import User
import unicodedata

# Create your views here.

def perfil(request):
    return render(request,'perfil.html')

def login_view(request):
    if request.method == 'POST':
        usuario = request.POST.get('usuario')
        senha = request.POST.get('senha')
        print(usuario,senha)

        user = authenticate(request, username=usuario, password=senha)

        if user is not None:
            login(request, user)
            return redirect('/')
        
        else:
            messages.error(request,'Usuário ou senha inválidos')
            return redirect('login')

    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

def gerar_username(nome):
    # Remove acentos e espaços do nome
    nome_normalizado = unicodedata.normalize('NFKD', nome).encode('ASCII', 'ignore').decode('ASCII')
    username_base = ''.join(nome_normalizado.lower().split())  # Ex: "Caio Carvalho" -> "caiocarvalho"

    username = username_base
    contador = 1

    # Se já existir o username, adiciona número incremental
    while User.objects.filter(username=username).exists():
        username = f"{username_base}{contador}"
        contador += 1

    return username


def cadastrar_usuario(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        senha = request.POST.get('senha')

        if not nome or not email or not senha:
            messages.error(request, 'Preencha todos os campos!')
            return redirect('cadastro')

        # Gera username automaticamente
        username = gerar_username(nome)

        # Cria o novo usuário
        user = User.objects.create_user(
            username=username,
            email=email,
            password=senha,
            first_name=nome  # salva o nome completo no campo first_name
        )
        user.save()

        messages.success(request, f'Conta criada com sucesso! Seu usuário é: {username}')
        return redirect('login')

    return render(request, 'cadastro.html')

