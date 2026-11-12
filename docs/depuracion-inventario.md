# Depuración del inventario (RF-32)

> Archivo generado por `npm run depurar-inventario` (prompt F7). No lo edites a mano: cambia
> el Excel o el script y vuelve a generarlo. Cada caso trae la hoja y la fila del Excel para que
> lo confirmes con el cliente.

## Resumen

- Hojas leídas: 18 (ENERO 26, FEBRERO 26, MARZO 26, ABRIL 26, MAYO 26, JUNIO 26, JULIO 26, AGOSTO 26, SEPTIEMBRE 26, OCTUBRE 26, HILOOK ENER 26, HILOOK FEBR 26, HILOOK MAR 26, HILOOK ABRIL 26, HILOOK MAYO 26, HILOOK JUNIO 26, HILOOK JULIO 26, HILOOK AGOSTO 26).
- Hojas que se cargan: **OCTUBRE 26** y **HILOOK AGOSTO 26** (las más recientes, RF-32).
- Filas de producto en esas hojas: 90.
- Productos que se cargan: **76** (sin códigos repetidos ni inventarios negativos).
- Productos sin código: 22 filas → 18 productos con código SIN-COD.
- Productos o códigos repetidos: 13 (12 con distinto costo).
- Filas sin precio instalador: 37.
- Inventarios finales negativos en todas las hojas: 2.
- Marca o categoría por revisar: 17 productos.

### Reglas aplicadas (VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32))

- Se cargan solo las hojas más recientes. El inventario es el inventario final de la hoja más
  reciente en que aparece cada producto.
- Un código repetido se carga una sola vez, con la hoja más reciente. Si en esa hoja tiene varias
  filas (lotes comprados a distinto costo), el inventario es la **suma** de sus inventarios finales y
  el costo, los precios y el nombre son los de la **última fila** (decisión del equipo en F7).
- Los productos sin código reciben SIN-COD-001, SIN-COD-002… en el orden del Excel. Los productos
  sin código con el mismo nombre se tratan como el mismo producto.
- En la columna CODIGO, una palabra sin números ("DISCO DURO", "FUENTES", "VIDEO") o el mismo nombre
  del producto ("UPS 100VA") no es un código: esas filas se tratan como sin código.
- Un inventario negativo se carga en 0.
- Precio instalador vacío o en 0 queda nulo: el instalador no puede comprar ese producto hasta que
  se registre su precio (la app muestra "no tiene precio registrado para este tipo de cliente").
- Marca y categoría se deducen del nombre, del código y de la hoja (tabla del final).

## 1. Productos sin código

Hojas OCTUBRE 26 y HILOOK AGOSTO 26. RF-32 dice que se confirme con el cliente qué código asignarles.

| Hoja | Fila | CODIGO en el Excel | Producto | Código asignado |
| --- | --- | --- | --- | --- |
| OCTUBRE 26 | 63 | Igual al nombre ("UPS 100VA") | UPS 100VA | SIN-COD-001 |
| OCTUBRE 26 | 65 | Palabra genérica ("DISCO DURO") | DISCO DURO 1 TERA | SIN-COD-002 |
| OCTUBRE 26 | 66 | Vacío | DISCO DURO 1 TERA | SIN-COD-002 |
| OCTUBRE 26 | 67 | Vacío | DISCO DURO 2 TERA PURPURA | SIN-COD-003 |
| OCTUBRE 26 | 68 | Vacío | DISCO DURO 6 TERAS | SIN-COD-004 |
| OCTUBRE 26 | 69 | Palabra genérica ("FUENTES") | FUENTES 12V 2 AMP | SIN-COD-005 |
| OCTUBRE 26 | 70 | Palabra genérica ("FUENTES") | FUENTES 12V 2 AMP | SIN-COD-005 |
| OCTUBRE 26 | 71 | Vacío | FUENTES 12V 1 AMP | SIN-COD-006 |
| OCTUBRE 26 | 72 | Palabra genérica ("VIDEO") | VIDEO BALUM PASIV AZUL | SIN-COD-007 |
| OCTUBRE 26 | 73 | Vacío | VIDEO BALUM 5MP | SIN-COD-008 |
| OCTUBRE 26 | 74 | Palabra genérica ("VIDEO") | VIDEO BALUM 8MP | SIN-COD-009 |
| OCTUBRE 26 | 75 | Palabra genérica ("VIDEO") | VIDEO BALUM DAHUA | SIN-COD-010 |
| OCTUBRE 26 | 76 | Vacío | CONECTOR MACHO | SIN-COD-011 |
| OCTUBRE 26 | 77 | Vacío | CONECTOR HEMBRA | SIN-COD-012 |
| OCTUBRE 26 | 78 | Vacío | CAJA PLASTICA | SIN-COD-013 |
| OCTUBRE 26 | 79 | Vacío | CAJA PLASTICA | SIN-COD-013 |
| OCTUBRE 26 | 80 | Vacío | UPS HIKVISIN | SIN-COD-014 |
| OCTUBRE 26 | 81 | Vacío | CABLE UTP CTG 6 EXT 100MTS | SIN-COD-015 |
| OCTUBRE 26 | 82 | Vacío | CABLE UTP CTG 6 EXT 100MTS | SIN-COD-015 |
| OCTUBRE 26 | 83 | Vacío | CABLE UTP CTG 6 INT 100MTS | SIN-COD-016 |
| OCTUBRE 26 | 84 | Vacío | CABLE UTP CTG 6 EXT 305 | SIN-COD-017 |
| OCTUBRE 26 | 85 | Vacío | CABLE UTP CTG 6 INT 305 | SIN-COD-018 |

