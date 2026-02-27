/**
 * Resource Card Component
 * Displays a resource link with title and description
 */

import { Card, CardContent, CardActionArea, Typography, Box } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { ResourceLink } from '../../types/api.types';

interface ResourceCardProps {
  resource: ResourceLink;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const isExternal = resource.type === 'external' || resource.url.startsWith('http');

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea
        component="a"
        href={resource.url}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          p: 2,
        }}
      >
        <CardContent sx={{ flex: 1, p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <Typography
              variant="h6"
              component="h4"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                flex: 1,
              }}
            >
              {resource.title}
            </Typography>
            {isExternal && (
              <OpenInNewIcon
                sx={{ fontSize: 18, color: 'primary.main', mt: 0.5 }}
                aria-label="Opens in new window"
              />
            )}
          </Box>
          {resource.description && (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {resource.description}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
