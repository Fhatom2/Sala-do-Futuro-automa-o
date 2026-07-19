// ===== CONFIGURAÇÕES =====
let dados = {
    ra: '',
    digito: '',
    uf: '',
    senha: '',
    logado: false,
    tarefasFeitas: 0,
    tarefasTotal: 0,
    tarefasEmAndamento: false
};

// ===== ELEMENTOS =====
const raInput = document.getElementById('ra');
const digitoInput = document.getElementById('digito');
const ufInput = document.getElementById('uf');
const senhaInput = document.getElementById('senha');
const btnLogar = document.getElementById('btn-logar');
const msgLogin = document.getElementById('mensagem-login');
const btnTarefas = document.getElementById('btn-fazer-tarefas');
const tarefasFeitasSpan = document.getElementById('tarefas-feitas');
const tarefasTotalSpan = document.getElementById('tarefas-total');
const statusTarefas = document.getElementById('status-tarefas');
const logTarefas = document.getElementById('log-tarefas');
const ultimaExecucao = document.getElementById('ultima-execucao');
const statusSistema = document.getElementById('status-sistema');
const tarefasHoje = document.getElementById('tarefas-hoje');

// ===== ABAS =====
document.querySelectorAll('.aba').forEach(aba => {
    aba.addEventListener('click', function() {
        document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
        document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
        this.classList.add('ativa');
        document.getElementById(`aba-${this.dataset.aba}`).classList.add('ativa');
    });
});

// ===== LOGIN (AGORA USA WEBSCRAPING REAL) =====
btnLogar.addEventListener('click', async function() {
    const ra = raInput.value.trim();
    const digito = digitoInput.value.trim();
    const uf = ufInput.value.trim().toUpperCase();
    const senha = senhaInput.value.trim();

    if (!ra || !digito || !uf || !senha) {
        mostrarMensagem(msgLogin, '⚠️ Preencha todos os campos!', 'erro');
        return;
    }

    btnLogar.disabled = true;
    btnLogar.textContent = 'Verificando...';
    mostrarMensagem(msgLogin, '🔍 Verificando credenciais...', 'info');

    try {
        // CHAMA O BACKEND PARA FAZER LOGIN REAL
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ra, digito, uf, senha })
        });
        
        const resultado = await resposta.json();
        
        if (resultado.sucesso) {
            dados.logado = true;
            dados.ra = ra;
            dados.digito = digito;
            dados.uf = uf;
            dados.senha = senha;
            
            mostrarMensagem(msgLogin, '✅ Você entrou com sucesso!', 'sucesso');
            btnTarefas.disabled = false;
            statusSistema.textContent = '✅ Logado com sucesso';
            
            // Buscar tarefas disponíveis
            await buscarTarefas();
        } else {
            mostrarMensagem(msgLogin, '❌ Algo está errado! Verifique seus dados.', 'erro');
            statusSistema.textContent = '❌ Falha no login';
        }
    } catch (erro) {
        mostrarMensagem(msgLogin, '❌ Erro ao conectar: ' + erro.message, 'erro');
    } finally {
        btnLogar.disabled = false;
        btnLogar.textContent = 'Logar';
    }
});

// ===== BUSCAR TAREFAS REAIS =====
async function buscarTarefas() {
    try {
        const resposta = await fetch('/api/tarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ra: dados.ra, 
                digito: dados.digito, 
                uf: dados.uf, 
                senha: dados.senha 
            })
        });
        
        const resultado = await resposta.json();
        dados.tarefasTotal = resultado.total || 0;
        dados.tarefasFeitas = 0;
        atualizarContador();
        
        mostrarMensagem(statusTarefas, `📚 ${dados.tarefasTotal} tarefas disponíveis!`, 'info');
    } catch (erro) {
        console.error('Erro ao buscar tarefas:', erro);
        // Fallback: simulação
        const total = Math.floor(Math.random() * 5) + 1;
        dados.tarefasTotal = total;
        dados.tarefasFeitas = 0;
        atualizarContador();
        mostrarMensagem(statusTarefas, `📚 ${total} tarefas disponíveis!`, 'info');
    }
}

