const BASE_URL = window.location.origin

async function carregarFornecedores(id = '') {
  let response = await fetch(`${BASE_URL}/api/fornecedores/`, {
    method: "GET",
    credentials: "include" // muito importante para enviar cookies
  })
  let data = await response.json()
  let string = '<option value="none" selected>Sem fornecedor</option>';
  data.forEach(f => {
    string += `
      <option value="${f.uuid}" ${f.uuid == id ? 'selected' : ''}>${f.nome}</option>
    `
  });
  return string
}

function statusVencimento(dias) {
  if (dias <= 0) {
    return `<small class="text-muted">Vencido</small>`;
  } else if (dias <= 5) {
    return `<small class="text-danger">Vence em ${dias} dia${dias > 1 ? 's' : ''}</small>`;
  } else if (dias <= 15) {
    return `<small class="text-warning">Vence em ${dias} dia${dias > 1 ? 's' : ''}</small>`;
  } else {
    return `<small class="text-primary">Vence em ${dias} dia${dias > 1 ? 's' : ''}</small>`;
  }
}

async function carregarTabela(statusFiltro = '') {
  let response = await fetch(`${BASE_URL}/api/painel/`, {
    method: "GET",
    credentials: "include" // muito importante para enviar cookies
  })
  let data = await response.json()
  dados = []

  await carregarFornecedores()

  let container = document.getElementById('container')

  function getPrioridade(filtro) {
    if (filtro === 'p') return { p: 1, v: 2, f: 3, c: 4 };
    if (filtro === 'v') return { v: 1, p: 2, f: 3, c: 4 };
    if (filtro === 'f') return { f: 1, v: 2, p: 3, c: 4 };
    if (filtro === 'c') return { c: 1, v: 2, f: 3, p: 4 };
    const base = { p: 1, v: 2, f: 3, c: 4 };
    return base;
  }

  const prioridadeAtual = getPrioridade(statusFiltro)

  dados = data.sort((a, b) => prioridadeAtual[a.status] - prioridadeAtual[b.status]);

  function statusTexto(s) {
    switch (s) {
      case 'c': return '<td class="table-danger">Cancelado</td>';
      case 'p': return '<td class="table-warning">Pendente</td>';
      case 'f': return '<td class="table-success">Finalizado</td>';
      case 'v': return '<td class="table-danger">Vencido</td>';
      default: return '<td class="table-secondary">Desconhecido</td>';
    }
  }

  let string = '';


  dados.forEach(d => {
    string += `
        
        <tr>
                <td>R$ ${(d.valor).replace('.', ',')}</td>
                <td>${d.descricao}</td>
                <td>${d.fornecedor ? d.fornecedor : '<small>Sem Fornecedor.</small>'}</td>
                <td>${d.categoria}</td>
                <td>${d.emissao}</td>
                <td>
                ${d.vencimento}
                <br>
                ${d.status == 'p' || d.status == 'v' ? statusVencimento(d.dias_para_vencer) : ''}
                </td>
                ${statusTexto(d.status)}
                <td>${d.data_status}</td>
                <td>
                ${d.status == 'f' ? `<button class="btn btn-outline-secondary p-2" disabled><i class="bi bi-check2" ></i></button>  ` : `<button title="Marcar como Pago" class="btn btn-outline-success  p-2""><i data-id="${d.uuid}" class="bi bi-check2 pagar"></i></button>`}
                <button title="Editar Registro" class="btn btn-outline-primary  p-2""><i data-id="${d.uuid}" class="bi bi-pencil-square editar"></i></button>
                <button title="Excluir Registro" class="btn btn-outline-danger  p-2""><i data-id="${d.uuid}" class="bi bi-trash3-fill excluir"></i></button>
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

document.addEventListener('DOMContentLoaded', async () => {
  carregarTabela(document.getElementById('filtro').value)

  document.getElementById('filtro').addEventListener('change', async (e) => {
    carregarTabela(document.getElementById('filtro').value)
  })

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('editar')) {

      let response = await fetch(`${BASE_URL}/api/painel/`, {
        method: "GET",
        credentials: "include" // muito importante para enviar cookies
      })
      let data = await response.json()
      conta = data.filter(d => d.uuid == e.target.dataset.id)[0]
      id = e.target.dataset.id
      let form = `
      <div class="mb-3">
          <label for="inputValor" class="form-label">Valor</label>
          <input value="${conta.valor}" type="number" name="valor" class="form-control" id="inputValor" placeholder="Insira o valor" step="0.25" min="0" required>
      </div>

      <div class="mb-3">
          <label for="inputDescricao" class="form-label">Descrição</label>
          <textarea name="descricao" class="form-control" id="inputDescricao" placeholder="Descreva a conta" rows="2" required>${conta.descricao}</textarea>
      </div>

      <div class="mb-3">
          <label for="inputfornecedor" class="form-label">Selecione o Fornecedor</label>
          <select name="status" class="form-select" id="inputfornecedor" required>
              ${await carregarFornecedores(conta.fornecedor_id)}
          </select>
      </div>

      <div class="mb-3">
          <label for="inputCategoria" class="form-label">Categoria</label>
          <select name="categoria" class="form-select" id="inputCategoria" required>
              <option value="" selected disabled>Selecione uma categoria</option>
              <option value="água" ${conta.categoria == 'água' ? 'selected' : ''}>Água</option>
              <option value="energia" ${conta.categoria == 'energia' ? 'selected' : ''}>Energia</option>
              <option value="internet" ${conta.categoria == 'internet' ? 'selected' : ''}>Internet</option>
              <option value="aluguel" ${conta.categoria == 'aluguel' ? 'selected' : ''}>Aluguel</option>
              <option value="outros" ${conta.categoria == 'outros' ? 'selected' : ''}>Outros</option>
          </select>
      </div>

      <div class="mb-3">
          <label for="inputDataEmissao" class="form-label">Data de Emissão</label>
          <input value="${conta.valor_emissao}" type="date" name="data_emissao" class="form-control" id="inputDataEmissao" required>
      </div>

      <div class="mb-3">
          <label for="inputDataVencimento" class="form-label">Data de Vencimento</label>
          <input value="${conta.valor_vencimento}" type="date" name="data_vencimento" class="form-control" id="inputDataVencimento" required>
      </div>

      <div class="mb-3">
          <label for="inputstatus" class="form-label">Situação</label>
          <select name="status" class="form-select" id="inputstatus" required>
              <option value="p" ${conta.status == 'p' ? 'selected' : ''}>Pendente</option>
              <option value="c" ${conta.status == 'c' ? 'selected' : ''}>Cancelada</option>
              <option value="f" ${conta.status == 'f' ? 'selected' : ''}>Finalizada / Paga</option>
          </select>
      </div>
      `

      let submit = ` <button type="submit" class="btn btn-primary submit-editar" data-id="${e.target.dataset.id}" >Salvar</button>`

      abrirModal('Editar Conta', form, submit)
    }
  })

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('excluir')) {
      let submit = ` <button type="submit" class="btn btn-primary submit-excluir" data-id="${e.target.dataset.id}">Excluir</button>`

      abrirModal('Deseja excluir o registro?', 'Essa ação é irreversível', submit)

    }
  })

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('pagar')) {
      id = e.target.dataset.id
      let submit = ` <button type="submit" class="btn btn-success submit-pagar" data-id="${id}">Marcar como Pago</button>`
      let response = await fetch(BASE_URL+"/api/painel/", {
        method: "GET",
        credentials: "include" // muito importante para enviar cookies
      })
      let data = await response.json()
      conta = data.filter(d => d.uuid == id)
      let string = `
      <div>
        <p>Valor: ${data[0].valor}</p>
        <p>Descrição: ${data[0].descricao}</p>
        <p>Data de Vencimento: ${data[0].vencimento}</p>
    </div>
      `
      abrirModal('Deseja marcar como pago?', string, submit)

    }
  })

  document.getElementById('registrar').addEventListener('click', async (e) => {
    let form = `
      <div class="mb-3">
          <label for="inputValor" class="form-label">Valor</label>
          <input type="number" name="valor" class="form-control" id="inputValor" placeholder="Insira o valor" step="0.25" min="0" required>
      </div>

      <div class="mb-3">
          <label for="inputDescricao" class="form-label">Descrição</label>
          <textarea name="descricao" class="form-control" id="inputDescricao" placeholder="Descreva a conta" rows="2" required></textarea>
      </div>

      <div class="mb-3">
          <label for="inputfornecedor" class="form-label">Selecione o Fornecedor</label>
          <select name="status" class="form-select" id="inputfornecedor" required>
              ${await carregarFornecedores()}
          </select>
      </div>

      <div class="mb-3">
          <label for="inputCategoria" class="form-label">Categoria</label>
          <select name="categoria" class="form-select" id="inputCategoria" required>
              <option value="" selected disabled>Selecione uma categoria</option>
              <option value="água">Água</option>
              <option value="energia">Energia</option>
              <option value="internet">Internet</option>
              <option value="aluguel">Aluguel</option>
              <option value="outros">Outros</option>
          </select>
      </div>

      <div class="mb-3">
          <label for="inputDataEmissao" class="form-label">Data de Emissão</label>
          <input type="date" name="data_emissao" class="form-control" id="inputDataEmissao" required>
      </div>

      <div class="mb-3">
          <label for="inputDataVencimento" class="form-label">Data de Vencimento</label>
          <input type="date" name="data_vencimento" class="form-control" id="inputDataVencimento" required>
      </div>

      <div class="mb-3">
          <label for="inputstatus" class="form-label">Situação</label>
          <select name="status" class="form-select" id="inputstatus" required>
              <option value="p" selected>Pendente</option>
              <option value="c">Cancelada</option>
              <option value="f">Finalizada / Paga</option>
          </select>
      </div>
      `

    let submit = ` <button type="submit" class="btn btn-primary submit-registrar" >Enviar</button>`

    abrirModal('Registrar Conta', form, submit)
  })

})

