# Verificação: nome do jogador vs imagem no aplicativo

## Causa raiz

- O **nome** na UI vem de `src/data/players.ts` + regra de slots (2–12 e 14–20 = 18 jogadores).
- A **imagem** vem do arquivo `NN.png` gerado pelo script de importação ao mapear **posição na grade 4×4** do PDF → número do slot.
- O script `scripts/import-grupo.py` usa uma ordem **fixa** nas células (`[1, 13, 2, 3, …]` em ordem de linha). **Só fica certo se a folha Panini seguir exatamente essa ordem.**

Times em que o PDF **não** segue essa ordem aparecem com **foto de um jogador e nome de outro**.

## Grupos importados com `import-grupo.py` (ordem sequencial)

Grupos **E a L** (exceto onde você ainda usa script dedicado só no Grupo A com mapa por célula) estão sujeitos a esse desalinhamento **em qualquer seleção** cuja folha não coincida com a grade sequencial.

**Não dá para listar automaticamente “quem está errado” em 48 seleções** sem comparar visualmente cada folha (ou OCR confiável nos nomes impressos na figurinha). O exemplo que você mandou (França) foi inspecionado manualmente.

## França (FRA) — Grupo I, página 1 do `GRUPO I.pdf`

Ordenação no PDF (linha a linha, esquerda → direita), conforme a folha:

| Posição na grade | Quem aparece na **foto** (folha) | Slot no app (mapeamento sequencial atual) | Nome que o app mostra (`players.ts`) | Coincide? |
|------------------|----------------------------------|--------------------------------------------|--------------------------------------|-----------|
| (0,0) | Escudo | 1 | Escudo | Sim |
| (0,1) | Foto oficial | 13 | Foto oficial | Sim |
| (0,2) | Mike Maignan | 2 | Mike Maignan | Sim |
| (0,3) | Kylian Mbappé | 3 | Theo Hernández | **Não** |
| (1,0) | Axel Disasi | 4 | William Saliba | **Não** |
| (1,1) | Kingsley Coman | 5 | Jules Koundé | **Não** |
| (1,2) | Jules Koundé | 6 | Ibrahima Konaté | **Não** |
| (1,3) | Dayot Upamecano | 7 | Dayot Upamecano | Sim |
| (2,0) | Ferland Mendy | 8 | Lucas Digne | **Não** |
| (2,1) | Adrien Rabiot | 9 | Aurélien Tchouaméni | **Não** |
| (2,2) | Youssouf Fofana (rótulo na folha pode divergir) | 10 | Eduardo Camavinga | **Não** |
| (2,3) | Eduardo Camavinga (rótulo na folha pode divergir) | 11 | Manu Koné | **Não** |
| (3,0) | Aurélien Tchouaméni | 12 | Adrien Rabiot | **Não** |
| (3,1) | Michael Olise | 14 | Michael Olise | Sim (face) |
| (3,2) | Lucas Digne | 15 | Ousmane Dembélé | **Não** |
| (3,3) | Ibrahima Konaté | 16 | Bradley Barcola | **Não** |

Slots **17–20** ficam na **página 5** do mesmo PDF (última linha do Grupo I); não houve conferência visual aqui na documentação — vale abrir a figurinha no app slot a slot.

### Observação extra

Alguns jogadores da **folha** (ex.: Axel Disasi, Ferland Mendy) **não estão** no elenco atual de `players.ts`. Mesmo corrigindo o mapa de células, pode ser preciso **alinhar o elenco** ao álbum oficial ou aceitar rótulos diferentes.

## Próximo passo técnico recomendado

1. Por seleção “com problema”, definir no script um mapa **por célula** → número do slot, no estilo de `scripts/import-grupo-a.py` (campo `SLOTS` / `GROUP_TEAMS` + overrides por pasta `fra`, `sen`, …).
2. Reexportar PNGs e o JSON `grupo-*-images.json` só daquele grupo.
3. Opcional: alinhar `PLAYER_ROSTERS` ao texto oficial do álbum para o mesmo país.

### Exemplos que você enviou (França)

| Slot | Sintoma | Causa |
|------|---------|--------|
| **FRA 3** | Aparece **Mbappé** na imagem, nome **Theo Hernández** no app | `03.png` recebia a célula onde a folha tem Mbappé; no elenco o 3 é o Theo. |
| **FRA 20** | Aparece **Theo** na figurinha Panini, nome **Kylian Mbappé** no app | `20.png` recebia a última célula da linha da pág. 5 (Theo na folha); no elenco o 20 é Mbappé. |

Correção aplicada em `scripts/import-grupo.py`: `SLOT_OVERRIDES["fra"]` troca essas duas células para alinhar com `players.ts` (reimportar Grupo I).

## Alinhamento em massa (OCR)

O script `scripts/reorder-stickers-by-roster-ocr.py` lê o nome na parte inferior de cada figurinha (Tesseract), cruza com `players.ts` por **atribuição ótima** (matriz 18×18) e regrava os `NN.png` nos slots corretos. Escudo `01` e foto `13` não são alterados.

Dependências no venv: `pip install pytesseract Pillow rapidfuzz scipy` (além do `tesseract` no sistema).

Uso: `.venv-pdf/bin/python3 scripts/reorder-stickers-by-roster-ocr.py` (todas as pastas em `public/stickers/`) ou `… fra ned` para times específicos.

**Requisitos:** cada seleção em `players.ts` precisa de **18** nomes (slots 2–12 e 14–20). O relatório JSON em `scripts/ocr-reorder-report.json` traz média de confiança por time; médias muito baixas indicam OCR fraco ou elenco fora do texto da figurinha.

**Grupo A** (`mex`, `rsa`, `kor`, `cze`) e **Grupo B** (`can`, `bih`, `qat`, `sui`): o script **ignora** essas pastas por predefinição (recorte = `import-grupo-a.py` / `import-grupo-b.py`). Use `--force` só se necessário. Reimportar: `import-grupo-a.py` e `import-grupo-b.py`.
