from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

class Fornecedor(models.Model):
    
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    nome = models.CharField(max_length=100)
    cnpj = models.CharField(max_length=18, blank=True, default='')
    telefone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    endereco = models.TextField(blank=True, default='')
    uuid = models.UUIDField(default=uuid4)
    def __str__(self):
        return self.nome

class Conta(models.Model):
    descricao = models.CharField(max_length=100)
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete = models.SET_NULL,
        null=True,
        blank=True
    )
    valor = models.DecimalField(decimal_places=2,max_digits=10)
    data_emissao=models.DateField()
    data_vencimento = models.DateField()
    categoria = models.TextField()
    uuid = models.UUIDField(default=uuid4)
    def __str__(self):
        return self.descricao

class AtualizacaoConta(models.Model):
    conta = models.ForeignKey(Conta , on_delete=models.CASCADE )
    data = models.DateField(null=True,blank=True)

    pagamento_choices = (
        ('d','Dinheiro/Espécie'),
        ('p','Pix'),
        ('c','Cartão de Crédito'),
        ('b','Cartão de Débito'),
        ('t','Transferência'),
        ('o','Outros')
    )
    pagamento = models.CharField(max_length=1,choices=pagamento_choices,default=None,null=True,blank=True)

    hora = models.TimeField(null=True,blank=True)

    status_choices = (
        ('p','Pendente'),
        ('c','Cancelada'),
        ('f','Finalizada'),
        ('v','Vencida')
    )

    status = models.CharField(max_length=1,choices=status_choices,default='p')
    def __str__(self):
        return f'{self.conta.usuario.first_name} - {self.conta.descricao} - {self.get_status_display()}'
