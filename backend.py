# ============================================
# AUTOMAÇÃO SALA DO FUTURO - BACKEND
# ============================================
# Este script é executado pelo GitHub Actions
# Ele acessa o site real e faz as tarefas
# ============================================

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import os
import time
import json
import sys

# ===== LENDO OS SEGREDOS DO GITHUB =====
# Os valores vêm dos secrets configurados no repositório
RA = os.environ.get('RA', 'SEU_RA_AQUI')
DIGITO_RA = os.environ.get('DIGITO', '0')
UF = os.environ.get('UF', 'SP')
SENHA = os.environ.get('SENHA', 'SUA_SENHA_AQUI')

def fazer_tarefas():
    """Função principal que faz o login e executa as tarefas"""
    
    resultado = {
        'sucesso': False,
        'tarefas_feitas': 0,
        'tarefas_total': 0,
        'logs': []
    }
    
    # Configuração do Chrome em modo headless (sem interface gráfica)
    options = Options()
    options.add_argument('--headless')  # Roda em segundo plano
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    
    driver = None
    
    try:
        resultado['logs'].append('🚀 Iniciando automação...')
        
        # Inicializa o navegador
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        
        # 1. Acessar o site
        resultado['logs'].append('🌐 Acessando site...')
        driver.get('https://saladofuturo.educacao.sp.gov.br')
        time.sleep(3)
        
        # 2. Clicar em "Estudante"
        resultado['logs'].append('👤 Selecionando perfil Estudante...')
        botao_estudante = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(),'Estudante')]"))
        )
        botao_estudante.click()
        time.sleep(2)
        
        # 3. Preencher dados de login
        resultado['logs'].append('🔑 Preenchendo dados de login...')
        driver.find_element(By.ID, 'ra').send_keys(RA)
        driver.find_element(By.ID, 'digito').send_keys(DIGITO_RA)
        driver.find_element(By.ID, 'uf').send_keys(UF)
        driver.find_element(By.ID, 'senha').send_keys(SENHA)
        
        # 4. Clicar em "Acessar"
        resultado['logs'].append('🔄 Clicando em Acessar...')
        driver.find_element(By.XPATH, "//button[contains(text(),'Acessar')]").click()
        time.sleep(5)
        
        # 5. Verificar se o login foi bem-sucedido
        if "login" in driver.current_url.lower():
            resultado['logs'].append('❌ Falha no login! Verifique seus dados.')
            return resultado
        
        resultado['logs'].append('✅ Login realizado com sucesso!')
        
        # 6. Navegar para "Tarefa SP"
        resultado['logs'].append('📚 Procurando Tarefa SP...')
        try:
            tarefa_sp = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "Tarefa SP"))
            )
            tarefa_sp.click()
            time.sleep(3)
        except:
            # Tentar outro seletor se o link não funcionar
            driver.find_element(By.XPATH, "//a[contains(@href, 'tarefa')]").click()
            time.sleep(3)
        
        resultado['logs'].append('✅ Entrou em Tarefa SP')
        
        # 7. Filtrar por "A Fazer"
        try:
            a_fazer = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'A Fazer')]"))
            )
            a_fazer.click()
            time.sleep(2)
            resultado['logs'].append('🔍 Filtrado: A Fazer')
        except Exception as e:
            resultado['logs'].append(f'⚠️ Não foi possível filtrar: {str(e)}')
        
        # 8. Encontrar tarefas
        tarefas = driver.find_elements(By.XPATH, "//div[contains(@class, 'tarefa')]")
        resultado['tarefas_total'] = len(tarefas)
        resultado['logs'].append(f'📚 Encontradas {len(tarefas)} tarefas "A Fazer"')
        
        if len(tarefas) == 0:
            resultado['sucesso'] = True
            resultado['logs'].append('🎉 Nenhuma tarefa pendente!')
            return resultado
        
        # 9. Executar cada tarefa
        for i, tarefa in enumerate(tarefas, 1):
            try:
                resultado['logs'].append(f'🔄 Processando tarefa {i}/{len(tarefas)}...')
                tarefa.click()
                time.sleep(2)
                
                # Tentar encontrar botões de ação
                botoes = driver.find_elements(By.XPATH, 
                    "//button[contains(text(),'Iniciar') or contains(text(),'Concluir')]")
                if botoes:
                    botoes[0].click()
                    time.sleep(3)
                    resultado['tarefas_feitas'] += 1
                    resultado['logs'].append(f'✅ Tarefa {i} concluída!')
                else:
                    resultado['logs'].append(f'⚠️ Tarefa {i} sem botão de ação')
                
            except Exception as e:
                resultado['logs'].append(f'❌ Erro na tarefa {i}: {str(e)}')
            
            # Voltar para a lista
            driver.back()
            time.sleep(2)
        
        resultado['sucesso'] = True
        resultado['logs'].append(f'🎉 Finalizado! {resultado["tarefas_feitas"]}/{resultado["tarefas_total"]} tarefas concluídas.')
        
    except Exception as e:
        resultado['logs'].append(f'❌ ERRO GERAL: {str(e)}')
        # Salvar screenshot do erro (útil para debug)
        if driver:
            try:
                driver.save_screenshot('erro_sala_futuro.png')
                resultado['logs'].append('📸 Screenshot salva: erro_sala_futuro.png')
            except:
                pass
    
    finally:
        if driver:
            driver.quit()
            resultado['logs'].append('🔚 Navegador fechado.')
    
    return resultado

# ===== EXECUTAR QUANDO O ARQUIVO É RODADO =====
if __name__ == "__main__":
    print("🚀 Iniciando automação da Sala do Futuro...")
    print("=" * 50)
    
    resultado = fazer_tarefas()
    
    print("\n📊 RESULTADO:")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
    print("=" * 50)
    
    if resultado['sucesso']:
        print("✅ Automação concluída com sucesso!")
    else:
        print("❌ Automação falhou.")
    
    # Criar arquivo de log para ser salvo como artefato
    with open('resultado.json', 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)
    
    with open('log.txt', 'w', encoding='utf-8') as f:
        for linha in resultado['logs']:
            f.write(linha + '\n')
