from django.shortcuts import render
from django.contrib.auth.models import User
from django.http import JsonResponse , request
import datetime
import json

from core import models

def index(request):
    return JsonResponse({'dados':'dados'}, safe=False)


# função para transformar as datas no formato dd/mm/aaaa
def formatarData(data):
    return data.strftime('%d/%m/%Y')

def painel(request):
    hoje = datetime.date.today()
    user = request.user
    if request.method == 'GET':
        contas_qs = models.Conta.objects.filter(usuario=user)
        contas = []

        for c in contas_qs:
            atualizacao = models.AtualizacaoConta.objects.filter(conta=c).last()
            
            if hoje > c.data_vencimento and atualizacao.status == 'p':
                c.status = 'v'
                c.save()
            
            fornecedor = False
            if c.fornecedor:
                fornecedor = c.fornecedor.nome

            contas.append({
                'valor':c.valor,
                'descricao':c.descricao,
                'categoria':c.categoria,
                'vencimento':formatarData(c.data_vencimento),
                'dias_para_vencer':(c.data_vencimento - hoje).days,
                'emissao':formatarData(c.data_emissao),
                'valor_vencimento':c.data_vencimento,
                'valor_emissao':c.data_emissao,
                'status':atualizacao.status,
                'fornecedor':fornecedor,
                'fornecedor_id':c.fornecedor.uuid if c.fornecedor else '--',
                'uuid':c.uuid,
                'data_status':formatarData(atualizacao.data)
            })

        return JsonResponse(contas,safe=False)
    
    if request.method == 'POST':
        data = json.loads(request.body)
        acao = data['acao']
        usuario = request.user
        print(data)
        
        if acao == 'REGISTRAR':
            conta = models.Conta.objects.create(
            descricao=data['descricao'],
            valor=data['valor'],
            data_emissao=data['data_emissao'],
            data_vencimento=data['data_vencimento'],
            categoria=data['categoria'],
            usuario=usuario,
            fornecedor=models.Fornecedor.objects.get(uuid=data['fornecedor']) if data['fornecedor'] != 'none' else None
            )
            
            status = data['situacao']
            # por favor transforme data_vencimento em data do python
            if hoje > datetime.datetime.strptime(data['data_vencimento'], '%Y-%m-%d').date() and status == 'p' :
                status = 'v'

            models.AtualizacaoConta.objects.create(
                conta=conta,
                data=datetime.date.today(),
                hora = datetime.datetime.now().strftime('%H:%M:%S'),
                status=status
            )

        if acao == "PAGAR":

            conta = models.Conta.objects.get(uuid=data['id'])
            models.AtualizacaoConta.objects.create(
                conta = conta,
                data = datetime.date.today(),
                hora = datetime.datetime.now().strftime('%H:%M:%S'),
                status = 'f'
            )

            return JsonResponse({'id':data['id'],'status':'marco como pago'}, safe=False)

    if request.method == 'DELETE':
        data = json.loads(request.body)
        conta = models.Conta.objects.get(uuid=data,usuario=request.user)
        conta.delete()
        print(data)
    
    if request.method == 'PUT':
        data = json.loads(request.body)
        conta = models.Conta.objects.get(uuid=data['id'],usuario=request.user)
        status = data['situacao']

        # transformando em dado data
        if hoje > datetime.datetime.strptime(data['data_vencimento'], '%Y-%m-%d').date() and status == 'p' :
            status = 'v'

        if models.AtualizacaoConta.objects.filter(conta=conta).last().status != data['situacao']:
            models.AtualizacaoConta.objects.create(
                conta=conta,
                data=datetime.date.today(),
                hora = datetime.datetime.now().strftime('%H:%M:%S'),
                status=status
            )

        conta.descricao=data['descricao']
        conta.valor=data['valor']
        conta.data_emissao=data['data_emissao']
        conta.data_vencimento=data['data_vencimento']
        conta.categoria=data['categoria']
        conta.fornecedor=models.Fornecedor.objects.get(uuid=data['fornecedor']) if data['fornecedor'] != 'none' else None
        conta.save()

    return JsonResponse({'dados':'dados'},safe=False)