## 2. Códigos o productos repetidos

Cada producto queda una sola vez. "Se usa" indica qué filas forman el producto cargado.

| Código cargado | Producto | ¿Costo distinto? | Hoja | Fila | Costo | Inv. final | Se usa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DS-7208HGHI-M1(C) | DVR 8CH TURBO 1080P LITE 4TB H265+ HD 720P LITE W… | Sí | OCTUBRE 26 | 7 | $196.500 | 1 | Sí (suma) |
| DS-7208HGHI-M1(C) | DVR 8CH TURBO 1080P LITE 4TB H265+ HD 720P LITE W… | Sí | OCTUBRE 26 | 8 | $206.900 | 0 | Sí (precios) |
| iDS-7208HQHI-M1/XT(STD) | ACUSENSE EVITA FALSAS ALARMAS DVR 4 MEGAPIXEL 8 C… | Sí | OCTUBRE 26 | 10 | $347.000 | 2 | Sí (suma) |
| iDS-7208HQHI-M1/XT(STD) | ACUSENSE EVITA FALSAS ALARMAS DVR 4 MEGAPIXEL 8 C… | Sí | OCTUBRE 26 | 11 | $365.300 | 0 | Sí (precios) |
| iDS-7216HQHI-M1/XT(STD) | ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 C… | Sí | OCTUBRE 26 | 17 | $636.000 | 0 | Sí (suma) |
| iDS-7216HQHI-M1/XT(STD) | ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 C… | Sí | OCTUBRE 26 | 18 | $604.300 | 1 | Sí (precios) |
| DS-2CE12DF0T-LFS(2.8mm) | CAMARA TURBO 1080P BALA 0.001LUX F1.0 HIBRIDA B/N… | Sí | OCTUBRE 26 | 25 | $115.050 | 1 | Sí (suma) |
| DS-2CE12DF0T-LFS(2.8mm) | CAMARA TURBO 1080P BALA 0.001LUX F1.0 HIBRIDA B/N… | Sí | OCTUBRE 26 | 26 | $109.841 | 0 | Sí (precios) |
| DS-2CE17K0T-LFS | CAMARA TURBO BALA 2,8 3K HIBRIDA B/N - Color VU 4… | Sí | OCTUBRE 26 | 30 | $112.100 | 3 | Sí (suma) |
| DS-2CE17K0T-LFS | CAMARA TURBO BALA 2,8 3K HIBRIDA B/N - Color VU 4… | Sí | OCTUBRE 26 | 31 | $124.500 | 1 | Sí (precios) |
| DS-2CE76K0T-LPFS(2.8mm) | CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M… | Sí | OCTUBRE 26 | 36 | $92.300 | 4 | Sí (suma) |
| DS-2CE76K0T-LPFS(2.8mm) | CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M… | Sí | OCTUBRE 26 | 37 | $102.600 | 4 | Sí (precios) |
| CS-H6- PRO 5 MP | CAMARA EZVIZ PT360 5 MP H6C | No | OCTUBRE 26 | 51 | $129.300 | 1 | Sí (suma) |
| CS-H6- PRO 5 MP | CAMARA EZVIZ PT360 H6C 5MP | No | OCTUBRE 26 | 52 | $129.300 | 2 | Sí (precios) |
| CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT | Sí | OCTUBRE 26 | 56 | $164.600 | 0 | Sí (suma) |
| CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT 3MP | Sí | OCTUBRE 26 | 57 | $189.200 | 0 | Sí (suma) |
| CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT 3MP | Sí | OCTUBRE 26 | 58 | $192.500 | 2 | Sí (precios) |
| SIN-COD-002 | DISCO DURO 1 TERA | Sí | OCTUBRE 26 | 65 | $379.000 | 1 | Sí (suma) |
| SIN-COD-002 | DISCO DURO 1 TERA | Sí | OCTUBRE 26 | 66 | $361.000 | 0 | Sí (precios) |
| SIN-COD-005 | FUENTES 12V 2 AMP | Sí | OCTUBRE 26 | 69 | $5.100 | 30 | Sí (suma) |
| SIN-COD-005 | FUENTES 12V 2 AMP | Sí | OCTUBRE 26 | 70 | $5.500 | 52 | Sí (precios) |
| SIN-COD-013 | CAJA PLASTICA | Sí | OCTUBRE 26 | 78 | $1.600 | 0 | Sí (suma) |
| SIN-COD-013 | CAJA PLASTICA | Sí | OCTUBRE 26 | 79 | $1.800 | 7 | Sí (precios) |
| SIN-COD-015 | CABLE UTP CTG 6 EXT 100MTS | Sí | OCTUBRE 26 | 81 | $588 | 30 | Sí (suma) |
| SIN-COD-015 | CABLE UTP CTG 6 EXT 100MTS | Sí | OCTUBRE 26 | 82 | $587 | 100 | Sí (precios) |
| THC-T120-PC | CAMARA TURBO 1080P INT TURRET 0.02LUXF2.8 EXIR IR… | Sí | HILOOK AGOSTO 26 | 4 | $43.700 | 0 | Sí (suma) |
| THC-T120-PC | CAMARA TURBO 1080P INT TURRET 0.02LUXF2.8 EXIR IR… | Sí | HILOOK AGOSTO 26 | 5 | $40.100 | 6 | Sí (precios) |

