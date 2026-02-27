/**
 * Option Card Component
 * Visual card-based option selector with icon, title, and description
 */

import { Card, CardActionArea, Box, Typography, Radio } from '@mui/material';
import type { ReactNode } from 'react';

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  value: string;
}

export default function OptionCard({
  icon,
  title,
  description,
  selected,
  onClick,
  value,
}: OptionCardProps) {
  return (
    <Card
      sx={{
        mb: 2,
        border: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.lighter' : 'background.paper',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
        },
      }}
      elevation={0}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: selected ? 'primary.main' : 'grey.200',
            color: selected ? 'primary.contrastText' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3,
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {icon}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, textAlign: 'left' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: selected ? 'primary.main' : 'text.primary',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.5 }}
          >
            {description}
          </Typography>
        </Box>

        {/* Radio indicator */}
        <Radio
          checked={selected}
          value={value}
          sx={{ ml: 2 }}
          inputProps={{ 'aria-label': title }}
        />
      </CardActionArea>
    </Card>
  );
}
