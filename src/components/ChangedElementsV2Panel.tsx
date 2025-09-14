/**
 * Changed Elements v2 Panel Component
 * 
 * Real-time changeset comparison UI using iTwin Platform Changed Elements API v2.
 * Provides enhanced visual evidence and A/B scenario analysis with performance monitoring.
 * 
 * Features:
 * - Preflight validation UI
 * - Real-time changeset comparison
 * - Visual decorations management
 * - Jump-to-next-change navigation
 * - Deep linking support
 * - Performance metrics display
 * - Paginated results for large changesets
 * 
 * @see https://developer.bentley.com/tutorials/changed-elements-api-v2/
 */
import React, { useState, useEffect, useCallback } from 'react';
import { IModelConnection } from '@itwin/core-frontend';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Share as ShareIcon,
  Speed as SpeedIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import {
  changedElementsV2Service,
  ChangedElementsComparison,
  ChangedElement,
  PreflightValidation,
  ChangeVisualizationSettings
} from '../services/ChangedElementsV2Service';
import { getITwinPlatformConfig } from '../utils/env-validation';

interface ChangedElementsV2PanelProps {
  iModelConnection?: IModelConnection;
  onElementSelected?: (elementId: string) => void;
  onZoomToElement?: (elementId: string) => void;
  initialFromChangeset?: string;
  initialToChangeset?: string;
  className?: string;
}

interface ComparisonState {
  isLoading: boolean;
  comparison: ChangedElementsComparison | null;
  validation: PreflightValidation | null;
  error: string | null;
  currentElementIndex: number;
  visualizationsEnabled: boolean;
  showPerformanceMetrics: boolean;
}

/**
 * Changed Elements v2 Panel Component
 */
