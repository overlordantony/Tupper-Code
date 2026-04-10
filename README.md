# Tupper Codec

Herramienta para codificar y decodificar imágenes usando la **fórmula auto-referente de Jeff Tupper** (2001). Cualquier dibujo de 106×17 píxeles puede representarse como un número entero gigante — y viceversa. Ideal para enviar mensajes ocultos disfrazados de números.

No requiere instalación, servidor, ni conexión a internet. Todo corre en el navegador.

---

## Cómo se usa

### Dibujar → número

1. Abre `tupper-codec.html` en tu navegador.
2. En la pestaña **Dibujar → número**, dibuja libremente sobre la grilla de 106×17.
   - Usa el botón **Escribir texto** para convertir texto en píxeles automáticamente.
   - La **lupa** aparece al pasar el cursor: muestra un zoom de 7×7 celdas con crosshair para dibujar con precisión.
3. Haz clic en **Generar número k**.
4. Copia el número resultante y envíaselo a quien quieras — por chat, correo, lo que sea.

### Número → imagen

1. Ve a la pestaña **Número → imagen**.
2. Pega el número k que recibiste.
3. Haz clic en **Decodificar imagen** para ver la imagen oculta.
4. Opcional: guárdala como PNG o mándala al modo dibujo para editarla.

### Botones extra

| Botón | Qué hace |
|---|---|
| Limpiar | Borra toda la grilla |
| Escribir texto | Rasteriza texto sobre la grilla |
| Invertir | Cambia píxeles encendidos por apagados |
| Ejemplo: cara | Carga un dibujo de muestra |
| Auto-referente | Carga el k famoso que dibuja la propia fórmula |
| Cargar k auto-referente | Lo mismo, en el modo decodificador |
| Guardar .txt | Descarga el número k como archivo de texto |
| Compartir | Usa la API de compartir del sistema (móvil) o copia al portapapeles |
| Guardar imagen PNG | Descarga la imagen decodificada |
| Editar en modo dibujo | Pasa la imagen decodificada al canvas para editarla |

---

## La fórmula

La fórmula de Tupper determina si un píxel en la posición (x, y) debe estar encendido o apagado:

```
⌊ mod(⌊y/17⌋ · 2^(−17⌊x⌋ − mod(⌊y⌋, 17)), 2) ⌋ ≥ 1/2
```

Lo interesante es que esta fórmula es **válida para cualquier imagen** de 106×17. El truco está en el número k:

1. La imagen se lee como una matriz de bits (1 = encendido, 0 = apagado).
2. Esos bits forman un número binario gigante `n`.
3. El número que se comparte es `k = n × 17`.
4. La fórmula evaluada en la franja `y = k` a `y = k + 16` reproduce exactamente esos píxeles.

Uno de esos valores de k dibuja la propia fórmula — de ahí el nombre *auto-referente*.

El número k auto-referente es:

```
960939379918958884971672962127852754715004339660129306651505519271702802395266424689642842174350718121267153782770623355993237280874144307891325963941337723487857735749823926629715517173716995165232890538221612403238855866184013
```

---

## Notas técnicas

- Implementado en HTML + CSS + JavaScript puro, sin dependencias externas.
- Usa `BigInt` nativo de JavaScript para manejar números de cientos de dígitos.
- Compatible con modo oscuro automático del sistema.
- Funciona en móvil (táctil).
- El número k puede tener 200+ dígitos — eso es completamente normal.

---

## Créditos

Basado en la *Self-Referential Formula* de **Jeff Tupper**, publicada en:
> Tupper, J. (2001). *Reliable two-dimensional graphing methods for mathematical formulae with two free variables*. SIGGRAPH 2001.
