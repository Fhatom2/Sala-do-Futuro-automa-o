// ===== FAZER TAREFAS (CHAMA O GITHUB ACTIONS) =====
btnTarefas.addEventListener('click', async function() {
    if (!dados.logado) {
        mostrarMensagem(statusTarefas, '⚠️ Faça login primeiro!', 'erro');
        return;
    }

    if (dados.tarefasEmAndamento) {
        mostrarMensagem(statusTarefas, '⏳ Já está executando!', 'info');
        return;
    }

    dados.tarefasEmAndamento = true;
    btnTarefas.disabled = true;
    btnTarefas.textContent = '🔄 Executando...';
    logTarefas.classList.add('ativo');
    logTarefas.innerHTML = '';
    
    mostrarMensagem(statusTarefas, '⏳ Conectando ao GitHub Actions...', 'info');
    adicionarLog('📤 Enviando dados para execução...', 'info');

    try {
        // 1. Dispara o GitHub Actions via API
        const resposta = await fetch(
            'https://api.github.com/repos/fhatom2/sala-futuro-auto/actions/workflows/automacao.yml/dispatches',
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`, // Você vai criar um token
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        ra: dados.ra,
                        digito: dados.digito,
                        uf: dados.uf,
                        senha: dados.senha
                    }
                })
            }
        );

        if (resposta.ok) {
            adicionarLog('✅ GitHub Actions iniciado! Aguarde...', 'sucesso');
            mostrarMensagem(statusTarefas, '⏳ Processando... Aguarde alguns minutos.', 'info');
            
            // Aguarda o resultado (vai buscar o log depois)
            await aguardar(30000); // 30 segundos
            
            // Busca o resultado
            await buscarResultado();
            
        } else {
            adicionarLog('❌ Erro ao iniciar GitHub Actions', 'erro');
            mostrarMensagem(statusTarefas, '❌ Erro ao iniciar. Tente novamente.', 'erro');
        }

    } catch (erro) {
        adicionarLog('❌ Erro: ' + erro.message, 'erro');
        mostrarMensagem(statusTarefas, '❌ Erro ao conectar', 'erro');
    }
    
    dados.tarefasEmAndamento = false;
    btnTarefas.disabled = false;
    btnTarefas.textContent = 'Fazer Tarefas';
});

// ===== BUSCAR RESULTADO DO GITHUB ACTIONS =====
async function buscarResultado() {
    try {
        const resposta = await fetch(
            'https://api.github.com/repos/fhatom2/sala-futuro-auto/actions/runs?per_page=1',
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        const dados = await resposta.json();
        if (dados.workflow_runs && dados.workflow_runs.length > 0) {
            const ultimo = dados.workflow_runs[0];
            adicionarLog(`📊 Status: ${ultimo.status}`, 'info');
            
            // Buscar logs se estiver concluído
            if (ultimo.status === 'completed') {
                await buscarLogs(ultimo.id);
            }
        }
    } catch (erro) {
        adicionarLog('❌ Erro ao buscar resultado: ' + erro.message, 'erro');
    }
}

// ===== BUSCAR LOGS DO GITHUB ACTIONS =====
async function buscarLogs(runId) {
    try {
        const resposta = await fetch(
            `https://api.github.com/repos/fhatom2/sala-futuro-auto/actions/runs/${runId}/logs`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        const logs = await resposta.text();
        adicionarLog('📄 Logs recebidos:', 'info');
        // Mostra as últimas linhas do log
        const linhas = logs.split('\n').filter(l => l.trim());
        const ultimas10 = linhas.slice(-10);
        ultimas10.forEach(linha => {
            adicionarLog('  ' + linha, 'info');
        });
        
        // Atualiza contador se tiver sucesso
        if (logs.includes('✅')) {
            dados.tarefasFeitas = dados.tarefasTotal;
            atualizarContador();
        }
        
    } catch (erro) {
        adicionarLog('⚠️ Não foi possível buscar os logs', 'erro');
    }
    }
