-- =====================================================================================
-- inventario_inicial.sql — Carga inicial de productos desde el Excel (Prompt F7, RF-32, RNF-15)
--
-- ARCHIVO GENERADO por "npm run depurar-inventario" a partir del Excel del inventario (no viene en
-- el repositorio; para regenerar, colócalo en datos/inventario.xlsx).
-- No lo edites a mano: cambia el Excel o scripts/depurar-inventario.mjs y vuelve a generarlo.
-- El script también escribe un informe con cada caso para revisar con el cliente.
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo el archivo > Run.
-- Requiere 001 a 007 aplicadas. Se ejecuta una vez, después de los datos de prueba.
-- Todo va en una sola transacción: si algo falla, no cambia nada.
--
-- Hojas cargadas: OCTUBRE 26 y HILOOK AGOSTO 26. Productos: 76.
-- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32): duplicados → hoja más reciente (lotes
-- de la misma hoja: suma del inventario, precios de la última fila); sin código → SIN-COD-001…;
-- negativo → 0; precio instalador vacío → nulo.
--
-- Qué hace con los productos que ya existen (las cotizaciones y pedidos de prueba no se tocan:
-- sus líneas guardan copia del código, nombre y precio):
--   1. Si el código ya existe (por ejemplo, el producto de prueba DS-7204HGHI-M1(C)), actualiza esa
--      fila con los datos del Excel y la marca es_prueba = false. Así conserva su id y las líneas
--      de cotización o pedido que apuntan a ella. La descripción y la imagen se conservan.
--   2. Inserta los productos nuevos.
--   3. Los productos de prueba que no están en el Excel: si una cotización, un pedido o un producto
--      de interés los usa, se desactivan (activo = false); si nadie los usa, se borran.
--   4. Comprueba que no quedan códigos repetidos, inventarios negativos ni productos de prueba
--      activos. Si algo falla, la transacción se deshace.
-- =====================================================================================

begin;

-- Datos depurados del Excel (tabla temporal: desaparece al terminar la transacción).
create temp table carga_excel (
  codigo               text primary key,
  nombre               text not null,
  marca                text not null,
  categoria            text not null,
  costo                numeric(12, 2) not null,
  precio_instalador    numeric(12, 2),
  precio_cliente_final numeric(12, 2) not null,
  inventario           integer not null
) on commit drop;

insert into carga_excel
  (codigo, nombre, marca, categoria, costo, precio_instalador, precio_cliente_final, inventario)
