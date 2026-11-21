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

Abra o endereço Local informado pelo Vite. Em **Planejar rota**, selecione **Bloco A → Laboratório de Informática** por distância e clique em **Calcular rota**. Resultado esperado: Bloco A → Biblioteca → Laboratório de Informática, 250 m. Selecione **Bloco A → Laboratório de Carcanhas** para ver a mensagem de ausência de caminho. No mesmo mapa, **Bloco A → Bloco A** retorna 0 m. Use `CAMPUS_DATASET=frontend` no backend para iniciar com o mapa expandido. Reiniciar o modo em memória descarta alterações. Todas as telas do mapa usam os dados da API, inclusive locais, conexões, indicadores, acessibilidade e interdições.

Swagger: http://localhost:8000/docs. API: `GET /api/graph`, `POST /api/routes`. Os endpoints administrativos estão documentados em backend/docs/README_API.md.

## Testes e entrega

No ambiente virtual, na pasta backend:

```bash
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

Dados: backend/data/frontend.json e backend/campus/campus_navigation.py. Casos, entradas e saídas: backend/docs/CampusViva_Casos_de_Teste.pdf. As duas pastas frontend/ e backend/ contêm fontes e dependências. backend/docs/ contém caderno, testes, roteiro e checklist. Não inclua arquivos .env, tokens ou URIs privadas no Git.

## Vercel e MongoDB Atlas

Para publicar, use a pasta backend/ como raiz do projeto Vercel. Configure MONGODB_URI, MONGODB_DB, CAMPUS_DATASET e CORS_ORIGINS. O modo em memória não é usado no Vercel. Para o React hospedado separadamente, informe VITE_API_URL no build e autorize a origem do frontend na API. Valide /api/graph após provisionar o Atlas. Em produção, o frontend consulta o backend, que lê a coleção `campus_viva.graphs` no Atlas. A URI do banco permanece somente no backend.


## Sincronização do mapa

O frontend consulta `/api/graph` ao abrir, ao navegar, ao voltar à aba, ao recuperar conexão e a cada 15 segundos enquanto a aba está visível. O botão **Atualizar dados** força uma consulta. Não há assinatura em tempo real: mudanças externas podem levar até o próximo ciclo para aparecer. Respostas antigas não sobrescrevem consultas mais recentes.

Não há fallback para mapa fictício: falhas de rede ou dados inválidos exibem uma mensagem e permitem tentar novamente. Rotas calculadas são ocultadas quando o mapa muda. Detalhes, filtros e indicadores são derivados do mesmo mapa.

Os formulários de locais e conexões gravam pela API após login administrativo. Use **Entrar**, informe usuário/senha e troque a senha inicial quando solicitado. A sessão dura até 8 horas, persiste ao recarregar e é revogada ao sair ou alterar a senha. O frontend não armazena senhas ou tokens de sessão em localStorage/sessionStorage; usa cookie HttpOnly e CSRF em memória.

Em produção, `VITE_API_URL` deve ficar vazio: o `vercel.json` encaminha `/api/*` para o backend, mantendo o cookie no domínio do site. Localmente, o proxy do Vite atende a mesma finalidade.

Veríssimo e Enzo têm perfil administrativo. As senhas iniciais ficam no arquivo privado `.env.demo-users.json` do backend. A navegação de gestão aparece após login e troca da senha inicial, inclusive em telas pequenas. O servidor verifica as permissões em todas as gravações.

Favoritos pessoais ainda não possuem endpoints. Interdições representam conexões com `blocked=true`; acessibilidade usa `accessible=true` e exclui trechos bloqueados.

## Verificação do frontend

```bash
npm ci
npx playwright install chromium
npm test
npm run build
```

Os testes de navegador usam uma API controlada, sem modificar o Atlas: atualização compartilhada, mudanças de revisão, detalhes abertos, gravações autorizadas e rejeitadas, exclusão, bloqueios, consulta periódica, recuperação após falha e banco vazio.
