import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Breadcrumbs, Link,
  Stepper, Step, StepLabel, Alert, LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import { useUnit } from '../../hooks/useUnits';
import { useCreateLease, useExtractLease, useLeasesByUnit } from '../../hooks/useLeases';
import { useToast } from '../../context/ToastContext';
import type { Unit } from '../../types';

const steps = ['Cargar documento', 'Confirmar datos', 'Habilitar acceso al locatario'];

function formatUnitAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function formatUnitSubtitle(unit: Unit): string {
  const parts: string[] = [];
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  parts.push(addr);
  if (a.neighborhood) parts.push(a.neighborhood);
  if (a.city) parts.push(a.city);
  return parts.join(' · ');
}

interface ExtractionStep {
  label: string;
  done: boolean;
  active: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LeaseUploadPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit } = useUnit(unitId || '');
  const { data: leasesData } = useLeasesByUnit(unitId || '');
  const createMutation = useCreateLease();
  const extractMutation = useExtractLease();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([
    { label: 'Documento cargado', done: false, active: false },
    { label: 'Texto reconocido (OCR)', done: false, active: false },
    { label: 'Interpretando cláusulas', done: false, active: false },
    { label: 'Datos listos para confirmar', done: false, active: false },
  ]);
  const [extractionDone, setExtractionDone] = useState(false);
  const [createdLeaseId, setCreatedLeaseId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const setStepState = (activeIdx: number, doneUpTo: number) => {
    setExtractionSteps((prev) =>
      prev.map((s, i) => ({
        ...s,
        active: i === activeIdx,
        done: i < doneUpTo,
      })),
    );
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setExtractionDone(false);
    setError('');
    setIsProcessing(true);

    try {
      // Step 1: Upload & create lease
      setStepState(0, 0);

      const existingDraft = leasesData?.data?.find((l) => l.status === 'draft');
      let leaseId: string;

      if (existingDraft) {
        leaseId = existingDraft.id;
      } else {
        const lease = await createMutation.mutateAsync({
          unitId: unitId!,
          data: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
            initialRent: '0',
            adjustmentIndex: 'ICL',
            adjustmentFrequencyMonths: 6,
          },
          file: selectedFile,
        });
        leaseId = lease.id;
      }

      setCreatedLeaseId(leaseId);
      setStepState(1, 1);

      // Step 2-3: Extract with AI
      setStepState(2, 2);
      await extractMutation.mutateAsync(leaseId);

      // Step 4: Done
      setStepState(-1, 4);
      setExtractionDone(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el documento';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [unitId, leasesData, createMutation, extractMutation, toast]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f.type !== 'application/pdf' && !f.type.startsWith('image/')) {
      setError('Solo se permiten archivos PDF o imágenes.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar los 10 MB.');
      return;
    }
    setError('');
    processFile(f);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleContinue = () => {
    if (!createdLeaseId) return;
    navigate(`/leases/${createdLeaseId}/confirm`);
  };

  const removeFile = () => {
    setFile(null);
    setExtractionDone(false);
    setCreatedLeaseId(null);
    setExtractionSteps((prev) => prev.map((s) => ({ ...s, done: false, active: false })));
  };

  const unitAddress = unit ? formatUnitAddress(unit) : '';
  const unitSubtitle = unit ? formatUnitSubtitle(unit) : '';

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate('/units')}>
          Mis unidades
        </Link>
        {unit && (
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate(`/units/${unitId}`)}>
            {unitAddress}
          </Link>
        )}
        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>Nuevo contrato</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Nuevo contrato</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{unitSubtitle}</Typography>

      {/* Stepper */}
      <Stepper activeStep={0} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        {/* Left: Document upload */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>Documento del contrato</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            El documento queda vinculado a la unidad y disponible para ambas partes, también después de que el contrato finalice.
          </Typography>

          {/* Drop zone */}
          {!file && (
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                py: 5,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Arrastrá el contrato o{' '}
                <Box component="span" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                  seleccionalo
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                PDF o imagen escaneada · hasta 10 MB
              </Typography>
            </Box>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Uploaded file preview */}
          {file && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mt: 1,
              }}
            >
              <InsertDriveFileIcon sx={{ color: 'primary.main' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }} noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatFileSize(file.size)}
                </Typography>
                {isProcessing && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main' }}>
                      Procesando documento...
                    </Typography>
                    <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
                  </Box>
                )}
              </Box>
              <IconButton size="small" onClick={removeFile} sx={{ color: 'text.secondary' }} disabled={isProcessing}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Paper>

        {/* Right: Extraction progress */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            Progreso de la extracción
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {extractionSteps.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {step.done ? (
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                ) : step.active ? (
                  <HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 22, animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                ) : (
                  <CheckCircleIcon sx={{ color: 'action.disabled', fontSize: 22 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: step.done || step.active ? 500 : 400,
                    color: step.done ? 'text.primary' : step.active ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mt: 3,
              p: 2,
              bgcolor: 'info.main',
              borderRadius: 1.5,
              color: 'info.contrastText',
              opacity: 0.9,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.25 }} />
            <Typography variant="body2">
              Ningún dato se guarda sin tu confirmación. En el paso siguiente revisás cada campo contra el documento.
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate(`/units/${unitId}`)} sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!extractionDone || isProcessing}
          onClick={handleContinue}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}
