/**
 * Search Results Page
 * Displays personalized resources based on user's journey data
 */

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Paper,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";
import EmailIcon from "@mui/icons-material/Email";
import MainLayout from "../components/layout/MainLayout";
import { useUserJourney } from "../contexts/UserJourneyContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { APP_ROUTES, ENCEPHALITIS_INTERNATIONAL } from "../utils/constants";

export default function SearchResultsPage() {
  const { state } = useUserJourney();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const results = state.results;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Redirect if no results (safety fallback)
  useEffect(() => {
    if (!results) {
      console.log("SearchResultsPage: No results found, redirecting to home");
      navigate(APP_ROUTES.home);
    }
  }, [results, navigate]);

  // Show nothing while redirecting
  if (!results) {
    return null;
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Open Encephalitis International search in new tab
      const searchUrl = `${
        ENCEPHALITIS_INTERNATIONAL.website
      }?s=${encodeURIComponent(searchQuery)}`;
      window.open(searchUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSendEmail = () => {
    if (email.trim() && consentGiven) {
      // TODO: Implement actual email sending logic with API call
      console.log("Sending personalized resources to:", email);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000); // Reset after 5 seconds
    }
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendEmail();
    }
  };

  return (
    <MainLayout pageTitle="Your Personalised Resources" maxWidth="lg">
      <Container maxWidth="md">
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <RouterLink to={APP_ROUTES.home} style={{ textDecoration: 'none' }}>
            <img
              src="/assets/branding/encephalitis-logo.png"
              alt="Encephalitis International"
              style={{
                maxWidth: "280px",
                width: "100%",
                height: "auto",
                position: "relative",
                left: "-12px",
                marginTop: "20px",
                cursor: "pointer"
              }}
            />
          </RouterLink>
        </Box>
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(118, 193, 175, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, color: "#76c1af" }} />
          </Box>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.5rem" },
              mb: 2,
            }}
          >
            Your Personalised Resources
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: "1.125rem",
              maxWidth: "700px",
              mx: "auto",
              lineHeight: 1.7,
            }}
          >
            We know this is a frightening time. You're not alone, and there is
            hope. Here are resources to help you through this acute phase.
          </Typography>
        </Box>

        {/* Additional sections from API if available */}
        {results.sections && results.sections.length > 0 && (
          <Box sx={{ mb: 6 }}>
            
            {results.sections.slice(0, 2).map((section, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.content}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Recommended Resources Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, mb: 4 }}
          >
            Recommended for You
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            

            {/* Dynamic Resources from API */}
            {results.resources &&
              results.resources.slice(0, 10).map((resource, index) => (
                <Box key={index}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          bgcolor: "rgba(118, 193, 175, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 28, color: "#76c1af" }} />
                      </Box>

                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {resource.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, minHeight: 48 }}
                      >
                        {resource.description ||
                          "Helpful information and guidance"}
                      </Typography>

                      <Button
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        View Resource
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}

            {/* If no resources from API, show default cards */}
            {(!results.resources || results.resources.length === 0) && (
              <>
                <Box>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          bgcolor: "rgba(118, 193, 175, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 28, color: "#76c1af" }} />
                      </Box>

                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        Effects of Encephalitis
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, minHeight: 48 }}
                      >
                        Understanding potential effects and what to expect
                      </Typography>

                      <Button
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        href={`${ENCEPHALITIS_INTERNATIONAL.website}effects-of-encephalitis`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        View Resource
                      </Button>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          bgcolor: "rgba(118, 193, 175, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 28, color: "#76c1af" }} />
                      </Box>

                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        Infectious Encephalitis
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, minHeight: 48 }}
                      >
                        Detailed information about virus and bacteria-caused
                        encephalitis
                      </Typography>

                      <Button
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        href={`${ENCEPHALITIS_INTERNATIONAL.website}infectious-encephalitis`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        View Resource
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </>
            )}
          </Box>
        </Box>

        

        {/* Search Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 6,
            bgcolor: "white",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <SearchIcon sx={{ color: "#76c1af", mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Search for More Resources
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Looking for something specific? Search the Encephalitis
            International website for more information.
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter keywords (e.g., memory, fatigue, rehabilitation)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              variant="outlined"
              sx={{
                bgcolor: "white",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{
                minWidth: 120,
                px: 3,
                borderRadius: 2,
              }}
            >
              Search
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5 }}
          >
            This will search encephalitis.info in a new tab
          </Typography>
        </Paper>

        {/* Need More Help Section */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            mb: 6,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 600, mb: 1 }}
            >
              Need More Help?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Save your resources or contact our support team for guidance.
            </Typography>
          </Box>

          {/* Consent Checkbox */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 4,
              px: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  sx={{ mr: 1 }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I consent to Encephalitis International storing my personal
                  information in accordance with the{" "}
                  <Link
                    href={`${ENCEPHALITIS_INTERNATIONAL.website}privacy-policy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    Privacy Policy
                  </Link>
                </Typography>
              }
            />
          </Box>

          {/* Email Resources Section */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", mb: 2, fontWeight: 500 }}
            >
              Send your personalised resources to your email:
            </Typography>

            {emailSent && (
              <Alert
                severity="success"
                sx={{ mb: 2, maxWidth: 600, mx: "auto" }}
              >
                Resources sent successfully! Please check your email.
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              <TextField
                fullWidth
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleEmailKeyPress}
                disabled={!consentGiven}
                type="email"
                variant="outlined"
                sx={{
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendEmail}
                disabled={!consentGiven || !email.trim()}
                startIcon={<SendIcon />}
                sx={{
                  minWidth: 120,
                  px: 3,
                  borderRadius: 2,
                }}
              >
                Send
              </Button>
            </Box>
          </Box>

          {/* Contact Support Section */}
          <Box>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", mb: 2, fontWeight: 500 }}
            >
              Or speak directly with our support team:
            </Typography>

            {!consentGiven && (
              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  mb: 3,
                  color: "error.main",
                  fontWeight: 500,
                }}
              >
                Please tick the consent checkbox above to enable contact options
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
                mb: 3,
              }}
            >
              <Button
                variant="contained"
                startIcon={<PhoneIcon />}
                href={`tel:${ENCEPHALITIS_INTERNATIONAL.helpline.replace(
                  /\s/g,
                  ""
                )}`}
                disabled={!consentGiven}
                sx={{
                  minWidth: 180,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Call Our Helpline
              </Button>

              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                href={`mailto:${ENCEPHALITIS_INTERNATIONAL.email}`}
                disabled={!consentGiven}
                sx={{
                  minWidth: 180,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Email Us
              </Button>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              Helpline: {ENCEPHALITIS_INTERNATIONAL.helpline} (Monday-Friday,
              9am-5pm GMT)
            </Typography>
          </Box>
        </Paper>

        {/* Start Over Button */}
        <Box sx={{ textAlign: "center", mt: 6, mb: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(APP_ROUTES.roleSelection)}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
            }}
          >
            Start New Search
          </Button>
        </Box>
      </Container>
    </MainLayout>
  );
}
