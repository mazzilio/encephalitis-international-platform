/**
 * Landing Page Component
 * Welcome page with introduction, statistics, and disclaimer
 */

import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  AlertTitle,
  Divider,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoIcon from "@mui/icons-material/Info";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MainLayout from "../components/layout/MainLayout";
import {
  MEDICAL_DISCLAIMER,
  APP_ROUTES,
} from "../utils/constants";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(APP_ROUTES.roleSelection);
  };

  return (
    <MainLayout pageTitle="Welcome" maxWidth="md">
      {/* Logo */}
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <Link to={APP_ROUTES.home} style={{ textDecoration: 'none' }}>
          <img
            src="/assets/branding/encephalitis-logo.png"
            alt="Encephalitis International"
            style={{
              maxWidth: "280px",
              width: "100%",
              height: "auto",
              position: "relative",
              left: "-12px",
              cursor: "pointer"
            }}
          />
        </Link>
      </Box>

        <Box sx={{ textAlign: "center", py: { xs: 4, md: 6 } }}>
        
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            <FavoriteIcon sx={{ fontSize: 32, color: "error.main", marginRight: "8px" }} />
            Welcome
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 3,
            }}
          >
            
            <Typography
              variant="body1"
              component="p"
              sx={{ fontSize: "1.125rem", mb: 3 }}
            >
              We're here to support you on your journey. Let
              us help you find the right resources and information.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleGetStarted}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "1.125rem",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Get Started
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* How It Works Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          How It Works
        </Typography>

        <Stack spacing={3}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              1. Select Your Role
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tell us if you're a patient, caregiver, or healthcare professional
            </Typography>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              2. Answer a Few Questions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Share information about your current situation and needs
            </Typography>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              3. Get Personalized Guidance
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Receive tailored information, resources, and support
              recommendations
            </Typography>
          </Paper>
        </Stack>
      </Box>

      {/* Medical Disclaimer */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 4,
          borderRadius: 2,
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Medical Disclaimer</AlertTitle>
        <Typography variant="body2">{MEDICAL_DISCLAIMER}</Typography>
      </Alert>



      {/* CTA Section */}
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Ready to Get Started?
        </Typography>
        <Typography variant="body1" color="text.secondary" component="p" sx={{ mb: 2 }}>
          Get personalized information and support in just a few minutes
        </Typography>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={handleGetStarted}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: "1.125rem",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Get Started
        </Button>
      </Box>
    </MainLayout>
  );
}
