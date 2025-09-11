import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import * as monaco from 'monaco-editor';

import { 
  RuleProgram, 
  RuleProgramSchema, 
  RulesEngine, 
  SAMPLE_RULES, 
  getAllRuleNames 
} from '@itwin-dt/rules-cga-lite';

interface RuleEditorProps {
  onRuleApply?: (rule: RuleProgram) => Promise<void>;
  onRuleValidate?: (rule: RuleProgram) => Promise<boolean>;
  selectedGeometry?: any; // Selected geometry for rule application
  disabled?: boolean;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  executionTime?: number;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  onRuleApply,
  onRuleValidate,
  selectedGeometry,
  disabled = false
}) => {
  // State management
  const [currentRule, setCurrentRule] = useState<RuleProgram | null>(null);
  const [ruleText, setRuleText] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // Monaco editor ref
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Monaco editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // Configure Monaco for JSON editing
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: []
      });

      // Create editor
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: ruleText,
        language: 'json',
        theme: 'vs-light',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        contextmenu: true,
        readOnly: disabled
      });

      // Listen for content changes
      editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue() || '';
        setRuleText(value);
        validateRule(value);
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [disabled]);

  // Update editor content when rule text changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== ruleText) {
      editorRef.current.setValue(ruleText);
    }
  }, [ruleText]);

  // Load sample rule
  const loadSampleRule = useCallback((ruleName: string) => {
    const sampleRule = Object.values(SAMPLE_RULES).find(rule => rule.name === ruleName);
    if (sampleRule) {
      const ruleJson = JSON.stringify(sampleRule, null, 2);
      setRuleText(ruleJson);
      setCurrentRule(sampleRule);
      setSelectedSample(ruleName);
      setValidationError(null);
    }
  }, []);

  // Validate rule JSON
  const validateRule = useCallback((jsonText: string) => {
    if (!jsonText.trim()) {
      setValidationError(null);
      setCurrentRule(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const validated = RuleProgramSchema.parse(parsed);
      setCurrentRule(validated);
      setValidationError(null);
    } catch (error) {
      setCurrentRule(null);
      if (error instanceof SyntaxError) {
        setValidationError(`JSON Syntax Error: ${error.message}`);
      } else {
        setValidationError(`Validation Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, []);

  // Apply rule to selected geometry
  const applyRule = useCallback(async () => {
    if (!currentRule || !onRuleApply) return;

    setIsExecuting(true);
    try {
      await onRuleApply(currentRule);
      setExecutionResult({
        success: true,
        message: `Rule "${currentRule.name}" applied successfully`,
        executionTime: 150 // Mock execution time
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        message: `Failed to apply rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExecuting(false);
      setShowNotification(true);
    }
  }, [currentRule, onRuleApply]);

  // Validate rule with external validator
  const validateWithGeometry = useCallback(async () => {
    if (!currentRule || !onRuleValidate) return;

    setIsExecuting(true);
    try {
      const isValid = await onRuleValidate(currentRule);
      setExecutionResult({
        success: isValid,
        message: isValid ? 'Rule validation successful' : 'Rule validation failed'
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExecuting(false);
      setShowNotification(true);
    }
  }, [currentRule, onRuleValidate]);

  // Clear editor
  const clearEditor = useCallback(() => {
    setRuleText('');
    setCurrentRule(null);
    setSelectedSample('');
    setValidationError(null);
    setExecutionResult(null);
  }, []);

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CodeIcon color="primary" />
          <Typography variant="h6">CGA-lite Rule Editor</Typography>
        </Box>
        
        {/* Sample Rules Selector */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Load Sample Rule</InputLabel>
          <Select
            value={selectedSample}
            label="Load Sample Rule"
            onChange={(e) => loadSampleRule(e.target.value)}
            disabled={disabled}
          >
            <MenuItem value="">
              <em>Select a sample rule...</em>
            </MenuItem>
            {getAllRuleNames().map(name => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isExecuting ? <CircularProgress size={16} /> : <PlayIcon />}
            onClick={applyRule}
            disabled={disabled || !currentRule || !selectedGeometry || isExecuting}
            size="small"
          >
            Apply Rule
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={validateWithGeometry}
            disabled={disabled || !currentRule || isExecuting}
            size="small"
          >
            Validate
          </Button>
          
          <Tooltip title="Clear Editor">
            <IconButton onClick={clearEditor} disabled={disabled} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Validation Error */}
      {validationError && (
        <Alert severity="error" sx={{ m: 1 }}>
          {validationError}
        </Alert>
      )}
      
      {/* Monaco Editor Container */}
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          minHeight: 400,
          border: validationError ? '1px solid red' : '1px solid #ddd',
          borderRadius: 1,
          m: 1
        }}
      />
      
      {/* Rule Info */}
      {currentRule && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Rule: {currentRule.name}
          </Typography>
          {currentRule.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {currentRule.description}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Operations: {currentRule.rules.length} | 
            Attributes: {Object.keys(currentRule.attrs || {}).length}
          </Typography>
        </Box>
      )}
      
      {/* Status/Feedback */}
      {!selectedGeometry && (
        <Alert severity="info" sx={{ m: 1 }}>
          Select geometry in the viewer to apply rules
        </Alert>
      )}
      
      {/* Execution Result Notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={executionResult?.success ? 'success' : 'error'}
          variant="filled"
        >
          {executionResult?.message}
          {executionResult?.executionTime && (
            <Typography variant="caption" display="block">
              Execution time: {executionResult.executionTime}ms
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Paper>
  );
};