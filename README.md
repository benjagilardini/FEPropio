# Propio Frontend

Interfaz web del sistema de administración de contratos de alquiler.

## Acerca del proyecto

Propio es un sistema web orientado al propietario particular que administra una o varias unidades en alquiler permanente sin intermediación de una inmobiliaria. Toma la unidad inmobiliaria como entidad central y consolida en ella su información técnica, administrativa y de suministros, con independencia de que se encuentre ocupada o vacante.

El sistema contempla dos roles con paneles diferenciados: el propietario, que gestiona sus unidades y contratos, y el locatario, que accede a la información de su vivienda mientras su contrato esté vigente.

### Funcionalidades

**Registro de unidades**

Cada unidad se carga con su dirección, tipo, superficie, partida inmobiliaria, unidad funcional, ubicación de instalaciones (llaves de paso, tablero eléctrico, medidores) y las cuentas de cada servicio domiciliario (electricidad, gas, agua, expensas) con su identificador ante el prestador y quién se hace cargo del pago. Esta información persiste asociada al inmueble a lo largo de sucesivos contratos.

**Carga del contrato con extraccion asistida**

El propietario sube el documento del contrato (PDF o imagen) y el sistema extrae automaticamente los datos relevantes: partes, fechas, alquiler inicial, indice de actualizacion y periodicidad. Cada dato extraido se presenta junto al texto de origen para que el propietario lo confirme o corrija antes de registrarlo. El documento original queda vinculado a la unidad y disponible para ambas partes.

**Datos de cobro**

Cada contrato registra los datos bancarios (titular, banco, CBU/CVU, alias) para que el locatario sepa donde transferir. Esta informacion se muestra directamente en el panel del locatario con la posibilidad de copiar cada campo.

**Invitacion al locatario**

Con el contrato registrado, el propietario invita al locatario por correo electronico. El nombre y DNI se toman del contrato confirmado. Al aceptar la invitacion, el locatario activa su cuenta y accede a su panel. El acceso queda habilitado mientras el contrato este vigente; al finalizar, pasa a modo de solo lectura.

**Calculo y estimacion de actualizaciones**

El sistema obtiene las series de indices publicos (IPC, ICL, UVA) desde las fuentes oficiales (INDEC, BCRA) y calcula cada actualizacion del alquiler segun el indice y la periodicidad pactados. Cuando el indice del periodo aun no esta publicado en su totalidad, estima el ajuste como un rango (minimo y maximo) que se acota automaticamente a medida que se difunden los valores faltantes. Cada ajuste conserva el detalle del calculo con sus coeficientes para que ambas partes puedan verificarlo.

**Notificacion de ajustes**

El propietario puede notificar al locatario cada actualizacion del alquiler. La notificacion se registra con fecha y monto informado, y el locatario la recibe en tiempo real.

**Comparacion de indices**

Permite contrastar como habria evolucionado el alquiler si se hubiera pactado con un indice distinto al contratado (IPC, ICL o UVA), manteniendo la misma periodicidad y fecha de inicio. Muestra la evolucion en un grafico y una tabla comparativa con la diferencia acumulada respecto al indice pactado.

**Pagos y comprobantes**

El locatario visualiza el calendario de pagos con el monto esperado de cada periodo y carga el comprobante de transferencia para cada mes. El propietario revisa los comprobantes recibidos y los confirma u observa con un motivo. El estado de cada pago (sin pago, por revisar, confirmado, observado) se refleja en ambos paneles.

**Registro de gastos y rendimiento**

El propietario registra los gastos a su cargo asociados a cada unidad, clasificados por categoria (impuestos, seguros, mantenimiento, expensas, otros). Con los ingresos efectivamente cobrados, los gastos cargados y un valor de referencia de la propiedad que el propietario define, el sistema calcula el rendimiento anual en pesos y en dolares (oficial y blue), la rentabilidad bruta y neta, el rendimiento real descontando inflacion, y la comparacion entre la variacion del alquiler y la devaluacion del peso. Los datos se presentan con desglose mensual y por categoria de gasto.

**Reclamos de mantenimiento**

El locatario registra reclamos clasificados por categoria (plomeria, electricidad, gas, estructura, electrodomesticos) con descripcion y fotos. Cada reclamo tiene un historial de estados (abierto, en progreso, resuelto, cerrado) que el propietario actualiza con comentarios. Los cambios de estado generan notificaciones al locatario.

**Notificaciones en tiempo real**

El sistema notifica eventos relevantes a traves de WebSockets: nuevas actualizaciones del alquiler, comprobantes cargados, cambios en reclamos de mantenimiento e invitaciones. Las notificaciones se consultan desde el panel de cada usuario.

**Finalizacion del contrato**

El propietario finaliza el contrato registrando la fecha de restitucion. El locatario conserva acceso de solo lectura al historial (contrato, ajustes, pagos) y la unidad queda disponible para un nuevo contrato.

## Stack

- React 19 + TypeScript
- Vite
- Material UI (MUI)
- React Query (TanStack)
- React Hook Form + Zod
- Recharts (graficos)
- Socket.IO Client (notificaciones en tiempo real)

## Requisitos

- Node.js >= 20
- Backend corriendo (ver [BEPropio](https://github.com/benjagilardini/BEPropio))

## Instalación

```bash
git clone https://github.com/benjagilardini/FEPropio.git
cd FEPropio
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000/api
```

## Levantar en desarrollo

```bash
npm run dev
```

La aplicación arranca en `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview   # previsualizar el build localmente
```

## Lint

```bash
npm run lint
```

## Estructura del proyecto

```
src/
  api/             # Llamadas HTTP (axios)
  components/      # Componentes reutilizables
    common/        # UI compartida (KVTable, InfoRow, StatCard, etc.)
  config/          # Configuración (API URL)
  constants/       # Labels y constantes de dominio
  context/         # Auth, Toast, Socket (React Context)
  hooks/           # Custom hooks (React Query wrappers)
  pages/
    auth/          # Login, registro, invitaciones
    landlord/      # Panel del propietario
    tenant/        # Panel del inquilino
  routes/          # Definición de rutas por rol
  types/           # Tipos TypeScript compartidos
  utils/           # Formateo, helpers
```