values
  ('DS-7104HGHI-M1', 'DVR 4CH TURBO 1080p LITE 4TB H.265+H.265 2MP MAX120m HDMI/VGA AcuSense', 'Hikvision', 'dvr', 146000, null, 205000, 0),
  ('DS-7204HGHI-M1(C)', 'DVR 4CH TURBO 4TB H265+ 30FPS HDMI/VGA HIKVISION AcuSense', 'Hikvision', 'dvr', 148900, null, 205000, 2),
  ('iDS-7104HQHI-M1/S(C)', 'DVR 4CH MINI TURBO 4MP LITE 10TB H265+ DETECCION DE MOVIMIENTO 2.0 AcuSense', 'Hikvision', 'dvr', 203000, null, 280000, 0),
  ('iDS-7204HQHI-M1/XT', 'DVR HIKVISION DE 4 CANALES PARA CÁMARAS DE HASTA 2 MP CON 2 CANALES ACUSENSE. ADMITE CANALES UNIVERSALES (HD-TVI AHD, HD-CVI, CVBS E IP).', 'Hikvision', 'dvr', 254000, null, 373000, 1),
  ('DS-7208HGHI-M1(C)', 'DVR 8CH TURBO 1080P LITE 4TB H265+ HD 720P LITE WD1/4CIF/VGA 15FPS HDMI/VGA HIKVISION AcuSense', 'Hikvision', 'dvr', 206900, 211656, 285000, 1),
  ('iDS-7204HQHI-M1/FA', 'DVR 4CH TURBO 4MP lite 1BAHIA/10TB H.265+ RECONOCIMIENTO FACIAL ANALITICAS 30FPS HDMI/VGA METAL AcuSense HIKVISION', 'Hikvision', 'dvr', 243000, 285000, 360000, 0),
  ('iDS-7208HQHI-M1/XT(STD)', 'ACUSENSE EVITA FALSAS ALARMAS DVR 4 MEGAPIXEL 8 CANALES TURBOHD + 4 CANALES IP 1 BAHÍA DE DISCO DURO AUDIO POR COAXITRON', 'Hikvision', 'dvr', 365300, 415000, 535000, 2),
  ('DS-7208HQHI-M1/FA', 'DVR 8CH TURBO 4MP lite 1BAHIA/10TB H.265+ RECONOCIMIENTO FACIAL ANALITICAS 30FPS HDMI/VGA METAL 2nd Gen AcuSense HIKVISION', 'Hikvision', 'dvr', 348000, 410000, 520000, 0),
  ('DS-7204HUHI-M1/S', 'DVR 4CH TURBO 8MP 1BAHIA/10TB H.265+ ANALITICAS 30FPS HDMI/VGA METAL 2nd Gen AcuSense HIKVISION ENTRADA Y SALIDA DE ALARMA', 'Hikvision', 'dvr', 350658, 411360, 525987, 0),
  ('iDS-7208HUHI-M1/XT', 'ACUSENSE EVITA FALSAS ALARMAS) DVR 8 MEGAPIXEL 8 CANALES TURBOHD + 4 CANALES IP 1 BAHÍA DE DISCO DURO AUDIO POR COAXITRON H.265+', 'Hikvision', 'dvr', 621200, 641665, 860000, 0),
  ('iDS-7208HUHI-M1/FA/4A+8/4ALM', 'DVR 8CH TURBO 5MP 10TB H265+ DETECCION FACIAL ANALITICA 7,5FPS-12FPS HDMI/VGA AcuSense HIKVISION ENTRADA Y SALIDA DE ALARMA', 'Hikvision', 'dvr', 569000, 670000, 840000, 0),
  ('DS-7216HGHI-M1', 'DVR 16 CH TURBO 1080P LITE 10TB SATA H165+ 15FPS HDMI/VGA HIKVISION AcuSense', 'Hikvision', 'dvr', 364000, 398800, 480000, 0),
  ('iDS-7216HQHI-M1/XT(STD)', 'ACUSENSE DVR 4 MEGAPIXEL 16 CANALES TURBOHD + 8 CANALES IP 1 BAHÍA DE DISCO DURO AUDIO POR COAXITRON / SALIDA DE VÍDEO EN FULL HD', 'Hikvision', 'dvr', 604300, null, 900000, 1),
  ('iDS-7216HUHI-M2/X', 'DVR 16CH ACUSENSE (4 CH DETEC HUMANO/COCHE), 5 EN 1 (TVI, AHD, CVI, ANALÓG E IP) 8MPX, 2HDD 10TB (N.I.), 4 E AUDIO, 16E/4S ALARM, HDMI 4K,VGAYBNC SERIE FG3161764', 'Hikvision', 'dvr', 1331200, null, 1955000, 0),
  ('iDS-7232HQHI-M2/XT', 'DVR 32 CANALES TURBOHD + 8 CANALES IP 5 MEGAPIXEL LITE - 3K LITE ACUSENSE AUDIO POR COAXITRON / 2 BAHÍAS DE DISCO DURO H.265+ SALIDA DE VIDEO EN FULL HD', 'Hikvision', 'dvr', 1235700, null, 1820000, 0),
  ('DS-2CE56D0T-IRPF', 'CAMARA TURBO 1080P TURRET 0.01LUX IR20m INT PLASTICA HIKVISION', 'Hikvision', 'camaras_turbo_hd', 52300, 60094, 80000, 2),
  ('DS-2CE76D0T-LPFS', 'CAMARA TURBO 1080P TURRET AUDIO COAXIAL 0.01 Lux/ F1.6 DNR EXIR 2.0 Smart IR 20m IR PLASTICO HIKVISION', 'Hikvision', 'camaras_turbo_hd', 71450, null, 119000, 3),
  ('DS-2CE70DF0T-LPFS(2.8mm)(O-STD)', 'CAMARA TURBO 1080P MINIDOMO 0.001LUX F1.0 HIBRIDA B/N - 24/7 COLORVU 20M 3D DNR DWDR IP67 LUZ BLANCA PLASTICO HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 85400, 83390, 125000, 8),
  ('DS-2CE76H0T-ITPF', 'CAMARA TURBO 5MP TURRET EXIR 0.01LUX 3.6 IR20m IP67 PLASTICA HIKVISION', 'Hikvision', 'camaras_turbo_hd', 93295, 109398, 139942.5, 0),
  ('DS-2CE12DF0T-LFS(2.8mm)', 'CAMARA TURBO 1080P BALA 0.001LUX F1.0 HIBRIDA B/N - Color VU 24/7 COLORVU 20M 3D DNR DWDR IP67 LUZ BLANCA METALICA HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 109841, 128820, 164761.5, 1),
  ('DS-2CE10DF0T-LPFS', 'CAMARA TURBO 1080P MINIBALA 0.001LUX F1.0 HIBRIDA B/N - 24/7 COLORVU 20M 3D DNR DWDR IP67 LUZ BLANCA PLASTICO HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 96172, 112773, 144258, 0),
  ('DS-2CE17D0T-IT3F', 'CAMARA TURBO 1080P BALA EXIR 0.01LUX IR40m IP67 SEMIMETAL HIKVISION', 'Hikvision', 'camaras_turbo_hd', 92400, 108345, 138600, 0),
  ('DS-2CE17D0T-IT5F', 'CAMARA TURBO 1080P BALA EXIR 0.01LUX IR80m IP66 SEMIMETAL HIKVISION', 'Hikvision', 'camaras_turbo_hd', 99000, 120000, 150000, 0),
  ('DS-2CE17K0T-LFS', 'CAMARA TURBO BALA 2,8 3K HIBRIDA B/N - Color VU 40M EXTERIOR IP67 HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 124500, 143207, 180000, 4),
  ('DS-2CE17K0T-LXTS', 'Cámara Minibullet 4en1 2.8mm 3K Smart Light Hybrid Sirena y audio/ Hasta 40 m, Luz blanca: Hasta 40 m', 'Hikvision', 'camaras_turbo_hd', 138800, null, 215000, 2),
  ('DS-2CE16K0T-LPFS', 'CAMARA MINI BALA CON 2.8 IR 25M 3K HIBRIDA B/N - Color VU 20M IP67 0.01LUX PLASTICO AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 108070, 126773, 160000, 0),
  ('DS-2CE16D0T-IRPF', 'CAMARA TURBO 1080P BALA 0.01LUX IR20m INT PLASTICA HIKVISION', 'Hikvision', 'camaras_turbo_hd', 64189, 75256, 96283.5, 0),
  ('DS-2CE16H0T-ITPF', 'CAMARA TURBO 5MP BALA EXTERIOR IR67 25MTS SMART DWDR', 'Hikvision', 'camaras_turbo_hd', 112551, 130800, 168826.5, 0),
  ('DS-2CE76K0T-LPFS(2.8mm)', 'CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M 0.01LUX IR 20M PLASTICO HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 102600, 120000, 155000, 8),
  ('DS-2CE76K0T-LMFS(2.8mm)', 'CAMARA TURBO TURRET 3K HIBRIDA B/N - Color VU 20M 0.01LUX IP67 METAL HIKVISION AUDIO COAXIAL', 'Hikvision', 'camaras_turbo_hd', 110600, null, 165000, 0),
  ('DS-2CE78K0T-LXTS', 'Torreta fija con audio bidireccional de 3K con Alarma de luz intermitente', 'Hikvision', 'camaras_turbo_hd', 135200, 170000, 210000, 0),
  ('DS-2CE70D0T-PTLXTS(2.8mm)(O-STD)', 'CÁMARA FIJA PT DE 2 MP CON AUDIO BIDIRECCIONAL Y SIRENA 2 MP, RESOLUCIÓN DE 1920 × 1080 LENTE FOCAL FIJA DE 2,8 MM Y 3,6 MM SMART-HYBRID LIGHT', 'Hikvision', 'camaras_turbo_hd', 147400, 175000, 220000, 0),
  ('DS-2CE19H0T-AIT3ZF(2.7-13.5mm)(C)', 'CAMARA TURBO 5MP BALA MOTORIZADA VARIFOCAL (2.7 -13.5 ) 0.01LUX EXIR 2.0 IR40m IP67 METAL HIKVISION', 'Hikvision', 'camaras_turbo_hd', 281000, 333000, 415000, 0),
  ('DS-2CE78K0T-LTS', 'Torreta fija con audio bidireccional de 3K', 'Hikvision', 'camaras_turbo_hd', 133800, null, 198000, 0),
  ('DS-2CE70K0T-PTLXTS', 'Torreta fija tipo bala PT con audio bidireccional y sirena de 3K', 'Hikvision', 'camaras_turbo_hd', 149850, null, 220000, 0),
  ('DS-2CE12UF3T-E', 'CAMARA BALA 4K COLORVU TURRET EXIR LUZ BLANCA 40m 0.0005LUX IP67 METAL SERIE FT5032632 - FT5032621 - FT5032642', 'Hikvision', 'camaras_turbo_hd', 377200, null, 565000, 0),
  ('DS-2CE19D0T-VFIT3F(2.7-13.5mm)(C)', 'CAMARA TURBO BALA VARIFOCAL 0.01LUX F2.7-13.5 IR40M IP67', 'Hikvision', 'camaras_turbo_hd', 168800, 199000, 250000, 0),
  ('DS-PWA64-KIT-WB', 'PANEL DS-PWA64-L-WB(AXPRO 433MHZ, WHITE) *1 SENSOR MAGNETICO DS-PDMC-EG2-WB (433MHZ) *1 SENSOR DE MOVIMIENTO PIR DS.PDP15P-EG2-WB(433MHZ) *1 LLAVERO DS-PKF1-WB 2da generacion', 'Hikvision', 'kits', 680012, 797709, 990000, 0),
  ('DS-PDP15P-EG2-WB', 'SENSOR DE ALARMAR PIR RANGO DE DETECCION 15 MTRS ANGULO 85.9° COBERTURA INMUNIDAD A MASCOTAS HASTA 30KG 2nda generación', 'Hikvision', 'alarmas_sensores', 114376, 134243, 167721, 0),
  ('DS-PKF1-WB', 'LLAVERO INALAMBRICO 2nda generacion', 'Hikvision', 'alarmas_sensores', 74038, 86876, 111057, 0),
  ('DS-PS1-I-WB/red', 'SIRENA INTERIOR INALAMBRICA 433MHZ 110DB CUERPO BLANCO LUZ ROJA ALARMA HIKVISION 2nda generacion', 'Hikvision', 'alarmas_sensores', 148076, 173752, 222114, 0),
  ('CS-H1c-R101-1G2WR', 'CAMARA WIFI H1C 2 MP CONEXIÓN TIPO C AUDIO BIDIRECCIONAL, MULTILENGUA', 'EZVIZ', 'camaras_wifi_ip', 76400, null, 140000, 1),
  ('CS-H6- PRO 5 MP', 'CAMARA EZVIZ PT360 H6C 5MP', 'EZVIZ', 'camaras_wifi_ip', 129300, null, 240000, 3),
  ('CS-H9C- PRO 5 MP', 'CAMARA EZVIZ PT360 5 MP H9C EXT DOBLE LENTE', 'EZVIZ', 'camaras_wifi_ip', 365406, null, 555000, 1),
  ('CS-H6c-R101-1G2WF', 'CAMARA EZVIZ PT360 1080 H6C 3MP', 'EZVIZ', 'camaras_wifi_ip', 101900, null, 185000, 3),
  ('DS-2CV2Q21G1-IDW (W)', 'CÁMARA IP FIJA PARA INTERIORES DE 2 MP ADMITE CONEXIÓN WI-FI ADMITE MOTION 2.0, DETECCIÓN HUMANA, MOVIMIENTO PT, CONEXIÓN A HIKCONNECT', 'Hikvision', 'camaras_wifi_ip', 106600, null, 160000, 0),
  ('CS-H8c-R100-1K2WKFL(4mm)', 'CAMARA WIFI H8C PT INTELIGENTE EXT 3MP', 'EZVIZ', 'camaras_wifi_ip', 192500, null, 290000, 2),
  ('CS-H8C- PRO 5 MP', 'CAMARA WIFI H8C PT INTELIGENTE EXT 5MP', 'EZVIZ', 'camaras_wifi_ip', 211000, null, 351000, 1),
  ('DS-2DE2C400MWG/W(2.8mm)(O-STD)/EU', 'DOMO HIKVISION WIFI HIBRIDO', 'Hikvision', 'camaras_wifi_ip', 175400, null, 350000, 0),
  ('H3C', 'BALA EZVIZ WIFI 4MP EXTERIOR', 'EZVIZ', 'camaras_wifi_ip', 191600, null, 287000, 0),
  ('DS-J142I(STD)/NKS422W02H', 'KIT DE NVS WIFI DE 2 MP, H.265, UNA BALA Y UNA TORRETA INSTALACIÓN INALÁMBRICA FÁCIL Y RÁPIDA', 'Hikvision', 'kits', 306000, null, 450000, 0),
  ('SIN-COD-001', 'UPS 100VA', 'Hikvision', 'fuentes_ups', 170600, null, 260000, 1),
  ('PWA96-KIT-WB', 'KIT ALARMA HIKVISION (AXPRO) INALAMBRICA 96 ZONA', 'Hikvision', 'kits', 856200, null, 1256000, 0),
  ('SIN-COD-002', 'DISCO DURO 1 TERA', 'Hikvision', 'discos_duros', 361000, null, 540000, 1),
  ('SIN-COD-003', 'DISCO DURO 2 TERA PURPURA', 'Hikvision', 'discos_duros', 410000, 470000, 690000, 1),
  ('SIN-COD-004', 'DISCO DURO 6 TERAS', 'Hikvision', 'discos_duros', 771900, null, 1115000, 0),
  ('SIN-COD-005', 'FUENTES 12V 2 AMP', 'Hikvision', 'fuentes_ups', 5500, null, 15000, 82),
  ('SIN-COD-006', 'FUENTES 12V 1 AMP', 'Hikvision', 'fuentes_ups', 4000, 6500, 9000, 14),
  ('SIN-COD-007', 'VIDEO BALUM PASIV AZUL', 'Hikvision', 'accesorios_cableado', 3300, 6000, 8000, 16),
  ('SIN-COD-008', 'VIDEO BALUM 5MP', 'Hikvision', 'accesorios_cableado', 4000, 6000, 8000, 4),
  ('SIN-COD-009', 'VIDEO BALUM 8MP', 'Hikvision', 'accesorios_cableado', 4500, 7000, 15000, 41),
  ('SIN-COD-010', 'VIDEO BALUM DAHUA', 'Hikvision', 'accesorios_cableado', 5200, 12000, 16000, 30),
  ('SIN-COD-011', 'CONECTOR MACHO', 'Hikvision', 'accesorios_cableado', 400, 1500, 2000, 45),
  ('SIN-COD-012', 'CONECTOR HEMBRA', 'Hikvision', 'accesorios_cableado', 400, 1500, 2000, 110),
  ('SIN-COD-013', 'CAJA PLASTICA', 'Hikvision', 'accesorios_cableado', 1800, 2500, 4000, 7),
  ('SIN-COD-014', 'UPS HIKVISIN', 'Hikvision', 'fuentes_ups', 153000, null, 220000, 2),
  ('SIN-COD-015', 'CABLE UTP CTG 6 EXT 100MTS', 'Hikvision', 'accesorios_cableado', 587, 700, 1000, 130),
  ('SIN-COD-016', 'CABLE UTP CTG 6 INT 100MTS', 'Hikvision', 'accesorios_cableado', 473, 530, 700, 8),
  ('SIN-COD-017', 'CABLE UTP CTG 6 EXT 305', 'Hikvision', 'accesorios_cableado', 573, 672, 853, 171),
  ('SIN-COD-018', 'CABLE UTP CTG 6 INT 305', 'Hikvision', 'accesorios_cableado', 376, 422, 508, 232),
  ('THC-T120-PS', 'CAMARA TURBO 1080P TURRET MICROFONO INCORPORADO AUDIO COAXIAL 0.01 Lux/ F1.2 DNR EXIR 2.0 Smart IR 20m IR PLASTICA HILOOK', 'HiLook', 'camaras_turbo_hd', 59707, 65405, 83589.8, 0),
  ('THC-T120-PC', 'CAMARA TURBO 1080P INT TURRET 0.02LUXF2.8 EXIR IR20m PLASTICA HILOOK', 'HiLook', 'camaras_turbo_hd', 40100, null, 65000, 6),
  ('THC-B120-MC (2.8mm)', 'CAMARA TURBO 1080P EXT BALA 0.02LUX F2.8 EXIR IR20m IP66 METALICA HILOOK', 'HiLook', 'camaras_turbo_hd', 63100, null, 90000, 0),
  ('THC-B120-PC (2.8mm)', 'CAMARA TURBO 1080 MINI BALA 0.02 LUX EXIR IR20m IP66 PLASTICA HILOOK', 'HiLook', 'camaras_turbo_hd', 45000, null, 70000, 0),
  ('IPC-T221H', 'CAMARA IP 2MP TURRET H265+ DWDR D/NF2.8 PoE IR30m POE IP67 SEMIMETAL HILOOK', 'HiLook', 'camaras_wifi_ip', 135400, 148297, 190000, 0),
  ('IPC-B121H', 'CAMARA IP 2MP BALA H265+ DWDR D/NF2.8 PoE IR30m IP67 SEMIMETAL HILOOK', 'HiLook', 'camaras_wifi_ip', 134100, 143096, 202000, 0);


-- 1. Productos que ya existen con el mismo código (de prueba o creados antes): se actualizan.
update public.productos p
set nombre               = c.nombre,
    marca                = c.marca,
    categoria            = c.categoria,
    costo                = c.costo,
    precio_instalador    = c.precio_instalador,
    precio_cliente_final = c.precio_cliente_final,
    inventario           = c.inventario,
    activo               = true,
    es_prueba            = false
from carga_excel c
where upper(trim(p.codigo)) = upper(trim(c.codigo));


-- 2. Productos nuevos.
insert into public.productos
  (codigo, nombre, marca, categoria, costo, precio_instalador, precio_cliente_final, inventario,
   es_prueba)
select c.codigo, c.nombre, c.marca, c.categoria, c.costo, c.precio_instalador,
       c.precio_cliente_final, c.inventario, false
from carga_excel c
where not exists (
  select 1 from public.productos p where upper(trim(p.codigo)) = upper(trim(c.codigo))
);


-- 3. Productos de prueba que no están en el Excel.
--    3a. Usados en cotizaciones, pedidos o productos de interés: se desactivan.
update public.productos p
set activo = false
where p.es_prueba
  and (   exists (select 1 from public.cotizacion_lineas l            where l.producto_id = p.id)
       or exists (select 1 from public.pedido_lineas l                where l.producto_id = p.id)
       or exists (select 1 from public.cotizacion_productos_interes l where l.producto_id = p.id));

--    3b. Sin ninguna referencia: se borran.
delete from public.productos p
where p.es_prueba
  and not exists (select 1 from public.cotizacion_lineas l            where l.producto_id = p.id)
  and not exists (select 1 from public.pedido_lineas l                where l.producto_id = p.id)
  and not exists (select 1 from public.cotizacion_productos_interes l where l.producto_id = p.id);


-- 4. Comprobaciones (RNF-15). Si una falla, se lanza un error y no se guarda nada.
do $$
declare
  v_repetidos  integer;
  v_negativos  integer;
  v_faltantes  integer;
  v_prueba     integer;
begin
  select count(*) into v_repetidos
  from (select upper(trim(codigo)) from public.productos
        where codigo is not null group by 1 having count(*) > 1) r;

  select count(*) into v_negativos from public.productos where inventario < 0;

  select count(*) into v_faltantes
  from carga_excel c
  where not exists (select 1 from public.productos p
                    where upper(trim(p.codigo)) = upper(trim(c.codigo))
                      and p.activo and not p.es_prueba
                      and p.inventario = c.inventario);

  select count(*) into v_prueba from public.productos where es_prueba and activo;

  if v_repetidos > 0 or v_negativos > 0 or v_faltantes > 0 or v_prueba > 0 then
    raise exception 'Carga cancelada: % códigos repetidos, % inventarios negativos, % productos del Excel sin cargar, % productos de prueba activos',
      v_repetidos, v_negativos, v_faltantes, v_prueba;
  end if;

  raise notice 'Carga correcta: % productos del Excel', (select count(*) from carga_excel);
end;
$$;

commit;


-- Resultado: cuántos productos quedan activos y cuántos de prueba se desactivaron.
-- Esperado: 76 activos del Excel, 0 de prueba activos.
select count(*) filter (where activo and not es_prueba) as activos_excel,
       count(*) filter (where activo and es_prueba)     as activos_prueba,
       count(*) filter (where not activo and es_prueba) as prueba_desactivados,
       count(*) filter (where not activo and not es_prueba) as otros_inactivos
from public.productos;
