# Garibaldo — Guerra Arcana

Ação 2D feita em **Phaser 3**, caminhando para o estilo **Dead Cells**: combate com peso, rolamento
com invulnerabilidade, inimigos que avisam antes de atacar e armas que se encaixam em estilos de jogo.
(A versão run'n'gun anterior está no histórico do Git.)

**Combate**
- **2 armas por vez** (J e K) + **habilidade** (L, enche ao acertar e desviar) + **rolamento** (Shift/C).
- **Espada:** combo de 3 golpes (o 3º é o finalizador: empurra e atordoa). Encadeie apertando de novo
  logo depois do corte. Destrói tiros pequenos.
- **Arco:** toque = flecha fraca; **segure para carregar** (mais dano e velocidade; carga alta atravessa).
- **Anel:** magia teleguiada. A gema (1/2/3) define o efeito: Fogo explode, Gelo perfura e deixa lento,
  Raio dispara 3 e destrói tiros roxos.
- **Rolamento:** invulnerável no começo, cancela qualquer ataque e atravessa inimigos. Rolar por dentro de
  um ataque é **esquiva perfeita** (câmera lenta + energia); rolar por dentro de um inimigo o deixa de costas
  por um instante: atacar pelas costas causa **golpe crítico**.
- **Sem dano por encostar:** só ataques machucam. Soldados e magos mostram um brilho antes de atacar; um
  golpe forte durante o brilho **interrompe** o ataque (brutamontes e chefe têm armadura).
- Impacto: pausa curta no golpe, empurrão, número de dano.

Você escolhe uma de **3 classes** antes de começar:

| Classe | Estilo | Armas | Rolamento | Habilidade |
|---|---|---|---|---|
| **Garibaldo** (Mago) | 100 de vida; Anel com +25% de dano | Anel (J) · Espada espiritual (K) | médio | Explosão Arcana |
| **Bruno** (Guerreiro) | tanque, 160 de vida; espada com +25% | Espadada (J) · Arco (K) | curto e pesado | Terremoto |
| **Leo** (Arqueiro) | frágil, 80 de vida, pulo duplo; arco com +25% e adaga com crítico x2,2 | Arco (J) · Adaga (K) | longo e rápido | Chuva de Flechas |

Os nomes Bruno e Leo são provisórios: troque em `src/characters.js`.

A vida aparece numa **barra** no canto superior esquerdo (com um rastro claro do dano recente e uma
divisão a cada golpe). Cada golpe ou tiro inimigo tira `HIT_DAMAGE` (20) e cada coração recupera
`HEAL` (20), ambos em `src/config.js`; a vida máxima de cada herói fica em `src/characters.js`.

## Rodar

```bash
npm install
npm start
```

Abra http://localhost:5173. Para ver as hitboxes, use http://localhost:5173/?debug.

Para publicar (itch.io, GitHub Pages etc.), envie a pasta inteira **sem** `node_modules/`
(`index.html`, `vendor/`, `src/`, `assets/`).

## Estrutura

```
assets/
  sprites/   spritesheets (player, inimigos, chefe, projéteis, explosão)
  tiles/     tileset das fases (tiles.png)
  bg/        fundos com parallax (sky, far, mid — 960x540, repetem na horizontal)
  maps/      fases no formato do Tiled (.tmj)
src/
  config.js          TODOS os números de balanceamento (vida, dano, velocidade, poderes...)
  assets.js          lista de sprites + animações (quadros e velocidade)
  scenes/            Boot (carrega), Title, Game (jogo), UI (HUD)
  entities/          Player, Enemy (base), enemies.js (soldado, mago, drone, brutamontes), Boss
  systems/           controles, ondas, efeitos, som, parallax
tools/               geradores dos placeholders e da fase 1
```

## Trocar os sprites

Os PNGs em `assets/` são **placeholders** gerados por código. Para colocar a arte final,
basta substituir o arquivo mantendo o **tamanho do quadro** e a **ordem dos quadros**.
Todos os personagens são desenhados **virados para a direita**, com os **pés no centro da
borda de baixo** do quadro (o jogo espelha sozinho).

| Arquivo | Quadro | Quadros (índice → animação) |
|---|---|---|
| `garibaldo_fire.png`, `garibaldo_ice.png`, `garibaldo_bolt.png`, `warrior.png`, `archer.png` | 96x80, 7 colunas | Mago (um sheet por poder: olhos, fecho e magia mudam de cor), Guerreiro e Arqueiro. Mesmo layout nos 3: 0-3 parado · 4-5 agachado · 6-7 dano · 8-13 correndo · 14 pulo · 15 queda · 16-21 ataque à distância · 22-23 rolamento · 24-27 morte · 28-33 golpe corpo a corpo · 34-39 e 40-45 ataque à distância nativo na diagonal e para cima · 46-63 arco do guerreiro (horizontal, diagonal, cima). Pés em x=36, y=79. O jogo desenha os heróis em **1,5x** (`SCALE` em `src/entities/Player.js`) e os inimigos comuns em 1,25x (`scale` em `src/config.js`). |
| `proj3.png` | 32x32, 8 colunas | 0-1 flecha · 2-3 flecha de fogo · 4 lança · 5-8 machado · 9-10 tremor · 11-16 ícones do HUD |
| `fireball.png` | 32x32 | bola de fogo do jogador (cabeça em x=21, y=17; rastro para a esquerda) |
| `grunt.png` | 48x48 | 0-1 parado · 2-5 andando · 6-7 atacando |
| `caster.png` | 48x64 | 0-3 parado · 4-5 conjurando |
| `drone.png` | 48x32 | 0-3 voando · 4-5 atacando |
| `heavy.png` | 80x80 | 0-1 parado · 2-5 andando · 6-7 atacando |
| `boss.png` | 160x192, 5 colunas | 0-3 parado · 4-5 atacando · 6-9 fúria |
| `projectiles.png` | 32x32, 8 colunas | 0-1 fogo · 2-3 gelo · 4-5 raio · 6 coração · 7 mana · 8-9 orbe roxo · 10-11 orbe vermelho · 12-13 morteiro · 14-15 meteoro · 16-17 onda de chão · 19-21 orbe na mão (fogo/gelo/raio) · 22 brilho branco |
| `explosion.png` | 64x64 | 0-5 |

