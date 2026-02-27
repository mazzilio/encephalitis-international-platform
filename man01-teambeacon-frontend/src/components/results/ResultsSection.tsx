/**
 * Results Section Component
 * Displays a section of personalized results with icon and content
 */

import { Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import type { ContentSection } from '../../types/api.types';

interface ResultsSectionProps {
  section: ContentSection;
  defaultExpanded?: boolean;
}

export default function ResultsSection({ section, defaultExpanded = true }: ResultsSectionProps) {
  const getIcon = () => {
    switch (section.type) {
      case 'warning':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      case 'tip':
        return <TipsAndUpdatesIcon sx={{ color: 'success.main' }} />;
      case 'resource':
        return <LibraryBooksIcon sx={{ color: 'primary.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getBgColor = () => {
    switch (section.type) {
      case 'warning':
        return 'error.lighter';
      case 'tip':
        return 'success.lighter';
      case 'resource':
        return 'primary.lighter';
      default:
        return 'info.lighter';
    }
  };

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={{
        mb: 2,
        boxShadow: 1,
        '&:before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: getBgColor(),
          '&:hover': {
            bgcolor: getBgColor(),
            opacity: 0.9,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {section.title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-line',
            lineHeight: 1.8,
          }}
        >
          {section.content}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