document.getElementById('form').addEventListener('submit', async (e) => {
  let csrf = document.getElementById('csrf').value
  e.preventDefault()
  if (e.submitter.classList.contains('submit-registrar')) {
    valor = document.getElementById('inputValor').value
    descricao = document.getElementById('inputDescricao').value
    categoria = document.getElementById('inputCategoria').value
    data_emissao = document.getElementById('inputDataEmissao').value
    data_vencimento = document.getElementById('inputDataVencimento').value
    situacao = document.getElementById('inputstatus').value
    fornecedor = document.getElementById('inputfornecedor').value

    let dados = {
      acao: 'REGISTRAR',
      valor: valor,
      descricao: descricao,
      categoria: categoria,
      data_emissao: data_emissao,
      data_vencimento: data_vencimento,
      situacao: situacao,
      fornecedor: fornecedor
    }

    // transformar dados em json
    let data = JSON.stringify(dados)
    let response = await fetch(BASE_URL+"/api/painel/", {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf
      },
    })
      .then(response => {
        carregarTabela()
        fecharModal()
      })
  }

  if (e.submitter.classList.contains('submit-excluir')) {
    let id = e.submitter.dataset.id
    let data = JSON.stringify(id)
    let response = await fetch(BASE_URL+"/api/painel/", {
      method: "DELETE",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf
      },
    })
      .then(response => {
        carregarTabela()
        fecharModal()
      })
  }

  if (e.submitter.classList.contains('submit-pagar')) {
    let id = e.submitter.dataset.id
    let data = JSON.stringify({
      id: id,
      acao: 'PAGAR'
    })
    let response = await fetch(BASE_URL+"/api/painel/", {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf
      },
    })
      .then(response => {
        carregarTabela()
        fecharModal()
      })
  }

  if (e.submitter.classList.contains('submit-editar')) {
    valor = document.getElementById('inputValor').value
    descricao = document.getElementById('inputDescricao').value
    categoria = document.getElementById('inputCategoria').value
    data_emissao = document.getElementById('inputDataEmissao').value
    data_vencimento = document.getElementById('inputDataVencimento').value
    situacao = document.getElementById('inputstatus').value
    fornecedor = document.getElementById('inputfornecedor').value
    let id = e.submitter.dataset.id

    let dados = {
      id: id,
      valor: valor,
      descricao: descricao,
      categoria: categoria,
      data_emissao: data_emissao,
      data_vencimento: data_vencimento,
      situacao: situacao,
      fornecedor: fornecedor
    }

    // transformar dados em json
    let data = JSON.stringify(dados)
    let response = await fetch(BASE_URL+"/api/painel/", {
      method: "PUT",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf
      },
    })
      .then(response => {
        carregarTabela()
        fecharModal()
      })
  }
})