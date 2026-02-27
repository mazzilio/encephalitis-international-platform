/**
 * Role Card Component
 * Interactive card for role selection with icon, title, and description
 */

import { Card, CardContent, CardActionArea, Box, Typography } from '@mui/material';
import type { UserRole } from '../../types/user.types';

interface RoleCardProps {
  role: Exclude<UserRole, null>;
  title: string;
  description: string;
  icon: string;
  onSelect: () => void;
}

export default function RoleCard({ title, description, icon, onSelect }: RoleCardProps) {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: { xs: '100%', md: 280 },
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          borderWidth: 2,
        },
        '&:focus-within': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
      elevation={2}
    >
      <CardActionArea
        onClick={onSelect}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 3,
        }}
        aria-label={`Select ${title}`}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 0,
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: '#2a9d8f',
              color: 'primary.contrastText',
              p: 2,
            }}
          >
            <Box
              component="img"
              src={icon}
              alt=""
              aria-hidden="true"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
