# Garibaldo — Guerra Arcana

Run'n'gun 2D estilo Metal Slug feito em **Phaser 3**. A mecânica principal é atirar poderes
(Fogo, Gelo, Raio) e desviar dos poderes inimigos. Desviar bem recompensa: passar de raspão
(*graze*) e atravessar tiros com o dash (*esquiva perfeita*) enchem a barra Arcana.

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
| `player.png` | 48x48, 8 colunas | 0-3 parado · 8-13 correndo · 16-17 pulo · 18-19 caindo · 24-25 agachado · 26-29 rastejando · 32-33 dash · 34 dano · 35 morto |
| `arm.png` | 16x8 | braço que gira com a mira (ombro na esquerda) |
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
| Atirar (segure) | J ou Z |
| Mirar cima / diagonal | W ou seta cima (+ direção) |
| Agachar / atirar pra baixo no ar | S ou seta baixo |
| Descer da plataforma | baixo + Espaço |
| Dash invencível | K, Shift ou C |
| Trocar poder | Q / E ou 1, 2, 3 |
| Explosão Arcana | L ou V (barra cheia) |
| Pausar / Mudo | P / M |

Para remapear, edite `src/systems/controls.js`.
