import { Box, CircularProgress } from '@mui/material';

interface Props {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = false }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '100vh' : 'calc(100vh - 120px)',
      }}
    >
      <CircularProgress size={36} thickness={4} />
    </Box>
  );
}
