import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button,
  Stepper, Step, StepLabel, Alert, Divider,
  TextField, MenuItem, Grid,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useForm, Controller } from 'react-hook-form';
import {
  useLease, useUpdateLease, useConfirmField, useCorrectField,
  useActivateLease, useUpdatePaymentAccount,
} from '../../hooks/useLeases';
import { useUnit } from '../../hooks/useUnits';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import type { PaymentAccount } from '../../types';
import { leaseApi } from '../../api/leaseApi';

const steps = ['Cargar documento', 'Confirmar datos', 'Habilitar acceso al locatario'];

const indexOptions = [
  { value: 'IPC', label: 'IPC (INDEC)' },
  { value: 'ICL', label: 'ICL (BCRA)' },
  { value: 'UVA', label: 'UVA (BCRA)' },
];

const frequencyOptions = [
  { value: 3, label: 'Trimestral (cada 3 meses)' },
  { value: 6, label: 'Semestral (cada 6 meses)' },
  { value: 12, label: 'Anual (cada 12 meses)' },
];

const fieldLabels: Record<string, string> = {
  landlordName: 'Locador',
  tenantName: 'Locatario',
  tenantDni: 'DNI del locatario',
  tenantEmail: 'Email del locatario',
  startDate: 'Inicio del plazo',
  endDate: 'Fin del plazo',
  duration: 'Duración',
  initialRent: 'Alquiler inicial',
  securityDeposit: 'Depósito en garantía',
  adjustmentIndex: 'Índice de actualización',
  adjustmentFrequencyMonths: 'Periodicidad',
  propertyTaxAccount: 'Partida inmobiliaria',
  functionalUnit: 'Unidad funcional',
};

interface LeaseFormValues {
  tenantName: string;
  tenantDni: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  initialRent: string;
  securityDeposit: string;
  adjustmentIndex: 'IPC' | 'ICL' | 'UVA';
  adjustmentFrequencyMonths: number;
}

