const chartTotalPorSituacao = document.getElementById('chartTotalPorSituacao')
const chatUltimos6Meses = document.getElementById('chatUltimos6Meses')
const chartCustoPorFornecedor = document.getElementById('chartCustoPorFornecedor')
const chartTotalPorCategoria = document.getElementById('chartTotalPorCategoria')
const csrf = document.getElementById('csrf').value

document.addEventListener('DOMContentLoaded', async () => {
    let response = await fetch(BASE_URL + '/api/dashboard/', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
    })
    let data = await response.json()
    console.log(data)

    new Chart(chartTotalPorSituacao, {
        type: 'doughnut',
        data: {
            labels: data.chartTotalPorSituacao.labels,
            datasets: [{
                label: 'R$ por Situação',
                data: data.chartTotalPorSituacao.data,
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            
        }
    });

    // ULTIMO 6 MESES
    new Chart(chatUltimos6Meses, {
        type: 'line',
        data: {
            labels: data.chartUltimos6Meses.labels,
            datasets: [{
                label: 'R$',
                data: data.chartUltimos6Meses.data,
                borderWidth: 1,
                tension: 0.4
            }],
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // CUSTO POR FORNECEDOR
    new Chart(chartCustoPorFornecedor, {
        type: 'bar',
        data: {
            labels: data.chartCustoPorFornecedor.labels,
            datasets: [{
                label: 'R$',
                data: data.chartCustoPorFornecedor.data,
                borderWidth: 1,
                tension: 0.4
            }],
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // TOTAL POR CATEGORIA
    new Chart(chartTotalPorCategoria, {
        type: 'pie',
        data: {
            labels: data.chartTotalPorCategoria.labels,
            datasets: [{
                label: 'R$',
                data: data.chartTotalPorCategoria.data,
                borderWidth: 1,
                tension: 0.1
            }],
        },
        options: {
            maintainAspectRatio: false,
        }
    });
})