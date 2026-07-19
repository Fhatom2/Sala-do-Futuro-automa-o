// ===== DADOS =====
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

// ===== LOGIN =====
btnLogar.addEventListener('click', async function() {
    const ra = raInput.value.trim();
    const digito = digitoInput.value.trim();
    const uf = ufInput.value.trim().toUpperCase();
    const senha = senhaInput.value.trim();

    if (!ra || !digito || !uf || !senha) {
        mostrarMensagem(msgLogin, '⚠️ Preencha todos os campos!', 'erro');
        return;
    }

    if (digito.length !== 1 || !/^\d$/.test(digito)) {
        mostrarMensagem(msgLogin, '⚠️ Dígito deve ser um número (0-9)!', 'erro');
        return;
    }

    if (uf.length !== 2) {
        mostrarMensagem(msgLogin, '⚠️ UF deve ter 2 letras (ex: SP)!', 'erro');
        return;
    }

    btnLogar.disabled = true;
    btnLogar.textContent = 'Verificando...';
    mostrarMensagem(msgLogin, '🔍 Verificando credenciais...', 'info');

    try {
        // SIMULA VERIFICAÇÃO (no GitHub Actions, isso chama o backend)
        const resposta = await simularLogin(ra, digito, uf, senha);
        
        if (resposta.sucesso) {
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

// ===== SIMULAR LOGIN (conecta com GitHub Actions) =====
async function simularLogin(ra, digito, uf, senha) {
    // Em produção, isso chamaria a API do GitHub Actions
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulação: aceita qualquer RA com mais de 5 dígitos
            if (ra.length >= 5 && senha.length >= 3) {
                resolve({ sucesso: true });
            } else {
                resolve({ sucesso: false });
            }
        }, 1500);
    });
}

// ===== BUSCAR TAREFAS =====
async function buscarTarefas() {
    try {
        // Simula busca de tarefas
        const total = Math.floor(Math.random() * 10) + 1;
        dados.tarefasTotal = total;
        dados.tarefasFeitas = 0;
        atualizarContador();
        
        mostrarMensagem(statusTarefas, `📚 ${total} tarefas disponíveis!`, 'info');
    } catch (erro) {
        console.error('Erro ao buscar tarefas:', erro);
    }
}

// ===== FAZER TAREFAS =====
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
    btnTarefas.textContent = 'Executando...';
    logTarefas.classList.add('ativo');
    logTarefas.innerHTML = '';
    statusSistema.textContent = '🔄 Executando tarefas...';

    const tempoEntreTarefas = parseInt(document.getElementById('tempo-tarefa').value) || 2;
    const total = dados.tarefasTotal;
    let feitas = 0;

    for (let i = 1; i <= total; i++) {
        // Log da tarefa
        adicionarLog(`🔄 Iniciando tarefa ${i}/${total}...`, 'info');
        
        // Simula execução (1-3 minutos)
        const tempoAleatorio = Math.floor(Math.random() * 120000) + 60000; // 1-3 min
        const minutos = Math.round(tempoAleatorio / 60000);
        adicionarLog(`⏳ Aguardando ${minutos} minuto(s)...`, 'info');
        
        await aguardar(tempoAleatorio);
        
        // Simula sucesso (90% de chance)
        if (Math.random() < 0.9) {
            feitas++;
            dados.tarefasFeitas = feitas;
            atualizarContador();
            adicionarLog(`✅ Tarefa ${i} concluída com sucesso!`, 'sucesso');
        } else {
            adicionarLog(`❌ Falha na tarefa ${i}, tentando novamente...`, 'erro');
            i--; // Tenta de novo
        }

        // Aguarda entre tarefas
        if (i < total) {
            adicionarLog(`⏳ Aguardando ${tempoEntreTarefas} minuto(s) antes da próxima...`, 'info');
            await aguardar(tempoEntreTarefas * 60000);
        }
    }

    // Finalizado
    adicionarLog(`🎉 Todas as ${total} tarefas foram concluídas!`, 'sucesso');
    mostrarMensagem(statusTarefas, `✅ ${feitas}/${total} tarefas concluídas!`, 'sucesso');
    
    dados.tarefasEmAndamento = false;
    btnTarefas.disabled = false;
    btnTarefas.textContent = 'Fazer Tarefas';
    statusSistema.textContent = '✅ Tarefas finalizadas';
    tarefasHoje.textContent = feitas;
    ultimaExecucao.textContent = new Date().toLocaleString();
});

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
});
