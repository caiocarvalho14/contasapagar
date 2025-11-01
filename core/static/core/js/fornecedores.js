const BASE_URL = window.location.origin
let csrf = document.getElementById('csrf').value
async function carregarFornecedores() {
    let response = await fetch(BASE_URL + '/api/fornecedores', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
    })
    let data = await response.json()
    console.log(data)

    let container = document.getElementById('container')

    let string = '';

    data.forEach(f => {
        string += `
        
        <tr>
                <td>${f.nome}</td>
                <td>${f.cnpj}</td>
                <td>${f.telefone}</td>
                <td>${f.email}</td>
                <td>${f.endereco}</td>
                <td>
                <button title="Editar Registro" class="btn btn-outline-primary  p-2""><i data-id="${f.uuid}" class="bi bi-pencil-square editar"></i></button>
                <button title="Excluir Registro" class="btn btn-outline-danger  p-2""><i data-id="${f.uuid}" class="bi bi-trash3-fill excluir"></i></button>
                </td>
        </tr>

        `
    });

    container.innerHTML = string
}

function abrirModal(titulo, conteudo, submit) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = `<p>${conteudo}</p>`;
    document.getElementById('modal-submit').innerHTML = submit

    const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    modal.show();
}

function fecharModal() {
    const modalEl = document.querySelector('#dynamicModal'); // id do seu modal
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
}

document.getElementById('registrar').addEventListener('click', async (e) => {
    let form = `
      <div class="mb-3">
          <label for="inputNome" class="form-label">Nome</label>
          <input type="text"  class="form-control" id="inputNome" placeholder="Insira o nome" step="0.25" min="0" required>
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">CNPJ</label>
          <input type="text" class="form-control" id="inputcnpj" placeholder="Insira o CNPJ" >
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">Telefone</label>
          <input type="number" class="form-control" id="inputnumero" placeholder="Insira o Número de Telefone" >
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">Email</label>
          <input type="email" class="form-control" id="inputemail" placeholder="Insira o Email" >
      </div>

      <div class="mb-3">
          <label for="inputendereco" class="form-label">Endereço</label>
          <input type="text" class="form-control" id="inputendereco" placeholder="Insira o Endereço" >
      </div>
      
      `

    let submit = ` <button type="submit" class="btn btn-primary submit-registrar" >Cadastrar</button>`

    abrirModal('Cadastrar Fornecedor', form, submit)
})

document.addEventListener('DOMContentLoaded', async () => {
    carregarFornecedores()
})
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('excluir')) {
        let submit = ` <button type="submit" class="btn btn-primary submit-excluir" data-id="${e.target.dataset.id}">Excluir</button>`



        abrirModal('Deseja excluir o fornecedor?', 'Essa ação é irreversível', submit)

    }
})

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('editar')) {
        let submit = ` <button type="submit" class="btn btn-primary submit-editar" data-id="${e.target.dataset.id}">Salvar</button>`

        let response = await fetch(BASE_URL + '/api/fornecedores', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
        })
        let data = await response.json()
        fornecedor = data.filter(f => f.uuid == e.target.dataset.id)[0]
        console.log(fornecedor)

        let form = `
      <div class="mb-3">
          <label for="inputNome" class="form-label">Nome</label>
          <input type="text" value="${fornecedor.nome}" class="form-control" id="inputNome" placeholder="Insira o nome" step="0.25" min="0" required>
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">CNPJ</label>
          <input type="text" value="${fornecedor.cnpj}" class="form-control" id="inputcnpj" placeholder="Insira o CNPJ" >
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">Telefone</label>
          <input type="number" value="${fornecedor.telefone}" class="form-control" id="inputnumero" placeholder="Insira o Número de Telefone" >
      </div>

      <div class="mb-3">
          <label for="inputNome" class="form-label">Email</label>
          <input type="email" value="${fornecedor.email}" class="form-control" id="inputemail" placeholder="Insira o Email" >
      </div>

      <div class="mb-3">
          <label for="inputendereco" class="form-label">Endereço</label>
          <input type="text" value="${fornecedor.endereco}" class="form-control" id="inputendereco" placeholder="Insira o Endereço" >
      </div>
      
      `

        abrirModal('Deseja editar o fornecedor?', form, submit)

    }
})
document.getElementById('form').addEventListener('submit', async (e) => {
    let csrf = document.getElementById('csrf').value
    e.preventDefault()
    console.log(e.submitter)

    if (e.submitter.classList.contains('submit-registrar')) {
        let nome = document.getElementById('inputNome').value
        let cnpj = document.getElementById('inputcnpj').value
        let telefone = document.getElementById('inputnumero').value
        let email = document.getElementById('inputemail').value
        let endereco = document.getElementById('inputendereco').value


        let dados = {
            acao: 'REGISTRAR',
            nome: nome,
            cnpj: cnpj,
            telefone: telefone,
            email: email,
            endereco: endereco
        }

        // transformar dados em json
        let data = JSON.stringify(dados)
        let response = await fetch(BASE_URL + "/api/fornecedores/", {
            method: "POST",
            body: data,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
        })
            .then(response => {
                carregarFornecedores()
                fecharModal()
            })
    }

    if (e.submitter.classList.contains('submit-excluir')) {
        let id = e.submitter.dataset.id
        let data = JSON.stringify(id)
        let response = await fetch(BASE_URL + "/api/fornecedores/", {
            method: "DELETE",
            body: data,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
        })
            .then(response => {
                carregarFornecedores()
                fecharModal()
            })
    }
    
    if (e.submitter.classList.contains('submit-editar')) {
        let nome = document.getElementById('inputNome').value
        let cnpj = document.getElementById('inputcnpj').value
        let telefone = document.getElementById('inputnumero').value
        let email = document.getElementById('inputemail').value
        let endereco = document.getElementById('inputendereco').value
        let id = e.submitter.dataset.id

        let dados = {
            id:id,
            nome: nome,
            cnpj: cnpj,
            telefone: telefone,
            email: email,
            endereco: endereco
        }

        // transformar dados em json
        let data = JSON.stringify(dados)
        let response = await fetch(BASE_URL + "/api/fornecedores/", {
            method: "PUT",
            body: data,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
        })
            .then(response => {
                carregarFornecedores()
                fecharModal()
            })
    }

})