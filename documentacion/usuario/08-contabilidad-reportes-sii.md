# 📊 Manual de Usuario: 08. Contabilidad, Reportes Financieros y SII

**Pantalla:** `/admin/reservas?tab=contabilidad`  
**Roles involucrados:** Administradores y Dueño del Complejo  

---

## 1. Propósito del Módulo Financiero

El módulo contable de Rancho Carmelitas consolida la información comercial de todas las estancias para facilitar la rendición de cuentas, el cumplimiento tributario ante el Servicio de Impuestos Internos (SII) de Chile y la liquidación mensual transparente para el propietario del rancho.

---

## 2. Indicadores Financieros y Fórmulas de Cálculo

Al ingresar a la pestaña **"📊 Reporte Financiero & SII"** y seleccionar el **Año** y **Mes** correspondiente, el sistema calcula de forma automática:

```
[ Ingreso Bruto Total ]
  - [ IVA Débito Fiscal (19% sobre reservas con factura) ]
  - [ Comisiones de Plataformas Externas (Booking.com / Airbnb) ]
  - [ Comisión de Administración Interna del Rancho ]
  ═════════════════════════════════════════════════════════════════
  = [ INGRESO NETO FINAL A LIQUIDAR AL DUEÑO ]
```

### Glosario de Conceptos Financieros:

1. **Ingreso Bruto Total:** Suma total de dinero facturado o cobrado por concepto de estancias y adicionales en el periodo seleccionado (excluyendo reservas canceladas).
2. **IVA Recaudado (19%):** Impuesto al Valor Agregado calculado exclusivamente sobre aquellas reservas donde el cliente marcó la casilla *"¿Requiere Factura?"*. Este monto se aísla para el pago mensual de impuestos (Formulario 29 ante el SII).
3. **Comisiones de Plataformas Externas:** Total de dinero retenido por canales intermediarios (ej: el 15% o 18% que descuentan Booking.com o Airbnb).
4. **Comisión de Administración Interna:** Porcentaje administrativo pactado para cubrir la operación, sueldos del personal y gestión comercial de Rancho Carmelitas (aplicado sobre el valor base pactado).
5. **Ingreso Neto del Dueño:** La ganancia líquida real que se transfiere a la cuenta bancaria del propietario tras descontar impuestos, comisiones externas y administración.

---

## 3. Ficha de Liquidación Interna Privada

En la tabla inferior de reservas, cada fila incluye un desglose interactivo denominado **Ficha de Liquidación Interna**:
* Permite al administrador auditar reserva por reserva cómo se descompone la tarifa.
* **Privacidad Estricta de 360 Grados:** Esta información es estrictamente confidencial para la administración del Rancho. **Jamás se imprime ni se envía en los correos transaccionales que recibe el huésped.**

---

## 4. Conciliación y Entrega al Contador

1. Selecciona el mes cerrado que se desea declarar (ej: *Noviembre 2026*).
2. Revisa que todas las reservas del periodo estén en estado `'Confirmada'` o `'checkout'`.
3. Comprueba el cuadro de **Reservas con Factura requerida** para emitir los documentos tributarios electrónicos correspondientes en el portal del SII.
4. Exporta los datos consolidados para adjuntarlos a la carpeta mensual de contabilidad.