def dashboard(request):
    if request.method == 'GET':
        # PEGANDO O TOTAL DE CONTAS REGISTRADAS
        total_contas_registradas = models.Conta.objects.filter(usuario=request.user).count()
        
        contas = models.Conta.objects.filter(usuario=request.user)
        total_pago = [0,0]
        total_a_pagar = [0,0]

        # PEGANDO TOTAL PAGO E A PAGAR
        for conta in contas:
            ultima = models.AtualizacaoConta.objects.filter(conta=conta).last()
            if ultima.status == 'f':
                total_pago[0] += conta.valor
                total_pago[1] +=1
            elif ultima.status == 'p':
                total_a_pagar[0] += conta.valor
                total_a_pagar[1] +=1
        
        atualizacoes_qs = models.AtualizacaoConta.objects.filter(conta__usuario=request.user)
        atualizacoes = []
        for a in atualizacoes_qs:
            atualizacoes.append({
                'conta':a.conta.descricao,
                'status':a.status,
                'data':formatarData(a.data),
                'hora':a.hora,
                'categoria':a.conta.categoria,
                'fornecedor':a.conta.fornecedor.nome if a.conta.fornecedor else '--',
                'uuid':a.conta.uuid
            })

        # ordenando as atualizacoes por data e hora mais recente
        atualizacoes.sort(key=lambda x: (x['data'], x['hora']), reverse=True)

        # chartTotalPorSituacao
        totalPentente, totalVencido, totalFinalizado, totalCancelado = 0, 0, 0, 0
        for conta in contas:
            ultima = models.AtualizacaoConta.objects.filter(conta=conta).last()
            if ultima.status == 'p':
                totalPentente += conta.valor
            elif ultima.status == 'v':
                totalVencido += conta.valor
            elif ultima.status == 'f':
                totalFinalizado += conta.valor
            elif ultima.status == 'c':
                totalCancelado += conta.valor
        chartTotalPorSituacao = {
            'labels':[
                'Pendente', 'Vencido', 'Finalizado', 'Cancelado'
            ],
            'data':[
                totalPentente, totalVencido, totalFinalizado, totalCancelado
            ]
        }

        

        dados = {
            'total_contas_registradas':total_contas_registradas,
            'total_pago':total_pago,
            'total_a_pagar':total_a_pagar,
            'atualizacoes':atualizacoes,
            'chartTotalPorSituacao':chartTotalPorSituacao
        }

        return JsonResponse(dados,safe=False)
    
def fornecedores(request):
    usuario = request.user
    if request.method == 'GET':
        fornecedores_qs = models.Fornecedor.objects.filter(usuario=usuario)
        fornecedores = []
        for f in fornecedores_qs:
            fornecedores.append({
                'nome':f.nome,
                'cnpj':f.cnpj,
                'telefone':f.telefone,
                'email':f.email,
                'endereco':f.endereco,
                'uuid':f.uuid
            })
        return JsonResponse(fornecedores,safe=False)
    if request.method == 'POST':
        data = json.loads(request.body)
        acao = data['acao']
        if acao == 'REGISTRAR':
            models.Fornecedor.objects.create(
                nome=data['nome'],
                cnpj=data['cnpj'],
                telefone=data['telefone'],
                email=data['email'],
                endereco=data['endereco'],
                usuario=usuario
            )
    if request.method == 'DELETE':
        data = json.loads(request.body)
        fornecedor = models.Fornecedor.objects.get(uuid=data,usuario=usuario)
        fornecedor.delete()
        return JsonResponse({'status':'Deletado'},safe=False)

    
    return JsonResponse({'status':'Método não permitido.'},safe=False)