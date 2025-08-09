-- CORRECCIÓN MASIVA TIMEZONE - CASOS CRÍTICOS
-- Generado automáticamente
-- Fecha: 2025-08-08 22:17:47

START TRANSACTION;

-- Usuario: Ana Laura Lopez Llancafillo (alauralopez94@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('293E4C6C7A6845FEBA707E632329FE21');

-- Usuario: Yesica lourdes velgas (yesicavelgas2017@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('C83F8AED7AA449A5B9B13763F6E4CD58');

-- Usuario: MARIELA FERRARA (marielaluciaferrara@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('B52439422BAB4685AF5C3E98212B06AB');

-- Usuario: Maria Gimena Correa (mariacorreacantaloube@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('687E7B5501A44CDBA88D0ED5A7B7C98A');

-- Usuario: CELESTE ESTEFANIA ESPINA DE NONI (celeste_espina@hotmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('490D969881A945D0809A8542B9644859');

-- Usuario: Lucia del Rosario Barrera Berben (luciabarreraberben@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('CEB7CC4D78D14FC9B0C725DDB4A7A839');

-- Usuario: pablo leonardi (pabloleonardi81@yahoo.com.ar)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('00DA26F3A3924D75B601D39CFECB4FFF');

-- Usuario: Ruth Ibañez (ruthcarina@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('E689620B5D4D4C919DFFAC0B714D44C4');

-- Usuario: Eliana Celeste González (eliana.gonzalez87@hotmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('26ED62F4C82C4CB1A6ECABAB63D286C4');

-- Usuario: María Virginia Pérez (mvirgiperez2009@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('52AB166275C84DC580BB60ECBF0E672A');

-- Usuario: Cintia Belén Lourdes Balmaceda Carpio (cbalmaceda740@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('12A1B51FA4364F158F671B2C6B3D640D');

-- Usuario: Patricia Rosana Muñoz (patriciaros28@gmail.com)
-- Fecha UTC: 2025-08-09 -> Fecha ART estimada: 2025-08-08
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('F3DF4F37058B41D09209B9CDD8DF3E2D');

-- Usuario: Gonzalo Salinas (gonzalosalinas@outlook.es)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('8BA1DEF3379E4C5291C712D7F187CD97');

-- Usuario: Dario Jesus Beas (dbeas@mpfmza.gob.ar)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('E4F3810901A94E8BB6B8A608D34361A5');

-- Usuario: Maria Cecilia Castillo Barreira (ceciliacastillo1520@hotmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('A76CB8556CF849ABB6D94CE6A316EF14');

-- Usuario: Maricel Cinthia Tripiana (mariceltripiana@gmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('ECA1DEBEDD014624BDAB345AD191A099');

-- Usuario: María Sol Hanono Pino (msol.hanono@gmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('71D01790C2C1468597B31EE1D4B5A0DB');

-- Usuario: maria julieta lauro (julil04@hotmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('1CB21A3D663A4DD3B573B9AA7502BD95');

-- Usuario: Walter Emiliano Zamora Tumino (emiz_89@hotmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('D1643040DD9A4158AF10F8D530F64C15');

-- Usuario: Nadia Escudero (nadia.be90@gmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('E1B2B998D43C4DF38C28E2FA58786891');

-- Usuario: Leandro Andrés Maya (leandromaya@live.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('7896CA63B83447748A0A48136B348FBD');

-- Usuario: Laura Estela Alcaya Sanchez (lauraestela.alcayasanchez@gmail.com)
-- Fecha UTC: 2025-08-08 -> Fecha ART estimada: 2025-08-07
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('D52CFED114444348A1F1AB1555D8E6D4');

-- Usuario: Valeria Elizabeth Agüero (valeaguerob2878@gmail.com)
-- Fecha UTC: 2025-08-07 -> Fecha ART estimada: 2025-08-06
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('DC6317329C8B441C92E151A591E9904D');

-- Usuario: maria candela peña benedetti (candela_1206@hotmail.com)
-- Fecha UTC: 2025-08-06 -> Fecha ART estimada: 2025-08-05
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('5F48D25ADA054EFCAEBEDCB56B9897BA');

-- Usuario: Pablo Gaete (pablogaetemelis@gmail.com)
-- Fecha UTC: 2025-08-05 -> Fecha ART estimada: 2025-08-04
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('CEC864733EC24349A8E6F7B0F42EE041');

-- Usuario: Daiana Guadalupe Gadadi (daianagadadi@gmail.com)
-- Fecha UTC: 2025-08-05 -> Fecha ART estimada: 2025-08-04
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('70A6CA6C244747C4AC26281DB206E9BF');

-- Usuario: Facundo Ariel Gaviola (fgaviola@jus.mendoza.gov.ar)
-- Fecha UTC: 2025-08-04 -> Fecha ART estimada: 2025-08-03
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('C03678E80C2543ED8A0D54577FBA8BE1');

-- Usuario: Monica Pedernera (mony_pedernera@yahoo.com.ar)
-- Fecha UTC: 2025-08-02 -> Fecha ART estimada: 2025-08-01
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('BFB0AE337C7D4414B2D7E9D19FEAE809');

-- Usuario: Melisa Yanina Nuñez (MNABOGADA@GMAIL.COM)
-- Fecha UTC: 2025-08-02 -> Fecha ART estimada: 2025-08-01
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('C5DE5ED62C7049B8A7C7D21608E4DDC1');

-- Usuario: VALENTINA ROCIO GAUNA (valentina_gauna@hotmail.com)
-- Fecha UTC: 2025-08-01 -> Fecha ART estimada: 2025-07-31
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('0B911C26B4514A549C1A3BCBC44D359E');

-- Usuario: Cynthia Talet (c.talet@yahoo.com.ar)
-- Fecha UTC: 2025-08-01 -> Fecha ART estimada: 2025-07-31
UPDATE inscriptions SET
    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
WHERE id = UNHEX('4A7D0FB1AC4E498C873564B894F13F26');

COMMIT;
