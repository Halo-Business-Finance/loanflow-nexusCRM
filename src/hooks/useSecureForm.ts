import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidationResult {
  valid: boolean;
  sanitized: string;
  errors: string[];
}

interface SecureFormOptions {
  maxLength?: number;
  allowHtml?: boolean;
}

export const useSecureForm = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateAndSanitize = useCallback(async (
    input: string,
    fieldType: 'text' | 'email' | 'phone' | 'numeric' = 'text',
    options: SecureFormOptions = {}
  ): Promise<ValidationResult> => {
    if (!input) {
      return { valid: false, sanitized: '', errors: ['Field is required'] };
    }

    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.rpc('validate_and_sanitize_input', {
        p_input: input,
        p_field_type: fieldType,
        p_max_length: options.maxLength || 255,
        p_allow_html: options.allowHtml || false
      });

      if (error) {
        console.error('Validation error:', error);
        return { valid: false, sanitized: input, errors: ['Validation failed'] };
      }

      const result = data as { valid: boolean; sanitized: string; errors: string[] };
      return {
        valid: result.valid,
        sanitized: result.sanitized,
        errors: result.errors || []
      };
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, sanitized: input, errors: ['Validation failed'] };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const sanitizeEmail = useCallback(async (email: string): Promise<ValidationResult> => {
    return validateAndSanitize(email, 'email', { maxLength: 254 });
  }, [validateAndSanitize]);

  const sanitizePhone = useCallback(async (phone: string): Promise<ValidationResult> => {
    return validateAndSanitize(phone, 'phone', { maxLength: 15 });
  }, [validateAndSanitize]);

  const sanitizeText = useCallback(async (text: string, maxLength = 255): Promise<ValidationResult> => {
    return validateAndSanitize(text, 'text', { maxLength, allowHtml: false });
  }, [validateAndSanitize]);

  const sanitizeNumeric = useCallback(async (value: string): Promise<ValidationResult> => {
    return validateAndSanitize(value, 'numeric');
  }, [validateAndSanitize]);

  const validateFormData = useCallback(async (formData: Record<string, any>): Promise<{
    isValid: boolean;
    sanitizedData: Record<string, any>;
    errors: Record<string, string[]>;
  }> => {
    const sanitizedData: Record<string, any> = {};
    const errors: Record<string, string[]> = {};
    let isValid = true;

    // Define field validation rules
    const fieldRules: Record<string, { type: 'text' | 'email' | 'phone' | 'numeric'; maxLength?: number; required?: boolean }> = {
      email: { type: 'email', maxLength: 254, required: true },
      phone: { type: 'phone', maxLength: 15 },
      name: { type: 'text', maxLength: 100, required: true },
      business_name: { type: 'text', maxLength: 255 },
      business_address: { type: 'text', maxLength: 500 },
      location: { type: 'text', maxLength: 255 },
      notes: { type: 'text', maxLength: 2000 },
      call_notes: { type: 'text', maxLength: 2000 },
      loan_amount: { type: 'numeric' },
      annual_revenue: { type: 'numeric' },
      credit_score: { type: 'numeric' }
    };

    for (const [field, value] of Object.entries(formData)) {
      if (value === null || value === undefined) {
        sanitizedData[field] = value;
        continue;
      }

      const rule = fieldRules[field];
      if (!rule) {
        // No specific rule, treat as text
        const result = await sanitizeText(String(value));
        sanitizedData[field] = result.sanitized;
        if (!result.valid) {
          errors[field] = result.errors;
          isValid = false;
        }
        continue;
      }

      if (rule.required && (!value || String(value).trim() === '')) {
        errors[field] = ['This field is required'];
        isValid = false;
        continue;
      }

      if (value && String(value).trim() !== '') {
        const result = await validateAndSanitize(
          String(value), 
          rule.type, 
          { maxLength: rule.maxLength }
        );
        
        sanitizedData[field] = result.sanitized;
        if (!result.valid) {
          errors[field] = result.errors;
          isValid = false;
        }
      } else {
        sanitizedData[field] = value;
      }
    }

    return { isValid, sanitizedData, errors };
  }, [validateAndSanitize, sanitizeText]);

  return {
    isValidating,
    validateAndSanitize,
    sanitizeEmail,
    sanitizePhone,
    sanitizeText,
    sanitizeNumeric,
    validateFormData
  };
};