let BASE_URL = window.location.origin
function formatarValor(valor) {
    return valor ? `R$ ${(Number(valor).toFixed(2)).replace('.', ',')}` : 'R$ 0,00'
}

function abrirModal(titulo = '', conteudo = '', submit = '') {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = `<p>${conteudo}</p>`;

    const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    modal.show();
}

function fecharModal() {
    const modalEl = document.querySelector('#dynamicModal'); // id do seu modal
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
}

async function carregarDados() {
    let response = await fetch(BASE_URL + '/api/dashboard/', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
    })
    let data = await response.json()
    console.log(data)

    function atualizarRegistroAtualizacoes() {

        function carregarStatus(status) {
            switch (status) {
                case 'p':
                    return '<small class="text-warning fw-bold">Status: Pendente</small>'
                case 'v':
                    return '<small class="text-danger fw-bold">Status: Vencido</small>'
                case 'f':
                    return '<small class="text-success fw-bold">Status: Finalizado</small>'
                case 'c':
                    return '<small class="text-danger fw-bold">Status: Cancelado</small>'
                default:
                    return '<small class="text-secondary fw-bold">Status: Desconhecido</small>'
            }
        }

        let registrodeatualizacoes = document.getElementById('registrodeatualizacoes')
        let string = ''
        data.atualizacoes.forEach(e => {
            string += `
            
            <li class="list-group-item border">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div class="text-start">
                                            <h6 class="mb-1">
                                                <i class="bi bi-journal-text me-2"></i>${e.conta}
                                            </h6>
                                            <small class="text-secondary">Fornecedor: ${e.fornecedor}</small><br>
                                            <small class="text-secondary">Categoria: ${e.categoria}</small><br>
                                            ${carregarStatus(e.status)}
                                        </div>
                                        <small class="text-muted text-end">
                                            <div>${e.data}</div>
                                            <div>${e.hora}</div>
                                        </small>
                                    </div>
                                </li> 

            `
        });
        registrodeatualizacoes.innerHTML = string
    }

    function atualizarValoresIniciais() {
        document.getElementById('totalcontasregistradas').innerHTML = `${formatarValor(data.total_contas_registradas.valor)} (${data.total_contas_registradas.total})`
        document.getElementById('totaldecontasapagar').innerHTML = `${formatarValor(data.total_a_pagar[0])} (${data.total_a_pagar[1]})`
        document.getElementById('valortotalpago').innerHTML = `${formatarValor(data.total_pago[0])} (${data.total_pago[1]})`
        document.getElementById('15dias-value').innerHTML = data.kpiDiasVencimento.vencemEm15Dias.total
        document.getElementById('5dias-value').innerHTML = data.kpiDiasVencimento.vencemEm5Dias.total

    }

    atualizarRegistroAtualizacoes()
    atualizarValoresIniciais()
}

document.addEventListener('DOMContentLoaded', async () => {
    let csrf = document.getElementById('csrf').value
    carregarDados()

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('15dias')) {
            let response = await fetch(BASE_URL + '/api/dashboard/', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
            })
            let data = await response.json()
            let contas = data.kpiDiasVencimento.vencemEm15Dias.contas
            console.log(contas)
            
            let string = ''

            contas.forEach(c => {
                string+= `
                
                <li class="list-group-item border">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div class="text-start">
                                            <h6 class="mb-1">
                                                <i class="bi bi-journal-text me-2"></i> ${c.descricao}
                                            </h6>
                                            <small class="text-secondary">Valor: ${formatarValor(c.valor)}</small><br>
                                        </div>
                                        <small class="text-muted text-end">
                                            <div>Vencimento: ${c.vencimento}</div>
                                            <div>Vence em ${c.dias} ${c.dias == 1 ? 'dia.' : 'dias.'} </div>
                                        </small>
                                    </div>
                                </li> 
                `
            })

            if (contas.length == 0) {
                string = '<p class="px-4">Nenhuma conta encontrada.</p>'
            }

            abrirModal('Contas que vencem em 15 dias',string,'')
        }
    })

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('5dias')) {
            let response = await fetch(BASE_URL + '/api/dashboard/', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
            })
            let data = await response.json()
            let contas = data.kpiDiasVencimento.vencemEm5Dias.contas
            console.log(contas)
            
            let string = ''

            contas.forEach(c => {
                string+= `
                
                <li class="list-group-item border">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                        <div class="text-start">
                                            <h6 class="mb-1">
                                                <i class="bi bi-journal-text me-2"></i> ${c.descricao}
                                            </h6>
                                            <small class="text-secondary">Valor: ${formatarValor(c.valor)}</small><br>
                                        </div>
                                        <small class="text-muted text-end">
                                            <div>Vencimento: ${c.vencimento}</div>
                                            <div>Vence em ${c.dias} ${c.dias == 1 ? 'dia.' : 'dias.'} </div>
                                        </small>
                                    </div>
                                </li> 
                
                `
            })

            if (contas.length == 0) {
                string = '<p class="px-4">Nenhuma conta encontrada. </p>'
            }

            abrirModal('Contas que vencem em 5 dias',string,'')
        }
    })
})
