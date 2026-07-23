// ===== FAZER TAREFAS (CHAMA O BACKEND) =====
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
    
    mostrarMensagem(statusTarefas, '⏳ Conectando ao backend...', 'info');

    try {
        // Envia os dados para o GitHub Actions
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
        dados.tarefasFeitas = resultado.tarefas_feitas || 0;
        dados.tarefasTotal = resultado.tarefas_total || 0;
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
        mostrarMensagem(statusTarefas, '❌ Erro: ' + erro.message, 'erro');
        adicionarLog('❌ Erro ao conectar ao backend', 'erro');
    }
    
    dados.tarefasEmAndamento = false;
    btnTarefas.disabled = false;
    btnTarefas.textContent = 'Fazer Tarefas';
});
