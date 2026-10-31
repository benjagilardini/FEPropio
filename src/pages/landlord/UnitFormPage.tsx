import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, Button, MenuItem, Grid,
  IconButton, Divider, Breadcrumbs, Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useUnit, useCreateUnit, useUpdateUnit } from '../../hooks/useUnits';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { UnitInput } from '../../types';

const unitTypes = [
  { value: 'apartment', label: 'Departamento, 1 ambiente' },
  { value: 'house', label: 'Casa' },
];

const utilityTypes = [
  { value: 'electricity', label: 'Electricidad' },
  { value: 'gas', label: 'Gas' },
  { value: 'water', label: 'Agua' },
  { value: 'condominiumFees', label: 'Expensas' },
  { value: 'propertyTax', label: 'Impuesto inmobiliario' },
];

const accountLabel: Record<string, string> = {
  electricity: 'N° de contrato',
  gas: 'N° de cliente',
  water: 'Unidad de facturación',
  condominiumFees: 'Unidad funcional',
  propertyTax: 'N° de cuenta',
};

const sectionSx = {
  fontSize: '1.05rem',
  fontWeight: 700,
  mb: 2,
};

export default function UnitFormPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const isEdit = !!unitId;
  const { data: unit, isLoading } = useUnit(unitId || '');
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const toast = useToast();

  const { register, handleSubmit, control, reset, watch, formState: { isSubmitting } } = useForm<UnitInput>({
    defaultValues: {
      address: { street: '', number: '', floor: '', apartment: '', neighborhood: '', city: '', province: '' },
      unitType: 'apartment',
      utilityAccounts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'utilityAccounts' });

  useEffect(() => {
    if (isEdit && unit) {
      reset({
        address: unit.address,
        unitType: unit.unitType,
        areaSqm: unit.areaSqm,
        propertyTaxAccount: unit.propertyTaxAccount,
        functionalUnit: unit.functionalUnit,
        referenceValue: unit.referenceValue,
        facilities: unit.facilities,
        utilityAccounts: unit.utilityAccounts,
      });
    }
  }, [isEdit, unit, reset]);

  if (isEdit && isLoading) return <LoadingSpinner />;

  const onSubmit = async (data: UnitInput) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ unitId: unitId!, data });
        toast.success('Unidad actualizada correctamente');
        navigate(`/units/${unitId}`);
      } else {
        const created = await createMutation.mutateAsync(data);
        toast.success('Unidad creada correctamente');
        navigate(`/units/${created.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar la unidad');
    }
  };

  // Build a single-line address preview
  const buildAddressPreview = () => {
    const a = watch('address');
    const parts = [`${a.street} ${a.number}`.trim()];
    if (a.floor) parts.push(`${a.floor}°`);
    if (a.apartment) parts.push(a.apartment);
    return parts.filter(Boolean).join(', ');
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/units')}
        >
          Mis unidades
        </Link>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
          {isEdit ? 'Editar unidad' : 'Nueva unidad'}
        </Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        {isEdit ? 'Editar unidad' : 'Nueva unidad'}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Los datos técnicos y administrativos quedan asociados a la unidad, esté ocupada o vacante.
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
          {/* ── Left column ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Admin data */}
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionSx}>Datos administrativos</Typography>

              {/* Address — single visual row */}
              <TextField
                fullWidth
                label="Dirección"
                placeholder="Ej: Rondeau 215, PB 1"
                sx={{ mb: 2 }}
                {...register('address.street', { required: true })}
                InputProps={{
                  // We use street as the main field but combine number/floor/apt below
                }}
              />

              {/* Number / Floor / Apt */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Número" {...register('address.number', { required: true })} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Piso" {...register('address.floor')} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Depto" {...register('address.apartment')} />
                </Grid>
              </Grid>

              {/* City / Province / Neighborhood */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Ciudad" {...register('address.city', { required: true })} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Provincia" {...register('address.province', { required: true })} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField fullWidth label="Barrio" {...register('address.neighborhood')} />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="unitType"
                    control={control}
                    render={({ field }) => (
                      <TextField select fullWidth label="Tipo de unidad" {...field}>
                        {unitTypes.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Superficie (m²)" type="number" {...register('areaSqm', { valueAsNumber: true })} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Partida inmobiliaria" {...register('propertyTaxAccount')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Unidad funcional" {...register('functionalUnit')} />
                </Grid>
              </Grid>
            </Paper>

            {/* Facility locations */}
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionSx}>Ubicación de instalaciones</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Llave de paso de agua" {...register('facilities.waterShutoff')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Llave de gas" {...register('facilities.gasShutoff')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Tablero eléctrico" {...register('facilities.electricalPanel')} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Medidores" {...register('facilities.meters')} />
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* ── Right column ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Utilities */}
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionSx}>Suministros</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Identificador de cuenta de cada prestador
              </Typography>

              {fields.map((field, index) => {
                const utilityType = watch(`utilityAccounts.${index}.utilityType`);
                return (
                  <Box key={field.id}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Controller
                          name={`utilityAccounts.${index}.provider`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField fullWidth label="Prestador" sx={{ mb: 2 }} {...f} />
                          )}
                        />
                        <TextField
                          fullWidth
                          label={accountLabel[utilityType] || 'N° de cuenta'}
                          {...register(`utilityAccounts.${index}.accountId`)}
                        />
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 6 }}>
                            <Controller
                              name={`utilityAccounts.${index}.utilityType`}
                              control={control}
                              render={({ field: f }) => (
                                <TextField select fullWidth label="Servicio" size="small" {...f}>
                                  {utilityTypes.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                              )}
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Controller
                              name={`utilityAccounts.${index}.paidBy`}
                              control={control}
                              render={({ field: f }) => (
                                <TextField select fullWidth label="Lo paga" size="small" {...f}>
                                  <MenuItem value="tenant">Inquilino</MenuItem>
                                  <MenuItem value="landlord">Propietario</MenuItem>
                                </TextField>
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => remove(index)}
                        sx={{ mt: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}

              <Button
                startIcon={<AddIcon />}
                onClick={() => append({ utilityType: 'electricity', provider: '', accountId: '', paidBy: 'tenant' })}
                sx={{ mt: fields.length > 0 ? 2 : 0, textTransform: 'uppercase', fontWeight: 600, fontSize: '0.8rem' }}
              >
                Agregar suministro
              </Button>
            </Paper>

            {/* Property value */}
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionSx}>Valor de la propiedad</Typography>
              <TextField
                fullWidth
                label="Valor de referencia ($)"
                {...register('referenceValue')}
                helperText="Lo definís vos. Se usa para calcular el rendimiento."
              />
            </Paper>
          </Box>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate(-1)} sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button variant="contained" type="submit" disabled={isSubmitting} startIcon={<SaveIcon />}>
            {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar unidad'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