Quer **mais quadros** ou outro tamanho? Edite `src/assets.js`: o tamanho do quadro fica em
`SHEETS` e os quadros de cada animação em `ANIMS`. Se o tamanho do personagem mudar, ajuste a
hitbox (`body`) em `src/config.js`.

Ferramentas sugeridas: **Aseprite** (pago) ou **LibreSprite** (grátis). Exporte como
*sprite sheet* em grade, sem espaçamento entre quadros.

`npm run placeholders` regenera **só os arquivos que não existem** — sua arte não é
sobrescrita (use `-- --force` se quiser voltar aos placeholders).

## Editar e criar fases (Tiled)

Instale o [Tiled](https://www.mapeditor.org/) e abra `assets/maps/fase1.tmj`.
O mapa usa tiles de 32x32 e precisa destas camadas (os nomes importam):

| Camada | Tipo | Para quê |
|---|---|---|
| `decoracao` | tiles | enfeites sem colisão (opcional) |
| `chao` | tiles | chão sólido |
| `plataformas` | tiles | plataformas que só colidem **por cima** (dá pra pular através) |
| `objetos` | objetos | player, ondas e inimigos |

**Objetos** na camada `objetos`:

- **Player** — ponto com nome `player`. É onde o jogador começa.
- **Onda** — retângulo com nome `onda`. A borda esquerda dele é onde a câmera **trava**
  (estilo Metal Slug) até todos os inimigos da onda morrerem. Propriedades: `id` (int) e
  `chefe` (bool, opcional).
- **Inimigo** — ponto com **classe/tipo** `grunt`, `caster`, `drone`, `heavy` ou `boss`.
  Propriedades: `onda` (int, o `id` da onda) e `atraso` (float, segundos depois que a onda
  começa). A posição Y é onde ficam os pés; para o `drone`, é a altura em que ele voa.

Fase sem chefe termina quando o jogador limpa todas as ondas e chega no fim do mapa. Fase com
chefe termina quando ele morre.

**Nova fase:** crie `assets/maps/fase2.tmj` (copiar a fase 1 é o jeito mais rápido), mude a
propriedade `nome` do mapa e acrescente em `LEVELS` no `src/config.js`:

```js
export const LEVELS = [
  { key: 'fase1', map: 'assets/maps/fase1.tmj' },
  { key: 'fase2', map: 'assets/maps/fase2.tmj' },
];
```

Vida, pontos e energia passam de uma fase para a outra.

## Novo inimigo

1. Coloque o spritesheet em `assets/sprites/` e registre em `SHEETS` e `ANIMS` (`src/assets.js`),
   usando os nomes `<sheet>-idle`, `<sheet>-walk`, `<sheet>-attack`.
2. Adicione os status em `ENEMIES` (`src/config.js`).
3. Crie a classe em `src/entities/enemies.js` (estenda `Enemy`, implemente `behave(dt)` e
   `muzzle()`) e registre em `TYPES`.
4. Use o novo tipo nos objetos do Tiled.

## Controles

| Ação | Teclas |
|---|---|
| Mover | A / D ou setas |
| Pular | Espaço ou X |
| Arma 1 | J ou Z |
| Arma 2 | K ou U |
| Rolar | Shift ou C |
| Mirar arco e anel | W ou seta cima (+ direção) |
| Agachar | S ou seta baixo |
| Descer da plataforma | baixo + Espaço |
| Gema do Anel | Q / E ou 1, 2, 3 |
| Habilidade | L ou V (barra cheia) |
| Pausar / Mudo | P / M |
| Escolher outro herói (ao morrer ou vencer) | T |

Para remapear, edite `src/systems/controls.js`.

## Criar ou ajustar um herói

- `src/characters.js`: cada classe (vida, velocidade, rolamento, quais 2 armas leva, bônus, combo da
  espada com dano/alcance/tempo/empurrão de cada golpe, habilidade e quais quadros do sprite usar).
- `src/weapons.js`: as armas (espada, arco, anel) e as gemas do Anel.
- Para dar uma arma a outra classe, basta pôr o id em `weapons` (`'sword'`, `'bow'`, `'ring'`). Se a classe
  não tiver os quadros daquela arma, usa o ataque à distância "nativo" dela (`native` em `characters.js`).

Sprites: `assets/sprites/warrior.png` e `archer.png` (96x80, mesmo layout de quadros do mago) e
`proj3.png` (flechas, ícones das armas). `npm run mago` e `npm run personagens` geram os placeholders;
arquivos que já existem não são sobrescritos (use `-- --force`).
