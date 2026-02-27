/**
 * Emergency Banner Component
 * Displays emergency contact information prominently at the top of the page
 */

import { Alert, AlertTitle, Box, Link, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import { useState } from "react";
import {
  ENCEPHALITIS_INTERNATIONAL,
  EMERGENCY_MESSAGE,
} from "../../utils/constants";

interface EmergencyBannerProps {
  dismissible?: boolean;
}

export default function EmergencyBanner({
  dismissible = false,
}: EmergencyBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Alert
      severity="error"
      icon={false}
      sx={{
        borderRadius: 0,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { sm: "center" },
      }}
      action={
        dismissible ? (
          <IconButton
            aria-label="close emergency banner"
            color="inherit"
            size="small"
            onClick={() => setVisible(false)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ) : undefined
      }
    >
      <Box>
        <AlertTitle sx={{ fontWeight: 600, mb: 1 }}>
          Emergency Support
        </AlertTitle>
        <Box sx={{ flex: 1 }}>{EMERGENCY_MESSAGE}</Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { sm: "center" },
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}
        >
          <Link
            href={`tel:${ENCEPHALITIS_INTERNATIONAL.helpline.replace(
              /\s/g,
              ""
            )}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "inherit",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            <PhoneIcon fontSize="small" />
            {ENCEPHALITIS_INTERNATIONAL.helpline}
          </Link>
          <Link
            href={`mailto:${ENCEPHALITIS_INTERNATIONAL.email}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "inherit",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            <EmailIcon fontSize="small" />
            {ENCEPHALITIS_INTERNATIONAL.email}
          </Link>
        </Box>
      </Box>
    </Alert>
  );
}