Productos cargados con la suma de varias filas (lotes):

| Código | Filas | Inventario cargado |
| --- | --- | --- |
| DS-7208HGHI-M1(C) | OCTUBRE 26 f.7 (1) + OCTUBRE 26 f.8 (0) | 1 |
| iDS-7208HQHI-M1/XT(STD) | OCTUBRE 26 f.10 (2) + OCTUBRE 26 f.11 (0) | 2 |
| iDS-7216HQHI-M1/XT(STD) | OCTUBRE 26 f.17 (0) + OCTUBRE 26 f.18 (1) | 1 |
| DS-2CE12DF0T-LFS(2.8mm) | OCTUBRE 26 f.25 (1) + OCTUBRE 26 f.26 (0) | 1 |
| DS-2CE17K0T-LFS | OCTUBRE 26 f.30 (3) + OCTUBRE 26 f.31 (1) | 4 |
| DS-2CE76K0T-LPFS(2.8mm) | OCTUBRE 26 f.36 (4) + OCTUBRE 26 f.37 (4) | 8 |
| CS-H6- PRO 5 MP | OCTUBRE 26 f.51 (1) + OCTUBRE 26 f.52 (2) | 3 |
| CS-H8c-R100-1K2WKFL(4mm) | OCTUBRE 26 f.56 (0) + OCTUBRE 26 f.57 (0) + OCTUBRE 26 f.58 (2) | 2 |
| SIN-COD-002 | OCTUBRE 26 f.65 (1) + OCTUBRE 26 f.66 (0) | 1 |
| SIN-COD-005 | OCTUBRE 26 f.69 (30) + OCTUBRE 26 f.70 (52) | 82 |
| SIN-COD-013 | OCTUBRE 26 f.78 (0) + OCTUBRE 26 f.79 (7) | 7 |
| SIN-COD-015 | OCTUBRE 26 f.81 (30) + OCTUBRE 26 f.82 (100) | 130 |
| THC-T120-PC | HILOOK AGOSTO 26 f.4 (0) + HILOOK AGOSTO 26 f.5 (6) | 6 |

## 3. Productos sin precio instalador

Hojas OCTUBRE 26 y HILOOK AGOSTO 26. Se cargan con precio instalador nulo.