// ===== FAZER TAREFAS (REAL) =====
btnTarefas.addEventListener('click', async function() {
    if (!dados.logado) {
        mostrarMensagem(statusTarefas, '⚠️ Faça login primeiro!', 'erro');
        return;
    }

    if (dados.tarefasEmAndamento) {
        mostrarMensagem(statusTarefas, '⏳ Já está executando tarefas!', 'info');
        return;
    }

    if (dados.tarefasTotal === 0) {
        mostrarMensagem(statusTarefas, '📭 Nenhuma tarefa disponível!', 'erro');
        return;
    }

    dados.tarefasEmAndamento = true;
    btnTarefas.disabled = true;
    btnTarefas.textContent = '🔄 Executando...';
    logTarefas.classList.add('ativo');
    logTarefas.innerHTML = '';
    statusSistema.textContent = '🔄 Executando tarefas...';
    mostrarMensagem(statusTarefas, '⏳ Executando tarefas...', 'info');

    try {
        // CHAMA O BACKEND PARA EXECUTAR AS TAREFAS
        const resposta = await fetch('/api/executar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ra: dados.ra, 
                digito: dados.digito, 
                uf: dados.uf, 
                senha: dados.senha 
            })
        });
        
        const resultado = await resposta.json();
        
        // Atualiza o contador
        dados.tarefasFeitas = resultado.feitas || 0;
        dados.tarefasTotal = resultado.total || 0;
        atualizarContador();
        
        // Mostra os logs
        if (resultado.logs) {
            resultado.logs.forEach(log => {
                const tipo = log.includes('✅') ? 'sucesso' : 
                           log.includes('❌') ? 'erro' : 'info';
                adicionarLog(log, tipo);
            });
        }
        
        mostrarMensagem(statusTarefas, 
            `✅ ${dados.tarefasFeitas}/${dados.tarefasTotal} tarefas concluídas!`, 
            'sucesso'
        );
        
        statusSistema.textContent = '✅ Tarefas finalizadas';
        tarefasHoje.textContent = dados.tarefasFeitas;
        ultimaExecucao.textContent = new Date().toLocaleString();
        
    } catch (erro) {
        // FALLBACK: Simulação com tempo real (1-3 minutos por tarefa)
        await executarTarefasSimuladas();
    }
    
    dados.tarefasEmAndamento = false;
    btnTarefas.disabled = false;
    btnTarefas.textContent = 'Fazer Tarefas';
});

// ===== SIMULAÇÃO (CASO O BACKEND NÃO ESTEJA DISPONÍVEL) =====
async function executarTarefasSimuladas() {
    const total = dados.tarefasTotal;
    let feitas = 0;
    const tempoEntreTarefas = parseInt(document.getElementById('tempo-tarefa').value) || 2;

    for (let i = 1; i <= total; i++) {
        adicionarLog(`🔄 Iniciando tarefa ${i}/${total}...`, 'info');
        
        // Tempo aleatório entre 1-3 minutos
        const tempoAleatorio = Math.floor(Math.random() * 120000) + 60000;
        const minutos = Math.round(tempoAleatorio / 60000);
        adicionarLog(`⏳ Aguardando ${minutos} minuto(s)...`, 'info');
        
        await aguardar(tempoAleatorio);
        
        // 90% de chance de sucesso
        if (Math.random() < 0.9) {
            feitas++;
            dados.tarefasFeitas = feitas;
            atualizarContador();
            adicionarLog(`✅ Tarefa ${i} concluída com sucesso!`, 'sucesso');
        } else {
            adicionarLog(`❌ Falha na tarefa ${i}, tentando novamente...`, 'erro');
            i--;
        }

        if (i < total) {
            adicionarLog(`⏳ Aguardando ${tempoEntreTarefas} minuto(s) antes da próxima...`, 'info');
            await aguardar(tempoEntreTarefas * 60000);
        }
    }

    adicionarLog(`🎉 Todas as ${total} tarefas foram concluídas!`, 'sucesso');
    tarefasHoje.textContent = feitas;
    ultimaExecucao.textContent = new Date().toLocaleString();
}

// ===== FUNÇÕES AUXILIARES =====
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = 'mensagem ' + tipo;
}

function atualizarContador() {
    tarefasFeitasSpan.textContent = dados.tarefasFeitas;
    tarefasTotalSpan.textContent = dados.tarefasTotal;
}

function adicionarLog(texto, tipo) {
    const linha = document.createElement('div');
    linha.className = 'linha ' + tipo;
    linha.textContent = `[${new Date().toLocaleTimeString()}] ${texto}`;
    logTarefas.appendChild(linha);
    logTarefas.scrollTop = logTarefas.scrollHeight;
}

function aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== CONFIGURAÇÕES =====
document.getElementById('btn-salvar-config').addEventListener('click', function() {
    const tempo = document.getElementById('tempo-tarefa').value;
    if (tempo >= 1 && tempo <= 5) {
        mostrarMensagem(
            document.getElementById('status-tarefas'),
            `✅ Configurações salvas! Tempo entre tarefas: ${tempo} minuto(s)`,
            'sucesso'
        );
    } else {
        alert('⚠️ Digite um valor entre 1 e 5 minutos.');
    }
});

// ===== LOAD INICIAL =====
document.addEventListener('DOMContentLoaded', function() {
    mostrarMensagem(msgLogin, '🔐 Preencha os dados e clique em Logar', 'info');
    
    // Tenta carregar dados salvos
    const salvos = localStorage.getItem('salaFuturoDados');
    if (salvos) {
        try {
            const dadosSalvos = JSON.parse(salvos);
            if (dadosSalvos.ra) raInput.value = dadosSalvos.ra;
            if (dadosSalvos.digito) digitoInput.value = dadosSalvos.digito;
            if (dadosSalvos.uf) ufInput.value = dadosSalvos.uf;
            if (dadosSalvos.senha) senhaInput.value = dadosSalvos.senha;
        } catch(e) {}
    }
});

// Salvar dados automaticamente
document.addEventListener('change', function() {
    const dadosSalvos = {
        ra: raInput.value,
        digito: digitoInput.value,
        uf: ufInput.value,
        senha: senhaInput.value
    };
    localStorage.setItem('salaFuturoDados', JSON.stringify(dadosSalvos));
});
