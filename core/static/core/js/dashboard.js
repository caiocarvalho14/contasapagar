let BASE_URL = window.location.origin
function formatarValor(valor){
    return valor ? `R$ ${valor.replace('.', ',')}` : 'R$ 0,00'
}

async function carregarDados() {
    let response = await fetch(BASE_URL+'/api/dashboard/', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
    })
    let data = await response.json()
    console.log(data)

    function atualizarRegistroAtualizacoes() {

        function carregarStatus(status){
            switch(status){
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

    function atualizarValoresIniciais(){
        document.getElementById('totalcontasregistradas').innerHTML=data.total_contas_registradas
        document.getElementById('totaldecontasapagar').innerHTML=formatarValor(data.total_a_pagar)
        document.getElementById('valortotalpago').innerHTML=formatarValor(data.total_pago)
    }

    atualizarRegistroAtualizacoes()
    atualizarValoresIniciais()
}

document.addEventListener('DOMContentLoaded', async () => {
    let csrf = document.getElementById('csrf').value

    carregarDados()
})