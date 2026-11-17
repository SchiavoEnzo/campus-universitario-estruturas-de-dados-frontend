# Campus Viva — entrega final de Estrutura de Dados

Navegação em campus com React, FastAPI e Dijkstra em Python. Equipe: preencher nome completo e RA de cada integrante antes do envio. Prazo indicado na especificação: 24/11/2026, no Teams.

## Repositórios

Clone os dois projetos na mesma pasta, com os nomes locais abaixo:

```bash
git clone https://github.com/SchiavoEnzo/campus-universitario-estruturas-de-dados-frontend.git frontend
git clone https://github.com/SchiavoEnzo/campus-universitario-estruturas-de-dados-backend.git backend
```

## Execução local sem credenciais

Use Python 3.12 e Node.js compatível com Vite 7 (Linux: ambiente usado para verificação). Na raiz:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
CAMPUS_STORAGE=memory CAMPUS_DATASET=original python -m uvicorn app:app --port 8000
```

No PowerShell, ative com `./.venv/Scripts/Activate.ps1`; antes de iniciar Uvicorn, defina `$env:CAMPUS_STORAGE='memory'` e `$env:CAMPUS_DATASET='original'`.

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

Abra o endereço Local informado pelo Vite. Em **Planejar rota**, selecione **Bloco A → Laboratório de Informática** por distância e clique em **Calcular rota**. Resultado esperado: Bloco A → Biblioteca → Laboratório de Informática, 250 m. Selecione **Bloco A → Laboratório de Carcanhas** para ver a mensagem de ausência de caminho. No mesmo mapa, **Bloco A → Bloco A** retorna 0 m. Use `CAMPUS_DATASET=frontend` no backend para iniciar com o mapa expandido. Reiniciar o modo em memória descarta alterações. As demais telas React usam dados de demonstração.

Swagger: http://localhost:8000/docs. API: `GET /api/graph`, `POST /api/routes`. Os endpoints administrativos estão documentados em backend/docs/README_API.md.

## Testes e entrega

No ambiente virtual, na pasta backend:

```bash
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

Dados: backend/data/frontend.json e backend/campus/campus_navigation.py. Casos, entradas e saídas: backend/docs/CampusViva_Casos_de_Teste.pdf. As duas pastas frontend/ e backend/ contêm fontes e dependências. backend/docs/ contém caderno, testes, roteiro e checklist. Não inclua arquivos .env, tokens ou URIs privadas no Git.

## Vercel e MongoDB Atlas

Para publicar, use a pasta backend/ como raiz do projeto Vercel. Configure MONGODB_URI, MONGODB_DB, CAMPUS_DATASET e CORS_ORIGINS. O modo em memória não é usado no Vercel. Para o React hospedado separadamente, informe VITE_API_URL no build e autorize a origem do frontend na API. Valide /api/graph após provisionar o Atlas. A nuvem é opcional para a avaliação local; não foi homologada nesta entrega.
