from django.contrib import admin

# Register your models here.

from . import models

admin.site.register(models.Conta)
admin.site.register(models.AtualizacaoConta)
admin.site.register(models.Fornecedor)