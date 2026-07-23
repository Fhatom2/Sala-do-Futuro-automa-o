# ============================================
# BACKEND - RECEBE DADOS DO FRONTEND
# ============================================

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import json
import sys

def fazer_tarefas(ra, digito, uf, senha):
    """Recebe os dados do frontend e faz as tarefas"""
    
    resultado = {
        'sucesso': False,
        'tarefas_feitas': 0,
        'tarefas_total': 0,
        'logs': []
    }
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    
    driver = None
    
    try:
        resultado['logs'].append(f'🚀 Iniciando para RA: {ra}...')
        
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        
        # 1. Acessar o site
        driver.get('https://saladofuturo.educacao.sp.gov.br')
        time.sleep(3)
        
        # 2. Clicar em "Estudante"
        botao_estudante = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(),'Estudante')]"))
        )
        botao_estudante.click()
        time.sleep(2)
        
        # 3. Preencher dados (usando os que vieram do frontend)
        driver.find_element(By.ID, 'ra').send_keys(ra)
        driver.find_element(By.ID, 'digito').send_keys(digito)
        driver.find_element(By.ID, 'uf').send_keys(uf)
        driver.find_element(By.ID, 'senha').send_keys(senha)
        
        # 4. Clicar em "Acessar"
        driver.find_element(By.XPATH, "//button[contains(text(),'Acessar')]").click()
        time.sleep(5)
        
        # 5. Verificar login
        if "login" in driver.current_url.lower():
            resultado['logs'].append('❌ Falha no login! Verifique seus dados.')
            return resultado
        
        resultado['logs'].append('✅ Login realizado com sucesso!')
        
        # 6. Navegar para "Tarefa SP"
        try:
            tarefa_sp = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "Tarefa SP"))
            )
            tarefa_sp.click()
            time.sleep(3)
        except:
            driver.find_element(By.XPATH, "//a[contains(@href, 'tarefa')]").click()
            time.sleep(3)
        
        # 7. Filtrar "A Fazer"
        try:
            a_fazer = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'A Fazer')]"))
            )
            a_fazer.click()
            time.sleep(2)
        except:
            pass
        
        # 8. Encontrar tarefas
        tarefas = driver.find_elements(By.XPATH, "//div[contains(@class, 'tarefa')]")
        resultado['tarefas_total'] = len(tarefas)
        resultado['logs'].append(f'📚 Encontradas {len(tarefas)} tarefas')
        
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
                
                botoes = driver.find_elements(By.XPATH, 
                    "//button[contains(text(),'Iniciar') or contains(text(),'Concluir')]")
                if botoes:
                    botoes[0].click()
                    time.sleep(3)
                    resultado['tarefas_feitas'] += 1
                    resultado['logs'].append(f'✅ Tarefa {i} concluída!')
                else:
                    resultado['logs'].append(f'⚠️ Tarefa {i} sem botão')
                    
            except Exception as e:
                resultado['logs'].append(f'❌ Erro na tarefa {i}: {str(e)}')
            
            driver.back()
            time.sleep(2)
        
        resultado['sucesso'] = True
        resultado['logs'].append(f'🎉 Finalizado! {resultado["tarefas_feitas"]}/{resultado["tarefas_total"]}')
        
    except Exception as e:
        resultado['logs'].append(f'❌ ERRO: {str(e)}')
    
    finally:
        if driver:
            driver.quit()
    
    return resultado

# ===== EXECUTAR (recebe dados por linha de comando) =====
if __name__ == "__main__":
    if len(sys.argv) >= 5:
        ra = sys.argv[1]
        digito = sys.argv[2]
        uf = sys.argv[3]
        senha = sys.argv[4]
        
        resultado = fazer_tarefas(ra, digito, uf, senha)
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
    else:
        print("❌ Uso: python backend.py <RA> <DIGITO> <UF> <SENHA>")
