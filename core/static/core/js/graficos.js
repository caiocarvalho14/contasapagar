const chartTotalPorSituacao = document.getElementById('chartTotalPorSituacao')
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
        type: 'bar',
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
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
})