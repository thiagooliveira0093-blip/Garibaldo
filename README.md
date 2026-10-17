# Garibaldo — O Salão dos Tormentos

Sobrevivência em hordas feita em **Phaser 3**, no estilo **Halls of Torment** (e Vampire Survivors): visão
de cima num salão de pedra escuro, hordas cada vez maiores, **armas que atacam sozinhas**, XP, melhorias a
cada nível e um chefe no fim. (As versões anteriores — run'n'gun e plataforma estilo Dead Cells — estão no
histórico do Git.)

## Como se joga

- Você é o **Garibaldo**, o mago de capuz. **Só se move e rola**; as armas atacam o inimigo mais próximo.
- Escolha **uma arma** no começo; as outras aparecem depois como melhorias.
- Inimigos soltam **gemas de XP** (ande até elas) e às vezes ouro e poções. A cada nível aparecem **3 cartas**:
  melhorar uma arma, pegar uma arma nova (até 4) ou uma melhoria passiva.
- Sobreviva até o **Senhor Demônio** chegar (aos 7:00) e derrote-o para vencer.
- O ouro de cada partida fica guardado no navegador.

| Arma | O que faz | Melhorias |
|---|---|---|
| **Espada** | golpeia em arco os inimigos próximos | dano, alcance, golpe também atrás, mais rápida, onda de energia |
| **Arco** | flechas no inimigo mais próximo | mais flechas, dano, atravessam inimigos, mais rápido |
| **Anel** | orbes de magia giram ao seu redor e ferem quem tocar | mais orbes, dano, órbita maior, mais rápido, nova periódica |

**Melhorias passivas:** Vigor (vida), Botas (velocidade), Fúria (dano), Clepsidra (recarga), Ímã (coleta),
Sabedoria (XP), Escudo (armadura), Renovação (regeneração) e os **elementos**, que valem para todas as armas:
**Chama** (queima), **Geada** (deixa lento) e **Tempestade** (o dano salta para outro inimigo).

**Inimigos:** Carniçal (corre até você), Morcego (voa em zigue-zague), Esqueleto (mantém distância e atira
flechas), Bruto (lento e muito forte), elites (douradas, aparecem depois dos 3 minutos) e o chefe, que atira
anéis de orbes, leques e invoca carniçais. Aos poucos vêm eventos em que um anel de inimigos cerca você.

## Controles

| Ação | Teclas |
|---|---|
| Mover | WASD ou setas |
| Rolar (invulnerável por um instante) | Espaço, Shift ou C |
| Escolher melhoria | 1, 2, 3 ou clique na carta |
| Pausar / Mudo | P / M |
| Jogar de novo / trocar de arma (fim da partida) | R / T |

Para remapear, edite `src/systems/controls.js`.

## Rodar

```bash
npm install
npm start
```

Abra http://localhost:5173. Para publicar (itch.io, GitHub Pages etc.), envie a pasta inteira **sem**
`node_modules/` (`index.html`, `vendor/`, `src/`, `assets/`).

## Estrutura

```
assets/
  sprites/   hero, ghoul, skeleton, brute, bat, boss, items, props, explosion, spark (PNG)
  tiles/     floor (4 lajes), wall
src/
  config.js        balanceamento: herói, inimigos, ritmo das hordas, eventos, XP
  weapons.js       as 3 armas automáticas e o que cada nível melhora
  upgrades.js      melhorias passivas e o sorteio das 3 cartas
  assets.js        lista de sprites e animações
  scenes/          Boot, Title, Select (arma), Hall (o jogo), UI (HUD, cartas, fim)
  entities/        Hero, Enemy (carniçal, esqueleto, bruto, morcego, chefe)
  systems/         weapon-system, spawner, hall-map (salão), light (escuridão), effects, sfx, save, controls
tools/             geradores da arte placeholder (npm run arte)
```

## Ajustar o jogo

- **Dificuldade:** `src/config.js`: `spawnRate` (inimigos por segundo), `spawnMix` (quais tipos e quando),
  `hpScale`, `EVENTS` (anéis de inimigos), `RUN.bossAt` (quando o chefe chega), `HERO` (vida, velocidade).
- **Armas e melhorias:** `src/weapons.js` (`base` = nível 1, `ups` = o que cada nível muda) e `src/upgrades.js`.
- **Inimigos:** `ENEMIES` em `src/config.js` (vida, velocidade, dano ao encostar, XP) e o comportamento em
  `src/entities/Enemy.js` (`chaser`, `flyer`, `archer`, `boss`).

## Trocar a arte

Os PNGs são **placeholders** gerados por código; substitua mantendo o tamanho do quadro e a ordem:

| Arquivo | Quadro | Ordem |
|---|---|---|
| `hero.png` | 64x64, 8 colunas | vista × 8 + k: vista 0 = frente, 1 = costas, 2 = lado (o jogo espelha); k 0-1 parado, 2-7 andando · 24-26 dano · 27 caído. Pés em (32, 56) |
| `ghoul.png`, `brute.png` | 48x48 / 64x64 | vista × 4 + k (k = 4 quadros de andar) |
| `skeleton.png` | 48x48 | vista × 5 + k (k 0-3 andar, 4 atirar) |
| `bat.png` | 32x32 | 4 quadros de voo |
| `boss.png` | 128x128 | 0-3 parado, 4-5 atacando |
| `items.png` | 32x32, 8 colunas | 0-2 gemas · 3-6 moeda · 7 poção · 8-10 ícones das armas · 11-21 ícones de melhorias e elementos · 22-29 projéteis (ver `ITEM` em `src/assets.js`) |
| `props.png` | 64x96, 8 colunas | 0 pilar · 1-4 braseiro · 5 ossos · 6 urna · 7 túmulo |
| `floor.png` | 256x64 | 4 lajes de 64x64 |

`npm run arte` regenera os placeholders; arquivos que já existem não são sobrescritos (use `-- --force`
em cada script de `tools/` para forçar).