export default function LeaseConfirmPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: lease, isLoading } = useLease(leaseId!);
  const { data: unit } = useUnit(lease?.unitId || '');
  const updateMut = useUpdateLease();
  const confirmFieldMut = useConfirmField();
  const correctFieldMut = useCorrectField();
  const activateMut = useActivateLease();
  const paymentAccountMut = useUpdatePaymentAccount();

  const toast = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [correctedValue, setCorrectedValue] = useState('');
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Lease data form
  const { register, handleSubmit, control, reset } = useForm<LeaseFormValues>();

  // Payment form
  const { register: regPay, handleSubmit: handlePaySubmit, reset: resetPay } = useForm<PaymentAccount>();

  // Load PDF preview
  useEffect(() => {
    if (!lease?.document?.fileId) return;
    let revoked = false;
    leaseApi.downloadDocument(leaseId!).then((res) => {
      if (revoked) return;
      const url = URL.createObjectURL(res.data);
      setPdfUrl(url);
    }).catch(() => {});
    return () => { revoked = true; if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [lease?.document?.fileId, leaseId]);

  // Pre-fill forms when lease loads
  useEffect(() => {
    if (!lease) return;

    // Build extracted values map
    const ext = new Map<string, string>();
    lease.extractedFields.forEach((f) => {
      const val = f.correctedValue ?? f.value;
      if (val != null) ext.set(f.fieldName, String(val));
    });

    // For lease form: use extracted values first, then lease data, then empty
    const isPlaceholder = lease.initialRent === '0' || lease.initialRent === '0.00';
    reset({
      tenantName: ext.get('tenantName') || lease.tenantName || '',
      tenantDni: lease.tenantDni || '',
      tenantEmail: lease.tenantEmail || '',
      startDate: ext.get('startDate') || lease.startDate?.split('T')[0] || '',
      endDate: ext.get('endDate') || lease.endDate?.split('T')[0] || '',
      initialRent: ext.get('initialRent') || (isPlaceholder ? '' : lease.initialRent) || '',
      securityDeposit: ext.get('securityDeposit') || lease.securityDeposit || '',
      adjustmentIndex: (ext.get('adjustmentIndex') as LeaseFormValues['adjustmentIndex']) || lease.adjustmentIndex || 'ICL',
      adjustmentFrequencyMonths: Number(ext.get('adjustmentFrequencyMonths')) || lease.adjustmentFrequencyMonths || 6,
    });

    // Payment form
    if (lease.paymentAccount) {
      resetPay({
        holderName: lease.paymentAccount.holderName || '',
        bank: lease.paymentAccount.bank || '',
        cbuOrCvu: lease.paymentAccount.cbuOrCvu || '',
        alias: lease.paymentAccount.alias || '',
      });
    }
  }, [lease, reset, resetPay]);

  if (isLoading || !lease) return <LoadingSpinner />;

  const fields = lease.extractedFields;
  const hasExtracted = fields.length > 0;
  const confirmedCount = fields.filter((f) => f.status !== 'pending').length;

  const landlordName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const unitAddress = unit
    ? `${unit.address.street} ${unit.address.number}${unit.address.floor ? `, ${unit.address.floor}.°` : ''}${unit.address.apartment ? ` ${unit.address.apartment}` : ''}`
    : '';

  const handleConfirmField = async (index: number) => {
    await confirmFieldMut.mutateAsync({ leaseId: leaseId!, fieldIndex: index });
  };

  const handleCorrectField = async (index: number) => {
    await correctFieldMut.mutateAsync({ leaseId: leaseId!, fieldIndex: index, value: correctedValue });
    setEditingIndex(null);
    setCorrectedValue('');
  };

  const handleRegister = async (formData: LeaseFormValues) => {
    try {
      setError('');
      await updateMut.mutateAsync({
        leaseId: leaseId!,
        data: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          initialRent: formData.initialRent,
          adjustmentIndex: formData.adjustmentIndex,
          adjustmentFrequencyMonths: formData.adjustmentFrequencyMonths,
          securityDeposit: formData.securityDeposit || undefined,
          tenantName: formData.tenantName || undefined,
          tenantDni: formData.tenantDni || undefined,
          tenantEmail: formData.tenantEmail || undefined,
        },
      });
      await activateMut.mutateAsync(leaseId!);
      toast.success('Contrato registrado correctamente');
      navigate(`/leases/${leaseId}/invite`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrar el contrato';
      setError(msg);
      toast.error(msg);
    }
  };

  const onPaymentAccount = async (data: PaymentAccount) => {
    try {
      await paymentAccountMut.mutateAsync({ leaseId: leaseId!, data });
      toast.success('Datos de cobro guardados');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar datos de cobro');
    }
  };

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

  return (
    <Box>
      <PageHeader
        breadcrumbs={[
          { label: 'Mis unidades', onClick: () => navigate('/units') },
          ...(unit ? [{ label: unitAddress, onClick: () => navigate(`/units/${lease.unitId}`) }] : []),
          { label: 'Nuevo contrato' },
        ]}
        title="Confirmar datos extraídos"
        chips={
          hasExtracted ? (
            <Box sx={{ px: 1.5, py: 0.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {confirmedCount} de {fields.length} confirmados
            </Box>
          ) : undefined
        }
        actions={
          <>
            <Button onClick={() => navigate(-1)} sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(handleRegister)}
              disabled={activateMut.isPending || updateMut.isPending}
            >
              {activateMut.isPending || updateMut.isPending ? 'Registrando...' : 'Registrar contrato'}
            </Button>
          </>
        }
      />

      {/* Stepper */}
      <Stepper activeStep={1} sx={{ mb: 4, mt: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Extracted fields table (when backend extraction is available) */}
      {hasExtracted && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' }, gap: 3, mb: 3, alignItems: 'start' }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            {lease.document?.fileName && (
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>{lease.document.fileName}</Typography>
            )}
            <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Vista previa del contrato"
                  style={{ width: '100%', height: 400, border: 'none', borderRadius: 4 }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cargando vista previa...</Typography>
              )}
            </Box>
            {selectedField?.sourceText && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: 'warning.dark', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.dark' }}>Texto de origen del campo seleccionado</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>«{selectedField.sourceText}»</Typography>
                </Box>
              </Box>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px 100px', px: 2, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campo</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor extraído</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</Typography>
              <Box />
            </Box>
            {fields.map((field, index) => (
              <Box
                key={index}
                onClick={() => setSelectedFieldIndex(index)}
                sx={{
                  display: 'grid', gridTemplateColumns: '140px 1fr 110px 100px',
                  px: 2, py: 1.5,
                  borderBottom: '1px solid', borderColor: 'divider',
                  cursor: 'pointer',
                  bgcolor: selectedFieldIndex === index ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:last-child': { borderBottom: 0 },
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {fieldLabels[field.fieldName] || field.fieldName}
                </Typography>
                <Box>
                  {editingIndex === index ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField size="small" value={correctedValue} onChange={(e) => setCorrectedValue(e.target.value)} sx={{ minWidth: 140 }} />
                      <Button size="small" variant="contained" onClick={() => handleCorrectField(index)}>OK</Button>
                      <Button size="small" onClick={() => setEditingIndex(null)}>X</Button>
                    </Box>
                  ) : (
                    <Typography variant="body2">{String(field.correctedValue ?? field.value ?? '')}</Typography>
                  )}
                </Box>
                <StatusChip status={field.status} />
                <Box sx={{ textAlign: 'right' }}>
                  {field.status === 'pending' && editingIndex !== index ? (
                    <Button size="small" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); handleConfirmField(index); }}>
                      Confirmar
                    </Button>
                  ) : editingIndex !== index ? (
                    <Button size="small" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setEditingIndex(index); setCorrectedValue(String(field.correctedValue ?? field.value ?? '')); }}>
                      Editar
                    </Button>
                  ) : null}
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      )}

      {/* Editable lease form */}
      {!hasExtracted && (
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider', mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>Datos del contrato</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Completá los datos del contrato. Los campos pre-llenados fueron leídos del documento.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Locador"
                value={landlordName}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Locatario (nombre completo)" {...register('tenantName')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="DNI del locatario" {...register('tenantDni')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField fullWidth label="Email del locatario" type="email" {...register('tenantEmail')} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Inicio del plazo"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('startDate', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fin del plazo"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('endDate', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Alquiler inicial ($)"
                placeholder="Ej: 480000"
                {...register('initialRent', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Depósito en garantía ($)"
                placeholder="Ej: 480000"
                {...register('securityDeposit')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="adjustmentIndex"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Índice de actualización" {...field}>
                    {indexOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="adjustmentFrequencyMonths"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Periodicidad" {...field}>
                    {frequencyOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Payment account */}
      <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>Datos para recibir el pago</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Son los datos que va a ver el locatario para transferir el alquiler de este contrato. Podés usar una cuenta distinta para cada contrato.
        </Typography>

        <Box component="form" onSubmit={handlePaySubmit(onPaymentAccount)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Titular de la cuenta" {...regPay('holderName', { required: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Banco o billetera" {...regPay('bank', { required: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="CBU o CVU" {...regPay('cbuOrCvu', { required: true })} helperText="22 dígitos" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Alias" {...regPay('alias')} />
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="outlined" size="small" disabled={paymentAccountMut.isPending}>
                  {paymentAccountMut.isPending ? 'Guardando...' : 'Guardar datos de cobro'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
