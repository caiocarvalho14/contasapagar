from django.shortcuts import render
from django.contrib.auth.models import User
import calendar
import locale
from django.http import JsonResponse , request
import datetime
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
import json
import unicodedata
from core import models

try:
    locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
except locale.Error:
    locale.setlocale(locale.LC_TIME, 'C')

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

        def retornarMetodoDePagamento(status,metodo):
            if status == 'f':
                return metodo
            return ''

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
                'data_status':formatarData(atualizacao.data),
                'pagamento':retornarMetodoDePagamento(atualizacao.status,atualizacao.get_pagamento_display())
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
                status = 'f',
                pagamento = data['metodo']
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
        total_contas_registradas = {
            'valor':models.Conta.objects.filter(usuario=request.user).aggregate(Sum('valor'))['valor__sum'],
            'total':models.Conta.objects.filter(usuario=request.user).count()
        }
        
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

        hoje = datetime.date.today()
        ano = hoje.year
        mes = hoje.month

        # Gerar os últimos 6 meses (ano e mês)
        ultimos_6_meses = []
        for i in range(5, -1, -1):  # começa de 5 meses atrás até o atual
            m = mes - i
            a = ano
            if m <= 0:
                m += 12
                a -= 1
            ultimos_6_meses.append((a, m))

        # Data inicial para filtrar o banco (primeiro dia do mês mais antigo)
        ano_inicio, mes_inicio = ultimos_6_meses[0]
        data_inicio = datetime.date(ano_inicio, mes_inicio, 1)

        # Consultar dados no banco
        totais_por_mes_db = (
            models.Conta.objects
            .filter(data_emissao__gte=data_inicio,usuario=request.user)
            .annotate(mes=TruncMonth('data_emissao'))
            .values('mes')
            .annotate(total=Sum('valor'))
            .order_by('mes')
        )

        # Criar dicionário para lookup rápido
        totais_dict = {item['mes'].month + item['mes'].year*100: float(item['total']) for item in totais_por_mes_db}

        # Preparar labels e dados do gráfico
        labels = []
        data = []

        for ano_m, mes_m in ultimos_6_meses:
            nome_mes = calendar.month_name[mes_m].capitalize()
            labels.append(nome_mes)
            key = mes_m + ano_m*100
            data.append(totais_dict.get(key, 0))  # 0 se não tiver registro

        chartUltimos6Meses = {
            'labels': labels,
            'data': data
        }


        # chartCustoPorFornecedor
        forecedores_qs = models.Fornecedor.objects.filter(usuario=request.user)[:10]
        fornecedores_nome = []
        fornecedor_custo = []
        for f in forecedores_qs:
            fornecedores_nome.append(f.nome,)
            custo_qs = models.Conta.objects.filter(fornecedor=f)
            custo = 0
            for f in custo_qs:
                custo += f.valor
            fornecedor_custo.append(custo)
        chartCustoPorFornecedor = {
            'labels':fornecedores_nome,
            'data':fornecedor_custo
        }

        # chartTotalPorCategoria
        categorias_ar = ['água','energia','internet','aluguel','outros']
        categorias_vl = [0,0,0,0,0]

        for c in contas:
            if c.categoria in categorias_ar:
                categorias_vl[categorias_ar.index(c.categoria)] += c.valor

        chartTotalPorCategoria = {
            'labels':categorias_ar,
            'data':categorias_vl
        }

        # KPIS DE 5 e 15 DIAS DE VENCIMENTO

        vencemEm5Dias = {
            'total':0,
            'contas':[]
        }
        vencemEm15Dias = {
            'total':0,
            'contas':[]
        }

        for c in contas:
            ultima = models.AtualizacaoConta.objects.filter(conta=c).last()
            hoje = datetime.date.today()
            if ultima.status == 'p':
                vencimento = (c.data_vencimento - hoje).days
                if vencimento <= 5:
                    vencemEm5Dias['total'] += 1
                    vencemEm5Dias['contas'].append({
                        'descricao':c.descricao,
                        'valor':c.valor,
                        'vencimento':formatarData(c.data_vencimento),
                        'dias':vencimento
                    })
                    continue
                if vencimento <= 15:
                    vencemEm15Dias['total'] += 1
                    vencemEm15Dias['contas'].append({
                        'descricao':c.descricao,
                        'valor':c.valor,
                        'vencimento':formatarData(c.data_vencimento),
                        'dias':vencimento
                    })

        kpiDiasVencimento = {
            'vencemEm5Dias':vencemEm5Dias,
            'vencemEm15Dias':vencemEm15Dias
        }

        dados = {
            'total_contas_registradas':total_contas_registradas,
            'total_pago':total_pago,
            'total_a_pagar':total_a_pagar,
            'atualizacoes':atualizacoes[:20],
            'chartTotalPorSituacao':chartTotalPorSituacao,
            'chartUltimos6Meses':chartUltimos6Meses,
            'chartCustoPorFornecedor':chartCustoPorFornecedor,
            'chartTotalPorCategoria':chartTotalPorCategoria,
            'kpiDiasVencimento':kpiDiasVencimento
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

    if request.method == 'PUT':
        data = json.loads(request.body)
        fornecedor = models.Fornecedor.objects.get(uuid=data['id'],usuario=usuario)
        fornecedor.nome=data['nome']
        fornecedor.cnpj=data['cnpj']
        fornecedor.telefone=data['telefone']
        fornecedor.email=data['email']
        fornecedor.endereco=data['endereco']
        fornecedor.save()
        return JsonResponse({'status':'Atualizado'},safe=False)

    return JsonResponse({'status':'Método não permitido.'},safe=False)

def gerar_username(nome):
    nome_normalizado = unicodedata.normalize('NFKD', nome).encode('ASCII', 'ignore').decode('ASCII')
    username_base = ''.join(nome_normalizado.lower().split())

    username = username_base
    contador = 1

    while User.objects.filter(username=username).exists():
        username = f"{username_base}{contador}"
        contador += 1

    return username

def getUsername(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        nome = data.get('nome')
        user = gerar_username(nome)
        return JsonResponse({'username':user})