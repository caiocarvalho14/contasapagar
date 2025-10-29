from django.shortcuts import render
from django.http import JsonResponse , HttpResponse
from django.contrib.auth.decorators import login_required
# Create your views here.

@login_required
def inicio(request):
    return render(request, 'index.html')

@login_required
def painel(request):
    return render(request, 'painel.html')

@login_required
def fornecedor(request):
    return render(request, 'fornecedores.html')