| Hoja | Fila | Código cargado | Producto | Valor en el Excel | Precio cliente final |
| --- | --- | --- | --- | --- | --- |
| OCTUBRE 26 | 3 | DS-7104HGHI-M1 | DVR 4CH TURBO 1080p LITE 4TB H.265+H.265 2MP MAX120m HDMI/V… | Vacío | $205.000 |
| OCTUBRE 26 | 4 | DS-7204HGHI-M1(C) | DVR 4CH TURBO 4TB H265+ 30FPS HDMI/VGA HIKVISION AcuSense | Vacío | $205.000 |
| OCTUBRE 26 | 5 | iDS-7104HQHI-M1/S(C) | DVR 4CH MINI TURBO 4MP LITE 10TB H265+ DETECCION DE MOVIMIE… | Vacío | $280.000 |
| OCTUBRE 26 | 6 | iDS-7204HQHI-M1/XT | DVR HIKVISION DE 4 CANALES PARA CÁMARAS DE HASTA 2 MP CON 2… | Vacío | $373.000 |
| OCTUBRE 26 | 17 | iDS-7216HQHI-M1/XT(STD) | ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 CANALES IP … | 0 | $900.000 |
| OCTUBRE 26 | 18 | iDS-7216HQHI-M1/XT(STD) | ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 CANALES IP … | 0 | $900.000 |
| OCTUBRE 26 | 19 | iDS-7216HUHI-M2/X | DVR 16CH ACUSENSE (4 CH DETEC HUMANO/COCHE), 5 EN 1 (TVI, A… | Vacío | $1.955.000 |
| OCTUBRE 26 | 20 | iDS-7232HQHI-M2/XT | DVR 32 CANALES TURBOHD + 8 CANALES IP 5 MEGAPIXEL LITE - 3K… | Vacío | $1.820.000 |
| OCTUBRE 26 | 22 | DS-2CE76D0T-LPFS | CAMARA TURBO 1080P TURRET AUDIO COAXIAL 0.01 Lux/ F1.6 DNR … | Vacío | $119.000 |
| OCTUBRE 26 | 25 | DS-2CE12DF0T-LFS(2.8mm) | CAMARA TURBO 1080P BALA 0.001LUX F1.0 HIBRIDA B/N - Color V… | Vacío | $185.000 |
| OCTUBRE 26 | 32 | DS-2CE17K0T-LXTS | Cámara Minibullet 4en1 2.8mm 3K Smart Light Hybrid Sirena y… | Vacío | $215.000 |
| OCTUBRE 26 | 38 | DS-2CE76K0T-LMFS(2.8mm) | CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M 0.01LUX I… | Vacío | $165.000 |
| OCTUBRE 26 | 42 | DS-2CE78K0T-LTS | Torreta fija con audio bidireccional de 3K | Vacío | $198.000 |
| OCTUBRE 26 | 43 | DS-2CE70K0T-PTLXTS | Torreta fija tipo bala PT con audio bidireccional y sirena … | Vacío | $220.000 |
| OCTUBRE 26 | 44 | DS-2CE12UF3T-E | CAMARA BALA 4K COLORVU TURRET EXIR LUZ BLANCA 40m 0.0005LUX… | Vacío | $565.000 |
| OCTUBRE 26 | 50 | CS-H1c-R101-1G2WR | CAMARA WIFI H1C 2 MP CONEXIÓN TIPO C AUDIO BIDIRECCIONAL, M… | Vacío | $140.000 |
| OCTUBRE 26 | 51 | CS-H6- PRO 5 MP | CAMARA EZVIZ PT360 5 MP H6C | Vacío | $235.000 |
| OCTUBRE 26 | 52 | CS-H6- PRO 5 MP | CAMARA EZVIZ PT360 H6C 5MP | Vacío | $240.000 |
| OCTUBRE 26 | 53 | CS-H9C- PRO 5 MP | CAMARA EZVIZ PT360 5 MP H9C EXT DOBLE LENTE | Vacío | $555.000 |
| OCTUBRE 26 | 54 | CS-H6c-R101-1G2WF | CAMARA EZVIZ PT360 1080 H6C 3MP | Vacío | $185.000 |
| OCTUBRE 26 | 55 | DS-2CV2Q21G1-IDW (W) | CÁMARA IP FIJA PARA INTERIORES DE 2 MP ADMITE CONEXIÓN WI-F… | Vacío | $160.000 |
| OCTUBRE 26 | 56 | CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT | Vacío | $290.000 |
| OCTUBRE 26 | 57 | CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT 3MP | Vacío | $290.000 |
| OCTUBRE 26 | 58 | CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT 3MP | Vacío | $290.000 |
| OCTUBRE 26 | 59 | CS-H8C- PRO 5 MP | CAMARA WIFI H8C PT INTELIGENTE EXT 5MP | Vacío | $351.000 |
| OCTUBRE 26 | 60 | DS-2DE2C400MWG/W(2.8mm)(O-STD)/EU | DOMO HIKVISION WIFI HIBRIDO | Vacío | $350.000 |
| OCTUBRE 26 | 61 | H3C | BALA EZVIZ WIFI 4MP EXTERIOR | Vacío | $287.000 |
| OCTUBRE 26 | 62 | DS-J142I(STD)/NKS422W02H | KIT DE NVS WIFI DE 2 MP, H.265, UNA BALA Y UNA TORRETA INST… | Vacío | $450.000 |
| OCTUBRE 26 | 63 | SIN-COD-001 | UPS 100VA | Vacío | $260.000 |
| OCTUBRE 26 | 64 | PWA96-KIT-WB | KIT ALARMA HIKVISION (AXPRO) INALAMBRICA 96 ZONA | Vacío | $1.256.000 |
| OCTUBRE 26 | 66 | SIN-COD-002 | DISCO DURO 1 TERA | Vacío | $540.000 |
| OCTUBRE 26 | 68 | SIN-COD-004 | DISCO DURO 6 TERAS | Vacío | $1.115.000 |
| OCTUBRE 26 | 70 | SIN-COD-005 | FUENTES 12V 2 AMP | 0 | $15.000 |
| OCTUBRE 26 | 80 | SIN-COD-014 | UPS HIKVISIN | Vacío | $220.000 |
| HILOOK AGOSTO 26 | 5 | THC-T120-PC | CAMARA TURBO 1080P INT TURRET 0.02LUXF2.8 EXIR IR20m PLASTI… | Vacío | $65.000 |
| HILOOK AGOSTO 26 | 6 | THC-B120-MC (2.8mm) | CAMARA TURBO 1080P EXT BALA 0.02LUX F2.8 EXIR IR20m IP66 ME… | Vacío | $90.000 |
| HILOOK AGOSTO 26 | 7 | THC-B120-PC (2.8mm) | CAMARA TURBO 1080 MINI BALA 0.02 LUX EXIR IR20m IP66 PLASTI… | Vacío | $70.000 |

## 4. Inventarios finales negativos (todas las hojas)

Se registraron más ventas que unidades disponibles. Si la fila es de una hoja que se carga, el
producto queda en 0; si es de una hoja anterior, no afecta la carga, pero hay que confirmarlo.

| Hoja | Fila | Código | Producto | Inventario | Venta inst. | Venta final | Inv. final | En la carga |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FEBRERO 26 | 65 | VIDEO | VIDEO BALUM 8MP | 11 | 0 | 13 | -2 | Hoja anterior: no se carga |
| AGOSTO 26 | 76 | (vacío) | CAJA PLASTICA | 5 | 0 | 7 | -2 | Hoja anterior: no se carga |

## 5. Otros hallazgos para confirmar

### Precio de venta menor que el costo

RF-30 pide advertirlo. Se cargan igual, pero conviene revisarlos.

| Código | Producto | Costo | Precio instalador | Precio cliente final |
| --- | --- | --- | --- | --- |
| DS-2CE70DF0T-LPFS(2.8mm)(O-STD) | CAMARA TURBO 1080P MINIDOMO 0.001LUX F1.0 HIBRIDA… | $85.400 | $83.390 | $125.000 |

### Productos de hojas anteriores que no se cargan

No aparecen en las hojas más recientes. Se muestra la última hoja en que aparecen.

| Hoja | Fila | Código | Producto | Inv. final |
| --- | --- | --- | --- | --- |
| ENERO 26 | 8 | DS-7108HGHI-M1 | DVR 8CH TURBO 1080p LITE 1BAHIA/4TB H.265+/H.265 HDMI/VGA A… | 0 |
| ENERO 26 | 47 | CS-H9c-R100-8G55WKFL(美洲标配)(多语音) | CAMARA PT WIFI 3K DUAL | 0 |
| ENERO 26 | 48 | CS-H6- PRO 5 MG | CAMARA EZVIZ PT360 5 MP H6C | 1 |
| ENERO 26 | 60 | (vacío) | DISCO DURO 1 TERA PURPURA | 0 |
| ENERO 26 | 61 | (vacío) | DISCO DURO 2 TERAS | 0 |
| SEPTIEMBRE 26 | 57 | CS-H3 | CAMARA BALA H3C PT INTELIGENTE EXT 5MP | 0 |

### Filas que no se pueden cargar

_Ninguno._

## 6. Marca y categoría para revisar a mano

Deducidas del nombre, del código y de la hoja. Solo se aceptan las marcas Hikvision, EZVIZ y
HiLook y las ocho categorías de RF-07 (`001_esquema.sql`). La columna "Revisar" marca los casos
sin una pista clara. Para corregir uno, cambia la regla en `scripts/depurar-inventario.mjs` o el
producto en la app (Productos del trabajador) después de la carga.

| Código | Producto | Marca | Categoría | Inventario | Revisar |
| --- | --- | --- | --- | --- | --- |
| DS-7104HGHI-M1 | DVR 4CH TURBO 1080p LITE 4TB H.265+H.265 2MP MAX120m HDMI/V… | Hikvision | DVR | 0 |  |
| DS-7204HGHI-M1(C) | DVR 4CH TURBO 4TB H265+ 30FPS HDMI/VGA HIKVISION AcuSense | Hikvision | DVR | 2 |  |
| iDS-7104HQHI-M1/S(C) | DVR 4CH MINI TURBO 4MP LITE 10TB H265+ DETECCION DE MOVIMIE… | Hikvision | DVR | 0 |  |
| iDS-7204HQHI-M1/XT | DVR HIKVISION DE 4 CANALES PARA CÁMARAS DE HASTA 2 MP CON 2… | Hikvision | DVR | 1 |  |
| DS-7208HGHI-M1(C) | DVR 8CH TURBO 1080P LITE 4TB H265+ HD 720P LITE WD1/4CIF/VG… | Hikvision | DVR | 1 |  |
| iDS-7204HQHI-M1/FA | DVR 4CH TURBO 4MP lite 1BAHIA/10TB H.265+ RECONOCIMIENTO FA… | Hikvision | DVR | 0 |  |
| iDS-7208HQHI-M1/XT(STD) | ACUSENSE EVITA FALSAS ALARMAS DVR 4 MEGAPIXEL 8 CANALES TUR… | Hikvision | DVR | 2 |  |
| DS-7208HQHI-M1/FA | DVR 8CH TURBO 4MP lite 1BAHIA/10TB H.265+ RECONOCIMIENTO FA… | Hikvision | DVR | 0 |  |
| DS-7204HUHI-M1/S | DVR 4CH TURBO 8MP 1BAHIA/10TB H.265+ ANALITICAS 30FPS HDMI/… | Hikvision | DVR | 0 |  |
| iDS-7208HUHI-M1/XT | ACUSENSE EVITA FALSAS ALARMAS) DVR 8 MEGAPIXEL 8 CANALES TU… | Hikvision | DVR | 0 |  |
| iDS-7208HUHI-M1/FA/4A+8/4ALM | DVR 8CH TURBO 5MP 10TB H265+ DETECCION FACIAL ANALITICA 7,5… | Hikvision | DVR | 0 |  |
| DS-7216HGHI-M1 | DVR 16 CH TURBO 1080P LITE 10TB SATA H165+ 15FPS HDMI/VGA H… | Hikvision | DVR | 0 |  |
| iDS-7216HQHI-M1/XT(STD) | ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 CANALES IP … | Hikvision | DVR | 1 |  |
| iDS-7216HUHI-M2/X | DVR 16CH ACUSENSE (4 CH DETEC HUMANO/COCHE), 5 EN 1 (TVI, A… | Hikvision | DVR | 0 |  |
| iDS-7232HQHI-M2/XT | DVR 32 CANALES TURBOHD + 8 CANALES IP 5 MEGAPIXEL LITE - 3K… | Hikvision | DVR | 0 |  |
| DS-2CE56D0T-IRPF | CAMARA TURBO 1080P TURRET 0.01LUX IR20m INT PLASTICA HIKVIS… | Hikvision | Cámaras Turbo HD | 2 |  |
| DS-2CE76D0T-LPFS | CAMARA TURBO 1080P TURRET AUDIO COAXIAL 0.01 Lux/ F1.6 DNR … | Hikvision | Cámaras Turbo HD | 3 |  |
| DS-2CE70DF0T-LPFS(2.8mm)(O-STD) | CAMARA TURBO 1080P MINIDOMO 0.001LUX F1.0 HIBRIDA B/N - 24/… | Hikvision | Cámaras Turbo HD | 8 |  |
| DS-2CE76H0T-ITPF | CAMARA TURBO 5MP TURRET EXIR 0.01LUX 3.6 IR20m IP67 PLASTIC… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE12DF0T-LFS(2.8mm) | CAMARA TURBO 1080P BALA 0.001LUX F1.0 HIBRIDA B/N - Color V… | Hikvision | Cámaras Turbo HD | 1 |  |
| DS-2CE10DF0T-LPFS | CAMARA TURBO 1080P MINIBALA 0.001LUX F1.0 HIBRIDA B/N - 24/… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE17D0T-IT3F | CAMARA TURBO 1080P BALA EXIR 0.01LUX IR40m IP67 SEMIMETAL H… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE17D0T-IT5F | CAMARA TURBO 1080P BALA EXIR 0.01LUX IR80m IP66 SEMIMETAL H… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE17K0T-LFS | CAMARA TURBO BALA 2,8 3K HIBRIDA B/N - Color VU 40M EXTERIO… | Hikvision | Cámaras Turbo HD | 4 |  |
| DS-2CE17K0T-LXTS | Cámara Minibullet 4en1 2.8mm 3K Smart Light Hybrid Sirena y… | Hikvision | Cámaras Turbo HD | 2 |  |
| DS-2CE16K0T-LPFS | CAMARA MINI BALA CON 2.8 IR 25M 3K HIBRIDA B/N - Color VU 2… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE16D0T-IRPF | CAMARA TURBO 1080P BALA 0.01LUX IR20m INT PLASTICA HIKVISION | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE16H0T-ITPF | CAMARA TURBO 5MP BALA EXTERIOR IR67 25MTS SMART DWDR | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE76K0T-LPFS(2.8mm) | CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M 0.01LUX I… | Hikvision | Cámaras Turbo HD | 8 |  |
| DS-2CE76K0T-LMFS(2.8mm) | CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M 0.01LUX I… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE78K0T-LXTS | Torreta fija con audio bidireccional de 3K con Alarma de lu… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE70D0T-PTLXTS(2.8mm)(O-STD) | CÁMARA FIJA PT DE 2 MP CON AUDIO BIDIRECCIONAL Y SIRENA 2 M… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE19H0T-AIT3ZF(2.7-13.5mm)(C) | CAMARA TURBO 5MP BALA MOTORIZADA VARIFOCAL (2.7 -13.5 ) 0.0… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE78K0T-LTS | Torreta fija con audio bidireccional de 3K | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE70K0T-PTLXTS | Torreta fija tipo bala PT con audio bidireccional y sirena … | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE12UF3T-E | CAMARA BALA 4K COLORVU TURRET EXIR LUZ BLANCA 40m 0.0005LUX… | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-2CE19D0T-VFIT3F(2.7-13.5mm)(C) | CAMARA TURBO BALA VARIFOCAL 0.01LUX F2.7-13.5 IR40M IP67 | Hikvision | Cámaras Turbo HD | 0 |  |
| DS-PWA64-KIT-WB | PANEL DS-PWA64-L-WB(AXPRO 433MHZ, WHITE) *1 SENSOR MAGNETIC… | Hikvision | Kits | 0 |  |
| DS-PDP15P-EG2-WB | SENSOR DE ALARMAR PIR RANGO DE DETECCION 15 MTRS ANGULO 85.… | Hikvision | Alarmas y sensores | 0 |  |
| DS-PKF1-WB | LLAVERO INALAMBRICO 2nda generacion | Hikvision | Alarmas y sensores | 0 |  |
| DS-PS1-I-WB/red | SIRENA INTERIOR INALAMBRICA 433MHZ 110DB CUERPO BLANCO LUZ … | Hikvision | Alarmas y sensores | 0 |  |
| CS-H1c-R101-1G2WR | CAMARA WIFI H1C 2 MP CONEXIÓN TIPO C AUDIO BIDIRECCIONAL, M… | EZVIZ | Cámaras WiFi e IP | 1 |  |
| CS-H6- PRO 5 MP | CAMARA EZVIZ PT360 H6C 5MP | EZVIZ | Cámaras WiFi e IP | 3 |  |
| CS-H9C- PRO 5 MP | CAMARA EZVIZ PT360 5 MP H9C EXT DOBLE LENTE | EZVIZ | Cámaras WiFi e IP | 1 |  |
| CS-H6c-R101-1G2WF | CAMARA EZVIZ PT360 1080 H6C 3MP | EZVIZ | Cámaras WiFi e IP | 3 |  |
| DS-2CV2Q21G1-IDW (W) | CÁMARA IP FIJA PARA INTERIORES DE 2 MP ADMITE CONEXIÓN WI-F… | Hikvision | Cámaras WiFi e IP | 0 |  |
| CS-H8c-R100-1K2WKFL(4mm) | CAMARA WIFI H8C PT INTELIGENTE EXT 3MP | EZVIZ | Cámaras WiFi e IP | 2 |  |
| CS-H8C- PRO 5 MP | CAMARA WIFI H8C PT INTELIGENTE EXT 5MP | EZVIZ | Cámaras WiFi e IP | 1 |  |
| DS-2DE2C400MWG/W(2.8mm)(O-STD)/EU | DOMO HIKVISION WIFI HIBRIDO | Hikvision | Cámaras WiFi e IP | 0 |  |
| H3C | BALA EZVIZ WIFI 4MP EXTERIOR | EZVIZ | Cámaras WiFi e IP | 0 |  |
| DS-J142I(STD)/NKS422W02H | KIT DE NVS WIFI DE 2 MP, H.265, UNA BALA Y UNA TORRETA INST… | Hikvision | Kits | 0 |  |
| SIN-COD-001 | UPS 100VA | Hikvision | Fuentes y UPS | 1 | Sin marca en el Excel: se asignó Hikvision |
| PWA96-KIT-WB | KIT ALARMA HIKVISION (AXPRO) INALAMBRICA 96 ZONA | Hikvision | Kits | 0 |  |
| SIN-COD-002 | DISCO DURO 1 TERA | Hikvision | Discos duros | 1 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-003 | DISCO DURO 2 TERA PURPURA | Hikvision | Discos duros | 1 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-004 | DISCO DURO 6 TERAS | Hikvision | Discos duros | 0 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-005 | FUENTES 12V 2 AMP | Hikvision | Fuentes y UPS | 82 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-006 | FUENTES 12V 1 AMP | Hikvision | Fuentes y UPS | 14 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-007 | VIDEO BALUM PASIV AZUL | Hikvision | Accesorios de cableado | 16 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-008 | VIDEO BALUM 5MP | Hikvision | Accesorios de cableado | 4 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-009 | VIDEO BALUM 8MP | Hikvision | Accesorios de cableado | 41 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-010 | VIDEO BALUM DAHUA | Hikvision | Accesorios de cableado | 30 | El nombre dice Dahua, que no es una marca aceptada |
| SIN-COD-011 | CONECTOR MACHO | Hikvision | Accesorios de cableado | 45 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-012 | CONECTOR HEMBRA | Hikvision | Accesorios de cableado | 110 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-013 | CAJA PLASTICA | Hikvision | Accesorios de cableado | 7 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-014 | UPS HIKVISIN | Hikvision | Fuentes y UPS | 2 |  |
| SIN-COD-015 | CABLE UTP CTG 6 EXT 100MTS | Hikvision | Accesorios de cableado | 130 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-016 | CABLE UTP CTG 6 INT 100MTS | Hikvision | Accesorios de cableado | 8 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-017 | CABLE UTP CTG 6 EXT 305 | Hikvision | Accesorios de cableado | 171 | Sin marca en el Excel: se asignó Hikvision |
| SIN-COD-018 | CABLE UTP CTG 6 INT 305 | Hikvision | Accesorios de cableado | 232 | Sin marca en el Excel: se asignó Hikvision |
| THC-T120-PS | CAMARA TURBO 1080P TURRET MICROFONO INCORPORADO AUDIO COAXI… | HiLook | Cámaras Turbo HD | 0 |  |
| THC-T120-PC | CAMARA TURBO 1080P INT TURRET 0.02LUXF2.8 EXIR IR20m PLASTI… | HiLook | Cámaras Turbo HD | 6 |  |
| THC-B120-MC (2.8mm) | CAMARA TURBO 1080P EXT BALA 0.02LUX F2.8 EXIR IR20m IP66 ME… | HiLook | Cámaras Turbo HD | 0 |  |
| THC-B120-PC (2.8mm) | CAMARA TURBO 1080 MINI BALA 0.02 LUX EXIR IR20m IP66 PLASTI… | HiLook | Cámaras Turbo HD | 0 |  |
| IPC-T221H | CAMARA IP 2MP TURRET H265+ DWDR D/NF2.8 PoE IR30m POE IP67 … | HiLook | Cámaras WiFi e IP | 0 |  |
| IPC-B121H | CAMARA IP 2MP BALA H265+ DWDR D/NF2.8 PoE IR30m IP67 SEMIME… | HiLook | Cámaras WiFi e IP | 0 |  |

### Productos por categoría

| Categoría | Productos |
| --- | --- |
| DVR | 15 |
| Cámaras Turbo HD | 26 |
| Cámaras WiFi e IP | 11 |
| Kits | 3 |
| Alarmas y sensores | 3 |
| Discos duros | 3 |
| Fuentes y UPS | 4 |
| Accesorios de cableado | 11 |
