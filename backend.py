import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import json
import sys

def fazer_tarefas(ra, digito, uf, senha):
    """Função principal que será chamada pelo GitHub Actions"""
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    resultado = {
        'sucesso': False,
        'tarefas_feitas': 0,
        'tarefas_total': 0,
        'log': []
    }
    
    try:
        # Login
        driver.get('https://salaofuturo.educacao.sp.gov.br')
        time.sleep(2)
        
        # Clicar em Estudante
        driver.find_element(By.XPATH, "//a[contains(text(),'Estudante')]").click()
        time.sleep(2)
        
        # Preencher dados
        driver.find_element(By.ID, 'ra').send_keys(ra)
        driver.find_element(By.ID, 'digito').send_keys(digito)
        driver.find_element(By.ID, 'uf').send_keys(uf)
        driver.find_element(By.ID, 'senha').send_keys(senha)
        driver.find_element(By.XPATH, "//button[contains(text(),'Acessar')]").click()
        time.sleep(5)
        
        resultado['log'].append('✅ Login realizado com sucesso')
        
        # Ir para Tarefa SP
        driver.find_element(By.LINK_TEXT, "Tarefa SP").click()
        time.sleep(3)
        
        # Pegar tarefas "A Fazer"
        a_fazer = driver.find_element(By.XPATH, "//button[contains(text(),'A Fazer')]")
        a_fazer.click()
        time.sleep(2)
        
        tarefas = driver.find_elements(By.XPATH, "//div[contains(@class, 'tarefa')]")
        resultado['tarefas_total'] = len(tarefas)
        
        if resultado['tarefas_total'] == 0:
            resultado['log'].append('📭 Nenhuma tarefa disponível')
            resultado['sucesso'] = True
            return resultado
        
        # Fazer cada tarefa
        for i, tarefa in enumerate(tarefas, 1):
            try:
                tarefa.click()
                time.sleep(2)
                
                # Tentar concluir
                botoes = driver.find_elements(By.XPATH, 
                    "//button[contains(text(),'Iniciar') or contains(text(),'Concluir')]")
                if botoes:
                    botoes[0].click()
                    time.sleep(3)
                    resultado['tarefas_feitas'] += 1
                    resultado['log'].append(f'✅ Tarefa {i} concluída')
                else:
                    resultado['log'].append(f'⚠️ Tarefa {i} sem botão de conclusão')
                    
            except Exception as e:
                resultado['log'].append(f'❌ Erro na tarefa {i}: {str(e)}')
            
            # Voltar para lista
            driver.back()
            time.sleep(2)
        
        resultado['sucesso'] = True
        resultado['log'].append('🎉 Todas as tarefas processadas!')
        
    except Exception as e:
        resultado['log'].append(f'❌ ERRO: {str(e)}')
    
    finally:
        driver.quit()
    
    return resultado

if __name__ == "__main__":
    if len(sys.argv) >= 5:
        ra = sys.argv[1]
        digito = sys.argv[2]
        uf = sys.argv[3]
        senha = sys.argv[4]
        resultado = fazer_tarefas(ra, digito, uf, senha)
        print(json.dumps(resultado, indent=2))