export const ChangedElementsV2Panel: React.FC<ChangedElementsV2PanelProps> = ({
  iModelConnection,
  onElementSelected,
  onZoomToElement,
  initialFromChangeset,
  initialToChangeset,
  className
}) => {
  const [fromChangeset, setFromChangeset] = useState(initialFromChangeset || '');
  const [toChangeset, setToChangeset] = useState(initialToChangeset || '');
  const [state, setState] = useState<ComparisonState>({
    isLoading: false,
    comparison: null,
    validation: null,
    error: null,
    currentElementIndex: 0,
    visualizationsEnabled: true,
    showPerformanceMetrics: true
  });
  const [visualSettings, setVisualSettings] = useState<ChangeVisualizationSettings>({
    insertColor: '#28a745',
    modifyColor: '#fd7e14',
    deleteColor: '#dc3545',
    highlightIntensity: 0.8,
    showLabels: true,
    autoZoom: true
  });
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const platformConfig = getITwinPlatformConfig();

  /**
   * Initialize service and handle deep links on mount
   */
  useEffect(() => {
    const initializeService = async () => {
      try {
        await changedElementsV2Service.initialize();
        
        // Check for deep link parameters
        const deepLinkParams = changedElementsV2Service.parseDeepLink();
        if (deepLinkParams.from && deepLinkParams.to) {
          setFromChangeset(deepLinkParams.from);
          setToChangeset(deepLinkParams.to);
          console.log('📎 Deep link detected:', deepLinkParams);
        }
      } catch (error) {
        console.error('Failed to initialize Changed Elements v2 service:', error);
        setState(prev => ({ 
          ...prev, 
          error: `Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }));
      }
    };

    initializeService();
  }, []);

  /**
   * Perform changeset comparison
   */
  const handleCompareChangesets = useCallback(async () => {
    if (!platformConfig) {
      setState(prev => ({ 
        ...prev, 
        error: 'iTwin platform not configured - check IMJS_ITWIN_ID and IMJS_IMODEL_ID' 
      }));
      return;
    }

    if (!fromChangeset || !toChangeset) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please enter both source and target changeset IDs' 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      comparison: null,
      validation: null,
      currentElementIndex: 0
    }));

    try {
      console.log('🔄 Starting changeset comparison');
      
      // Perform preflight validation
      const validation = await changedElementsV2Service.validateComparison(
        platformConfig.iTwinId,
        platformConfig.iModelId,
        fromChangeset,
        toChangeset
      );

      setState(prev => ({ ...prev, validation }));

      if (!validation.valid) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        }));
        return;
      }

      // Perform comparison
      const comparison = await changedElementsV2Service.compareChangesets({
        iTwinId: platformConfig.iTwinId,
        iModelId: platformConfig.iModelId,
        fromChangesetId: fromChangeset,
        toChangesetId: toChangeset,
        pageSize: 100 // Larger page size for better performance
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        comparison,
        error: null
      }));

      // Create visual decorations if enabled
      if (state.visualizationsEnabled && comparison.changedElements.length > 0) {
        const decorations = changedElementsV2Service.createVisualDecorations(
          comparison.changedElements,
          visualSettings
        );
        console.log('🎨 Applied visual decorations:', decorations.length);
      }

      console.log('✅ Changeset comparison completed successfully');

    } catch (error) {
      console.error('❌ Changeset comparison failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Comparison failed'
      }));
    }
  }, [fromChangeset, toChangeset, platformConfig, state.visualizationsEnabled, visualSettings]);

  /**
   * Navigate to next/previous changed element
   */
  const navigateToElement = useCallback((direction: 'next' | 'prev') => {
    if (!state.comparison?.changedElements.length) return;

    const maxIndex = state.comparison.changedElements.length - 1;
    let newIndex = state.currentElementIndex;

    if (direction === 'next') {
      newIndex = newIndex >= maxIndex ? 0 : newIndex + 1;
    } else {
      newIndex = newIndex <= 0 ? maxIndex : newIndex - 1;
    }

    setState(prev => ({ ...prev, currentElementIndex: newIndex }));

    const element = state.comparison.changedElements[newIndex];
    console.log(`🎯 Navigating to element ${newIndex + 1}/${state.comparison.changedElements.length}:`, element.elementId);

    // Notify parent components
    if (onElementSelected) {
      onElementSelected(element.elementId);
    }
    if (onZoomToElement && visualSettings.autoZoom) {
      onZoomToElement(element.elementId);
    }
  }, [state.comparison, state.currentElementIndex, onElementSelected, onZoomToElement, visualSettings.autoZoom]);

  /**
   * Generate and copy deep link
   */
  const handleShareDeepLink = useCallback(() => {
    if (!fromChangeset || !toChangeset) return;

    const deepLink = changedElementsV2Service.generateDeepLink(fromChangeset, toChangeset);
    navigator.clipboard.writeText(deepLink).then(() => {
      console.log('📎 Deep link copied to clipboard:', deepLink);
      // Could show a toast notification here
    });
  }, [fromChangeset, toChangeset]);

  /**
   * Stop current comparison
   */
  const handleStopComparison = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isLoading: false,
      error: 'Comparison cancelled by user'
    }));
  }, []);

  /**
   * Toggle visualizations
   */
  const handleToggleVisualizations = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, visualizationsEnabled: enabled }));
    console.log(`🎨 Visual decorations ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  /**
   * Get change type icon
   */
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'insert': return <AddIcon style={{ color: visualSettings.insertColor }} />;
      case 'modify': return <EditIcon style={{ color: visualSettings.modifyColor }} />;
      case 'delete': return <DeleteIcon style={{ color: visualSettings.deleteColor }} />;
      default: return <EditIcon />;
    }
  };

  /**
   * Format performance metrics
   */
  const formatPerformanceMetrics = (comparison: ChangedElementsComparison) => {
    return {
      'API Call': `${comparison.performance.apiCallTime.toFixed(1)}ms`,
      'Processing': `${comparison.performance.processTime.toFixed(1)}ms`,
      'Total Time': `${comparison.performance.totalTime.toFixed(1)}ms`,
      'Elements/sec': `${(comparison.totalChanges / (comparison.performance.totalTime / 1000)).toFixed(0)}`
    };
  };

  return (
    <Box className={`changed-elements-v2-panel ${className || ''}`}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔄 Changed Elements v2 Comparison
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time changeset comparison using iTwin Platform API v2
          </Typography>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="From Changeset ID"
              value={fromChangeset}
              onChange={(e) => setFromChangeset(e.target.value)}
              disabled={state.isLoading}
              size="small"
              fullWidth
              placeholder="changeset_abc123"
            />
            <TextField
              label="To Changeset ID"
              value={toChangeset}
              onChange={(e) => setToChangeset(e.target.value)}
              disabled={state.isLoading}
              size="small"
              fullWidth
              placeholder="changeset_def456"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleCompareChangesets}
              disabled={state.isLoading || !fromChangeset || !toChangeset}
              startIcon={state.isLoading ? <CircularProgress size={20} /> : <PlayIcon />}
            >
              {state.isLoading ? 'Comparing...' : 'Compare'}
            </Button>

            {state.isLoading && (
              <Button
                variant="outlined"
                onClick={handleStopComparison}
                startIcon={<StopIcon />}
                color="error"
              >
                Stop
              </Button>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={state.visualizationsEnabled}
                  onChange={(e) => handleToggleVisualizations(e.target.checked)}
                  size="small"
                />
              }
              label="Visual Decorations"
            />

            <Tooltip title="Share deep link">
              <IconButton
                onClick={handleShareDeepLink}
                disabled={!fromChangeset || !toChangeset}
                size="small"
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Visualization settings">
              <IconButton
                onClick={() => setShowSettingsDialog(true)}
                size="small"
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Preflight Validation */}
      {state.validation && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Preflight Validation
            </Typography>
            
            {state.validation.valid ? (
              <Alert severity="success" icon={<CheckIcon />}>
                Validation passed - ready for comparison
              </Alert>
            ) : (
              <Alert severity="error" icon={<WarningIcon />}>
                {state.validation.errors.join(', ')}
              </Alert>
            )}

            {state.validation.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {state.validation.warnings.join(', ')}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading Progress */}
      {state.isLoading && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <LinearProgress sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Comparing changesets using iTwin Platform API v2...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      {/* Comparison Results */}
      {state.comparison && (
        <>
          {/* Summary */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Comparison Summary
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AddIcon />}
                  label={`${state.comparison.insertCount} Inserts`}
                  color="success"
                  size="small"
                />
                <Chip
                  icon={<EditIcon />}
                  label={`${state.comparison.modifyCount} Modifies`}
                  color="warning"
                  size="small"
                />
                <Chip
                  icon={<DeleteIcon />}
                  label={`${state.comparison.deleteCount} Deletes`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`${state.comparison.totalChanges} Total`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Navigation */}
              {state.comparison.changedElements.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => navigateToElement('prev')} size="small">
                    <PrevIcon />
                  </IconButton>
                  
                  <Typography variant="body2">
                    {state.currentElementIndex + 1} of {state.comparison.changedElements.length}
                  </Typography>
                  
                  <IconButton onClick={() => navigateToElement('next')} size="small">
                    <NextIcon />
                  </IconButton>

                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                  <Typography variant="body2" color="text.secondary">
                    Current: {state.comparison.changedElements[state.currentElementIndex]?.elementId}
                  </Typography>
                </Box>
              )}

              {state.comparison.hasMoreChanges && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  More changes available - use pagination for complete results
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {state.showPerformanceMetrics && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Metrics
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {Object.entries(formatPerformanceMetrics(state.comparison)).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${value}`} variant="outlined" size="small" />
                  ))}
                </Box>

                {state.comparison.performance.totalTime > 5000 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    ⚠️ Slow comparison detected - consider using smaller page sizes or pagination
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Changed Elements List */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Changed Elements ({state.comparison.changedElements.length})
              </Typography>
              
              <List dense>
                {state.comparison.changedElements.slice(0, 20).map((element, index) => (
                  <ListItem
                    key={element.elementId}
                    button
                    selected={index === state.currentElementIndex}
                    onClick={() => {
                      setState(prev => ({ ...prev, currentElementIndex: index }));
                      if (onElementSelected) onElementSelected(element.elementId);
                    }}
                  >
                    <ListItemIcon>
                      {getChangeTypeIcon(element.changeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={element.elementId}
                      secondary={`${element.changeType} • ${element.classFullName || 'Unknown'}`}
                    />
                  </ListItem>
                ))}
                
                {state.comparison.changedElements.length > 20 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${state.comparison.changedElements.length - 20} more elements`}
                      secondary="Use navigation buttons to browse all changes"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Visualization Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={visualSettings.showLabels}
                  onChange={(e) => setVisualSettings(prev => ({ ...prev, showLabels: e.target.checked }))}
                />
              }
              label="Show element labels"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={visualSettings.autoZoom}
                  onChange={(e) => setVisualSettings(prev => ({ ...prev, autoZoom: e.target.checked }))}
                />
              }
              label="Auto-zoom to selected elements"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={state.showPerformanceMetrics}
                  onChange={(e) => setState(prev => ({ ...prev, showPerformanceMetrics: e.target.checked }))}
                />
              }
              label="Show performance metrics"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChangedElementsV2Panel;