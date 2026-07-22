name: Automação Sala do Futuro

on:
  schedule:
    - cron: '0 8,12,18 * * *'  # 8h, 12h, 18h todos os dias
  workflow_dispatch:  # Permite rodar manualmente

jobs:
  executar-tarefas:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do código
        uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Instalar dependências
        run: |
          pip install selenium webdriver-manager
          sudo apt-get update
          sudo apt-get install -y chromium-browser chromium-chromedriver
      
      - name: Executar automação
        env:
          RA: ${{ secrets.RA }}
          DIGITO: ${{ secrets.DIGITO }}
          UF: ${{ secrets.UF }}
          SENHA: ${{ secrets.SENHA }}
        run: |
          python backend.py
